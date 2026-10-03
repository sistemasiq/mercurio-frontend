<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePadresAuthStore } from '@/stores/padres/padresAuthStore'

const route = useRoute()
const router = useRouter()
const store = usePadresAuthStore()

const validating = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

let isMounted = true

onMounted(async () => {
  const rawCode = route.query.code
  const code =
    typeof rawCode === 'string' ? rawCode : Array.isArray(rawCode) ? rawCode[0] : undefined

  if (!code) {
    hasError.value = true
    errorMessage.value = 'No se recibió un token de acceso. Revisa el enlace que te proporcionamos.'
    return
  }

  validating.value = true
  store.clearError()

  try {
    await store.loginConCode(code)
    if (!isMounted) return
    router.replace('/padres/dashboard')
  } catch {
    if (!isMounted) return
    hasError.value = true
    errorMessage.value =
      store.error || 'El enlace de acceso no es válido o ha expirado. Solicita uno nuevo.'
  } finally {
    if (isMounted) validating.value = false
  }
})

onUnmounted(() => {
  isMounted = false
})
</script>

<template>
  <q-page class="access-padre">
    <div v-if="validating" class="access-padre__state">
      <q-spinner-rings color="primary" size="48px" />
      <span class="access-padre__text">Validando acceso…</span>
    </div>

    <div v-else-if="hasError" class="access-padre__state" role="alert">
      <span class="access-padre__icon"><q-icon name="link_off" size="32px" /></span>
      <h1 class="access-padre__title">Acceso no válido</h1>
      <p class="access-padre__text">{{ errorMessage }}</p>
      <p class="access-padre__text">Pide un enlace nuevo en recepción al registrar a tu hijo.</p>
    </div>
  </q-page>
</template>

<style scoped lang="scss">
.access-padre {
  min-height: 100vh;
  padding: 24px 32px;
  background: var(--bg-main);
  display: flex;
  align-items: center;
  justify-content: center;

  &__state {
    max-width: 340px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    text-align: center;
  }

  &__icon {
    width: 64px;
    height: 64px;
    border-radius: 32px;
    background: var(--tone-bad-bg);
    color: var(--tone-bad-fg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__text {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #475569;
  }
}
</style>
