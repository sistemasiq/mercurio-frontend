<template>
  <div class="retiro-view">
    <button type="button" class="retiro-view__volver" @click="emit('volver')">
      <q-icon name="arrow_back" size="18px" />
      Volver a operaciones
    </button>

    <div v-if="!comprobante" class="retiro-card">
      <header class="retiro-card__head">
        <span class="retiro-card__icon"><q-icon name="savings" size="22px" /></span>
        <div class="retiro-card__titles">
          <h2 class="retiro-card__title">Retiro parcial</h2>
          <span class="retiro-card__subtitle">Extrae efectivo de la caja del turno actual</span>
        </div>
      </header>

      <div class="retiro-form">
        <div class="retiro-form__field retiro-form__field--full">
          <span class="field-label">Monto a retirar</span>
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
        <div class="retiro-form__field">
          <span class="field-label">Motivo</span>
          <q-select
            v-model="concepto"
            outlined
            dense
            :options="opcionesConcepto"
            emit-value
            map-options
            placeholder="Selecciona"
          />
        </div>
        <div class="retiro-form__field">
          <span class="field-label">Recibe</span>
          <q-select
            v-model="tipoDestinatario"
            outlined
            dense
            :options="opcionesDestinatario"
            emit-value
            map-options
            placeholder="Selecciona"
          />
        </div>
        <div class="retiro-form__field retiro-form__field--full">
          <span class="field-label">Observaciones</span>
          <q-input
            v-model="observaciones"
            outlined
            type="textarea"
            rows="2"
            placeholder="Opcional"
          />
        </div>
      </div>

      <div v-if="turno.error" class="retiro-form__callout retiro-form__callout--bad">
        <q-icon name="error" size="19px" />{{ turno.error }}
      </div>
      <div class="retiro-form__callout">
        <q-icon name="info" size="19px" />
        El retiro afecta de inmediato el saldo en caja. Recaba la firma de quien recibe el
        efectivo e imprime el comprobante.
      </div>

      <footer class="retiro-card__foot">
        <q-btn
          unelevated
          color="primary"
          label="Registrar retiro"
          class="retiro-card__submit"
          :loading="turno.cargando"
          :disable="!puedeRegistrar"
          @click="registrar"
        />
      </footer>
    </div>

    <div v-else class="retiro-receipt">
      <div class="retiro-form__callout retiro-form__callout--ok">
        <q-icon name="check_circle" size="19px" />
        Retiro registrado. Puedes imprimir o reimprimir el comprobante.
      </div>
      <div class="retiro-receipt__scroll">
        <div ref="comprobanteRef" class="retiro-receipt__ticket" style="width: 80mm">
          <h2>WOOW KIDS</h2>
          <p>{{ turno.sucursalNombre }}</p>
          <h3>COMPROBANTE DE RETIRO PARCIAL</h3>
          <p><strong>Folio:</strong> {{ comprobante.id }}</p>
          <p><strong>Fecha:</strong> {{ new Date(comprobante.creado).toLocaleString('es-MX') }}</p>
          <p><strong>Cajero:</strong> {{ turno.cajeroNombre }}</p>
          <p><strong>Concepto:</strong> {{ comprobante.concepto }}</p>
          <p><strong>Recibe:</strong> {{ comprobante.tipoDestinatario }}</p>
          <p v-if="comprobante.observaciones">
            <strong>Observaciones:</strong> {{ comprobante.observaciones }}
          </p>
          <p class="retiro-receipt__total">MONTO: ${{ Number(comprobante.monto).toFixed(2) }}</p>
          <p class="retiro-receipt__signature">Nombre y firma de quien recibe</p>
        </div>
      </div>
      <div class="retiro-receipt__actions">
        <q-btn
          unelevated
          color="primary"
          icon="print"
          label="Imprimir comprobante"
          :loading="imprimiendo"
          @click="imprimirComprobante"
        />
        <q-btn outline label="Finalizar" :disable="imprimiendo" @click="emit('retiro-exitoso')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { filtrarTeclaDecimal, reglaDecimal } from '@/utils/validacionNumerica'
import type { ConceptoRetiro, TipoDestinatario, RetiroParcialResponse } from '@/types/turnoCaja'
import { printTicketElement } from '@/utils/ticketPrinting'

const emit = defineEmits<{
  (e: 'volver'): void
  (e: 'retiro-exitoso'): void
}>()

const $q = useQuasar()
const turno = useTurnoCajaStore()
const comprobante = ref<RetiroParcialResponse | null>(null)
const comprobanteRef = ref<HTMLElement | null>(null)
const imprimiendo = ref(false)

async function imprimirComprobante() {
  if (imprimiendo.value) return
  imprimiendo.value = true
  try {
    await printTicketElement(comprobanteRef.value)
  } catch (error) {
    $q.notify({ type: 'negative', message: (error as Error).message })
  } finally {
    imprimiendo.value = false
  }
}

const monto = ref<number | null>(null)
const concepto = ref<ConceptoRetiro | null>(null)
const tipoDestinatario = ref<TipoDestinatario | null>(null)
const observaciones = ref('')

const opcionesConcepto: { label: string; value: ConceptoRetiro }[] = [
  { label: 'Pago a proveedor', value: 'Pago a proveedor' },
  { label: 'Compra de insumos', value: 'Compra de insumos' },
  { label: 'Depósito bancario', value: 'Depósito bancario' },
  { label: 'Resguardo de efectivo', value: 'Resguardo de efectivo' },
  { label: 'Pago de servicios', value: 'Pago de servicios' },
  { label: 'Gastos administrativos', value: 'Gastos administrativos' },
  { label: 'Gastos varios', value: 'Gastos varios' },
  { label: 'Devolución', value: 'Devolución' },
]

const opcionesDestinatario: { label: string; value: TipoDestinatario }[] = [
  { label: 'Proveedor', value: 'Proveedor' },
  { label: 'Empleado', value: 'Empleado' },
  { label: 'Administrador', value: 'Administrador' },
  { label: 'Cliente', value: 'Cliente' },
]

const puedeRegistrar = computed(
  () => (monto.value ?? 0) > 0 && !!concepto.value && !!tipoDestinatario.value,
)

async function registrar() {
  if (!concepto.value || !tipoDestinatario.value || !monto.value) return
  const ok = await turno.registrarRetiro(
    concepto.value,
    tipoDestinatario.value,
    monto.value,
    observaciones.value || undefined,
  )
  if (ok) {
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `Retiro de $${monto.value.toLocaleString('es-MX')} registrado correctamente.`,
    })
    comprobante.value = turno.ultimoRetiro
  }
}
</script>

<style scoped lang="scss">
.retiro-view {
  max-width: 640px;
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

.retiro-card {
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
    background: var(--tone-warn-bg);
    color: var(--tone-warn-fg);
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

.retiro-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 20px 24px;

  &__field {
    display: flex;
    flex-direction: column;
    min-width: 0;

    &--full {
      grid-column: 1 / -1;
    }
  }

  &__callout {
    display: flex;
    gap: 10px;
    margin: 0 24px 16px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tone-warn-bg);
    color: var(--tone-warn-fg);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;

    &--bad {
      background: var(--tone-bad-bg);
      color: var(--tone-bad-fg);
    }

    &--ok {
      background: var(--tone-ok-bg);
      color: var(--tone-ok-fg);
      margin: 0 0 16px;
    }
  }
}

.retiro-receipt {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__scroll {
    overflow-x: auto;
    padding: 12px 0;
  }

  &__ticket {
    background: #fff;
    color: #111;
    padding: 15px;
    margin: 0 auto;
    box-sizing: border-box;
    font:
      12px/1.6 Arial,
      sans-serif;
    overflow-wrap: anywhere;
    border: 1px solid var(--border-color);
    border-radius: 8px;

    h2 {
      font-size: 22px;
      text-align: center;
    }

    h3 {
      font-size: 13px;
      border-block: 1px dashed #111;
      padding: 12px 0;
    }
  }

  &__total {
    font-weight: bold;
    font-size: 16px;
    border-top: 2px solid #111;
    padding-top: 12px;
  }

  &__signature {
    border-top: 1px solid #111;
    margin-top: 60px;
    text-align: center;
    padding-top: 8px;
  }

  &__actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
}
</style>
