/* eslint test/no-import-node-test: off */
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { execFileSync, spawn } from 'node:child_process'
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { createServer, request } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { after, it } from 'node:test'
import sharp from 'sharp'

const workspace = await realpath(await mkdtemp(path.join(os.tmpdir(), 'stardust-admin-test-')))
process.env.STARDUST_ROOT = workspace
// Isolated local Git/PicGo fixtures must not inherit the production credential gate.
process.env.STARDUST_CONTAINER = '0'
// Mock PicGo reads the isolated fixture directory, including inside Compose.
process.env.STARDUST_PICGO_HOST_ROOT = workspace
const { getAlbum, getPost, savePost, saveAlbum, importPhoto, importLiveVideo, addPhotoLink, listBackups, restoreBackup, StoreError } = await import('../scripts/admin/store')
const { safePath } = await import('../scripts/admin/paths')
const { changes, isPublishing, managedPath, publishStatus, retryPush, startPublish } = await import('../scripts/admin/publish')
const { contentStatus, isPublic } = await import('../src/utils/visibility')
const { postSlug } = await import('../scripts/admin/post-slug')
const { picgoStatus } = await import('../scripts/admin/picgo')
const { getLocalizedPath, getNextLangPath } = await import('../src/i18n/path')
const { localSiteStatus, initializeLocalSite, startLocalPublish, isLocalPublishing } = await import('../scripts/admin/local-site')
const git = (...args: string[]) => execFileSync('git', args, { cwd: workspace, encoding: 'utf8' })
const post = (title: string, extra = '') => `---\ntitle: ${title}\npublished: 2026-10-02\ndraft: true\n${extra}---\n正文\n`
await mkdir(path.join(workspace, 'src/content/posts'), { recursive: true })
await mkdir(path.join(workspace, 'src/content/albums'), { recursive: true })
git('init', '-b', 'main')
git('config', 'user.name', 'Local Test')
git('config', 'user.email', 'test@localhost')
await writeFile(path.join(workspace, 'README.md'), 'Fixture\n')
git('add', 'README.md')
git('commit', '-m', 'fixture')
after(async () => {
  await rm(workspace, { recursive: true, force: true })
})
it('legacy article states remain public; drafts and hidden items are excluded', () => {
  assert.equal(contentStatus({}), 'public')
  assert.equal(contentStatus({ hidden: true }), 'hidden')
  assert.equal(contentStatus({ draft: true, hidden: true }), 'draft')
  assert.equal(isPublic({ hidden: true }), false)
  assert.equal(isPublic({ draft: true }), false)
})
it('private preview URLs match Astro slug generation for nested Chinese paths', () => {
  assert.equal(postSlug('Golang/0 基础/我的文章.md', {}), 'golang/0-基础/我的文章')
  assert.equal(postSlug('生活/index.md', {}), '生活')
  assert.equal(postSlug('any.md', { abbrlink: 'custom-link' }), 'custom-link')
})
it('language and feed URLs preserve the page path and do not append a slash to XML files', () => {
  assert.equal(getLocalizedPath('/atom.xml', 'zh'), '/atom.xml')
  assert.equal(getLocalizedPath('/rss.xml', 'en'), '/en/rss.xml')
  assert.equal(getNextLangPath('/en/gallery/travel/', 'en', 'zh'), '/gallery/travel/')
  assert.equal(getNextLangPath('/tags/Golang/', 'zh', 'en'), '/en/tags/Golang/')
})

it('saving preserves body, comments, unknown YAML fields and CRLF; rejects stale versions', async () => {
  const id = 'preserve.mdx'
  const raw = `${post('原始标题', '# 保留注释\ncustom:\n  nested: [one, two]\n').replace(/\n/g, '\r\n')}\r\n<Component value="test" />\r\n`
  await writeFile(path.join(workspace, 'src/content/posts', id), raw)
  const original = await getPost(id)
  const updated = await savePost({ id, version: original.version, data: { title: '更新标题', hidden: true }, body: original.body })
  const saved = await readFile(path.join(workspace, 'src/content/posts', id), 'utf8')
  assert.equal(updated.status, 'draft')
  assert.equal(updated.body, original.body)
  assert.match(saved, /# 保留注释\r\ncustom:\r\n {2}nested: \[one, two\]/)
  assert.ok(!saved.replace(/\r\n/g, '').includes('\n'))
  await assert.rejects(savePost({ id, version: original.version, data: { title: '陈旧写入' }, body: original.body }), (error: unknown) => error instanceof StoreError && error.status === 409)
  assert.equal((await getPost(id)).data.title, '更新标题')
  const backups = await listBackups()
  const backup = backups.find(value => value.path.endsWith(id))!
  assert.ok(backup)
  await assert.rejects(restoreBackup(backup.id, original.version), /其他编辑器修改/)
  await restoreBackup(backup.id, updated.version)
  assert.equal(await readFile(path.join(workspace, 'src/content/posts', id), 'utf8'), raw)
  const timed = post('带时区日期').replace('2026-10-02', '2026-10-02T01:20:00+08:00')
  await writeFile(path.join(workspace, 'src/content/posts/timed.md'), timed)
  const withTime = await getPost('timed.md')
  assert.equal(withTime.data.published, '2026-10-02T01:20:00+08:00')
  await savePost({ id: withTime.id, version: withTime.version, data: { published: '2026-10-02', title: '仅更新标题' }, body: withTime.body })
  assert.match(await readFile(path.join(workspace, 'src/content/posts/timed.md'), 'utf8'), /published: 2026-10-02T01:20:00\+08:00/)
})
it('duplicate article URLs and invalid metadata fail without overwriting files', async () => {
  await writeFile(path.join(workspace, 'src/content/posts/a.md'), post('A', 'abbrlink: same\n'))
  await assert.rejects(savePost({ id: 'b.md', version: '', data: { title: 'B', published: '2026-10-02', abbrlink: 'same' }, body: 'B' }), /短链接已/)
  await assert.rejects(savePost({ id: 'b.md', version: '', data: { title: 'B', published: 'invalid' }, body: 'B' }))
})
it('filesystem access rejects traversal and symlinks, including non-existing descendants', async () => {
  await assert.rejects(safePath('src/content/posts', '../README.md'))
  await assert.rejects(safePath('src/content/posts', '/etc/passwd'))
  await symlink(workspace, path.join(workspace, 'src/content/posts/link'))
  await assert.rejects(safePath('src/content/posts', 'link/new.md'), /符号链接/)
  await rm(path.join(workspace, 'src/content/posts/link'))
})
it('PicGo photo import sanitizes pixels and stores only the remote URL; cleans up on success and failure', async () => {
  let uploaded: Buffer | undefined
  let requests = 0
  let fail = false
  let badURL = false
  const server = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    if (req.url === '/heartbeat') {
      res.end(JSON.stringify({ success: true, result: 'alive' }))
      return
    }
    const chunks = []
    for await (const chunk of req)
      chunks.push(chunk)
    const input = JSON.parse(Buffer.concat(chunks).toString())
    assert.equal(input.list.length, 1)
    assert.ok(input.list[0].startsWith(path.join(workspace, '.local/picgo-uploads')))
    uploaded = await readFile(input.list[0])
    requests++
    res.end(JSON.stringify(fail ? { success: false } : { success: true, result: [badURL ? 'file:///etc/passwd' : 'https://photos.example.cos.ap-shanghai.myqcloud.com/photo.webp'] }))
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as { port: number }).port
  const previous = process.env.STARDUST_PICGO_URL
  process.env.STARDUST_PICGO_URL = `http://127.0.0.1:${port}`
  try {
    assert.equal((await picgoStatus()).available, true)
    let album = await saveAlbum({ id: 'test-album', version: '', data: { slug: 'test-album', title: '测试相册', published: '2026-10-02', description: '', tags: [], lang: '', order: 0, cover: '', draft: true, hidden: false, photos: [] } })
    const image = await sharp({ create: { width: 900, height: 600, channels: 3, background: '#729579' } }).jpeg().withExif({ IFD0: { Make: 'Apple', Model: 'iPhone 16' }, IFD2: { FNumber: '28/10', ExposureTime: '1/125', ISOSpeedRatings: '200', ExposureBiasValue: '1/3', FocalLength: '50/1', LensModel: 'Test Lens', DateTimeOriginal: '2026:09:30 12:34:56' } }).withMetadata({ orientation: 6 }).toBuffer()
    album = await importPhoto({ id: album.id, version: album.version, name: '照片.jpg', image: image.toString('base64') })
    assert.equal(album.data.photos.length, 1)
    assert.equal(album.data.cover, album.data.photos[0].id)
    assert.match(album.data.photos[0].src, /^https:/)
    const metadata = await sharp(uploaded!).metadata()
    assert.equal(metadata.width, 600)
    assert.equal(metadata.height, 900)
    assert.equal(metadata.exif, undefined)
    assert.equal(album.data.photos[0].width, 600)
    assert.equal(album.data.photos[0].height, 900)
    assert.deepEqual(album.data.photos[0].metadata, { camera: 'Apple iPhone 16', lens: 'Test Lens', focalLength: '50 mm', aperture: 'ƒ/2.8', shutter: '1/125 s', iso: 'ISO 200', exposure: '+0.33 EV' })
    assert.equal(album.data.photos[0].taken, '2026-09-30')
    assert.deepEqual(await readdir(path.join(workspace, '.local/picgo-uploads')), [])
    await assert.rejects(stat(path.join(workspace, 'src/assets/gallery')), { code: 'ENOENT' })
    await assert.rejects(importPhoto({ id: album.id, version: '', name: 'x.jpg', image: image.toString('base64') }), /相册已被修改/)
    assert.equal(requests, 1, 'stale requests do not upload')
    fail = true
    await assert.rejects(importPhoto({ id: album.id, version: album.version, name: 'x.jpg', image: image.toString('base64') }), /PicGo 上传失败/)
    assert.equal((await getAlbum(album.id)).version, album.version)
    assert.deepEqual(await readdir(path.join(workspace, '.local/picgo-uploads')), [])
    fail = false
    badURL = true
    await assert.rejects(importPhoto({ id: album.id, version: album.version, name: 'x.jpg', image: image.toString('base64') }), /HTTPS 图片链接/)
    assert.deepEqual(await readdir(path.join(workspace, '.local/picgo-uploads')), [])
    await assert.rejects(saveAlbum({ id: album.id, version: album.version, data: { ...album.data, photos: [album.data.photos[0], album.data.photos[0]] } }), /照片标识不能重复/)
  }
  finally {
    if (previous === undefined)
      delete process.env.STARDUST_PICGO_URL
    else
      process.env.STARDUST_PICGO_URL = previous
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
})
it('existing COS links can be added without uploading or downloading image bytes; rejects local paths and unsafe URLs', async () => {
  let album = await getAlbum('test-album')
  for (const src of ['album/a.webp', 'data:image/png;base64,YQ==', 'http://example.com/a.jpg', 'https://user:secret@example.com/a.jpg', 'not-a-url'])
    await assert.rejects(addPhotoLink({ id: album.id, version: album.version, src, title: '' }))
  const added = await addPhotoLink({ id: album.id, version: album.version, src: 'https://cdn.example.com/existing.jpg', title: '已有图片' })
  assert.equal(added.data.photos.length, album.data.photos.length + 1)
  assert.equal(added.data.photos.at(-1)!.src, 'https://cdn.example.com/existing.jpg')
  await assert.rejects(addPhotoLink({ id: album.id, version: album.version, src: 'https://cdn.example.com/new.jpg', title: '' }), /相册已被修改/)
  album = await getAlbum('test-album')
  assert.equal(album.version, added.version)
})
it('publish review tracks actual bytes and refuses stale reviews or uncommitted code', async () => {
  const initial = await changes()
  assert.ok(initial.files.some(file => file.path.endsWith('a.md') && file.managed))
  await writeFile(path.join(workspace, 'src/content/posts/a.md'), post('Changed', 'abbrlink: same\n'))
  const next = await changes()
  assert.notEqual(next.revision, initial.revision)
  await assert.rejects(startPublish({ paths: initial.files.filter(file => file.managed).map(file => file.path), revision: initial.revision, message: 'test' }), /文件已变化/)
  await writeFile(path.join(workspace, 'feature.ts'), 'export {}\n')
  const code = await changes()
  await assert.rejects(startPublish({ paths: code.files.filter(file => file.managed).map(file => file.path), revision: code.revision, message: 'test' }), /功能代码/)
  assert.equal(managedPath('src/content/albums/test-album.json'), true)
  assert.equal(managedPath('src/content/posts/photo.png'), false)
  assert.equal(managedPath(`src/assets/gallery/test-album/${'a'.repeat(64)}.webp`), false)
  assert.equal(managedPath('src/content/posts/../../.env.md'), false)
  assert.equal(managedPath('.local/backups/a.json'), false)
  assert.equal(managedPath('src/config.ts'), false)
})
it('hTTP manager requires a loopback Host, cookie and CSRF token; rejects cross-origin writes', async () => {
  const port = 14310
  const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/admin/server.ts'], { cwd: path.resolve(import.meta.dirname, '..'), env: { ...process.env, STARDUST_ADMIN_PORT: String(port), STARDUST_PREVIEW_PORT: '14322' }, stdio: ['ignore', 'pipe', 'pipe'] })
  try {
    let ready = false
    for (let n = 0; n < 50; n++) {
      try {
        if ((await fetch(`http://127.0.0.1:${port}/`)).ok) {
          ready = true
          break
        }
      }
      catch {

      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.ok(ready, 'HTTP server started')
    const home = await fetch(`http://127.0.0.1:${port}/`)
    const cookie = home.headers.get('set-cookie')!.split(';')[0]
    const csrf = /name="admin-token" content="([^"]+)"/.exec(await home.text())![1]
    const url = `http://127.0.0.1:${port}/api/posts`
    assert.equal((await fetch(url)).status, 401)
    assert.equal((await fetch(url, { headers: { cookie } })).status, 403)
    const valid = await fetch(url, { headers: { cookie, 'x-csrf-token': csrf } })
    assert.equal(valid.status, 200)
    assert.ok((await valid.json()).length > 0)
    const blocked = await fetch(`http://127.0.0.1:${port}/api/post`, { method: 'POST', headers: { cookie, 'x-csrf-token': csrf, 'content-type': 'application/json', 'origin': 'https://attacker.example' }, body: '{}' })
    assert.equal(blocked.status, 403)
    const hostileHost = await new Promise<number | undefined>((resolve, reject) => {
      const req = request(`http://127.0.0.1:${port}/api/posts`, { headers: { 'host': `evil.example:${port}`, cookie, 'x-csrf-token': csrf } }, (response) => {
        response.resume()
        resolve(response.statusCode)
      })
      req.on('error', reject)
      req.end()
    })
    assert.equal(hostileHost, 403)
  }
  finally {
    child.kill('SIGTERM')
    await new Promise(resolve => child.once('exit', resolve))
  }
})

it('publishing builds before committing, preserves failed pushes for retry, and rejects edits during build', async () => {
  const remote = path.join(workspace, '.local/remote.git')
  await mkdir(path.dirname(remote), { recursive: true })
  execFileSync('git', ['init', '--bare', remote], { stdio: 'ignore' })
  await rm(path.join(workspace, 'feature.ts'))
  await writeFile(path.join(workspace, '.gitignore'), '.local/\n')
  async function setBuild(code: string) {
    await writeFile(path.join(workspace, 'package.json'), JSON.stringify({ name: 'publish-fixture', scripts: { build: `node -e ${JSON.stringify(code)}` } }))
    git('add', '.')
    git('commit', '-m', 'test build fixture')
    git('push', 'origin', 'main')
  }
  git('add', '.')
  git('commit', '-m', 'test content baseline')
  git('remote', 'add', 'origin', remote)
  git('push', '-u', 'origin', 'main')
  async function begin() {
    const review = await changes()
    await startPublish({ paths: review.files.filter(file => file.managed).map(file => file.path), revision: review.revision, message: 'publish test' })
    for (let attempt = 0; attempt < 300 && isPublishing(); attempt++)
      await new Promise(resolve => setTimeout(resolve, 50))
    assert.equal(isPublishing(), false, 'publish finished')
    return publishStatus()
  }
  const file = path.join(workspace, 'src/content/posts/a.md')
  await setBuild('process.exit(1)')
  const originalHead = git('rev-parse', 'HEAD').trim()
  await writeFile(file, post('Build should fail'))
  const failed = await begin()
  assert.equal(failed.phase, 'failed')
  assert.equal(failed.commit, undefined)
  assert.equal(git('rev-parse', 'HEAD').trim(), originalHead)
  assert.equal(git('rev-parse', 'origin/main').trim(), originalHead)

  await setBuild('console.log("BUILD_VERIFIED")')
  const hook = path.join(remote, 'hooks/pre-receive')
  await writeFile(hook, '#!/bin/sh\nexit 1\n', { mode: 0o755 })
  await writeFile(file, post('Push can retry'))
  const rejected = await begin()
  assert.equal(rejected.phase, 'failed')
  assert.ok(rejected.commit)
  assert.equal(rejected.canRetryPush, true)
  assert.match(rejected.logs, /BUILD_VERIFIED/)
  assert.notEqual(rejected.commit, git('rev-parse', 'origin/main').trim())
  await rm(hook)
  await retryPush()
  for (let attempt = 0; attempt < 100 && isPublishing(); attempt++)
    await new Promise(resolve => setTimeout(resolve, 50))
  const pushed = await publishStatus()
  assert.equal(pushed.pushed, true)
  assert.equal(pushed.canRetryPush, false)
  assert.equal(git('rev-parse', 'origin/main').trim(), rejected.commit)
  await assert.rejects(retryPush(), /没有可重试/)

  await setBuild('require(\'node:fs\').appendFileSync(\'src/content/posts/a.md\', \'changed during build\')')
  const beforeRace = git('rev-parse', 'HEAD').trim()
  await writeFile(file, post('Review then change'))
  const race = await begin()
  assert.equal(race.phase, 'failed')
  assert.match(race.error!, /内容发生变化/)
  assert.equal(git('rev-parse', 'HEAD').trim(), beforeRace)
  assert.equal(git('rev-parse', 'origin/main').trim(), beforeRace)
})

it('local publishing replaces a complete release atomically and preserves the previous site on build failure', async () => {
  const initial = path.join(workspace, 'seed')
  await mkdir(initial)
  await writeFile(path.join(initial, 'index.html'), 'previous complete site')
  await writeFile(path.join(initial, 'article.html'), 'original article')
  await initializeLocalSite(initial)
  const current = path.join(workspace, '.local/site/current/index.html')
  const previousSetting = process.env.STARDUST_LOCAL_SITE
  process.env.STARDUST_LOCAL_SITE = '1'
  async function awaitLocal() {
    for (let attempt = 0; attempt < 200 && isLocalPublishing(); attempt++)
      await new Promise(resolve => setTimeout(resolve, 30))
    assert.equal(isLocalPublishing(), false)
    return localSiteStatus()
  }
  try {
    await writeFile(path.join(workspace, 'package.json'), JSON.stringify({ scripts: { build: 'node -e "process.exit(1)"' } }))
    await startLocalPublish()
    await assert.rejects(startLocalPublish(), /已有发布任务/)
    assert.equal((await awaitLocal()).phase, 'failed')
    assert.equal(await readFile(current, 'utf8'), 'previous complete site')
    const build = 'const fs=require(\'node:fs\');fs.mkdirSync(\'dist\',{recursive:true});fs.writeFileSync(\'dist/index.html\',\'new complete site\')'
    await writeFile(path.join(workspace, 'package.json'), JSON.stringify({ scripts: { build: `node -e ${JSON.stringify(build)}` } }))
    await startLocalPublish()
    assert.equal((await awaitLocal()).phase, 'complete')
    assert.equal(await readFile(current, 'utf8'), 'new complete site')
    await initializeLocalSite(initial)
    assert.equal(await readFile(current, 'utf8'), 'new complete site', 'restart preserves the newer local publication')
    await writeFile(path.join(initial, 'article.html'), 'updated article')
    await initializeLocalSite(initial)
    assert.equal(await readFile(path.join(workspace, '.local/site/current/article.html'), 'utf8'), 'updated article', 'image rebuild detects changes outside the home page')
  }
  finally {
    if (previousSetting === undefined)
      delete process.env.STARDUST_LOCAL_SITE
    else
      process.env.STARDUST_LOCAL_SITE = previousSetting
  }
})

it('Live imports transcode MOV to H264 MP4, keep only HTTPS links, and clean transient files', async () => {
  const movie = path.join(workspace, '.local/live-fixture.mov')
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc=size=128x96:rate=10', '-t', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', movie])
  const video = (await readFile(movie)).toString('base64')
  let requests = 0
  let fail = false
  const server = createServer(async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const upload = JSON.parse(Buffer.concat(chunks).toString())
    assert.match(upload.list[0], /\.mp4$/)
    const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', upload.list[0]], { encoding: 'utf8' }))
    assert.equal(probe.streams[0].codec_name, 'h264')
    assert.equal(probe.streams[0].pix_fmt, 'yuv420p')
    requests++
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(fail ? { success: false } : { success: true, result: ['https://cdn.example.com/live.mp4'] }))
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const previous = process.env.STARDUST_PICGO_URL
  process.env.STARDUST_PICGO_URL = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  try {
    let album = await getAlbum('test-album')
    const photoId = album.data.photos[0].id
    await assert.rejects(importLiveVideo({ id: album.id, version: '', photoId, video }), /相册已被修改/)
    await assert.rejects(importLiveVideo({ id: album.id, version: album.version, photoId: 'missing', video }), /照片不存在/)
    assert.equal(requests, 0)
    album = await importLiveVideo({ id: album.id, version: album.version, photoId, video })
    assert.equal(album.data.photos[0].live, 'https://cdn.example.com/live.mp4')
    assert.equal(album.data.photos[0].metadata?.camera, 'Apple iPhone 16')
    assert.deepEqual(await readdir(path.join(workspace, '.local/picgo-uploads')), [])
    assert.deepEqual(await readdir(path.join(workspace, '.local/media-tmp')), [])
    fail = true
    await assert.rejects(importLiveVideo({ id: album.id, version: album.version, photoId, video }), /PicGo 上传失败/)
    assert.equal((await getAlbum(album.id)).version, album.version)
    assert.deepEqual(await readdir(path.join(workspace, '.local/picgo-uploads')), [])
    assert.deepEqual(await readdir(path.join(workspace, '.local/media-tmp')), [])
    await assert.rejects(importLiveVideo({ id: album.id, version: album.version, photoId, video: Buffer.from('invalid media').toString('base64') }), /MOV 或 MP4/)
    await assert.rejects(saveAlbum({ id: album.id, version: album.version, data: { ...album.data, photos: [{ ...album.data.photos[0], live: 'javascript:alert(1)' }] } }))
  }
  finally {
    if (previous === undefined)
      delete process.env.STARDUST_PICGO_URL
    else process.env.STARDUST_PICGO_URL = previous
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
})

it('photo directives retain escaped metadata and reject unsafe image / Live URLs', async () => {
  const { remarkPhotoDirective } = await import('../src/plugins/remark-photo-directive.mjs')
  const node: any = { type: 'leafDirective', name: 'photo', attributes: { src: 'https://cdn.example.com/p.jpg', title: '相机 <script> & "引号"', camera: 'Apple iPhone', live: 'https://cdn.example.com/live.mp4' }, children: [] }
  const tree = { type: 'root', children: [node] }
  remarkPhotoDirective()(tree)
  assert.equal(node.data.hName, 'figure')
  assert.equal(node.children[0].data.hProperties['data-title'], '相机 <script> & "引号"')
  assert.equal(node.children[0].data.hProperties['data-live'], 'https://cdn.example.com/live.mp4')
  assert.equal(node.children[0].data.hProperties['data-metadata'], '{"camera":"Apple iPhone"}')
  for (const attributes of [{ src: 'file:///etc/passwd' }, { src: 'https://cdn.example.com/p.jpg', live: 'javascript:alert(1)' }])
    assert.throws(() => remarkPhotoDirective()({ type: 'root', children: [{ type: 'leafDirective', name: 'photo', attributes }] }))
})

it('media library deduplicates article and album URLs, preserves Live and metadata, and ignores code examples', async () => {
  const { mediaLibrary } = await import('../scripts/admin/library')
  const album = await getAlbum('test-album')
  const photo = album.data.photos[0]
  await writeFile(path.join(workspace, 'src/content/posts/media-library.md'), `${post('媒体复用')}![相同图片](${photo.src})\n\n::photo{src="${photo.src}" title="照片 &quot;一&quot;" live="${photo.live}" camera="测试相机"}\n\n\`\`\`markdown\n![只是示例](https://cdn.example.com/not-a-resource.jpg)\n\`\`\`\n\n![无效](javascript:alert)\n`)
  const library = await mediaLibrary()
  const rows = library.filter(entry => entry.src === photo.src)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].live, photo.live)
  assert.equal(rows[0].metadata?.camera, photo.metadata?.camera)
  assert.ok(rows[0].uses.some(use => use.kind === 'album' && use.id === album.id))
  assert.ok(rows[0].uses.some(use => use.kind === 'post' && use.id === 'media-library.md'))
  assert.ok(!library.some(entry => entry.src.endsWith('not-a-resource.jpg')))
  assert.ok(library.every(entry => entry.src.startsWith('https:')))
})

it('Live trimming exports only the selected H264 segment and rejects invalid ranges before uploading', async () => {
  const { convertLiveVideo } = await import('../scripts/admin/media')
  const movie = path.join(workspace, '.local/long-live.mov')
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=green:size=64x64:rate=10', '-t', '36', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', movie])
  const video = (await readFile(movie)).toString('base64')
  await assert.rejects(convertLiveVideo(video), /请先截取/)
  for (const clip of [{ start: -1, end: 2 }, { start: 4, end: 3 }, { start: 0, end: 31 }, { start: 0 }, { start: Number.NaN, end: 1 }])
    await assert.rejects(convertLiveVideo(video, clip), /起止时间/)
  await assert.rejects(convertLiveVideo(video, { start: 35, end: 38 }), /超出了/)
  const bytes = await convertLiveVideo(video, { start: 5.2, end: 6.4 })
  const output = path.join(workspace, '.local/trimmed-live.mp4')
  await writeFile(output, bytes)
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', output], { encoding: 'utf8' }))
  assert.equal(probe.streams[0].codec_name, 'h264')
  assert.ok(Math.abs(Number(probe.format.duration) - 1.2) < 0.15)
  assert.deepEqual(await readdir(path.join(workspace, '.local/media-tmp')), [])
})

it('RSS photo directives render safe static pictures and captions, without runtime markup or parsing fenced examples', async () => {
  const { renderFeedMarkdown } = await import('../src/utils/feed-markdown')
  const result = renderFeedMarkdown(':::photos\n::photo{src="https://cdn.example.com/p.webp" title="&lt;script&gt; &quot;一&quot;" live="https://cdn.example.com/p.mp4" iso="ISO 100"}\n:::\n\n```markdown\n::photo{src="https://cdn.example.com/example.jpg"}\n```')
  assert.match(result, /<img src="https:\/\/cdn.example.com\/p.webp"/)
  assert.match(result, /&lt;script&gt;/)
  assert.match(result, /href="https:\/\/cdn.example.com\/p.mp4"/)
  assert.ok(!result.includes('data-photo-view'))
  assert.ok(!result.includes(':::photos'))
  assert.ok(!result.includes('<img src="https://cdn.example.com/example.jpg"'))
})

it('RSS fold examples preserve fenced directives without exposing container markers', async () => {
  const { renderFeedMarkdown } = await import('../src/utils/feed-markdown')
  const result = renderFeedMarkdown('::::fold[图片写法]\n\n```markdown\n:::photos\n::photo{src="https://cdn.example.com/example.jpg"}\n:::\n```\n\n::::\n\n::photo{src="https://cdn.example.com/real.jpg" title="实际照片"}')
  assert.match(result, /<p>图片写法<\/p>/)
  assert.doesNotMatch(result, /::::fold|<p>:{3,}/)
  assert.match(result, /<code class="language-markdown">:::photos/)
  assert.equal((result.match(/<img /g) || []).length, 1)
  assert.match(result, /实际照片/)
})

it('mixed image rows keep every original image and group at most four per desktop row', async () => {
  const { rehypeImageProcessor } = await import('../src/plugins/rehype-image-processor.mjs')
  const { rehypePhotoRows } = await import('../src/plugins/rehype-photo-rows.mjs')
  const images = Array.from({ length: 5 }, (_, i) => ({ type: 'element', tagName: 'img', properties: { src: `https://cdn.example.com/${i}.jpg`, alt: `照片 ${i}` }, children: [] }))
  const tree: any = { type: 'root', children: [{ type: 'element', tagName: 'p', properties: {}, children: images }] }
  rehypeImageProcessor()(tree)
  rehypePhotoRows()(tree)
  assert.deepEqual(tree.children[0].children.map((row: any) => row.children.length), [4, 1])
  assert.deepEqual(tree.children[0].children.flatMap((row: any) => row.children.map((figure: any) => figure.children[0])), images)
})

it('reading estimates distinguish Chinese, English, code and photos without counting generated metadata', async () => {
  const { readingStats } = await import('../src/plugins/remark-reading-time.mjs')
  const stats = readingStats({ type: 'root', children: [{ type: 'text', value: `${'中'.repeat(350)} ${'word '.repeat(200)}` }, { type: 'code', value: 'x'.repeat(600) }, { type: 'paragraph', data: { hName: 'figure' }, children: [{ type: 'text', value: 'metadata'.repeat(500) }] }] })
  assert.equal(stats.wordCount, 550)
  assert.equal(stats.imageCount, 1)
  assert.equal(stats.minutes, 4)
})

it('related articles never reveal drafts, hidden posts or another language', async () => {
  const { relatedPosts } = await import('../src/utils/related')
  const current = { id: 'current', data: { tags: ['LLM'], published: '2026-01-01', lang: 'zh' } }
  const candidates = ['public', 'draft', 'hidden', 'english'].map((id, i) => ({ id, data: { tags: ['LLM'], published: `2026-01-0${i + 2}`, lang: id === 'english' ? 'en' : 'zh', draft: id === 'draft', hidden: id === 'hidden' } }))
  assert.deepEqual(relatedPosts(current, [current, ...candidates], 'zh').map(post => post.id), ['public'])
})

it('long code folds preserve full text for copy and short code remains expanded', async () => {
  const { rehypeCodeCopyButton } = await import('../src/plugins/rehype-code-copy-button.mjs')
  const long = Array.from({ length: 25 }, (_, index) => `line-${index}`).join('\n')
  const pre = (value: string) => ({ type: 'element', tagName: 'pre', properties: {}, children: [{ type: 'element', tagName: 'code', properties: {}, children: [{ type: 'text', value }] }] })
  const tree: any = { type: 'root', children: [pre(long), pre('short')] }
  rehypeCodeCopyButton()(tree)
  assert.equal(tree.children[0].properties['data-code-collapsed'], 'true')
  assert.equal(tree.children[0].children[1].children[0].children[0].value, long)
  assert.equal(tree.children[0].children[2].properties['aria-controls'], tree.children[0].children[1].properties.id)
  assert.equal(tree.children[1].properties['data-code-collapsed'], undefined)
})

it('tag sidebars prefer a shared specific tag and exclude drafts, hidden and other languages', async () => {
  const { postSeries } = await import('../src/utils/post-series')
  const entry = (id: string, tags: string[], extra = {}) => ({ id, data: { tags, published: '2026-10-02', lang: 'zh', ...extra } })
  const current = entry('current', ['Golang', '并发'])
  const peers = [current, entry('broad', ['Golang']), entry('specific', ['Golang', '并发']), entry('draft', ['并发'], { draft: true }), entry('hidden', ['并发'], { hidden: true }), entry('english', ['并发'], { lang: 'en' })]
  assert.deepEqual(postSeries(current, peers, 'zh').entries.map(post => post.id), ['current', 'specific'])
  assert.equal(postSeries(current, peers, 'zh').tag, '并发')
  assert.equal(postSeries(current, peers.filter(post => post.id !== 'specific'), 'zh').tag, 'Golang')
  assert.equal(postSeries(entry('untagged', []), peers, 'zh').entries.length, 0)
})
it('1000-photo stack and grid windows stay bounded at the beginning, middle, end and rapid jumps', async () => {
  const { stackWindow, gridWindow } = await import('../src/utils/gallery-window')
  for (const total of [1, 5, 1000, 5000]) {
    for (const position of [-1, 0, 2, total / 2, total - 1, total + 500]) {
      const range = stackWindow(total, position, 100)
      assert.ok(range.start >= 0 && range.end <= total)
      assert.ok(range.end - range.start <= 33)
      assert.ok(range.start <= Math.max(0, Math.min(total - 1, Math.round(position))))
    }
    for (const columns of [2, 4]) {
      for (const top of [0, 500, 10000, 4000000]) {
        const range = gridWindow(total, columns, top, 800, 300)
        assert.ok(range.start >= 0 && range.end <= total)
        assert.ok(range.end - range.start <= 8 * columns)
        assert.equal(range.height, Math.ceil(total / columns) * 300 + 200)
      }
    }
  }
})
it('album schema accepts 1000 linked photos while preserving uniqueness and the hard cap', async () => {
  const { albumSchema } = await import('../src/schemas/album')
  const photos = Array.from({ length: 1000 }, (_, i) => ({ id: `large-${i}`, src: 'https://example.com/photo.webp' }))
  const album = { slug: 'large-album', title: 'Large', published: '2026-10-02', photos }
  assert.equal(albumSchema.parse(album).photos.length, 1000)
  assert.equal(albumSchema.safeParse({ ...album, photos: [photos[0], photos[0]] }).success, false)
  assert.equal(albumSchema.safeParse({ ...album, photos: Array.from({ length: 5001 }, (_, i) => ({ ...photos[0], id: `over-${i}` })) }).success, false)
})

it('expanded photographs grow on desktop and fit portrait/mobile screens with parameters below', async () => {
  const { expandedPhotoSize } = await import('../src/utils/gallery-focus')
  const desktop = expandedPhotoSize(1920, 1080, 2400, 1600, 40)
  assert.ok(desktop.width > 800, 'Selected landscape photo should exceed the previous 800px limit')
  for (const [vw, vh, pw, ph] of [[1280, 720, 2400, 1600], [1280, 720, 1600, 2400], [390, 844, 2400, 1600], [390, 844, 1600, 2400]]) {
    const { width, height } = expandedPhotoSize(vw, vh, pw, ph, 80)
    assert.ok(width <= vw - 24)
    assert.ok(height + 80 + 16 <= vh - 64)
    assert.ok(Math.abs(width / height - pw / ph) < 0.001)
    const preview = expandedPhotoSize(vw, vh, pw, ph, 80, 'preview')
    assert.ok(preview.width < width, 'First click must leave room for the surrounding photo stack')
    assert.ok(preview.height + 80 + 16 <= vh * 0.62)
    assert.ok(Math.abs(preview.width / preview.height - pw / ph) < 0.001)
  }
})
