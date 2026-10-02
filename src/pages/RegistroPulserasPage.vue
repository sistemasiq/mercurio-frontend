<template>
  <q-page class="page-content list-page">
    <PageHeader
      title="Registro de pulseras"
      subtitle="Escanea pulseras nuevas una por una con el lector."
      back-label="Pulseras"
      :back-to="{ name: 'estancias-pulseras' }"
    />

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />
      No hay una sucursal activa en la sesión. Activa una sucursal para continuar.
    </div>

    <section class="scan-card">
      <header class="scan-card__head">
        <span class="scan-card__icon"><q-icon name="sensors" size="22px" /></span>
        <div class="scan-card__titles">
          <h2 class="scan-card__title">Registro de pulseras</h2>
          <span class="scan-card__subtitle">Escanea pulseras nuevas una por una</span>
        </div>
      </header>

      <div class="scan-card__body">
        <div class="scan-card__fields">
          <label class="scan-card__field">
            <span class="field-label">Número de lote</span>
            <q-input
              v-model="store.numeroDeLote"
              outlined
              dense
              placeholder="ej. LOT-2026-04"
              :disable="!authStore.currentBranchId"
              @blur="enfocarEscaneo"
            />
          </label>
          <label class="scan-card__field">
            <span class="field-label">ID de pulsera</span>
            <q-input
              ref="scanInputRef"
              v-model="inputEscaneo"
              outlined
              dense
              placeholder="Escanea el código…"
              maxlength="50"
              :disable="!store.formularioHabilitado || store.enviando"
              @keydown.enter.prevent="handleScanEnter"
            >
              <template #append>
                <span v-if="store.formularioHabilitado" class="scan-card__live">
                  <span class="scan-card__live-dot" />Escuchando
                </span>
              </template>
            </q-input>
          </label>
        </div>
        <p v-if="!store.formularioHabilitado && authStore.currentBranchId" class="scan-card__hint">
          Ingresa un número de lote para habilitar el registro de pulseras.
        </p>

        <div class="scan-card__table">
          <div class="scan-card__row scan-card__row--head">
            <span>Escaneadas ({{ store.escaneos.length }})</span><span>Estado</span>
          </div>
          <div v-if="!store.escaneos.length" class="scan-card__empty">
            Aún no hay pulseras escaneadas en esta sesión.
          </div>
          <div v-for="(item, i) in store.escaneos" :key="i" class="scan-card__row">
            <div class="scan-card__code">
              <span>{{ item.codigo }}</span>
              <span v-if="item.mensaje" class="scan-card__msg">{{ item.mensaje }}</span>
            </div>
            <div class="scan-card__status">
              <StatusBadge
                :tone="item.estado === 'success' ? 'ok' : item.estado === 'error' ? 'bad' : 'off'"
                :label="
                  item.estado === 'success'
                    ? 'Leída'
                    : item.estado === 'error'
                      ? 'Error'
                      : 'Pendiente'
                "
              />
              <q-btn
                flat
                round
                dense
                icon="delete"
                class="action-btn"
                aria-label="Quitar"
                @click="pedirConfirmacionEliminar(item.codigo, i)"
              />
            </div>
          </div>
        </div>

        <div class="scan-card__callout">
          <q-icon name="info" size="19px" />
          {{
            store.formularioHabilitado
              ? 'Acerca la siguiente pulsera al lector…'
              : 'El lector se habilita al capturar el número de lote.'
          }}
        </div>
      </div>

      <footer class="scan-card__foot">
        <q-btn outline label="Cancelar" @click="mostrarModalCancelar = true" />
        <q-btn
          unelevated
          color="primary"
          label="Finalizar registro"
          :disable="!store.formularioHabilitado || store.totalPendientes === 0 || store.enviando"
          :loading="store.enviando"
          @click="mostrarModalFinalizar = true"
        />
      </footer>
    </section>

    <BaseDialog
      v-model="mostrarModalEliminar"
      title="Quitar pulsera"
      :subtitle="codigoAEliminar"
      icon="delete"
      tone="red"
      :width="440"
      primary-label="Sí, quitar"
      danger
      @confirm="confirmarEliminar"
    >
      Se quitará esta pulsera de la sesión de registro.
    </BaseDialog>

    <BaseDialog
      v-model="mostrarModalFinalizar"
      title="Finalizar registro"
      :subtitle="store.numeroDeLote ? `Lote ${store.numeroDeLote}` : undefined"
      icon="task_alt"
      tone="green"
      :width="440"
      secondary-label="Volver"
      primary-label="Sí, finalizar"
      @confirm="confirmarFinalizar"
    >
      Se enviarán {{ store.totalPendientes }} pulsera(s) al sistema.
    </BaseDialog>

    <BaseDialog
      v-model="mostrarModalCancelar"
      title="Cancelar sesión"
      icon="warning"
      tone="amber"
      :width="440"
      secondary-label="Volver"
      primary-label="Sí, salir"
      danger
      @confirm="confirmarCancelar"
    >
      <template v-if="store.escaneos.length > 0">
        Las {{ store.escaneos.length }} pulsera(s) escaneadas aún no se han guardado y se perderán.
      </template>
      <template v-else>No se ha escaneado ninguna pulsera en esta sesión.</template>
    </BaseDialog>
  </q-page>
</template>

<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { ref, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, type QInput } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useRegistroPulserasStore } from '@/stores/registroPulseras'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const store = useRegistroPulserasStore()

const inputEscaneo = ref('')
const scanInputRef = ref<QInput | null>(null)
const mostrarModalFinalizar = ref(false)
const mostrarModalCancelar = ref(false)
const mostrarModalEliminar = ref(false)
const codigoAEliminar = ref('')
const indiceAEliminar = ref(-1)

async function enfocarEscaneo() {
  if (store.formularioHabilitado) {
    await nextTick()
    scanInputRef.value?.focus()
  }
}

async function handleScanEnter() {
  const codigo = inputEscaneo.value.trim()
  if (!codigo) return
  inputEscaneo.value = ''
  store.registrarPulsera(codigo)
  await nextTick()
  scanInputRef.value?.focus()
}

function pedirConfirmacionEliminar(codigo: string, index: number) {
  codigoAEliminar.value = codigo
  indiceAEliminar.value = index
  mostrarModalEliminar.value = true
}

function confirmarEliminar() {
  store.eliminarEscaneo(indiceAEliminar.value)
  mostrarModalEliminar.value = false
}

async function confirmarFinalizar() {
  if (!authStore.currentBranchId) return
  mostrarModalFinalizar.value = false
  await store.enviarRegistros(authStore.currentBranchId)
  if (store.totalErrores > 0) {
    $q.notify({
      type: 'warning',
      message: `Registro finalizado: ${store.totalRegistradas} pulsera(s) guardadas, ${store.totalErrores} con error.`,
      position: 'top-right',
    })
  } else {
    $q.notify({
      type: 'positive',
      message: `Registro finalizado: ${store.totalRegistradas} pulsera(s) guardadas correctamente.`,
      position: 'top-right',
    })
  }
  store.limpiarSesion()
  router.push({ name: 'estancias-pulseras' })
}

function confirmarCancelar() {
  mostrarModalCancelar.value = false
  store.limpiarSesion()
  router.push({ name: 'estancias-pulseras' })
}

onUnmounted(() => {
  store.limpiarSesion()
})
</script>

<style scoped lang="scss">
.scan-card {
  width: 100%;
  max-width: 640px;
  background: #fff;
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

  &__body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  &__field {
    display: flex;
    flex-direction: column;
  }

  &__hint {
    margin: -6px 0 0;
    font-size: 12.5px;
    color: var(--tone-warn-fg);
  }

  &__live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--tone-ok-fg);
  }

  &__live-dot {
    width: 7px;
    height: 7px;
    border-radius: 4px;
    background: var(--tone-ok-dot);
    animation: scan-pulse 1.2s infinite;
  }

  &__table {
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
    max-height: 360px;
    overflow-y: auto;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid #f1f3f7;

    &:last-child {
      border-bottom: 0;
    }

    &--head {
      position: sticky;
      top: 0;
      background: var(--bg-subtle);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-secondary);
    }
  }

  &__code {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    font-weight: 800;
    color: var(--text-primary);
  }

  &__msg {
    font-size: 12px;
    font-weight: 500;
    color: var(--tone-bad-fg);
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__empty {
    padding: 18px 14px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__callout {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tone-info-bg);
    color: var(--tone-info-fg);
    font-size: 13px;
    font-weight: 600;
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

@keyframes scan-pulse {
  50% {
    opacity: 0.3;
  }
}
</style>
