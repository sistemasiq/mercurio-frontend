<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { branchService } from '@/services/branchService'
import type { Branch } from '@/types/branch'

const $q = useQuasar()
const router = useRouter()

const allBranches = ref<Branch[]>([])
const loading = ref(false)
const search = ref('')

const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' as const, sortable: true },
  {
    name: 'direccion',
    label: 'Dirección',
    field: 'direccion',
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'telefono',
    label: 'Teléfono',
    field: 'telefono',
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'isActive',
    label: 'Estado',
    field: 'isActive',
    align: 'center' as const,
    sortable: true,
  },
  { name: 'actions', label: '', field: 'actions', align: 'center' as const, sortable: false },
]

const filteredRows = computed(() => {
  if (!search.value) return allBranches.value
  const q = search.value.toLowerCase()
  return allBranches.value.filter((b) => b.nombre.toLowerCase().includes(q))
})

async function fetchBranches(): Promise<void> {
  loading.value = true
  try {
    allBranches.value = await branchService.listBranches()
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar sucursales.' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchBranches)
</script>

<template>
  <q-page padding>
    <div class="flex items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold">Sucursales</div>
      <q-btn
        color="primary"
        icon="add_business"
        label="Nueva sucursal"
        @click="router.push({ name: 'sysadmin-branches-new' })"
      />
    </div>

    <q-card flat bordered>
      <q-card-section>
        <q-input
          v-model="search"
          dense
          outlined
          placeholder="Buscar por nombre"
          clearable
          style="max-width: 320px"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </q-card-section>

      <q-table
        :rows="filteredRows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
        flat
      >
        <template #body-cell-direccion="{ row }">
          <q-td>{{ row.direccion ?? '—' }}</q-td>
        </template>

        <template #body-cell-telefono="{ row }">
          <q-td>{{ row.telefono ?? '—' }}</q-td>
        </template>

        <template #body-cell-isActive="{ row }">
          <q-td class="text-center">
            <q-badge
              :color="row.isActive ? 'positive' : 'grey'"
              :label="row.isActive ? 'Activa' : 'Inactiva'"
            />
          </q-td>
        </template>

        <template #body-cell-actions="{ row }">
          <q-td class="text-center">
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              title="Editar"
              @click="router.push({ name: 'sysadmin-branches-edit', params: { id: row.id } })"
            />
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width text-center text-grey-6 q-py-xl">
            <q-icon name="store_mall_directory" size="48px" class="q-mb-sm" />
            <div>No hay sucursales registradas.</div>
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>
