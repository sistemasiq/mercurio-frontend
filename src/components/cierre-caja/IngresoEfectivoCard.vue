<template>
  <div class="ingreso-view">
    <button type="button" class="ingreso-view__volver" @click="emit('volver')">
      <q-icon name="arrow_back" size="18px" />
      Volver a operaciones
    </button>

    <div class="ingreso-card">
      <header class="ingreso-card__head">
        <span class="ingreso-card__icon"><q-icon name="payments" size="22px" /></span>
        <div class="ingreso-card__titles">
          <h2 class="ingreso-card__title">Ingreso de efectivo</h2>
          <span class="ingreso-card__subtitle">
            Agrega dinero físico a la caja actual (reposición de cambio, fondo adicional, etc.)
          </span>
        </div>
      </header>

      <div class="ingreso-form">
        <div class="ingreso-form__field">
          <span class="field-label">Monto a ingresar</span>
          <q-input
            v-model.number="monto"
            type="text"
            inputmode="decimal"
            outlined
            dense
            prefix="$"
            placeholder="0.00"
            autofocus
            :rules="[reglaDecimal]"
            hide-bottom-space
            @keydown="filtrarTeclaDecimal"
          />
        </div>
      </div>

      <div class="ingreso-form__callout">
        <q-icon name="info" size="19px" />
        El ingreso afectará de inmediato el saldo esperado en caja. No se contará como venta.
      </div>

      <footer class="ingreso-card__foot">
        <q-btn
          unelevated
          color="primary"
          icon="save"
          label="Registrar ingreso"
          class="ingreso-card__submit"
          :loading="turno.cargando"
          :disable="!puedeRegistrar"
          @click="registrar"
        />
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { filtrarTeclaDecimal, reglaDecimal } from '@/utils/validacionNumerica'

const emit = defineEmits<{
  (e: 'volver'): void
  (e: 'ingreso-exitoso'): void
}>()

const $q = useQuasar()
const turno = useTurnoCajaStore()

const monto = ref<number | null>(null)

const puedeRegistrar = computed(() => (monto.value ?? 0) > 0)

async function registrar() {
  if (!monto.value) return
  const ok = await turno.registrarIngreso(monto.value)
  if (ok) {
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `Ingreso de $${monto.value.toLocaleString('es-MX')} registrado correctamente.`,
    })
    emit('ingreso-exitoso')
  }
}
</script>

<style scoped lang="scss">
.ingreso-view {
  max-width: 620px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__volver {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    padding: 6px 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--q-primary);
    }
  }
}

.ingreso-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
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
    background: var(--tone-info-bg);
    color: var(--q-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__subtitle {
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__foot {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid var(--border-soft);
    background: var(--bg-subtle);
  }

  &__submit {
    min-height: 42px;
    padding: 0 18px;
    font-weight: 800;
  }
}

.ingreso-form {
  padding: 20px 24px;

  &__field {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__callout {
    display: flex;
    gap: 10px;
    margin: 0 24px 16px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tone-info-bg);
    color: var(--tone-info-fg);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
  }
}
</style>
