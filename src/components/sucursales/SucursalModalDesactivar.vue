<template>
  <BaseDialog
    v-model="show"
    title="Desactivar sucursal"
    :subtitle="sucursal?.nombre"
    icon="block"
    tone="red"
    danger
    :width="480"
    primary-label="Desactivar"
    :primary-disabled="confirmacion.trim() !== (sucursal?.nombre ?? '')"
    @confirm="onConfirmar"
  >
    <div class="dlg-stack">
      <p class="dlg-body">
        Se suspenderán las operaciones de esta sucursal: los empleados perderán el acceso al sistema
        y las transacciones pendientes podrían detenerse. Puedes reactivarla después.
      </p>
      <label class="form-grid__field">
        <span class="field-label">Escribe el nombre para confirmar</span>
        <q-input v-model="confirmacion" dense outlined autofocus :placeholder="sucursal?.nombre" />
      </label>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { Sucursal } from '@/composables/useSucursales'

defineProps<{ sucursal: Sucursal | null }>()
const emit = defineEmits<{ (e: 'confirmar'): void }>()

const show = defineModel<boolean>({ required: true })
const confirmacion = ref('')

watch(show, (v) => {
  if (v) confirmacion.value = ''
})

function onConfirmar() {
  emit('confirmar')
  show.value = false
}
</script>

<style scoped>
.dlg-body {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-secondary);
}
</style>
