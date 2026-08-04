<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div>
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
            Gestión de Cajas
          </div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Administra las cajas físicas disponibles en la sucursal.
          </div>
        </div>
        <q-space />
        <q-btn
          v-if="puedeCrear"
          color="primary"
          icon="add"
          label="Nueva caja"
          unelevated
          no-caps
          style="border-radius: 8px; font-weight: 600"
          @click="abrirCrear"
        />
      </div>

      <!-- Filtros -->
      <div class="row items-center q-mb-md q-gutter-sm">
        <q-input
          v-model="busqueda"
          dense
          outlined
          clearable
          placeholder="Buscar caja..."
          style="min-width: 260px"
        >
          <template #prepend><q-icon name="search" size="18px" color="grey-6" /></template>
        </q-input>
        <q-space />
        <q-select
          v-model="filtroEstado"
          :options="opcionesEstado"
          dense
          outlined
          emit-value
          map-options
          style="min-width: 140px"
          label="Estado"
        />
      </div>

      <!-- Error -->
      <q-banner
        v-if="error"
        dense
        rounded
        class="bg-red-1 text-red-8 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="error_outline" color="negative" /></template>
        {{ error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="cargar" />
        </template>
      </q-banner>

      <!-- Tabla -->
      <q-card flat bordered style="border-radius: 12px; overflow-x: auto; overflow-y: hidden">
        <q-table
          :rows="filasFiltradas"
          :columns="columns"
          row-key="id"
          flat
          :loading="cargando"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="No hay cajas registradas"
          class="fec-table"
        >
          <template #body-cell-activo="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.activo ? 'positive' : 'grey-5'"
                :label="props.row.activo ? 'Activo' : 'Inactivo'"
                style="font-size: 0.72rem; padding: 4px 10px; border-radius: 20px"
              />
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                v-if="puedeEditar"
                flat
                round
                dense
                :icon="props.row.activo ? 'toggle_on' : 'toggle_off'"
                :color="props.row.activo ? 'positive' : 'grey-5'"
                size="large"
                class="q-mr-xs"
                @click="toggleActivo(props.row)"
              >
                <q-tooltip>{{ props.row.activo ? 'Desactivar' : 'Activar' }}</q-tooltip>
              </q-btn>
              <q-btn
                v-if="puedeEditar"
                flat
                round
                dense
                color="grey-7"
                size="sm"
                class="q-mr-xs"
                @click="abrirEditar(props.row)"
              >
                <span class="material-symbols-outlined">edit</span>
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn
                v-if="puedeEliminar"
                flat
                round
                dense
                color="red"
                size="sm"
                @click="confirmarEliminar(props.row)"
              >
                <span class="material-symbols-outlined">delete</span>
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- ── Dialog Crear / Editar ──────────────────────────────────────────── -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 420px; border-radius: 12px">
        <q-card-section class="row items-center q-pb-sm">
          <div class="text-h6 text-weight-bold">
            {{ editando ? 'Editar caja' : 'Nueva caja' }}
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-7" @click="cerrarDialog" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md q-pt-md">
          <div>
            <div class="field-label">NOMBRE</div>
            <q-input
              ref="nombreRef"
              v-model="form.nombre"
              dense
              outlined
              autofocus
              placeholder="Ej. Caja principal"
              :rules="[(v: string) => !!v.trim() || 'El nombre es requerido']"
              lazy-rules
            />
          </div>
          <div>
            <div class="field-label">NÚMERO</div>
            <q-input
              ref="numeroRef"
              v-model.number="form.numero"
              dense
              outlined
              type="number"
              min="1"
              placeholder="Ej. 1"
              :rules="[
                (v: number | null) => (v !== null && v !== undefined) || 'El número es requerido',
                (v: number) => v > 0 || 'Debe ser mayor a 0',
              ]"
              lazy-rules
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="editando ? 'Guardar cambios' : 'Crear caja'"
            style="border-radius: 8px; font-weight: 600"
            :loading="guardando"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Dialog Confirmar Eliminar ────────────────────────────────────────── -->
    <q-dialog v-model="dialogEliminar">
      <q-card style="min-width: 360px; border-radius: 12px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Eliminar caja</div>
          <div class="q-mt-sm text-body2 text-grey-8">
            ¿Deseas eliminar <strong>{{ filaEliminar?.nombre }}</strong
            >? Esta acción no se puede deshacer.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-xs">
          <q-btn v-close-popup flat no-caps label="Cancelar" color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Eliminar"
            style="border-radius: 8px; font-weight: 600"
            :loading="eliminando"
            @click="ejecutarEliminar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { cajaAdminService } from '@/services/cajaAdminService'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import type { CajaAdmin } from '@/types/caja-admin'

const $q = useQuasar()
const auth = useAuthStore()

const puedeCrear = computed(() => auth.hasPermission('cajas:crear'))
const puedeEditar = computed(() => auth.hasPermission('cajas:editar'))
const puedeEliminar = computed(() => auth.hasPermission('cajas:eliminar'))

// ── Lista ─────────────────────────────────────────────────────────────────────

const cajas = ref<CajaAdmin[]>([])
const cargando = ref(false)
const error = ref<string | null>(null)
const busqueda = ref('')
const filtroEstado = ref<'todos' | 'activo' | 'inactivo'>('todos')

const opcionesEstado = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activo', value: 'activo' },
  { label: 'Inactivo', value: 'inactivo' },
]

const filasFiltradas = computed(() => {
  let result = cajas.value
  if (busqueda.value.trim()) {
    const q = busqueda.value.trim().toLowerCase()
    result = result.filter(
      (c) => c.nombre.toLowerCase().includes(q) || String(c.numero).includes(q),
    )
  }
  if (filtroEstado.value === 'activo') result = result.filter((c) => c.activo)
  if (filtroEstado.value === 'inactivo') result = result.filter((c) => !c.activo)
  return result
})

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'numero', label: 'NÚMERO', field: 'numero', align: 'left', sortable: true },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]

const cargar = async () => {
  cargando.value = true
  error.value = null
  try {
    cajas.value = await cajaAdminService.listCajas()
  } catch (err) {
    error.value = resolveErrorMessage(err as ApiError)
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

// ── Toggle activo ─────────────────────────────────────────────────────────────

const toggleActivo = async (row: CajaAdmin) => {
  try {
    const actualizada = await cajaAdminService.updateCaja(row.id, { activo: !row.activo })
    const idx = cajas.value.findIndex((c) => c.id === row.id)
    if (idx !== -1) cajas.value[idx] = actualizada
    $q.notify({
      type: 'positive',
      message: `Caja ${!row.activo ? 'activada' : 'desactivada'}`,
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

// ── Dialog Crear / Editar ─────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<CajaAdmin | null>(null)
const guardando = ref(false)

const nombreRef = ref()
const numeroRef = ref()

const form = ref<{ nombre: string; numero: number | null }>({ nombre: '', numero: null })

const abrirCrear = () => {
  editando.value = null
  form.value = { nombre: '', numero: null }
  dialogOpen.value = true
}

const abrirEditar = (row: CajaAdmin) => {
  editando.value = row
  form.value = { nombre: row.nombre, numero: row.numero }
  dialogOpen.value = true
}

const cerrarDialog = () => {
  dialogOpen.value = false
  editando.value = null
}

const guardar = async () => {
  nombreRef.value?.validate()
  numeroRef.value?.validate()
  if (!form.value.nombre.trim() || form.value.numero === null || form.value.numero <= 0) return

  guardando.value = true
  try {
    if (editando.value) {
      const actualizada = await cajaAdminService.updateCaja(editando.value.id, {
        nombre: form.value.nombre.trim(),
        numero: form.value.numero,
      })
      const idx = cajas.value.findIndex((c) => c.id === editando.value!.id)
      if (idx !== -1) cajas.value[idx] = actualizada
      $q.notify({ type: 'positive', message: 'Caja actualizada', position: 'top-right' })
    } else {
      const nueva = await cajaAdminService.createCaja({
        nombre: form.value.nombre.trim(),
        numero: form.value.numero,
      })
      cajas.value.push(nueva)
      $q.notify({ type: 'positive', message: 'Caja creada', position: 'top-right' })
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

// ── Eliminar ──────────────────────────────────────────────────────────────────

const dialogEliminar = ref(false)
const filaEliminar = ref<CajaAdmin | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: CajaAdmin) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await cajaAdminService.deleteCaja(filaEliminar.value.id)
    cajas.value = cajas.value.filter((c) => c.id !== filaEliminar.value!.id)
    $q.notify({ type: 'positive', message: 'Caja eliminada', position: 'top-right' })
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
