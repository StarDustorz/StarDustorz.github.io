export const photoFields = {
  camera: ['相机', 'Camera'],
  lens: ['镜头', 'Lens'],
  focalLength: ['焦距', 'Focal length'],
  aperture: ['光圈', 'Aperture'],
  shutter: ['快门', 'Shutter'],
  iso: ['感光度', 'ISO'],
  exposure: ['曝光补偿', 'Exposure'],
  location: ['地点', 'Location'],
} as const
export type PhotoMetadata = Partial<Record<keyof typeof photoFields, string>>
export function parameterText(metadata: PhotoMetadata = {}) {
  return Object.keys(photoFields).map(key => metadata[key as keyof PhotoMetadata]).filter(Boolean).join(' · ')
}
export function safeMediaURL(value: string | undefined) {
  try {
    const url = new URL(value || '')
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''
  }
  catch { return '' }
}
