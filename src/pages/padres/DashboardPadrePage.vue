<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePadresAuthStore } from '@/stores/padres/padresAuthStore'
import HijoCard from '@/components/padres/HijoCard.vue'

const route = useRoute()
const router = useRouter()
const store = usePadresAuthStore()

const nombreCorto = computed(() => store.currentTutor?.nombreCompleto.split(' ')[0] ?? '')

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
    // Igual que en AccessPadrePage: el código es una credencial y debe salir
    // de la URL antes de esperar la respuesta del backend, no después.
    await router.replace({ query: {} })
    try {
      await store.loginConCode(codeFromQuery)
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
  <q-page class="padres">
    <header class="padres-hero">
      <div class="padres-hero__inner">
        <div class="padres-hero__brand">
          <img src="/woow-kids-mascot.png" alt="" class="padres-hero__mascot" />
          <div class="padres-hero__brand-text">
            <span class="padres-hero__name">Woow Kids</span>
            <span class="padres-hero__branch">{{ store.currentTutor?.sucursal.nombre }}</span>
          </div>
        </div>
        <h1 class="padres-hero__hello">Hola, {{ nombreCorto }}</h1>
      </div>
    </header>

    <div class="padres-body">
      <div v-if="store.currentTutor?.lealtad" class="padres-points">
        <span class="padres-points__icon"><q-icon name="stars" size="22px" /></span>
        <div class="padres-points__text">
          <span class="padres-points__label">Tus puntos Woow</span>
          <span class="padres-points__value">{{ store.currentTutor.lealtad.saldo }} pts</span>
        </div>
      </div>

      <div v-if="store.allChildren.length === 0" class="padres-empty">
        <span class="padres-empty__icon"><q-icon name="child_care" size="28px" /></span>
        <span class="padres-empty__title">Sin visitas registradas</span>
        <span class="padres-empty__text">
          Por el momento no hay ningún menor registrado con esta cuenta.
        </span>
      </div>

      <section v-if="store.activeChildren.length > 0" class="padres-section">
        <h2 class="padres-section__title">Visitas activas</h2>
        <HijoCard v-for="nino in store.activeChildren" :key="nino.id" :nino="nino" />
      </section>

      <section v-if="store.terminatedChildren.length > 0" class="padres-section">
        <h2 class="padres-section__title padres-section__title--muted">Visitas finalizadas</h2>
        <HijoCard v-for="nino in store.terminatedChildren" :key="nino.id" :nino="nino" />
      </section>
    </div>
  </q-page>
</template>

<style scoped lang="scss">
.padres {
  min-height: 100vh;
  background: var(--bg-main);
}

.padres-hero {
  background: var(--text-strong);
  color: #fff;

  &__inner {
    max-width: 480px;
    margin: 0 auto;
    padding: 44px 22px 26px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__mascot {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    object-fit: cover;
  }

  &__brand-text {
    display: flex;
    flex-direction: column;
  }

  &__name {
    font-size: 15px;
    font-weight: 800;
  }

  &__branch {
    font-size: 11.5px;
    color: #aeb8e8;
  }

  &__hello {
    margin: 0;
    font-size: 22px;
    line-height: 1.25;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
}

.padres-body {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px 18px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.padres-points {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 14px 16px;

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

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-secondary);
  }

  &__value {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-strong);
  }
}

.padres-section {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__title {
    margin: 0;
    font-size: 15px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);

    &--muted {
      color: var(--text-secondary);
    }
  }
}

.padres-empty {
  padding: 48px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;

  &__icon {
    width: 52px;
    height: 52px;
    border-radius: 26px;
    background: var(--tone-off-bg);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    font-size: 16px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__text {
    max-width: 280px;
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--text-secondary);
  }
}
</style>
