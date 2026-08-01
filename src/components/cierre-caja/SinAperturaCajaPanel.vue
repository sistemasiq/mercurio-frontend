<template>
  <div class="sac-panel">
    <q-icon name="lock" size="56px" color="amber-8" class="q-mb-md" />
    <div class="sac-panel__titulo">Necesitas abrir caja</div>
    <div class="sac-panel__mensaje">
      <slot>No puedes continuar sin un turno de caja abierto (operando).</slot>
    </div>
    <q-btn
      unelevated
      no-caps
      color="primary"
      icon="key"
      label="Ir a Apertura de Caja"
      class="q-mt-lg"
      @click="router.push('/pos/cierre')"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.sac-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 64px 24px;
}
.sac-panel__titulo {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}
.sac-panel__mensaje {
  font-size: 0.95rem;
  color: #64748b;
  max-width: 380px;
}
</style>
