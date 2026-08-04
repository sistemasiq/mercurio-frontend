<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div>
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
            Gestión de Horarios
          </div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Administra los turnos de trabajo disponibles para los cajeros.
          </div>
        </div>
        <q-space />
        <q-btn
          v-if="puedeCrear"
          color="primary"
          icon="add"
          label="Nuevo horario"
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
          placeholder="Buscar horario..."
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
          no-data-label="No hay horarios registrados"
          class="fec-table"
        >
          <template #body-cell-horaInicio="props">
            <q-td :props="props">{{ props.row.horaInicio }}</q-td>
          </template>

          <template #body-cell-horaFin="props">
            <q-td :props="props">{{ props.row.horaFin }}</q-td>
          </template>

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
            {{ editando ? 'Editar horario' : 'Nuevo horario' }}
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
              placeholder="Ej. Turno matutino"
              :rules="[(v: string) => !!v.trim() || 'El nombre es requerido']"
              lazy-rules
            />
          </div>
          <div class="row q-gutter-md">
            <div class="col">
              <div class="field-label">HORA INICIO</div>
              <q-input
                ref="horaInicioRef"
                v-model="form.horaInicio"
                dense
                outlined
                type="time"
                :rules="[(v: string) => !!v || 'La hora de inicio es requerida']"
                lazy-rules
              />
            </div>
            <div class="col">
              <div class="field-label">HORA FIN</div>
              <q-input
                ref="horaFinRef"
                v-model="form.horaFin"
                dense
                outlined
                type="time"
                :rules="[
                  (v: string) => !!v || 'La hora de fin es requerida',
                  (v: string) =>
                    !form.horaInicio ||
                    v > form.horaInicio ||
                    'Debe ser posterior a la hora de inicio',
                ]"
                lazy-rules
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="editando ? 'Guardar cambios' : 'Crear horario'"
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
          <div class="text-h6 text-weight-bold">Eliminar horario</div>
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
import { horarioService } from '@/services/horarioService'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import type { Horario } from '@/types/horario'

const $q = useQuasar()
const auth = useAuthStore()

const puedeCrear = computed(() => auth.hasPermission('horarios:crear'))
const puedeEditar = computed(() => auth.hasPermission('horarios:editar'))
const puedeEliminar = computed(() => auth.hasPermission('horarios:eliminar'))

// ── Lista ─────────────────────────────────────────────────────────────────────

const horarios = ref<Horario[]>([])
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
  let result = horarios.value
  if (busqueda.value.trim()) {
    const q = busqueda.value.trim().toLowerCase()
    result = result.filter((h) => h.nombre.toLowerCase().includes(q))
  }
  if (filtroEstado.value === 'activo') result = result.filter((h) => h.activo)
  if (filtroEstado.value === 'inactivo') result = result.filter((h) => !h.activo)
  return result
})

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'horaInicio', label: 'HORA INICIO', field: 'horaInicio', align: 'left' },
  { name: 'horaFin', label: 'HORA FIN', field: 'horaFin', align: 'left' },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]

const cargar = async () => {
  cargando.value = true
  error.value = null
  try {
    horarios.value = await horarioService.listHorarios()
  } catch (err) {
    error.value = resolveErrorMessage(err as ApiError)
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

// ── Toggle activo ─────────────────────────────────────────────────────────────

const toggleActivo = async (row: Horario) => {
  try {
    const actualizado = await horarioService.updateHorario(row.id, { activo: !row.activo })
    const idx = horarios.value.findIndex((h) => h.id === row.id)
    if (idx !== -1) horarios.value[idx] = actualizado
    $q.notify({
      type: 'positive',
      message: `Horario ${!row.activo ? 'activado' : 'desactivado'}`,
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
const editando = ref<Horario | null>(null)
const guardando = ref(false)

const nombreRef = ref()
const horaInicioRef = ref()
const horaFinRef = ref()

const form = ref({ nombre: '', horaInicio: '', horaFin: '' })

const abrirCrear = () => {
  editando.value = null
  form.value = { nombre: '', horaInicio: '', horaFin: '' }
  dialogOpen.value = true
}

const abrirEditar = (row: Horario) => {
  editando.value = row
  form.value = { nombre: row.nombre, horaInicio: row.horaInicio, horaFin: row.horaFin }
  dialogOpen.value = true
}

const cerrarDialog = () => {
  dialogOpen.value = false
  editando.value = null
}

const guardar = async () => {
  nombreRef.value?.validate()
  horaInicioRef.value?.validate()
  horaFinRef.value?.validate()
  if (
    !form.value.nombre.trim() ||
    !form.value.horaInicio ||
    !form.value.horaFin ||
    form.value.horaFin <= form.value.horaInicio
  )
    return

  guardando.value = true
  try {
    if (editando.value) {
      const actualizado = await horarioService.updateHorario(editando.value.id, {
        nombre: form.value.nombre.trim(),
        horaInicio: form.value.horaInicio,
        horaFin: form.value.horaFin,
      })
      const idx = horarios.value.findIndex((h) => h.id === editando.value!.id)
      if (idx !== -1) horarios.value[idx] = actualizado
      $q.notify({ type: 'positive', message: 'Horario actualizado', position: 'top-right' })
    } else {
      const nuevo = await horarioService.createHorario({
        nombre: form.value.nombre.trim(),
        horaInicio: form.value.horaInicio,
        horaFin: form.value.horaFin,
      })
      horarios.value.push(nuevo)
      $q.notify({ type: 'positive', message: 'Horario creado', position: 'top-right' })
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
const filaEliminar = ref<Horario | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: Horario) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await horarioService.deleteHorario(filaEliminar.value.id)
    horarios.value = horarios.value.filter((h) => h.id !== filaEliminar.value!.id)
    $q.notify({ type: 'positive', message: 'Horario eliminado', position: 'top-right' })
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
