<!-- src/components/historial/EditarOrdenModal.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { obtenerDetalleOrden } from '@/services/historialService'
import { comandasApi } from '@/api/comandasApi'
import MotivoCancelacionDialog from './MotivoCancelacionDialog.vue'
import type { DetalleOrden, DetalleProducto } from '@/api/historialApi'

interface DisplayItem {
  key: string
  tipo: 'combo' | 'suelto'
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  importe: number
  ids: string[]
  notas_especiales?: string | null
  hijos?: DetalleProducto[]
}

const props = defineProps<{ comandaId: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'orden-actualizada'): void
}>()

const $q = useQuasar()
const isLoading = ref(true)
const guardando = ref(false)
const orden = ref<DetalleOrden | null>(null)
const selectedKeys = ref<Set<string>>(new Set())

const itemsVisibles = computed<DisplayItem[]>(() => {
  if (!orden.value) return []

  const detalles = orden.value.detalles
  const comboNames = new Set<string>()

  for (const d of detalles) {
    if (d.nombre_combo_padre) comboNames.add(d.nombre_combo_padre)
  }

  const result: DisplayItem[] = []
  const usedParentIds = new Set<string>()

  for (const comboName of comboNames) {
    const hijos = detalles.filter((d) => d.nombre_combo_padre === comboName)
    const padre = detalles.find((d) => d.producto_nombre === comboName && !d.nombre_combo_padre)

    if (padre) {
      usedParentIds.add(padre.id)
      result.push({
        key: `combo-${padre.id}`,
        tipo: 'combo',
        producto_nombre: comboName,
        cantidad: padre.cantidad,
        precio_unitario: padre.precio_unitario,
        importe: padre.importe,
        ids: [padre.id, ...hijos.map((h) => h.id)],
        notas_especiales: padre.notas_especiales,
        hijos,
      })
    } else {
      for (const h of hijos) {
        result.push({
          key: `suelto-${h.id}`,
          tipo: 'suelto',
          producto_nombre: h.producto_nombre,
          cantidad: h.cantidad,
          precio_unitario: h.precio_unitario,
          importe: h.importe,
          ids: [h.id],
          notas_especiales: h.notas_especiales,
        })
      }
    }
  }

  for (const d of detalles) {
    if (!d.nombre_combo_padre && !usedParentIds.has(d.id)) {
      result.push({
        key: `suelto-${d.id}`,
        tipo: 'suelto',
        producto_nombre: d.producto_nombre,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        importe: d.importe,
        ids: [d.id],
        notas_especiales: d.notas_especiales,
      })
    }
  }

  return result
})

const todosSeleccionados = computed(() => {
  if (itemsVisibles.value.length === 0) return false
  return itemsVisibles.value.every((item) => selectedKeys.value.has(item.key))
})

const totalSeleccionado = computed(() => {
  return itemsVisibles.value
    .filter((item) => selectedKeys.value.has(item.key))
    .reduce((sum, item) => sum + item.importe, 0)
})

const idsAEliminar = computed(() => {
  const ids: string[] = []
  for (const item of itemsVisibles.value) {
    if (selectedKeys.value.has(item.key)) ids.push(...item.ids)
  }
  return ids
})

onMounted(async () => {
  try {
    orden.value = await obtenerDetalleOrden(props.comandaId)
  } finally {
    isLoading.value = false
  }
})

function toggleItem(key: string) {
  const next = new Set(selectedKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  selectedKeys.value = next
}

function toggleTodos() {
  if (todosSeleccionados.value) {
    selectedKeys.value = new Set()
  } else {
    selectedKeys.value = new Set(itemsVisibles.value.map((item) => item.key))
  }
}

async function confirmarEliminar() {
  if (idsAEliminar.value.length === 0 || !orden.value) return

  const esCancelacionTotal = idsAEliminar.value.length === orden.value.detalles.length

  if (esCancelacionTotal) {
    $q.dialog({
      component: MotivoCancelacionDialog,
      componentProps: {
        titulo: 'Cancelar orden completa',
        subtitulo: 'Se eliminarán todos los productos. La orden será cancelada automáticamente.',
        botonLabel: 'Cancelar orden',
      },
    }).onOk((motivo: string) => ejecutarEliminacion(motivo))
  } else {
    const restantes = orden.value.detalles.length - idsAEliminar.value.length
    $q.dialog({
      title: `Eliminar ${idsAEliminar.value.length} producto(s)`,
      message: `Quedará(n) ${restantes} producto(s) con un total recalculado. ¿Continuar?`,
      cancel: { label: 'No', flat: true, color: 'grey-7' },
      ok: { label: 'Eliminar productos', color: 'negative' },
      persistent: true,
    }).onOk(() => ejecutarEliminacion())
  }
}

async function ejecutarEliminacion(motivoCancelacion?: string) {
  if (!orden.value) return
  guardando.value = true

  try {
    const esCancelacionTotal = idsAEliminar.value.length === orden.value.detalles.length

    await comandasApi.modificarDetalles(
      props.comandaId,
      idsAEliminar.value,
      esCancelacionTotal ? motivoCancelacion : undefined,
    )

    $q.notify({
      type: 'positive',
      message: esCancelacionTotal
        ? 'Orden cancelada correctamente.'
        : 'Productos eliminados. Total recalculado.',
      position: 'top',
      timeout: 2500,
      icon: 'check_circle',
    })

    emit('orden-actualizada')
    emit('close')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'No se pudo modificar la orden.'
    $q.notify({ type: 'negative', message: msg, position: 'top', timeout: 4000 })
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop-blur" @click.self="$emit('close')">
    <div class="order-detail-card">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-container">
        <q-spinner size="32px" color="primary" />
        <p class="loading-text">Cargando detalle...</p>
      </div>

      <!-- Contenido -->
      <template v-else-if="orden">
        <!-- Header -->
        <div class="order-detail-header">
          <div class="header-left">
            <div class="title-row">
              <h2 class="order-title">Editar Orden #{{ orden.ticket_numero }}</h2>
              <span class="badge badge-pendiente">PENDIENTE</span>
            </div>
            <p class="order-meta">Selecciona los productos que deseas eliminar</p>
          </div>
          <button type="button" class="btn-close-x" @click="$emit('close')">
            <q-icon name="close" size="xs" />
          </button>
        </div>

        <!-- Select All -->
        <div class="select-all-bar">
          <label class="checkbox-row">
            <input
              type="checkbox"
              :checked="todosSeleccionados"
              class="custom-checkbox"
              @change="toggleTodos"
            />
            <span class="select-all-text">Seleccionar todo</span>
          </label>
          <span v-if="idsAEliminar.length > 0" class="selected-count">
            {{ idsAEliminar.length }} seleccionado(s) · -${{ totalSeleccionado.toFixed(2) }}
          </span>
        </div>

        <!-- Productos -->
        <div class="products-list">
          <template v-for="item in itemsVisibles" :key="item.key">
            <!-- Combo -->
            <div
              v-if="item.tipo === 'combo'"
              class="combo-group"
              :class="{ 'combo-selected': selectedKeys.has(item.key) }"
              @click="toggleItem(item.key)"
            >
              <label class="checkbox-row combo-checkbox" @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedKeys.has(item.key)"
                  class="custom-checkbox"
                  @change="toggleItem(item.key)"
                />
              </label>
              <div class="combo-body">
                <div class="combo-header-row">
                  <q-icon name="restaurant" size="14px" class="combo-icon" />
                  <span class="combo-name">{{ item.producto_nombre }}</span>
                  <span v-if="item.cantidad > 1" class="combo-qty">×{{ item.cantidad }}</span>
                </div>
                <p v-if="item.notas_especiales" class="product-note">
                  <q-icon name="warning" size="12px" /> {{ item.notas_especiales }}
                </p>
                <div v-if="item.hijos" class="combo-children">
                  <span v-for="h in item.hijos" :key="h.id" class="combo-child-chip">
                    {{ h.cantidad }}× {{ h.producto_nombre }}
                  </span>
                </div>
              </div>
              <p class="product-total-price">${{ item.importe.toFixed(2) }}</p>
            </div>

            <!-- Suelto -->
            <div
              v-else
              class="product-item"
              :class="{ 'product-selected': selectedKeys.has(item.key) }"
              @click="toggleItem(item.key)"
            >
              <label class="checkbox-row" @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedKeys.has(item.key)"
                  class="custom-checkbox"
                  @change="toggleItem(item.key)"
                />
              </label>
              <div class="product-qty-box">{{ item.cantidad }}x</div>
              <div class="product-details">
                <p class="product-name">{{ item.producto_nombre }}</p>
                <p v-if="item.notas_especiales" class="product-note">
                  <q-icon name="warning" size="12px" /> {{ item.notas_especiales }}
                </p>
                <p class="product-unit-price">${{ Number(item.precio_unitario).toFixed(2) }} c/u</p>
              </div>
              <p class="product-total-price">${{ item.importe.toFixed(2) }}</p>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="modal-actions-footer">
          <button type="button" class="btn-action-outline" @click="$emit('close')">Cancelar</button>
          <button
            type="button"
            class="btn-action-solid-red"
            :disabled="idsAEliminar.length === 0 || guardando"
            @click="confirmarEliminar"
          >
            <q-icon v-if="guardando" name="hourglass_empty" size="xs" class="q-mr-xs" />
            <q-icon v-else name="delete" size="xs" class="q-mr-xs" />
            {{ idsAEliminar.length === orden.detalles.length ? 'Cancelar Orden' : 'Eliminar' }}
            {{ idsAEliminar.length > 0 ? `(${idsAEliminar.length})` : '' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap');

.modal-backdrop-blur {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  box-sizing: border-box;
  z-index: 1000;
  font-family: 'Inter', sans-serif;
}

.order-detail-card {
  background-color: #ffffff;
  width: 100%;
  max-width: 540px;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 24px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.2),
    0 10px 10px -5px rgba(0, 0, 0, 0.1);
  padding: 32px;
  box-sizing: border-box;
  border: 1px solid #e2e8f0;
  position: relative;
  z-index: 10;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  gap: 12px;
}
.loading-text {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.order-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.order-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
}
.badge-pendiente {
  background-color: #0059bb;
  color: #ffffff;
}
.order-meta {
  font-size: 12px;
  color: #64748b;
  margin: 6px 0 0 0;
}
.btn-close-x {
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
}

.select-all-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 16px;
}
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.custom-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #0059bb;
  cursor: pointer;
}
.select-all-text {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}
.selected-count {
  font-size: 12px;
  font-weight: 700;
  color: #ba1a1a;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}
.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.product-item:hover {
  background-color: #f8fafc;
}
.product-selected {
  background-color: #fef2f2;
  border-color: #fca5a5;
}
.product-qty-box {
  width: 28px;
  height: 28px;
  background-color: #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #0059bb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.product-details {
  flex-grow: 1;
}
.product-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}
.product-unit-price {
  font-size: 11px;
  color: #64748b;
  margin: 2px 0 0 0;
}
.product-total-price {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  flex-shrink: 0;
}

/* ── Combo group card ─────────────────────────────────────────────── */
.combo-group {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #fde68a;
  border-radius: 12px;
  background-color: #fffbeb;
  cursor: pointer;
  transition: all 0.15s ease;
}
.combo-group:hover {
  background-color: #fef3c7;
}
.combo-selected {
  background-color: #fef2f2;
  border-color: #fca5a5;
}
.combo-checkbox {
  padding-top: 2px;
}
.combo-body {
  flex: 1;
  min-width: 0;
}
.combo-header-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.combo-icon {
  color: #92400e;
  flex-shrink: 0;
}
.combo-name {
  font-size: 14px;
  font-weight: 700;
  color: #92400e;
}
.combo-qty {
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
  background-color: #fde68a;
  padding: 1px 6px;
  border-radius: 9999px;
}
.combo-children {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.combo-child-chip {
  font-size: 11px;
  font-weight: 500;
  color: #78716c;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid #e7e5e4;
}
.product-note {
  font-size: 11px;
  color: #ba1a1a;
  margin: 4px 0 0 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.modal-actions-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
.btn-action-outline {
  height: 44px;
  padding: 0 20px;
  background: transparent;
  border: 1px solid #0059bb;
  color: #0059bb;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.btn-action-solid-red {
  height: 44px;
  padding: 0 28px;
  background-color: #ba1a1a;
  border: none;
  color: #ffffff;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.btn-action-solid-red:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
