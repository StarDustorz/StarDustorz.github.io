import { randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { imageURLSchema } from '../../src/schemas/album'
import { root, safePath } from './paths'

function serverURL(route: string) {
  const server = new URL(process.env.STARDUST_PICGO_URL || 'http://127.0.0.1:36677')
  if (!['127.0.0.1', 'localhost', 'host.docker.internal'].includes(server.hostname)
    || !['http:', 'https:'].includes(server.protocol) || server.username || server.password) {
    throw new Error('PicGo 必须使用本机服务地址')
  }
  return new URL(route, server)
}
export async function picgoStatus() {
  try {
    const response = await fetch(serverURL('/heartbeat'), { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(3000) })
    const result = await response.json()
    return { available: response.ok && result.success === true && result.result === 'alive' }
  }
  catch {
    return { available: false }
  }
}
export async function uploadWithPicgo(image: Uint8Array, extension: 'webp' | 'mp4' = 'webp') {
  // PicGo 2.3.x accepts host filesystem paths, not multipart bodies. This
  // temporary file lives on the shared bind mount and is removed after upload.
  const relative = `.local/picgo-uploads/${randomUUID()}.${extension}`
  const local = await safePath('.', relative)
  const hostRoot = process.env.STARDUST_PICGO_HOST_ROOT || root
  if (process.env.STARDUST_CONTAINER === '1' && !process.env.STARDUST_PICGO_HOST_ROOT)
    throw new Error('容器缺少 PicGo 宿主机目录，请更新 Compose 配置并重启管理台')
  if (!path.isAbsolute(hostRoot))
    throw new Error('PicGo 宿主机目录必须是绝对路径')
  await mkdir(path.dirname(local), { recursive: true })
  await writeFile(local, image, { mode: 0o600, flag: 'wx' })
  try {
    let response
    try {
      response = await fetch(serverURL('/upload'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list: [path.join(hostRoot, relative)] }),
        signal: AbortSignal.timeout(90000),
      })
    }
    catch {
      throw new Error('无法完成 PicGo 上传。请确认 PicGo 已启动、服务端口为 36677，且默认图床为腾讯云 COS')
    }
    const result = await response.json().catch(() => undefined)
    if (!response.ok || !result?.success || !Array.isArray(result.result) || result.result.length !== 1)
      throw new Error('PicGo 上传失败，请查看 PicGo 日志并检查腾讯云 COS 配置')
    const parsed = imageURLSchema.safeParse(result.result[0])
    if (!parsed.success)
      throw new Error('PicGo 未返回有效的 HTTPS 图片链接，请检查 COS 访问域名配置')
    return parsed.data
  }
  finally {
    await rm(local, { force: true })
  }
}
