<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <q-page class="flex flex-center">
    <div class="text-center">
      <q-icon name="check_circle" color="positive" size="64px" />
      <h1 class="text-h5 text-weight-bold q-mt-md q-mb-xs">Sesión iniciada</h1>
      <p class="text-body2 text-grey-6">
        Bienvenido, <strong>{{ auth.currentUser?.name ?? auth.currentUser?.email }}</strong>.
      </p>
    </div>
  </q-page>
</template>
