<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="motivo">
      <header class="motivo__head">
        <span class="motivo__icon"><q-icon name="block" size="22px" /></span>
        <div class="motivo__titles">
          <span class="motivo__title">{{ titulo ?? 'Cancelar orden' }}</span>
          <span class="motivo__subtitle">
            {{ subtitulo ?? 'Se reintegrarán los insumos al inventario' }}
          </span>
        </div>
        <q-btn
          v-close-popup
          flat
          round
          dense
          icon="close"
          aria-label="Cerrar"
          class="motivo__close"
        />
      </header>

      <div class="motivo__body">
        <span class="field-label">Motivo</span>
        <div class="motivo__chips" role="radiogroup">
          <button
            v-for="m in MOTIVOS_OPTIONS"
            :key="m"
            type="button"
            role="radio"
            class="motivo__chip"
            :class="{ 'motivo__chip--on': motivoSeleccionado === m }"
            :aria-checked="motivoSeleccionado === m"
            @click="motivoSeleccionado = m"
          >
            {{ m }}
          </button>
        </div>

        <label v-if="motivoSeleccionado === 'Otro'" class="motivo__field">
          <span class="field-label">Especifica el motivo</span>
          <q-input
            v-model="motivoLibre"
            type="textarea"
            rows="3"
            outlined
            autofocus
            :rules="[(val: string) => !!val?.trim() || 'El motivo es obligatorio']"
            hide-bottom-space
          />
        </label>
      </div>

      <footer class="motivo__foot">
        <q-btn v-close-popup outline label="Volver" @click="onCancel" />
        <q-btn
          unelevated
          color="negative"
          :label="botonLabel ?? 'Cancelar orden'"
          :disable="!motivoFinal"
          @click="onConfirm"
        />
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'

const MOTIVOS_OPTIONS = [
  'Cliente se arrepintió',
  'Error en captura de productos',
  'Problema con el pago',
  'Producto agotado',
  'Otro',
]

defineProps<{
  titulo?: string
  subtitulo?: string
  botonLabel?: string
}>()

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const motivoSeleccionado = ref('')
const motivoLibre = ref('')

const motivoFinal = computed(() => {
  if (motivoSeleccionado.value === 'Otro') {
    return motivoLibre.value.trim() || null
  }
  return motivoSeleccionado.value || null
})

function onConfirm() {
  if (motivoFinal.value) {
    onDialogOK(motivoFinal.value)
  }
}

function onCancel() {
  onDialogCancel()
}
</script>

<style scoped lang="scss">
.motivo {
  width: 480px;
  max-width: 96vw;

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
    background: var(--tone-bad-bg);
    color: var(--tone-bad-fg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }

  &__title {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__subtitle {
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__close {
    color: var(--text-secondary);
  }

  &__body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__chip {
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

  &__field {
    display: flex;
    flex-direction: column;
    margin-top: 16px;
  }

  &__foot {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid var(--border-soft);
    background: var(--bg-subtle);

    :deep(.q-btn) {
      min-height: 42px;
    }
  }
}
</style>
