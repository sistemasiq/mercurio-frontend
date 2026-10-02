import { isRef, toRaw } from 'vue'
import type { PiniaPluginContext } from 'pinia'

// Registro de funciones de reset por store. Se llena cuando Pinia crea cada
// store (ver plugin más abajo); los stores que nunca se instanciaron no
// necesitan reset porque no tienen datos.
const resetters = new Map<string, () => void>()

// structuredClone falla con proxies reactivos y con refs, así que se
// desenvuelve el valor (toRaw) en cada nivel antes de clonarlo. Los valores
// no clonables (funciones, instancias de clase) hacen que structuredClone
// lance, y el plugin cae a `$reset`.
function unwrap(value: unknown): unknown {
  const raw = toRaw(isRef(value) ? value.value : value)
  if (Array.isArray(raw)) return raw.map(unwrap)
  if (raw instanceof Map) return new Map([...raw].map(([k, v]) => [k, unwrap(v)]))
  if (raw instanceof Set) return new Set([...raw].map(unwrap))
  if (raw && typeof raw === 'object' && Object.getPrototypeOf(raw) === Object.prototype) {
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, unwrap(v)]))
  }
  return raw
}

function cloneState(state: unknown): unknown {
  return structuredClone(unwrap(state))
}

/**
 * Plugin de Pinia: guarda por cada store una función que lo devuelve a su
 * estado inicial. Los stores *setup* no soportan `$reset`, así que se captura
 * una copia del `$state` al crearse y se restaura con `$patch`.
 */
export function resetPlugin({ store }: PiniaPluginContext): void {
  let initial: unknown = null
  let canClone = true
  try {
    initial = cloneState(store.$state)
  } catch {
    canClone = false
  }

  resetters.set(store.$id, () => {
    if (canClone) {
      const snapshot = cloneState(initial) as Record<string, unknown>
      store.$patch((state: Record<string, unknown>) => {
        Object.assign(state, snapshot)
      })
      return
    }
    // Valor no clonable en el estado: usar $reset cuando exista (options stores).
    try {
      store.$reset()
    } catch {
      // Setup store sin forma de resetearse: se deja intacto, pero se avisa
      // para que un store con datos personales no pase desapercibido.
      console.warn('[piniaReset] no se pudo reiniciar el store', store.$id)
    }
  })
}

/**
 * Devuelve todos los stores instanciados a su estado inicial. Se usa al cerrar
 * sesión para que los datos de un usuario no pasen al siguiente en una
 * terminal compartida. `exclude` evita resetear stores que ya se limpian solos.
 */
export function resetAllStores(exclude: string[] = []): void {
  for (const [id, reset] of resetters) {
    if (exclude.includes(id)) continue
    reset()
  }
}
