/** Inclusive start, exclusive end; work is bounded by the viewport, not album size. */
export function stackWindow(total: number, position: number, radius = 16) {
  const center = Math.max(0, Math.min(total - 1, Math.round(position)))
  const reach = Math.max(1, Math.min(16, Math.ceil(radius)))
  return { start: Math.max(0, center - reach), end: Math.min(total, center + reach + 1) }
}

export function gridWindow(total: number, columns: number, scrollTop: number, viewportHeight: number, rowPitch: number) {
  const rows = Math.ceil(total / columns)
  const first = Math.max(0, Math.min(rows - 1, Math.floor(Math.max(0, scrollTop) / rowPitch)))
  const start = Math.max(0, first - 2) * columns
  const end = Math.min(total, (first + Math.ceil(viewportHeight / rowPitch) + 3) * columns)
  return { start, end, height: rows * rowPitch + 200 }
}
