<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAccessControlStore } from '@/stores/accessControl'
import StatCard from '@/components/control-acceso/StatCard.vue'
import ActiveChildCard from '@/components/control-acceso/ActiveChildCard.vue'

const store = useAccessControlStore()
const router = useRouter()

const scrollContainer = ref<HTMLElement | null>(null)

onMounted(() => {
  store.loadActivos()
  store.startTicking()
})

onUnmounted(() => {
  store.stopTicking()
})

function getChildFirstName(nino: string, index: number) {
  const first = nino.trim().split(' ')[0]
  return first || `Niño ${index + 1}`
}

function scrollToChild(index: number) {
  const container = scrollContainer.value
  if (!container) return
  const cardEl = container.children[index] as HTMLElement | undefined
  if (cardEl) {
    cardEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }
}

function scrollByCards(direction: 1 | -1) {
  const container = scrollContainer.value
  if (!container) return
  container.scrollBy({ left: direction * 280, behavior: 'smooth' })
}

function goToNewRegistration() {
  router.push({ name: 'estancias-registro-infantes' })
}
</script>

<template>
  <q-page class="access-page q-pa-lg">
    <!-- Header -->
    <div class="row items-start q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">Control de Acceso</div>
        <div class="text-caption text-grey-6">Monitoreo en tiempo real de estancias activas.</div>
      </div>
      <q-space />
      <q-btn
        unelevated
        color="primary"
        icon="person_add"
        label="Nuevo Registro"
        no-caps
        :disable="store.pulserasLibres < 2"
        @click="goToNewRegistration"
      />
    </div>

    <!-- Stat cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <StatCard
          label="Activos"
          :value="store.totalActivos"
          icon="groups"
          icon-color="primary"
          icon-bg="#e8f0fe"
          caption="+ 15 min restantes"
          caption-color="positive"
          caption-icon="trending_up"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <StatCard
          label="Por Expirar"
          :value="store.porExpirar"
          icon="schedule"
          icon-color="orange-9"
          icon-bg="#fff3e0"
          caption="< 15 min restantes"
          caption-color="orange-9"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <StatCard
          label="Excedidos"
          :value="store.excedidos"
          icon="warning"
          icon-color="negative"
          icon-bg="#fde8e8"
          caption="Requieren acción"
          caption-color="negative"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <StatCard
          label="Disponibilidad"
          :value="`${store.pulserasLibres} ${store.pulserasLibres === 1 ? 'pulsera' : 'pulseras'} libre${store.pulserasLibres === 1 ? '' : 's'}`"
          icon="lock_open"
          icon-color="primary"
          icon-bg="#e8f0fe"
          caption="Listas para usar"
          caption-color="black-1"
        />
      </div>
    </div>

    <!-- Sección Niños Activos -->
    <q-card flat bordered class="registration-card q-mb-md">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <q-icon name="child_care" size="22px" color="amber-8" class="q-mr-sm" />
          <span class="text-subtitle1 text-weight-bold">Niños Activos</span>

          <!-- Flechas de scroll -->
          <div
            v-if="store.activos.length > 0"
            class="row items-center q-ml-sm text-caption text-grey-7"
          >
            <q-btn flat dense round icon="chevron_left" size="md" @click="scrollByCards(-1)" />
            <span class="q-px-md">{{ store.activos.length }} en total</span>
            <q-btn flat dense round icon="chevron_right" size="md" @click="scrollByCards(1)" />
          </div>

          <q-space />
          <q-btn flat round dense icon="refresh" color="grey-7" @click="store.loadActivos()" />
        </div>

        <!-- Loading -->
        <div v-if="store.isLoading && store.activos.length === 0" class="text-center q-py-xl">
          <q-spinner color="primary" size="32px" />
          <div class="text-caption text-grey-6 q-mt-sm">Cargando estancias activas...</div>
        </div>

        <!-- Error -->
        <q-banner v-else-if="store.error" dense rounded class="bg-red-1 text-red-9">
          <template #avatar>
            <q-icon name="error_outline" color="negative" />
          </template>
          {{ store.error }}
          <template #action>
            <q-btn flat dense label="Reintentar" color="negative" @click="store.loadActivos()" />
          </template>
        </q-banner>

        <!-- Empty -->
        <div v-else-if="store.activos.length === 0" class="text-center q-py-xl text-grey-6">
          No hay niños activos en este momento.
        </div>

        <!-- Fila horizontal con scroll -->
        <div v-else ref="scrollContainer" class="horizontal-scroll q-pb-sm">
          <div v-for="child in store.activos" :key="child.detalleId" class="scroll-item">
            <ActiveChildCard :child="child" />
          </div>
        </div>

        <!-- Chips de navegación rápida (saltan dentro del scroll) -->
        <div v-if="store.activos.length > 1" class="row q-gutter-sm q-mt-md">
          <q-chip
            v-for="(child, i) in store.activos"
            :key="child.detalleId"
            clickable
            :color="
              child.status === 'excedido'
                ? 'red-2'
                : child.status === 'por_expirar'
                  ? 'orange-2'
                  : 'grey-3'
            "
            :text-color="
              child.status === 'excedido'
                ? 'red-9'
                : child.status === 'por_expirar'
                  ? 'orange-9'
                  : 'grey-9'
            "
            :icon="
              child.status === 'excedido'
                ? 'warning'
                : child.status === 'por_expirar'
                  ? 'schedule'
                  : 'check'
            "
            :label="getChildFirstName(child.nino, i)"
            size="lg"
            class="text-weight-medium q-px-lg"
            @click="scrollToChild(i)"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style scoped>
.access-page {
  background: #f7f8fc;
  min-height: 100vh;
}

.registration-card {
  border-radius: 12px;
}

.horizontal-scroll {
  display: flex;
  gap: 80px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  padding: 4px 16px 12px 16px;
}
.horizontal-scroll::-webkit-scrollbar {
  height: 6px;
}

.horizontal-scroll::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 4px;
}

.scroll-item {
  flex: 0 0 320px;
  scroll-snap-align: start;
}
</style>
