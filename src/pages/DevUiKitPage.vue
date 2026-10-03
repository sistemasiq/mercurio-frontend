<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip, StateVariant } from '@/types/ui'

/**
 * Página solo-DEV para revisar los componentes base del Refactor UI
 * (TablePage, Dialog y 07 Sistema) con datos de ejemplo.
 */
const $q = useQuasar()

interface ExtraDemo {
  id: number
  nombre: string
  precio: number
  unidad: string
  descripcion: string
  activo: boolean
}

const extras: ExtraDemo[] = [
  {
    id: 1,
    nombre: 'Globos metálicos',
    precio: 320,
    unidad: 'Paquete',
    descripcion: 'Set de 6 globos con número',
    activo: true,
  },
  {
    id: 2,
    nombre: 'Piñata temática',
    precio: 650,
    unidad: 'Pieza',
    descripcion: 'Piñata de personaje con dulces incluidos',
    activo: true,
  },
  {
    id: 3,
    nombre: 'Hora extra',
    precio: 1200,
    unidad: 'Hora',
    descripcion: 'Extiende el evento 60 minutos',
    activo: true,
  },
  {
    id: 4,
    nombre: 'Invitado adicional',
    precio: 180,
    unidad: 'Persona',
    descripcion: 'Acceso a área de juegos y menú infantil',
    activo: false,
  },
  {
    id: 5,
    nombre: 'Pastel 30 personas',
    precio: 890,
    unidad: 'Pieza',
    descripcion: 'Sabor a elegir',
    activo: true,
  },
]

type Filtro = 'todos' | 'activos' | 'inactivos'
const filtros: FilterChip<Filtro>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]
const filtro = ref<Filtro | null>('todos')
const busqueda = ref('')

const filas = computed(() =>
  extras.filter((e) => {
    if (filtro.value === 'activos' && !e.activo) return false
    if (filtro.value === 'inactivos' && e.activo) return false
    return e.nombre.toLowerCase().includes((busqueda.value ?? '').toLowerCase())
  }),
)

const columnas: QTableColumn<ExtraDemo>[] = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'precio', label: 'Precio', field: 'precio', align: 'right' },
  { name: 'unidad', label: 'Unidad', field: 'unidad', align: 'left' },
  { name: 'descripcion', label: 'Descripción', field: 'descripcion', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'activo', align: 'left' },
  { name: 'acciones', label: '', field: 'id', align: 'right' },
]

const moneda = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

// ── Toasts (07b) ────────────────────────────────────────────────────────────
function toastOk() {
  $q.notify({
    type: 'positive',
    message: 'Extra creado',
    caption: 'Globos metálicos · $320.00',
    actions: [{ label: 'Ver', noCaps: true }],
  })
}
const toastWarn = () =>
  $q.notify({
    type: 'warning',
    message: 'Sesión cerrada por inactividad.',
    caption: 'Vuelve a iniciar sesión para continuar.',
    icon: 'timer_off',
  })
const toastBad = () => $q.notify({ type: 'negative', message: 'Error al procesar el pago' })
const toastInfo = () =>
  $q.notify({
    type: 'info',
    message: 'El conteo ha sido cancelado. El turno regresa al estado activo.',
  })

// ── Estados (07c) ───────────────────────────────────────────────────────────
const estados: { variant: StateVariant; name: string; action?: string }[] = [
  { variant: 'loading', name: 'Cargando' },
  { variant: 'empty', name: 'Sin datos', action: 'Nuevo Extra' },
  { variant: 'no-results', name: 'Sin resultados', action: 'Limpiar filtros' },
  { variant: 'error', name: 'Error de carga', action: 'Reintentar' },
]

// ── Diálogos ────────────────────────────────────────────────────────────────
const dialogoEditar = ref(false)
const dialogoEliminar = ref(false)
const formNombre = ref('Globos metálicos')
const formPrecio = ref<number | null>(320)
const formActivo = ref(true)
</script>

<template>
  <q-page class="page-content kit">
    <PageHeader title="Extras" subtitle="Servicios y artículos adicionales para reservaciones.">
      <template #actions>
        <q-btn outline icon="download" label="Exportar" />
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nuevo Extra"
          @click="dialogoEditar = true"
        />
      </template>
    </PageHeader>

    <div class="kpi-row">
      <KpiCard label="Extras activos" value="9" note="de 10" />
      <KpiCard label="Vendidos este mes" value="128" note="+12%" note-tone="ok" />
      <KpiCard label="Ingreso por extras" value="$48,320.00" note="+8%" note-tone="ok" />
      <KpiCard label="Sin vender en 30 días" value="2" note="revisar" note-tone="warn" />
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      search-placeholder="Buscar extra"
      :filters="filtros"
      :count="`${filas.length} extras`"
    >
      <q-table flat :rows="filas" :columns="columnas" row-key="id" :rows-per-page-options="[5, 10]">
        <template #body-cell-nombre="props">
          <q-td :props="props" class="text-weight-bold">{{ props.value }}</q-td>
        </template>
        <template #body-cell-precio="props">
          <q-td :props="props" class="text-weight-bold">{{ moneda(props.value) }}</q-td>
        </template>
        <template #body-cell-descripcion="props">
          <q-td :props="props" class="kit__muted">{{ props.value }}</q-td>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <StatusBadge
              :tone="props.value ? 'ok' : 'off'"
              :label="props.value ? 'Activo' : 'Inactivo'"
            />
          </q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props">
            <q-btn flat round dense icon="edit" class="action-btn" @click="dialogoEditar = true" />
            <q-btn
              flat
              round
              dense
              icon="delete"
              class="action-btn"
              @click="dialogoEliminar = true"
            />
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            variant="no-results"
            :title="`Sin resultados para &quot;${busqueda}&quot;`"
            action-label="Limpiar filtros"
            class="full-width"
            @action="((busqueda = ''), (filtro = 'todos'))"
          />
        </template>
      </q-table>
    </DataTableCard>

    <h2 class="kit__h2">Notificaciones</h2>
    <div class="row q-gutter-sm">
      <q-btn outline label="Éxito con acción" @click="toastOk" />
      <q-btn outline label="Advertencia" @click="toastWarn" />
      <q-btn outline label="Error" @click="toastBad" />
      <q-btn outline label="Información" @click="toastInfo" />
    </div>

    <h2 class="kit__h2">Estados de tabla y pantalla</h2>
    <div class="kit__states">
      <div v-for="e in estados" :key="e.variant" class="kit__state">
        <span class="kit__state-name">{{ e.name }}</span>
        <div class="kit__state-card">
          <StateBlock :variant="e.variant" :action-label="e.action" />
        </div>
      </div>
    </div>

    <BaseDialog
      v-model="dialogoEditar"
      title="Editar extra"
      subtitle="Los cambios aplican a nuevas reservaciones."
      icon="edit"
      @confirm="dialogoEditar = false"
    >
      <div class="kit__form">
        <div class="kit__field kit__field--full">
          <span class="field-label">Nombre</span>
          <q-input v-model="formNombre" outlined dense />
        </div>
        <div class="kit__field">
          <span class="field-label">Precio</span>
          <q-input v-model.number="formPrecio" outlined dense prefix="$" type="number" />
        </div>
        <div class="kit__field">
          <span class="field-label">Unidad</span>
          <q-select
            :model-value="'Paquete'"
            :options="['Paquete', 'Pieza', 'Hora']"
            outlined
            dense
          />
        </div>
        <div class="kit__field kit__field--full">
          <q-toggle v-model="formActivo" label="Disponible para reservaciones" />
        </div>
      </div>
    </BaseDialog>

    <BaseDialog
      v-model="dialogoEliminar"
      title="Eliminar extra"
      subtitle="Globos metálicos"
      icon="delete"
      tone="red"
      :width="480"
      primary-label="Eliminar"
      danger
      @confirm="dialogoEliminar = false"
    >
      Esta acción no se puede deshacer. Las reservaciones existentes conservan el extra.
    </BaseDialog>
  </q-page>
</template>

<style scoped lang="scss">
.kit {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__muted {
    color: var(--text-secondary);
  }

  &__h2 {
    margin: 18px 0 0;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 700;
    color: var(--text-strong);
  }

  &__states {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }

  &__state {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__state-name {
    font-size: 13px;
    font-weight: 700;
    color: #475569;
  }

  &__state-card {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
  }

  &__form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  &__field {
    display: flex;
    flex-direction: column;

    &--full {
      grid-column: 1 / -1;
    }
  }
}
</style>
