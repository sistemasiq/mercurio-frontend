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
      <KpiCard
        label="Anticipos"
        :value="fmt(totalAnticipos)"
        :note="`${anticipos.length} anticipos`"
      />
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      search-placeholder="Buscar folio, cliente o evento"
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
        <template #body-cell-tipo="props">
          <q-td :props="props">
            <StatusBadge :tone="TONO_TIPO[props.row.tipo]" :label="LABEL_TIPO[props.row.tipo]" />
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
      primary-label="Continuar al cobro"
      :primary-disabled="!form.reservacion_id || (saldoSeleccionado ?? 0) <= 0"
      @confirm="abrirCobro"
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
            no-options-label="No hay reservaciones con adeudo"
            @filter="filtrarReservaciones"
          >
            <template #append><q-icon name="search" size="19px" /></template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption class="text-negative text-weight-medium">
                    Debe {{ fmt(scope.opt.saldo) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Saldo de la reservación elegida: evita tener que ir a buscarlo
               a la tabla antes de iniciar el cobro. -->
          <div
            v-if="saldoSeleccionado !== null"
            class="saldo-box"
            :class="{ 'saldo-box--liquidado': saldoSeleccionado <= 0 }"
          >
            <q-icon :name="saldoSeleccionado > 0 ? 'account_balance_wallet' : 'check_circle'" />
            <span v-if="saldoSeleccionado > 0">
              Saldo pendiente: <strong>{{ fmt(saldoSeleccionado) }}</strong>
            </span>
            <span v-else>Este evento ya está liquidado. No hay nada por cobrar.</span>
          </div>
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
    </BaseDialog>

    <!-- Cobro multimodal: el mismo componente que usa el asistente de
         reservación y la caja, para que el cobro de un evento se capture igual
         en todos lados (varios métodos, teclado numérico y cálculo de cambio). -->
    <PaymentModal
      v-model="modalCobroAbierto"
      :total-to-pay="saldoSeleccionado ?? 0"
      :metodos-pago="metodosPagoStore.activos"
      :permitir-lealtad="false"
      @pago-exitoso="onCobroExitoso"
    />

    <!-- Ticket del pago recién registrado -->
    <q-dialog v-model="ticketAbierto" persistent>
      <TicketPagoEvento v-if="ticketData" v-bind="ticketData" @close="ticketAbierto = false" />
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
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip } from '@/types/ui'
import type { AppliedPayment } from '@/types/payments'
import type { TicketPagoEventoProps } from '@/types/ticketPagoEvento'
import PaymentModal from '@/components/shared/payments/PaymentModal.vue'
import TicketPagoEvento from '@/components/eventos/TicketPagoEvento.vue'
import {
  descontarCambio,
  resolverMetodoPagoId,
  resumenMetodosPago,
  totalPagado,
} from '@/utils/pagos'

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
  resStore.cargar(authStore.currentBranchId)
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
  { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'left' },
  { name: 'metodo', label: 'Método', field: 'metodo', align: 'left' },
  { name: 'monto', label: 'Pago', field: 'monto', align: 'right', sortable: true },
  { name: 'total', label: 'Total', field: 'total', align: 'right', sortable: true },
  { name: 'restante', label: 'Restante', field: 'restante', align: 'right', sortable: true },
  { name: 'estado_pago', label: 'Estado', field: 'estado_pago', align: 'left' },
  { name: 'fecha_pago', label: 'Fecha', field: 'fecha_pago', align: 'left', sortable: true },
]

const LABEL_TIPO: Record<string, string> = {
  anticipo: 'Anticipo',
  pago: 'Pago',
  liquidacion: 'Liquidación',
}
const TONO_TIPO: Record<string, 'ok' | 'warn' | 'info'> = {
  anticipo: 'info',
  pago: 'warn',
  liquidacion: 'ok',
}

// ── Filtros y KPIs ────────────────────────────────────────────────────────────

type Filtro = 'todos' | 'pagado' | 'pendiente' | 'anticipo'
const FILTROS: FilterChip<Filtro>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Liquidados', value: 'pagado' },
  { label: 'Parciales', value: 'pendiente' },
  { label: 'Anticipos', value: 'anticipo' },
]
const filtro = ref<Filtro | null>('todos')
const busqueda = ref('')

const filasVisibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return filas.value
    .filter((f) => {
      if (filtro.value === 'todos') return true
      if (filtro.value === 'anticipo') return f.tipo === 'anticipo'
      return f.estado_pago === filtro.value
    })
    .filter((f) => !q || `${f.folio ?? ''} ${f.cliente} ${f.evento}`.toLowerCase().includes(q))
})

const anticipos = computed(() =>
  pagosStore.pagos_reservacion.filter((p) => p.tipo === 'anticipo'),
)
const totalAnticipos = computed(() => anticipos.value.reduce((s, p) => s + parseFloat(p.monto), 0))

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
      folio: res?.folio ?? null,
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
  notas: '',
})

/** Lo que falta por cobrar de una reservación. Nunca negativo. */
const saldoDeReservacion = (reservacionId: string): number => {
  const res = resStore.reservaciones.find((r) => r.id === reservacionId)
  const total = parseFloat(res?.precio_total ?? '0')
  const pagado = pagosPorReservacion.value.get(reservacionId) ?? 0
  return Math.max(0, total - pagado)
}

/**
 * Reservaciones ofrecidas en el diálogo: sólo las que deben algo.
 *
 * Registrar un pago sobre un evento liquidado no tiene sentido —el saldo ya es
 * cero y la BD rechazaría un anticipo mayor que el total—, así que no se
 * ofrecen. Quien quiera consultar un evento ya pagado lo encuentra en la tabla
 * de atrás, que sí los lista todos.
 */
const todasReservaciones = computed(() =>
  resStore.reservaciones
    .map((r) => {
      const nombre = `${r.nombre_cliente}${r.apellidos_cliente ? ' ' + r.apellidos_cliente : ''}`
      return {
        label: `${nombre} — ${r.fecha_evento}`,
        value: r.id,
        saldo: saldoDeReservacion(r.id),
      }
    })
    .filter((o) => o.saldo > 0),
)

/** Saldo de la reservación elegida; null mientras no haya ninguna. */
const saldoSeleccionado = computed(() =>
  form.value.reservacion_id ? saldoDeReservacion(form.value.reservacion_id) : null,
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

const abrirDialog = () => {
  // Se valida al hacer clic en "Registrar Pago", no hasta guardar: si no hay
  // turno abierto no tiene sentido dejar llenar el formulario para enterarse
  // hasta el final. Redirige de inmediato, sin bloquear ni avisar.
  if (!turno.estaOperando) {
    // Antes navegaba en silencio y el usuario aterrizaba en otra pantalla sin
    // saber por qué. El cobro necesita una caja abierta porque queda registrado
    // contra la apertura de quien lo captura.
    $q.notify({
      type: 'warning',
      message: 'Abre tu caja para poder registrar el pago.',
      position: 'top-right',
      timeout: 5000,
    })
    router.push('/pos/cierre')
    return
  }
  form.value = { reservacion_id: null, notas: '' }
  reservacionOptions.value = todasReservaciones.value
  dialogOpen.value = true
}

const modalCobroAbierto = ref(false)

const abrirCobro = () => {
  if (!form.value.reservacion_id || (saldoSeleccionado.value ?? 0) <= 0) return
  // El diálogo se cierra para no encimarse con el modal de cobro; la reservación
  // y las notas ya quedaron capturadas en `form`.
  dialogOpen.value = false
  modalCobroAbierto.value = true
}

/**
 * Registra un pago de reservación por cada método usado en el cobro.
 *
 * El modal entrega lo que el cliente ENTREGÓ; descontarCambio() lo ajusta a lo
 * que de verdad se queda en caja antes de guardarlo, porque el excedente se le
 * devolvió como cambio y no es ingreso del evento.
 */
const ticketAbierto = ref(false)
const ticketData = ref<TicketPagoEventoProps | null>(null)

const onCobroExitoso = async (pagos: AppliedPayment[]) => {
  const reservacionId = form.value.reservacion_id
  if (!reservacionId) return

  // El saldo se captura antes de resetear el formulario: es el "antes" del
  // que dependen el acumulado y el saldo restante que muestra el ticket.
  const saldoAntes = saldoSeleccionado.value ?? 0
  const res = resStore.reservaciones.find((r) => r.id === reservacionId)
  const notasForm = form.value.notas

  const aplicados = descontarCambio(pagos, saldoAntes)
  if (!aplicados.length) return

  guardando.value = true
  try {
    for (const pago of aplicados) {
      await pagosStore.crearPagosReservacion({
        reservacion_id: reservacionId,
        metodo_pago_id: resolverMetodoPagoId(pago.method, metodosPagoStore.activos),
        monto: String(pago.amount),
        notas:
          notasForm ||
          (pago.cardType ? `Pago (${pago.cardType} - Folio: ${pago.authCode ?? ''})` : null),
      })
    }
    const montoPagado = totalPagado(aplicados)
    $q.notify({
      type: 'positive',
      message: `Pago registrado por ${fmt(montoPagado)}`,
      position: 'top-right',
    })

    if (res) {
      const totalEvento = parseFloat(res.precio_total)
      const tipoEvento = tiposEventoStore.activos.find((t) => t.id === res.tipo_evento_id)?.nombre
      ticketData.value = {
        folio: res.folio ?? res.id,
        sucursal: authStore.currentBranchName ?? 'Sucursal',
        clienteNombre:
          `${res.nombre_cliente}${res.apellidos_cliente ? ' ' + res.apellidos_cliente : ''}`.trim(),
        tipoEvento: tipoEvento ?? '—',
        fechaEvento: new Date(`${res.fecha_evento}T00:00:00`).toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        totalEvento,
        montoPagado,
        totalPagadoAcumulado: totalEvento - saldoAntes + montoPagado,
        saldoPendiente: Math.max(0, saldoAntes - montoPagado),
        metodosPago: resumenMetodosPago(aplicados),
        notas: notasForm || null,
      }
      ticketAbierto.value = true
    }

    form.value = { reservacion_id: null, notas: '' }
    await Promise.all([
      pagosStore.cargar(),
      resStore.cargar(authStore.currentBranchId ?? undefined),
    ])
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: (err as Error).message || 'No se pudo registrar el pago',
      position: 'top-right',
      timeout: 6000,
    })
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

.saldo-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  background: var(--tone-info-bg);
  color: var(--tone-info-fg);

  &--liquidado {
    background: var(--tone-ok-bg);
    color: var(--tone-ok-fg);
  }
}
</style>
