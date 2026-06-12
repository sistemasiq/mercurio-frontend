<script setup lang="ts">
import { ref } from 'vue'
import type { QForm } from 'quasar'
import { useAuthForm } from '@/composables/useAuthForm'

const formRef = ref<InstanceType<typeof QForm> | null>(null)

const {
  credentials,
  showPassword,
  branchOptions,
  branchesLoading,
  emailRules,
  passwordRules,
  isLoading,
  handleLogin,
} = useAuthForm()

async function onSubmit(): Promise<void> {
  const valid = await formRef.value?.validate()
  if (!valid) return
  await handleLogin()
}
</script>

<template>
  <q-page class="auth-page">
    <aside class="auth-left">
      <img src="/screen-login.png" alt="" class="auth-left__illustration" aria-hidden="true" />
    </aside>

    <section class="auth-right">
      <!-- Header del panel -->
      <header class="auth-header">
        <div class="auth-brand">
          <q-icon name="apps" color="primary" size="20px" />
          <span class="auth-brand__text">TEC-FS</span>
        </div>
        <div class="auth-header__icons">
          <q-btn flat round dense icon="language" color="grey-6" size="sm" />
          <q-btn flat round dense icon="help_outline" color="grey-6" size="sm" />
        </div>
      </header>

      <!-- Contenido principal centrado -->
      <main class="auth-main">
        <h1 class="auth-title">Bienvenido de nuevo</h1>
        <p class="auth-subtitle">Ingrese sus credenciales corporativas para continuar.</p>

        <q-form ref="formRef" class="auth-form" greedy @submit.prevent="onSubmit">
          <!-- Sucursal -->
          <div class="field-wrap">
            <label class="field-label">Sucursal</label>
            <q-select
              v-model="credentials.sucursalId"
              :options="branchOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
              placeholder="Selecciona tu sucursal"
              :loading="branchesLoading"
              :disable="isLoading()"
              no-error-icon
              class="field-input"
              clearable
            >
              <template #prepend>
                <q-icon name="store" color="grey-5" size="16px" />
              </template>
            </q-select>
          </div>

          <!-- Usuario / Email -->
          <div class="field-wrap">
            <label class="field-label">Usuario o Correo Electrónico</label>
            <q-input
              v-model="credentials.email"
              type="text"
              inputmode="email"
              outlined
              dense
              placeholder="usuario@kinetic.com"
              autocomplete="username"
              :rules="emailRules"
              lazy-rules
              :disable="isLoading()"
              no-error-icon
              class="field-input"
            >
              <template #prepend>
                <q-icon name="person_outline" color="grey-5" size="16px" />
              </template>
            </q-input>
          </div>

          <!-- Contraseña -->
          <div class="field-wrap">
            <label class="field-label">Contraseña</label>
            <q-input
              v-model="credentials.password"
              :type="showPassword ? 'text' : 'password'"
              outlined
              dense
              placeholder="••••••••"
              autocomplete="current-password"
              :rules="passwordRules"
              lazy-rules
              :disable="isLoading()"
              no-error-icon
              class="field-input"
            >
              <template #prepend>
                <q-icon name="lock_outline" color="grey-5" size="16px" />
              </template>
              <template #append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  color="grey-5"
                  size="16px"
                  class="cursor-pointer"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
          </div>

          <!-- Opciones -->
          <div class="auth-options">
            <q-checkbox
              v-model="credentials.rememberMe"
              label="Recordar sesión"
              dense
              color="primary"
              class="auth-remember"
            />
            <a href="#" class="auth-forgot" @click.prevent>¿Olvidaste tu contraseña?</a>
          </div>

          <!-- Botón de envío -->
          <q-btn
            type="submit"
            label="Acceder al Sistema"
            icon-right="arrow_forward"
            color="primary"
            class="auth-submit full-width"
            unelevated
            :loading="isLoading()"
            :disable="isLoading()"
          >
            <template #loading>
              <q-spinner-dots color="white" size="24px" />
            </template>
          </q-btn>
        </q-form>
      </main>

      <!-- Footer -->
      <footer class="auth-footer">
        <span class="auth-footer__copy">© 2026 TecNM La Piedad - Fabrica de software.</span>
        <div class="auth-footer__links">
          <a href="#" class="auth-footer__link" @click.prevent>Soporte Técnico</a>
          <span class="auth-footer__sep">·</span>
          <a href="#" class="auth-footer__link auth-footer__lang active" @click.prevent>ES</a>
          <a href="#" class="auth-footer__link auth-footer__lang" @click.prevent>EN</a>
        </div>
      </footer>
    </section>
  </q-page>
</template>

<style scoped>
/* ── Página raíz ──────────────────────────────────────────── */
.auth-page {
  display: flex;
  flex-direction: row;
  /* Ocupa exactamente el alto disponible sin desbordarse */
  height: 100% !important;
  min-height: 0 !important;
  max-height: 100vh;
  overflow: hidden;
  padding: 0 !important;
}

/* ── Panel izquierdo ─────────────────────────────────────── */
.auth-left {
  flex: 0 0 56%;
  overflow: hidden;
}

.auth-left__illustration {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

/* ── Panel derecho ───────────────────────────────────────── */
.auth-right {
  flex: 1;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────── */
.auth-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 32px;
  border-bottom: 1px solid #f1f5f9;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-brand__text {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.auth-header__icons {
  display: flex;
  gap: 4px;
}

/* ── Contenido central ───────────────────────────────────── */
.auth-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px 48px;
  max-width: 460px;
  width: 100%;
  margin: 0 auto;
}

.auth-title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  line-height: 1.2;
}

.auth-subtitle {
  font-size: 13.5px;
  color: #64748b;
  margin: 0 0 20px;
}

/* ── Formulario ──────────────────────────────────────────── */
.auth-form {
  display: flex;
  flex-direction: column;
}

.field-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}

.field-label {
  font-size: 12.5px;
  font-weight: 500;
  color: #374151;
  margin: 0;
  cursor: default;
}

/* Quasar overrides — bordes más sutiles */
.field-input :deep(.q-field__control) {
  border-radius: 8px;
}

.field-input :deep(.q-field--outlined .q-field__control::before) {
  border-color: #e2e8f0;
}

.field-input :deep(.q-field--outlined:hover .q-field__control::before) {
  border-color: #94a3b8;
}

.field-input :deep(.q-field--focused .q-field__control::before) {
  border-color: #3b82f6 !important;
}

/* ── Opciones (recordar / olvidaste) ─────────────────────── */
.auth-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  margin-bottom: 16px;
}

.auth-remember :deep(.q-checkbox__label) {
  font-size: 13px;
  color: #475569;
}

.auth-forgot {
  font-size: 13px;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}

.auth-forgot:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

/* ── Botón de envío ──────────────────────────────────────── */
.auth-submit {
  border-radius: 8px;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  height: 44px;
}

/* ── Footer ─────────────────────────────────────────────── */
.auth-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 32px;
  border-top: 1px solid #f1f5f9;
}

.auth-footer__copy {
  font-size: 12px;
  color: #94a3b8;
}

.auth-footer__links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-footer__link {
  font-size: 12px;
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.15s;
}

.auth-footer__link:hover {
  color: #64748b;
}

.auth-footer__sep {
  color: #cbd5e1;
  font-size: 12px;
}

.auth-footer__lang {
  font-weight: 500;
}

.auth-footer__lang.active {
  color: #1e293b;
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .auth-left {
    display: none;
  }

  .auth-main {
    padding: 24px;
    max-width: 100%;
  }

  .auth-header {
    padding: 14px 24px;
  }

  .auth-footer {
    padding: 12px 24px;
    flex-direction: column;
    gap: 6px;
    text-align: center;
  }
}
</style>
