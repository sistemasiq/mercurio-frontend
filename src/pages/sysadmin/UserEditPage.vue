<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { userService } from '@/services/userService'
import { branchService } from '@/services/branchService'
import { useAuthStore } from '@/stores/auth'
import { useRolesStore } from '@/stores/roles'
import type { UserRole, ApiError } from '@/types/auth'
import type { Branch } from '@/types/branch'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const rolesStore = useRolesStore()

const id = route.params.id as string
const loading = ref(false)
const loadingData = ref(true)
const showPassword = ref(false)
const branches = ref<Branch[]>([])

// Un Administrador de sucursal solo puede editar roles operativos de su
// propia sucursal — nunca otro Administrador ni un AdministradorSistema.
const isBranchAdmin = computed(() => authStore.hasRole('Administrador'))

const form = reactive({
  name: '',
  email: '',
  role: null as UserRole | null,
  branchId: null as string | null,
  password: '',
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
// Un Administrador se asigna a sucursales desde el formulario de sucursal,
// no aquí.
const requiresBranch = computed(
  () => rolesStore.roles.find((r) => r.nombre === form.role)?.requiere_sucursal ?? false,
)

// Un Administrador de sucursal siempre edita usuarios de su propia sucursal:
// no tiene sentido pedirle que la seleccione.
const showBranchSelector = computed(() => requiresBranch.value && !isBranchAdmin.value)

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
      branchId: requiresBranch.value
        ? isBranchAdmin.value
          ? authStore.currentBranchId
          : form.branchId
        : null,
      password: form.password || null,
    })
    $q.notify({ type: 'positive', message: 'Usuario actualizado correctamente.' })
    router.push({ name: 'usuarios-listar' })
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
      router.push({ name: 'usuarios-listar' })
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
      rolesStore.roles.length === 0 ? rolesStore.cargar() : Promise.resolve(),
    ])
    branches.value = branchList
    form.name = user.name
    form.email = user.email
    form.role = user.role
    form.branchId = user.branchId
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar el usuario.' })
    router.push({ name: 'usuarios-listar' })
  } finally {
    loadingData.value = false
  }
})
</script>

<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
          Editar usuario
        </div>
        <div class="text-body2" style="color: var(--text-secondary)">
          Actualiza los datos y el rol de la cuenta.
        </div>
      </div>
    </div>

    <q-card flat bordered style="max-width: 560px; border-radius: 12px">
      <q-inner-loading :showing="loadingData" />

      <q-card-section v-if="!loadingData" class="q-pa-lg">
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
              outlined
              dense
              :rules="emailRules"
              lazy-rules
            />
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
              :hint="branchOptions.length === 0 ? 'No hay sucursales activas.' : undefined"
            />
          </div>

          <div>
            <div class="field-label">Nueva contraseña</div>
            <q-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              outlined
              dense
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
          </div>

          <div class="row justify-between q-mt-md">
            <q-btn
              flat
              no-caps
              color="negative"
              icon="delete"
              label="Eliminar"
              :disable="loading"
              @click="confirmDelete"
            />
            <div class="row q-gutter-sm">
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
                label="Guardar"
                style="border-radius: 8px; font-weight: 600"
                :loading="loading"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>
