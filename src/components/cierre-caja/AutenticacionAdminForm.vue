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
          @click="turno.cancelarConteo()"
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
          @click="turno.cancelarConteo()"
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

  // 3. Ejecutar autenticación con el backend. Si falla, el store deja el mensaje
  // en turno.credencialesAdmin.error y el banner inline del modal lo muestra —
  // no se duplica con un toast.
  await turno.autenticarAdmin()
}
</script>

<style scoped>
/* ── Dialog card ────────────────────────────────────────────────────── */
.rs-dialog {
  width: 420px;
  max-width: 95vw;
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.rs-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
}
.rs-dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.rs-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.rs-close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-main);
}
.rs-close-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Body ───────────────────────────────────────────────────────────── */
.rs-dialog-body {
  padding: 20px 20px 4px;
  background: var(--bg-main);
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
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}
.rs-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  box-sizing: border-box;
}
.rs-input::placeholder {
  color: var(--text-muted);
}
.rs-input:focus,
.rs-input--focused {
  border-color: #025fe0;
  box-shadow: 0 0 0 2px rgba(2, 95, 224, 0.1);
}
.rs-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Footer ─────────────────────────────────────────────────────────── */
.rs-dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-color);
}
.rs-btn-cancel {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.rs-btn-cancel:hover {
  background: var(--bg-main);
}
.rs-btn-cancel:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rs-btn-login {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #025fe0;
  color: var(--bg-card);
  border: none;
  border-radius: 8px;
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}
.rs-btn-login:hover:not(:disabled) {
  background: #0350c4;
}
.rs-btn-login:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
