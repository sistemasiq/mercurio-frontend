<template>
  <q-page class="page-content list-page">
    <PageHeader title="Pagos" subtitle="Anticipos y liquidaciones de reservaciones.">
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Registrar Pago"
          :disable="!authStore.currentBranchId"
          @click="abrirDialog"
        />
      </template>
    </PageHeader>

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <div class="kpi-row">
      <KpiCard
        label="Cobrado este mes"
        :value="fmt(cobradoMes)"
        :note="`${pagosMes.length} pagos`"
      />
      <KpiCard
        label="Por cobrar"
        :value="fmt(porCobrar)"
        :note="`${reservacionesPorCobrar.length} eventos`"
        note-tone="warn"
      />
      <KpiCard label="Pagos registrados" :value="pagosStore.pagos_reservacion.length" />
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      search-placeholder="Buscar cliente o evento"
      :filters="FILTROS"
      :count="`${filasVisibles.length} pagos`"
    >
      <StateBlock
        v-if="pagosStore.error"
        variant="error"
        :body="pagosStore.error"
        action-label="Reintentar"
        @action="pagosStore.cargar()"
      />
      <q-table
        v-else
        :rows="filasVisibles"
        :columns="columns"
        row-key="id"
        flat
        :loading="pagosStore.loading || resStore.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-cliente="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.cliente }}</q-td>
        </template>
        <template #body-cell-evento="props">
          <q-td :props="props" class="cell-muted">{{ props.row.evento }}</q-td>
        </template>
        <template #body-cell-monto="props">
          <q-td :props="props" class="text-weight-bold">{{
            fmt(parseFloat(props.row.monto))
          }}</q-td>
        </template>
        <template #body-cell-total="props">
          <q-td :props="props" class="text-weight-bold">
            {{ props.row.total ? fmt(props.row.total) : '—' }}
          </q-td>
        </template>
        <template #body-cell-restante="props">
          <q-td
            :props="props"
            class="text-weight-bold"
            :class="{ 'saldo--due': props.row.restante > 0 }"
          >
            {{ fmt(props.row.restante) }}
          </q-td>
        </template>
        <template #body-cell-estado_pago="props">
          <q-td :props="props">
            <StatusBadge
              :tone="props.row.estado_pago === 'pagado' ? 'ok' : 'warn'"
              :label="props.row.estado_pago === 'pagado' ? 'Liquidado' : 'Parcial'"
            />
          </q-td>
        </template>
        <template #body-cell-fecha_pago="props">
          <q-td :props="props">
            {{ fmtFecha(props.row.fecha_pago) }}
            <q-tooltip v-if="props.row.notas">{{ props.row.notas }}</q-tooltip>
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="busqueda || filtro !== 'todos' ? 'no-results' : 'empty'"
            :title="busqueda || filtro !== 'todos' ? undefined : 'No hay pagos registrados'"
            :body="
              busqueda || filtro !== 'todos'
                ? undefined
                : 'Registra el primer pago de una reservación.'
            "
          />
        </template>
      </q-table>
    </DataTableCard>

    <BaseDialog
      v-model="dialogOpen"
      title="Registrar pago"
      subtitle="Abono a una reservación existente"
      icon="payments"
      tone="green"
      :width="560"
      persistent
      primary-label="Registrar pago"
      :loading="guardando"
      :primary-disabled="!form.reservacion_id || !form.metodo_pago_id || !form.monto"
      @confirm="guardar"
    >
      <div class="pago-form">
        <label class="pago-form__field pago-form__field--full">
          <span class="field-label">Reservación</span>
          <q-select
            v-model="form.reservacion_id"
            dense
            outlined
            :options="reservacionOptions"
            emit-value
            map-options
            placeholder="Busca una reservación"
            :loading="resStore.loading"
            use-input
            input-debounce="0"
            @filter="filtrarReservaciones"
          >
            <template #append><q-icon name="search" size="19px" /></template>
          </q-select>
        </label>
        <label class="pago-form__field">
          <span class="field-label">Monto</span>
          <q-input
            v-model="form.monto"
            dense
            outlined
            type="number"
            prefix="$"
            min="0.01"
            :rules="[
              (val: number) => Number(val) > 0 || 'El monto debe ser mayor a $0',
              (val: number) =>
                Number(val) <= redondear2(restanteSeleccionado) + TOLERANCIA_MONTO ||
                'El monto no puede superar el saldo pendiente',
            ]"
          />
        </label>
        <label class="pago-form__field">
          <span class="field-label">Método de pago</span>
          <q-select
            v-model="form.metodo_pago_id"
            dense
            outlined
            :options="metodoOptions"
            emit-value
            map-options
            placeholder="Selecciona"
            :loading="metodosPagoStore.loading"
          />
        </label>
        <label class="pago-form__field pago-form__field--full">
          <span class="field-label">Notas</span>
          <q-input
            v-model="form.notas"
            dense
            outlined
            type="textarea"
            rows="2"
            placeholder="Referencia, autorización u observaciones (opcional)"
          />
        </label>
      </div>
      <dl v-if="resumenDialog" class="pago-totals">
        <div>
          <dt>Total del evento</dt>
          <dd>{{ fmt(resumenDialog.total) }}</dd>
        </div>
        <div>
          <dt>Pagado</dt>
          <dd>{{ fmt(resumenDialog.pagado) }}</dd>
        </div>
        <div class="pago-totals__net">
          <dt>Restante después del pago</dt>
          <dd>{{ fmt(resumenDialog.restante) }}</dd>
        </div>
      </dl>
    </BaseDialog>
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
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip } from '@/types/ui'
import { redondear2, TOLERANCIA_MONTO } from '@/utils/dinero'

const $q = useQuasar()
const router = useRouter()
const turno = useTurnoCajaStore()
const pagosStore = usePagosReservacionesStore()
const resStore = useReservacionesStore()
const metodosPagoStore = useMetodosPagoStore()
const tiposEventoStore = useTiposEventoStore()
const authStore = useAuthStore()

onMounted(() => {
  // Métodos de pago es un catálogo global por diseño (ver migración 037):
  // se carga siempre, tenga o no el sysadmin una sucursal elegida.
  metodosPagoStore.cargar()

  if (!authStore.currentBranchId) return
  pagosStore.cargar()
  if (!resStore.reservaciones.length) resStore.cargar(authStore.currentBranchId)
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
  { name: 'cliente', label: 'Cliente', field: 'cliente', align: 'left', sortable: true },
  { name: 'evento', label: 'Evento', field: 'evento', align: 'left' },
  { name: 'metodo', label: 'Método', field: 'metodo', align: 'left' },
  { name: 'monto', label: 'Pago', field: 'monto', align: 'right', sortable: true },
  { name: 'total', label: 'Total', field: 'total', align: 'right', sortable: true },
  { name: 'restante', label: 'Restante', field: 'restante', align: 'right', sortable: true },
  { name: 'estado_pago', label: 'Estado', field: 'estado_pago', align: 'left' },
  { name: 'fecha_pago', label: 'Fecha', field: 'fecha_pago', align: 'left', sortable: true },
]

// ── Filtros y KPIs ────────────────────────────────────────────────────────────

type Filtro = 'todos' | 'pagado' | 'pendiente'
const FILTROS: FilterChip<Filtro>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Liquidados', value: 'pagado' },
  { label: 'Parciales', value: 'pendiente' },
]
const filtro = ref<Filtro | null>('todos')
const busqueda = ref('')

const filasVisibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return filas.value
    .filter((f) => filtro.value === 'todos' || f.estado_pago === filtro.value)
    .filter((f) => !q || `${f.cliente} ${f.evento}`.toLowerCase().includes(q))
})

const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
const pagosMes = computed(() =>
  pagosStore.pagos_reservacion.filter((p) => new Date(p.fecha_pago) >= inicioMes),
)
const cobradoMes = computed(() => pagosMes.value.reduce((s, p) => s + parseFloat(p.monto), 0))
const reservacionesPorCobrar = computed(() => {
  const ids = new Set(filas.value.filter((f) => f.restante > 0).map((f) => f.reservacion_id))
  return [...ids]
})
const porCobrar = computed(() =>
  reservacionesPorCobrar.value.reduce(
    (s, id) => s + (filas.value.find((f) => f.reservacion_id === id)?.restante ?? 0),
    0,
  ),
)

// Resumen del diálogo para la reservación elegida.
const resumenDialog = computed(() => {
  const res = resStore.reservaciones.find((r) => r.id === form.value.reservacion_id)
  if (!res) return null
  const total = parseFloat(res.precio_total ?? '0')
  const pagado = pagosPorReservacion.value.get(res.id) ?? 0
  const monto = parseFloat(String(form.value.monto || 0)) || 0
  return { total, pagado, restante: Math.max(0, total - pagado - monto) }
})

// Saldo pendiente de la reservación elegida SIN restar el monto capturado:
// es el tope contra el que se valida el pago (no se puede cobrar de más).
const restanteSeleccionado = computed(() => {
  const res = resStore.reservaciones.find((r) => r.id === form.value.reservacion_id)
  if (!res) return 0
  const total = parseFloat(res.precio_total ?? '0')
  const pagado = pagosPorReservacion.value.get(res.id) ?? 0
  return Math.max(0, redondear2(total) - redondear2(pagado))
})

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
  const monto = Number(form.value.monto)
  if (!(monto > 0) || monto > redondear2(restanteSeleccionado.value) + TOLERANCIA_MONTO) {
    $q.notify({
      type: 'warning',
      message: 'El monto debe ser mayor a $0 y no superar el saldo pendiente.',
      position: 'top-right',
    })
    return
  }
  guardando.value = true
  try {
    await pagosStore.crearPagosReservacion({
      reservacion_id: form.value.reservacion_id,
      metodo_pago_id: form.value.metodo_pago_id,
      monto: String(monto),
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

<style scoped lang="scss">
.saldo--due {
  color: var(--tone-bad-fg);
}

.pago-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  &__field {
    display: flex;
    flex-direction: column;
    min-width: 0;

    &--full {
      grid-column: 1 / -1;
    }
  }
}

.pago-totals {
  margin: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f6f8fc;
  display: flex;
  flex-direction: column;
  gap: 8px;

  div {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 13.5px;
    color: #475569;
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  &__net {
    font-size: 18px !important;
    font-weight: 800;
    color: var(--text-strong) !important;
  }
}
</style>
