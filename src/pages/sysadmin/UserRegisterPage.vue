<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { userService } from '@/services/userService'
import { branchService } from '@/services/branchService'
import { useAuthStore } from '@/stores/auth'
import { useRolesStore } from '@/stores/roles'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { UserRole, ApiError } from '@/types/auth'
import type { Branch } from '@/types/branch'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const rolesStore = useRolesStore()

const loading = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)
const branches = ref<Branch[]>([])

// Un Administrador de sucursal solo puede dar de alta roles operativos
// (los que requieren sucursal fija) en su propia sucursal — nunca otro
// Administrador ni un AdministradorSistema.
const isBranchAdmin = computed(() => authStore.hasRole('Administrador'))

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: null as UserRole | null,
  branchId: null as string | null,
})

// El catálogo de roles es dinámico (ver stores/roles.ts / página Roles).
const roleOptions = computed(() =>
  rolesStore.roles
    .filter((r) => r.activo && (!isBranchAdmin.value || r.requiere_sucursal))
    .map((r) => ({ label: r.nombre, value: r.nombre })),
)

const branchOptions = computed(() =>
  branches.value.filter((b) => b.isActive).map((b) => ({ label: b.nombre, value: b.id })),
)

// Solo los roles operativos (requiere_sucursal) usan una sola sucursal fija.
// Un Administrador ya no se asigna a una sucursal desde aquí: eso se hace al
// crear/editar la sucursal, donde un mismo administrador puede quedar
// asignado a varias.
const requiresBranch = computed(
  () => rolesStore.roles.find((r) => r.nombre === form.role)?.requiere_sucursal ?? false,
)

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
  if (rolesStore.roles.length === 0) await rolesStore.cargar()
})
</script>

<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
          Registrar usuario
        </div>
        <div class="text-body2" style="color: var(--text-secondary)">
          Crea una cuenta y asigna su rol dentro del sistema.
        </div>
      </div>
    </div>

    <q-card flat bordered style="max-width: 560px; border-radius: 12px">
      <q-card-section class="q-pa-lg">
        <q-form class="q-gutter-y-md" @submit.prevent="handleSubmit">
          <div>
            <div class="field-label">Nombre completo</div>
            <q-input v-model="form.name" outlined dense :rules="nameRules" lazy-rules />
          </div>

          <div>
            <div class="field-label">Correo electrónico</div>
            <q-input
              v-model="form.email"
              type="email"
              autocomplete="off"
              outlined
              dense
              :rules="emailRules"
              lazy-rules
            />
          </div>

          <div>
            <div class="field-label">Contraseña</div>
            <q-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              outlined
              dense
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
          </div>

          <div>
            <div class="field-label">Confirmar contraseña</div>
            <q-input
              v-model="form.confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              autocomplete="new-password"
              outlined
              dense
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
          </div>

          <div>
            <div class="field-label">Rol</div>
            <q-select
              v-model="form.role"
              :options="roleOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
              :rules="roleRules"
              lazy-rules
              @update:model-value="form.branchId = null"
            />
          </div>

          <div v-if="showBranchSelector">
            <div class="field-label">Sucursal <span class="text-negative">*</span></div>
            <q-select
              v-model="form.branchId"
              :options="branchOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
              :rules="branchRules"
              lazy-rules
              :hint="
                branchOptions.length === 0 ? 'No hay sucursales activas registradas.' : undefined
              "
            />
          </div>

          <div class="row justify-end q-gutter-sm q-mt-md">
            <q-btn
              flat
              no-caps
              label="Cancelar"
              color="grey-7"
              :disable="loading"
              @click="router.push({ name: 'usuarios-listar' })"
            />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Registrar"
              style="border-radius: 8px; font-weight: 600"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>
