<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { branchService } from '@/services/branchService'
import { userService } from '@/services/userService'
import type { Branch } from '@/types/branch'
import { Notify } from 'quasar'

const route = useRoute()
const router = useRouter()

const branch = ref<Branch | null>(null)
const loading = ref(true)
const branchEmail = ref('')
const branchClave = ref('')
const administrador = ref<{ id: string; label: string } | null>(null)
const adminOptionsAll = ref<{ id: string; label: string }[]>([])
const adminOptions = ref<{ id: string; label: string }[]>([])
const adminLoading = ref(false)

const originalValues = ref<{
  nombre: string
  telefono: string
  direccion: string
  email: string
  clave: string
  adminId: string | null
} | null>(null)

onMounted(async () => {
  const branchId = route.params.id as string
  if (!branchId) {
    router.push({ name: 'sucursales-listar' })
    return
  }

  const [branchData, users] = await Promise.allSettled([
    branchService.getBranch(branchId),
    userService.listUsers(),
  ])

  if (branchData.status === 'fulfilled') {
    branch.value = branchData.value
    branchEmail.value = branchData.value.correo ?? ''
    branchClave.value = branchData.value.clave ?? ''
  } else {
    Notify.create({ type: 'negative', message: 'Error al cargar la sucursal.' })
    router.push({ name: 'sucursales-listar' })
    loading.value = false
    return
  }

  if (users.status === 'fulfilled') {
    adminOptionsAll.value = users.value
      .filter((u) => u.role === 'Administrador' && u.isActive)
      .map((u) => ({ id: u.id, label: u.name }))
    adminOptions.value = adminOptionsAll.value

    if (branch.value?.administradorId) {
      administrador.value =
        adminOptionsAll.value.find((a) => a.id === branch.value!.administradorId) ?? null
    }
  }

  originalValues.value = {
    nombre: branch.value!.nombre,
    telefono: branch.value!.telefono ?? '',
    direccion: branch.value!.direccion ?? '',
    email: branchEmail.value,
    clave: branchClave.value,
    adminId: administrador.value?.id ?? null,
  }

  loading.value = false
})

const isFormValid = computed(() => {
  const n = branch.value?.nombre || ''
  const t = branch.value?.telefono || ''
  const c = branchClave.value || ''
  return n.trim() !== '' && t.trim() !== '' && c.trim() !== ''
})

const hasChanges = computed(() => {
  if (!branch.value || !originalValues.value) return false
  return (
    branch.value.nombre !== originalValues.value.nombre ||
    (branch.value.telefono ?? '') !== originalValues.value.telefono ||
    (branch.value.direccion ?? '') !== originalValues.value.direccion ||
    branchEmail.value !== originalValues.value.email ||
    branchClave.value !== originalValues.value.clave ||
    (administrador.value?.id ?? null) !== originalValues.value.adminId
  )
})

const nombreTouched = ref(false)
const telefonoTouched = ref(false)
const claveTouched = ref(false)

const nombreError = computed(() => nombreTouched.value && !(branch.value?.nombre ?? '').trim())
const telefonoError = computed(
  () => telefonoTouched.value && !(branch.value?.telefono ?? '').trim(),
)
const claveError = computed(() => claveTouched.value && !branchClave.value.trim())

async function saveChanges() {
  if (!branch.value) return
  loading.value = true
  try {
    await branchService.updateBranch(branch.value.id, {
      nombre: branch.value.nombre,
      direccion: branch.value.direccion,
      telefono: branch.value.telefono,
      correo: branchEmail.value || null,
      clave: branchClave.value || null, // <--- ¡FALTABA ESTO!
      administrador_id: administrador.value?.id ?? null,
    })
    Notify.create({ type: 'positive', message: 'Sucursal actualizada con éxito.' })
    router.push({ name: 'sucursales-listar' })
  } catch {
    Notify.create({ type: 'negative', message: 'Error al guardar los cambios.' })
  } finally {
    loading.value = false
  }
}

function cancelEdit() {
  router.back()
}

function filterAdminOptions(val: string, update: (fn: () => void) => void) {
  update(() => {
    if (!val) {
      adminOptions.value = adminOptionsAll.value
      return
    }
    const needle = val.toLowerCase()
    adminOptions.value = adminOptionsAll.value.filter((o) => o.label.toLowerCase().includes(needle))
  })
}
</script>

<template>
  <q-page v-if="loading" class="flex flex-center">
    <q-spinner-dots color="primary" size="40px" />
  </q-page>

  <q-page v-else-if="!branch" padding class="text-center">
    <div class="text-h5 text-grey-7 q-mt-xl">Sucursal no encontrada</div>
    <q-btn
      color="primary"
      label="Volver al listado"
      class="q-mt-md"
      @click="router.push({ name: 'sucursales-listar' })"
    />
  </q-page>

  <q-page v-else padding class="bg-grey-1 branch-edit-page">
    <div class="row items-start justify-between q-mb-lg header-wrap">
      <div class="header-copy">
        <q-breadcrumbs class="text-grey-7 q-mb-sm" active-color="dark">
          <q-breadcrumbs-el label="Inicio" />
          <q-breadcrumbs-el label="Administración" />
          <q-breadcrumbs-el label="Sucursales" :to="{ name: 'sucursales-listar' }" />
          <q-breadcrumbs-el :label="branch.nombre" />
          <q-breadcrumbs-el label="Editar" class="text-weight-bold" />
        </q-breadcrumbs>
        <div class="row items-center q-gutter-sm q-mb-xs">
          <h1 class="text-h4 text-weight-bold q-my-none text-dark">{{ branch.nombre }}</h1>
          <q-badge
            :color="branch.isActive ? 'positive' : 'negative'"
            text-color="white"
            class="status-badge"
          >
            <b>{{ branch.isActive ? 'Activa' : 'Inactiva' }}</b>
          </q-badge>
        </div>
        <p class="text-subtitle2 text-grey-7 q-mt-sm q-mb-none">
          Clave: <strong>{{ branch.clave ?? '-' }}</strong>
        </p>
      </div>
      <div class="row q-gutter-sm actions-wrap">
        <q-btn outline color="dark" label="Cancelar" class="btn-cancel" @click="cancelEdit" />
        <q-btn
          color="primary"
          icon="save"
          label="Guardar Cambios"
          class="btn-save"
          :loading="loading"
          :disable="!isFormValid || !hasChanges"
          @click="saveChanges"
        />
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-lg-8">
        <!-- Información General -->
        <q-card class="q-mb-lg form-card" flat bordered>
          <q-card-section class="card-header-section">
            <div class="text-h6 text-weight-bold flex items-center">
              <q-icon name="info" size="sm" color="primary" class="q-mr-sm" />
              Información General
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pt-lg">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <div class="field-label">
                  Clave de Sucursal <span class="text-negative">*</span>
                </div>
                <q-input
                  v-model="branchClave"
                  outlined
                  dense
                  class="field-input"
                  :error="claveError"
                  error-message="La clave de la sucursal es requerida"
                  @blur="claveTouched = true"
                />
              </div>
              <div class="col-12 col-md-6">
                <div class="field-label">
                  Nombre de la Sucursal <span class="text-negative">*</span>
                </div>
                <q-input
                  v-model="branch.nombre"
                  outlined
                  dense
                  class="field-input"
                  placeholder="Plaza Colibrí"
                  :error="nombreError"
                  error-message="El nombre de la sucursal es requerido"
                  @blur="nombreTouched = true"
                />
              </div>
              <div class="col-12">
                <div class="field-label">Dirección Completa</div>
                <q-input v-model="branch.direccion" outlined dense class="field-input">
                  <template #prepend><q-icon name="place" color="grey-6" /></template>
                </q-input>
              </div>
              <div class="col-12 col-md-6">
                <div class="field-label">
                  Teléfono de Contacto <span class="text-negative">*</span>
                </div>
                <q-input
                  v-model="branch.telefono"
                  outlined
                  dense
                  class="field-input"
                  :error="telefonoError"
                  error-message="El teléfono de contacto es requerido"
                  @blur="telefonoTouched = true"
                >
                  <template #prepend><q-icon name="phone" color="grey-6" /></template>
                </q-input>
              </div>
              <div class="col-12 col-md-6">
                <div class="field-label">Correo Electrónico</div>
                <q-input
                  v-model="branchEmail"
                  outlined
                  dense
                  class="field-input"
                  placeholder="sucursal@example.com"
                >
                  <template #prepend><q-icon name="mail" color="grey-6" /></template>
                </q-input>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Gestión y Responsabilidades -->
        <q-card class="form-card" flat bordered>
          <q-card-section class="card-header-section">
            <div class="text-h6 text-weight-bold flex items-center">
              <q-icon name="group" size="sm" color="primary" class="q-mr-sm" />
              Gestión y Responsabilidades
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pt-lg">
            <div class="field-label">Administrador Responsable</div>
            <p class="text-caption text-grey-7 q-mb-sm">
              Opcional. Puedes dejar la sucursal sin administrador asignado; se puede asignar
              después. Un mismo administrador puede estar a cargo de varias sucursales.
            </p>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-md-8">
                <q-select
                  v-model="administrador"
                  outlined
                  dense
                  use-input
                  input-debounce="0"
                  option-value="id"
                  option-label="label"
                  placeholder="Buscar por nombre (opcional)..."
                  :options="adminOptions"
                  :loading="adminLoading"
                  clearable
                  class="field-input"
                  map-options
                  @filter="filterAdminOptions"
                >
                  <template #prepend><q-icon name="search" color="grey-6" /></template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        {{ adminLoading ? 'Cargando...' : 'Sin administradores disponibles' }}
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div class="col-12 col-md-4">
                <q-btn
                  outline
                  color="primary"
                  icon="person_add"
                  label="+ Crear Administrador"
                  class="full-width btn-new-manager"
                  @click="router.push({ name: 'usuarios-crear' })"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-4">
        <q-card class="tip-card" flat>
          <q-card-section>
            <div class="flex items-center q-mb-sm">
              <q-icon name="lightbulb" color="primary" size="sm" class="q-mr-sm" />
              <span class="text-weight-bold text-primary">Tip de Administrador</span>
            </div>
            <p class="text-body2 text-grey-8 q-mb-none">
              Asegúrate de que la Clave siga el formato <strong>(SUC-XX-00)</strong> para facilitar
              el filtrado en reportes globales.
            </p>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.branch-edit-page {
  color: #111827;
}
.header-wrap {
  gap: 16px;
}
.header-copy {
  min-width: 0;
}
.actions-wrap {
  flex-shrink: 0;
}
.btn-cancel,
.btn-save {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  padding: 8px 20px;
}
.form-card {
  border-radius: 12px;
  border-color: #e5e7eb;
  background: #ffffff;
}
.card-header-section {
  padding: 20px 24px 16px;
}
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}
.field-input--readonly :deep(.q-field__control) {
  background: #f5f5f5;
}
.btn-new-manager {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  height: 40px;
}
.tip-card {
  border-radius: 12px;
  background-color: #e8f0fe;
  border: 1px solid #c5d8fb;
}
.status-badge {
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  padding-inline: 10px;
}
@media (max-width: 1023px) {
  .header-wrap {
    align-items: flex-start;
  }
  .actions-wrap {
    width: 100%;
  }
  .btn-cancel,
  .btn-save {
    width: 100%;
  }
}
</style>
