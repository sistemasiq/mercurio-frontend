<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 1100px; margin: 0 auto">
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">Pagos</div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Historial de pagos y anticipos por reservación.
          </div>
        </div>
        <q-space />
        <q-btn
          color="primary"
          icon="add"
          label="Registrar Pago"
          unelevated
          no-caps
          style="border-radius: 8px; font-weight: 600"
          @click="abrirDialog"
        />
      </div>

      <!-- Banner error -->
      <q-banner
        v-if="pagosStore.error"
        dense
        rounded
        class="bg-red-1 text-red-8 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="error_outline" color="negative" /></template>
        {{ pagosStore.error }}
        <template #action
          ><q-btn flat dense no-caps label="Reintentar" @click="pagosStore.cargar()"
        /></template>
      </q-banner>

      <!-- Tabla -->
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="filas"
          :columns="columns"
          row-key="id"
          flat
          :loading="pagosStore.loading || resStore.loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="No hay pagos registrados"
          class="fec-table"
        >
          <template #body-cell-monto="props">
            <q-td :props="props">
              <span class="text-positive" style="font-weight: 700">{{
                fmt(parseFloat(props.row.monto))
              }}</span>
            </q-td>
          </template>

          <template #body-cell-total="props">
            <q-td :props="props">
              {{ props.row.total ? fmt(props.row.total) : '—' }}
            </q-td>
          </template>

          <template #body-cell-restante="props">
            <q-td :props="props">
              <span
                :class="props.row.restante > 0 ? 'text-negative' : 'text-positive'"
                style="font-weight: 700"
              >
                {{ fmt(props.row.restante) }}
              </span>
            </q-td>
          </template>

          <template #body-cell-estado_pago="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.estado_pago === 'pagado' ? 'positive' : 'orange'"
                :label="props.row.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'"
                style="font-size: 0.72rem; padding: 4px 10px; border-radius: 20px"
              />
            </q-td>
          </template>

          <template #body-cell-fecha_pago="props">
            <q-td :props="props">
              {{ fmtFecha(props.row.fecha_pago) }}
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- ── Dialog Registrar Pago ───────────────────────────────────────────── -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 440px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-weight-bold">Registrar Pago</div>
        </q-card-section>
        <q-separator />

        <q-card-section class="q-gutter-md q-pt-md">
          <div>
            <div class="field-label">RESERVACIÓN</div>
            <q-select
              v-model="form.reservacion_id"
              dense
              outlined
              :options="reservacionOptions"
              emit-value
              map-options
              placeholder="Selecciona una reservación"
              :loading="resStore.loading"
              use-input
              input-debounce="0"
              @filter="filtrarReservaciones"
            />
          </div>
          <div>
            <div class="field-label">MÉTODO DE PAGO</div>
            <q-select
              v-model="form.metodo_pago_id"
              dense
              outlined
              :options="metodoOptions"
              emit-value
              map-options
              placeholder="Selecciona un método"
              :loading="metodosPagoStore.loading"
            />
          </div>
          <div>
            <div class="field-label">MONTO</div>
            <q-input v-model="form.monto" dense outlined type="number" prefix="$" min="1" />
          </div>
          <div>
            <div class="field-label">NOTAS (opcional)</div>
            <q-input
              v-model="form.notas"
              dense
              outlined
              type="textarea"
              rows="2"
              placeholder="Observaciones del pago"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="dialogOpen = false" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Registrar Pago"
            style="border-radius: 8px; font-weight: 600"
            :loading="guardando"
            :disable="!form.reservacion_id || !form.metodo_pago_id || !form.monto"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { usePagosReservacionesStore } from '@/stores/pagos_reservacion'
import { useReservacionesStore } from '@/stores/reservaciones'
import { useMetodosPagoStore } from '@/stores/metodos_pago'
import { useTiposEventoStore } from '@/stores/tipos_evento'
import { useAuthStore } from '@/stores/auth'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import type { ApiError } from '@/types/auth'

const $q = useQuasar()
const router = useRouter()
const turno = useTurnoCajaStore()
const pagosStore = usePagosReservacionesStore()
const resStore = useReservacionesStore()
const metodosPagoStore = useMetodosPagoStore()
const tiposEventoStore = useTiposEventoStore()
const authStore = useAuthStore()

onMounted(() => {
  pagosStore.cargar()
  if (!resStore.reservaciones.length) resStore.cargar(authStore.currentBranchId ?? undefined)
  metodosPagoStore.cargar()
  tiposEventoStore.cargar()
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// ── Tabla ─────────────────────────────────────────────────────────────────────

const columns: QTableColumn[] = [
  { name: 'cliente', label: 'CLIENTE', field: 'cliente', align: 'left', sortable: true },
  { name: 'evento', label: 'EVENTO', field: 'evento', align: 'left' },
  { name: 'metodo', label: 'MÉTODO DE PAGO', field: 'metodo', align: 'left' },
  { name: 'monto', label: 'PAGO', field: 'monto', align: 'left', sortable: true },
  { name: 'total', label: 'TOTAL', field: 'total', align: 'left', sortable: true },
  { name: 'restante', label: 'RESTANTE', field: 'restante', align: 'left', sortable: true },
  { name: 'estado_pago', label: 'ESTADO', field: 'estado_pago', align: 'left' },
  { name: 'fecha_pago', label: 'FECHA', field: 'fecha_pago', align: 'left', sortable: true },
  { name: 'notas', label: 'NOTAS', field: 'notas', align: 'left' },
]

// Total pagado por reservacion (suma de todos los pagos registrados)
const pagosPorReservacion = computed(() => {
  const map = new Map<string, number>()
  for (const p of pagosStore.pagos_reservacion) {
    map.set(p.reservacion_id, (map.get(p.reservacion_id) ?? 0) + parseFloat(p.monto))
  }
  return map
})

const filas = computed(() =>
  pagosStore.pagos_reservacion.map((p) => {
    const res = resStore.reservaciones.find((r) => r.id === p.reservacion_id)
    const metodo = metodosPagoStore.activos.find((m) => m.id === p.metodo_pago_id)
    const tipoEvento = tiposEventoStore.activos.find((t) => t.id === res?.tipo_evento_id)

    const total = parseFloat(res?.precio_total ?? '0')
    const totalPagado = pagosPorReservacion.value.get(p.reservacion_id) ?? 0
    const restante = Math.max(0, total - totalPagado)

    return {
      ...p,
      cliente: res
        ? `${res.nombre_cliente}${res.apellidos_cliente ? ' ' + res.apellidos_cliente : ''}`.trim()
        : p.reservacion_id.slice(0, 8) + '…',
      evento: tipoEvento?.nombre ?? '—',
      metodo: metodo?.nombre ?? '—',
      total,
      restante,
      estado_pago: restante <= 0 ? 'pagado' : 'pendiente',
    }
  }),
)

// ── Dialog ────────────────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const guardando = ref(false)

const form = ref({
  reservacion_id: null as string | null,
  metodo_pago_id: null as string | null,
  monto: null as number | null,
  notas: '',
})

const todasReservaciones = computed(() =>
  resStore.reservaciones.map((r) => ({
    label: `${r.nombre_cliente}${r.apellidos_cliente ? ' ' + r.apellidos_cliente : ''} — ${r.fecha_evento}`,
    value: r.id,
  })),
)

const reservacionOptions = ref(todasReservaciones.value)

const filtrarReservaciones = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    const q = val.toLowerCase()
    reservacionOptions.value = todasReservaciones.value.filter((o) =>
      o.label.toLowerCase().includes(q),
    )
  })
}

const metodoOptions = computed(() =>
  metodosPagoStore.activos.map((m) => ({ label: m.nombre, value: m.id })),
)

const abrirDialog = () => {
  // Se valida al hacer clic en "Registrar Pago", no hasta guardar: si no hay
  // turno abierto no tiene sentido dejar llenar el formulario para enterarse
  // hasta el final. Redirige de inmediato, sin bloquear ni avisar.
  if (!turno.estaOperando) {
    router.push('/pos/cierre')
    return
  }
  form.value = { reservacion_id: null, metodo_pago_id: null, monto: null, notas: '' }
  reservacionOptions.value = todasReservaciones.value
  dialogOpen.value = true
}

const guardar = async () => {
  if (!form.value.reservacion_id || !form.value.metodo_pago_id || !form.value.monto) return
  guardando.value = true
  try {
    await pagosStore.crearPagosReservacion({
      reservacion_id: form.value.reservacion_id,
      metodo_pago_id: form.value.metodo_pago_id,
      monto: String(form.value.monto),
      notas: form.value.notas || null,
    })
    $q.notify({ type: 'positive', message: 'Pago registrado correctamente', position: 'top-right' })
    dialogOpen.value = false
  } catch (err) {
    const apiErr = err as ApiError
    if (apiErr.code === 'TURNO_NO_ABIERTO') {
      // El turno se cerró entre abrir el diálogo y guardar (caso raro) — mismo
      // redirect silencioso, sin aviso.
      dialogOpen.value = false
      router.push('/pos/cierre')
    } else {
      $q.notify({ type: 'negative', message: 'Error al registrar el pago', position: 'top-right' })
    }
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped></style>
