import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { pulserasApi } from '@/api/pulserasApi'
import type { EstadoPulseraInicial } from '@/types/pulsera'

export interface EscaneoItem {
  codigo: string
  estado: 'success' | 'error'
  mensaje?: string
}

export const useRegistroPulserasStore = defineStore('registroPulseras', () => {
  const numeroDeLote = ref('')
  const estadoInicial = ref<EstadoPulseraInicial>('disponible')
  const escaneos = ref<EscaneoItem[]>([])
  const registrando = ref(false)
  const error = ref<string | null>(null)

  const totalRegistradas = computed(
    () => escaneos.value.filter((e) => e.estado === 'success').length,
  )
  const totalErrores = computed(() => escaneos.value.filter((e) => e.estado === 'error').length)
  const formularioHabilitado = computed(() => !!numeroDeLote.value.trim())

  async function registrarPulsera(codigo: string, sucursalId: string) {
    registrando.value = true
    error.value = null
    try {
      await pulserasApi.crear({
        sucursal_id: sucursalId,
        pulsera_rfid: codigo,
        activo: estadoInicial.value === 'disponible',
        numero_lote: numeroDeLote.value.trim() || undefined,
      })
      escaneos.value.unshift({ codigo, estado: 'success' })
    } catch (err: unknown) {
      const mensaje = extraerMensajeError(err)
      escaneos.value.unshift({ codigo, estado: 'error', mensaje })
    } finally {
      registrando.value = false
    }
  }

  function eliminarEscaneo(index: number) {
    escaneos.value.splice(index, 1)
  }

  function limpiarSesion() {
    numeroDeLote.value = ''
    estadoInicial.value = 'disponible'
    escaneos.value = []
    registrando.value = false
    error.value = null
  }

  return {
    numeroDeLote,
    estadoInicial,
    escaneos,
    registrando,
    error,
    totalRegistradas,
    totalErrores,
    formularioHabilitado,
    registrarPulsera,
    eliminarEscaneo,
    limpiarSesion,
  }
})

function extraerMensajeError(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object' &&
    'message' in err.response.data &&
    typeof err.response.data.message === 'string'
  ) {
    return err.response.data.message
  }
  return 'Error al registrar la pulsera'
}
