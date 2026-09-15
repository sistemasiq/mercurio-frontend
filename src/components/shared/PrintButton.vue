<template>
  <q-btn
    :label="label"
    :icon="icon"
    :color="color"
    :dense="dense"
    :loading="loading"
    :disable="disable"
    @click="handlePrint"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { printTicketDirecto } from '@/api/printerApi'
import { usePrinterFallback } from '@/composables/usePrinterFallback'

const props = withDefaults(
  defineProps<{
    label?: string
    icon?: string
    color?: string
    dense?: boolean
    disable?: boolean
    tipo?: 'ticket' | 'etiqueta'
    lineas?: string[]
    texto?: string
    printerName?: string
    anchoMm?: number
  }>(),
  {
    label: 'Imprimir',
    icon: 'print',
    color: 'primary',
    dense: false,
    disable: false,
    tipo: 'ticket',
    lineas: undefined,
    texto: undefined,
    printerName: undefined,
    anchoMm: undefined,
  },
)

const emit = defineEmits<{
  (e: 'printed', payload: { fallback?: boolean; printer: string }): void
}>()

const $q = useQuasar()
const { printPdfBase64ViaIframe } = usePrinterFallback()
const loading = ref(false)

async function handlePrint(): Promise<void> {
  loading.value = true
  try {
    const res = await printTicketDirecto({
      tipo: props.tipo,
      printerName: props.printerName,
      lineas: props.lineas,
      texto: props.texto,
      ancho_mm: props.anchoMm,
    })
    if (res.fallback) {
      printPdfBase64ViaIframe(res.pdfBase64)
      $q.notify({
        type: 'warning',
        message: 'Impresión PDF (fallback) — revisa el diálogo de impresión',
      })
    } else {
      $q.notify({ type: 'positive', message: `Impreso en ${res.printer}` })
    }
    emit('printed', { fallback: res.fallback, printer: res.printer })
  } catch (e: unknown) {
    $q.notify({ type: 'negative', message: (e as Error).message || 'Error al imprimir' })
  } finally {
    loading.value = false
  }
}
</script>
