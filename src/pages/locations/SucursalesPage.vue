<template>
  <div class="sucursales-page">
    <!-- Breadcrumb -->
    <q-breadcrumbs class="breadcrumb-section" separator="›">
      <q-breadcrumbs-el label="Inicio" to="/home/admin" class="breadcrumb-link" />
      <q-breadcrumbs-el label="Administración" class="breadcrumb-link" />
      <q-breadcrumbs-el label="Sucursales" class="breadcrumb-current" />
    </q-breadcrumbs>

    <!-- Header de página -->
    <div class="page-header">
      <h1 class="page-title">Administración de Sucursales</h1>
      <q-btn
        unelevated
        color="primary"
        label="Nueva Sucursal"
        icon="add"
        class="btn-nueva"
        @click="crearNuevaSucursal"
      />
    </div>

    <!-- KPI Cards -->
    <div class="kpi-container">
      <SucursalKpiCard
        label="Total de Sucursales"
        :value="stats.total"
        icon="storefront"
        icon-color="#1E88E5"
        icon-bg="#E3F2FD"
      />
      <SucursalKpiCard
        label="Activas"
        :value="stats.activas"
        icon="check_circle"
        icon-color="#43A047"
        icon-bg="#E8F5E9"
      />
      <SucursalKpiCard
        label="Inactivas"
        :value="stats.inactivas"
        icon="cancel"
        icon-color="#E53935"
        icon-bg="#FFEBEE"
      />
    </div>

    <!-- Barra de búsqueda y acciones -->
    <div class="search-bar-section">
      <q-input
        v-model="busqueda"
        outlined
        dense
        placeholder="Buscar por ID, nombre o ubicación..."
        class="search-input"
        bg-color="white"
        @update:model-value="(val) => aplicarBusqueda(String(val || ''))"
      >
        <template #prepend>
          <q-icon name="search" color="grey-5" size="18px" />
        </template>
      </q-input>

      <q-btn
        outline
        color="grey-6"
        icon="tune"
        label="Filtros"
        class="action-btn"
        no-caps
        @click="mostrarFiltros = true"
      />
    </div>

    <!-- Tabla -->
    <SucursalTabla
      :sucursales="sucursales"
      :loading="loading"
      :pagination="pagination"
      :total-pages="totalPages"
      @eliminar="eliminarSucursal"
      @reactivar="reactivarSucursal"
      @editar="editarSucursal"
      @ver-detalle="verDetalleSucursal"
      @cambiar-pagina="cambiarPagina"
    />

    <!-- Modal confirmar desactivación -->
    <SucursalModalDesactivar
      v-model="mostrarModalDesactivar"
      :sucursal="sucursalADesactivar"
      @confirmar="confirmarDesactivacion"
    />

    <!-- Dialog de filtros -->
    <q-dialog v-model="mostrarFiltros">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Filtros</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-select
            v-model="filtroEstado"
            :options="opcionesFiltro"
            label="Estado"
            emit-value
            map-options
            outlined
            dense
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="mostrarFiltros = false" />
          <q-btn unelevated color="primary" label="Aplicar" @click="aplicarFiltros" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import SucursalKpiCard from '@/components/sucursales/SucursalKpiCard.vue'
import SucursalTabla from '@/components/sucursales/SucursalTabla.vue'
import SucursalModalDesactivar from '@/components/sucursales/SucursalModalDesactivar.vue'
import { useSucursales } from '@/composables/useSucursales'
import { branchService } from '@/services/branchService'
import type { Sucursal } from '@/composables/useSucursales'

const router = useRouter()

const {
  sucursales,
  stats,
  loading,
  pagination,
  busqueda,
  filtros,
  totalPages,
  cargarSucursales,
  editar,
  verDetalle,
  cambiarPagina,
  aplicarFiltro,
  aplicarBusqueda,
} = useSucursales()

const mostrarFiltros = ref(false)
const filtroEstado = ref<string | null>(filtros.value.estado)
const mostrarModalDesactivar = ref(false)
const sucursalADesactivar = ref<Sucursal | null>(null)

const opcionesFiltro = [
  { label: 'Todas', value: null },
  { label: 'Activas', value: 'activa' },
  { label: 'Inactivas', value: 'inactiva' },
]

onMounted(() => {
  cargarSucursales()
})

function crearNuevaSucursal() {
  router.push({ name: 'sucursales-crear' })
}

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

function editarSucursal(id: string) {
  editar(id)
}

function verDetalleSucursal(id: string) {
  verDetalle(id)
}

function aplicarFiltros() {
  aplicarFiltro({ estado: filtroEstado.value })
  mostrarFiltros.value = false
}
</script>

<style scoped lang="scss">
.sucursales-page {
  padding: 24px;
  background-color: #f5f6fa;
  min-height: 100vh;
}

.breadcrumb-section {
  margin-bottom: 16px;
  font-size: 12px;

  :deep(.breadcrumb-link) {
    color: #757575;
  }

  :deep(.breadcrumb-current) {
    color: #424242;
    font-weight: 500;
  }

  :deep(.q-breadcrumbs__separator) {
    color: #bdbdbd;
  }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  .page-title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: #1a1a1a;
  }

  .btn-nueva {
    font-size: 13px;
    font-weight: 500;
  }
}

.kpi-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.search-bar-section {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;

  .search-input {
    flex: 1;
    max-width: 380px;

    :deep(.q-field__control) {
      background-color: #ffffff;
    }
  }

  .action-btn {
    font-size: 13px;
    padding: 0 14px;
  }
}

@media (max-width: 768px) {
  .sucursales-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .kpi-container {
    grid-template-columns: 1fr;
  }

  .search-bar-section {
    flex-wrap: wrap;

    .search-input {
      max-width: 100%;
      flex: 1 1 100%;
    }
  }
}
</style>
