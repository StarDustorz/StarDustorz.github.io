import { Buffer } from 'node:buffer'
import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { safePath } from './paths'

const run = promisify(execFile)
async function temporary<T>(action: (directory: string) => Promise<T>) {
  const directory = await safePath('.', `.local/media-tmp/${randomUUID()}`)
  await mkdir(directory, { recursive: true, mode: 0o700 })
  try {
    return await action(directory)
  }
  finally { await rm(directory, { recursive: true, force: true }) }
}
export async function decodeHEIC(bytes: Uint8Array) {
  return temporary(async (directory) => {
    const input = path.join(directory, 'photo.heic')
    const output = path.join(directory, 'photo.jpg')
    await writeFile(input, bytes, { mode: 0o600 })
    await run('heif-convert', ['-q', '95', input, output], { timeout: 60000, maxBuffer: 1024 * 1024 })
    return readFile(output)
  })
}
export async function convertLiveVideo(encoded: string, clip: { start?: number, end?: number } = {}) {
  const trimming = clip.start !== undefined || clip.end !== undefined
  if (trimming && (!Number.isFinite(clip.start) || !Number.isFinite(clip.end) || clip.start! < 0 || clip.end! <= clip.start! || clip.end! - clip.start! > 30))
    throw new Error('请选择有效的起止时间，Live 片段最长 30 秒')
  if (!/^[a-z0-9+/=]+$/i.test(encoded))
    throw new Error('视频编码无效')
  const bytes = Buffer.from(encoded, 'base64')
  if (!bytes.length || bytes.length > 40 * 1024 * 1024)
    throw new Error('Live 视频最大 40 MB')
  if (!['ftyp', 'moov', 'mdat', 'wide'].includes(bytes.subarray(4, 8).toString()))
    throw new Error('请上传 MOV 或 MP4 视频')
  return temporary(async (directory) => {
    const input = path.join(directory, 'live.mov')
    const output = path.join(directory, 'live.mp4')
    await writeFile(input, bytes, { mode: 0o600 })
    try {
      const result = await run('ffprobe', ['-v', 'error', '-protocol_whitelist', 'file,pipe', '-show_streams', '-show_format', '-of', 'json', input], { timeout: 15000, maxBuffer: 1024 * 1024 })
      const probe = JSON.parse(result.stdout)
      const video = probe.streams?.find((stream: { codec_type: string }) => stream.codec_type === 'video')
      const duration = Number(probe.format?.duration)
      if (!video || !Number.isFinite(duration) || duration <= 0 || duration > 300 || !Number.isFinite(video.width * video.height) || video.width * video.height > 80000000)
        throw new Error('视频无效或超过 5 分钟')
      if (!trimming && duration > 30)
        throw new Error('Live 必须是 30 秒以内的视频，请先截取片段')
      if (trimming && (clip.start! >= duration || clip.end! > duration + 0.05))
        throw new Error('截取时间超出了视频长度')
      await run('ffmpeg', ['-nostdin', '-v', 'error', '-protocol_whitelist', 'file,pipe', ...(trimming ? ['-ss', String(clip.start)] : []), '-i', input, ...(trimming ? ['-t', String(clip.end! - clip.start!)] : []), '-map', '0:v:0', '-map', '0:a:0?', '-map_metadata', '-1', '-map_chapters', '-1', '-vf', 'scale=w=\'min(1920,iw)\':h=\'min(1920,ih)\':force_original_aspect_ratio=decrease:force_divisible_by=2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', '-threads', '2', output], { timeout: 90000, maxBuffer: 1024 * 1024 })
      return readFile(output)
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        throw new Error('未安装 FFmpeg，请重建 OrbStack 容器；直接运行时请先安装 FFmpeg')
      if (['视频无效或超过 5 分钟', '截取时间超出了视频长度'].includes((error as Error).message) || (error as Error).message.startsWith('Live 必须是'))
        throw error
      throw new Error('视频无法转码，请使用有效的 MOV / MP4 短视频')
    }
  })
}
