import { lstat, mkdir, realpath } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

export const root = path.resolve(process.env.STARDUST_ROOT || process.cwd())

// Check existing ancestors as well as lexical paths to reject symlink escapes.
export async function safePath(directory: string, relative: string): Promise<string> {
  if (!relative || relative.includes('\0') || relative.includes('\\') || path.isAbsolute(relative)
    || relative.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('文件路径无效')
  }
  const base = path.resolve(root, directory)
  const target = path.resolve(base, relative)
  if (!target.startsWith(`${base}${path.sep}`))
    throw new Error('文件路径超出允许目录')
  await mkdir(base, { recursive: true })
  if (await realpath(base) !== base)
    throw new Error('素材目录不能通过符号链接访问')
  let current = target
  while (current !== root) {
    try {
      const info = await lstat(current)
      if (info.isSymbolicLink())
        throw new Error('不能读写符号链接')
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        throw error
    }
    current = path.dirname(current)
  }
  return target
}
