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
        class="bg-positive text-white q-mb-md"
        rounded
      >
        <template #avatar><q-icon name="check_circle" /></template>
        Modo automático activo — se usará el diálogo del navegador (PDF). No es necesario guardar
        impresora aquí: al imprimir, el sistema mostrará automáticamente el selector de destino del
        navegador con todas las impresoras instaladas localmente.
      </q-banner>
      <q-banner
        v-if="store.gdiAvailable && store.printers.length === 0 && !store.loading"
        class="bg-negative text-white q-mb-md"
        rounded
      >
        <template #avatar><q-icon name="warning" /></template>
        <div class="text-weight-medium">No se detectaron impresoras en el servidor</div>
        <div class="text-caption q-mt-xs">
          El servidor es Windows pero la enumeración GDI devolvió 0 resultados. Suele ocurrir cuando el
          backend se ejecuta con un usuario distinto al que instaló las impresoras (per-usuario) o el
          servicio de cola de impresión no está disponible.
        </div>
        <div class="text-caption q-mt-sm">
          Diagnóstico del servidor — usuario del backend: <b>{{ store.serverUser || 'desconocido' }}</b
          ><br />
          Comandos de verificación en el servidor:
          <code>Get-CimInstance Win32_Printer | Select Name,DriverName,PortName</code> |
          <code>Get-Printer | Select Name,DriverName,PortName</code> |
          <code>[System.Drawing.Printing.PrinterSettings]::InstalledPrinters</code>
        </div>
        <div class="text-caption q-mt-xs">
          Detectadas: {{ store.printers.length }} | GDI disponible: {{ store.gdiAvailable ? 'sí' : 'no' }}
          | Error: {{ store.error || 'ninguno' }}
        </div>
        <q-expansion-item
          v-if="store.diagnostico"
          dense
          class="q-mt-sm bg-white text-dark rounded-borders"
          label="Ver diagnóstico técnico (universal)"
          caption="Comparar con lo que ves en PowerShell manual"
        >
          <q-card flat bordered>
            <q-card-section class="q-pa-sm">
              <pre
                style="white-space: pre-wrap; word-break: break-all; font-size: 11px; max-height: 320px; overflow: auto"
                >{{ JSON.stringify(store.diagnostico, null, 2) }}</pre
              >
              <q-btn
                flat
                dense
                label="Recargar diagnóstico"
                icon="refresh"
                @click="recargarDiag"
                class="q-mt-sm"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <div v-else class="q-mt-sm">
          <q-btn flat dense label="Cargar diagnóstico" icon="bug_report" @click="recargarDiag" />
        </div>
      </q-banner>

      <!-- Impresora de Tickets - solo impresora -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">
            <q-icon name="receipt" size="18px" class="q-mr-xs" /> Impresora de Tickets
          </div>
          <div class="text-caption text-grey-7 q-mb-sm">
            Solo la impresora. El ancho del papel se configura aparte en “Formato de Ticket” abajo.
          </div>
          <q-select
            v-model="ticketPrinter"
            :options="printerOptions"
            label="Selecciona impresora para tickets (GDI silencioso - opcional)"
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
            hint="Opcional. Vacío = se usa el diálogo del navegador con todas las impresoras locales"
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
              <span v-if="ticketPrinter && ticketPrinter !== '__SIN_ASIGNAR__'">{{ ticketPrinter }}</span>
              <span v-else class="text-grey">— Sin seleccionar — (usará diálogo automático)</span>
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
          <div v-else-if="ticketPrinter && ticketPrinter !== '__SIN_ASIGNAR__'" class="text-caption text-grey-7 q-mt-sm">
            Guardada: {{ ticketPrinter }}
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Eliminar"
            color="negative"
            :disable="!configTicket || configTicket.nombre_impresora === '__SIN_ASIGNAR__'"
            @click="eliminar('ticket')"
          />
          <q-btn
            unelevated
            label="Guardar impresora"
            color="primary"
            :disable="!ticketPrinter || ticketPrinter === '__SIN_ASIGNAR__'"
            :loading="savingTicket"
            @click="guardarTicket"
          />
        </q-card-actions>
      </q-card>

      <!-- Formato de Ticket - desacoplado de impresora -->
      <q-card flat bordered class="q-mb-md" style="border-left: 4px solid var(--q-primary)">
        <q-card-section>
          <div class="text-subtitle2 q-mb-xs">
            <q-icon name="straighten" size="18px" class="q-mr-xs" /> Formato de Ticket
          </div>
          <div class="text-caption text-grey-7 q-mb-sm">
            Ancho del papel. Independiente de la impresora. Afecta tanto al preview PDF como a la impresión.
          </div>
          <div class="q-pa-sm rounded-borders" style="background: #f8fafc; border: 1px solid #e2e8f0">
            <div class="row items-center q-mb-xs">
              <span class="text-caption text-weight-medium">Ancho del ticket</span>
              <q-space />
              <q-badge outline color="primary" :label="`${ticketAncho}mm`" />
              <q-badge v-if="configTicket" class="q-ml-sm" color="grey-3" text-color="dark" :label="`Guardado: ${configTicket.ancho_mm}mm`" />
            </div>
            <q-btn-toggle
              v-model="ticketAncho"
              :options="[
                { label: '58mm', value: 58 },
                { label: '80mm', value: 80 },
                { label: 'A4', value: 210 },
              ]"
              dense
              spread
              toggle-color="primary"
              color="white"
              text-color="dark"
            />
            <div class="row items-center q-mt-sm q-gutter-x-sm">
              <div
                class="bg-white q-pa-xs rounded-borders"
                :style="{
                  width: ticketAncho === 58 ? '58px' : ticketAncho === 80 ? '80px' : '100px',
                  height: '32px',
                  border: '1px dashed #94a3b8',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  'font-size': '8px',
                  color: '#64748b',
                }"
              >
                {{ ticketAncho }}mm
              </div>
              <div class="col text-caption text-grey-7" style="line-height: 1.3">
                58mm = 32 chars/línea (estrecho) · 80mm = 48 chars (ancho estándar)<br />
                <span class="text-grey-5" style="font-size: 10px"
                  >GDI: {{ ticketAncho === 58 ? '228' : ticketAncho === 80 ? '315' : '794' }} dots @100dpi |
                  PDF: {{ ticketAncho === 58 ? '164.4' : ticketAncho === 80 ? '226.8' : '595' }}pt</span
                >
              </div>
            </div>
            <div v-if="ticketAncho === 58" class="text-caption text-amber-8 q-mt-xs">
              <q-icon name="info" size="12px" /> 58mm angosto — si se corta el texto, pasa a 80mm
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Preview con este ancho" icon="visibility" @click="preview('ticket')" :loading="previewing" />
          <q-btn
            unelevated
            label="Guardar formato"
            color="primary"
            :loading="savingFormato"
            @click="guardarFormato"
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
            label="Selecciona impresora para etiquetas (GDI silencioso - opcional)"
            outlined
            dense
            emit-value
            map-options
            clearable
            :loading="store.loading"
            hint="Opcional. Vacío = usará el diálogo del navegador"
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
import { ref, computed, onMounted } from 'vue'
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
const savingFormato = ref(false)
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

async function recargar(): Promise<void> {
  await store.cargarPrinters()
  await store.cargarConfig()
  if (configTicket.value) {
    const nombre = configTicket.value.nombre_impresora
    ticketPrinter.value = nombre === '__SIN_ASIGNAR__' ? null : nombre
    ticketAncho.value = configTicket.value.ancho_mm
  }
  if (configEtiqueta.value) etiquetaPrinter.value = configEtiqueta.value.nombre_impresora
}

async function recargarDiag(): Promise<void> {
  try {
    const { getPrintersDiag } = await import('@/api/printerApi')
    const diag = await getPrintersDiag()
    // @ts-ignore
    store.diagnostico = diag.diagnostico
    // @ts-ignore
    store.serverUser = diag.server?.user || null
  } catch {}
  await store.cargarPrinters()
}

onMounted(recargar)

async function guardarTicket(): Promise<void> {
  if (!ticketPrinter.value) return
  savingTicket.value = true
  try {
    const isManual = ticketMeta.value?.tipo_detectado === 'desconocida'
    const tipoDet = ticketMeta.value?.tipo_detectado || 'desconocida'
    // Guardar solo impresora — preservar ancho actual del formato
    const anchoActual = configTicket.value?.ancho_mm ?? ticketAncho.value
    await store.guardar(
      'ticket',
      ticketPrinter.value,
      anchoActual,
      anchoActual === 60 ? 40 : null,
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

async function guardarFormato(): Promise<void> {
  savingFormato.value = true
  try {
    await store.guardarFormato(ticketAncho.value, 'ticket', ticketAncho.value === 60 ? 40 : null)
    $q.notify({ type: 'positive', message: `Formato ${ticketAncho.value}mm guardado — preview y impresión usarán este ancho` })
    // refrescar preview automáticamente
    await preview('ticket')
  } catch (e: unknown) {
    $q.notify({ type: 'negative', message: (e as Error).message })
  } finally {
    savingFormato.value = false
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
    if (tipo === 'etiqueta') {
      const res = await store.imprimirDirecto({ tipo, printerName: printerName || undefined, ancho_mm: 60, lineas: ['WOOW KIDS - ETIQUETA', '60x40mm', 'Prueba OK', '----------------'] })
      lastResult.value = { printer: res.printer, fallback: res.fallback, error: (res as unknown as { error?: string }).error }
      if (res.fallback) $q.notify({ type: 'warning', message: 'Sin GDI — se generó PDF (fallback). Usa "Imprimir (iframe)"' })
      else $q.notify({ type: 'positive', message: `Prueba enviada a ${res.printer}` })
      return
    }
    // Ticket: usar mismo WYSIWYG que Preview (centrado, negritas, anchos) — no texto plano
    const demoOrden = {
      titulo: 'TICK-7027',
      fecha_hora: '2026-09-08T22:00:00+00:00',
      creado_por_nombre: 'Diana',
      nombre_cliente: null,
      total_final: 120,
      detalles: [{ producto_nombre: 'Hamburguesa Doble Tocino', cantidad: 1, precio_unitario: 120, importe: 120, notas_especiales: null, nombre_combo_padre: null }],
      metodos_pago: [{ metodo_pago_nombre: 'EFECTIVO', monto: 120 }],
    }
    const res = await store.imprimirDirecto({ tipo, printerName: printerName || undefined, ancho_mm: ticketAncho.value, data: { orden: demoOrden } as unknown as Record<string, unknown> })
    lastResult.value = {
      printer: res.printer,
      fallback: res.fallback,
      error: (res as unknown as { error?: string }).error,
    }
    if (res.fallback) {
      // Parpadeo = GDI no soporta PDF en esta térmica. Mostrar PDF WYSIWYG correcto y abrir diálogo navegador (mantiene centrado/negritas)
      pdfBase64.value = res.pdfBase64
      const errMsg = (res as unknown as { error?: string }).error
      $q.notify({
        type: 'warning',
        message: `GDI no imprimió (${errMsg || 'PDF no soportado'}) — se abrió Preview. Usa "Imprimir (iframe)" para imprimir con formato correcto ${ticketAncho.value}mm`,
      })
    } else {
      $q.notify({ type: 'positive', message: `Prueba enviada a ${res.printer} (${res.ancho_mm}mm)` })
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
