<template>
  <BaseDialog
    v-model="show"
    :title="userId ? 'Editar usuario' : 'Registrar usuario'"
    :subtitle="userId ? form.name || undefined : 'Crea la cuenta y asigna su rol.'"
    :icon="userId ? 'manage_accounts' : 'person_add'"
    :width="600"
    persistent
    :primary-label="userId ? 'Guardar' : 'Registrar'"
    :loading="guardando"
    :primary-disabled="cargando"
    @confirm="guardar"
  >
    <div v-if="cargando" class="row justify-center q-py-xl">
      <q-spinner-dots color="primary" size="36px" />
    </div>
    <q-form v-else ref="formRef" greedy class="form-grid" @submit.prevent="guardar">
      <span class="form-grid__section">Datos</span>
      <label class="form-grid__field">
        <span class="field-label">Nombre</span>
        <q-input
          v-model="form.name"
          dense
          outlined
          autofocus
          placeholder="Ej. Lucía"
          lazy-rules
          hide-bottom-space
          :rules="nameRules"
        />
      </label>
      <label class="form-grid__field">
        <span class="field-label">Apellidos</span>
        <q-input
          v-model="form.lastName"
          dense
          outlined
          placeholder="Ej. Ortega Ramos"
          hide-bottom-space
        />
      </label>
      <label class="form-grid__field form-grid__field--full">
        <span class="field-label">Teléfono</span>
        <q-input
          v-model="form.phone"
          dense
          outlined
          placeholder="Ej. 5512345678"
          hide-bottom-space
        />
      </label>
      <label class="form-grid__field form-grid__field--full">
        <span class="field-label">Email</span>
        <q-input
          v-model="form.email"
          dense
          outlined
          type="email"
          autocomplete="off"
          placeholder="nombre@woowkids.mx"
          lazy-rules
          hide-bottom-space
          :rules="emailRules"
        />
      </label>
      <label class="form-grid__field">
        <span class="field-label">{{ userId ? 'Nueva contraseña (opcional)' : 'Contraseña' }}</span>
        <q-input
          v-model="form.password"
          dense
          outlined
          :type="verPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="Mínimo 8 caracteres"
          lazy-rules
          hide-bottom-space
          :rules="passwordRules"
        >
          <template #append>
            <q-icon
              :name="verPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              size="19px"
              @click="verPassword = !verPassword"
            />
          </template>
        </q-input>
      </label>
      <label class="form-grid__field">
        <span class="field-label">Confirmar contraseña</span>
        <q-input
          v-model="form.confirmPassword"
          dense
          outlined
          :type="verPassword ? 'text' : 'password'"
          autocomplete="new-password"
          lazy-rules
          hide-bottom-space
          :rules="confirmRules"
        />
      </label>
      <label class="form-grid__field form-grid__field--full">
        <span class="field-label">PIN de caja (opcional)</span>
        <q-input
          v-model="form.pin"
          dense
          outlined
          maxlength="4"
          inputmode="numeric"
          autocomplete="off"
          :placeholder="userId ? 'Sin cambios' : '4 dígitos'"
          lazy-rules
          hide-bottom-space
          :rules="pinRules"
        />
      </label>

      <span class="form-grid__section">Acceso</span>
      <label class="form-grid__field" :class="{ 'form-grid__field--full': !showBranchSelector }">
        <span class="field-label">Rol</span>
        <q-select
          v-model="form.role"
          dense
          outlined
          emit-value
          map-options
          :options="roleOptions"
          placeholder="Selecciona un rol"
          lazy-rules
          hide-bottom-space
          :rules="roleRules"
          @update:model-value="form.branchId = null"
        />
      </label>
      <label v-if="showBranchSelector" class="form-grid__field">
        <span class="field-label">Sucursal</span>
        <q-select
          v-model="form.branchId"
          dense
          outlined
          emit-value
          map-options
          :options="branchOptions"
          placeholder="Selecciona una sucursal"
          lazy-rules
          hide-bottom-space
          :rules="branchRules"
          :hint="branchOptions.length === 0 ? 'No hay sucursales activas.' : undefined"
        />
      </label>
      <label v-if="userId" class="form-grid__field">
        <span class="field-label">Cuenta activa</span>
        <q-toggle v-model="form.isActive" color="primary" />
      </label>
      <label v-if="userId" class="form-grid__field">
        <span class="field-label">Último acceso</span>
        <span class="cell-muted">{{ ultimoAcceso }}</span>
      </label>
    </q-form>

    <template v-if="userId && !cargando" #footer-extra>
      <q-btn
        flat
        color="negative"
        icon="person_remove"
        label="Eliminar usuario"
        @click="emit('eliminar')"
      />
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Notify, type QForm } from 'quasar'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { userService } from '@/services/userService'
import { useAuthStore } from '@/stores/auth'
import { useRolesStore } from '@/stores/roles'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError, UserRole } from '@/types/auth'
import type { Branch } from '@/types/branch'

const props = defineProps<{ userId: string | null; branches: Branch[] }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'eliminar'): void }>()
const show = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const rolesStore = useRolesStore()

const formRef = ref<QForm | null>(null)
const cargando = ref(false)
const guardando = ref(false)
const verPassword = ref(false)
const ultimoAccesoRaw = ref<string | null>(null)
const ultimoAcceso = computed(() =>
  ultimoAccesoRaw.value
    ? new Date(ultimoAccesoRaw.value).toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Nunca',
)
const form = reactive({
  name: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  pin: '',
  role: null as UserRole | null,
  branchId: null as string | null,
  isActive: true,
})

// Un Administrador de sucursal solo da de alta/edita roles operativos
// (requiere_sucursal) y siempre en su propia sucursal.
const isBranchAdmin = computed(() => authStore.hasRole('Administrador'))

// El catálogo de roles es dinámico (ver stores/roles.ts / página Roles).
const roleOptions = computed(() =>
  rolesStore.roles
    .filter((r) => r.activo && (!isBranchAdmin.value || r.requiere_sucursal))
    .map((r) => ({ label: r.nombre, value: r.nombre })),
)
const branchOptions = computed(() =>
  props.branches.filter((b) => b.isActive).map((b) => ({ label: b.nombre, value: b.id })),
)

// Solo los roles operativos usan una sucursal fija; un Administrador se
// asigna a sucursales desde el formulario de sucursal.
const requiresBranch = computed(
  () => rolesStore.roles.find((r) => r.nombre === form.role)?.requiere_sucursal ?? false,
)
const showBranchSelector = computed(() => requiresBranch.value && !isBranchAdmin.value)

const nameRules = [(v: string) => !!v.trim() || 'El nombre es requerido']
const emailRules = [
  (v: string) => !!v || 'El correo es requerido',
  (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Ingresa un correo válido',
]
const passwordRules = [
  (v: string) => !!props.userId || !!v || 'La contraseña es requerida',
  (v: string) => !v || v.length >= 8 || 'Mínimo 8 caracteres',
]
const confirmRules = [(v: string) => v === form.password || 'Las contraseñas no coinciden']
const pinRules = [(v: string) => !v || /^\d{4}$/.test(v) || 'El PIN debe tener 4 dígitos']
const roleRules = [(v: UserRole | null) => !!v || 'Selecciona un rol']
const branchRules = [
  (v: string | null) => !requiresBranch.value || !!v || 'La sucursal es requerida para este rol',
]

// Se observa también userId y se ejecuta al montar: los accesos directos
// (/usuarios/nuevo, /usuarios/:id/editar) abren el diálogo de inicio.
watch(
  () => [show.value, props.userId] as const,
  ([abierto]) => {
    if (abierto) void cargar()
  },
  { immediate: true },
)

async function cargar() {
  Object.assign(form, {
    name: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    pin: '',
    role: null,
    branchId: null,
    isActive: true,
  })
  verPassword.value = false
  ultimoAccesoRaw.value = null
  const solicitado = props.userId
  const obsoleto = () => props.userId !== solicitado || !show.value
  cargando.value = true
  try {
    const [user] = await Promise.all([
      props.userId ? userService.getUser(props.userId) : Promise.resolve(null),
      rolesStore.roles.length === 0 ? rolesStore.cargar() : Promise.resolve(),
    ])
    if (obsoleto()) return
    if (user) {
      Object.assign(form, {
        name: user.name,
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        isActive: user.isActive,
      })
      ultimoAccesoRaw.value = user.lastAccess
    }
  } catch {
    if (obsoleto()) return
    Notify.create({ type: 'negative', message: 'No se pudo cargar el usuario.' })
    show.value = false
  } finally {
    if (!obsoleto()) cargando.value = false
  }
}

async function guardar() {
  const valid = await formRef.value?.validate()
  if (!valid) return
  const branchId = requiresBranch.value
    ? isBranchAdmin.value
      ? authStore.currentBranchId
      : form.branchId
    : null
  guardando.value = true
  try {
    if (props.userId) {
      await userService.updateUser(props.userId, {
        name: form.name.trim(),
        lastName: form.lastName.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim(),
        role: form.role!,
        branchId,
        password: form.password || null,
        isActive: form.isActive,
        pin: form.pin || null,
      })
      Notify.create({ type: 'positive', message: 'Usuario actualizado correctamente.' })
    } else {
      await userService.createUser({
        name: form.name.trim(),
        lastName: form.lastName.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim(),
        password: form.password,
        role: form.role!,
        branchId,
        pin: form.pin || null,
      })
      Notify.create({ type: 'positive', message: 'Usuario registrado correctamente.' })
    }
    show.value = false
    emit('saved')
  } catch (err) {
    Notify.create({ type: 'negative', message: resolveErrorMessage(err as ApiError) })
  } finally {
    guardando.value = false
  }
}
</script>
