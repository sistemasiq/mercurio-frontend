<script setup lang="ts">
import { ref } from 'vue'
import type { QForm } from 'quasar'
import { useAuthForm } from '@/composables/useAuthForm'
import BaseDialog from '@/components/ui/BaseDialog.vue'

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

// Con pocas sucursales el diseño las ofrece como chips de selección rápida.
const MAX_CHIPS_SUCURSAL = 4

function onCancelSucursal(): void {
  sucursalSeleccionada.value = null
  cancelBranchSelection()
}
</script>

<template>
  <q-page class="auth-page">
    <aside class="auth-brand">
      <div class="auth-brand__head">
        <img src="/woow-kids-mascot.png" alt="" class="auth-brand__mascot" aria-hidden="true" />
        <span class="auth-brand__name">Woow Kids</span>
      </div>
      <div class="auth-brand__art">
        <img src="/woow-kids-logo.png" alt="" aria-hidden="true" />
      </div>
      <p class="auth-brand__tagline">
        Caja, estancias, eventos e inventario de tu sucursal en un solo lugar.
      </p>
    </aside>

    <section class="auth-panel">
      <main class="auth-main">
        <header class="auth-head">
          <h1 class="auth-title">Bienvenido</h1>
          <p class="auth-subtitle">Ingresa con tu cuenta de Woow Kids.</p>
        </header>

        <q-form ref="formRef" class="auth-form" greedy @submit.prevent="onSubmit">
          <div class="auth-field">
            <label class="auth-label" for="login-email">Correo electrónico</label>
            <q-input
              v-model="credentials.email"
              for="login-email"
              type="text"
              inputmode="email"
              outlined
              placeholder="usuario@woowkids.mx"
              autocomplete="username"
              :rules="emailRules"
              lazy-rules
              :disable="isLoading()"
              no-error-icon
              hide-bottom-space
              class="auth-input"
            >
              <template #prepend>
                <q-icon name="mail" size="20px" />
              </template>
            </q-input>
          </div>

          <div class="auth-field">
            <label class="auth-label" for="login-password">Contraseña</label>
            <q-input
              v-model="credentials.password"
              for="login-password"
              :type="showPassword ? 'text' : 'password'"
              outlined
              placeholder="••••••••"
              autocomplete="current-password"
              :rules="passwordRules"
              lazy-rules
              :disable="isLoading()"
              no-error-icon
              hide-bottom-space
              class="auth-input"
            >
              <template #prepend>
                <q-icon name="lock" size="20px" />
              </template>
              <template #append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  size="20px"
                  class="cursor-pointer"
                  role="button"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
          </div>

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

          <q-btn
            type="submit"
            label="Acceder al Sistema"
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

      <footer class="auth-footer">© 2026 Woow Kids.</footer>
    </section>

    <BaseDialog
      :model-value="pendingBranchSelection() !== null"
      title="Elige una sucursal"
      subtitle="Tu cuenta tiene acceso a varias sucursales"
      icon="store"
      :width="480"
      secondary-label="Salir"
      primary-label="Continuar"
      persistent
      :loading="isLoading()"
      :primary-disabled="!sucursalSeleccionada"
      @cancel="onCancelSucursal"
      @confirm="onConfirmSucursal"
    >
      <div
        v-if="(pendingBranchSelection()?.length ?? 0) <= MAX_CHIPS_SUCURSAL"
        class="branch-chips"
        role="radiogroup"
      >
        <button
          v-for="s in pendingBranchSelection() ?? []"
          :key="s.id"
          type="button"
          role="radio"
          class="branch-chip"
          :class="{ 'branch-chip--on': sucursalSeleccionada === s.id }"
          :aria-checked="sucursalSeleccionada === s.id"
          @click="sucursalSeleccionada = s.id"
        >
          {{ s.nombre }}
        </button>
      </div>
      <div class="auth-field">
        <span class="field-label">Sucursal</span>
        <q-select
          v-model="sucursalSeleccionada"
          outlined
          dense
          :options="pendingBranchSelection() ?? []"
          option-value="id"
          option-label="nombre"
          emit-value
          map-options
          placeholder="Selecciona una sucursal"
        />
      </div>
    </BaseDialog>
  </q-page>
</template>

<style scoped lang="scss">
.auth-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  height: 100% !important;
  min-height: 0 !important;
  max-height: 100vh;
  overflow: hidden;
  padding: 0 !important;
  background: #fff;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

// ── Panel de marca ──────────────────────────────────────────────────────────
.auth-brand {
  background: var(--text-strong);
  color: #fff;
  padding: 56px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;

  @media (max-width: 900px) {
    display: none;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__mascot {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    object-fit: cover;
  }

  &__name {
    font-size: 20px;
    font-weight: 800;
  }

  &__art {
    flex: 1;
    min-height: 0;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__tagline {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: #c9d0f2;
  }
}

// ── Panel del formulario ────────────────────────────────────────────────────
.auth-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.auth-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 56px 0;

  @media (max-width: 480px) {
    padding: 32px 16px;
  }
}

.auth-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 24px;
}

.auth-title {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-strong);
}

.auth-subtitle {
  margin: 0;
  font-size: 14.5px;
  color: var(--text-secondary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-body);
}

.auth-input {
  :deep(.q-field__control) {
    height: 48px;
    border-radius: 12px;
  }

  :deep(.q-field__marginal) {
    height: 48px;
    color: var(--text-secondary);
  }

  :deep(.q-field__native) {
    font-size: 14.5px;
  }
}

.auth-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.auth-remember :deep(.q-checkbox__label) {
  font-size: 13.5px;
  color: var(--text-body);
}

.auth-forgot {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--q-primary);
  text-decoration: none;

  &:hover {
    color: var(--text-strong);
    text-decoration: underline;
  }
}

.auth-submit {
  height: 52px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
}

.auth-footer {
  flex-shrink: 0;
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

// ── Diálogo de sucursal ─────────────────────────────────────────────────────
.branch-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.branch-chip {
  height: 34px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid var(--border-input);
  background: #fff;
  color: var(--text-body);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &--on {
    background: var(--tone-info-bg);
    border-color: var(--q-primary);
    color: var(--q-primary);
  }
}
</style>
