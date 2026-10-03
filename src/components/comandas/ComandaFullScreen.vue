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
              <!-- ── Encabezado ─────────────────────────── -->
              <header class="kds-fs-head">
                <button
                  type="button"
                  class="kds-fs-back"
                  aria-label="Regresar al tablero de cocina"
                  @click="$emit('close')"
                >
                  <q-icon name="arrow_back" size="18px" />Cocina
                </button>

                <div class="kds-fs-head__main">
                  <div class="kds-fs-head__title">
                    <h2 class="kds-fs-folio">#{{ comanda.ticket_numero ?? comanda.id }}</h2>
                    <StatusBadge :tone="estado.tono" :label="estado.label" />
                  </div>
                  <div class="kds-fs-head__meta">
                    <span class="kds-fs-meta">
                      <q-icon :name="comanda.mesa ? 'table_bar' : 'storefront'" size="17px" />
                      {{ tipoEntrega }}
                    </span>
                    <span v-if="comanda.nombre_cliente" class="kds-fs-meta">
                      <q-icon name="person" size="17px" />{{ comanda.nombre_cliente }}
                    </span>
                  </div>
                </div>

                <span class="kds-fs-time" :class="{ 'kds-fs-time--late': retrasada }">
                  <q-icon name="schedule" size="18px" />{{ etiquetaTiempo }}
                </span>
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  class="kds-fs-close"
                  aria-label="Cerrar vista de comanda"
                  @click="$emit('close')"
                />
              </header>

              <!-- ── Cuerpo ───────────────────────────────── -->
              <main class="kds-fs-body">
                <div v-if="comanda.notas_generales" class="list-page__note list-page__note--warn">
                  <q-icon name="sticky_note_2" size="19px" />{{ comanda.notas_generales }}
                </div>

                <span class="kds-fs-section">
                  Productos <span class="kds-fs-section__count">{{ totalPiezas }}</span>
                </span>

                <div class="kds-fs-grid">
                  <template v-for="(el, i) in ticketsAgrupados" :key="el.key">
                    <!-- Grupo combo -->
                    <section
                      v-if="el.tipo === 'combo'"
                      :style="{ '--i': i }"
                      class="kds-fs-card kds-fs-card--combo"
                    >
                      <header class="kds-fs-combo__head">
                        <q-icon name="restaurant_menu" size="18px" />
                        <span class="kds-fs-combo__name">{{ el.nombre }}</span>
                        <span class="kds-fs-combo__count">{{ el.items.length }}</span>
                      </header>

                      <div class="kds-fs-combo__items">
                        <div v-for="hijo in el.items" :key="hijo.id" class="kds-fs-item">
                          <span class="kds-fs-qty">{{ hijo.cantidad }}×</span>
                          <div class="kds-fs-item__body">
                            <span class="kds-fs-item__name">
                              {{ hijo.nombre ?? hijo.producto_nombre }}
                            </span>
                            <span v-if="hijo.notas_especiales" class="kds-fs-item__note">
                              <q-icon name="warning" size="15px" />{{ hijo.notas_especiales }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p v-if="resumenCombo(el.items)" class="kds-fs-combo__includes">
                        <span class="kds-fs-combo__includes-label">Incluye</span>
                        {{ resumenCombo(el.items) }}
                      </p>
                    </section>

                    <!-- Producto suelto -->
                    <article v-else :style="{ '--i': i }" class="kds-fs-card kds-fs-item">
                      <span class="kds-fs-qty">{{ el.item.cantidad }}×</span>
                      <div class="kds-fs-item__body">
                        <span class="kds-fs-item__name">
                          {{ el.item.nombre ?? el.item.producto_nombre }}
                        </span>
                        <span v-if="el.item.notas_especiales" class="kds-fs-item__note">
                          <q-icon name="warning" size="15px" />{{ el.item.notas_especiales }}
                        </span>
                      </div>
                    </article>
                  </template>
                </div>
              </main>

              <!-- ── Pie con la acción del estado ─────────── -->
              <footer class="kds-fs-foot">
                <q-btn
                  v-if="esPendiente"
                  unelevated
                  color="primary"
                  icon="play_arrow"
                  label="Iniciar preparación"
                  class="kds-fs-action"
                  @click="emit('cambiar-estado', comanda.id, 'E')"
                />
                <q-btn
                  v-else-if="esEnProceso"
                  unelevated
                  color="positive"
                  icon="check_circle"
                  label="Marcar lista"
                  class="kds-fs-action"
                  @click="emit('cambiar-estado', comanda.id, 'L')"
                />
                <q-btn
                  v-else-if="esListo"
                  unelevated
                  icon="done_all"
                  label="Entregada"
                  class="kds-fs-action kds-fs-action--deliver"
                  @click="emit('cambiar-estado', comanda.id, 'T')"
                />
                <div v-else class="kds-fs-done">
                  <q-icon name="task_alt" size="20px" />Comanda {{ estado.label.toLowerCase() }}
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
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { Comanda, DetalleComanda, EstadoActualComanda } from '@/types/comanda'
import type { UiTone } from '@/types/ui'

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

// Mismos tonos y nombres que las columnas del tablero de cocina.
const ESTADOS: Record<EstadoActualComanda, { label: string; tono: UiTone }> = {
  P: { label: 'Nueva', tono: 'pink' },
  E: { label: 'En preparación', tono: 'warn' },
  L: { label: 'Lista para entregar', tono: 'ok' },
  T: { label: 'Entregada', tono: 'off' },
  C: { label: 'Cancelada', tono: 'bad' },
}
const estado = computed(() => ESTADOS[props.comanda?.estado_actual ?? 'P'])

// Minutos desde que entró la orden (o desde que quedó lista), con el mismo
// umbral de retraso que la tarjeta del tablero.
const UMBRAL_RETRASO_MIN = 10
const minutos = computed(() => {
  const c = props.comanda
  if (!c) return null
  const desde = c.estado_actual === 'L' ? (c.updated_at ?? c.fecha_hora) : c.fecha_hora
  if (!desde) return null
  return Math.max(0, Math.floor((now.value - new Date(desde).getTime()) / 60000))
})
const retrasada = computed(
  () => !esListo.value && minutos.value !== null && minutos.value >= UMBRAL_RETRASO_MIN,
)
const etiquetaTiempo = computed(() => {
  const m = minutos.value
  if (m === null) return '--'
  const texto = m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`
  return esListo.value ? `lista hace ${texto}` : texto
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

const tipoEntrega = computed(() =>
  props.comanda?.mesa ? `Mesa ${props.comanda.mesa}` : 'Mostrador',
)

const totalPiezas = computed(() =>
  (props.comanda?.detalles ?? []).reduce((s, d) => s + (d.cantidad ?? 0), 0),
)
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

/* ── Encabezado ─────────────────────────────────────────── */
.kds-fs-head {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 32px;
  background: #fff;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
}

.kds-fs-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--border-input);
  border-radius: var(--radius-control);
  background: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-body);
  cursor: pointer;

  &:hover {
    background: var(--bg-muted);
  }
}

.kds-fs-folio {
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-strong);
  font-variant-numeric: tabular-nums;
}

.kds-fs-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.kds-fs-time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 14px;
  border-radius: var(--radius-control);
  background: var(--bg-muted);
  font-size: 15px;
  font-weight: 800;
  color: var(--text-body);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;

  &--late {
    background: var(--tone-bad-bg);
    color: var(--tone-bad-fg);

    .q-icon {
      animation: kds-fs-pulse 2s ease-in-out infinite;
    }
  }
}

@keyframes kds-fs-pulse {
  50% {
    opacity: 0.35;
  }
}

.kds-fs-close {
  color: var(--text-secondary);
}

/* ── Cuerpo ─────────────────────────────────────────────── */
.kds-fs-body {
  flex: 1;
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  padding: 28px 32px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kds-fs-body .list-page__note {
  font-size: 15px;
}

.kds-fs-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-secondary);

  &__count {
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--bg-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 0;
    color: var(--text-body);
  }
}

.kds-fs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  align-items: start;
}

.kds-fs-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px 18px;

  &--combo {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.kds-fs-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__name {
    font-size: 18px;
    line-height: 1.35;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__note {
    display: inline-flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 14px;
    font-weight: 700;
    color: #c2410c;
  }
}

.kds-fs-qty {
  min-width: 40px;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 800;
  color: var(--q-primary);
  font-variant-numeric: tabular-nums;
}

.kds-fs-combo {
  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
  }

  &__name {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__count {
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--tone-warn-bg);
    color: var(--tone-warn-fg);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
  }

  &__items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;

    .kds-fs-item {
      padding: 12px 14px;
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-control);
      background: var(--bg-subtle);
    }
  }

  &__includes {
    margin: 0;
    padding-top: 10px;
    border-top: 1px dashed var(--border-color);
    font-size: 13.5px;
    color: var(--text-secondary);
  }

  &__includes-label {
    margin-right: 6px;
    font-size: 11.5px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
}

/* ── Pie ────────────────────────────────────────────────── */
.kds-fs-foot {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  padding: 16px 32px;
  background: #fff;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.kds-fs-action {
  width: 100%;
  max-width: 520px;
  min-height: 56px;
  font-size: 17px;
  font-weight: 800;

  &--deliver {
    background: var(--tone-info-bg);
    color: var(--q-primary);
  }
}

.kds-fs-done {
  width: 100%;
  max-width: 520px;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-control);
  font-size: 15px;
  font-weight: 700;
  color: var(--text-secondary);
}

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 900px) {
  .kds-fs-head {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 16px;

    &__main {
      order: 3;
      flex-basis: 100%;
    }
  }

  .kds-fs-back {
    margin-right: auto;
  }

  .kds-fs-folio {
    font-size: 24px;
  }

  .kds-fs-body {
    padding: 16px 16px 32px;
  }

  .kds-fs-grid,
  .kds-fs-combo__items {
    grid-template-columns: 1fr;
  }

  .kds-fs-foot {
    padding: 12px 16px;
  }
}
</style>
