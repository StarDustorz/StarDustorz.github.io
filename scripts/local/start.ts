import { spawn, spawnSync } from 'node:child_process'
import process from 'node:process'

const credential = spawnSync('git', ['credential', 'fill'], {
  encoding: 'utf8',
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  input: 'protocol=https\nhost=github.com\n\n',
})

if (credential.status !== 0)
  throw new Error('无法从现有 Git 凭据中读取 GitHub 登录信息。')

const password = credential.stdout
  .split('\n')
  .find(line => line.startsWith('password='))
  ?.slice('password='.length)

if (!password)
  throw new Error('现有 Git 凭据中没有 GitHub Token。')

const compose = spawn('docker', ['compose', 'up', '-d', '--build', '--remove-orphans'], {
  env: { ...process.env, GH_TOKEN: password },
  stdio: 'inherit',
})

const code = await new Promise<number>((resolve, reject) => {
  compose.on('error', reject)
  compose.on('close', value => resolve(value ?? 1))
})

process.exitCode = code
