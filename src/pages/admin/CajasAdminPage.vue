<template>
  <q-page class="page-content list-page">
    <PageHeader title="Cajas" subtitle="Terminales de cobro de la sucursal.">
      <template #actions>
        <q-btn
          v-if="puedeCrear"
          unelevated
          color="primary"
          icon="add"
          label="Nueva caja"
          @click="abrirCrear"
        />
      </template>
    </PageHeader>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtroEstado"
      :filters="FILTROS"
      search-placeholder="Buscar caja"
      :count="`${filasFiltradas.length} cajas`"
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
        <template #body-cell-numero="props">
          <q-td :props="props">
            <span class="code-chip">#{{ numeroCaja(props.row.numero) }}</span>
          </q-td>
        </template>
        <template #body-cell-impresora="props">
          <q-td :props="props" class="cell-muted">{{ props.row.impresora || '—' }}</q-td>
        </template>
        <template #body-cell-turnoActual="props">
          <q-td :props="props">
            <StatusBadge
              v-if="props.row.turnoActual"
              tone="ok"
              :label="`Abierta · ${props.row.turnoActual.cajero}`"
            />
            <span v-else class="cell-muted">Cerrada</span>
          </q-td>
        </template>
        <template #body-cell-activo="props">
          <q-td :props="props">
            <StatusBadge
              :tone="props.row.activo ? 'ok' : 'off'"
              :label="props.row.activo ? 'Activa' : 'Inactiva'"
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
            :title="filtrando ? undefined : 'No hay cajas registradas'"
            :action-label="filtrando ? 'Limpiar filtros' : puedeCrear ? 'Nueva caja' : undefined"
            @action="filtrando ? ((busqueda = ''), (filtroEstado = 'todos')) : abrirCrear()"
          />
        </template>
      </q-table>
    </DataTableCard>

    <!-- ── Crear / editar ──────────────────────────────────────────────────── -->
    <BaseDialog
      v-model="dialogOpen"
      :title="editando ? 'Editar caja' : 'Nueva caja'"
      :subtitle="editando ? editando.nombre : 'Terminal de cobro de la sucursal.'"
      icon="point_of_sale"
      :width="480"
      persistent
      :primary-label="editando ? 'Guardar cambios' : 'Crear caja'"
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
            placeholder="Ej. Recepción eventos"
            hide-bottom-space
            lazy-rules
            :rules="[(v: string) => !!v.trim() || 'El nombre es requerido']"
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Número</span>
          <q-input
            ref="numeroRef"
            v-model.number="form.numero"
            dense
            outlined
            type="number"
            min="1"
            placeholder="Ej. 3"
            hide-bottom-space
            lazy-rules
            :rules="[
              (v: number | null) => (v !== null && v !== undefined) || 'El número es requerido',
              (v: number) => v > 0 || 'Debe ser mayor a 0',
            ]"
          />
        </label>
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Impresora (opcional)</span>
          <q-input
            v-model="form.impresora"
            dense
            outlined
            placeholder="Ej. Epson TM-T20 (recepción)"
            hide-bottom-space
          />
        </label>
      </div>
    </BaseDialog>

    <!-- ── Detalle ─────────────────────────────────────────────────────────── -->
    <BaseDialog
      v-model="dialogDetalle"
      title="Detalle de la caja"
      :subtitle="filaDetalle ? `${filaDetalle.nombre} #${numeroCaja(filaDetalle.numero)}` : ''"
      icon="point_of_sale"
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
          <dt>Número</dt>
          <dd>{{ numeroCaja(filaDetalle.numero) }}</dd>
        </div>
        <div class="detail-grid__item">
          <dt>Estado</dt>
          <dd>
            <StatusBadge
              :tone="filaDetalle.activo ? 'ok' : 'off'"
              :label="filaDetalle.activo ? 'Activa' : 'Inactiva'"
            />
          </dd>
        </div>
        <div class="detail-grid__item">
          <dt>Impresora</dt>
          <dd>{{ filaDetalle.impresora || '—' }}</dd>
        </div>
        <div class="detail-grid__item detail-grid__item--full">
          <dt>Turno actual</dt>
          <dd v-if="filaDetalle.turnoActual">
            {{ filaDetalle.turnoActual.cajero }} · abierto el
            {{ new Date(filaDetalle.turnoActual.apertura).toLocaleString('es-MX') }}
          </dd>
          <dd v-else>Cerrada</dd>
        </div>
      </dl>
    </BaseDialog>

    <!-- ── Desactivar ──────────────────────────────────────────────────────── -->
    <BaseDialog
      v-model="dialogEliminar"
      title="Desactivar caja"
      :subtitle="filaEliminar ? `${filaEliminar.nombre} #${numeroCaja(filaEliminar.numero)}` : ''"
      icon="block"
      tone="red"
      danger
      :width="460"
      primary-label="Desactivar"
      :loading="eliminando"
      @confirm="ejecutarEliminar"
    >
      <p class="dlg-text">No podrá usarse para aperturas de turno hasta reactivarla.</p>
    </BaseDialog>
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
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip } from '@/types/ui'

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
type Filtro = 'todos' | 'activo' | 'inactivo'
const filtroEstado = ref<Filtro | null>('todos')
const FILTROS: FilterChip<Filtro>[] = [
  { label: 'Todas', value: 'todos' },
  { label: 'Activas', value: 'activo' },
  { label: 'Inactivas', value: 'inactivo' },
]
const filtrando = computed(() => !!busqueda.value || filtroEstado.value !== 'todos')
const numeroCaja = (n: number): string => String(n).padStart(2, '0')

const filasFiltradas = computed(() => {
  let result = cajas.value
  if (busqueda.value?.trim()) {
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
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'numero', label: 'Número', field: 'numero', align: 'left', sortable: true },
  { name: 'impresora', label: 'Impresora', field: 'impresora', align: 'left' },
  { name: 'turnoActual', label: 'Turno actual', field: 'turnoActual', align: 'left' },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
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

// ── Reactivar ─────────────────────────────────────────────────────────────────

const reactivar = async (row: CajaAdmin) => {
  try {
    const actualizada = await cajaAdminService.updateCaja(row.id, { activo: true })
    const idx = cajas.value.findIndex((c) => c.id === row.id)
    if (idx !== -1) cajas.value[idx] = actualizada
    $q.notify({ type: 'positive', message: 'Caja activada' })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
    })
  }
}

// ── Ver detalle ───────────────────────────────────────────────────────────────

const dialogDetalle = ref(false)
const filaDetalle = ref<CajaAdmin | null>(null)

const abrirDetalle = (row: CajaAdmin) => {
  filaDetalle.value = row
  dialogDetalle.value = true
}

// ── Dialog Crear / Editar ─────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<CajaAdmin | null>(null)
const guardando = ref(false)

const nombreRef = ref()
const numeroRef = ref()

const form = ref<{ nombre: string; numero: number | null; impresora: string }>({
  nombre: '',
  numero: null,
  impresora: '',
})

const abrirCrear = () => {
  editando.value = null
  form.value = { nombre: '', numero: null, impresora: '' }
  dialogOpen.value = true
}

const abrirEditar = (row: CajaAdmin) => {
  editando.value = row
  form.value = { nombre: row.nombre, numero: row.numero, impresora: row.impresora ?? '' }
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
        impresora: form.value.impresora.trim() || null,
      })
      const idx = cajas.value.findIndex((c) => c.id === editando.value!.id)
      if (idx !== -1) cajas.value[idx] = actualizada
      $q.notify({ type: 'positive', message: 'Caja actualizada' })
    } else {
      const nueva = await cajaAdminService.createCaja({
        nombre: form.value.nombre.trim(),
        numero: form.value.numero,
        impresora: form.value.impresora.trim() || null,
      })
      cajas.value.push(nueva)
      $q.notify({ type: 'positive', message: 'Caja creada' })
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
    const idx = cajas.value.findIndex((c) => c.id === filaEliminar.value!.id)
    if (idx !== -1) cajas.value[idx] = { ...cajas.value[idx], activo: false }
    $q.notify({ type: 'positive', message: 'Caja desactivada' })
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
