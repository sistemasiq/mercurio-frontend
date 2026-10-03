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

      <div v-if="store.advertenciaEfectivoFromServer" class="reg-done__note reg-done__note--warn">
        <q-icon name="warning" size="20px" />
        {{ store.advertenciaEfectivoFromServer }}
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
      <div id="printable-voucher" ref="voucherRef" class="voucher">
        <!-- Encabezado -->
        <div class="text-center">
          <div class="ticket-brand">Woow Kids</div>
          <div class="ticket-sub">{{ branchName }}</div>
          <div class="ticket-sub">Cajero: {{ cashierName }}</div>
        </div>

        <div class="ticket-divider">--------------------------------</div>

        <!-- Fecha y Tutor Compactos -->
        <div class="ticket-row">
          <span>Fecha:</span>
          <span class="text-weight-bold">{{ formatDate() }}</span>
        </div>
        <div class="ticket-row">
          <span>Tutor:</span>
          <span class="text-ellipsis">{{ store.tutor.fullName }}</span>
        </div>
        <div v-if="store.tutor.phone" class="ticket-row">
          <span>Tel:</span>
          <span>{{ store.tutor.phone }}</span>
        </div>

        <div class="ticket-divider">--------------------------------</div>

        <!-- Niños Registrados -->
        <div class="ticket-section-title">NIÑOS REGISTRADOS</div>
        <div
          v-for="child in store.savedChildren"
          :key="child.id"
          class="ticket-row items-center q-my-xs"
        >
          <span class="text-weight-bold text-ellipsis">{{ child.name }}</span>
          <span>{{ child.age }} años</span>
        </div>

        <div class="ticket-divider">--------------------------------</div>

        <!-- Salida y Pago -->
        <div class="ticket-box q-my-xs text-center">
          Salida Estimada: <strong>{{ scheduledExit() }}</strong>
        </div>

        <div class="ticket-row text-weight-bold q-mt-xs" style="font-size: 13px">
          <span>TOTAL:</span>
          <span>${{ Number(store.totalFromServer ?? store.total).toFixed(2) }}</span>
        </div>

        <!-- QR -->
        <div v-if="qrCodeUrl" class="text-center q-mt-sm">
          <img :src="qrCodeUrl" alt="QR" class="qr-code" />
          <div class="ticket-caption">Escanea para ver tu registro</div>
        </div>

        <div class="text-center ticket-footer q-mt-xs">¡Gracias por visitarnos!</div>
      </div>
      <q-btn
        outline
        icon="print"
        :label="isPrinting ? 'Imprimiendo…' : 'Imprimir comprobante'"
        class="voucher__print print-hide"
        :loading="isPrinting"
        :disable="!qrCodeUrl"
        @click="printVoucher"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { printTicketElement } from '@/utils/ticketPrinting'
import { useRegistrationStore } from '@/stores/registration'
import { useAuthStore } from '@/stores/auth'
import QRCode from 'qrcode'

defineEmits<{ (e: 'nuevo'): void }>()

const store = useRegistrationStore()
const authStore = useAuthStore()
const qrCodeUrl = ref('')
const voucherRef = ref<HTMLElement | null>(null)
const isPrinting = ref(false)
const $q = useQuasar()
const issuedAt = new Date()

const branchName = computed(() => authStore.currentBranchName || 'Sucursal')
const cashierName = computed(() => authStore.currentUser?.name || 'Cajero')

async function generarQR() {
  if (store.registroId) {
    const url = `${window.location.origin}/padres/access?code=${store.registroId}`
    qrCodeUrl.value = await QRCode.toDataURL(url, {
      width: 100,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
  }
}

onMounted(generarQR)

function formatDate() {
  const now = issuedAt
  return (
    now.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }) +
    ' ' +
    now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  )
}

function scheduledExit() {
  const time = store.tutor.estimatedTime
  const hours = parseInt(time) || 8
  const d = new Date(issuedAt)
  d.setHours(d.getHours() + hours)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const nombres = computed(() => {
  const n = store.savedChildren.map((c) => c.name.split(' ')[0])
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n.at(-1)}` : (n[0] ?? '')
})

async function printVoucher() {
  if (isPrinting.value) return
  isPrinting.value = true
  try {
    await generarQR()
    await nextTick()
    await printTicketElement(voucherRef.value)
  } catch (error) {
    $q.notify({ type: 'negative', message: (error as Error).message })
  } finally {
    isPrinting.value = false
  }
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

    &--warn {
      background: var(--tone-warn-bg);
      color: var(--tone-warn-fg);
    }
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

/* Vista en pantalla del comprobante — el layout de impresión es universal (ver useTicketPrint/printTicketElement) */
.voucher-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.voucher {
  background: #fff;
  border-radius: 8px;
  padding: 14px 10px;
  width: 80mm;
  max-width: none;
  flex: none;
  box-sizing: border-box;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  font-family: 'Courier New', Courier, monospace;
  color: #000;
  font-size: 11px;
  line-height: 1.25;
}

.ticket-brand {
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.ticket-sub {
  font-size: 10px;
  color: #444;
}

.ticket-divider {
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  letter-spacing: -1px;
  color: #666;
  margin: 4px 0;
}

.ticket-section-title {
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2px;
}

.ticket-row {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-box {
  border: 1px dashed #000;
  padding: 4px;
  font-size: 11px;
}

.qr-code {
  width: 95px;
  height: 95px;
  display: inline-block;
}

.ticket-caption {
  font-size: 9px;
  color: #555;
  margin-top: 2px;
}

.ticket-footer {
  font-size: 10px;
}

.voucher__print {
  min-height: 48px;
}
</style>
