<template>
  <q-page class="page-content list-page">
    <PageHeader title="Sucursales" subtitle="Sucursales de la franquicia.">
      <template #actions>
        <q-btn
          v-if="auth.hasPermission('sucursales:crear')"
          unelevated
          color="primary"
          icon="add"
          label="Nueva Sucursal"
          @click="crearNuevaSucursal"
        />
      </template>
    </PageHeader>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      :filters="FILTROS"
      search-placeholder="Buscar por clave o nombre"
      :count="`${sucursales.length} sucursales`"
    >
      <q-table
        :rows="sucursales"
        :columns="columns"
        row-key="id"
        flat
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props">
            <button type="button" class="branch-link" @click="verDetalle(props.row.id)">
              {{ props.row.nombre }}
            </button>
            <div class="cell-sub">{{ props.row.clave }}</div>
          </q-td>
        </template>
        <template #body-cell-direccion="props">
          <q-td :props="props" class="cell-muted cell-ellipsis" :title="props.row.ciudad">
            {{ props.row.ciudad }}
          </q-td>
        </template>
        <template #body-cell-gerente="props">
          <q-td :props="props">{{ props.row.gerente ?? '—' }}</q-td>
        </template>
        <template #body-cell-fechaCreacion="props">
          <q-td :props="props" class="cell-muted">
            {{ props.row.fechaCreacion ? formatFecha(props.row.fechaCreacion) : '—' }}
          </q-td>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <StatusBadge
              :tone="props.row.statusClave === 'activa' ? 'ok' : 'off'"
              :label="props.row.statusClave === 'activa' ? 'Activa' : 'Inactiva'"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              icon="visibility"
              class="action-btn"
              aria-label="Ver detalle"
              @click="verDetalle(props.row.id)"
            />
            <q-btn
              v-if="auth.hasPermission('sucursales:editar')"
              flat
              round
              dense
              icon="edit"
              class="action-btn"
              aria-label="Editar"
              @click="abrirEditar(props.row.id)"
            />
            <q-btn
              v-if="props.row.statusClave === 'activa'"
              flat
              round
              dense
              icon="block"
              class="action-btn"
              aria-label="Desactivar"
              @click="eliminarSucursal(props.row)"
            />
            <q-btn
              v-else
              flat
              round
              dense
              icon="restart_alt"
              class="action-btn"
              aria-label="Reactivar"
              @click="reactivarSucursal(props.row)"
            />
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="filtrando ? 'no-results' : 'empty'"
            :title="filtrando ? undefined : 'No hay sucursales registradas'"
            :action-label="filtrando ? 'Limpiar filtros' : undefined"
            @action="limpiarFiltros"
          />
        </template>
      </q-table>
    </DataTableCard>

    <SucursalFormDialog v-model="formAbierto" :branch-id="editandoId" @saved="cargarSucursales" />

    <SucursalModalDesactivar
      v-model="mostrarModalDesactivar"
      :sucursal="sucursalADesactivar"
      @confirmar="confirmarDesactivacion"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notify } from 'quasar'
import type { QTableColumn } from 'quasar'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import SucursalFormDialog from '@/components/sucursales/SucursalFormDialog.vue'
import SucursalModalDesactivar from '@/components/sucursales/SucursalModalDesactivar.vue'
import { useSucursales } from '@/composables/useSucursales'
import { branchService } from '@/services/branchService'
import { useAuthStore } from '@/stores/auth'
import type { Sucursal } from '@/composables/useSucursales'
import type { FilterChip } from '@/types/ui'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const { sucursales, loading, busqueda, filtros, cargarSucursales, verDetalle } = useSucursales()

const mostrarModalDesactivar = ref(false)
const sucursalADesactivar = ref<Sucursal | null>(null)

type Filtro = 'todas' | 'activa' | 'inactiva'
const FILTROS: FilterChip<Filtro>[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Activas', value: 'activa' },
  { label: 'Inactivas', value: 'inactiva' },
]
const filtro = computed<Filtro | null>({
  get: () => (filtros.value.estado as Filtro | null) ?? 'todas',
  set: (v) => {
    filtros.value.estado = !v || v === 'todas' ? null : v
  },
})
const filtrando = computed(() => !!busqueda.value || !!filtros.value.estado)

function limpiarFiltros() {
  busqueda.value = ''
  filtros.value.estado = null
}

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'Sucursal', field: 'nombre', align: 'left', sortable: true },
  { name: 'direccion', label: 'Dirección', field: 'ciudad', align: 'left' },
  { name: 'gerente', label: 'Administrador', field: 'gerente', align: 'left' },
  {
    name: 'fechaCreacion',
    label: 'Creación',
    field: 'fechaCreacion',
    align: 'left',
    sortable: true,
  },
  { name: 'estado', label: 'Estado', field: 'statusClave', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

function formatFecha(fecha: string): string {
  try {
    return format(parseISO(fecha), 'dd MMM yyyy', { locale: es })
  } catch {
    return fecha
  }
}

onMounted(() => {
  cargarSucursales()
})

const formAbierto = ref(false)
const editandoId = ref<string | null>(null)

function crearNuevaSucursal() {
  editandoId.value = null
  formAbierto.value = true
}

function abrirEditar(id: string) {
  editandoId.value = id
  formAbierto.value = true
}

// Accesos directos /sucursales/nueva y /sucursales/:id/editar (redirigen aquí).
watch(
  () => route.query,
  (q) => {
    if (q.nueva && auth.hasPermission('sucursales:crear')) crearNuevaSucursal()
    else if (typeof q.editar === 'string' && auth.hasPermission('sucursales:editar'))
      abrirEditar(q.editar)
    else return
    router.replace({ query: {} })
  },
  { immediate: true },
)

function eliminarSucursal(sucursal: Sucursal) {
  sucursalADesactivar.value = sucursal
  mostrarModalDesactivar.value = true
}

async function confirmarDesactivacion() {
  if (!sucursalADesactivar.value) return
  try {
    await branchService.deleteBranch(sucursalADesactivar.value.id)
    Notify.create({ type: 'positive', message: 'Sucursal desactivada correctamente.' })
    await cargarSucursales()
  } catch {
    Notify.create({ type: 'negative', message: 'Error al desactivar la sucursal.' })
  } finally {
    sucursalADesactivar.value = null
  }
}

async function reactivarSucursal(sucursal: Sucursal) {
  try {
    await branchService.restoreBranch(sucursal.id)
    Notify.create({ type: 'positive', message: 'Sucursal reactivada correctamente.' })
    await cargarSucursales()
  } catch {
    Notify.create({ type: 'negative', message: 'Error al reactivar la sucursal.' })
  }
}
</script>

<style scoped lang="scss">
.branch-link {
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  font-weight: 700;
  color: var(--text-strong);
  cursor: pointer;

  &:hover {
    color: var(--q-primary);
    text-decoration: underline;
  }
}
</style>
