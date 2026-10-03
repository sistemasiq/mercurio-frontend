<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth'
import { useAccessControlStore, type ActiveChild } from '@/stores/accessControl'
import { useReservacionesStore } from '@/stores/reservaciones'
import { useAlertasInventarioStore } from '@/stores/alertasInventario'
import { usePaquetesStore } from '@/stores/paquetes'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { obtenerComandas } from '@/services/comandaService'
import { authService } from '@/services/authService'
import { formatMXN } from '@/utils/formatoMoneda'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import CambiarPinDialog from '@/components/usuarios/CambiarPinDialog.vue'
import type { Comanda } from '@/types/comanda'
import type { Reservaciones } from '@/types/reservaciones'
import type { UiTone } from '@/types/ui'

/**
 * Inicio (1a): tablero operativo del turno. Cada bloque se muestra solo si
 * el usuario tiene el permiso del módulo que lo alimenta.
 */
const auth = useAuthStore()
const router = useRouter()
const acceso = useAccessControlStore()
const reservacionesStore = useReservacionesStore()
const alertas = useAlertasInventarioStore()
const paquetesStore = usePaquetesStore()
const turnoCaja = useTurnoCajaStore()

const puede = {
  estancias: computed(() => auth.hasPermission('estancias:ver_activos')),
  cocina: computed(() => auth.hasPermission('restaurante:gestionar_cocina')),
  eventos: computed(() => auth.hasPermission('reservaciones:listar')),
  inventario: computed(() => auth.hasPermission('inventario:ver')),
  pos: computed(() => auth.hasPermission('pos:acceder')),
  checkin: computed(() => auth.hasPermission('estancias:checkin')),
  checkout: computed(() => auth.hasPermission('estancias:checkout')),
  nuevaReservacion: computed(() => auth.hasPermission('reservaciones:crear')),
  pagosEventos: computed(() => auth.hasPermission('reservaciones:gestionar_pagos')),
}

// ── Encabezado ──────────────────────────────────────────────────────────────
// Reloj reactivo (se actualiza cada minuto) del que dependen la fecha, el saludo
// y el "siguiente evento".
const ahora = ref(new Date())
const relojTimer = setInterval(() => {
  ahora.value = new Date()
}, 60_000)
const saludo = computed(() => {
  const h = ahora.value.getHours()
  const nombre = (auth.currentUser?.name ?? '').split(' ')[0]
  const parte = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  return nombre ? `${parte}, ${nombre}` : parte
})
const subtitulo = computed(() => {
  const fecha = format(ahora.value, "EEEE d 'de' MMMM", { locale: es })
  const texto = fecha.charAt(0).toUpperCase() + fecha.slice(1)
  return auth.currentBranchName ? `${texto} · ${auth.currentBranchName}` : texto
})

// ── Datos ───────────────────────────────────────────────────────────────────
const comandas = ref<Comanda[]>([])
const abortComandas = new AbortController()

// C1: aviso "Configura tu PIN de caja". Bloque propio y aparte: se consulta
// /auth/me (en vez del user cacheado del login) porque tienePin puede cambiar
// sin volver a iniciar sesión, y porque este dato debe llegar sin pedir
// usuarios:ver (el Cajero no lo tiene).
const tienePin = ref(true)
const showCambiarPin = ref(false)

async function cargarTienePin() {
  if (!puede.pos.value) return
  try {
    const me = await authService.me()
    tienePin.value = me.tienePin ?? true
  } catch {
    // No bloqueante: si falla, simplemente no se muestra el aviso.
  }
}

// Al cerrar el diálogo (tras guardar el PIN) se vuelve a consultar /auth/me
// para que el aviso desaparezca sin recargar la página.
watch(showCambiarPin, (abierto) => {
  if (!abierto) void cargarTienePin()
})

onMounted(async () => {
  const tareas: Promise<unknown>[] = []
  if (puede.estancias.value) {
    tareas.push(acceso.loadActivos())
    acceso.startTicking()
  }
  if (puede.eventos.value && auth.currentBranchId) {
    tareas.push(reservacionesStore.cargar(auth.currentBranchId))
    // Paquete en "Eventos de hoy": el catálogo solo se pide si nadie más lo
    // cargó ya (p. ej. Nueva reservación / Catálogo de paquetes).
    if (!paquetesStore.paquetes.length) {
      tareas.push(paquetesStore.cargar(auth.currentBranchId))
    }
  }
  if (puede.cocina.value) {
    tareas.push(
      obtenerComandas(abortComandas.signal)
        .then((data) => (comandas.value = data))
        .catch(() => (comandas.value = [])),
    )
  }
  tareas.push(cargarTienePin())
  await Promise.allSettled(tareas)
})

onBeforeUnmount(() => {
  clearInterval(relojTimer)
  abortComandas.abort()
  if (puede.estancias.value) acceso.stopTicking()
})

// Comandas: P = pendiente, E = en preparación, L = lista, T = entregada, C = cancelada.
const comandasAbiertas = computed(() =>
  comandas.value.filter((c) => ['P', 'E', 'L'].includes(c.estado_actual)),
)
const comandasListas = computed(() => comandas.value.filter((c) => c.estado_actual === 'L'))

const hoyISO = computed(() => format(ahora.value, 'yyyy-MM-dd'))
// Pasada la medianoche cambia el día: se vuelven a pedir los eventos.
watch(hoyISO, () => {
  if (puede.eventos.value && auth.currentBranchId) {
    void reservacionesStore.cargar(auth.currentBranchId)
  }
})
const eventosHoy = computed(() =>
  reservacionesStore.reservaciones
    .filter((r) => r.fecha_evento?.slice(0, 10) === hoyISO.value && r.estado !== 'cancelada')
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
)
const siguienteEvento = computed(() => {
  const hhmm = format(ahora.value, 'HH:mm')
  return eventosHoy.value.find((r) => r.hora_inicio.slice(0, 5) >= hhmm) ?? null
})

const excedidos = computed(() => acceso.activos.filter((a) => a.status === 'excedido'))

// ── Requiere atención ───────────────────────────────────────────────────────
interface Pendiente {
  key: string
  icon: string
  tone: UiTone
  title: string
  detail: string
  action?: { label: string; run: () => void }
}

function irACheckout(child: ActiveChild): void {
  acceso.setCheckoutChild(child)
  router.push({ name: 'estancias-checkout' })
}

const nombreEvento = (r: Reservaciones) =>
  r.apellidos_cliente ? `Fam. ${r.apellidos_cliente}` : r.nombre_cliente

const nombrePaquete = (r: Reservaciones): string | null =>
  paquetesStore.paquetes.find((p) => p.id === r.paquete_id)?.nombre ?? null

const pendientes = computed<Pendiente[]>(() => {
  const lista: Pendiente[] = []
  for (const child of excedidos.value) {
    lista.push({
      key: `exc-${child.detalleId}`,
      icon: 'timer_off',
      tone: 'bad',
      title: `${child.nino} excedió su tiempo`,
      detail: `Pulsera ${child.pulsera} · +${Math.abs(child.minutosRestantes)} min · ${child.tutor}`,
      action: puede.checkout.value
        ? { label: 'Checkout', run: () => irACheckout(child) }
        : undefined,
    })
  }
  for (const r of eventosHoy.value) {
    if (Number(r.saldo_pendiente) <= 0) continue
    lista.push({
      key: `dep-${r.id}`,
      icon: 'pending_actions',
      tone: 'warn',
      title: `Saldo pendiente · ${nombreEvento(r)}`,
      detail: `Evento hoy ${r.hora_inicio.slice(0, 5)} · Saldo ${formatMXN(Number(r.saldo_pendiente))}`,
      action: puede.pagosEventos.value
        ? { label: 'Cobrar', run: () => router.push({ name: 'eventos-pagos' }) }
        : undefined,
    })
  }
  if (comandasListas.value.length > 0) {
    const n = comandasListas.value.length
    lista.push({
      key: 'listas',
      icon: 'room_service',
      tone: 'ok',
      title: `${n} ${n === 1 ? 'comanda lista' : 'comandas listas'} para entregar`,
      detail: comandasListas.value
        .slice(0, 4)
        .map((c) => `#${c.ticket_numero ?? c.folio ?? ''}${c.mesa ? ` Mesa ${c.mesa}` : ''}`)
        .join(' · '),
      action: { label: 'Ver cocina', run: () => router.push({ name: 'pos-cocina' }) },
    })
  }
  if (puede.inventario.value && alertas.totalAlertas > 0) {
    const insumos = [...alertas.criticos, ...alertas.porReordenar]
    lista.push({
      key: 'stock',
      icon: 'inventory_2',
      tone: 'info',
      title: `${insumos.length} insumos bajo mínimo`,
      detail: insumos
        .slice(0, 3)
        .map((i) => i.nombre)
        .join(' · '),
      action: { label: 'Ver stock', run: () => router.push({ name: 'reportes-inventario' }) },
    })
  }
  return lista
})

// ── Pulseras ────────────────────────────────────────────────────────────────
const pulseras = computed(() => {
  const activas = acceso.activos.filter((a) => a.status === 'activo').length
  const porExpirar = acceso.porExpirar
  const excedidas = acceso.excedidos
  const libres = acceso.pulserasLibres
  const total = libres + activas + porExpirar + excedidas
  const pct = (n: number) => (total ? `${(n / total) * 100}%` : '0%')
  return { activas, porExpirar, excedidas, libres, total, pct }
})

const mostrarPanelLateral = computed(
  () => puede.eventos.value || (puede.estancias.value && acceso.puedeVerPulseras),
)
const sinModulos = computed(
  () =>
    !puede.estancias.value &&
    !puede.cocina.value &&
    !puede.eventos.value &&
    !puede.inventario.value &&
    !puede.pos.value,
)
</script>

<template>
  <q-page class="page-content home">
    <PageHeader :title="saludo" :subtitle="subtitulo">
      <template #actions>
        <q-btn
          v-if="puede.nuevaReservacion.value"
          outline
          icon="event"
          label="Nueva reservación"
          :to="{ name: 'eventos-reservaciones-crear' }"
        />
        <q-btn
          v-if="puede.pos.value"
          outline
          icon="add_shopping_cart"
          label="Nuevo pedido"
          :to="{ name: 'pos-caja' }"
        />
        <q-btn
          v-if="puede.checkin.value"
          unelevated
          color="primary"
          icon="person_add"
          label="Nuevo registro"
          :to="{ name: 'estancias-registro-infantes' }"
        />
      </template>
    </PageHeader>

    <div v-if="puede.pos.value && !tienePin" class="pin-alert">
      <q-icon name="password" size="22px" />
      <span class="pin-alert__text">Configura tu PIN de caja para poder abrir y cerrar turno.</span>
      <q-btn
        outline
        dense
        label="Configurar PIN"
        class="pin-alert__btn"
        @click="showCambiarPin = true"
      />
    </div>
    <CambiarPinDialog v-model="showCambiarPin" />

    <div v-if="!sinModulos" class="kpi-row">
      <KpiCard
        v-if="puede.estancias.value"
        label="Niños en estancia"
        :value="acceso.activos.length"
        :note="acceso.excedidos ? `${acceso.excedidos} excedidos` : undefined"
        note-tone="bad"
        icon="face"
      />
      <KpiCard
        v-if="puede.cocina.value"
        label="Comandas abiertas"
        icon="restaurant"
        :value="comandasAbiertas.length"
        :note="comandasListas.length ? `${comandasListas.length} listas` : undefined"
        note-tone="ok"
      />
      <KpiCard
        v-if="puede.eventos.value"
        label="Eventos hoy"
        icon="celebration"
        :value="eventosHoy.length"
        :note="siguienteEvento ? `siguiente ${siguienteEvento.hora_inicio.slice(0, 5)}` : undefined"
      />
      <KpiCard
        v-if="puede.pos.value && turnoCaja.estaOperando"
        label="Ventas del turno"
        icon="point_of_sale"
        :value="formatMXN(turnoCaja.totalVendido)"
        :note="`${turnoCaja.numeroVentas} ${turnoCaja.numeroVentas === 1 ? 'venta' : 'ventas'}`"
      />
    </div>

    <div
      v-if="!sinModulos"
      class="home__grid"
      :class="{ 'home__grid--solo': !mostrarPanelLateral }"
    >
      <section class="home-card">
        <header class="home-card__head">
          <h2 class="home-card__title">Requiere atención</h2>
          <span v-if="pendientes.length" class="home-card__count">{{ pendientes.length }}</span>
        </header>
        <ul v-if="pendientes.length" class="attention">
          <li v-for="p in pendientes" :key="p.key" class="attention__row">
            <span class="attention__icon" :class="`attention__icon--${p.tone}`">
              <q-icon :name="p.icon" size="20px" />
            </span>
            <div class="attention__text">
              <span class="attention__title">{{ p.title }}</span>
              <span class="attention__detail">{{ p.detail }}</span>
            </div>
            <q-btn
              v-if="p.action"
              outline
              dense
              :label="p.action.label"
              class="attention__btn"
              @click="p.action.run"
            />
          </li>
        </ul>
        <div v-else class="home-card__empty">
          <q-icon name="task_alt" size="26px" />
          <span>Todo en orden por ahora.</span>
        </div>
      </section>

      <div v-if="mostrarPanelLateral" class="home__side">
        <section v-if="puede.eventos.value" class="home-card">
          <header class="home-card__head">
            <h2 class="home-card__title">Eventos de hoy</h2>
            <router-link :to="{ name: 'eventos-calendario' }" class="home-card__link"
              >Ver calendario</router-link
            >
          </header>
          <div v-if="eventosHoy.length" class="events">
            <div v-for="r in eventosHoy" :key="r.id" class="events__row">
              <div class="events__time">
                <span class="events__hour">{{ r.hora_inicio.slice(0, 5) }}</span>
                <span class="events__dur">{{ r.horas_reservadas }} h</span>
              </div>
              <div
                class="events__card"
                :class="{ 'events__card--due': Number(r.saldo_pendiente) > 0 }"
              >
                <span class="events__name">
                  {{ nombreEvento(r)
                  }}<template v-if="r.nombre_festejado">
                    · {{ r.nombre_festejado
                    }}<template v-if="r.edad_festejado">
                      ({{ r.edad_festejado }})</template
                    ></template
                  >
                </span>
                <span v-if="nombrePaquete(r)" class="events__package">{{ nombrePaquete(r) }}</span>
                <span class="events__meta">{{ r.numero_personas }} invitados</span>
                <span class="events__status">
                  {{
                    Number(r.saldo_pendiente) > 0
                      ? `Saldo ${formatMXN(Number(r.saldo_pendiente))}`
                      : 'Pagado'
                  }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="home-card__empty">
            <q-icon name="event_available" size="26px" />
            <span>No hay eventos hoy.</span>
          </div>
        </section>

        <section
          v-if="puede.estancias.value && acceso.puedeVerPulseras"
          class="home-card home-card--pad"
        >
          <h2 class="home-card__title">Pulseras</h2>
          <div class="bands__figure">
            <span class="bands__free">{{ pulseras.libres }}</span>
            <span class="bands__of">libres de {{ pulseras.total }}</span>
          </div>
          <div class="bands__bar">
            <span
              class="bands__seg bands__seg--ok"
              :style="{ width: pulseras.pct(pulseras.activas) }"
            />
            <span
              class="bands__seg bands__seg--warn"
              :style="{ width: pulseras.pct(pulseras.porExpirar) }"
            />
            <span
              class="bands__seg bands__seg--bad"
              :style="{ width: pulseras.pct(pulseras.excedidas) }"
            />
          </div>
          <div class="bands__legend">
            <span><i class="bands__dot bands__dot--ok" />{{ pulseras.activas }} activas</span>
            <span
              ><i class="bands__dot bands__dot--warn" />{{ pulseras.porExpirar }} por expirar</span
            >
            <span><i class="bands__dot bands__dot--bad" />{{ pulseras.excedidas }} excedidas</span>
          </div>
        </section>
      </div>
    </div>

    <div v-if="sinModulos" class="home-card home-card__empty home-card__empty--page">
      <q-icon name="lock" size="26px" />
      <span>No tienes módulos asignados todavía. Contacta a un administrador.</span>
    </div>
  </q-page>
</template>

<style scoped lang="scss">
.home {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 414px;
    gap: 18px;
    align-items: start;

    &--solo {
      grid-template-columns: minmax(0, 1fr);
    }

    @media (max-width: 1100px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__side {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
}

.pin-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--tone-warn-bg);
  color: var(--tone-warn-fg);
  font-size: 13.5px;
  font-weight: 600;

  &__text {
    flex: 1;
  }

  &__btn {
    flex-shrink: 0;
  }
}

.home-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;

  &--pad {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
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

  &__count {
    min-width: 22px;
    height: 22px;
    padding: 0 7px;
    border-radius: 11px;
    background: var(--tone-bad-bg);
    color: var(--tone-bad-fg);
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__link {
    margin-left: auto;
    font-size: 13px;
    font-weight: 700;
    color: var(--q-primary);
    text-decoration: none;
  }

  &__empty {
    padding: 32px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    font-size: 13.5px;

    &--page {
      padding: 64px 20px;
    }
  }
}

.attention {
  list-style: none;
  margin: 0;
  padding: 0;

  &__row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 20px;
    border-bottom: 1px solid #f1f3f7;
  }

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    @each $tone in 'ok', 'warn', 'bad', 'info' {
      &--#{$tone} {
        background: var(--tone-#{$tone}-bg);
        color: var(--tone-#{$tone}-fg);
      }
    }
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__detail {
    font-size: 12.5px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__btn {
    font-size: 13px;
    padding: 0 12px;
  }
}

.events {
  padding: 12px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__row {
    display: flex;
    gap: 12px;
  }

  &__time {
    width: 44px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-top: 4px;
  }

  &__hour {
    font-size: 14px;
    font-weight: 800;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }

  &__dur {
    font-size: 11.5px;
    color: var(--text-secondary);
  }

  &__card {
    flex: 1;
    min-width: 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: #eaf1fd;
    display: flex;
    flex-direction: column;
    gap: 2px;

    &--due {
      background: #fdeef3;

      .events__status {
        color: var(--tone-pink-fg);
      }
    }
  }

  &__name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-strong);
  }

  &__meta {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__package {
    font-size: 11.5px;
    color: var(--text-secondary);
    font-weight: 600;
  }

  &__status {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--tone-ok-fg);
  }
}

.bands {
  &__figure {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  &__free {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }

  &__of {
    font-size: 13.5px;
    color: var(--text-secondary);
  }

  &__bar {
    height: 8px;
    border-radius: 4px;
    background: #eef1f5;
    display: flex;
    gap: 2px;
    overflow: hidden;
  }

  &__seg {
    height: 100%;

    &--ok {
      background: var(--tone-ok-dot);
    }
    &--warn {
      background: #ffc107;
    }
    &--bad {
      background: var(--tone-bad-dot);
    }
  }

  &__legend {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    font-size: 12.5px;
    color: var(--text-secondary);

    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 4px;

    &--ok {
      background: var(--tone-ok-dot);
    }
    &--warn {
      background: #ffc107;
    }
    &--bad {
      background: var(--tone-bad-dot);
    }
  }
}
</style>
