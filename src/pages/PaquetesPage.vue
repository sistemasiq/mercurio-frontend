<template>
  <q-page class="page-content list-page">
    <PageHeader title="Paquetes" subtitle="Paquetes de fiesta con precio base y capacidad.">
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nuevo Paquete"
          :disable="!authStore.currentBranchId"
          @click="abrirCrear"
        />
      </template>
    </PageHeader>

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      search-placeholder="Buscar paquete"
      :filters="FILTROS_ACTIVO"
      :count="`${paquetesVisibles.length} paquetes`"
    >
      <StateBlock
        v-if="store.error"
        variant="error"
        :body="store.error"
        action-label="Reintentar"
        @action="cargar"
      />
      <q-table
        v-else
        :rows="paquetesVisibles"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props">
            <span class="text-weight-bold">{{ props.row.nombre }}</span>
            <StatusBadge v-if="props.row.destacado" tone="pink" label="Destacado" class="q-ml-sm" />
            <span v-if="props.row.descripcion" class="cell-sub cell-ellipsis">
              {{ props.row.descripcion }}
            </span>
            <span v-if="props.row.tipos_evento?.length" class="cell-sub">
              {{ props.row.tipos_evento.map((t: { nombre: string }) => t.nombre).join(' · ') }}
            </span>
          </q-td>
        </template>
        <template #body-cell-precio_base="props">
          <q-td :props="props" class="text-weight-bold">
            {{ formatMXN(Number(props.row.precio_base)) }}
          </q-td>
        </template>
        <template #body-cell-precio_hora_pulsera="props">
          <q-td :props="props">{{ formatMXN(Number(props.row.precio_hora_pulsera)) }}</q-td>
        </template>
        <template #body-cell-productos_incluidos="props">
          <q-td :props="props" class="cell-muted">
            <template v-if="props.row.productos_incluidos?.length">
              {{
                props.row.productos_incluidos
                  .map((i: PaqueteProductoIncluido) => `${i.cantidad}× ${i.nombre}`)
                  .join(', ')
              }}
            </template>
            <template v-else>—</template>
          </q-td>
        </template>
        <template #body-cell-activo="props">
          <q-td :props="props">
            <StatusBadge
              :tone="props.row.activo ? 'ok' : 'off'"
              :label="props.row.activo ? 'Activo' : 'Inactivo'"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-toggle
              :model-value="props.row.activo"
              dense
              :aria-label="props.row.activo ? 'Desactivar' : 'Activar'"
              @update:model-value="toggleActivo(props.row)"
            />
            <q-btn
              flat
              round
              dense
              icon="edit"
              class="action-btn"
              aria-label="Editar"
              @click="abrirEditar(props.row)"
            />
            <q-btn
              flat
              round
              dense
              icon="content_copy"
              class="action-btn"
              aria-label="Duplicar"
              :loading="duplicandoId === props.row.id"
              @click="duplicar(props.row)"
            />
            <q-btn
              flat
              round
              dense
              icon="delete"
              class="action-btn"
              aria-label="Eliminar"
              @click="confirmarEliminar(props.row)"
            />
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="filtrando ? 'no-results' : 'empty'"
            :title="filtrando ? undefined : 'No hay paquetes registrados'"
            :body="filtrando ? undefined : 'Crea el primer paquete de fiesta.'"
            :action-label="filtrando ? 'Limpiar filtros' : 'Nuevo Paquete'"
            @action="filtrando ? ((busqueda = ''), (filtro = 'todos')) : abrirCrear()"
          />
        </template>
      </q-table>
    </DataTableCard>

    <BaseDialog
      v-model="dialogOpen"
      :title="editando ? 'Editar paquete' : 'Nuevo paquete'"
      :subtitle="editando ? editando.nombre : 'Precio base, capacidad y alimentos incluidos.'"
      icon="card_giftcard"
      :width="640"
      persistent
      :primary-label="editando ? 'Guardar cambios' : 'Crear paquete'"
      :loading="guardando"
      @cancel="cerrarDialog"
      @confirm="guardar"
    >
      <div class="form-grid">
        <span class="form-grid__section">General</span>
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Nombre</span>
          <q-input
            ref="nombreRef"
            v-model="formDialog.nombre"
            dense
            outlined
            autofocus
            placeholder="Ej. Paquete Clásico"
            :rules="[(v) => !!v || 'El nombre es requerido']"
            hide-bottom-space
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Precio base</span>
          <q-input
            v-model.number="formDialog.precio_base"
            dense
            outlined
            type="number"
            min="0"
            step="0.01"
            prefix="$"
            :rules="[(v) => v > 0 || 'Debe ser mayor a 0']"
            hide-bottom-space
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Precio por pulsera, por hora</span>
          <q-input
            v-model.number="formDialog.precio_hora_pulsera"
            dense
            outlined
            type="number"
            min="0"
            step="0.01"
            prefix="$"
            hint="Por cada invitado y por cada hora del evento, además del precio base"
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Mínimo de invitados</span>
          <q-input
            v-model.number="formDialog.min_invitados"
            dense
            outlined
            type="number"
            min="1"
            :rules="[(v) => v > 0 || 'Debe ser mayor a 0']"
            hide-bottom-space
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Máximo de invitados</span>
          <q-input
            v-model.number="formDialog.max_invitados"
            dense
            outlined
            type="number"
            min="1"
            :rules="[
              (v) => v > 0 || 'Debe ser mayor a 0',
              (v) => v >= formDialog.min_invitados || 'No puede ser menor que el mínimo',
            ]"
            hide-bottom-space
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Duración estimada</span>
          <q-input
            v-model.number="formDialog.duracion_horas"
            dense
            outlined
            type="number"
            min="0.5"
            step="0.5"
            suffix="h"
            placeholder="Opcional"
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Anticipo sugerido</span>
          <q-input
            v-model.number="formDialog.anticipo_porcentaje"
            dense
            outlined
            type="number"
            min="1"
            max="100"
            suffix="%"
            placeholder="Opcional"
            :rules="[(v) => v === null || v === '' || (v > 0 && v <= 100) || 'Entre 1 y 100']"
            hide-bottom-space
          />
        </label>
        <div class="form-grid__toggle">
          <q-toggle v-model="formDialog.destacado" label="Destacar al reservar" />
        </div>
        <p class="form-grid__field form-grid__field--full form-grid__note">
          Al reservar solo se ofrecerán los paquetes cuyo rango cubra el número de niños que pida
          el cliente.
        </p>
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Descripción</span>
          <q-input
            v-model="formDialog.descripcion"
            dense
            outlined
            type="textarea"
            rows="2"
            placeholder="Descripción breve del paquete (opcional)"
          />
        </label>

        <span class="form-grid__section">Alimentos incluidos</span>
        <div class="form-grid__field form-grid__field--full">
          <div class="incl-add">
            <q-select
              v-model="productoIncluidoTemporal.producto_id"
              dense
              outlined
              emit-value
              map-options
              option-value="id"
              option-label="nombre"
              :options="productosDisponiblesParaIncluir"
              placeholder="Elige un producto"
              no-options-label="No hay más productos disponibles"
              class="incl-add__select"
            />
            <q-input
              v-model.number="productoIncluidoTemporal.cantidad"
              dense
              outlined
              type="number"
              min="1"
              class="incl-add__qty"
              aria-label="Cantidad"
            />
            <q-btn
              unelevated
              color="primary"
              icon="add"
              aria-label="Agregar"
              @click="agregarProductoIncluido"
            />
          </div>
          <div class="incl-list">
            <p v-if="formDialog.productos_incluidos.length === 0" class="incl-list__empty">
              Sin alimentos incluidos.
            </p>
            <div
              v-for="(item, index) in formDialog.productos_incluidos"
              :key="item.producto_id"
              class="incl-list__row"
            >
              <span class="incl-list__name">{{ obtenerNombreProducto(item.producto_id) }}</span>
              <div class="qty-stepper">
                <button
                  type="button"
                  aria-label="Quitar uno"
                  @click="ajustarCantidadIncluido(item, -1)"
                >
                  <q-icon name="remove" size="16px" />
                </button>
                <span>{{ item.cantidad }}</span>
                <button
                  type="button"
                  aria-label="Agregar uno"
                  @click="ajustarCantidadIncluido(item, 1)"
                >
                  <q-icon name="add" size="16px" />
                </button>
              </div>
              <q-btn
                flat
                round
                dense
                icon="delete"
                class="action-btn"
                aria-label="Quitar"
                @click="removerProductoIncluido(index)"
              />
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>

    <BaseDialog
      v-model="dialogEliminar"
      title="Eliminar paquete"
      :subtitle="filaEliminar?.nombre"
      icon="delete"
      tone="red"
      :width="460"
      primary-label="Eliminar"
      danger
      :loading="eliminando"
      @confirm="ejecutarEliminar"
    >
      Las reservaciones existentes con este paquete no se modifican. Dejará de estar disponible para
      nuevas reservaciones.
    </BaseDialog>
  </q-page>
</template>

<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip } from '@/types/ui'
import { formatMXN } from '@/utils/formatoMoneda'
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { usePaquetesStore } from '@/stores/paquetes'
import { useProductosStore } from '@/stores/productos'
import { paquetesApi } from '@/api/paquetesApi'
import type { Paquetes, PaqueteProductoItem, PaqueteProductoIncluido } from '@/types/paquetes'

const $q = useQuasar()
const authStore = useAuthStore()
const store = usePaquetesStore()
const productosStore = useProductosStore()

const cargar = () => {
  if (authStore.currentBranchId) {
    store.cargar(authStore.currentBranchId)
    productosStore.cargar(authStore.currentBranchId)
  }
}

onMounted(cargar)

// ── Alimentos incluidos ────────────────────────────────────────────────────────

const productoIncluidoTemporal = ref({ producto_id: '', cantidad: 1 })

const productosDisponiblesParaIncluir = computed(() => {
  const yaAgregados = new Set(formDialog.value.productos_incluidos.map((i) => i.producto_id))
  return productosStore.productos.filter(
    (p) => p.tipo !== 'C' && p.tipo !== 'S' && p.tipo !== 'E' && p.activo && !yaAgregados.has(p.id),
  )
})

const agregarProductoIncluido = () => {
  const { producto_id, cantidad } = productoIncluidoTemporal.value
  if (!producto_id || cantidad <= 0) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona un producto y una cantidad válida.',
      position: 'top-right',
    })
    return
  }
  const existente = formDialog.value.productos_incluidos.find(
    (item) => item.producto_id === producto_id,
  )
  if (existente) {
    existente.cantidad += cantidad
  } else {
    formDialog.value.productos_incluidos.push({ producto_id, cantidad })
  }
  productoIncluidoTemporal.value = { producto_id: '', cantidad: 1 }
}

const ajustarCantidadIncluido = (item: PaqueteProductoItem, delta: number) => {
  item.cantidad = Math.max(1, item.cantidad + delta)
}

const removerProductoIncluido = (index: number) => {
  formDialog.value.productos_incluidos.splice(index, 1)
}

const obtenerNombreProducto = (id: string) => {
  const prod = productosStore.productos.find((p) => p.id === id)
  return prod ? prod.nombre : 'Producto no encontrado'
}

type FiltroActivo = 'todos' | 'activos' | 'inactivos'
const FILTROS_ACTIVO: FilterChip<FiltroActivo>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]
const filtro = ref<FiltroActivo | null>('todos')
const busqueda = ref('')
const filtrando = computed(() => !!busqueda.value || filtro.value !== 'todos')

const paquetesVisibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return store.paquetes
    .filter((p) => filtro.value === 'todos' || p.activo === (filtro.value === 'activos'))
    .filter((p) => !q || `${p.nombre} ${p.descripcion ?? ''}`.toLowerCase().includes(q))
})

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  {
    name: 'precio_base',
    label: 'Precio base',
    field: 'precio_base',
    align: 'right',
    sortable: true,
  },
  {
    name: 'precio_hora_pulsera',
    label: 'Pulsera/hora',
    field: 'precio_hora_pulsera',
    align: 'right',
    sortable: true,
  },
  {
    name: 'invitados',
    label: 'Invitados',
    field: (row: Paquetes) => `${row.min_invitados} a ${row.max_invitados}`,
    align: 'left',
  },
  {
    name: 'productos_incluidos',
    label: 'Incluye',
    field: 'productos_incluidos',
    align: 'left',
  },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<Paquetes | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formDialog = ref({
  nombre: '',
  descripcion: '',
  min_invitados: 1,
  max_invitados: 10,
  precio_base: 0,
  precio_hora_pulsera: 0,
  duracion_horas: null as number | null,
  anticipo_porcentaje: null as number | null,
  destacado: false,
  productos_incluidos: [] as PaqueteProductoItem[],
})

// Un número vacío del q-input llega como '' (v-model.number no lo convierte).
const decimalOpcional = (v: number | string | null): string | null =>
  v === null || v === '' || !Number.isFinite(Number(v)) ? null : String(v)

const abrirCrear = () => {
  editando.value = null
  formDialog.value = {
    nombre: '',
    descripcion: '',
    min_invitados: 1,
    max_invitados: 10,
    precio_base: 0,
    precio_hora_pulsera: 0,
    duracion_horas: null,
    anticipo_porcentaje: null,
    destacado: false,
    productos_incluidos: [],
  }
  productoIncluidoTemporal.value = { producto_id: '', cantidad: 1 }
  dialogOpen.value = true
}

const abrirEditar = async (row: Paquetes) => {
  editando.value = row
  let productosIncluidosCargados: PaqueteProductoItem[]

  try {
    const detalle = await paquetesApi.obtener(row.id)
    productosIncluidosCargados = (detalle.productos_incluidos ?? []).map((item) => ({
      producto_id: item.producto_id,
      cantidad: item.cantidad,
    }))
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
    return
  }

  formDialog.value = {
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    min_invitados: row.min_invitados,
    max_invitados: row.max_invitados,
    precio_base: Number(row.precio_base),
    precio_hora_pulsera: Number(row.precio_hora_pulsera),
    duracion_horas: row.duracion_horas === null ? null : Number(row.duracion_horas),
    anticipo_porcentaje: row.anticipo_porcentaje === null ? null : Number(row.anticipo_porcentaje),
    destacado: row.destacado,
    productos_incluidos: productosIncluidosCargados,
  }
  productoIncluidoTemporal.value = { producto_id: '', cantidad: 1 }
  dialogOpen.value = true
}

const cerrarDialog = () => {
  dialogOpen.value = false
  editando.value = null
}

const duplicandoId = ref<string | null>(null)

const duplicar = async (row: Paquetes) => {
  duplicandoId.value = row.id
  try {
    const copia = await store.duplicarPaquete(row.id)
    $q.notify({ type: 'positive', message: `Se creó "${copia.nombre}"`, position: 'top-right' })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    duplicandoId.value = null
  }
}

const guardar = async () => {
  if (!formDialog.value.nombre.trim()) {
    nombreRef.value?.validate()
    return
  }
  if (formDialog.value.precio_base <= 0) {
    $q.notify({
      type: 'warning',
      message: 'El precio debe ser mayor a cero.',
      position: 'top-right',
    })
    return
  }
  // Un rango invertido dejaría el paquete invisible en el asistente de reservación.
  if (formDialog.value.max_invitados < formDialog.value.min_invitados) {
    $q.notify({
      type: 'warning',
      message: 'El máximo de invitados no puede ser menor que el mínimo.',
      position: 'top-right',
    })
    return
  }
  guardando.value = true
  try {
    if (editando.value) {
      await store.editarPaquete(editando.value.id, {
        nombre: formDialog.value.nombre.trim(),
        descripcion: formDialog.value.descripcion.trim() || null,
        min_invitados: formDialog.value.min_invitados,
        max_invitados: formDialog.value.max_invitados,
        precio_base: String(formDialog.value.precio_base),
        precio_hora_pulsera: String(formDialog.value.precio_hora_pulsera),
        duracion_horas: decimalOpcional(formDialog.value.duracion_horas),
        anticipo_porcentaje: decimalOpcional(formDialog.value.anticipo_porcentaje),
        destacado: formDialog.value.destacado,
        productos_incluidos: formDialog.value.productos_incluidos,
      })
      $q.notify({ type: 'positive', message: 'Paquete actualizado', position: 'top-right' })
    } else {
      if (!authStore.currentBranchId) return
      await store.crearPaquete({
        nombre: formDialog.value.nombre.trim(),
        descripcion: formDialog.value.descripcion.trim() || null,
        min_invitados: formDialog.value.min_invitados,
        max_invitados: formDialog.value.max_invitados,
        precio_base: String(formDialog.value.precio_base),
        precio_hora_pulsera: String(formDialog.value.precio_hora_pulsera),
        duracion_horas: decimalOpcional(formDialog.value.duracion_horas),
        anticipo_porcentaje: decimalOpcional(formDialog.value.anticipo_porcentaje),
        destacado: formDialog.value.destacado,
        productos_incluidos: formDialog.value.productos_incluidos,
        sucursal_id: authStore.currentBranchId,
      })
      $q.notify({ type: 'positive', message: 'Paquete creado', position: 'top-right' })
    }
    cerrarDialog()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    guardando.value = false
  }
}

// ── Toggle activo ─────────────────────────────────────────────────────────────

const toggleActivo = async (row: Paquetes) => {
  try {
    await store.editarPaquete(row.id, { activo: !row.activo })
    $q.notify({
      type: 'positive',
      message: `Paquete ${!row.activo ? 'activado' : 'desactivado'}`,
      position: 'top-right',
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  }
}

// ── Eliminar ──────────────────────────────────────────────────────────────────

const dialogEliminar = ref(false)
const filaEliminar = ref<Paquetes | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: Paquetes) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await store.eliminarPaquete(filaEliminar.value.id)
    $q.notify({ type: 'positive', message: 'Paquete eliminado', position: 'top-right' })
    dialogEliminar.value = false
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    eliminando.value = false
  }
}
</script>

<style scoped lang="scss">
.form-grid__note {
  margin: -4px 0 0;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.incl-add {
  display: flex;
  gap: 8px;

  &__select {
    flex: 1;
  }

  &__qty {
    width: 80px;
  }
}

.incl-list {
  margin-top: 10px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;

  &__empty {
    margin: 0;
    padding: 12px 14px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px 8px 14px;
    border-bottom: 1px solid #f1f3f7;

    &:last-child {
      border-bottom: 0;
    }
  }

  &__name {
    flex: 1;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-primary);
  }
}
</style>
