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
          :disable="!authStore.currentBranchId"
          style="border-radius: 8px; font-weight: 600"
          @click="abrirDialog"
        />
      </div>

      <!-- Sin sucursal activa -->
      <q-banner
        v-if="!authStore.currentBranchId"
        dense
        rounded
        class="bg-orange-1 text-orange-9 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="info" color="orange-9" /></template>
        No hay una sucursal activa en la sesión.
      </q-banner>

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
                :color="props.row.estado_pago === 'pagado' ? 'positive' : 'warning'"
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
              no-options-label="No hay reservaciones con adeudo"
              @filter="filtrarReservaciones"
            >
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
                 a la tabla antes de capturar el monto. -->
            <div
              v-if="saldoSeleccionado !== null"
              class="saldo-box"
              :class="{ 'saldo-box--liquidado': saldoSeleccionado <= 0 }"
            >
              <q-icon :name="saldoSeleccionado > 0 ? 'account_balance_wallet' : 'check_circle'" />
              <span v-if="saldoSeleccionado > 0">
                Saldo pendiente: <strong>{{ fmt(saldoSeleccionado) }}</strong>
              </span>
              <span v-else> Este evento ya está liquidado. No hay nada por cobrar. </span>
            </div>
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
            label="Continuar al cobro"
            icon-right="point_of_sale"
            style="border-radius: 8px; font-weight: 600"
            :disable="!form.reservacion_id || (saldoSeleccionado ?? 0) <= 0"
            @click="abrirCobro"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Cobro multimodal: el mismo componente que usa el asistente de
         reservación y la caja, para que el cobro de un evento se capture igual
         en todos lados (varios métodos, teclado numérico y cálculo de cambio). -->
    <PaymentModal
      v-model="modalCobroAbierto"
      :total-to-pay="saldoSeleccionado ?? 0"
      :metodos-pago="metodosPagoStore.activos"
      @pago-exitoso="onCobroExitoso"
    />
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
import type { AppliedPayment } from '@/types/payments'
import PaymentModal from '@/components/shared/payments/PaymentModal.vue'
import { descontarCambio, resolverMetodoPagoId, totalPagado } from '@/utils/pagos'

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
const onCobroExitoso = async (pagos: AppliedPayment[]) => {
  const reservacionId = form.value.reservacion_id
  if (!reservacionId) return

  const aplicados = descontarCambio(pagos, saldoSeleccionado.value ?? 0)
  if (!aplicados.length) return

  guardando.value = true
  try {
    for (const pago of aplicados) {
      await pagosStore.crearPagosReservacion({
        reservacion_id: reservacionId,
        metodo_pago_id: resolverMetodoPagoId(pago.method, metodosPagoStore.activos),
        monto: String(pago.amount),
        notas:
          form.value.notas ||
          (pago.cardType ? `Pago (${pago.cardType} - Folio: ${pago.authCode ?? ''})` : null),
      })
    }
    $q.notify({
      type: 'positive',
      message: `Pago registrado por ${fmt(totalPagado(aplicados))}`,
      position: 'top-right',
    })
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

<style scoped>
.saldo-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  background: rgba(2, 95, 224, 0.08);
  color: var(--q-primary);
}

.saldo-box--liquidado {
  background: rgba(63, 168, 52, 0.12);
  color: #2e7d32;
}

/* El cambio es la cifra que el cajero tiene que sacar del cajón: se destaca. */
</style>
