export type LiveState = 'idle' | 'loading' | 'playing' | 'error'

/** A Live video is requested only in response to playback, never on page load. */
export function createLivePlayer(video: HTMLVideoElement, src: string, onState: (state: LiveState) => void) {
  let wanted = false
  let generation = 0
  const events = new AbortController()
  video.playsInline = true
  video.muted = true
  video.preload = 'none'
  const update = (state: LiveState) => {
    video.classList.toggle('playing', state === 'playing')
    onState(state)
  }
  const pause = () => {
    wanted = false
    generation++
    video.pause()
    update('idle')
  }
  const play = async () => {
    wanted = true
    const attempt = ++generation
    video.src ||= src
    if (video.ended)
      video.currentTime = 0
    update('loading')
    try {
      await video.play()
      if (attempt !== generation || !wanted)
        return
      update('playing')
    }
    catch {
      if (attempt === generation && wanted) {
        wanted = false
        update('error')
      }
    }
  }
  video.addEventListener('playing', () => {
    if (wanted)
      update('playing')
    else video.pause()
  }, { signal: events.signal })
  video.addEventListener('ended', () => {
    wanted = false
    update('idle')
  }, { signal: events.signal })
  video.addEventListener('error', () => {
    if (wanted) {
      wanted = false
      update('error')
    }
  }, { signal: events.signal })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden)
      pause()
  }, { signal: events.signal })
  return {
    video,
    play,
    pause,
    toggle: () => wanted ? pause() : play(),
    destroy: () => {
      pause()
      events.abort()
      video.removeAttribute('src')
      video.load()
      video.remove()
    },
  }
}
