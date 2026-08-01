<template>
  <!--
    Overlay de bloqueo visual de la terminal.
    Se renderiza sobre el contenido principal cuando la fase es
    ESPERANDO_REVISION, en el caso borde de que el modal de autenticación del
    administrador no esté abierto todavía (ej. el cajero recargó la página).
    No se "envía" nada a ningún lado — el conteo queda congelado en la BD y el
    siguiente paso es que un administrador inicie sesión en ESTE MISMO equipo
    para revisar el balance. Previene ediciones accidentales mientras tanto.
  -->
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div v-if="visible" class="bloqueo-overlay" role="status" aria-live="polite">
        <div class="bloqueo-card">
          <q-icon name="lock_clock" color="primary" size="56px" class="q-mb-md" />

          <div class="bloqueo-titulo">Terminal en espera</div>

          <div class="bloqueo-mensaje">
            El conteo quedó registrado.<br />
            Un administrador debe iniciar sesión en este equipo para revisar el balance.
          </div>

          <!-- Spinner de espera -->
          <q-spinner-dots color="primary" size="40px" class="q-mt-lg" />

          <!-- Botón de cancelar solo si se permite (estado aún no confirmado) -->
          <q-btn
            v-if="permitirCancelar"
            flat
            no-caps
            dense
            class="q-mt-xl cancelar-btn"
            label="Cancelar y corregir conteo"
            icon="undo"
            @click="$emit('cancelar')"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  /** Controla si el overlay se muestra */
  visible: boolean
  /** Si true, muestra el botón para cancelar el conteo */
  permitirCancelar?: boolean
}>()

defineEmits<{
  (e: 'cancelar'): void
}>()
</script>

<style scoped>
.bloqueo-overlay {
  position: fixed;
  inset: 0;
  z-index: 8000;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bloqueo-card {
  background: var(--md-surface);
  border-radius: 24px;
  padding: 48px 40px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.25),
    0 2px 8px rgba(0, 0, 0, 0.1);
}

.bloqueo-titulo {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--md-on-surface);
  margin-bottom: 12px;
}

.bloqueo-mensaje {
  font-size: 0.95rem;
  color: var(--md-on-surface-variant);
  line-height: 1.6;
}

.cancelar-btn {
  color: var(--md-on-surface-variant);
  font-size: 0.8rem;
}

/* Transición de entrada/salida del overlay */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
