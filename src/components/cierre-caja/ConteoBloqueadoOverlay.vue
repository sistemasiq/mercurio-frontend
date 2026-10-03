<template>
  <!--
    Overlay de bloqueo de la terminal mientras el turno está en
    ESPERANDO_REVISION y el modal del administrador no está abierto (p. ej. el
    cajero recargó la página). El conteo ya quedó congelado en la BD; el
    siguiente paso es que un administrador inicie sesión en ESTE equipo.
  -->
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div v-if="visible" class="espera" role="status" aria-live="polite">
        <div class="espera__card">
          <span class="espera__icon"><q-icon name="lock_clock" size="30px" /></span>
          <h2 class="espera__title">Terminal en espera</h2>
          <p class="espera__text">
            El conteo quedó registrado. Un administrador debe iniciar sesión en este equipo para
            revisar el balance.
          </p>
          <div class="espera__dots" aria-hidden="true"><span /><span /><span /></div>
          <dl v-if="cajero" class="espera__meta">
            <div>
              <dt>Cajero</dt>
              <dd>{{ cajero }}</dd>
            </div>
          </dl>
          <q-btn
            unelevated
            color="primary"
            label="Iniciar sesión como administrador"
            class="espera__cta"
            @click="$emit('autenticar')"
          />
          <button
            v-if="permitirCancelar"
            type="button"
            class="espera__cancel"
            @click="$emit('cancelar')"
          >
            <q-icon name="undo" size="17px" />Cancelar y corregir conteo
          </button>
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
  cajero?: string
}>()

defineEmits<{
  (e: 'cancelar'): void
  (e: 'autenticar'): void
}>()
</script>

<style scoped lang="scss">
.espera {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(11, 20, 80, 0.45);
  backdrop-filter: blur(2px);

  &__card {
    width: 512px;
    max-width: 100%;
    background: #fff;
    border-radius: 20px;
    box-shadow: var(--shadow-dialog);
    padding: 40px 36px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    text-align: center;
  }

  &__icon {
    width: 64px;
    height: 64px;
    border-radius: 32px;
    background: var(--tone-info-bg);
    color: var(--q-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    margin: 0;
    font-size: 22px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__text {
    margin: 0;
    font-size: 14.5px;
    line-height: 1.55;
    color: #475569;
  }

  &__dots {
    display: flex;
    gap: 8px;

    span {
      width: 8px;
      height: 8px;
      border-radius: 4px;
      background: var(--q-primary);
      animation: espera-pulse 1.2s infinite ease-in-out;

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }

  &__meta {
    width: 100%;
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--bg-subtle);

    div {
      display: flex;
      justify-content: space-between;
      font-size: 13.5px;
    }

    dt {
      color: var(--text-secondary);
    }

    dd {
      margin: 0;
      font-weight: 700;
      color: var(--text-primary);
    }
  }

  &__cta {
    width: 100%;
    min-height: 48px;
    font-weight: 800;
  }

  &__cancel {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--text-strong);
    }
  }
}

@keyframes espera-pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
