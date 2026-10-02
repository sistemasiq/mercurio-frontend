<template>
  <div class="reg-done">
    <div class="reg-done__main">
      <div class="reg-done__banner">
        <span class="reg-done__check"><q-icon name="check" size="28px" /></span>
        <div>
          <h2 class="reg-done__title">Registro completado</h2>
          <p class="reg-done__text">
            {{ nombres }} {{ store.savedChildren.length > 1 ? 'ya pueden' : 'ya puede' }} entrar al
            área de juegos.
          </p>
        </div>
      </div>

      <div class="reg-done__kids">
        <div v-for="child in store.savedChildren" :key="child.id" class="reg-kid">
          <div class="reg-kid__info">
            <span class="reg-kid__name">{{ child.name }}</span>
            <span class="reg-kid__meta">
              {{ store.tutor.estimatedTime }} · salida {{ scheduledExit() }}
            </span>
          </div>
          <span class="reg-kid__band">{{ getBraceletLabel(child.rfidBracelet) }}</span>
        </div>
      </div>

      <div v-if="qrCodeUrl" class="reg-done__note">
        <q-icon name="qr_code_2" size="20px" />
        El tutor puede escanear el QR del comprobante para ver el tiempo restante desde su teléfono.
      </div>

      <div class="reg-done__actions">
        <q-btn
          outline
          icon="badge"
          label="Ir a Control de Acceso"
          :to="{ name: 'estancias-control-acceso' }"
        />
        <q-btn
          unelevated
          color="primary"
          icon="person_add"
          label="Nuevo registro"
          @click="$emit('nuevo')"
        />
      </div>
    </div>

    <div class="voucher-wrapper">
      <div id="printable-voucher" class="voucher">
        <div class="voucher__brand">
          <span class="voucher__name">Woow Kids</span>
          <span class="voucher__branch">{{ branchName }}</span>
        </div>
        <div class="voucher__line">
          <span>FECHA</span><span>{{ formatDate() }}</span>
        </div>

        <div class="voucher__section">DATOS DEL TUTOR</div>
        <div class="voucher__line">
          <span>Nombre</span><span>{{ store.tutor.fullName }}</span>
        </div>
        <div class="voucher__line">
          <span>Teléfono</span><span>{{ store.tutor.phone }}</span>
        </div>
        <div v-if="store.tutor.secondaryGuardian" class="voucher__line">
          <span>Segundo tutor</span><span>{{ store.tutor.secondaryGuardian }}</span>
        </div>

        <div class="voucher__section">NIÑOS</div>
        <div v-for="child in store.savedChildren" :key="child.id" class="voucher__line">
          <span>{{ child.name.split(' ')[0] }} · {{ getBraceletLabel(child.rfidBracelet) }}</span>
          <span>sale {{ scheduledExit() }}</span>
        </div>

        <div class="voucher__section voucher__section--total">
          <span>TOTAL</span><span>${{ store.total.toFixed(2) }}</span>
        </div>

        <div v-if="qrCodeUrl" class="voucher__qr">
          <img :src="qrCodeUrl" alt="QR del registro" />
        </div>
        <p class="voucher__thanks">¡Gracias por visitarnos!</p>
      </div>
      <q-btn
        outline
        icon="print"
        label="Imprimir comprobante"
        class="voucher__print print-hide"
        @click="printVoucher"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRegistrationStore } from '@/stores/registration'
import { useAuthStore } from '@/stores/auth'
import QRCode from 'qrcode'

defineEmits<{ (e: 'nuevo'): void }>()

const store = useRegistrationStore()
const authStore = useAuthStore()
const qrCodeUrl = ref('')

const branchName = computed(() => authStore.currentBranchName || 'Sucursal')

onMounted(async () => {
  if (store.registroId) {
    const url = `${window.location.origin}/padres/access?code=${store.registroId}`
    qrCodeUrl.value = await QRCode.toDataURL(url, {
      width: 120,
      margin: 1,
      errorCorrectionLevel: 'L',
    })
  }
})

function formatDate() {
  const now = new Date()
  return (
    now.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) +
    ' | ' +
    now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  )
}

function scheduledExit() {
  const time = store.tutor.estimatedTime
  const hours = parseInt(time) || 8
  const d = new Date()
  d.setHours(d.getHours() + hours)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const nombres = computed(() => {
  const n = store.savedChildren.map((c) => c.name.split(' ')[0])
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n.at(-1)}` : (n[0] ?? '')
})

function printVoucher() {
  const originalTitle = document.title
  document.title = 'Ticket_Registro'
  window.print()
  document.title = originalTitle
}

function getBraceletLabel(braceletId: string) {
  const bracelet = store.pulseras.find((p) => p.id === braceletId)
  return bracelet?.pulseraRfid ?? braceletId
}
</script>

<style scoped lang="scss">
.reg-done {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 24px;
  align-items: start;

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 22px 24px;
    border: 1px solid #b9e2b2;
    border-radius: var(--radius-md);
    background: var(--tone-ok-bg);
  }

  &__check {
    width: 52px;
    height: 52px;
    border-radius: 26px;
    background: var(--tone-ok-dot);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: 24px;
    line-height: 1.25;
    font-weight: 800;
    color: var(--tone-ok-fg);
  }

  &__text {
    margin: 2px 0 0;
    font-size: 14.5px;
    color: #33532f;
  }

  &__kids {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }

  &__note {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 12px;
    background: var(--tone-info-bg);
    color: var(--tone-info-fg);
    font-size: 13.5px;
    font-weight: 600;
  }

  &__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 8px;

    :deep(.q-btn) {
      min-height: 48px;
    }
  }
}

.reg-kid {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px 18px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: #fff;

  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 15px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__meta {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__band {
    padding: 3px 8px;
    border-radius: 6px;
    background: #f1f4f9;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-body);
  }
}

.voucher-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.voucher {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 22px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 12.5px;
  color: var(--text-body);
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px dashed #cbd2de;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  &__name {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__branch {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__line {
    display: flex;
    justify-content: space-between;
    gap: 12px;

    span:last-child {
      text-align: right;
    }
  }

  &__section {
    margin-top: 6px;
    padding-top: 10px;
    border-top: 1px dashed #cbd2de;
    font-weight: 800;
    color: var(--text-primary);

    &--total {
      display: flex;
      justify-content: space-between;
    }
  }

  &__qr {
    display: flex;
    justify-content: center;
    padding-top: 8px;

    img {
      width: 120px;
      height: 120px;
    }
  }

  &__thanks {
    margin: 0;
    text-align: center;
    color: var(--text-secondary);
  }

  &__print {
    min-height: 48px;
  }
}
</style>

<style>
@media print {
  @page {
    margin: 0;
  }

  body,
  #q-app,
  .q-layout,
  .q-page-container,
  .registro {
    background: none !important;
    background-color: white !important;
  }

  body * {
    visibility: hidden !important;
  }

  .voucher-wrapper,
  .voucher-wrapper * {
    visibility: visible !important;
  }

  .voucher-wrapper {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    display: flex !important;
    justify-content: center !important;
    background: none !important;
  }

  .voucher {
    box-shadow: none !important;
    border: none !important;
    padding: 24px !important;
    max-width: 100% !important;
  }

  .print-hide,
  button,
  .q-btn {
    display: none !important;
  }
}
</style>
