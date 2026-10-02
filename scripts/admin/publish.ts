import type { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { root, safePath } from './paths'
import { atomicWrite, digest, StoreError } from './store'

interface Change {
  path: string
  status: string
  managed: boolean
}
interface PublishState {
  phase: string
  logs: string
  commit?: string
  pushed?: boolean
  deploymentURL?: string
  error?: string
  started?: string
  selected?: string[]
}
let state: PublishState = { phase: 'idle', logs: '' }
let publishing = false
export function isPublishing() {
  return publishing
}
export function run(command: string, args: string[], onOutput?: (chunk: string) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env: { ...process.env, STARDUST_PREVIEW: '', GIT_TERMINAL_PROMPT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    const accept = (data: Buffer) => {
      const chunk = data.toString()
      output = (output + chunk).slice(-300000)
      onOutput?.(chunk)
    }
    child.stdout.on('data', accept)
    child.stderr.on('data', accept)
    const timeout = setTimeout(() => {
      child.kill('SIGTERM')
    }, 15 * 60000)
    child.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code === 0)
        resolve(output)
      else
        reject(new StoreError(`${command} 执行失败：${output.slice(-2500)}`, 422))
    })
  })
}
export function managedPath(file: string) {
  return /^(?:src\/content\/posts\/[^\0]+\.(?:md|mdx)|src\/content\/albums\/[a-z0-9-]+\.json)$/.test(file)
    && !file.split('/').some(part => part === '..' || part.startsWith('.'))
}
export async function changes() {
  const raw = await run('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'])
  const parts = raw.split('\0').filter(Boolean)
  const files: Change[] = []
  for (let index = 0; index < parts.length; index++) {
    const status = parts[index].slice(0, 2)
    const file = parts[index].slice(3)
    if (/[RC]/.test(status)) {
      const old = parts[++index]
      // Renames are reviewable as deletion + addition, only if both paths are managed.
      const managed = managedPath(file) && managedPath(old)
      files.push({ path: old, status: 'D', managed }, { path: file, status: 'A', managed })
    }
    else {
      files.push({ path: file, status: status.trim(), managed: managedPath(file) })
    }
  }
  const head = (await run('git', ['rev-parse', 'HEAD'])).trim()
  const branch = (await run('git', ['branch', '--show-current'])).trim()
  const contents = await Promise.all(files.map(async (file) => {
    try {
      return `${file.path}:${file.status}:${digest(await readFile(await safePath('.', file.path)))}`
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        return `${file.path}:${file.status}:deleted`
      throw error
    }
  }))
  let ahead = 0
  let behind = 0
  try {
    const counts = (await run('git', ['rev-list', '--left-right', '--count', `origin/${branch}...HEAD`])).trim().split(/\s+/).map(Number);
    [behind, ahead] = counts
  }
  catch {

  }
  return { files, head, branch, ahead, behind, revision: digest(`${head}\n${contents.join('\n')}`) }
}
async function persist() {
  await atomicWrite(await safePath('.local/publish', 'state.json'), JSON.stringify(state))
}
export async function initializePublish() {
  try {
    state = JSON.parse(await readFile(await safePath('.local/publish', 'state.json'), 'utf8'))
    if (['building', 'committing', 'pushing'].includes(state.phase)) {
      state.phase = 'failed'
      state.error = '上次操作中断。请查看 Git 状态，已有提交可使用「重试推送」。'
    }
  }
  catch {

  }
}
export async function publishStatus() {
  if (state.commit && ['deploying', 'unknown'].includes(state.phase) && !publishing) {
    try {
      const repository = await githubRepository()
      const runs = JSON.parse(await run('gh', ['run', 'list', '--repo', repository, '--workflow', 'deploy.yml', '--commit', state.commit, '--limit', '1', '--json', 'status,conclusion,url']))
      if (runs[0]) {
        state.deploymentURL = runs[0].url
        if (runs[0].status === 'completed') {
          state.phase = runs[0].conclusion === 'success' ? 'complete' : 'failed'
          state.error = runs[0].conclusion === 'success' ? undefined : `线上部署结果：${runs[0].conclusion}`
        }
        else {
          state.phase = 'deploying'
        }
      }
      else {
        state.phase = 'deploying'
      }
    }
    catch {
      state.phase = 'unknown'
      state.error = '提交已推送，无法读取部署状态。请登录 gh 后刷新，或在 GitHub Actions 中查看。'
    }
    await persist()
  }
  return {
    ...state,
    publishing,
    remoteAuthenticationRequired: process.env.STARDUST_CONTAINER === '1' && process.env.STARDUST_GITHUB_CREDENTIAL !== '1',
    canRetryPush: !publishing && state.phase === 'failed' && !!state.commit && !state.pushed,
  }
}
function output(chunk: string) {
  state.logs = (state.logs + chunk).slice(-100000)
}
async function pushCommit() {
  state.phase = 'pushing'
  await persist()
  await run('git', ['push', 'origin', 'HEAD:main'], output)
  state.pushed = true
  state.phase = 'deploying'
  state.error = undefined
  await persist()
}
async function githubRepository() {
  const remote = (await run('git', ['remote', 'get-url', 'origin'])).trim()
  const match = remote.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/)
  if (!match)
    throw new StoreError('origin 不是 GitHub 仓库，无法查询部署状态。')
  return match[1]
}
export async function startPublish(input: {
  paths: string[]
  revision: string
  message: string
}) {
  if (publishing)
    throw new StoreError('发布任务正在执行', 409)
  if (process.env.STARDUST_CONTAINER === '1' && process.env.STARDUST_GITHUB_CREDENTIAL !== '1')
    throw new StoreError('容器没有读取到 GitHub 凭据，请使用 pnpm local 重新启动。')
  const snapshot = await changes()
  if (snapshot.revision !== input.revision)
    throw new StoreError('待发布文件已变化，请刷新并重新审阅。', 409)
  if (snapshot.branch !== 'main')
    throw new StoreError('当前部署工作流只发布 main 分支，请先切换到 main。')
  if (!input.paths.length || input.paths.some(file => !snapshot.files.some(change => change.path === file && change.managed)))
    throw new StoreError('请选择有效的内容变更')
  if (snapshot.files.some(file => !file.managed && /(?:\.(?:ts|js|mjs|astro|css)|package\.json|pnpm-lock\.yaml|astro\.config\.ts|\.github\/workflows\/.*)$/.test(file.path)))
    throw new StoreError('功能代码有未提交修改。请先提交并推送功能代码，再从管理台发布内容。')
  const staged = (await run('git', ['diff', '--cached', '--name-only', '-z'])).split('\0').filter(Boolean)
  if (staged.some(file => !input.paths.includes(file)))
    throw new StoreError('暂存区有本次未选中的文件，请先处理暂存区，以免误发布。')
  const message = input.message.trim() || `发布博客内容 ${new Date().toISOString().slice(0, 10)}`
  if (message.length > 500)
    throw new StoreError('提交说明过长')
  const expectedContent = await selectedDigest(input.paths)
  publishing = true
  state = { phase: 'building', logs: '', started: new Date().toISOString(), selected: [...new Set(input.paths)] }
  await persist()
  void (async () => {
    try {
      await run('git', ['fetch', 'origin', 'main'], output)
      const upstream = (await run('git', ['rev-parse', 'origin/main'])).trim()
      if (upstream !== snapshot.head)
        throw new StoreError('本地 main 与远端不一致。请先处理已有提交或同步远端，再发布。')
      // CI rebuilds from Git. Require all pending content to be selected so the local
      // build cannot accidentally validate a different set of files from CI.
      if (snapshot.files.some(file => file.managed && !input.paths.includes(file.path)))
        throw new StoreError('请选中全部待发布内容，保证本地构建与线上构建一致。')
      await run('pnpm', ['build'], output)
      // The build updates its generated LQIP cache; unrelated generated changes
      // must not invalidate reviewed content or be included in the commit.
      const after = await changes()
      const relevant = after.files.filter(file => file.path !== 'src/assets/lqip-map.json')
      const before = snapshot.files.filter(file => file.path !== 'src/assets/lqip-map.json')
      if (after.head !== snapshot.head || JSON.stringify(relevant) !== JSON.stringify(before))
        throw new StoreError('构建过程中工作区发生变化，请重新审阅。')
      // Compare the bytes as well as the status entries.
      if (expectedContent !== await selectedDigest(input.paths))
        throw new StoreError('内容发生变化，请重新审阅。')
      state.phase = 'committing'
      await persist()
      await run('git', ['add', '--', ...state.selected!], output)
      await run('git', ['commit', '-m', message], output)
      state.commit = (await run('git', ['rev-parse', 'HEAD'])).trim()
      await persist()
      await pushCommit()
    }
    catch (error) {
      state.phase = 'failed'
      state.error = (error as Error).message
      output(`\n${state.error}\n`)
      await persist()
    }
    finally {
      publishing = false
    }
  })()
  return { job: randomUUID() }
}
async function selectedDigest(paths: string[]) {
  return digest(JSON.stringify(await Promise.all(paths.map(async (file) => {
    try {
      return [file, digest(await readFile(await safePath('.', file)))]
    }
    catch {
      return [file, 'deleted']
    }
  }))))
}
export async function retryPush() {
  if (publishing || !state.commit || state.phase !== 'failed' || state.pushed)
    throw new StoreError('没有可重试的推送')
  const head = (await run('git', ['rev-parse', 'HEAD'])).trim()
  const branch = (await run('git', ['branch', '--show-current'])).trim()
  if (head !== state.commit || branch !== 'main')
    throw new StoreError('当前提交或分支已变化，请手动处理 Git 状态。', 409)
  publishing = true
  void pushCommit().catch(async (error) => {
    state.phase = 'failed'
    state.error = (error as Error).message
    await persist()
  }).finally(() => {
    publishing = false
  })
  return { ok: true }
}
