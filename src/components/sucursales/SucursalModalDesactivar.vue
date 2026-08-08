<template>
  <q-dialog
    v-model="show"
    backdrop-filter="blur(3px) brightness(0.55)"
    @hide="emit('update:modelValue', false)"
  >
    <q-card class="modal-card">
      <!-- Header: ícono + info de la sucursal -->
      <q-card-section class="modal-header">
        <div class="warning-icon-wrap">
          <q-icon name="warning" size="26px" color="negative" />
        </div>
        <div class="modal-info">
          <div class="modal-titulo">Desactivar Sucursal</div>
          <div class="modal-clave">{{ sucursal?.clave }} {{ sucursal?.nombre }}</div>
          <div class="modal-ubicacion">{{ sucursal?.nombre }}, {{ sucursal?.ciudad }}</div>
        </div>
      </q-card-section>

      <!-- Caja de advertencia -->
      <q-card-section class="q-pt-none">
        <div class="warning-box">
          <span class="warning-label">Advertencia:</span>
          Esta acción suspenderá todas las operaciones de esta ubicación. Los empleados perderán el
          acceso al sistema y las transacciones locales pendientes podrían detenerse.
        </div>
      </q-card-section>

      <!-- Botones -->
      <q-card-actions class="modal-actions">
        <q-btn flat no-caps color="grey-7" label="Cancelar" class="btn-cancelar" @click="show = false" />
        <q-btn
          unelevated
          no-caps
          color="negative"
          label="Confirmar Desactivación"
          class="btn-confirmar"
          @click="onConfirmar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Sucursal } from '@/composables/useSucursales'

interface Props {
  modelValue: boolean
  sucursal: Sucursal | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirmar'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function onConfirmar() {
  emit('confirmar')
  show.value = false
}
</script>

<style scoped lang="scss">
.modal-card {
  width: 420px;
  max-width: 95vw;
  border-radius: 12px;
  padding: 8px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 12px;
}

.warning-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background-color: rgba(220, 38, 38, 0.1);
  flex-shrink: 0;
}

.modal-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.modal-titulo {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.modal-clave {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-top: 4px;
}

.modal-ubicacion {
  font-size: 12px;
  color: var(--text-muted);
}

.warning-box {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;

  .warning-label {
    color: var(--q-negative);
    font-weight: 700;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px;

  .btn-cancelar {
    padding: 0 20px;
  }

  .btn-confirmar {
    padding: 0 20px;
    border-radius: 8px;
    font-weight: 600;
  }
}
</style>
