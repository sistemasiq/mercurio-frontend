<template>
  <q-page class="page-content cierre-ev">
    <div v-if="error" class="list-page__note list-page__note--bad">
      <q-icon name="error" size="19px" />{{ error }}
      <q-btn flat dense label="Reintentar" class="q-ml-auto" @click="cargarTodo" />
    </div>

    <div v-if="cargando" class="cierre-ev__loading"><q-spinner color="primary" size="40px" /></div>

    <template v-else-if="reservacion">
      <PageHeader
        :title="`Cierre · ${tituloEvento}`"
        back-label="Reservaciones"
        :back-to="{ name: 'eventos-reservaciones' }"
      >
        <template #subtitle>
          {{ fmtFechaEvento }} · {{ duracionEvento
          }}<template v-if="paquete"> · {{ paquete.nombre }}</template>
          ·
          <StatusBadge
            :tone="yaCerrado ? 'ok' : 'warn'"
            :label="yaCerrado ? 'Cerrado' : 'Pendiente de cierre'"
          />
        </template>
        <template #actions>
          <q-btn outline icon="print" label="Imprimir resumen" @click="imprimirResumen" />
        </template>
      </PageHeader>

      <div class="cierre-ev__grid">
        <div class="cierre-ev__main">
          <section class="charges-card">
            <header class="charges-card__head">
              <h2 class="charges-card__title">Cargos del evento</h2>
            </header>

            <div v-if="paquete" class="charge">
              <span class="charge__tag charge__tag--pkg">Paquete</span>
              <div class="charge__info">
                <span class="charge__name">{{ paquete.nombre }}</span>
                <span v-if="paquete.descripcion" class="charge__meta">{{
                  paquete.descripcion
                }}</span>
              </div>
              <span class="charge__amount">{{ fmt(packagePriceNum) }}</span>
            </div>

            <div v-if="precioHorasNum > 0" class="charge">
              <span class="charge__tag">Horas</span>
              <div class="charge__info">
                <span class="charge__name">Horas del evento</span>
                <span class="charge__meta">{{ duracionEvento }}</span>
              </div>
              <span class="charge__amount">{{ fmt(precioHorasNum) }}</span>
            </div>

            <div v-if="precioPersonasExtraNum > 0" class="charge">
              <span class="charge__tag">Personas</span>
              <div class="charge__info"><span class="charge__name">Personas extra</span></div>
              <span class="charge__amount">{{ fmt(precioPersonasExtraNum) }}</span>
            </div>

            <div v-for="extra in extrasDetallados" :key="extra.id" class="charge">
              <span class="charge__tag charge__tag--extra">Extra</span>
              <div class="charge__info">
                <span class="charge__name">
                  {{ extra.nombre
                  }}<template v-if="extra.cantidad > 1"> × {{ extra.cantidad }}</template>
                </span>
              </div>
              <span class="charge__amount">{{ fmt(extra.subtotal) }}</span>
            </div>

            <div v-for="producto in productosDetallados" :key="producto.id" class="charge">
              <span class="charge__tag">Consumo</span>
              <div class="charge__info">
                <span class="charge__name">{{ producto.nombre }} × {{ producto.cantidad }}</span>
                <span v-if="producto.notas" class="charge__meta">{{ producto.notas }}</span>
              </div>
              <span class="charge__amount">{{ fmt(producto.subtotal) }}</span>
            </div>

            <p
              v-if="!extrasDetallados.length && !productosDetallados.length"
              class="charges-card__empty"
            >
              Sin extras ni consumos adicionales.
            </p>
          </section>

          <section class="notes-card">
            <label class="notes-card__field">
              <span class="field-label">Notas de cierre</span>
              <q-input
                v-model="closingNotes"
                type="textarea"
                outlined
                rows="3"
                :disable="yaCerrado"
                placeholder="Observaciones finales o incidencias del evento…"
              />
            </label>
          </section>
        </div>

        <aside class="settle">
          <h2 class="settle__title">Liquidación</h2>
          <div class="settle__line">
            <span>Paquete</span><span>{{ fmt(packagePriceNum) }}</span>
          </div>
          <div v-if="precioHorasNum > 0" class="settle__line">
            <span>Horas del evento</span><span>{{ fmt(precioHorasNum) }}</span>
          </div>
          <div v-if="precioPersonasExtraNum > 0" class="settle__line">
            <span>Personas extra</span><span>{{ fmt(precioPersonasExtraNum) }}</span>
          </div>
          <div v-if="extrasDetallados.length" class="settle__line">
            <span>Extras</span><span>{{ fmt(extrasTotalNum) }}</span>
          </div>
          <div v-if="productosDetallados.length" class="settle__line">
            <span>Consumos</span><span>{{ fmt(productosTotalNum) }}</span>
          </div>
          <div class="settle__line settle__line--total">
            <span>Total del evento</span><span>{{ fmt(totalNum) }}</span>
          </div>
          <div
            v-for="pago in pagosDetallados"
            :key="pago.id"
            class="settle__line settle__line--paid"
          >
            <span>{{ pago.metodo }} · {{ fmtFechaCorta(pago.fecha) }}</span>
            <span>−{{ fmt(pago.monto) }}</span>
          </div>

          <div class="settle__spacer" />

          <div class="settle__due" :class="{ 'settle__due--ok': !tieneSaldo }">
            <span class="settle__due-label">Saldo por cobrar</span>
            <span class="settle__due-value">{{ fmt(saldoPendiente) }}</span>
          </div>

          <q-btn
            v-if="!yaCerrado && tieneSaldo"
            unelevated
            color="primary"
            label="Procesar pago"
            class="settle__cta"
            :loading="procesandoPago"
            @click="abrirModalPago"
          />
          <q-btn
            unelevated
            :color="yaCerrado || tieneSaldo ? 'grey-4' : 'positive'"
            :text-color="yaCerrado || tieneSaldo ? 'grey-7' : 'white'"
            :icon="yaCerrado ? 'check_circle' : 'lock'"
            :label="yaCerrado ? 'Evento cerrado' : 'Finalizar y cerrar evento'"
            class="settle__cta"
            :loading="finalizando"
            :disable="yaCerrado || tieneSaldo"
            @click="finalizarEvento"
          />
          <span v-if="!yaCerrado && tieneSaldo" class="settle__hint">
            Liquida el saldo para poder cerrar el evento.
          </span>
          <span v-else-if="!yaCerrado" class="settle__hint">
            El cierre generará la factura final para el cliente.
          </span>
        </aside>
      </div>
    </template>

    <PaymentModal
      v-model="modalPagoAbierto"
      titulo="Cobrar saldo del evento"
      :subtitulo="tituloEvento"
      :total-to-pay="saldoPendiente"
      :metodos-pago="metodosPagoStore.activos"
      :permitir-lealtad="false"
      @pago-exitoso="onPagoExitoso"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { reservacionesApi } from '@/api/reservacionesApi'
import { pagosReservacionApi } from '@/api/pagosReservacionApi'
import { reservacionExtrasApi } from '@/api/reservacionExtrasApi'
import { reservacionProductosApi } from '@/api/reservacionProductosApi'
import { usePaquetesStore } from '@/stores/paquetes'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useExtrasStore } from '@/stores/extras'
import { useProductosStore } from '@/stores/productos'
import { useMetodosPagoStore } from '@/stores/metodos_pago'
import { useTiposEventoStore } from '@/stores/tipos_evento'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { useAuthStore } from '@/stores/auth'
import type { Reservaciones } from '@/types/reservaciones'
import type { Pagos_reservacion } from '@/types/pagos_reservacion'
import type { Reservacion_extras } from '@/types/reservacion_extras'
import type { Reservacion_productos } from '@/types/reservacion_productos'
import type { AppliedPayment } from '@/types/payments'
import { CATEGORIAS_METODO_PAGO } from '@/types/metodos_pago'
import { redondear2, TOLERANCIA_MONTO } from '@/utils/dinero'
import PaymentModal from '@/components/shared/payments/PaymentModal.vue'
import { horasFacturables } from '@/utils/horario'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const paquetesStore = usePaquetesStore()
const extrasStore = useExtrasStore()
const productosStore = useProductosStore()
const metodosPagoStore = useMetodosPagoStore()
const tiposEventoStore = useTiposEventoStore()
const turno = useTurnoCajaStore()
const authStore = useAuthStore()

function abrirModalPago() {
  // Se valida al hacer clic en "Procesar Pago", antes de abrir el modal —
  // sin turno abierto no se puede registrar el movimiento de caja.
  if (!turno.estaOperando) {
    router.push('/pos/cierre')
    return
  }
  modalPagoAbierto.value = true
}

const cargando = ref(true)
const error = ref<string | null>(null)
const reservacion = ref<Reservaciones | null>(null)
const pagos = ref<Pagos_reservacion[]>([])
const reservacionExtras = ref<Reservacion_extras[]>([])
const reservacionProductos = ref<Reservacion_productos[]>([])
const closingNotes = ref('')

const cargarTodo = async () => {
  cargando.value = true
  error.value = null
  try {
    const id = route.params.id as string
    const [res, pagosRes, extrasRes, productosRes] = await Promise.all([
      reservacionesApi.obtener(id),
      pagosReservacionApi.listarPorReservacion(id),
      reservacionExtrasApi.listarPorReservacion(id),
      reservacionProductosApi.listarPorReservacion(id),
    ])
    reservacion.value = res
    pagos.value = pagosRes
    reservacionExtras.value = extrasRes
    reservacionProductos.value = productosRes
    closingNotes.value = res.notas ?? ''
  } catch {
    error.value = 'No se pudo cargar la información del evento'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarTodo()
  // Métodos de pago es un catálogo global por diseño: se carga siempre.
  metodosPagoStore.cargar()

  if (!authStore.currentBranchId) return
  paquetesStore.cargar(authStore.currentBranchId)
  extrasStore.cargar(authStore.currentBranchId)
  productosStore.cargar(authStore.currentBranchId)
  tiposEventoStore.cargar()
})

// ── Formato ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

const fmtFechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })

const fmtFechaEvento = computed(() => {
  if (!reservacion.value) return '—'
  return new Date(`${reservacion.value.fecha_evento}T00:00:00`).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
})

const duracionEvento = computed(() => {
  if (!reservacion.value) return '—'
  const horas = horasFacturables(reservacion.value.hora_inicio, reservacion.value.hora_fin)
  return `${horas} ${horas === 1 ? 'Hora' : 'Horas'}`
})

const tipoEventoNombre = computed(
  () => tiposEventoStore.tipos.find((t) => t.id === reservacion.value?.tipo_evento_id)?.nombre,
)

const tituloEvento = computed(() => {
  if (!reservacion.value) return ''
  const festejado = reservacion.value.nombre_festejado
  const edad = reservacion.value.edad_festejado
  const base = tipoEventoNombre.value || 'Evento'
  if (festejado) return `${base} de ${festejado}${edad ? ' – ' + edad + ' Años' : ''}`
  return `${base} — ${reservacion.value.nombre_cliente}`
})

const yaCerrado = computed(() => reservacion.value?.estado === 'completada')

// ── Facturación ──────────────────────────────────────────────────────────────

const paquete = computed(() =>
  paquetesStore.paquetes.find((p) => p.id === reservacion.value?.paquete_id),
)

const packagePriceNum = computed(() => parseFloat(reservacion.value?.precio_base ?? '0'))
const precioHorasNum = computed(() => parseFloat(reservacion.value?.precio_horas ?? '0'))
const precioPersonasExtraNum = computed(() =>
  parseFloat(reservacion.value?.precio_personas_extra ?? '0'),
)

const extrasDetallados = computed(() =>
  reservacionExtras.value.map((re) => ({
    id: re.id,
    nombre: extrasStore.extras.find((e) => e.id === re.extra_id)?.nombre ?? 'Extra',
    cantidad: re.cantidad,
    subtotal: parseFloat(re.subtotal),
  })),
)

const extrasTotalNum = computed(() =>
  extrasDetallados.value.reduce((sum, e) => sum + e.subtotal, 0),
)

const productosDetallados = computed(() =>
  reservacionProductos.value.map((rp) => ({
    id: rp.id,
    nombre: productosStore.productos.find((p) => p.id === rp.producto_id)?.nombre ?? 'Producto',
    cantidad: rp.cantidad,
    notas: rp.notas,
    subtotal: parseFloat(rp.subtotal),
  })),
)

const productosTotalNum = computed(() =>
  productosDetallados.value.reduce((sum, p) => sum + p.subtotal, 0),
)

const totalNum = computed(() => parseFloat(reservacion.value?.precio_total ?? '0'))

// ── Pagos y saldo ────────────────────────────────────────────────────────────
// El saldo se calcula sumando los pagos reales (pagos_reservacion) en vez de
// confiar en reservaciones.saldo_pendiente: esa columna generada se basa en el
// campo anticipo, que no se actualiza automáticamente al registrar un pago.

const pagosDetallados = computed(() =>
  pagos.value
    .map((p) => ({
      id: p.id,
      metodo: metodosPagoStore.metodos.find((m) => m.id === p.metodo_pago_id)?.nombre ?? 'Pago',
      fecha: p.fecha_pago,
      monto: parseFloat(p.monto),
    }))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
)

const totalPagado = computed(() => pagos.value.reduce((sum, p) => sum + parseFloat(p.monto), 0))
const saldoPendiente = computed(() =>
  Math.max(0, redondear2(redondear2(totalNum.value) - redondear2(totalPagado.value))),
)
const tieneSaldo = computed(() => saldoPendiente.value > TOLERANCIA_MONTO)

// ── Procesar pago ────────────────────────────────────────────────────────────

const modalPagoAbierto = ref(false)
const procesandoPago = ref(false)

const mapearMetodoPago = (categoriaSeleccionada: string): string => {
  const categoria = CATEGORIAS_METODO_PAGO.find((c) => c.valor === categoriaSeleccionada)
  const metodo = metodosPagoStore.activos.find((m) => m.tipo === categoria?.tipo)
  if (!metodo) {
    throw new Error(
      `No hay un método de pago activo de tipo "${categoriaSeleccionada}" configurado para esta sucursal.`,
    )
  }
  return metodo.id
}

const onPagoExitoso = async (pagosAplicados: AppliedPayment[]) => {
  if (!reservacion.value) return
  procesandoPago.value = true
  try {
    for (const pago of pagosAplicados) {
      await pagosReservacionApi.crear({
        reservacion_id: reservacion.value.id,
        metodo_pago_id: mapearMetodoPago(pago.method),
        monto: String(pago.amount),
        notas: pago.cardType
          ? `Pago (${pago.cardType} - Folio: ${pago.authCode ?? ''})`
          : 'Pago registrado en cierre de evento',
      })
    }
    $q.notify({ type: 'positive', message: 'Pago registrado correctamente', position: 'top-right' })
    await cargarTodo()
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: (err as Error).message || 'Error al registrar el pago',
      position: 'top-right',
    })
  } finally {
    procesandoPago.value = false
  }
}

// ── Finalizar cierre ─────────────────────────────────────────────────────────

const finalizando = ref(false)

const finalizarEvento = async () => {
  if (!reservacion.value || tieneSaldo.value) return
  finalizando.value = true
  try {
    reservacion.value = await reservacionesApi.actualizar(reservacion.value.id, {
      estado: 'completada',
      notas: closingNotes.value || null,
    })
    $q.notify({ type: 'positive', message: 'Evento cerrado correctamente', position: 'top-right' })
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cerrar el evento', position: 'top-right' })
  } finally {
    finalizando.value = false
  }
}

const imprimirResumen = () => window.print()
</script>

<style scoped lang="scss">
.cierre-ev {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__loading {
    display: flex;
    justify-content: center;
    padding: 64px 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 414px;
    gap: 18px;
    align-items: stretch;

    @media (max-width: 1100px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
}

.charges-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;

  &__head {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-soft);
  }

  &__title {
    margin: 0;
    font-size: 15px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__empty {
    margin: 0;
    padding: 16px 20px;
    font-size: 13px;
    color: var(--text-secondary);
  }
}

.charge {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f3f7;

  &:last-child {
    border-bottom: 0;
  }

  &__tag {
    width: 88px;
    flex-shrink: 0;
    padding: 4px 0;
    border-radius: 6px;
    background: var(--bg-muted);
    color: var(--text-body);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-align: center;
    text-transform: uppercase;

    &--pkg {
      background: var(--tone-info-bg);
      color: var(--tone-info-fg);
    }

    &--extra {
      background: var(--tone-pink-bg);
      color: var(--tone-pink-fg);
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__meta {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__amount {
    font-size: 14px;
    font-weight: 800;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }
}

.notes-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 18px 20px;

  &__field {
    display: flex;
    flex-direction: column;
  }
}

.settle {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__title {
    margin: 0 0 6px;
    font-size: 15px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__line {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 13.5px;
    color: var(--text-secondary);

    span:last-child {
      font-weight: 700;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }

    &--total {
      padding-top: 12px;
      margin-top: 4px;
      border-top: 1px solid var(--border-soft);
      font-size: 14.5px;
      font-weight: 700;
      color: var(--text-primary);
    }

    &--paid,
    &--paid span:last-child {
      color: var(--tone-ok-fg);
      font-weight: 700;
    }
  }

  &__spacer {
    flex: 1;
    min-height: 16px;
  }

  &__due {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 16px;
    border-radius: 12px;
    background: #fff1d6;
    color: var(--tone-warn-fg);

    &--ok {
      background: var(--tone-ok-bg);
      color: var(--tone-ok-fg);
    }
  }

  &__due-label {
    font-size: 13px;
    font-weight: 700;
  }

  &__due-value {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  &__cta {
    width: 100%;
    min-height: 50px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 800;
  }

  &__hint {
    text-align: center;
    font-size: 12.5px;
    color: var(--text-secondary);
  }
}
</style>
