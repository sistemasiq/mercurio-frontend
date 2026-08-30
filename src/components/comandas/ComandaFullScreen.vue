<template>
  <Teleport to="body">
    <!-- Envoltura SIEMPRE montada: se muestra/oculta con v-show para que el DOM
         nunca se re-monte en cada apertura/cierre (elimina el parpadeo). -->
    <Transition name="kds-fs-open">
      <div v-show="!!comanda" class="kds-fs-backdrop" @click.self="$emit('close')">
        <div ref="viewportEl" class="kds-fs-viewport">
          <!-- Al saltar a la siguiente comanda usa "kds-fs-fade": cross-fade
               SUPERPUESTO (sin out-in) para que nunca haya pantalla vacía.
               Al entregar/cerrar la última usa "kds-fs-close" (salida elegante). -->
          <Transition :name="cerrando ? 'kds-fs-close' : 'kds-fs-fade'" @before-enter="resetScroll">
            <div v-if="comanda" :key="comanda.id" class="kds-fs-sheet">
              <!-- ── Header compacto ─────────────────────── -->
              <header class="kds-fs-header">
                <div class="kds-fs-header-left">
                  <button
                    type="button"
                    class="kds-fs-btn-regresar"
                    aria-label="Regresar al listado de comandas"
                    @click="$emit('close')"
                  >
                    <q-icon name="arrow_back" size="xs" />
                    <span>Regresar</span>
                  </button>
                </div>

                <div class="kds-fs-header-center">
                  <p v-if="comanda.nombre_cliente" class="kds-fs-ticket">
                    {{ comanda.nombre_cliente }}
                  </p>
                  <h2 class="kds-fs-client-name">#{{ comanda.ticket_numero ?? comanda.id }}</h2>
                  <div class="kds-fs-badges">
                    <span class="kds-fs-badge badge-estado" :class="badgeEstadoClass">
                      <span class="kds-fs-badge-dot" />
                      {{ estadoLabel(comanda.estado_actual) }}
                    </span>
                    <span class="kds-fs-badge badge-servicio">
                      <q-icon :name="comanda.mesa ? 'table_bar' : 'storefront'" size="xs" />
                      {{ tipoEntrega }}
                    </span>
                  </div>
                </div>

                <div class="kds-fs-header-right">
                  <div class="kds-fs-time" :class="{ 'kds-fs-time--critico': tiempoCritico }">
                    <q-icon name="schedule" size="sm" class="kds-fs-time-icon" />
                    <span>{{ tiempoFormateado }}</span>
                  </div>
                  <button
                    type="button"
                    class="kds-fs-btn-close"
                    aria-label="Cerrar vista de comanda"
                    @click="$emit('close')"
                  >
                    <q-icon name="close" size="sm" />
                  </button>
                </div>
              </header>

              <!-- ── Cuerpo ───────────────────────────────── -->
              <main class="kds-fs-body">
                <div class="kds-fs-body-inner">
                  <p v-if="comanda.notas_generales" class="kds-fs-notes-generales">
                    <q-icon name="sticky_note_2" size="sm" />
                    <span>{{ comanda.notas_generales }}</span>
                  </p>

                  <div class="kds-fs-grid">
                    <template v-for="(el, i) in ticketsAgrupados" :key="el.key">
                      <!-- Grupo combo -->
                      <section
                        v-if="el.tipo === 'combo'"
                        :style="{ '--i': i }"
                        class="kds-fs-card kds-fs-card--combo"
                      >
                        <header class="kds-fs-combo-header">
                          <q-icon name="restaurant_menu" size="sm" />
                          <span>{{ el.nombre }}</span>
                          <span class="kds-fs-combo-count">{{ el.items.length }}</span>
                        </header>

                        <div class="kds-fs-combo-items">
                          <article
                            v-for="hijo in el.items"
                            :key="hijo.id"
                            class="kds-fs-combo-item"
                          >
                            <div class="kds-fs-qty kds-fs-qty--sm">{{ hijo.cantidad }}</div>
                            <div class="kds-fs-item-details">
                              <p class="kds-fs-item-name">
                                {{ hijo.nombre ?? hijo.producto_nombre }}
                              </p>
                              <p v-if="hijo.notas_especiales" class="kds-fs-item-notas">
                                <q-icon name="warning" size="xs" />
                                <span>{{ hijo.notas_especiales }}</span>
                              </p>
                            </div>
                          </article>
                        </div>

                        <p v-if="resumenCombo(el.items)" class="kds-fs-combo-incluye">
                          <span class="kds-fs-incluye-label">Incluye</span>
                          <span>{{ resumenCombo(el.items) }}</span>
                        </p>
                      </section>

                      <!-- Item suelto -->
                      <article v-else :style="{ '--i': i }" class="kds-fs-card">
                        <div class="kds-fs-qty">{{ el.item.cantidad }}</div>
                        <div class="kds-fs-item-details">
                          <p class="kds-fs-item-name">
                            {{ el.item.nombre ?? el.item.producto_nombre }}
                          </p>
                          <p v-if="el.item.notas_especiales" class="kds-fs-item-notas">
                            <q-icon name="warning" size="xs" />
                            <span>{{ el.item.notas_especiales }}</span>
                          </p>
                        </div>
                      </article>
                    </template>
                  </div>
                </div>
              </main>

              <!-- ── Footer flotante con acción ───────────── -->
              <footer class="kds-fs-footer">
                <button
                  v-if="esPendiente"
                  type="button"
                  class="kds-fs-btn btn-pendiente"
                  @click="emit('cambiar-estado', comanda.id, 'E')"
                >
                  <q-icon name="play_arrow" size="md" /> Comenzar Preparación
                </button>
                <button
                  v-else-if="esEnProceso"
                  type="button"
                  class="kds-fs-btn btn-accion"
                  @click="emit('cambiar-estado', comanda.id, 'L')"
                >
                  <q-icon name="check_circle" size="md" /> Listo para Entregar
                </button>
                <button
                  v-else-if="esListo"
                  type="button"
                  class="kds-fs-btn btn-entregar"
                  @click="emit('cambiar-estado', comanda.id, 'T')"
                >
                  <q-icon name="done_all" size="md" /> Entregar Pedido
                </button>
                <div v-else class="kds-fs-orden-finalizada">
                  <q-icon name="task_alt" size="md" />
                  Orden {{ estadoLabel(comanda.estado_actual) }}
                </div>
              </footer>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Comanda, DetalleComanda, EstadoActualComanda } from '@/types/comanda'

const props = defineProps<{ comanda: Comanda | null }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'cambiar-estado', comandaId: string, nuevoEstado: EstadoActualComanda): void
}>()

const viewportEl = ref<HTMLElement | null>(null)

// Cuando la comanda pasa a null (entregar la última o cerrar) se cambia el
// nombre de la transición interna a "kds-fs-close" para una salida elegante
// coordinada con el backdrop; al abrir otra, vuelve al avance "kds-fs-fade".
const cerrando = ref(false)
watch(
  () => props.comanda,
  (nueva) => {
    cerrando.value = nueva === null
  },
)

// Al saltar a la siguiente comanda se reinicia el scroll para que el nuevo
// contenido entre desde arriba, sin arrastrar la posición de la anterior.
const resetScroll = () => {
  if (viewportEl.value) viewportEl.value.scrollTop = 0
}

// Reloj ligero para refrescar el tiempo transcurrido cada 30s.
const now = ref(Date.now())
let timerId: number | null = null

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  timerId = window.setInterval(() => {
    now.value = Date.now()
  }, 30000)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (timerId !== null) window.clearInterval(timerId)
  window.removeEventListener('keydown', onKeydown)
})

const estadoLabel = (estado: EstadoActualComanda): string => {
  const labels: Record<EstadoActualComanda, string> = {
    P: 'PENDIENTE',
    E: 'EN PREPARACIÓN',
    L: 'LISTO PARA ENTREGA',
    T: 'ENTREGADO',
    C: 'CANCELADO',
  }
  return labels[estado] ?? estado
}

// Contador de tiempo en formato amigable: "23 min", "1 h", "1 h 12 min".
const tiempoFormateado = computed(() => {
  const f = props.comanda?.fecha_hora
  if (!f) return '--'
  const diffMin = Math.floor((now.value - new Date(f).getTime()) / 60000)
  if (diffMin < 1) return '--'
  if (diffMin < 60) return `${diffMin} min`
  const h = Math.floor(diffMin / 60)
  const m = diffMin % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
})

// A partir de 45 min el contador pasa a estilo de alerta.
const tiempoCritico = computed(() => {
  const f = props.comanda?.fecha_hora
  if (!f) return false
  const diffMin = Math.floor((now.value - new Date(f).getTime()) / 60000)
  return diffMin >= 45
})

interface ComboGroup {
  tipo: 'combo'
  key: string
  nombre: string
  items: DetalleComanda[]
}

interface Suelto {
  tipo: 'suelto'
  key: string
  item: DetalleComanda
}

type ElementoRender = ComboGroup | Suelto

const ticketsAgrupados = computed<ElementoRender[]>(() => {
  const detalles = props.comanda?.detalles ?? []

  const comboGroups = new Map<string, DetalleComanda[]>()
  for (const d of detalles) {
    // Un ítem solo se agrupa como parte de un combo cuando la orden lo trajo
    // así (es_hijo_de + nombre_combo_padre). Los productos vendidos sueltos
    // jamás deben heredar la etiqueta de un paquete. Cada unidad de combo se
    // agrupa por id_combo_padre para separar combos múltiples en tarjetas
    // independientes; sin instancia (datos legacy) se fusionan por nombre.
    if (d.nombre_combo_padre && d.es_hijo_de) {
      const key = d.id_combo_padre ?? d.nombre_combo_padre
      const arr = comboGroups.get(key)
      if (arr) arr.push(d)
      else comboGroups.set(key, [d])
    }
  }

  const resultado: ElementoRender[] = []
  const emittedCombos = new Set<string>()

  for (const detalle of detalles) {
    if (detalle.nombre_combo_padre && detalle.es_hijo_de) {
      const key = detalle.id_combo_padre ?? detalle.nombre_combo_padre
      if (!emittedCombos.has(key)) {
        emittedCombos.add(key)
        resultado.push({
          tipo: 'combo',
          key: `combo-${key}`,
          nombre: detalle.nombre_combo_padre,
          items: comboGroups.get(key)!,
        })
      }
    } else {
      resultado.push({ tipo: 'suelto', key: `suelto-${detalle.id}`, item: detalle })
    }
  }

  return resultado
})

// Desglose de lo que incluye cada combo: primero desde los propios hijos y,
// si no vienen ahí, desde el detalle padre (es_hijo_de → productos_combo).
const resumenCombo = (items: DetalleComanda[]): string => {
  const partes: string[] = []
  const vistos = new Set<string>()
  const agregar = (nombre?: string | null, cantidad?: number | null) => {
    if (!nombre) return
    const texto = `${cantidad ?? 1}× ${nombre}`
    if (!vistos.has(texto)) {
      vistos.add(texto)
      partes.push(texto)
    }
  }

  const todos = props.comanda?.detalles ?? []
  for (const item of items) {
    for (const p of item.productos_combo ?? []) agregar(p.nombre, p.cantidad)
    const padre = todos.find((d) => d.id === item.es_hijo_de)
    for (const p of padre?.productos_combo ?? []) agregar(p.nombre, p.cantidad)
  }
  return partes.join(' · ')
}

const esPendiente = computed(() => props.comanda?.estado_actual === 'P')
const esEnProceso = computed(() => props.comanda?.estado_actual === 'E')
const esListo = computed(() => props.comanda?.estado_actual === 'L')

const badgeEstadoClass = computed(() => {
  switch (props.comanda?.estado_actual) {
    case 'E':
      return 'badge-proceso'
    case 'L':
      return 'badge-listo'
    case 'P':
      return 'badge-pendiente'
    default:
      return 'badge-final'
  }
})

const tipoEntrega = computed(() => props.comanda?.mesa ?? 'MOSTRADOR')
</script>

<style lang="scss" scoped>
/* Envoltura siempre montada: la animación de apertura/cierre corre sobre el
   backdrop (v-show) sin que el DOM se re-monte. */
.kds-fs-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background-color: var(--bg-main);
  color: var(--text-primary);
}

.kds-fs-open-enter-active {
  transition:
    opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}
.kds-fs-open-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
/* Al cerrar el backdrop solo se desvanece (sin desplazamiento), dejando que
   la hoja interior sea quien ejecute el movimiento de salida. */
.kds-fs-open-leave-active {
  transition: opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity;
}
.kds-fs-open-leave-to {
  opacity: 0;
}

/* Contenedor de scroll del contenido (el backdrop no scrollea). */
.kds-fs-viewport {
  position: relative;
  height: 100%;
  overflow-y: auto;
}

/* Hoja que envuelve header + cuerpo + footer; al cambiar de comanda se
   re-crea (key = comanda.id) para disparar la transición del contenido. */
.kds-fs-sheet {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

/* Transición al saltar entre comandas: CROSS-FADE superpuesto (sin out-in).
   - La hoja nueva entra en flujo (define la altura) y asciende ligeramente.
   - La hoja anterior pasa a absoluta (anclada arriba, fuera del layout) y se
     desvanece encima de la nueva → NUNCA hay pantalla vacía ni parpadeo.
   - Las tarjetas se revelan con un pequeño ascenso escalonado pero SIEMPRE
     visibles (solo transform, sin opacidad) para no dar sensación de bug. */
.kds-fs-fade-enter-active {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}
.kds-fs-fade-enter-from {
  transform: translateY(12px);
}
.kds-fs-fade-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  transition: opacity 0.2s ease;
  will-change: opacity;
}
.kds-fs-fade-leave-to {
  opacity: 0;
}

/* Ascenso escalonado de las tarjetas: solo transform, siempre visibles */
.kds-fs-fade-enter-active .kds-fs-card {
  animation: kds-card-in 0.26s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--i, 0) * 35ms);
}
@keyframes kds-card-in {
  from {
    transform: translateY(10px);
  }
  to {
    transform: translateY(0);
  }
}

/* Salida elegante al ENTREGAR la última comanda (o cerrar): la hoja desciende
   suavemente, se contrae ligeramente (zoom-out) y se desvanece, coordinada con
   el fade del backdrop. Es la inversa del gesto de apertura (que sube). */
.kds-fs-close-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}
.kds-fs-close-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}

/* ── Header compacto ────────────────────────────────────── */
.kds-fs-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.kds-fs-header-left {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.kds-fs-btn-regresar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  background-color: var(--bg-card);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
  white-space: nowrap;
}
.kds-fs-btn-regresar:hover {
  background-color: var(--bg-main);
  color: var(--text-primary);
  border-color: var(--text-muted);
}

.kds-fs-header-center {
  text-align: center;
  min-width: 0;
}

.kds-fs-ticket {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  margin: 0;
  letter-spacing: -0.02em;
  white-space: nowrap;
}
.kds-fs-client-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.kds-fs-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.kds-fs-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  line-height: 1.4;
  white-space: nowrap;
}

.badge-estado .kds-fs-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.85;
}
.badge-proceso {
  background-color: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #b45309;
}
.badge-pendiente {
  background-color: var(--bg-main);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}
.badge-listo {
  background-color: rgba(63, 168, 52, 0.1);
  border: 1px solid rgba(63, 168, 52, 0.35);
  color: #2f7d2a;
}
.badge-final {
  background-color: var(--bg-main);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
}

.badge-servicio {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.kds-fs-header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 1;
}

.kds-fs-time {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 9999px;
  background-color: var(--bg-main);
  border: 1px solid var(--border-color);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
}
.kds-fs-time--critico {
  background-color: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.35);
  color: #dc2626;
}
.kds-fs-time--critico .kds-fs-time-icon {
  animation: kds-fs-pulse 2s ease-in-out infinite;
}
@keyframes kds-fs-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.kds-fs-btn-close {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  background-color: var(--bg-main);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.2s,
    transform 0.15s;
}
.kds-fs-btn-close:hover {
  background-color: var(--border-color);
}
.kds-fs-btn-close:active {
  transform: scale(0.94);
}

/* ── Cuerpo ─────────────────────────────────────────────── */
.kds-fs-body {
  flex: 1;
  display: flex;
  justify-content: center;
}

.kds-fs-body-inner {
  width: 100%;
  max-width: 880px;
  padding: 24px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kds-fs-notes-generales {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  background-color: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #92400e;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
}

/* Cuadrícula de platillos: rellena la pantalla en vez de una tarjeta solitaria */
.kds-fs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  align-items: start;
}

.kds-fs-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  border-radius: var(--radius-md);
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow 0.2s,
    border-color 0.2s;
}
.kds-fs-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--text-muted);
}

/* Cantidad en contenedor circular moderno */
.kds-fs-qty {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background-color: #eaf2ff;
  color: #025fe0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(2, 95, 224, 0.14);
}

.kds-fs-qty--sm {
  width: 34px;
  height: 34px;
  font-size: 15px;
  background-color: #fef3c7;
  color: #b45309;
  box-shadow: inset 0 0 0 1px rgba(180, 83, 9, 0.14);
}

.kds-fs-item-details {
  flex: 1;
  min-width: 0;
}

.kds-fs-item-name {
  font-size: 17px;
  font-weight: 650;
  margin: 0;
  line-height: 1.35;
  color: var(--text-primary);
}

.kds-fs-item-notas {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 0 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  background-color: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.28);
  color: #92400e;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

/* ── Combo ──────────────────────────────────────────────── */
.kds-fs-card--combo {
  grid-column: 1 / -1;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  background-color: rgba(255, 248, 235, 0.6);
}

.kds-fs-combo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 9999px;
  background-color: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #b45309;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  align-self: flex-start;
}
.kds-fs-combo-count {
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 9999px;
  background-color: rgba(180, 83, 9, 0.14);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.kds-fs-combo-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.kds-fs-combo-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
}

.kds-fs-combo-incluye {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background-color: var(--bg-card);
  border: 1px dashed var(--border-color);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
}
.kds-fs-incluye-label {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

/* ── Footer flotante ────────────────────────────────────── */
.kds-fs-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  padding: 16px 24px 20px;
  background-color: rgba(248, 250, 252, 0.9);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.kds-fs-btn {
  flex: 1;
  max-width: 560px;
  min-height: 58px;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  border: none;
  transition:
    transform 0.18s,
    box-shadow 0.18s,
    background-color 0.2s;
}
.kds-fs-btn:hover {
  transform: translateY(-2px);
}
.kds-fs-btn:active {
  transform: translateY(0) scale(0.99);
}

.btn-accion {
  background-color: #025fe0;
  color: #fff;
  box-shadow: 0 12px 24px -10px rgba(2, 95, 224, 0.55);
}
.btn-accion:hover {
  background-color: #0350c4;
  box-shadow: 0 16px 30px -10px rgba(2, 95, 224, 0.65);
}

.btn-pendiente {
  background-color: #0f172a;
  color: #fff;
  box-shadow: 0 12px 24px -10px rgba(15, 23, 42, 0.45);
}
.btn-pendiente:hover {
  background-color: #1e293b;
}

.btn-entregar {
  background-color: #16a34a;
  color: #fff;
  box-shadow: 0 12px 24px -10px rgba(22, 163, 74, 0.55);
}
.btn-entregar:hover {
  background-color: #15803d;
  box-shadow: 0 16px 30px -10px rgba(22, 163, 74, 0.65);
}

.kds-fs-orden-finalizada {
  flex: 1;
  max-width: 560px;
  min-height: 58px;
  border-radius: 14px;
  background-color: var(--bg-card);
  color: var(--text-muted);
  border: 1px dashed var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 900px) {
  .kds-fs-header {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px 16px;
  }
  .kds-fs-header-left {
    flex: 1;
  }
  .kds-fs-header-right {
    flex: none;
    gap: 8px;
  }
  .kds-fs-header-center {
    order: 3;
    width: 100%;
    text-align: center;
  }
  .kds-fs-ticket {
    font-size: 24px;
  }
  .kds-fs-time {
    padding: 6px 12px;
    font-size: 13px;
  }
  .kds-fs-body-inner {
    padding: 16px 16px 32px;
    gap: 16px;
  }
  .kds-fs-grid {
    grid-template-columns: 1fr;
  }
  .kds-fs-combo-items {
    grid-template-columns: 1fr;
  }
  .kds-fs-footer {
    padding: 12px 16px 16px;
  }
  .kds-fs-btn {
    font-size: 16px;
    min-height: 54px;
  }
}
</style>
