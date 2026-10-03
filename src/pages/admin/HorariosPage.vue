<template>
  <q-page class="page-content list-page">
    <PageHeader title="Horarios" subtitle="Turnos de trabajo disponibles para los cajeros.">
      <template #actions>
        <q-btn
          v-if="puedeCrear"
          unelevated
          color="primary"
          icon="add"
          label="Nuevo horario"
          @click="abrirCrear"
        />
      </template>
    </PageHeader>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtroEstado"
      :filters="FILTROS"
      search-placeholder="Buscar horario"
      :count="`${filasFiltradas.length} horarios`"
    >
      <StateBlock
        v-if="error"
        variant="error"
        :body="error"
        action-label="Reintentar"
        @action="cargar"
      />
      <q-table
        v-else
        :rows="filasFiltradas"
        :columns="columns"
        row-key="id"
        flat
        :loading="cargando"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.nombre }}</q-td>
        </template>
        <template #body-cell-dias="props">
          <q-td :props="props" class="cell-muted">{{ diasLabel(props.row.dias) }}</q-td>
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
            <q-btn
              flat
              round
              dense
              icon="visibility"
              class="action-btn"
              aria-label="Ver detalle"
              @click="abrirDetalle(props.row)"
            />
            <q-btn
              v-if="puedeEditar"
              flat
              round
              dense
              icon="edit"
              class="action-btn"
              aria-label="Editar"
              @click="abrirEditar(props.row)"
            />
            <q-btn
              v-if="puedeEliminar && props.row.activo"
              flat
              round
              dense
              icon="block"
              class="action-btn"
              aria-label="Desactivar"
              @click="confirmarEliminar(props.row)"
            />
            <q-btn
              v-else-if="puedeEliminar"
              flat
              round
              dense
              icon="restart_alt"
              class="action-btn"
              aria-label="Reactivar"
              @click="reactivar(props.row)"
            />
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="filtrando ? 'no-results' : 'empty'"
            :title="filtrando ? undefined : 'No hay horarios registrados'"
            :action-label="filtrando ? 'Limpiar filtros' : puedeCrear ? 'Nuevo horario' : undefined"
            @action="filtrando ? ((busqueda = ''), (filtroEstado = 'todos')) : abrirCrear()"
          />
        </template>
      </q-table>
    </DataTableCard>

    <!-- ── Crear / editar ──────────────────────────────────────────────────── -->
    <BaseDialog
      v-model="dialogOpen"
      :title="editando ? 'Editar horario' : 'Nuevo horario'"
      :subtitle="editando ? editando.nombre : 'Turno disponible para los cajeros.'"
      icon="schedule"
      :width="520"
      persistent
      :primary-label="editando ? 'Guardar cambios' : 'Guardar horario'"
      :loading="guardando"
      @cancel="cerrarDialog"
      @confirm="guardar"
    >
      <div class="form-grid">
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Nombre</span>
          <q-input
            ref="nombreRef"
            v-model="form.nombre"
            dense
            outlined
            autofocus
            placeholder="Ej. Vespertino"
            hide-bottom-space
            lazy-rules
            :rules="[(v: string) => !!v.trim() || 'El nombre es requerido']"
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Hora inicio</span>
          <q-input
            ref="horaInicioRef"
            v-model="form.horaInicio"
            dense
            outlined
            type="time"
            hide-bottom-space
            lazy-rules
            :rules="[(v: string) => !!v || 'La hora de inicio es requerida']"
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Hora fin</span>
          <q-input
            ref="horaFinRef"
            v-model="form.horaFin"
            dense
            outlined
            type="time"
            hide-bottom-space
            lazy-rules
            :rules="[
              (v: string) => !!v || 'La hora de fin es requerida',
              (v: string) =>
                !form.horaInicio || v > form.horaInicio || 'Debe ser posterior a la hora de inicio',
            ]"
          />
        </label>
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Días de la semana</span>
          <div class="dias-selector">
            <q-chip
              v-for="dia in DIAS_SEMANA"
              :key="dia.value"
              clickable
              :outline="!form.dias.includes(dia.value)"
              :color="form.dias.includes(dia.value) ? 'primary' : undefined"
              :text-color="form.dias.includes(dia.value) ? 'white' : undefined"
              dense
              @click="toggleDia(dia.value)"
            >
              {{ dia.label }}
            </q-chip>
          </div>
          <span class="dias-selector__hint">Sin selección = todos los días.</span>
        </label>
      </div>
    </BaseDialog>

    <!-- ── Detalle ─────────────────────────────────────────────────────────── -->
    <BaseDialog
      v-model="dialogDetalle"
      title="Detalle del horario"
      :subtitle="filaDetalle?.nombre"
      icon="schedule"
      :width="460"
      secondary-label="Cerrar"
      primary-label="Editar"
      :primary-disabled="!puedeEditar"
      @confirm="filaDetalle && ((dialogDetalle = false), abrirEditar(filaDetalle))"
    >
      <dl v-if="filaDetalle" class="detail-grid">
        <div class="detail-grid__item detail-grid__item--full">
          <dt>Nombre</dt>
          <dd>{{ filaDetalle.nombre }}</dd>
        </div>
        <div class="detail-grid__item">
          <dt>Hora inicio</dt>
          <dd>{{ filaDetalle.horaInicio }}</dd>
        </div>
        <div class="detail-grid__item">
          <dt>Hora fin</dt>
          <dd>{{ filaDetalle.horaFin }}</dd>
        </div>
        <div class="detail-grid__item">
          <dt>Estado</dt>
          <dd>
            <StatusBadge
              :tone="filaDetalle.activo ? 'ok' : 'off'"
              :label="filaDetalle.activo ? 'Activo' : 'Inactivo'"
            />
          </dd>
        </div>
        <div class="detail-grid__item detail-grid__item--full">
          <dt>Días de la semana</dt>
          <dd>{{ diasLabel(filaDetalle.dias) }}</dd>
        </div>
      </dl>
    </BaseDialog>

    <!-- ── Desactivar ──────────────────────────────────────────────────────── -->
    <BaseDialog
      v-model="dialogEliminar"
      title="Desactivar horario"
      :subtitle="
        filaEliminar
          ? `${filaEliminar.nombre} · ${filaEliminar.horaInicio} – ${filaEliminar.horaFin}`
          : ''
      "
      icon="block"
      tone="red"
      danger
      :width="460"
      primary-label="Desactivar"
      :loading="eliminando"
      @confirm="ejecutarEliminar"
    >
      <p class="dlg-text">
        Dejará de estar disponible para los cajeros. Podrás reactivarlo después.
      </p>
    </BaseDialog>
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
import { DIAS_SEMANA, type Horario } from '@/types/horario'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip } from '@/types/ui'

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
type Filtro = 'todos' | 'activo' | 'inactivo'
const filtroEstado = ref<Filtro | null>('todos')
const FILTROS: FilterChip<Filtro>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activo' },
  { label: 'Inactivos', value: 'inactivo' },
]
const filtrando = computed(() => !!busqueda.value || filtroEstado.value !== 'todos')

const filasFiltradas = computed(() => {
  let result = horarios.value
  if (busqueda.value?.trim()) {
    const q = busqueda.value.trim().toLowerCase()
    result = result.filter((h) => h.nombre.toLowerCase().includes(q))
  }
  if (filtroEstado.value === 'activo') result = result.filter((h) => h.activo)
  if (filtroEstado.value === 'inactivo') result = result.filter((h) => !h.activo)
  return result
})

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'horaInicio', label: 'Hora inicio', field: 'horaInicio', align: 'left', sortable: true },
  { name: 'horaFin', label: 'Hora fin', field: 'horaFin', align: 'left' },
  { name: 'dias', label: 'Días', field: 'dias', align: 'left' },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
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

// ── Reactivar ─────────────────────────────────────────────────────────────────

const reactivar = async (row: Horario) => {
  try {
    const actualizado = await horarioService.updateHorario(row.id, { activo: true })
    const idx = horarios.value.findIndex((h) => h.id === row.id)
    if (idx !== -1) horarios.value[idx] = actualizado
    $q.notify({ type: 'positive', message: 'Horario activado' })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
    })
  }
}

// ── Ver detalle ───────────────────────────────────────────────────────────────

const dialogDetalle = ref(false)
const filaDetalle = ref<Horario | null>(null)

const abrirDetalle = (row: Horario) => {
  filaDetalle.value = row
  dialogDetalle.value = true
}

// ── Dialog Crear / Editar ─────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<Horario | null>(null)
const guardando = ref(false)

const nombreRef = ref()
const horaInicioRef = ref()
const horaFinRef = ref()

const form = ref({ nombre: '', horaInicio: '', horaFin: '', dias: [] as number[] })

function toggleDia(dia: number) {
  const idx = form.value.dias.indexOf(dia)
  if (idx === -1) form.value.dias.push(dia)
  else form.value.dias.splice(idx, 1)
}

function diasLabel(dias: number[] | null): string {
  if (!dias || dias.length === 0) return 'Todos los días'
  return DIAS_SEMANA.filter((d) => dias.includes(d.value))
    .map((d) => d.fullLabel)
    .join(', ')
}

const abrirCrear = () => {
  editando.value = null
  form.value = { nombre: '', horaInicio: '', horaFin: '', dias: [] }
  dialogOpen.value = true
}

const abrirEditar = (row: Horario) => {
  editando.value = row
  form.value = {
    nombre: row.nombre,
    horaInicio: row.horaInicio,
    horaFin: row.horaFin,
    dias: row.dias ? [...row.dias] : [],
  }
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
        dias: form.value.dias.length ? form.value.dias : null,
      })
      const idx = horarios.value.findIndex((h) => h.id === editando.value!.id)
      if (idx !== -1) horarios.value[idx] = actualizado
      $q.notify({ type: 'positive', message: 'Horario actualizado' })
    } else {
      const nuevo = await horarioService.createHorario({
        nombre: form.value.nombre.trim(),
        horaInicio: form.value.horaInicio,
        horaFin: form.value.horaFin,
        dias: form.value.dias.length ? form.value.dias : null,
      })
      horarios.value.push(nuevo)
      $q.notify({ type: 'positive', message: 'Horario creado' })
    }
    cerrarDialog()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
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
    const idx = horarios.value.findIndex((h) => h.id === filaEliminar.value!.id)
    if (idx !== -1) horarios.value[idx] = { ...horarios.value[idx], activo: false }
    $q.notify({ type: 'positive', message: 'Horario desactivado' })
    dialogEliminar.value = false
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
    })
  } finally {
    eliminando.value = false
  }
}
</script>

<style scoped lang="scss">
.dias-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  &__hint {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 0;

  &__item {
    dt {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    dd {
      margin: 0;
      font-size: 14.5px;
      font-weight: 700;
      color: var(--text-strong);
    }

    &--full {
      grid-column: 1 / -1;
    }
  }
}

.dlg-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-secondary);
}
</style>
