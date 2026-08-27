<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 1200px; margin: 0 auto">
      <!-- Banner error -->
      <q-banner
        v-if="error"
        dense
        rounded
        class="bg-red-1 text-red-8 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="error_outline" color="negative" /></template>
        {{ error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="cargarTodo" />
        </template>
      </q-banner>

      <div v-if="cargando" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="3em" />
      </div>

      <template v-else-if="reservacion">
        <!-- Encabezado -->
        <div class="row items-start q-mb-lg">
          <div>
            <div class="row items-center q-gutter-x-xs text-primary text-weight-bold text-caption">
              <q-icon name="event_available" size="xs" />
              <span style="letter-spacing: 0.5px">CIERRE DE EVENTO</span>
            </div>
            <div class="text-h4 text-weight-bold q-mt-xs" style="color: var(--text-primary)">
              {{ tituloEvento }}
            </div>
            <div class="row items-center q-gutter-sm q-mt-sm">
              <q-badge
                :color="yaCerrado ? 'positive' : 'orange'"
                :label="yaCerrado ? 'CERRADO' : 'PENDIENTE DE CIERRE'"
                style="font-size: 0.72rem; padding: 5px 10px; border-radius: 20px"
              />
              <span class="text-caption text-grey-7">
                <q-icon name="tag" size="xs" /> ID: {{ eventoId }}
              </span>
            </div>
          </div>
          <q-space />
          <q-btn
            outline
            no-caps
            color="primary"
            icon="print"
            label="Imprimir Resumen"
            style="border-radius: 8px; font-weight: 600"
            @click="imprimirResumen"
          />
        </div>

        <div class="row q-col-gutter-lg">
          <!-- Columna izquierda -->
          <div class="col-12 col-md-8">
            <q-card flat bordered class="q-mb-md" style="border-radius: 12px">
              <q-card-section>
                <div class="row items-center q-gutter-x-xs text-weight-bold q-mb-md">
                  <q-icon name="info" color="primary" />
                  <span class="text-subtitle1">Resumen del Evento</span>
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-6">
                    <div class="field-label">FECHA</div>
                    <div class="text-body1 text-weight-medium">{{ fmtFechaEvento }}</div>
                  </div>
                  <div class="col-6">
                    <div class="field-label">DURACIÓN</div>
                    <div class="text-body1 text-weight-medium">{{ duracionEvento }}</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card flat bordered style="border-radius: 12px; overflow: hidden">
              <div class="section-header">DETALLES DE FACTURACIÓN</div>

              <div v-if="paquete" class="billing-row">
                <q-avatar color="blue-1" text-color="primary" icon="star" size="42px" />
                <div class="col">
                  <div class="text-subtitle1 text-weight-bold">{{ paquete.nombre }}</div>
                  <div class="text-caption text-grey-7">{{ paquete.descripcion }}</div>
                </div>
                <div class="text-subtitle1 text-weight-bold">{{ fmt(packagePriceNum) }}</div>
              </div>

              <div v-if="precioHorasNum > 0" class="billing-row">
                <q-avatar color="grey-2" text-color="grey-8" icon="schedule" size="36px" />
                <div class="col">
                  <div class="text-body1 text-weight-medium">
                    Horas del evento ({{ duracionEvento }})
                  </div>
                </div>
                <div class="text-body1 text-weight-bold">{{ fmt(precioHorasNum) }}</div>
              </div>

              <div v-if="precioPersonasExtraNum > 0" class="billing-row">
                <q-avatar color="grey-2" text-color="grey-8" icon="group_add" size="36px" />
                <div class="col">
                  <div class="text-body1 text-weight-medium">Personas extra</div>
                </div>
                <div class="text-body1 text-weight-bold">{{ fmt(precioPersonasExtraNum) }}</div>
              </div>

              <template v-if="extrasDetallados.length">
                <div class="section-subheader">SERVICIOS ADICIONALES</div>
                <div v-for="extra in extrasDetallados" :key="extra.id" class="billing-row">
                  <q-avatar color="grey-2" text-color="grey-8" icon="inventory_2" size="36px" />
                  <div class="col">
                    <div class="text-body1 text-weight-medium">
                      {{ extra.nombre
                      }}<span v-if="extra.cantidad > 1"> (x{{ extra.cantidad }})</span>
                    </div>
                  </div>
                  <div class="text-body1 text-weight-bold">{{ fmt(extra.subtotal) }}</div>
                </div>
              </template>
              <div v-else class="q-pa-md text-caption text-grey-6">Sin servicios adicionales</div>

              <template v-if="productosDetallados.length">
                <div class="section-subheader">PRODUCTOS ADICIONALES</div>
                <div v-for="producto in productosDetallados" :key="producto.id" class="billing-row">
                  <q-avatar color="grey-2" text-color="grey-8" icon="restaurant" size="36px" />
                  <div class="col">
                    <div class="text-body1 text-weight-medium">
                      {{ producto.nombre }} (x{{ producto.cantidad }})
                    </div>
                    <div v-if="producto.notas" class="text-caption text-grey-6">
                      {{ producto.notas }}
                    </div>
                  </div>
                  <div class="text-body1 text-weight-bold">{{ fmt(producto.subtotal) }}</div>
                </div>
              </template>
            </q-card>

            <q-card flat bordered class="q-mt-md" style="border-radius: 12px">
              <q-card-section>
                <div class="row items-center q-gutter-x-xs text-weight-bold q-mb-sm">
                  <q-icon name="edit_note" color="primary" />
                  <span class="text-subtitle1">Notas de Cierre</span>
                </div>
                <q-input
                  v-model="closingNotes"
                  type="textarea"
                  outlined
                  rows="3"
                  :disable="yaCerrado"
                  placeholder="Agrega observaciones finales o incidencias del evento..."
                />
              </q-card-section>
            </q-card>
          </div>

          <!-- Columna derecha -->
          <div class="col-12 col-md-4">
            <q-card flat bordered style="border-radius: 12px; overflow: hidden">
              <div class="balance-header">
                <div class="text-caption" style="letter-spacing: 0.5px; opacity: 0.85">
                  SALDO TOTAL PENDIENTE
                </div>
                <div class="text-h4 text-weight-bold">{{ fmt(saldoPendiente) }}</div>
              </div>

              <q-card-section>
                <div class="row justify-between text-body2 text-grey-8 q-mb-xs">
                  <span>Paquete{{ paquete ? ` (${paquete.nombre})` : '' }}</span>
                  <span>{{ fmt(packagePriceNum) }}</span>
                </div>

                <div
                  v-if="precioHorasNum > 0"
                  class="row justify-between text-body2 text-grey-8 q-mb-xs"
                >
                  <span>Horas del evento</span>
                  <span>{{ fmt(precioHorasNum) }}</span>
                </div>

                <div
                  v-if="precioPersonasExtraNum > 0"
                  class="row justify-between text-body2 text-grey-8 q-mb-xs"
                >
                  <span>Personas extra</span>
                  <span>{{ fmt(precioPersonasExtraNum) }}</span>
                </div>

                <div
                  v-if="extrasDetallados.length"
                  class="row justify-between text-body2 text-grey-8 q-mb-xs"
                >
                  <span>Servicios Extras</span>
                  <span>{{ fmt(extrasTotalNum) }}</span>
                </div>

                <div
                  v-if="productosDetallados.length"
                  class="row justify-between text-body2 text-grey-8 q-mb-xs"
                >
                  <span>Productos Adicionales</span>
                  <span>{{ fmt(productosTotalNum) }}</span>
                </div>

                <div class="row justify-between text-subtitle1 text-weight-bold q-mt-sm">
                  <span>Total del Evento</span>
                  <span>{{ fmt(totalNum) }}</span>
                </div>

                <div v-if="pagosDetallados.length" class="advances-box q-mt-md">
                  <div class="field-label q-mb-xs">
                    <q-icon name="account_balance_wallet" size="14px" /> ANTICIPOS RECIBIDOS
                  </div>
                  <div
                    v-for="pago in pagosDetallados"
                    :key="pago.id"
                    class="row justify-between items-center text-body2 q-py-xs"
                  >
                    <span class="text-grey-8"
                      >{{ pago.metodo }} ({{ fmtFechaCorta(pago.fecha) }})</span
                    >
                    <span class="text-positive text-weight-medium">-{{ fmt(pago.monto) }}</span>
                  </div>
                </div>

                <q-btn
                  v-if="!yaCerrado"
                  class="full-width q-mt-md"
                  color="warning"
                  text-color="white"
                  unelevated
                  no-caps
                  icon="point_of_sale"
                  label="Procesar Pago"
                  style="border-radius: 8px; height: 44px; font-weight: 700"
                  :loading="procesandoPago"
                  :disable="saldoPendiente <= 0"
                  @click="abrirModalPago"
                />

                <q-banner
                  v-if="!yaCerrado && saldoPendiente > 0"
                  dense
                  rounded
                  class="bg-red-1 text-red-8 q-mt-md"
                  style="border-radius: 10px"
                >
                  <template #avatar><q-icon name="warning" color="negative" /></template>
                  <div class="text-weight-bold">No se puede cerrar el evento</div>
                  <div class="text-caption">
                    Saldo pendiente: debe ser $0.00 para cerrar el evento. Liquida los
                    {{ fmt(saldoPendiente) }} restantes antes de finalizar.
                  </div>
                </q-banner>

                <q-btn
                  class="full-width q-mt-md"
                  color="primary"
                  unelevated
                  no-caps
                  :icon="yaCerrado ? 'check_circle' : 'lock'"
                  :label="yaCerrado ? 'Evento Cerrado' : 'Finalizar y Cerrar Evento'"
                  style="border-radius: 8px; height: 44px; font-weight: 700"
                  :loading="finalizando"
                  :disable="yaCerrado || saldoPendiente > 0"
                  @click="finalizarEvento"
                />
                <div class="text-caption text-grey-6 text-center q-mt-sm">
                  El cierre generará la factura final para el cliente.
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </template>
    </div>

    <PaymentModal
      v-model="modalPagoAbierto"
      :total-to-pay="saldoPendiente"
      :metodos-pago="metodosPagoStore.activos"
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
  // Catálogo de cajero: cerrar un evento solo pide `reservaciones:editar`, que el
  // Cajero sí tiene, pero /productos/admin exige `inventario:ver`, que no. Con el
  // 403 la lista quedaba vacía y cada producto del evento se mostraba como
  // "Producto" genérico por el fallback de nombre.
  productosStore.cargarCatalogo()
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

const eventoId = computed(() => reservacion.value?.id ?? '—')

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
const saldoPendiente = computed(() => Math.max(0, totalNum.value - totalPagado.value))

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
  if (!reservacion.value || saldoPendiente.value > 0) return
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

<style scoped>
.section-header {
  padding: 12px 16px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: var(--text-secondary);
  background: var(--bg-main);
  border-bottom: 1px solid var(--border-color);
}

.section-subheader {
  padding: 10px 16px 4px;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: var(--text-secondary);
}

.billing-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.billing-row:last-child {
  border-bottom: none;
}

.balance-header {
  background: var(--q-primary);
  color: white;
  padding: 18px 20px;
  text-align: center;
}

.advances-box {
  background: var(--bg-main);
  border-radius: 10px;
  padding: 10px 12px;
}
</style>
