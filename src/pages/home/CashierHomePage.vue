<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <q-page class="flex flex-center">
    <div class="text-center">
      <q-icon name="point_of_sale" color="secondary" size="64px" />
      <h1 class="text-h5 text-weight-bold q-mt-md q-mb-xs">Panel de Cajero</h1>
      <p class="text-body2 text-grey-6">
        Bienvenido, <strong>{{ auth.currentUser?.name ?? auth.currentUser?.email }}</strong
        >.
      </p>
      <q-chip color="secondary" text-color="white" icon="badge" class="q-mt-sm">Cajero</q-chip>
    </div>
  </q-page>
</template>
