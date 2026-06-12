<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { userService } from '@/services/userService'
import type { UserRole } from '@/types/auth'

const $q = useQuasar()
const router = useRouter()

const loading = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  roles: [] as UserRole[],
})

const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'Administrador Sistema', value: 'AdministradorSistema' },
  { label: 'Administrador', value: 'Administrador' },
  { label: 'Cajero', value: 'Cajero' },
  { label: 'Cocina', value: 'Cocina' },
]

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
const rolesRules = [(v: UserRole[]) => v.length > 0 || 'Selecciona al menos un rol']

async function handleSubmit(): Promise<void> {
  loading.value = true
  try {
    await userService.createUser({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      roles: form.roles,
    })
    $q.notify({ type: 'positive', message: 'Usuario registrado correctamente.' })
    router.push({ name: 'sysadmin-users' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo registrar el usuario. Verifica los datos.' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <q-page padding>
    <div class="flex items-center q-mb-lg q-gutter-sm">
      <q-btn flat round dense icon="arrow_back" @click="router.push({ name: 'sysadmin-users' })" />
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
            v-model="form.roles"
            :options="roleOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            multiple
            label="Roles"
            outlined
            :rules="rolesRules"
            lazy-rules
          >
            <template #selected-item="{ opt }">
              <q-chip dense color="primary" text-color="white" class="q-mr-xs">
                {{ opt.label }}
              </q-chip>
            </template>
          </q-select>

          <div class="row justify-end q-gutter-sm q-mt-md">
            <q-btn
              flat
              label="Cancelar"
              :disable="loading"
              @click="router.push({ name: 'sysadmin-users' })"
            />
            <q-btn type="submit" color="primary" label="Registrar" :loading="loading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>
