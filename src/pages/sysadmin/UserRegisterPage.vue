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

const loading = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)
const branches = ref<Branch[]>([])

const prefilledBranchId = typeof route.query.branchId === 'string' ? route.query.branchId : null
const prefilledBranchName =
  typeof route.query.branchName === 'string' ? route.query.branchName : null

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: (prefilledBranchId ? 'Administrador' : null) as UserRole | null,
  branchId: prefilledBranchId,
})

const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'Administrador Sistema', value: 'AdministradorSistema' },
  { label: 'Administrador', value: 'Administrador' },
  { label: 'Cajero', value: 'Cajero' },
  { label: 'Cocina', value: 'Cocina' },
]

const branchOptions = computed(() => {
  const activas = branches.value
    .filter((b) => b.isActive)
    .map((b) => ({ label: b.nombre, value: b.id }))
  const yaIncluida = activas.some((b) => b.value === prefilledBranchId)
  if (prefilledBranchId && prefilledBranchName && !yaIncluida) {
    return [{ label: prefilledBranchName, value: prefilledBranchId }, ...activas]
  }
  return activas
})

const requiresBranch = computed(() => form.role !== null && form.role !== 'AdministradorSistema')

const nameRules = [(v: string) => !!v.trim() || 'El nombre es requerido']
const emailRules = [
  (v: string) => !!v || 'El correo es requerido',
  (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Ingresa un correo válido',
]
const passwordRules = [
  (v: string) => !!v || 'La contraseña es requerida',
  (v: string) => v.length >= 8 || 'Mínimo 8 caracteres',
]
const confirmRules = [(v: string) => v === form.password || 'Las contraseñas no coinciden']
const roleRules = [(v: UserRole | null) => !!v || 'Selecciona un rol']
const branchRules = [
  (v: string | null) => !requiresBranch.value || !!v || 'La sucursal es requerida para este rol',
]

function resolveErrorMessage(err: ApiError): string {
  if (err.statusCode === 409) return 'Ya existe un usuario con ese correo electrónico.'
  if (err.statusCode === 403) return 'No tienes permiso para asignar ese rol.'
  if (err.statusCode === 422) return 'La sucursal es requerida para este rol.'
  return 'No se pudo registrar el usuario. Verifica los datos.'
}

async function handleSubmit(): Promise<void> {
  loading.value = true
  try {
    await userService.createUser({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role!,
      branchId: requiresBranch.value ? form.branchId : null,
    })
    if (prefilledBranchId) {
      $q.notify({
        type: 'positive',
        message: 'Usuario registrado. Puedes agregar otro usuario a esta sucursal o salir.',
      })
      form.name = ''
      form.email = ''
      form.password = ''
      form.confirmPassword = ''
      form.role = null
      return
    }
    $q.notify({ type: 'positive', message: 'Usuario registrado correctamente.' })
    router.push({ name: 'usuarios-listar' })
  } catch (err) {
    $q.notify({ type: 'negative', message: resolveErrorMessage(err as ApiError) })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    branches.value = await branchService.listBranches()
  } catch {
    $q.notify({ type: 'warning', message: 'No se pudieron cargar las sucursales.' })
  }
})
</script>

<template>
  <q-page padding>
    <div class="flex items-center q-mb-lg q-gutter-sm">
      <q-btn flat round dense icon="arrow_back" @click="router.push({ name: 'usuarios-listar' })" />
      <div class="text-h5 text-weight-bold">Registrar usuario</div>
    </div>

    <q-banner
      v-if="prefilledBranchName"
      dense
      rounded
      class="bg-blue-1 text-blue-9 q-mb-md"
      style="max-width: 560px"
    >
      <template #avatar><q-icon name="store" color="blue-8" /></template>
      Dando de alta personal para <strong>{{ prefilledBranchName }}</strong
      >. Puedes registrar varios usuarios (administrador, cajero, cocina) seguidos para esta
      sucursal.
    </q-banner>

    <q-card flat bordered style="max-width: 560px">
      <q-card-section>
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

          <q-input
            v-model="form.password"
            label="Contraseña"
            :type="showPassword ? 'text' : 'password'"
            outlined
            :rules="passwordRules"
            lazy-rules
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-input
            v-model="form.confirmPassword"
            label="Confirmar contraseña"
            :type="showConfirm ? 'text' : 'password'"
            outlined
            :rules="confirmRules"
            lazy-rules
          >
            <template #append>
              <q-icon
                :name="showConfirm ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showConfirm = !showConfirm"
              />
            </template>
          </q-input>

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
            :hint="
              branchOptions.length === 0 ? 'No hay sucursales activas registradas.' : undefined
            "
          />

          <div class="row justify-end q-gutter-sm q-mt-md">
            <q-btn
              flat
              label="Cancelar"
              :disable="loading"
              @click="router.push({ name: 'usuarios-listar' })"
            />
            <q-btn type="submit" color="primary" label="Registrar" :loading="loading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>
