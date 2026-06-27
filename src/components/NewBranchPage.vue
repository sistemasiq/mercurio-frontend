<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { branchService } from '@/services/branchService'
import { userService } from '@/services/userService'
import { Notify } from 'quasar'

const router = useRouter()
const loading = ref(false)

const nombre = ref('')
const direccion = ref('')
const telefono = ref('')
const email = ref('')
const clave = ref('')
const administrador = ref<{ id: string; label: string } | null>(null)
const adminOptions = ref<{ id: string; label: string }[]>([])
const adminLoading = ref(false)

onMounted(async () => {
  adminLoading.value = true
  try {
    const users = await userService.listUsers()
    adminOptions.value = users
      .filter((u) => u.role === 'Administrador' && u.isActive)
      .map((u) => ({ id: u.id, label: u.name }))
  } catch {
    Notify.create({ type: 'warning', message: 'No se pudieron cargar los administradores.' })
  } finally {
    adminLoading.value = false
  }
})

const isFormValid = computed(() => {
  return nombre.value.trim() !== '' && telefono.value.trim() !== '' && clave.value.trim() !== ''
})

async function createBranch() {
  if (!nombre.value.trim()) {
    Notify.create({ type: 'warning', message: 'El nombre de la sucursal es requerido.' })
    return
  }
  loading.value = true
  try {
    await branchService.createBranch({
      nombre: nombre.value,
      direccion: direccion.value || null,
      telefono: telefono.value || null,
      correo: email.value || null,
      clave: clave.value || null,
      administrador_id: administrador.value?.id ?? null,
      administrador_name: administrador.value?.label ?? null,
    })
    Notify.create({ type: 'positive', message: 'Sucursal creada con éxito.' })
    router.push({ name: 'sysadmin-branches' })
  } catch {
    Notify.create({ type: 'negative', message: 'Error al crear la sucursal.' })
  } finally {
    loading.value = false
  }
}

function cancelCreation() {
  router.back()
}
</script>

<template>
  <q-page padding class="bg-grey-1">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <q-breadcrumbs class="text-grey-7 q-mb-sm" active-color="dark">
          <q-breadcrumbs-el label="Inicio" />
          <q-breadcrumbs-el label="Administración" />
          <q-breadcrumbs-el label="Sucursales" :to="{ name: 'sysadmin-branches' }" />
          <q-breadcrumbs-el label="Nueva Sucursal" class="text-weight-bold" />
        </q-breadcrumbs>
        <h1 class="text-h4 text-weight-bold q-my-none text-dark">Registro de Nueva Sucursal</h1>
        <p class="text-subtitle1 text-grey-7 q-mt-xs q-mb-none">
          Configura los parámetros operativos de la nueva locación.
        </p>
      </div>
      <div class="row q-gutter-sm">
        <q-btn outline color="dark" label="Cancelar" class="btn-cancelar" @click="cancelCreation" />
        <q-btn
          color="primary"
          icon="save"
          label="Guardar Sucursal"
          class="btn-guardar"
          :loading="loading"
          :disable="!isFormValid"
          @click="createBranch"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
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
                  v-model="clave"
                  outlined
                  dense
                  placeholder="ej. SUC-LP-01"
                  class="field-input"
                />
              </div>
              <div class="col-12 col-md-6">
                <div class="field-label">
                  Nombre de la Sucursal <span class="text-negative">*</span>
                </div>
                <q-input
                  v-model="nombre"
                  outlined
                  dense
                  placeholder="ej. Plaza Colibrí"
                  class="field-input"
                />
              </div>
              <div class="col-12">
                <div class="field-label">Dirección Completa</div>
                <q-input
                  v-model="direccion"
                  outlined
                  type="textarea"
                  rows="3"
                  placeholder="Calle, Número, Colonia, Ciudad, Estado"
                  class="field-input"
                >
                  <template #prepend><q-icon name="place" color="grey-6" /></template>
                </q-input>
              </div>
              <div class="col-12 col-md-6">
                <div class="field-label">
                  Teléfono de Contacto <span class="text-negative">*</span>
                </div>
                <q-input
                  v-model="telefono"
                  outlined
                  dense
                  placeholder="+52 000 000 0000"
                  class="field-input"
                >
                  <template #prepend><q-icon name="phone" color="grey-6" /></template>
                </q-input>
              </div>
              <div class="col-12 col-md-6">
                <div class="field-label">Correo Electrónico</div>
                <q-input
                  v-model="email"
                  outlined
                  dense
                  placeholder="sucursal@playground.os"
                  class="field-input"
                >
                  <template #prepend><q-icon name="mail" color="grey-6" /></template>
                </q-input>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Gestión y Responsabilidades -->
        <q-card class="q-mb-lg form-card" flat bordered>
          <q-card-section class="card-header-section">
            <div class="text-h6 text-weight-bold flex items-center">
              <q-icon name="group" size="sm" color="primary" class="q-mr-sm" />
              Gestión y Responsabilidades
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pt-lg">
            <div class="field-label">Administrador Responsable</div>
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
                  placeholder="Buscar por nombre..."
                  :options="adminOptions"
                  :loading="adminLoading"
                  clearable
                  class="field-input"
                >
                  <template #prepend><q-icon name="search" color="grey-6" /></template>
                  <template #no-option> </template>
                </q-select>
              </div>
              <div class="col-12 col-md-4">
                <q-btn
                  outline
                  color="primary"
                  icon="person_add"
                  label="+ Crear Administrador"
                  class="full-width btn-nuevo-administrador"
                  @click="router.push({ name: 'sysadmin-users-new' })"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
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
.form-card {
  border-radius: 12px;
  border-color: #e0e0e0;
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
.field-input :deep(.q-field__control) {
  border-radius: 8px;
  background: #ffffff;
}
.field-input :deep(.q-field__label) {
  display: none;
}
.btn-cancelar,
.btn-guardar {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  padding: 8px 20px;
}
.btn-nuevo-administrador {
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
</style>
