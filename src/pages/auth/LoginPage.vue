<script setup lang="ts">
import { ref } from 'vue'
import type { QForm } from 'quasar'
import { useAuthForm } from '@/composables/useAuthForm'

const formRef = ref<InstanceType<typeof QForm> | null>(null)

const {
  credentials,
  showPassword,
  emailRules,
  passwordRules,
  isLoading,
  pendingBranchSelection,
  handleLogin,
  confirmBranchSelection,
  cancelBranchSelection,
} = useAuthForm()

const sucursalSeleccionada = ref<string | null>(null)

async function onSubmit(): Promise<void> {
  const valid = await formRef.value?.validate()
  if (!valid) return
  await handleLogin()
}

async function onConfirmSucursal(): Promise<void> {
  if (!sucursalSeleccionada.value) return
  await confirmBranchSelection(sucursalSeleccionada.value)
}

function onCancelSucursal(): void {
  sucursalSeleccionada.value = null
  cancelBranchSelection()
}
</script>

<template>
  <q-page class="auth-page">
    <aside class="auth-left">
      <img src="/woow-kids-logo.png" alt="" class="auth-left__illustration" aria-hidden="true" />
    </aside>

    <section class="auth-right">
      <!-- Contenido principal centrado -->
      <main class="auth-main">
        <h1 class="auth-title">Bienvenido de nuevo</h1>
        <p class="auth-subtitle">Ingrese sus credenciales corporativas para continuar.</p>

        <q-form ref="formRef" class="auth-form" greedy @submit.prevent="onSubmit">
          <!-- Usuario / Email -->
          <div class="field-wrap">
            <label class="field-label">Usuario o Correo Electrónico</label>
            <q-input
              v-model="credentials.email"
              type="text"
              inputmode="email"
              outlined
              dense
              placeholder="usuario@woowkids.com"
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
        <span class="auth-footer__copy">© 2026 Woow Kids.</span>
      </footer>
    </section>

    <q-dialog :model-value="pendingBranchSelection() !== null" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Elige tu sucursal</div>
          <p class="text-body2 text-grey-7 q-mb-none">
            Tu cuenta tiene acceso a varias sucursales. Elige con cuál quieres trabajar en esta
            sesión.
          </p>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-select
            v-model="sucursalSeleccionada"
            outlined
            dense
            :options="pendingBranchSelection() ?? []"
            option-value="id"
            option-label="nombre"
            emit-value
            map-options
            label="Sucursal"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" :disable="isLoading()" @click="onCancelSucursal" />
          <q-btn
            color="primary"
            label="Continuar"
            :loading="isLoading()"
            :disable="!sucursalSeleccionada"
            @click="onConfirmSucursal"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
  background: #011463;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.auth-left__illustration {
  width: 100%;
  height: 100%;
  object-fit: contain;
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
  justify-content: center;
  padding: 12px 32px;
  border-top: 1px solid #f1f5f9;
}

.auth-footer__copy {
  font-size: 12px;
  color: #94a3b8;
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

  .auth-footer {
    padding: 12px 24px;
  }
}
</style>
