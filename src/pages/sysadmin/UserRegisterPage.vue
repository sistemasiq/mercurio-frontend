<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { userService } from '@/services/userService'
import { branchService } from '@/services/branchService'
import { useAuthStore } from '@/stores/auth'
import type { UserRole, ApiError } from '@/types/auth'
import type { Branch } from '@/types/branch'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)
const branches = ref<Branch[]>([])

// Un Administrador de sucursal solo puede dar de alta Cajero/Cocina en su
// propia sucursal — nunca otro Administrador ni un AdministradorSistema.
const isBranchAdmin = computed(() => authStore.hasRole('Administrador'))

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: null as UserRole | null,
  branchId: null as string | null,
})

const ALL_ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'Administrador Sistema', value: 'AdministradorSistema' },
  { label: 'Administrador', value: 'Administrador' },
  { label: 'Cajero', value: 'Cajero' },
  { label: 'Cocina', value: 'Cocina' },
]

const roleOptions = computed(() =>
  isBranchAdmin.value
    ? ALL_ROLE_OPTIONS.filter((o) => o.value === 'Cajero' || o.value === 'Cocina')
    : ALL_ROLE_OPTIONS,
)

const branchOptions = computed(() =>
  branches.value.filter((b) => b.isActive).map((b) => ({ label: b.nombre, value: b.id })),
)

// Solo Cajero/Cocina operan una sola sucursal fija. Un Administrador ya no se
// asigna a una sucursal desde aquí: eso se hace al crear/editar la sucursal,
// donde un mismo administrador puede quedar asignado a varias.
const requiresBranch = computed(() => form.role === 'Cajero' || form.role === 'Cocina')

// Un Administrador de sucursal siempre da de alta usuarios en su propia
// sucursal: no tiene sentido pedirle que la seleccione.
const showBranchSelector = computed(() => requiresBranch.value && !isBranchAdmin.value)

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
      branchId: requiresBranch.value
        ? isBranchAdmin.value
          ? authStore.currentBranchId
          : form.branchId
        : null,
    })
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
            v-if="showBranchSelector"
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
