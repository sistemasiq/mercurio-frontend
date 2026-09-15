<template>
  <q-page class="printer-config-page">
    <div class="q-pa-lg" style="max-width: 960px; margin: 0 auto">
      <div class="row items-center q-mb-md">
        <q-icon name="print" size="28px" color="primary" class="q-mr-sm" />
        <div>
          <div class="text-h6">Configuración de Impresión</div>
          <div class="text-caption text-grey-7">
            1 botón = imprimir — cualquier impresora con driver Windows (USB/Red/Bluetooth)
          </div>
        </div>
        <q-space />
        <q-btn
          flat
          dense
          icon="refresh"
          label="Detectar"
          :loading="store.loading"
          @click="recargar"
        />
      </div>

      <q-banner v-if="store.error" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar><q-icon name="warning" /></template>
        {{ store.error }}
      </q-banner>

      <q-banner
        v-if="!store.gdiAvailable && !store.loading"
        class="bg-amber-2 text-dark q-mb-md"
        rounded
      >
        <template #avatar><q-icon name="info" /></template>
        No se detectaron impresoras GDI (Docker/Linux). Se usará fallback PDF + window.print() en
        iframe.
      </q-banner>

      <!-- Tickets -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">
            <q-icon name="receipt" size="18px" class="q-mr-xs" /> Impresora de Tickets
          </div>
          <q-select
            v-model="ticketPrinter"
            :options="printerOptions"
            label="Selecciona impresora para tickets"
            outlined
            dense
            emit-value
            map-options
            clearable
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            :loading="store.loading"
            hint="Nombre exacto como aparece en Windows"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.driver }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="badgeColor(scope.opt.tipo)"
                    :label="badgeLabel(scope.opt.tipo)"
                  />
                </q-item-section>
              </q-item>
            </template>
            <template #selected>
              <span v-if="ticketPrinter">{{ ticketPrinter }}</span>
              <span v-else class="text-grey">— Sin seleccionar —</span>
            </template>
          </q-select>

          <!-- Badge detectado -->
          <div v-if="ticketMeta" class="q-mt-sm">
            <q-badge
              :color="badgeColor(ticketMeta.tipo_detectado)"
              :label="badgeLabel(ticketMeta.tipo_detectado)"
            />
            <span class="text-caption q-ml-sm"
              >Driver: {{ ticketMeta.DriverName || '—' }} | Puerto:
              {{ ticketMeta.PortName || '—' }}</span
            >
          </div>

          <!-- Selector manual si desconocida -->
          <div v-if="ticketMeta && ticketMeta.tipo_detectado === 'desconocida'" class="q-mt-sm">
            <div class="text-caption q-mb-xs">Tipo no detectado — selecciona manualmente:</div>
            <q-btn-toggle
              v-model="ticketAncho"
              :options="[
                { label: '58mm', value: 58 },
                { label: '80mm', value: 80 },
                { label: 'Etiqueta 60x40', value: 60 },
                { label: 'A4', value: 210 },
              ]"
              dense
              toggle-color="primary"
              color="grey-4"
              text-color="dark"
            />
          </div>
          <div v-else-if="ticketMeta" class="q-mt-sm text-caption">
            Ancho sugerido: <b>{{ ticketAncho }}mm</b> (auto según detección)
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Eliminar"
            color="negative"
            :disable="!configTicket"
            @click="eliminar('ticket')"
          />
          <q-btn
            unelevated
            label="Guardar ticket"
            color="primary"
            :disable="!ticketPrinter"
            :loading="savingTicket"
            @click="guardarTicket"
          />
        </q-card-actions>
      </q-card>

      <!-- Etiquetas -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">
            <q-icon name="label" size="18px" class="q-mr-xs" /> Impresora de Etiquetas (60×40mm)
          </div>
          <q-select
            v-model="etiquetaPrinter"
            :options="printerOptions"
            label="Selecciona impresora para etiquetas (opcional)"
            outlined
            dense
            emit-value
            map-options
            clearable
            :loading="store.loading"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.driver }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="badgeColor(scope.opt.tipo)"
                    :label="badgeLabel(scope.opt.tipo)"
                  />
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <div v-if="etiquetaMeta" class="q-mt-sm">
            <q-badge
              :color="badgeColor(etiquetaMeta.tipo_detectado)"
              :label="badgeLabel(etiquetaMeta.tipo_detectado)"
            />
            <span class="text-caption q-ml-sm">Driver: {{ etiquetaMeta.DriverName || '—' }}</span>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Eliminar"
            color="negative"
            :disable="!configEtiqueta"
            @click="eliminar('etiqueta')"
          />
          <q-btn
            unelevated
            label="Guardar etiqueta"
            color="primary"
            :disable="!etiquetaPrinter"
            :loading="savingEtiqueta"
            @click="guardarEtiqueta"
          />
        </q-card-actions>
      </q-card>

      <!-- Acciones prueba -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">Probar impresión</div>
          <div class="row q-gutter-sm">
            <q-btn
              unelevated
              color="primary"
              icon="print"
              label="Probar impresión (ticket)"
              :loading="testing"
              @click="probar('ticket')"
            />
            <q-btn
              outline
              color="primary"
              icon="label"
              label="Probar etiqueta"
              :loading="testing"
              @click="probar('etiqueta')"
            />
            <q-btn
              outline
              icon="visibility"
              label="Preview PDF"
              :loading="previewing"
              @click="preview('ticket')"
            />
          </div>
          <div v-if="lastResult" class="q-mt-sm text-caption">
            <q-badge
              :color="lastResult.fallback ? 'warning' : 'positive'"
              :label="lastResult.fallback ? 'Fallback PDF' : 'Enviado a ' + lastResult.printer"
            />
            <span v-if="lastResult.error" class="text-negative q-ml-sm">{{
              lastResult.error
            }}</span>
          </div>
        </q-card-section>
      </q-card>

      <!-- Preview PDF -->
      <q-card v-if="pdfUrl" flat bordered>
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <div class="text-subtitle2">Preview PDF</div>
            <q-space />
            <q-btn flat dense icon="download" label="Descargar" @click="descargar" />
            <q-btn flat dense icon="print" label="Imprimir (iframe)" @click="imprimirIframe" />
          </div>
          <iframe
            :src="pdfUrl"
            style="width: 100%; height: 480px; border: 1px solid #ddd; border-radius: 8px"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { usePrinterStore } from '@/stores/printer'
import { usePrinterFallback } from '@/composables/usePrinterFallback'

const $q = useQuasar()
const store = usePrinterStore()
const { printPdfBase64ViaIframe, downloadPdfBase64, pdfDataUrl } = usePrinterFallback()

const ticketPrinter = ref<string | null>(null)
const etiquetaPrinter = ref<string | null>(null)
const ticketAncho = ref<number>(58)
const savingTicket = ref(false)
const savingEtiqueta = ref(false)
const testing = ref(false)
const previewing = ref(false)
const lastResult = ref<{ printer: string; fallback?: boolean; error?: string } | null>(null)
const pdfBase64 = ref<string | null>(null)

const pdfUrl = computed(() => (pdfBase64.value ? pdfDataUrl(pdfBase64.value) : null))

const printerOptions = computed(() =>
  store.printers.map((p) => ({
    label: p.Name,
    value: p.Name,
    driver: p.DriverName || '—',
    tipo: p.tipo_detectado,
  })),
)

const ticketMeta = computed(
  () => store.printers.find((p) => p.Name === ticketPrinter.value) || null,
)
const etiquetaMeta = computed(
  () => store.printers.find((p) => p.Name === etiquetaPrinter.value) || null,
)

const configTicket = computed(() => store.configPorTipo('ticket'))
const configEtiqueta = computed(() => store.configPorTipo('etiqueta'))

function badgeLabel(tipo: string): string {
  const m: Record<string, string> = {
    ticket_58: 'Detectado: Ticket 58mm',
    ticket_80: 'Detectado: Ticket 80mm',
    etiqueta_60x40: 'Detectado: Etiqueta 60x40',
    a4: 'Detectado: A4',
    desconocida: 'Detectado: Desconocida',
  }
  return m[tipo] || 'Detectado: Desconocida'
}
function badgeColor(tipo: string): string {
  if (tipo === 'ticket_58' || tipo === 'ticket_80') return 'primary'
  if (tipo === 'etiqueta_60x40') return 'positive'
  if (tipo === 'a4') return 'grey-7'
  return 'warning'
}

watch(ticketMeta, (m) => {
  if (!m) return
  if (m.tipo_detectado === 'ticket_80') ticketAncho.value = 80
  else if (m.tipo_detectado === 'etiqueta_60x40') ticketAncho.value = 60
  else if (m.tipo_detectado === 'a4') ticketAncho.value = 210
  else ticketAncho.value = 58
})

async function recargar(): Promise<void> {
  await store.cargarPrinters()
  await store.cargarConfig()
  if (configTicket.value) {
    ticketPrinter.value = configTicket.value.nombre_impresora
    ticketAncho.value = configTicket.value.ancho_mm
  }
  if (configEtiqueta.value) etiquetaPrinter.value = configEtiqueta.value.nombre_impresora
}

onMounted(recargar)

async function guardarTicket(): Promise<void> {
  if (!ticketPrinter.value) return
  savingTicket.value = true
  try {
    const isManual = ticketMeta.value?.tipo_detectado === 'desconocida'
    const tipoDet =
      ticketMeta.value?.tipo_detectado ||
      (ticketAncho.value === 80
        ? 'ticket_80'
        : ticketAncho.value === 60
          ? 'etiqueta_60x40'
          : ticketAncho.value === 210
            ? 'a4'
            : 'ticket_58')
    await store.guardar(
      'ticket',
      ticketPrinter.value,
      ticketAncho.value,
      ticketAncho.value === 60 ? 40 : null,
      tipoDet,
      isManual,
    )
    $q.notify({ type: 'positive', message: 'Impresora de tickets guardada' })
  } catch (e: unknown) {
    $q.notify({ type: 'negative', message: (e as Error).message })
  } finally {
    savingTicket.value = false
  }
}

async function guardarEtiqueta(): Promise<void> {
  if (!etiquetaPrinter.value) return
  savingEtiqueta.value = true
  try {
    const m = etiquetaMeta.value
    await store.guardar(
      'etiqueta',
      etiquetaPrinter.value,
      60,
      40,
      m?.tipo_detectado || 'etiqueta_60x40',
      m?.tipo_detectado === 'desconocida',
    )
    $q.notify({ type: 'positive', message: 'Impresora de etiquetas guardada' })
  } catch (e: unknown) {
    $q.notify({ type: 'negative', message: (e as Error).message })
  } finally {
    savingEtiqueta.value = false
  }
}

async function eliminar(tipo: 'ticket' | 'etiqueta'): Promise<void> {
  try {
    const { deleteConfig } = await import('@/api/printerApi')
    await deleteConfig(tipo)
    await store.cargarConfig()
    if (tipo === 'ticket') ticketPrinter.value = null
    else etiquetaPrinter.value = null
    $q.notify({ type: 'info', message: `Config ${tipo} eliminada` })
  } catch (e: unknown) {
    $q.notify({ type: 'negative', message: (e as Error).message })
  }
}

async function probar(tipo: 'ticket' | 'etiqueta'): Promise<void> {
  testing.value = true
  try {
    const printerName = tipo === 'ticket' ? ticketPrinter.value : etiquetaPrinter.value
    const res = await store.imprimirDirecto({ tipo, printerName: printerName || undefined })
    pdfBase64.value = res.pdfBase64
    lastResult.value = {
      printer: res.printer,
      fallback: res.fallback,
      error: (res as unknown as { error?: string }).error,
    }
    if (res.fallback) {
      $q.notify({
        type: 'warning',
        message: 'Sin GDI — se generó PDF (fallback). Usa "Imprimir (iframe)"',
      })
    } else {
      $q.notify({ type: 'positive', message: `Prueba enviada a ${res.printer}` })
    }
  } catch (e: unknown) {
    $q.notify({ type: 'negative', message: (e as Error).message })
  } finally {
    testing.value = false
  }
}

async function preview(tipo: 'ticket' | 'etiqueta'): Promise<void> {
  previewing.value = true
  try {
    const b64 = await store.preview({
      tipo,
      ancho_mm: tipo === 'etiqueta' ? 60 : ticketAncho.value,
    })
    pdfBase64.value = b64
  } catch (e: unknown) {
    $q.notify({ type: 'negative', message: (e as Error).message })
  } finally {
    previewing.value = false
  }
}

function descargar(): void {
  if (pdfBase64.value) downloadPdfBase64(pdfBase64.value, 'ticket_preview.pdf')
}
function imprimirIframe(): void {
  if (pdfBase64.value) printPdfBase64ViaIframe(pdfBase64.value)
}
</script>

<style scoped>
.printer-config-page {
  background: var(--bg-main);
}
</style>
