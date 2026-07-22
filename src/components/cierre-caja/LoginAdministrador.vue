<template>
  <q-dialog
    v-model="turnoCajaStore.mostrarDialogAdmin"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="admin-dialog-card">
      <!-- Cabecera -->
      <q-card-section class="dialog-header row items-center q-pb-none">
        <q-icon name="admin_panel_settings" color="primary" size="28px" class="q-mr-sm" />
        <div class="text-h6 text-weight-semibold">Acceso de Administrador</div>
        <q-space />
        <q-btn
          icon="close"
          flat
          round
          dense
          :disable="turnoCajaStore.adminAuth.cargando"
          @click="turnoCajaStore.cancelarAutenticacion()"
        />
      </q-card-section>

      <q-card-section class="q-pt-sm text-body2 text-on-surface-variant">
        Para revelar el balance del turno, un administrador debe autenticarse.
      </q-card-section>

      <!-- Formulario -->
      <q-card-section class="q-col-gutter-sm">
        <q-input
          v-model="usuario"
          outlined
          label="Usuario administrador"
          prepend-icon="person"
          :disable="turnoCajaStore.adminAuth.cargando"
          class="q-mb-sm"
        >
          <template #prepend>
            <q-icon name="person" />
          </template>
        </q-input>

        <q-input
          v-model="pin"
          outlined
          type="password"
          label="PIN / Contraseña"
          :disable="turnoCajaStore.adminAuth.cargando"
          @keyup.enter="intentarAutenticar"
        >
          <template #prepend>
            <q-icon name="lock" />
          </template>
        </q-input>

        <!-- Mensaje de error -->
        <div v-if="turnoCajaStore.adminAuth.error" class="auth-error q-mt-sm">
          <q-icon name="error_outline" size="16px" />
          {{ turnoCajaStore.adminAuth.error }}
        </div>
      </q-card-section>

      <!-- Acciones -->
      <q-card-actions align="right" class="q-px-md q-pb-md q-pt-none">
        <q-btn
          flat
          no-caps
          label="Cancelar"
          :disable="turnoCajaStore.adminAuth.cargando"
          @click="turnoCajaStore.cancelarAutenticacion()"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Autenticar"
          icon-right="verified_user"
          :loading="turnoCajaStore.adminAuth.cargando"
          :disable="!usuario || !pin"
          @click="intentarAutenticar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTurnoCajaStore } from '@/stores/turnoCajaStore'

const turnoCajaStore = useTurnoCajaStore()

const usuario = ref('')
const pin = ref('')

async function intentarAutenticar() {
  if (!usuario.value || !pin.value) return
  await turnoCajaStore.autenticarAdmin({ usuario: usuario.value, pin: pin.value })
  // Limpia el PIN siempre; limpia usuario solo si el intento falló
  pin.value = ''
  if (!turnoCajaStore.adminAuth.autorizado) {
    usuario.value = ''
  }
}
</script>

<style scoped>
.admin-dialog-card {
  width: 400px;
  max-width: 95vw;
  border-radius: 20px;
}
.dialog-header {
  border-bottom: 1px solid var(--md-outline-variant);
  padding-bottom: 12px;
}
.auth-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--md-error, #b00020);
  font-size: 0.85rem;
}
</style>
