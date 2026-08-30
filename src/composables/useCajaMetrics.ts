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
  let fetchingComandas = false
  let fetchingProductos = false

  async function refrescarComandas() {
    if (fetchingComandas || !authStore.currentBranchId) return
    fetchingComandas = true
    try {
      comandasActivas.value = await comandasApi.listar()
    } catch {
      // silently ignore polling errors
    } finally {
      fetchingComandas = false
    }
  }

  async function refrescarProductos() {
    if (fetchingProductos || !authStore.currentBranchId) return
    fetchingProductos = true
    try {
      productos.value = await obtenerProductos()
    } catch {
      // silently ignore
    } finally {
      fetchingProductos = false
    }
  }

  async function refrescarTodo() {
    if (!authStore.currentBranchId) return
    fetchingComandas = true
    fetchingProductos = true
    isLoading.value = true
    try {
      const [comandas, prods] = await Promise.all([comandasApi.listar(), obtenerProductos()])
      comandasActivas.value = comandas
      productos.value = prods
    } catch {
      // silently ignore
    } finally {
      fetchingComandas = false
      fetchingProductos = false
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
