import type { IncomingMessage, ServerResponse } from 'node:http'
import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import process from 'node:process'
import { z } from 'astro/zod'
import { base, defaultLocale } from '../../src/config'
import { albumSchema, imageURLSchema } from '../../src/schemas/album'
import { mediaLibrary } from './library'
import { initializeLocalSite, isLocalPublishing, localSiteStatus, startLocalPublish } from './local-site'
import { root } from './paths'
import { picgoStatus } from './picgo'
import { changes, initializePublish, isPublishing, publishStatus, retryPush, startPublish } from './publish'
import { addPhotoLink, getAlbum, getPost, importLiveVideo, importPhoto, listAlbums, listBackups, listPosts, restoreBackup, saveAlbum, savePost, StoreError, uploadImage, uploadVideo } from './store'

const port = Number(process.env.STARDUST_ADMIN_PORT || 4310)
const previewPort = Number(process.env.STARDUST_PREVIEW_PORT || 4322)
if (![port, previewPort].every(value => Number.isInteger(value) && value > 1024 && value < 65536) || port === previewPort)
  throw new Error('管理台与预览端口必须是不同的有效端口')
const origin = `http://127.0.0.1:${port}`
const bindHost = process.env.STARDUST_CONTAINER === '1' ? '0.0.0.0' : '127.0.0.1'
const token = randomBytes(32).toString('hex')
const assets = new URL('../../admin/', import.meta.url)
let previewChild: ReturnType<typeof spawn> | undefined
let previewReady: Promise<void> | undefined
function stopPreview() {
  if (!previewChild?.pid)
    return
  try {
    if (process.platform === 'win32')
      previewChild.kill('SIGTERM')
    else
      process.kill(-previewChild.pid, 'SIGTERM')
  }
  catch {
    // The process may already have exited.
  }
}
let queue: Promise<unknown> = Promise.resolve()
async function body(req: IncomingMessage) {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 58 * 1024 * 1024)
      throw new StoreError('请求超过大小限制', 413)
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }
  catch {
    throw new StoreError('请求必须是 JSON')
  }
}
function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}
async function mutate<T>(action: () => Promise<T>) {
  const pending = queue.then(async () => {
    if (isPublishing() || isLocalPublishing())
      throw new StoreError('发布过程中暂时不能修改内容', 409)
    return action()
  })
  queue = pending.catch(() => {

  })
  return pending
}
function startPreview() {
  previewReady ??= (async () => {
    previewChild = spawn('pnpm', ['astro', 'dev', '--host', bindHost, '--port', String(previewPort)], {
      cwd: root,
      detached: process.platform !== 'win32',
      env: { ...process.env, STARDUST_PREVIEW: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let failed: Error | undefined
    previewChild.on('error', (error) => {
      failed = error
    })
    previewChild.on('exit', () => {
      failed = new Error('预览进程已退出，请检查端口或运行 pnpm astro check')
    })
    previewChild.stdout?.on('data', () => {

    })
    previewChild.stderr?.on('data', () => {

    })
    for (let attempt = 0; attempt < 90; attempt++) {
      if (failed)
        throw failed
      try {
        const response = await fetch(`http://127.0.0.1:${previewPort}/__preview-health`, {
          signal: AbortSignal.timeout(1500),
        })
        if (response.ok && await response.text() === 'ready')
          return
      }
      catch {

      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    throw new Error('预览启动超时，请检查端口占用')
  })().catch((error) => {
    previewReady = undefined
    stopPreview()
    throw error
  })
  return previewReady
}
async function api(req: IncomingMessage, res: ServerResponse, url: URL) {
  if (req.method === 'GET') {
    const id = url.searchParams.get('id') || ''
    switch (url.pathname) {
      case '/api/posts': return json(res, await listPosts())
      case '/api/post': return json(res, await getPost(id))
      case '/api/albums': return json(res, await listAlbums())
      case '/api/album': return json(res, await getAlbum(id))
      case '/api/backups': return json(res, await listBackups())
      case '/api/changes': return json(res, await changes())
      case '/api/publish': return json(res, await publishStatus())
      case '/api/site': return json(res, await localSiteStatus())
      case '/api/picgo': return json(res, await picgoStatus())
      case '/api/media': return json(res, await mediaLibrary())
      default: throw new StoreError('接口不存在', 404)
    }
  }
  if (req.method !== 'POST')
    throw new StoreError('请求方法不支持', 405)
  const input = await body(req)
  const identity = z.object({ id: z.string(), version: z.string() })
  switch (url.pathname) {
    case '/api/post': {
      const value = identity.extend({ data: z.record(z.string(), z.unknown()), body: z.string().max(3000000) }).parse(input)
      return json(res, await mutate(() => savePost(value)))
    }
    case '/api/album': {
      const value = identity.extend({ data: albumSchema }).parse(input)
      return json(res, await mutate(() => saveAlbum(value)))
    }
    case '/api/import': {
      const value = identity.extend({ name: z.string(), image: z.string() }).parse(input)
      return json(res, await mutate(() => importPhoto(value)))
    }
    case '/api/photo-link': {
      const value = identity.extend({ src: imageURLSchema, title: z.string().max(200).default('') }).parse(input)
      return json(res, await mutate(() => addPhotoLink(value)))
    }
    case '/api/upload-image': {
      const value = z.object({ name: z.string(), image: z.string() }).parse(input)
      return json(res, await mutate(() => uploadImage(value)))
    }
    case '/api/upload-video': {
      const value = z.object({ video: z.string(), start: z.number().min(0).max(300).optional(), end: z.number().positive().max(300).optional() }).parse(input)
      return json(res, await mutate(() => uploadVideo(value)))
    }
    case '/api/import-live': {
      const value = identity.extend({ photoId: z.string(), video: z.string(), start: z.number().min(0).max(300).optional(), end: z.number().positive().max(300).optional() }).parse(input)
      return json(res, await mutate(() => importLiveVideo(value)))
    }
    case '/api/status': {
      const value = identity.extend({ kind: z.enum(['post', 'album']), status: z.enum(['public', 'draft', 'hidden']) }).parse(input)
      return json(res, await mutate(async () => {
        const item = value.kind === 'post' ? await getPost(value.id) : await getAlbum(value.id)
        const data = { ...item.data, draft: value.status === 'draft', hidden: value.status === 'hidden' }
        return value.kind === 'post'
          ? savePost({ id: value.id, version: value.version, data, body: 'body' in item ? item.body : '' })
          : saveAlbum({ id: value.id, version: value.version, data: data as z.infer<typeof albumSchema> })
      }))
    }
    case '/api/restore': {
      const value = identity.parse(input)
      return json(res, await mutate(() => restoreBackup(value.id, value.version)))
    }
    case '/api/preview': {
      const value = z.object({ kind: z.enum(['post', 'album', 'home']), id: z.string().default('') }).parse(input)
      let next = `${base}/`
      if (value.kind !== 'home') {
        const item = value.kind === 'post' ? await getPost(value.id) : await getAlbum(value.id)
        const prefix = item.data.lang && item.data.lang !== defaultLocale ? `/${item.data.lang}` : ''
        const slug = 'urlSlug' in item ? item.urlSlug : value.id
        next = `${base}${prefix}/${value.kind === 'post' ? 'posts' : 'gallery'}/${String(slug).split('/').map(encodeURIComponent).join('/')}/`
      }
      await startPreview()
      return json(res, { url: `http://127.0.0.1:${previewPort}${next}` })
    }
    case '/api/publish': {
      const value = z.object({ paths: z.array(z.string()).max(3000), revision: z.string(), message: z.string().default('') }).parse(input)
      return json(res, await mutate(() => startPublish(value)), 202)
    }
    case '/api/retry-push': return json(res, await mutate(retryPush), 202)
    case '/api/local-publish': return json(res, await mutate(startLocalPublish), 202)
    default: throw new StoreError('接口不存在', 404)
  }
}
await initializePublish()
await initializeLocalSite()
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Content-Security-Policy', 'default-src \'self\'; script-src \'self\'; style-src \'self\'; img-src \'self\' https: data:; media-src \'self\' blob:; connect-src \'self\'; base-uri \'none\'; frame-ancestors \'none\'; form-action \'self\'')
  try {
    if (req.headers.host !== `127.0.0.1:${port}` || (req.headers.origin && req.headers.origin !== origin)
      || req.headers['sec-fetch-site'] === 'cross-site') {
      throw new StoreError('只允许从本机管理台访问', 403)
    }
    const url = new URL(req.url || '/', origin)
    if (req.method === 'GET' && url.pathname === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('ready')
      return
    }
    if (req.method === 'GET' && ['/', '/admin.css', '/admin.js'].includes(url.pathname)) {
      if (url.pathname === '/') {
        res.setHeader('Set-Cookie', `stardust_admin=${token}; HttpOnly; SameSite=Strict; Path=/`)
        const html = (await readFile(new URL('index.html', assets), 'utf8')).replace('__CSRF_TOKEN__', token)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html)
      }
      else {
        const file = url.pathname.slice(1)
        res.writeHead(200, { 'Content-Type': file.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8' })
          .end(await readFile(new URL(file, assets)))
      }
      return
    }
    const authenticated = req.headers.cookie?.split(';').map(value => value.trim()).includes(`stardust_admin=${token}`)
    if (!authenticated)
      throw new StoreError('会话已过期，请刷新管理台', 401)
    if (req.headers['x-csrf-token'] !== token)
      throw new StoreError('访问令牌无效，请刷新管理台', 403)
    await api(req, res, url)
  }
  catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    const status = error instanceof StoreError ? error.status : error instanceof z.ZodError ? 400 : code === 'ENOENT' ? 404 : 500
    const message = error instanceof z.ZodError ? error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('；') : (error as Error).message
    json(res, { error: message }, status)
  }
})
server.requestTimeout = 120000
server.listen(port, bindHost, () => {
  console.log(`本地博客管理台：${origin}\n关闭此进程即可停止管理台与私有预览。`)
  void startPreview().then(() => {
    console.log(`本地预览：http://127.0.0.1:${previewPort}/`)
  }).catch((error) => {
    console.error('本地预览启动失败：', error.message)
  })
})
server.on('error', (error) => {
  console.error(`管理台启动失败：${error.message}`)
  process.exitCode = 1
})
function shutdown() {
  stopPreview()
  server.close(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
