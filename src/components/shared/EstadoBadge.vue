<template>
  <StatusBadge :tone="TONOS[tono]" :label="label" />
</template>

<script setup lang="ts">
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { UiTone } from '@/types/ui'

type Tono = 'verde' | 'rojo' | 'naranja' | 'azul' | 'gris'

defineProps<{
  tono: Tono
  label: string
}>()

const TONOS: Record<Tono, UiTone> = {
  verde: 'ok',
  rojo: 'bad',
  naranja: 'warn',
  azul: 'info',
  gris: 'off',
}
</script>
