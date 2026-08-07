<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 900px; margin: 0 auto">
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
            Métodos de Pago
          </div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Activa o desactiva los métodos de pago disponibles en tu sucursal.
          </div>
        </div>
      </div>

      <!-- Error -->
      <q-banner
        v-if="store.error"
        dense
        rounded
        class="bg-red-1 text-red-8 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="error_outline" color="negative" /></template>
        {{ store.error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="store.cargar()" />
        </template>
      </q-banner>

      <!-- Tabla -->
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="store.metodos"
          :columns="columns"
          row-key="id"
          flat
          :loading="store.loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="No hay métodos de pago registrados"
          class="fec-table"
        >
          <!-- Estado -->
          <template #body-cell-activo="props">
            <q-td :props="props">
              <q-toggle
                :model-value="props.row.activo"
                color="positive"
                :disable="toggleando === props.row.id"
                @update:model-value="toggleActivo(props.row)"
              />
            </q-td>
          </template>

          <!-- Acciones -->
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                v-if="esSistema"
                flat
                round
                dense
                icon="edit"
                color="primary"
                size="sm"
                @click="abrirEditar(props.row)"
              >
                <q-tooltip>Editar nombre/descripción</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- ── Dialog Editar (solo AdministradorSistema) ─────────────────────── -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 420px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-weight-bold">Editar Método de Pago</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md q-pt-md">
          <div>
            <div class="field-label">NOMBRE</div>
            <q-input
              ref="nombreRef"
              v-model="formDialog.nombre"
              dense
              outlined
              autofocus
              :rules="[(v) => !!v || 'El nombre es requerido']"
            />
          </div>
          <div>
            <div class="field-label">DESCRIPCIÓN (opcional)</div>
            <q-input
              v-model="formDialog.descripcion"
              dense
              outlined
              type="textarea"
              rows="3"
              placeholder="Descripción breve del método de pago"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Guardar cambios"
            style="border-radius: 8px; font-weight: 600"
            :loading="guardando"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
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

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'descripcion', label: 'DESCRIPCIÓN', field: 'descripcion', align: 'left' },
  {
    name: 'tipo',
    label: 'TIPO',
    field: 'tipo',
    align: 'left',
    format: (v: TipoMetodoPago) => TIPO_LABELS[v] ?? v,
  },
  { name: 'activo', label: 'ACTIVO EN ESTA SUCURSAL', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
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

<style scoped>
.field-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
</style>
