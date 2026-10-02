import type { AlbumData } from '../../src/schemas/album'
import { Buffer } from 'node:buffer'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'
import sharp from 'sharp'
import { parseDocument } from 'yaml'
import { albumSchema, imageURLSchema, slugSchema } from '../../src/schemas/album'
import { postSchema } from '../../src/schemas/post'
import { contentStatus } from '../../src/utils/visibility'
import { convertLiveVideo, decodeHEIC } from './media'
import { root, safePath } from './paths'
import { extractPhotoMetadata } from './photo-metadata'
import { uploadWithPicgo } from './picgo'
import { postSlug } from './post-slug'

export class StoreError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
export const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
async function readOptional(file: string) {
  try {
    return await readFile(file, 'utf8')
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return undefined
    throw error
  }
}
export async function atomicWrite(file: string, content: string | Buffer) {
  await mkdir(path.dirname(file), { recursive: true })
  const temp = `${file}.${randomUUID()}.tmp`
  await writeFile(temp, content, { mode: 0o600, flag: 'wx' })
  await rename(temp, file)
}
function splitPost(raw: string) {
  const match = /^(\uFEFF?)---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw)
  if (!match)
    throw new StoreError('文章缺少 YAML front matter')
  const doc = parseDocument(match[2])
  if (doc.errors.length)
    throw new StoreError(`文章元数据解析失败：${doc.errors[0].message}`)
  return { doc, body: raw.slice(match[0].length), bom: match[1], newline: raw.includes('\r\n') ? '\r\n' : '\n' }
}
async function backup(relative: string, content: string) {
  const file = await safePath('.local/backups', `${randomUUID()}.json`)
  await atomicWrite(file, JSON.stringify({ path: relative, content, at: new Date().toISOString() }))
}
async function save(relative: string, file: string, next: string, version: string) {
  const current = await readOptional(file)
  if ((current === undefined ? '' : digest(current)) !== version)
    throw new StoreError('文件已被其他编辑器修改，请重新加载后再保存。', 409)
  if (current !== undefined && current !== next)
    await backup(relative, current)
  await atomicWrite(file, next)
  const audit = await safePath('.local', 'operations.jsonl')
  const { appendFile } = await import('node:fs/promises')
  await appendFile(audit, `${JSON.stringify({ at: new Date().toISOString(), operation: 'save', path: relative })}\n`)
  return digest(next)
}
export async function postFile(id: string) {
  if (!/\.(?:md|mdx)$/.test(id) || id.split('/').some(part => part.startsWith('.')))
    throw new StoreError('文章文件名必须以 .md 或 .mdx 结尾')
  return safePath('src/content/posts', id)
}
export async function getPost(id: string) {
  const raw = await readFile(await postFile(id), 'utf8')
  const { doc, body } = splitPost(raw)
  const values = doc.toJSON()
  const parsed = postSchema.parse(values)
  // Keep the authored calendar date/timezone in the editor instead of converting
  // it to UTC during JSON serialization. Untouched dates retain their exact YAML.
  const data = { ...parsed, published: String(values.published), updated: values.updated ? String(values.updated) : undefined }
  return { id, version: digest(raw), data, body, status: contentStatus(data), urlSlug: postSlug(id, doc.toJSON()) }
}
export async function listPosts() {
  const files = await fg('**/*.{md,mdx}', { cwd: path.join(root, 'src/content/posts'), followSymbolicLinks: false })
  return Promise.all(files.map(async (id) => {
    try {
      const { body: _body, ...post } = await getPost(id)
      return post
    }
    catch (error) {
      return { id, error: (error as Error).message }
    }
  }))
}
export async function savePost(input: {
  id: string
  version: string
  data: Record<string, unknown>
  body: string
}) {
  const file = await postFile(input.id)
  const previous = await readOptional(file)
  const raw = previous ?? '---\n{}\n---\n'
  const { doc, bom, newline } = splitPost(raw)
  const fields = ['title', 'published', 'updated', 'description', 'tags', 'draft', 'hidden', 'pin', 'toc', 'lang', 'abbrlink']
  const patch = Object.fromEntries(Object.entries(input.data).filter(([key]) => fields.includes(key)))
  const data = { ...doc.toJSON(), ...patch }
  postSchema.parse(data)
  // Catch duplicate URLs before overwriting an article.
  const slug = postSlug(input.id, data)
  for (const post of await listPosts()) {
    if ('data' in post && post.data && post.id !== input.id
      && post.urlSlug === slug
      && (!data.lang || !post.data.lang || data.lang === post.data.lang)) {
      throw new StoreError('该短链接已被其他文章使用')
    }
  }
  for (const [key, value] of Object.entries(patch)) {
    const old = doc.get(key)
    if ((key === 'published' || key === 'updated') && String(old ?? '').slice(0, 10) === String(value ?? '').slice(0, 10))
      continue
    if (JSON.stringify(old) !== JSON.stringify(value))
      doc.set(key, value)
  }
  const frontmatter = doc.toString({ flowCollectionPadding: false }).trimEnd().replace(/\r?\n/g, newline)
  const next = `${bom}---${newline}${frontmatter}${newline}---${newline}${input.body}`
  await save(`src/content/posts/${input.id}`, file, next, input.version)
  return getPost(input.id)
}
export async function albumFile(id: string) {
  slugSchema.parse(id)
  return safePath('src/content/albums', `${id}.json`)
}
export async function getAlbum(id: string) {
  const raw = await readFile(await albumFile(id), 'utf8')
  const data = albumSchema.parse(JSON.parse(raw))
  return { id, version: digest(raw), data, status: contentStatus(data) }
}
export async function listAlbums() {
  const files = await fg('*.json', { cwd: path.join(root, 'src/content/albums'), followSymbolicLinks: false })
  return Promise.all(files.map(async file => getAlbum(file.slice(0, -5))))
}
export async function saveAlbum(input: {
  id: string
  version: string
  data: AlbumData
}) {
  const file = await albumFile(input.id)
  const data = albumSchema.parse(input.data)
  if (data.slug !== input.id)
    throw new StoreError('相册创建后不能修改标识')
  await save(`src/content/albums/${input.id}.json`, file, `${JSON.stringify(data, null, 2)}\n`, input.version)
  return getAlbum(input.id)
}
export async function uploadImage(input: {
  name: string
  image: string
}) {
  if (!/^[a-z0-9+/=]+$/i.test(input.image))
    throw new StoreError('图片编码无效')
  const bytes = Buffer.from(input.image, 'base64')
  if (!bytes.length || bytes.length > 15 * 1024 * 1024)
    throw new StoreError('单张图片最大 15 MB')
  const instance = sharp(bytes, { limitInputPixels: 80000000, animated: false })
  const metadata = await instance.metadata()
  const details = await extractPhotoMetadata(bytes)
  if (!['jpeg', 'png', 'webp', 'heif', 'avif', 'tiff', 'gif'].includes(metadata.format || ''))
    throw new StoreError('请上传 JPG、PNG、WebP、AVIF、HEIC、TIFF 或 GIF 图片')
  // Only a transient, oriented WebP reaches PicGo. No original or derivative
  // is retained in content, assets or the published static site.
  const encode = (image: sharp.Sharp) => image.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toBuffer({ resolveWithObject: true })
  let encoded
  try {
    encoded = await encode(instance)
  }
  catch (error) {
    if (metadata.format !== 'heif')
      throw error
    try {
      encoded = await encode(sharp(await decodeHEIC(bytes), { limitInputPixels: 80000000 }))
    }
    catch { throw new StoreError('无法解码 HEIC，请重建容器以安装 HEIC 解码器，或导出为 JPG 后上传') }
  }
  const { data, info } = encoded
  let src
  try {
    src = await uploadWithPicgo(data)
  }
  catch (error) {
    throw new StoreError((error as Error).message, 502)
  }
  const title = path.basename(input.name).replace(/\.[^.]+$/, '').slice(0, 200)
  return { src, width: info.width, height: info.height, title, ...details }
}
function checkImport(album: Awaited<ReturnType<typeof getAlbum>>, version: string) {
  if (album.version !== version)
    throw new StoreError('相册已被修改，请重新加载。', 409)
  if (album.data.photos.length >= 5000)
    throw new StoreError('单个相册最多 5000 张照片')
}
async function appendPhoto(album: Awaited<ReturnType<typeof getAlbum>>, photo: { src: string, title: string, width?: number, height?: number, taken?: string, metadata?: AlbumData['photos'][number]['metadata'] }) {
  const id = `photo-${randomUUID()}`
  album.data.photos.push({ id, taken: '', ...photo, description: '', alt: photo.title, hidden: false })
  if (!album.data.cover)
    album.data.cover = id
  return saveAlbum({ id: album.id, version: album.version, data: album.data })
}
export async function importPhoto(input: { id: string, version: string, name: string, image: string }) {
  const album = await getAlbum(input.id)
  checkImport(album, input.version)
  const photo = await uploadImage(input)
  try {
    return await appendPhoto(album, photo)
  }
  catch (error) {
    if (error instanceof StoreError && error.status === 409)
      throw new StoreError(`图片已上传，但相册被其他编辑器修改。请重新加载，再粘贴此链接：${photo.src}`, 409)
    throw error
  }
}
export async function addPhotoLink(input: { id: string, version: string, src: string, title: string }) {
  const album = await getAlbum(input.id)
  checkImport(album, input.version)
  return appendPhoto(album, { src: imageURLSchema.parse(input.src), title: input.title.trim().slice(0, 200) })
}
export async function uploadVideo(input: { video: string, start?: number, end?: number }) {
  try {
    return { src: await uploadWithPicgo(await convertLiveVideo(input.video, input), 'mp4') }
  }
  catch (error) {
    throw new StoreError((error as Error).message, 502)
  }
}
export async function importLiveVideo(input: { id: string, version: string, photoId: string, video: string, start?: number, end?: number }) {
  const album = await getAlbum(input.id)
  if (album.version !== input.version)
    throw new StoreError('相册已被修改，请重新加载。', 409)
  const photo = album.data.photos.find(photo => photo.id === input.photoId)
  if (!photo)
    throw new StoreError('照片不存在')
  const uploaded = await uploadVideo(input)
  photo.live = uploaded.src
  try {
    return await saveAlbum({ id: album.id, version: album.version, data: album.data })
  }
  catch (error) {
    if (error instanceof StoreError && error.status === 409)
      throw new StoreError(`Live 视频已上传，相册发生冲突。重新加载后粘贴此视频链接：${uploaded.src}`, 409)
    throw error
  }
}
export async function listBackups() {
  const files = await fg('*.json', { cwd: path.join(root, '.local/backups') })
  const items = await Promise.all(files.map(async (id) => {
    const data = JSON.parse(await readFile(await safePath('.local/backups', id), 'utf8'))
    return { id, path: data.path as string, at: data.at as string }
  }))
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100)
}
export async function restoreBackup(id: string, version: string) {
  if (!/^[a-f0-9-]{36}\.json$/.test(id))
    throw new StoreError('备份标识无效')
  const data = JSON.parse(await readFile(await safePath('.local/backups', id), 'utf8'))
  let file
  if (data.path.startsWith('src/content/posts/')) {
    file = await postFile(data.path.slice('src/content/posts/'.length))
    postSchema.parse(splitPost(data.content).doc.toJSON())
  }
  else if (/^src\/content\/albums\/[a-z0-9-]+\.json$/.test(data.path)) {
    file = await albumFile(path.basename(data.path, '.json'))
    albumSchema.parse(JSON.parse(data.content))
  }
  else {
    throw new StoreError('备份路径无效')
  }
  await save(data.path, file, data.content, version)
  return { path: data.path }
}
