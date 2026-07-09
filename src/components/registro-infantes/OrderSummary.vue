<script setup lang="ts">
import { useRegistrationStore } from '@/stores/registration'

const store = useRegistrationStore()

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}
</script>

<template>
  <q-card flat bordered class="summary-card">
    <q-card-section>
      <div class="text-subtitle1 text-weight-bold q-mb-md">Resumen</div>

      <q-banner
        v-if="store.submitError"
        dense
        rounded
        class="bg-red-1 text-red-9 q-mb-md"
        style="font-size: 12px"
      >
        <template #avatar>
          <q-icon name="error_outline" color="negative" />
        </template>
        {{ store.submitError }}
      </q-banner>

      <div
        v-if="store.savedChildren.length === 0"
        class="text-caption text-grey-6 text-center q-py-md"
      >
        Guarda un niño para ver el resumen
      </div>

      <template v-else>
        <div
          v-for="child in store.savedChildren"
          :key="child.id"
          class="row justify-between items-center q-mb-xs"
        >
          <span class="text-body2 text-grey-8">
            1× ({{ child.name }}) ({{ store.tutor.estimatedTime }})
          </span>
          <span class="text-body2">{{ formatCurrency(store.pricePerChild) }}</span>
        </div>

        <q-separator class="q-my-sm" />

        <div class="row justify-between items-center q-mb-md">
          <span class="text-subtitle2 text-weight-bold">Total a Pagar</span>
          <span class="text-h5 text-primary text-weight-bold">{{
            formatCurrency(store.total)
          }}</span>
        </div>
      </template>

      <template v-if="store.step === 'form'">
        <q-btn
          unelevated
          color="primary"
          class="full-width q-mb-xs"
          label="Completar pago"
          icon="payment"
          :disable="!store.canProceedToRFID"
          @click="store.proceedToRFID()"
        />
        <div class="text-caption text-grey-6 text-center">
          Asegúrate de ingresar todos los datos
        </div>
      </template>

      <template v-if="store.step === 'rfid'">
        <q-banner dense rounded class="bg-blue-1 text-blue-9 q-mb-md" style="font-size: 12px">
          <template #avatar>
            <q-icon name="nfc" color="blue-8" />
          </template>
          Pago registrado. Asigna las pulseras a cada niño para finalizar.
        </q-banner>

        <q-btn
          unelevated
          color="positive"
          class="full-width"
          label="Completar registro e Imprimir Comprobante"
          icon="print"
          :loading="store.isSubmitting"
          :disable="!store.allChildrenHaveBracelet"
          @click="store.completeRegistration()"
        />
        <div
          v-if="!store.allChildrenHaveBracelet"
          class="text-caption text-grey-6 text-center q-mt-xs"
        >
          Asigna una pulsera a cada niño registrado
        </div>
      </template>

      <template v-if="store.step === 'complete'">
        <q-banner dense rounded class="bg-green-1 text-green-9" style="font-size: 12px">
          <template #avatar>
            <q-icon name="check_circle" color="positive" />
          </template>
          Registro completado correctamente.
        </q-banner>
      </template>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.summary-card {
  border-radius: 12px;
  position: sticky;
  top: 80px;
}
</style>
