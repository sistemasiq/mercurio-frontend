import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { createApp, ref } from 'vue'
import { resetAllStores, resetPlugin } from '@/utils/piniaReset'

const useDataStore = defineStore('dataTest', () => {
  const items = ref<string[]>([])
  const selected = ref<{ id: number } | null>(null)
  return { items, selected }
})

const useKeepStore = defineStore('keepTest', () => {
  const value = ref(0)
  return { value }
})

describe('resetAllStores', () => {
  beforeEach(() => {
    const pinia = createPinia()
    pinia.use(resetPlugin)
    // Pinia solo aplica los plugins una vez instalado en una app.
    createApp({}).use(pinia)
    setActivePinia(pinia)
  })

  it('devuelve los stores setup a su estado inicial', () => {
    const store = useDataStore()
    store.items.push('a', 'b')
    store.selected = { id: 3 }

    resetAllStores()

    expect(store.items).toEqual([])
    expect(store.selected).toBeNull()
  })

  it('respeta el listado de exclusión', () => {
    const data = useDataStore()
    const keep = useKeepStore()
    data.items.push('a')
    keep.value = 5

    resetAllStores(['keepTest'])

    expect(data.items).toEqual([])
    expect(keep.value).toBe(5)
  })

  it('puede resetear varias veces sin compartir referencias', () => {
    const store = useDataStore()
    store.items.push('a')
    resetAllStores()
    store.items.push('b')
    resetAllStores()

    expect(store.items).toEqual([])
  })
})
