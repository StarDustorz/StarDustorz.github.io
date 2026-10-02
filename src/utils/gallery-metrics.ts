/** Local preview instrumentation; never included in the production gallery. */
export function observeGalleryFrames(root: HTMLElement, signal: AbortSignal) {
  const samples: number[] = []
  let frame = 0
  let last = 0
  let activeUntil = 0
  let longTasks = 0
  const flush = () => {
    const sorted = [...samples].sort((a, b) => a - b)
    root.dataset.galleryMetrics = JSON.stringify({
      frames: samples.length,
      p95: Number((sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(1)),
      max: Number((sorted.at(-1) || 0).toFixed(1)),
      over32ms: samples.filter(value => value > 32).length,
      longTasks,
    })
  }
  const tick = (time: number) => {
    if (last)
      samples.push(time - last)
    if (samples.length > 600)
      samples.shift()
    last = time
    if (time < activeUntil) {
      frame = requestAnimationFrame(tick)
    }
    else {
      frame = 0
      last = 0
      flush()
    }
  }
  const activity = () => {
    activeUntil = performance.now() + 500
    frame ||= requestAnimationFrame(tick)
  }
  for (const event of ['wheel', 'pointermove', 'keydown', 'click'])
    root.addEventListener(event, activity, { passive: true, signal })
  const observer = new PerformanceObserver((list) => {
    if (performance.now() < activeUntil)
      longTasks += list.getEntries().length
  })
  if (PerformanceObserver.supportedEntryTypes.includes('longtask'))
    observer.observe({ type: 'longtask' })
  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
  }, { once: true })
}
