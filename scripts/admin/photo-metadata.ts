import type { AlbumData } from '../../src/schemas/album'
import exifr from 'exifr'

const tags = ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'ExposureCompensation', 'DateTimeOriginal']
const clean = (value: unknown) => typeof value === 'string' ? value.replace(/\p{Cc}/gu, '').trim().slice(0, 200) : ''
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined
export async function extractPhotoMetadata(bytes: Uint8Array) {
  // Only these photographic tags are read; GPS and device identifiers are not stored.
  const data = await exifr.parse(bytes, { pick: tags, gps: false }).catch(() => undefined) ?? {}
  const metadata: NonNullable<AlbumData['photos'][number]['metadata']> = {}
  const make = clean(data.Make)
  const model = clean(data.Model)
  if (model || make)
    metadata.camera = model.toLowerCase().startsWith(make.toLowerCase()) ? model : [make, model].filter(Boolean).join(' ')
  if (clean(data.LensModel))
    metadata.lens = clean(data.LensModel)
  const focal = number(data.FocalLength)
  const aperture = number(data.FNumber)
  const shutter = number(data.ExposureTime)
  const iso = number(data.ISO)
  const ev = number(data.ExposureCompensation)
  if (focal && focal > 0)
    metadata.focalLength = `${Math.round(focal * 10) / 10} mm`
  if (aperture && aperture > 0)
    metadata.aperture = `ƒ/${Math.round(aperture * 10) / 10}`
  if (shutter && shutter > 0)
    metadata.shutter = shutter < 1 ? `1/${Math.round(1 / shutter)} s` : `${Math.round(shutter * 100) / 100} s`
  if (iso && iso > 0)
    metadata.iso = `ISO ${Math.round(iso)}`
  if (ev !== undefined)
    metadata.exposure = `${ev > 0 ? '+' : ''}${Math.round(ev * 100) / 100} EV`
  const captured = data.DateTimeOriginal
  const taken = captured instanceof Date && !Number.isNaN(captured.getTime())
    ? `${captured.getFullYear()}-${String(captured.getMonth() + 1).padStart(2, '0')}-${String(captured.getDate()).padStart(2, '0')}`
    : ''
  return { metadata, taken }
}
