import { createHash, randomUUID } from 'node:crypto'
import { cp, mkdir, readdir, readFile, readlink, rename, stat, symlink } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { root, safePath } from './paths'
import { isPublishing, run } from './publish'
import { atomicWrite, StoreError } from './store'

interface LocalState {
  phase: 'idle' | 'building' | 'complete' | 'failed'
  logs: string
  error?: string
  publishedAt?: string
  release?: string
  seedHash?: string
}
let state: LocalState = { phase: 'idle', logs: '' }
let building = false
export function isLocalPublishing() {
  return building
}
const siteRoot = path.join(root, '.local/site')
async function siteDigest(directory: string) {
  const hash = createHash('sha256')
  async function visit(relative: string) {
    const entries = await readdir(path.join(directory, relative), { withFileTypes: true })
    entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))
    for (const entry of entries) {
      const file = path.join(relative, entry.name)
      if (entry.isDirectory())
        await visit(file)
      else if (entry.isFile())
        hash.update(file).update('\0').update(await readFile(path.join(directory, file))).update('\0')
    }
  }
  await visit('')
  return hash.digest('hex')
}
async function persist() {
  await atomicWrite(await safePath('.local', 'local-site-state.json'), JSON.stringify(state))
}
export async function promoteSite(source: string) {
  await stat(path.join(source, 'index.html'))
  const release = `release-${randomUUID()}`
  await mkdir(path.join(siteRoot, 'releases'), { recursive: true })
  await cp(source, path.join(siteRoot, 'releases', release), { recursive: true })
  const link = path.join(siteRoot, `current-${randomUUID()}.tmp`)
  await symlink(`releases/${release}`, link, 'dir')
  // Readers see the complete old or new release, never a partly copied build.
  await rename(link, path.join(siteRoot, 'current'))
  return release
}
export async function initializeLocalSite(seed?: string) {
  try {
    state = JSON.parse(await readFile(await safePath('.local', 'local-site-state.json'), 'utf8'))
    if (state.phase === 'building') {
      state.phase = 'failed'
      state.error = '上次本地构建中断，当前博客仍使用此前成功的版本。'
      await persist()
    }
  }
  catch {
    // A new installation has no previous state.
  }
  if (!seed)
    return
  // Article or album edits can leave the home page unchanged.
  const seedHash = await siteDigest(seed)
  const current = await readlink(path.join(siteRoot, 'current')).catch(() => '')
  if (!current || seedHash !== state.seedHash) {
    const release = await promoteSite(seed)
    state = { phase: 'complete', logs: '已加载镜像内通过构建检查的博客。', publishedAt: new Date().toISOString(), release, seedHash }
    await persist()
  }
}
export async function localSiteStatus() {
  return { ...state, building, enabled: process.env.STARDUST_LOCAL_SITE === '1', url: process.env.STARDUST_SITE_URL || 'http://127.0.0.1:8080' }
}
export async function startLocalPublish() {
  if (process.env.STARDUST_LOCAL_SITE !== '1')
    throw new StoreError('请先启动 Docker Compose 本地服务。')
  if (building || isPublishing())
    throw new StoreError('已有发布任务正在执行', 409)
  building = true
  state = { ...state, phase: 'building', logs: '', error: undefined }
  try {
    await persist()
  }
  catch (error) {
    building = false
    throw error
  }
  void (async () => {
    try {
      await run('pnpm', ['build'], (chunk) => {
        state.logs = (state.logs + chunk).slice(-100000)
      })
      state.release = await promoteSite(path.join(root, 'dist'))
      state.publishedAt = new Date().toISOString()
      state.phase = 'complete'
    }
    catch (error) {
      state.phase = 'failed'
      state.error = (error as Error).message
    }
    finally {
      building = false
      await persist()
    }
  })()
  return { ok: true }
}
