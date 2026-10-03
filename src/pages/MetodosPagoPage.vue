<template>
  <q-page class="page-content list-page">
    <PageHeader title="Métodos de Pago" subtitle="Activa los métodos disponibles en esta sucursal.">
      <template #actions> </template>
    </PageHeader>

    <div class="list-page__note">
      <q-icon name="info" size="19px" />
      Los cambios de activación aplican solo a {{ sucursalNombre }}.
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      :filters="FILTROS_ACTIVO"
      search-placeholder="Buscar método"
      :count="`${metodosVisibles.length} métodos`"
    >
      <StateBlock
        v-if="store.error"
        variant="error"
        :body="store.error"
        action-label="Reintentar"
        @action="store.cargar()"
      />
      <q-table
        v-else
        :rows="metodosVisibles"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.nombre }}</q-td>
        </template>
        <template #body-cell-descripcion="props">
          <q-td
            :props="props"
            class="cell-muted cell-ellipsis"
            :title="props.row.descripcion ?? ''"
          >
            {{ props.row.descripcion }}
          </q-td>
        </template>
        <template #body-cell-tipo="props">
          <q-td :props="props">
            <StatusBadge
              :tone="TONO_TIPO[props.row.tipo as TipoMetodoPago] ?? 'off'"
              :label="props.value"
            />
          </q-td>
        </template>
        <template #body-cell-activo="props">
          <q-td :props="props">
            <q-toggle
              :model-value="props.row.activo"
              dense
              :disable="toggleando === props.row.id"
              :aria-label="props.row.activo ? 'Desactivar' : 'Activar'"
              @update:model-value="toggleActivo(props.row)"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              v-if="esSistema"
              flat
              round
              dense
              icon="edit"
              class="action-btn"
              aria-label="Editar"
              @click="abrirEditar(props.row)"
            />
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="filtrando ? 'no-results' : 'empty'"
            :title="filtrando ? undefined : 'No hay métodos de pago registrados'"
            :body="
              filtrando ? undefined : 'Los métodos los configura el administrador del sistema.'
            "
            :action-label="filtrando ? 'Limpiar filtros' : undefined"
            @action="filtrando ? ((busqueda = ''), (filtro = 'todos')) : undefined"
          />
        </template>
      </q-table>
    </DataTableCard>

    <BaseDialog
      v-model="dialogOpen"
      title="Editar método de pago"
      :subtitle="editando?.nombre"
      icon="credit_card"
      :width="520"
      persistent
      primary-label="Guardar"
      :loading="guardando"
      @cancel="cerrarDialog"
      @confirm="guardar"
    >
      <div class="form-grid">
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Nombre</span>
          <q-input
            ref="nombreRef"
            v-model="formDialog.nombre"
            dense
            outlined
            autofocus
            :rules="[(v) => !!v || 'El nombre es requerido']"
            hide-bottom-space
          />
        </label>
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Descripción</span>
          <q-input
            v-model="formDialog.descripcion"
            dense
            outlined
            type="textarea"
            rows="3"
            placeholder="Descripción breve (opcional)"
          />
        </label>
      </div>
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
import { computed, ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { useMetodosPagoStore } from '@/stores/metodos_pago'
import type { MetodosPago, TipoMetodoPago } from '@/types/metodos_pago'

const TIPO_LABELS: Record<TipoMetodoPago, string> = {
  E: 'Efectivo',
  T: 'Tarjeta (crédito/débito/wallets)',
  C: 'Cupón',
  L: 'Lealtad',
  O: 'Otro',
}

const $q = useQuasar()
const authStore = useAuthStore()
const store = useMetodosPagoStore()

const esSistema = computed(() => authStore.hasRole('AdministradorSistema'))

onMounted(() => store.cargar())

type FiltroActivo = 'todos' | 'activos' | 'inactivos'
const FILTROS_ACTIVO: FilterChip<FiltroActivo>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]
const filtro = ref<FiltroActivo | null>('todos')
const busqueda = ref('')
const filtrando = computed(() => !!busqueda.value || filtro.value !== 'todos')

const metodosVisibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return store.metodos
    .filter((r) => filtro.value === 'todos' || r.activo === (filtro.value === 'activos'))
    .filter((r) => !q || `${r.nombre ?? ''} ${r.descripcion ?? ''}`.toLowerCase().includes(q))
})

const TONO_TIPO: Record<TipoMetodoPago, 'info' | 'pink' | 'warn' | 'ok' | 'off'> = {
  E: 'info',
  T: 'pink',
  C: 'warn',
  L: 'ok',
  O: 'off',
}
const sucursalNombre = computed(() => authStore.currentBranchName ?? 'esta sucursal')

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'descripcion', label: 'Descripción', field: 'descripcion', align: 'left' },
  {
    name: 'tipo',
    label: 'Categoría',
    field: 'tipo',
    align: 'left',
    format: (v: TipoMetodoPago) => TIPO_LABELS[v] ?? v,
  },
  { name: 'activo', label: 'Activo en esta sucursal', field: 'activo', align: 'center' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

// ── Estado del dialog de edición ────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<MetodosPago | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formDialog = ref<{ nombre: string; descripcion: string }>({
  nombre: '',
  descripcion: '',
})

const abrirEditar = (row: MetodosPago) => {
  editando.value = row
  formDialog.value = {
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
  }
  dialogOpen.value = true
}

const cerrarDialog = () => {
  dialogOpen.value = false
  editando.value = null
}

const guardar = async () => {
  if (!editando.value) return
  if (!formDialog.value.nombre.trim()) {
    nombreRef.value?.validate()
    return
  }
  guardando.value = true
  try {
    await store.actualizarMetodoPago(editando.value.id, {
      nombre: formDialog.value.nombre.trim(),
      descripcion: formDialog.value.descripcion.trim() || undefined,
    })
    $q.notify({ type: 'positive', message: 'Método de pago actualizado', position: 'top-right' })
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

// ── Toggle activo por sucursal ──────────────────────────────────────────────

const toggleando = ref<string | null>(null)

const toggleActivo = async (row: MetodosPago) => {
  toggleando.value = row.id
  try {
    await store.toggleActivo(row.id, !row.activo)
    $q.notify({
      type: 'positive',
      message: `Método ${!row.activo ? 'activado' : 'desactivado'}`,
      position: 'top-right',
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    toggleando.value = null
  }
}
</script>
