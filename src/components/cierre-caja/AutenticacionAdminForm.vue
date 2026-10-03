<template>
  <BaseDialog
    v-model="turno.mostrarDialogAdmin"
    title="Autorización de administrador"
    subtitle="Se requiere para revisar el balance y cerrar el turno"
    icon="admin_panel_settings"
    :width="460"
    persistent
    primary-label="Autorizar"
    :loading="turno.credencialesAdmin.cargando"
    :primary-disabled="!turno.credencialesAdmin.email || !turno.credencialesAdmin.password"
    @cancel="turno.cancelarConteo()"
    @confirm="intentarAutenticar"
  >
    <div class="admin-form">
      <label class="admin-form__field">
        <span class="field-label">Administrador</span>
        <q-input
          v-model="turno.credencialesAdmin.email"
          type="email"
          outlined
          dense
          placeholder="correo@woowkids.mx"
          autocomplete="username"
          autofocus
          :disable="turno.credencialesAdmin.cargando"
          @update:model-value="turno.credencialesAdmin.error = ''"
          @keyup.enter="intentarAutenticar"
        />
      </label>
      <label class="admin-form__field">
        <span class="field-label">Contraseña</span>
        <q-input
          v-model="turno.credencialesAdmin.password"
          type="password"
          outlined
          dense
          placeholder="••••••••"
          autocomplete="current-password"
          :disable="turno.credencialesAdmin.cargando"
          @update:model-value="turno.credencialesAdmin.error = ''"
          @keyup.enter="intentarAutenticar"
        />
      </label>
      <div v-if="turno.credencialesAdmin.error" class="admin-form__error" role="alert">
        <q-icon name="error" size="19px" />{{ turno.credencialesAdmin.error }}
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'

const $q = useQuasar()
const turno = useTurnoCajaStore()

onMounted(() => {
  turno.credencialesAdmin.email = ''
  turno.credencialesAdmin.password = ''
  turno.credencialesAdmin.error = ''
})

async function intentarAutenticar() {
  const email = turno.credencialesAdmin.email.trim()
  const password = turno.credencialesAdmin.password

  // 1. Validar formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    $q.notify({
      type: 'negative',
      position: 'top',
      icon: 'warning',
      message: 'Ingresa un correo electrónico válido (ejemplo: admin@sucursal.com).',
    })
    return
  }

  // 2. Validar contraseña no vacía
  if (!password) {
    $q.notify({
      type: 'negative',
      position: 'top',
      icon: 'warning',
      message: 'Ingresa la contraseña del administrador.',
    })
    return
  }

  // 3. Ejecutar autenticación con el backend. Si falla, el store deja el mensaje
  // en turno.credencialesAdmin.error y el banner inline del modal lo muestra —
  // no se duplica con un toast.
  await turno.autenticarAdmin()
}
</script>

<style scoped lang="scss">
.admin-form {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__field {
    display: flex;
    flex-direction: column;
  }

  &__error {
    display: flex;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tone-bad-bg);
    color: var(--tone-bad-fg);
    font-size: 13px;
    font-weight: 600;
  }
}
</style>
