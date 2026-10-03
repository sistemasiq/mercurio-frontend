<template>
  <article class="stay" :class="`stay--${status.tone}`">
    <div class="stay__top">
      <span class="stay__badge">{{ status.label }}</span>
      <span class="stay__band"><q-icon name="sensors" size="15px" />{{ child.pulsera }}</span>
    </div>
    <button type="button" class="stay__who" @click="showDetails = true">
      <span class="stay__name">{{ child.nino }}</span>
      <span class="stay__tutor">{{ child.tutor }} · {{ child.parentesco }}</span>
    </button>
    <div class="stay__figure">
      <span class="stay__time">{{ tiempo }}</span>
      <span class="stay__entry">Entró {{ horaEntrada }}</span>
    </div>
    <div
      class="stay__bar"
      role="progressbar"
      :aria-valuenow="child.progressPercent"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="stay__bar-fill" :style="{ width: `${child.progressPercent}%` }" />
    </div>
    <div class="stay__actions">
      <a :href="telefonoHref" class="stay__icon-btn" :aria-label="`Llamar a ${child.tutor}`">
        <q-icon name="call" size="19px" />
      </a>
      <button
        type="button"
        class="stay__icon-btn"
        aria-label="Ver fotos del registro"
        @click="showFotos = true"
      >
        <q-icon name="photo_library" size="19px" />
      </button>
      <button type="button" class="stay__checkout" @click="handleCheckout">
        <q-icon name="logout" size="19px" />Checkout
      </button>
    </div>

    <BaseDialog
      v-model="showDetails"
      :title="child.nino"
      :subtitle="`Pulsera ${child.pulsera} · entró ${horaEntrada} · ${tiempo}${child.status === 'excedido' ? ' excedido' : ' restantes'}`"
      icon="face"
      :tone="
        child.status === 'excedido' ? 'red' : child.status === 'por_expirar' ? 'amber' : 'green'
      "
      :width="520"
      secondary-label="Cerrar"
      primary-label="Ir a checkout"
      @confirm="irACheckoutDesdeDetalle"
    >
      <section class="detail">
        <span class="detail__title">Tutores</span>
        <div class="detail__grid">
          <label class="detail__field">
            <span class="field-label">Tutor</span>
            <q-input
              :model-value="`${child.tutor} · ${child.parentesco}`"
              outlined
              dense
              readonly
            />
          </label>
          <label class="detail__field">
            <span class="field-label">Teléfono</span>
            <q-input :model-value="formatTelefono(child.telefono)" outlined dense readonly>
              <template #append>
                <a :href="telefonoHref" class="detail__call" aria-label="Llamar">
                  <q-icon name="call" size="18px" />
                </a>
              </template>
            </q-input>
          </label>
          <label class="detail__field detail__field--full">
            <span class="field-label">Segundo tutor</span>
            <q-input
              :model-value="child.nombreSegundoTutor || 'Sin segundo tutor'"
              outlined
              dense
              readonly
            />
          </label>
        </div>
      </section>
      <section class="detail">
        <span class="detail__title">Notas</span>
        <p class="detail__notes">{{ child.notas || 'Sin notas registradas.' }}</p>
      </section>
      <section class="detail">
        <span class="detail__title">Fotos del registro</span>
        <button type="button" class="detail__photos" @click="showFotos = true">
          <q-icon name="photo_library" size="24px" />
          <span>Ver INE y fotos de llegada</span>
        </button>
      </section>
    </BaseDialog>

    <FotosRegistroDialog
      v-model="showFotos"
      :registro-id="child.registroId"
      :titulo="child.nino"
      :subtitulo="`Registro ${horaEntrada} · ${child.tutor} (${child.parentesco})`"
    />
  </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ActiveChild } from '@/stores/accessControl'
import { useAccessControlStore } from '@/stores/accessControl'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import FotosRegistroDialog from './FotosRegistroDialog.vue'

const props = defineProps<{ child: ActiveChild }>()
const store = useAccessControlStore()
const turno = useTurnoCajaStore()
const router = useRouter()

const showDetails = ref(false)
const showFotos = ref(false)

const STATUS = {
  activo: { label: 'Activo', tone: 'ok' },
  por_expirar: { label: 'Por expirar', tone: 'warn' },
  excedido: { label: 'Excedido', tone: 'bad' },
} as const

const status = computed(() => STATUS[props.child.status])

// Cifra principal: minutos excedidos (+) o restantes.
const tiempo = computed(() => {
  const m = Math.abs(props.child.minutosRestantes)
  const texto =
    m >= 60
      ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`
      : `${String(m).padStart(2, '0')} min`
  return props.child.status === 'excedido' ? `+${texto}` : texto
})

// El DTO trae minutos transcurridos, no la hora de entrada; se deriva aquí.
const horaEntrada = computed(() => {
  const d = new Date(Date.now() - props.child.minutosTranscurridos * 60000)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
})

const telefonoHref = computed(() => `tel:${props.child.telefono.replace(/\D/g, '')}`)

function irACheckoutDesdeDetalle() {
  showDetails.value = false
  handleCheckout()
}

function handleCheckout() {
  if (!turno.estaOperando) {
    router.push('/pos/cierre')
    return
  }
  store.setCheckoutChild(props.child)
  router.push({ name: 'estancias-checkout' })
}

function formatTelefono(telefono: string) {
  const digits = telefono.replace(/\D/g, '')

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  return telefono
}
</script>
<style scoped lang="scss">
.stay {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  --fg: var(--tone-ok-fg);
  --bg: var(--tone-ok-bg);
  --bar: var(--tone-ok-dot);

  &--warn {
    border-color: #fbe2b0;
    --fg: var(--tone-warn-fg);
    --bg: #fff4d6;
    --bar: var(--tone-warn-dot);
  }

  &--bad {
    border-color: #f5c2c2;
    --fg: var(--tone-bad-fg);
    --bg: var(--tone-bad-bg);
    --bar: var(--tone-bad-dot);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__badge {
    padding: 3px 8px;
    border-radius: 6px;
    background: var(--bg);
    color: var(--fg);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__band {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-body);
  }

  &__who {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    text-align: left;
    cursor: pointer;

    &:hover .stay__name {
      color: var(--q-primary);
    }
  }

  &__name {
    font-size: 17px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__tutor {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__figure {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  &__time {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--fg);
    font-variant-numeric: tabular-nums;
  }

  &__entry {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__bar {
    height: 6px;
    border-radius: 3px;
    background: #eef1f5;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    border-radius: 3px;
    background: var(--bar);
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  &__icon-btn {
    width: 40px;
    height: 38px;
    flex-shrink: 0;
    border: 1px solid var(--border-input);
    border-radius: 10px;
    background: #fff;
    color: var(--text-body);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    text-decoration: none;

    &:hover {
      background: var(--bg-subtle);
    }
  }

  &__checkout {
    flex: 1;
    height: 38px;
    border: 0;
    border-radius: 10px;
    background: var(--tone-info-bg);
    color: var(--q-primary);
    font: inherit;
    font-size: 14px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
  }

  &--warn &__checkout {
    background: var(--q-primary);
    color: #fff;
  }

  &--bad &__checkout {
    background: var(--tone-bad-dot);
    color: #fff;
  }
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__title {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    min-width: 0;

    &--full {
      grid-column: 1 / -1;
    }
  }

  &__call {
    color: var(--q-primary);
    display: flex;
    text-decoration: none;
  }

  &__notes {
    margin: 0;
    padding: 10px 12px;
    border: 1px solid var(--border-input);
    border-radius: 10px;
    min-height: 60px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-primary);
  }

  &__photos {
    height: 72px;
    border: 1px dashed #cbd2de;
    border-radius: 12px;
    background: repeating-linear-gradient(135deg, #f5f7fb 0 8px, #eef1f6 8px 16px);
    color: var(--text-secondary);
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;

    &:hover {
      color: var(--q-primary);
    }
  }
}
</style>
