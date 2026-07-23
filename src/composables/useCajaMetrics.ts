import { ref, onMounted, onBeforeUnmount } from 'vue'
import { comandasApi } from '@/api/comandasApi'
import { obtenerProductos } from '@/services/productoService'
import { useAuthStore } from '@/stores/auth'
import type { Comanda } from '@/types/comanda'
import type { Producto } from '@/types/producto'

const INTERVALO_MS = 15_000

export function useCajaMetrics() {
  const authStore = useAuthStore()

  const comandasActivas = ref<Comanda[]>([])
  const productos = ref<Producto[]>([])
  const isLoading = ref(false)

  let intervalId: ReturnType<typeof setInterval> | null = null
  let fetching = false

  async function refrescarComandas() {
    if (fetching || !authStore.currentBranchId) return
    fetching = true
    try {
      comandasActivas.value = await comandasApi.listar()
    } catch {
      // silently ignore polling errors
    } finally {
      fetching = false
    }
  }

  async function refrescarProductos() {
    if (fetching || !authStore.currentBranchId) return
    fetching = true
    try {
      productos.value = await obtenerProductos()
    } catch {
      // silently ignore
    } finally {
      fetching = false
    }
  }

  async function refrescarTodo() {
    if (fetching || !authStore.currentBranchId) return
    fetching = true
    isLoading.value = true
    try {
      const [comandas, prods] = await Promise.all([comandasApi.listar(), obtenerProductos()])
      comandasActivas.value = comandas
      productos.value = prods
    } catch {
      // silently ignore
    } finally {
      fetching = false
      isLoading.value = false
    }
  }

  function iniciarPolling() {
    detenerPolling()
    intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refrescarComandas()
      }
    }, INTERVALO_MS)
  }

  function detenerPolling() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      void refrescarComandas()
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    iniciarPolling()
  })

  onBeforeUnmount(() => {
    detenerPolling()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  return {
    comandasActivas,
    productos,
    isLoading,
    refrescarComandas,
    refrescarProductos,
    refrescarTodo,
  }
}
