<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div>
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">Roles</div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Catálogo de roles y los permisos que se le pueden dar a cada uno.
          </div>
        </div>
        <q-space />
        <q-btn
          v-if="puedeEditar"
          color="primary"
          icon="add"
          label="Nuevo rol"
          unelevated
          no-caps
          style="border-radius: 8px; font-weight: 600"
          @click="abrirCrear"
        />
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
          <q-btn flat dense no-caps label="Reintentar" @click="cargar" />
        </template>
      </q-banner>

      <!-- Tabla -->
      <q-card flat bordered style="border-radius: 12px; overflow-x: auto; overflow-y: hidden">
        <q-table
          :rows="store.roles"
          :columns="columns"
          row-key="id"
          flat
          :loading="store.loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="No hay roles registrados"
          class="fec-table"
        >
          <template #body-cell-descripcion="props">
            <q-td :props="props">
              {{ props.row.descripcion || '—' }}
            </q-td>
          </template>

          <template #body-cell-permisos="props">
            <q-td :props="props">
              <q-badge
                color="grey-3"
                text-color="grey-9"
                :label="`${(props.row as RolConPermisos).permisos.length} permisos`"
                style="font-size: 0.72rem; padding: 4px 10px; border-radius: 20px"
              />
            </q-td>
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
            <q-td v-if="puedeEditar" :props="props" class="text-right">
              <q-btn
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
                v-if="(props.row as RolConPermisos).requiere_sucursal && props.row.activo"
                flat
                round
                dense
                color="grey-7"
                size="sm"
                @click="confirmarDesactivar(props.row)"
              >
                <span class="material-symbols-outlined">delete</span>
                <q-tooltip>Desactivar</q-tooltip>
              </q-btn>
              <q-btn
                v-else-if="(props.row as RolConPermisos).requiere_sucursal && !props.row.activo"
                flat
                round
                dense
                icon="restore"
                color="positive"
                size="sm"
                @click="confirmarReactivar(props.row)"
              >
                <q-tooltip>Reactivar</q-tooltip>
              </q-btn>
              <q-icon v-else name="lock" size="18px" color="grey-5" class="q-pa-sm">
                <q-tooltip>Rol protegido del sistema</q-tooltip>
              </q-icon>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- ── Dialog Crear / Editar ──────────────────────────────────────────── -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card class="rol-dialog-card" style="border-radius: 12px">
        <q-card-section class="q-pb-sm row items-center" style="flex-shrink: 0">
          <div class="text-h6 text-weight-bold">
            {{ editando ? 'Editar rol' : 'Nuevo rol' }}
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-7" @click="cerrarDialog" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md q-pt-md rol-dialog-body">
          <div>
            <div class="field-label">NOMBRE</div>
            <q-input
              ref="nombreRef"
              v-model="formDialog.nombre"
              dense
              outlined
              autofocus
              :disable="!!editando && !editando.requiere_sucursal"
              placeholder="Ej. Personal de atención de niños"
              :rules="[(v) => !!v.trim() || 'El nombre es requerido']"
            />
          </div>
          <div>
            <div class="field-label">DESCRIPCIÓN (opcional)</div>
            <q-input
              v-model="formDialog.descripcion"
              dense
              outlined
              type="textarea"
              rows="2"
              :disable="!!editando && !editando.requiere_sucursal"
              placeholder="Qué hace este rol dentro del sistema"
            />
          </div>

          <div>
            <div class="row items-center q-mb-xs">
              <div class="field-label" style="margin-bottom: 0">PERMISOS</div>
              <q-space />
              <span
                v-if="editando && !editando.permisos_editables"
                class="text-caption text-grey-6"
              >
                Este rol siempre tiene todos los permisos.
              </span>
            </div>

            <q-input
              v-model="busquedaPermiso"
              dense
              outlined
              clearable
              placeholder="Buscar permiso..."
              class="q-mb-sm"
            >
              <template #prepend><q-icon name="search" size="18px" color="grey-6" /></template>
            </q-input>

            <div
              v-if="gruposPermisos.length === 0"
              class="text-caption text-grey-6 text-center q-pa-md"
            >
              No se encontraron permisos.
            </div>

            <q-expansion-item
              v-for="grupo in gruposPermisos"
              :key="grupo.modulo"
              :model-value="isModuloExpandido(grupo.modulo)"
              dense
              header-class="permiso-grupo__header"
              class="permiso-grupo"
              :class="{ 'permiso-grupo--activo': grupo.seleccionados > 0 }"
              @update:model-value="(val) => toggleModulo(grupo.modulo, val)"
            >
              <template #header>
                <q-item-section class="permiso-grupo__nombre">
                  {{ grupo.modulo }}
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    class="contador-badge"
                    :class="{ 'contador-badge--activo': grupo.seleccionados > 0 }"
                    :label="`${grupo.seleccionados}/${grupo.total}`"
                  />
                </q-item-section>
              </template>

              <div class="permiso-grupo__body">
                <q-checkbox
                  v-for="permiso in grupo.permisos"
                  :key="permiso.id"
                  v-model="formDialog.permiso_ids"
                  :val="permiso.id"
                  :label="permiso.nombre"
                  :disable="!!editando && !editando.permisos_editables"
                  color="positive"
                  dense
                  class="permiso-checkbox"
                />
              </div>
            </q-expansion-item>
          </div>
        </q-card-section>

        <q-card-actions class="row items-center q-pa-md q-pt-sm" style="flex-shrink: 0">
          <q-badge
            class="contador-badge"
            :class="{ 'contador-badge--activo': formDialog.permiso_ids.length > 0 }"
            :label="`${formDialog.permiso_ids.length} permisos seleccionados`"
          />
          <q-space />
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="editando ? 'Guardar cambios' : 'Crear rol'"
            style="border-radius: 8px; font-weight: 600"
            :loading="guardando"
            :disable="!formDialog.nombre.trim()"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Dialog Confirmar Desactivar ──────────────────────────────────────── -->
    <q-dialog v-model="dialogDesactivar">
      <q-card style="min-width: 360px; border-radius: 12px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Desactivar rol</div>
          <div class="q-mt-sm text-body2 text-grey-8">
            ¿Deseas desactivar <strong>{{ filaDesactivar?.nombre }}</strong
            >? Los usuarios que ya lo tienen conservan su acceso, pero no podrás asignarlo a
            usuarios nuevos.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-xs">
          <q-btn v-close-popup flat no-caps label="Cancelar" color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Desactivar"
            style="border-radius: 8px; font-weight: 600"
            :loading="desactivando"
            @click="ejecutarDesactivar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogReactivar">
      <q-card style="min-width: 360px; border-radius: 12px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Reactivar rol</div>
          <div class="q-mt-sm text-body2 text-grey-8">
            ¿Deseas reactivar <strong>{{ filaReactivar?.nombre }}</strong
            >? Volverá a estar disponible para asignarlo a usuarios nuevos.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-xs">
          <q-btn v-close-popup flat no-caps label="Cancelar" color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="positive"
            label="Reactivar"
            style="border-radius: 8px; font-weight: 600"
            :loading="reactivando"
            @click="ejecutarReactivar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useRolesStore } from '@/stores/roles'
import type { RolConPermisos } from '@/types/permission'

const $q = useQuasar()
const authStore = useAuthStore()
const store = useRolesStore()

const puedeEditar = computed(() => authStore.hasPermission('permisos:editar'))

const cargar = async () => {
  await store.cargar()
  if (store.catalogoPermisos.length === 0) await store.cargarCatalogo()
}

onMounted(cargar)

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'descripcion', label: 'DESCRIPCIÓN', field: 'descripcion', align: 'left' },
  { name: 'permisos', label: 'PERMISOS', field: 'permisos', align: 'left' },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]

const modulosBase = computed(() => {
  const vistos = new Set<string>()
  const orden: string[] = []
  for (const permiso of store.catalogoPermisos) {
    if (!vistos.has(permiso.modulo)) {
      vistos.add(permiso.modulo)
      orden.push(permiso.modulo)
    }
  }
  return orden
})

const busquedaPermiso = ref('')
const modulosExpandido = ref<Set<string>>(new Set())

const isModuloExpandido = (modulo: string) =>
  busquedaPermiso.value.trim() ? true : modulosExpandido.value.has(modulo)

const toggleModulo = (modulo: string, expandido: boolean) => {
  if (busquedaPermiso.value.trim()) return
  const set = new Set(modulosExpandido.value)
  if (expandido) set.add(modulo)
  else set.delete(modulo)
  modulosExpandido.value = set
}

const gruposPermisos = computed(() => {
  const grupos = new Map<string, typeof store.catalogoPermisos>()
  for (const permiso of store.catalogoPermisos) {
    const lista = grupos.get(permiso.modulo) ?? []
    lista.push(permiso)
    grupos.set(permiso.modulo, lista)
  }

  const termino = busquedaPermiso.value.trim().toLowerCase()
  const seleccionados = new Set(formDialog.value.permiso_ids)

  return Array.from(grupos.entries())
    .map(([modulo, permisos]) => ({
      modulo,
      permisos: termino
        ? permisos.filter((p) => p.nombre.toLowerCase().includes(termino))
        : permisos,
      total: permisos.length,
      seleccionados: permisos.filter((p) => seleccionados.has(p.id)).length,
    }))
    .filter((grupo) => grupo.permisos.length > 0)
})

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<RolConPermisos | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formDialog = ref({
  nombre: '',
  descripcion: '',
  permiso_ids: [] as number[],
})

const abrirCrear = () => {
  editando.value = null
  formDialog.value = { nombre: '', descripcion: '', permiso_ids: [] }
  busquedaPermiso.value = ''
  modulosExpandido.value = new Set(modulosBase.value.slice(0, 1))
  dialogOpen.value = true
}

const abrirEditar = (row: RolConPermisos) => {
  editando.value = row
  formDialog.value = {
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    permiso_ids: row.permisos.map((p) => p.id),
  }
  busquedaPermiso.value = ''
  const idsSeleccionados = new Set(formDialog.value.permiso_ids)
  const modulosConSeleccion = store.catalogoPermisos
    .filter((p) => idsSeleccionados.has(p.id))
    .map((p) => p.modulo)
  modulosExpandido.value = new Set(
    modulosConSeleccion.length > 0 ? modulosConSeleccion : modulosBase.value.slice(0, 1),
  )
  dialogOpen.value = true
}

const cerrarDialog = () => {
  dialogOpen.value = false
  editando.value = null
}

const guardar = async () => {
  if (!formDialog.value.nombre.trim()) {
    nombreRef.value?.validate()
    return
  }
  guardando.value = true
  try {
    if (editando.value) {
      const rol = editando.value
      if (rol.requiere_sucursal) {
        await store.actualizarMetadata(rol.id, {
          nombre: formDialog.value.nombre.trim(),
          descripcion: formDialog.value.descripcion.trim() || null,
        })
      }
      if (rol.permisos_editables) {
        await store.actualizarPermisos(rol.id, formDialog.value.permiso_ids)
      }
      $q.notify({ type: 'positive', message: 'Rol actualizado', position: 'top-right' })
    } else {
      await store.crear({
        nombre: formDialog.value.nombre.trim(),
        descripcion: formDialog.value.descripcion.trim() || null,
        permiso_ids: formDialog.value.permiso_ids,
      })
      $q.notify({ type: 'positive', message: 'Rol creado', position: 'top-right' })
    }
    cerrarDialog()
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ocurrió un error. Intenta de nuevo.',
      position: 'top-right',
    })
  } finally {
    guardando.value = false
  }
}

// ── Desactivar / Reactivar ──────────────────────────────────────────────────

const dialogDesactivar = ref(false)
const filaDesactivar = ref<RolConPermisos | null>(null)
const desactivando = ref(false)

const confirmarDesactivar = (row: RolConPermisos) => {
  filaDesactivar.value = row
  dialogDesactivar.value = true
}

const ejecutarDesactivar = async () => {
  if (!filaDesactivar.value) return
  desactivando.value = true
  try {
    await store.desactivar(filaDesactivar.value.id)
    $q.notify({ type: 'positive', message: 'Rol desactivado', position: 'top-right' })
    dialogDesactivar.value = false
  } catch {
    $q.notify({
      type: 'negative',
      message: 'No se pudo desactivar. Intenta de nuevo.',
      position: 'top-right',
    })
  } finally {
    desactivando.value = false
  }
}

const dialogReactivar = ref(false)
const filaReactivar = ref<RolConPermisos | null>(null)
const reactivando = ref(false)

const confirmarReactivar = (row: RolConPermisos) => {
  filaReactivar.value = row
  dialogReactivar.value = true
}

const ejecutarReactivar = async () => {
  if (!filaReactivar.value) return
  reactivando.value = true
  try {
    await store.reactivar(filaReactivar.value.id)
    $q.notify({ type: 'positive', message: 'Rol reactivado', position: 'top-right' })
    dialogReactivar.value = false
  } catch {
    $q.notify({
      type: 'negative',
      message: 'No se pudo reactivar. Intenta de nuevo.',
      position: 'top-right',
    })
  } finally {
    reactivando.value = false
  }
}
</script>

<style scoped lang="scss">
.field-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.rol-dialog-card {
  width: 460px;
  height: 620px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.rol-dialog-body {
  flex: 1;
  overflow-y: auto;
}

.permiso-grupo {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  overflow: hidden;
  transition: background 0.2s ease;

  &--activo {
    background: rgba(63, 168, 52, 0.05);
    border-color: rgba(63, 168, 52, 0.25);
  }
}

:deep(.permiso-grupo__header) {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.permiso-grupo__nombre {
  text-transform: capitalize;
}

.permiso-grupo__body {
  padding: 0 16px 10px 16px;
  border-top: 1px solid var(--border-color);
}

.permiso-checkbox {
  display: flex;
  width: 100%;
}

.contador-badge {
  background: var(--bg-main);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;

  &--activo {
    background: rgba(63, 168, 52, 0.12);
    color: #3fa834;
    border: 1px solid rgba(63, 168, 52, 0.3);
  }
}
</style>
