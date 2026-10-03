<script setup lang="ts">
import { computed } from 'vue'
import type { DialogTone } from '@/types/ui'

/**
 * Diálogo del diseño: encabezado con ícono tonal, título y subtítulo; cuerpo
 * libre (slot) y pie con acción secundaria + primaria.
 */
const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    icon?: string
    tone?: DialogTone
    width?: number
    primaryLabel?: string
    secondaryLabel?: string
    /** Acción primaria destructiva (botón rojo). */
    danger?: boolean
    loading?: boolean
    primaryDisabled?: boolean
    hideFooter?: boolean
    persistent?: boolean
  }>(),
  {
    subtitle: undefined,
    icon: 'edit',
    tone: 'blue',
    width: 560,
    primaryLabel: 'Guardar',
    secondaryLabel: 'Cancelar',
    danger: false,
    loading: false,
    primaryDisabled: false,
    hideFooter: false,
    persistent: false,
  },
)

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const cardStyle = computed(() => ({ width: `${props.width}px`, maxWidth: '96vw' }))

function cancel(): void {
  emit('cancel')
  open.value = false
}
</script>

<template>
  <q-dialog v-model="open" :persistent="persistent || loading" @escape-key="emit('cancel')">
    <q-card class="base-dialog" :style="cardStyle">
      <header class="base-dialog__head">
        <span class="base-dialog__icon" :class="`base-dialog__icon--${tone}`">
          <q-icon :name="icon" size="22px" />
        </span>
        <div class="base-dialog__titles">
          <span class="base-dialog__title">{{ title }}</span>
          <span v-if="subtitle" class="base-dialog__subtitle">{{ subtitle }}</span>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          class="base-dialog__close"
          aria-label="Cerrar"
          :disable="loading"
          @click="cancel"
        />
      </header>

      <div class="base-dialog__body">
        <slot />
      </div>

      <footer v-if="!hideFooter" class="base-dialog__foot">
        <div class="base-dialog__foot-extra"><slot name="footer-extra" /></div>
        <slot name="footer">
          <q-btn outline :label="secondaryLabel" :disable="loading" @click="cancel" />
          <q-btn
            unelevated
            :color="danger ? 'negative' : 'primary'"
            :label="primaryLabel"
            :loading="loading"
            :disable="primaryDisabled"
            class="base-dialog__primary"
            @click="emit('confirm')"
          />
        </slot>
      </footer>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.base-dialog {
  display: flex;
  flex-direction: column;
  max-height: 92vh;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 22px 24px 18px;
    border-bottom: 1px solid var(--border-soft);
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &--blue {
      background: var(--tone-info-bg);
      color: var(--q-primary);
    }
    &--red {
      background: var(--tone-bad-bg);
      color: var(--tone-bad-fg);
    }
    &--green {
      background: var(--tone-ok-bg);
      color: var(--tone-ok-fg);
    }
    &--amber {
      background: var(--tone-warn-bg);
      color: var(--tone-warn-fg);
    }
    &--pink {
      background: var(--tone-pink-bg);
      color: #c40f47;
    }
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--text-strong);
  }

  &__subtitle {
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__close {
    color: var(--text-secondary);
    margin: -4px -6px 0 0;
  }

  &__body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-body);
  }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid var(--border-soft);
    background: var(--bg-subtle);
  }

  &__foot-extra {
    margin-right: auto;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--tone-bad-fg);
  }

  &__foot :deep(.q-btn) {
    min-height: 42px;
  }

  &__primary {
    font-weight: 800;
    padding: 0 18px;
  }
}
</style>
