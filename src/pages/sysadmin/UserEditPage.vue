<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { userService } from '@/services/userService'
import { branchService } from '@/services/branchService'
import type { UserRole, ApiError } from '@/types/auth'
import type { Branch } from '@/types/branch'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()

const id = route.params.id as string
const loading = ref(false)
const loadingData = ref(true)
const showPassword = ref(false)
const branches = ref<Branch[]>([])

const form = reactive({
  name: '',
  email: '',
  role: null as UserRole | null,
  branchId: null as string | null,
  password: '',
})

const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'Administrador Sistema', value: 'AdministradorSistema' },
  { label: 'Administrador', value: 'Administrador' },
  { label: 'Cajero', value: 'Cajero' },
  { label: 'Cocina', value: 'Cocina' },
]

const branchOptions = computed(() =>
  branches.value.filter((b) => b.isActive).map((b) => ({ label: b.nombre, value: b.id })),
)

const requiresBranch = computed(() => form.role !== null && form.role !== 'AdministradorSistema')

const nameRules = [(v: string) => !!v.trim() || 'El nombre es requerido']
const emailRules = [
  (v: string) => !!v || 'El correo es requerido',
  (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Ingresa un correo válido',
]
const roleRules = [(v: UserRole | null) => !!v || 'Selecciona un rol']
const branchRules = [
  (v: string | null) => !requiresBranch.value || !!v || 'La sucursal es requerida para este rol',
]
const passwordRules = [(v: string) => !v || v.length >= 8 || 'Mínimo 8 caracteres']

function resolveErrorMessage(err: ApiError): string {
  if (err.statusCode === 404) return 'Usuario no encontrado.'
  if (err.statusCode === 409) return 'Ya existe un usuario con ese correo electrónico.'
  if (err.statusCode === 403) return 'No tienes permiso para asignar ese rol.'
  if (err.statusCode === 422) return 'La sucursal es requerida para este rol.'
  return 'No se pudo guardar el usuario. Verifica los datos.'
}

async function handleSubmit(): Promise<void> {
  loading.value = true
  try {
    await userService.updateUser(id, {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role!,
      branchId: requiresBranch.value ? form.branchId : null,
      password: form.password || null,
    })
    $q.notify({ type: 'positive', message: 'Usuario actualizado correctamente.' })
    router.push({ name: 'sysadmin-users' })
  } catch (err) {
    $q.notify({ type: 'negative', message: resolveErrorMessage(err as ApiError) })
  } finally {
    loading.value = false
  }
}

function confirmDelete(): void {
  $q.dialog({
    title: 'Eliminar usuario',
    message: `¿Eliminar a "${form.name}"? Esta acción no se puede deshacer.`,
    cancel: { flat: true, label: 'Cancelar' },
    ok: { color: 'negative', label: 'Eliminar' },
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      await userService.deleteUser(id)
      $q.notify({ type: 'positive', message: 'Usuario eliminado.' })
      router.push({ name: 'sysadmin-users' })
    } catch {
      $q.notify({ type: 'negative', message: 'No se pudo eliminar el usuario.' })
      loading.value = false
    }
  })
}

onMounted(async () => {
  try {
    const [user, branchList] = await Promise.all([
      userService.getUser(id),
      branchService.listBranches(),
    ])
    branches.value = branchList
    form.name = user.name
    form.email = user.email
    form.role = user.role
    form.branchId = user.branchId
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar el usuario.' })
    router.push({ name: 'sysadmin-users' })
  } finally {
    loadingData.value = false
  }
})
</script>

<template>
  <q-page padding>
    <div class="flex items-center q-mb-lg q-gutter-sm">
      <q-btn flat round dense icon="arrow_back" @click="router.push({ name: 'sysadmin-users' })" />
      <div class="text-h5 text-weight-bold">Editar usuario</div>
    </div>

    <q-card flat bordered style="max-width: 560px">
      <q-inner-loading :showing="loadingData" />

      <q-card-section v-if="!loadingData">
        <q-form class="q-gutter-y-md" @submit.prevent="handleSubmit">
          <q-input
            v-model="form.name"
            label="Nombre completo"
            outlined
            :rules="nameRules"
            lazy-rules
          />

          <q-input
            v-model="form.email"
            label="Correo electrónico"
            type="email"
            outlined
            :rules="emailRules"
            lazy-rules
          />

          <q-select
            v-model="form.role"
            :options="roleOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Rol"
            outlined
            :rules="roleRules"
            lazy-rules
            @update:model-value="form.branchId = null"
          />

          <q-select
            v-if="requiresBranch"
            v-model="form.branchId"
            :options="branchOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Sucursal *"
            outlined
            :rules="branchRules"
            lazy-rules
            :hint="branchOptions.length === 0 ? 'No hay sucursales activas.' : undefined"
          />

          <q-input
            v-model="form.password"
            label="Nueva contraseña"
            :type="showPassword ? 'text' : 'password'"
            outlined
            :rules="passwordRules"
            lazy-rules
            hint="Dejar vacío para no cambiar la contraseña"
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <div class="row justify-between q-mt-md">
            <q-btn
              flat
              color="negative"
              icon="delete"
              label="Eliminar"
              :disable="loading"
              @click="confirmDelete"
            />
            <div class="row q-gutter-sm">
              <q-btn
                flat
                label="Cancelar"
                :disable="loading"
                @click="router.push({ name: 'sysadmin-users' })"
              />
              <q-btn type="submit" color="primary" label="Guardar" :loading="loading" />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>
