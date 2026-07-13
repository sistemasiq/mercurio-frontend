import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { pulserasApi } from '@/api/pulserasApi'

export interface EscaneoItem {
  codigo: string
  estado: 'pendiente' | 'success' | 'error'
  mensaje?: string
}

export const useRegistroPulserasStore = defineStore('registroPulseras', () => {
  const numeroDeLote = ref('')
  const escaneos = ref<EscaneoItem[]>([])
  const enviando = ref(false)

  const totalPendientes = computed(
    () => escaneos.value.filter((e) => e.estado === 'pendiente').length,
  )
  const totalRegistradas = computed(
    () => escaneos.value.filter((e) => e.estado === 'success').length,
  )
  const totalErrores = computed(() => escaneos.value.filter((e) => e.estado === 'error').length)
  const formularioHabilitado = computed(() => !!numeroDeLote.value.trim())

  function registrarPulsera(codigo: string) {
    escaneos.value.unshift({ codigo, estado: 'pendiente' })
  }

  async function enviarRegistros(sucursalId: string) {
    enviando.value = true
    for (const item of escaneos.value) {
      if (item.estado !== 'pendiente') continue
      try {
        await pulserasApi.crear({
          sucursal_id: sucursalId,
          pulsera_rfid: item.codigo,
          activo: true,
          numero_lote: numeroDeLote.value.trim() || undefined,
        })
        item.estado = 'success'
      } catch (err: unknown) {
        item.estado = 'error'
        item.mensaje = extraerMensajeError(err)
      }
    }
    enviando.value = false
  }

  function eliminarEscaneo(index: number) {
    escaneos.value.splice(index, 1)
  }

  function limpiarSesion() {
    numeroDeLote.value = ''
    escaneos.value = []
    enviando.value = false
  }

  return {
    numeroDeLote,
    escaneos,
    enviando,
    totalPendientes,
    totalRegistradas,
    totalErrores,
    formularioHabilitado,
    registrarPulsera,
    enviarRegistros,
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
    typeof err.response.data === 'object'
  ) {
    const data = err.response.data as Record<string, unknown>
    if (typeof data.message === 'string') return data.message
    if (typeof data.detail === 'string') return data.detail
  }
  return 'Error al registrar la pulsera'
}
