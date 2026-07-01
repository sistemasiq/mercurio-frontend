const EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const
const PASSIVE: AddEventListenerOptions = { passive: true }

let timerId: ReturnType<typeof setTimeout> | null = null
let _ms = 0
let _cb: (() => void) | null = null
let _active = false

function reset(): void {
  if (!_active) return
  if (timerId !== null) clearTimeout(timerId)
  timerId = setTimeout(() => {
    _cb?.()
  }, _ms)
}

export const inactivityTimer = {
  init(onTimeout: () => void, ms: number): void {
    _cb = onTimeout
    _ms = ms
  },

  start(): void {
    if (_active) return
    _active = true
    EVENTS.forEach((e) => window.addEventListener(e, reset, PASSIVE))
    reset()
  },

  stop(): void {
    _active = false
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
    EVENTS.forEach((e) => window.removeEventListener(e, reset))
  },
}
