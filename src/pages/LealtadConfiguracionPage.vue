<template>
  <q-page class="page-content list-page">
    <PageHeader
      title="Puntos de Lealtad"
      subtitle="Define cuántos puntos se ganan y cuánto valen al canjear."
    >
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="save"
          label="Guardar"
          :loading="guardando"
          :disable="!authStore.currentBranchId || !form.dias_caducidad"
          @click="guardar"
        />
      </template>
    </PageHeader>

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>
    <div v-if="store.error" class="list-page__note list-page__note--bad">
      <q-icon name="error" size="19px" />{{ store.error }}
      <q-btn flat dense label="Reintentar" class="q-ml-auto" @click="cargar" />
    </div>

    <div class="loy">
      <div class="loy__main">
        <section class="loy-card">
          <div class="loy-card__head">
            <h2 class="loy-card__title">Programa activo</h2>
            <q-toggle v-model="form.activo" aria-label="Programa activo" />
          </div>
          <div class="form-grid">
            <label class="form-grid__field">
              <span class="field-label">% de retorno</span>
              <q-input
                v-model.number="form.porcentaje_retorno"
                outlined
                dense
                type="number"
                min="0"
                max="100"
                step="0.01"
                suffix="%"
                hint="Del total pagado que se convierte en puntos"
              />
            </label>
            <label class="form-grid__field">
              <span class="field-label">Valor de 1 punto al canjear</span>
              <q-input
                v-model.number="form.valor_punto"
                outlined
                dense
                type="number"
                min="0.01"
                step="0.01"
                prefix="$"
              />
            </label>
            <label class="form-grid__field">
              <span class="field-label">Vigencia de puntos</span>
              <q-input
                v-model.number="form.dias_caducidad"
                outlined
                dense
                type="number"
                min="1"
                step="1"
                suffix="días"
              />
            </label>
          </div>
        </section>

        <section class="loy-card">
          <h2 class="loy-card__title">Acumulan puntos</h2>
          <div v-for="o in ORIGENES" :key="o.key" class="loy-src">
            <span class="loy-src__icon"><q-icon :name="o.icon" size="20px" /></span>
            <div class="loy-src__text">
              <span class="loy-src__label">{{ o.label }}</span>
              <span class="loy-src__sub">{{ o.sub }}</span>
            </div>
            <q-toggle v-model="form[o.key]" :aria-label="o.label" />
          </div>
        </section>
      </div>

      <aside class="loy-preview">
        <span class="loy-preview__eyebrow">Vista previa</span>
        <p class="loy-preview__text">
          Un cliente que gasta <b>{{ formatMXN(GASTO_EJEMPLO) }}</b> en una visita gana:
        </p>
        <span class="loy-preview__points">{{ puntosEjemplo }} pts</span>
        <div class="loy-preview__rule" />
        <div class="loy-preview__row">
          <span>Equivalen a</span><b>{{ formatMXN(equivalente) }}</b>
        </div>
        <div class="loy-preview__row">
          <span>Retorno al cliente</span><b>{{ Number(form.porcentaje_retorno) || 0 }}%</b>
        </div>
        <div class="loy-preview__row">
          <span>Vigencia</span><b>{{ form.dias_caducidad }} días</b>
        </div>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import { formatMXN } from '@/utils/formatoMoneda'
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useLealtadStore } from '@/stores/lealtad'
import type { ConfiguracionLealtadInput } from '@/types/lealtad'
import type { ApiError } from '@/types/auth'

const $q = useQuasar()
const authStore = useAuthStore()
const store = useLealtadStore()

const guardando = ref(false)

const ORIGENES = [
  {
    key: 'otorga_puntos_comandas',
    icon: 'point_of_sale',
    label: 'Ventas de caja (comandas)',
    sub: 'Consumo en cafetería y productos',
  },
  {
    key: 'otorga_puntos_reservaciones',
    icon: 'event',
    label: 'Anticipos de reservación',
    sub: 'Pagos de eventos y fiestas',
  },
  {
    key: 'otorga_puntos_checkin',
    icon: 'child_care',
    label: 'Check-in de niños',
    sub: 'Tiempo de juego pagado',
  },
] as const

// Vista previa estimada para una visita de $1,000.
const GASTO_EJEMPLO = 1000
const equivalente = computed(() => (GASTO_EJEMPLO * (Number(form.porcentaje_retorno) || 0)) / 100)
const puntosEjemplo = computed(() =>
  form.valor_punto > 0 ? Math.floor(equivalente.value / form.valor_punto) : 0,
)

const form = reactive<ConfiguracionLealtadInput>({
  porcentaje_retorno: 0,
  dias_caducidad: 30,
  valor_punto: 1,
  activo: true,
  otorga_puntos_comandas: true,
  otorga_puntos_reservaciones: true,
  otorga_puntos_checkin: true,
})

const cargar = async () => {
  if (!authStore.currentBranchId) return
  await store.cargarConfiguracion(authStore.currentBranchId)
  if (store.configuracion) {
    form.porcentaje_retorno = store.configuracion.porcentaje_retorno
    form.dias_caducidad = store.configuracion.dias_caducidad
    form.valor_punto = store.configuracion.valor_punto
    form.activo = store.configuracion.activo
    form.otorga_puntos_comandas = store.configuracion.otorga_puntos_comandas
    form.otorga_puntos_reservaciones = store.configuracion.otorga_puntos_reservaciones
    form.otorga_puntos_checkin = store.configuracion.otorga_puntos_checkin
  }
}

const guardar = async () => {
  if (!authStore.currentBranchId) return
  guardando.value = true
  try {
    await store.guardarConfiguracion(authStore.currentBranchId, { ...form })
    $q.notify({ type: 'positive', message: 'Configuración de lealtad guardada' })
  } catch (error: unknown) {
    const apiError = error as ApiError
    $q.notify({ type: 'negative', message: apiError.message ?? 'No se pudo guardar' })
  } finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>

<style scoped lang="scss">
.loy {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.loy-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    margin: 0;
    font-size: 15px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }
}

.loy-src {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 12px;
  border-top: 1px solid #f1f3f7;

  &__icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--tone-info-bg);
    color: var(--q-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  &__label {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__sub {
    font-size: 12.5px;
    color: var(--text-secondary);
  }
}

.loy-preview {
  background: var(--text-strong);
  border-radius: var(--radius-md);
  padding: 22px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__eyebrow {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #aeb8e8;
  }

  &__text {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: #dfe4fa;

    b {
      color: #fff;
    }
  }

  &__points {
    font-size: 44px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  &__rule {
    height: 1px;
    background: rgba(255, 255, 255, 0.14);
  }

  &__row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #dfe4fa;

    b {
      color: #fff;
    }
  }
}
</style>
