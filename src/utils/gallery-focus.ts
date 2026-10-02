/** Fit an expanded original above its caption while retaining its aspect ratio. */
export function expandedPhotoSize(viewportWidth: number, viewportHeight: number, photoWidth: number, photoHeight: number, captionHeight = 0, view: 'preview' | 'fullscreen' = 'fullscreen') {
  const ratio = photoWidth > 0 && photoHeight > 0 ? photoWidth / photoHeight : 4 / 3
  const maxWidth = Math.max(1, view === 'preview' ? Math.min(720, viewportWidth * 0.52) : Math.min(1800, viewportWidth - (viewportWidth <= 600 ? 24 : 80)))
  const maxHeight = Math.max(1, (view === 'preview' ? viewportHeight * 0.62 : viewportHeight - 64) - (captionHeight ? captionHeight + 16 : 0))
  const width = Math.min(maxWidth, maxHeight * ratio)
  return { width, height: width / ratio }
}
