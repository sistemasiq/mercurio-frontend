<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePadresAuthStore } from '@/stores/padres/padresAuthStore'
import HijoCard from '@/components/padres/HijoCard.vue'

const route = useRoute()
const router = useRouter()
const store = usePadresAuthStore()

let pollingId: ReturnType<typeof setInterval> | null = null
const POLLING_MS = 30_000

async function refrescarSesion() {
  if (!store.isAuthenticated) return
  try {
    await store.refrescarNinos()
  } catch {
    store.logout()
    void router.replace('/padres/access')
  }
}

onMounted(async () => {
  const rawCode = route.query.code
  const codeFromQuery =
    typeof rawCode === 'string' ? rawCode : Array.isArray(rawCode) ? rawCode[0] : undefined

  if (codeFromQuery) {
    try {
      await store.loginConCode(codeFromQuery)
      await router.replace({ query: {} })
    } catch {
      await router.replace('/padres/access')
    }
  } else if (!store.isAuthenticated) {
    const restored = await store.restoreOrFetchSession()
    if (!restored) {
      await router.replace('/padres/access')
      return
    }
  }

  pollingId = setInterval(refrescarSesion, POLLING_MS)
})

onBeforeUnmount(() => {
  if (pollingId !== null) {
    clearInterval(pollingId)
    pollingId = null
  }
})
</script>

<template>
  <q-page class="dashboard-padre">
    <div class="dashboard-container">
      <!-- Hero card: brand + welcome -->
      <header class="hero-card">
        <div class="hero-inner">
          <div class="hero-logo-wrap">
            <img src="/woow-kids-mascot.png" alt="Woow Kids" class="hero-logo" />
          </div>
          <div class="hero-body">
            <p class="hero-greeting">Bienvenido,</p>
            <h1 class="hero-name">{{ store.currentTutor?.nombreCompleto }}</h1>
            <div class="hero-meta">
              <span class="hero-meta-brand">Woow Kids</span>
              <span class="hero-meta-sep">·</span>
              <span class="hero-meta-sub">Centro de entretenimiento infantil</span>
            </div>
            <div class="hero-location">
              <q-icon name="location_on" size="14px" class="hero-loc-icon" />
              <span>{{ store.currentTutor?.sucursal.nombre }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Empty state -->
      <div v-if="store.allChildren.length === 0" class="empty-state column items-center">
        <q-icon name="child_care" size="64px" color="grey-3" />
        <h2 class="text-h6 text-weight-semibold text-grey-7 q-mt-md q-mb-xs">
          Sin niños registrados
        </h2>
        <p class="text-body2 text-grey-5 text-center" style="max-width: 280px">
          Por el momento no hay ningún menor de edad registrado con esta cuenta.
        </p>
      </div>

      <!-- Active children -->
      <div v-if="store.activeChildren.length > 0" class="section-block">
        <h2 class="section-title">Visitas activas</h2>
        <div class="children-list">
          <HijoCard v-for="nino in store.activeChildren" :key="nino.id" :nino="nino" />
        </div>
      </div>

      <!-- Terminated children -->
      <div v-if="store.terminatedChildren.length > 0" class="section-block q-mt-lg">
        <h2 class="section-title section-title--muted">Visitas finalizadas</h2>
        <div class="children-list">
          <HijoCard v-for="nino in store.terminatedChildren" :key="nino.id" :nino="nino" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
/* ── Page ─────────────────────────────────────────── */
.dashboard-padre {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-main) 100%);
  padding: 0;
  padding-bottom: 48px;
}

.dashboard-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px 16px 40px;
}

@media (max-width: 380px) {
  .dashboard-container {
    padding: 16px 12px 32px;
  }

  .hero-inner {
    padding: 16px;
    gap: 12px;
  }

  .hero-logo-wrap {
    width: 48px;
    height: 48px;
  }

  .hero-logo {
    width: 28px;
    height: 28px;
  }

  .hero-greeting {
    font-size: 13px;
  }
}

/* ── Hero card ────────────────────────────────────── */
.hero-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.05),
    0 8px 10px -6px rgba(0, 0, 0, 0.04);
  margin-bottom: 28px;
  overflow: hidden;
}

.hero-inner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
}

/* ── Logo ─────────────────────────────────────────── */
.hero-logo-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.hero-logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

/* ── Body ─────────────────────────────────────────── */
.hero-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.hero-greeting {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.3;
}

.hero-name {
  font-size: clamp(20px, 5vw, 26px);
  font-weight: 800;
  color: #025fe0;
  margin: 0 0 4px;
  line-height: 1.2;
  letter-spacing: -0.01em;
  word-break: break-word;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  font-size: 12px;
  margin-bottom: 4px;
}

.hero-meta-brand {
  font-weight: 700;
  color: var(--text-primary);
}

.hero-meta-sep {
  color: var(--border-color);
}

.hero-meta-sub {
  font-weight: 500;
  color: var(--text-muted);
}

.hero-location {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.hero-loc-icon {
  color: #025fe0;
  font-size: 15px;
}

/* ── Empty state ──────────────────────────────────── */
.empty-state {
  padding: 48px 16px;
  text-align: center;
}

/* ── Sections ─────────────────────────────────────── */
.section-block {
  width: 100%;
}

.section-title {
  font-size: clamp(11px, 3vw, 12px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  margin: 0 0 14px;
  padding-left: 4px;
}

.section-title--muted {
  color: var(--text-muted);
}

.children-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
</style>
