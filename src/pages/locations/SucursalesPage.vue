<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">Sucursales</div>
        <div class="text-body2" style="color: var(--text-secondary)">
          Catálogo de sucursales de la franquicia.
        </div>
      </div>
      <q-space />
      <q-btn
        v-if="auth.hasPermission('sucursales:crear')"
        color="primary"
        icon="add"
        label="Nueva Sucursal"
        unelevated
        no-caps
        style="border-radius: 8px; font-weight: 600"
        @click="crearNuevaSucursal"
      />
    </div>

    <q-card flat bordered style="border-radius: 12px; overflow: hidden">
      <div class="row items-center q-pa-md q-gutter-md">
        <q-input
          v-model="busqueda"
          dense
          outlined
          placeholder="Buscar por clave o nombre..."
          clearable
          style="min-width: 240px"
        >
          <template #prepend><q-icon name="search" color="grey-5" size="16px" /></template>
        </q-input>
        <q-select
          v-model="filtros.estado"
          :options="opcionesFiltro"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          dense
          outlined
          label="Estado"
          style="min-width: 150px"
        />
      </div>
      <q-separator />
      <SucursalTabla
        :sucursales="sucursales"
        :loading="loading"
        @eliminar="eliminarSucursal"
        @reactivar="reactivarSucursal"
        @editar="editarSucursal"
        @ver-detalle="verDetalleSucursal"
      />
    </q-card>

    <!-- Modal confirmar desactivación -->
    <SucursalModalDesactivar
      v-model="mostrarModalDesactivar"
      :sucursal="sucursalADesactivar"
      @confirmar="confirmarDesactivacion"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import SucursalTabla from '@/components/sucursales/SucursalTabla.vue'
import SucursalModalDesactivar from '@/components/sucursales/SucursalModalDesactivar.vue'
import { useSucursales } from '@/composables/useSucursales'
import { branchService } from '@/services/branchService'
import { useAuthStore } from '@/stores/auth'
import type { Sucursal } from '@/composables/useSucursales'

const router = useRouter()
const auth = useAuthStore()

const { sucursales, loading, busqueda, filtros, cargarSucursales, editar, verDetalle } =
  useSucursales()

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
</script>
