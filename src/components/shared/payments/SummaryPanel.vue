<template>
  <q-card flat class="bg-white q-pa-md rounded-borders">
    <!-- Total Principal -->
    <div class="row justify-between items-center">
      <span class="text-h6 text-weight-bold text-grey-9">Total a Pagar</span>
      <span class="text-h4 text-weight-bolder text-primary">${{ total.toFixed(2) }}</span>
    </div>

    <!-- Saldo Pendiente (Dinámico) -->
    <div class="row justify-between items-center q-mt-sm">
      <span class="text-subtitle1 text-grey-8">Saldo Pendiente</span>
      <!-- Cambia a color verde cuando llega a 0 -->
      <span
        class="text-h6 text-weight-bold"
        :class="saldoPendiente <= 0 ? 'text-positive' : 'text-orange-9'"
      >
        ${{ saldoPendiente.toFixed(2) }}
      </span>
    </div>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  total: number
  saldoPendiente: number
}>()
</script>
