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
  <q-page class="access-padre flex flex-center">
    <transition
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
      mode="out-in"
    >
      <!-- VALIDANDO -->
      <div v-if="validating" key="loading" class="column items-center">
        <q-spinner-rings color="primary" size="48px" />
        <p class="text-body2 text-grey-7 q-mt-md">Validando acceso...</p>
      </div>

      <!-- ERROR / SIN TOKEN -->
      <q-card v-else-if="hasError" key="error" class="error-card">
        <q-card-section class="column items-center q-pa-lg">
          <q-icon name="warning_amber" color="warning" size="56px" />
          <h2 class="text-h6 text-weight-bold q-mt-md q-mb-xs">Acceso no válido</h2>
          <p class="text-body2 text-grey-7 text-center q-mb-none" style="max-width: 320px">
            {{ errorMessage }}
          </p>
        </q-card-section>
      </q-card>
    </transition>
  </q-page>
</template>

<style scoped>
.access-padre {
  height: 100% !important;
  min-height: 100vh;
  padding: 24px;
  background: var(--bg-main);
}

.error-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
}
</style>
