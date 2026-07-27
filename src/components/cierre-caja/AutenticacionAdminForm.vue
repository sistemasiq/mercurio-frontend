<template>
  <q-dialog
    v-model="turno.mostrarDialogAdmin"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <div class="rs-dialog">
      <!-- ── Header ── -->
      <div class="rs-dialog-header">
        <span class="rs-dialog-title">Acceso de Administrador</span>
        <button
          type="button"
          class="rs-close-btn"
          :disabled="turno.credencialesAdmin.cargando"
          @click="turno.cancelarDialogAdmin()"
        >
          <q-icon name="close" size="20px" />
        </button>
      </div>

      <!-- ── Formulario ── -->
      <div class="rs-dialog-body">
        <!-- Usuario -->
        <div class="rs-field-group">
          <label class="rs-field-label">Usuario o Email</label>
          <input
            v-model="turno.credencialesAdmin.email"
            type="email"
            class="rs-input"
            :class="{ 'rs-input--focused': emailFocused }"
            placeholder="Ej. admin_01"
            autocomplete="username"
            :disabled="turno.credencialesAdmin.cargando"
            @focus="emailFocused = true"
            @blur="emailFocused = false"
            @input="turno.credencialesAdmin.error = ''"
            @keyup.enter="intentarAutenticar"
          />
        </div>

        <!-- Contraseña -->
        <div class="rs-field-group">
          <label class="rs-field-label">Contraseña</label>
          <input
            v-model="turno.credencialesAdmin.password"
            type="password"
            class="rs-input"
            :class="{ 'rs-input--focused': passFocused }"
            placeholder="••••••••"
            autocomplete="current-password"
            :disabled="turno.credencialesAdmin.cargando"
            @focus="passFocused = true"
            @blur="passFocused = false"
            @input="turno.credencialesAdmin.error = ''"
            @keyup.enter="intentarAutenticar"
          />
        </div>

        <!-- Error de credenciales (Aviso en caja roja dentro del modal) -->
        <q-banner
          v-if="turno.credencialesAdmin.error"
          rounded
          dense
          class="bg-negative text-white q-mt-sm"
        >
          <template #avatar>
            <q-icon name="error" color="white" size="20px" />
          </template>
          <div><strong>Credenciales incorrectas:</strong> {{ turno.credencialesAdmin.error }}</div>
        </q-banner>
      </div>

      <!-- ── Acciones ── -->
      <div class="rs-dialog-footer">
        <button
          type="button"
          class="rs-btn-cancel"
          :disabled="turno.credencialesAdmin.cargando"
          @click="turno.cancelarDialogAdmin()"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rs-btn-login"
          :disabled="
            !turno.credencialesAdmin.email ||
            !turno.credencialesAdmin.password ||
            turno.credencialesAdmin.cargando
          "
          @click="intentarAutenticar"
        >
          <q-spinner-dots
            v-if="turno.credencialesAdmin.cargando"
            size="18px"
            color="white"
            class="q-mr-xs"
          />
          <q-icon v-else name="login" size="18px" color="white" class="q-mr-xs" />
          Ingresar al Panel
        </button>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'

const $q = useQuasar()
const turno = useTurnoCajaStore()

const emailFocused = ref(false)
const passFocused = ref(false)

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

  // 3. Ejecutar autenticación con el backend
  const exito = await turno.autenticarAdmin()

  // 4. Si falla la autenticación, notificar en la parte superior y reiniciar campos
  if (!exito) {
    $q.notify({
      type: 'negative',
      position: 'top',
      icon: 'error',
      message:
        turno.credencialesAdmin.error ||
        'Credenciales incorrectas. Verifique usuario y contraseña.',
    })
  }
}
</script>

<style scoped>
/* ── Dialog card ────────────────────────────────────────────────────── */
.rs-dialog {
  width: 420px;
  max-width: 95vw;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.rs-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #c6c5d4;
  background: #ffffff;
}
.rs-dialog-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #0b1c30;
}
.rs-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #767683;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition:
    color 0.15s ease,
    background 0.15s ease;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
.rs-close-btn:hover {
  color: #0b1c30;
  background: #f8f9ff;
}
.rs-close-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Body ───────────────────────────────────────────────────────────── */
.rs-dialog-body {
  padding: 20px 20px 4px;
  background: #f8f9ff;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Campos ─────────────────────────────────────────────────────────── */
.rs-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rs-field-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: #454652;
}
.rs-input {
  width: 100%;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #c6c5d4;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #0b1c30;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  box-sizing: border-box;
}
.rs-input::placeholder {
  color: #c6c5d4;
}
.rs-input:focus,
.rs-input--focused {
  border-color: #b7131a;
  box-shadow: 0 0 0 2px rgba(183, 19, 26, 0.1);
}
.rs-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Error ──────────────────────────────────────────────────────────── */
.rs-auth-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #ffdad6;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #93000a;
}
.rs-error-icon {
  font-size: 16px;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
  flex-shrink: 0;
}

/* ── Footer ─────────────────────────────────────────────────────────── */
.rs-dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: #ffffff;
  border-top: 1px solid #c6c5d4;
}
.rs-btn-cancel {
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #454652;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.rs-btn-cancel:hover {
  background: #f8f9ff;
}
.rs-btn-cancel:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rs-btn-login {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1a237e;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 9px 20px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}
.rs-btn-login:hover:not(:disabled) {
  background: #000666;
}
.rs-btn-login:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.rs-btn-icon {
  font-size: 18px;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}

/* ── Modo Test ──────────────────────────────────────────────────────── */
.rs-dev-separator {
  height: 1px;
  background: rgba(245, 147, 0, 0.3);
}
.rs-dev-banner {
  background: rgba(245, 147, 0, 0.06);
  padding: 10px 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rs-dev-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #f59300;
}
.rs-dev-icon {
  font-size: 14px;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
.rs-dev-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid rgba(245, 147, 0, 0.4);
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #f59300;
  transition: background 0.15s ease;
}
.rs-dev-btn:hover {
  background: rgba(245, 147, 0, 0.1);
}
.rs-dev-btn-icon {
  font-size: 16px;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
</style>
