<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useRegistrationStore } from '@/stores/registration'
import TutorForm from '@/components/registro-infantes/TutorForm.vue'
import ChildrenSection from '@/components/registro-infantes/ChildrenSection.vue'
import OrderSummary from '@/components/registro-infantes/OrderSummary.vue'
import RfidSection from '@/components/registro-infantes/RfidSection.vue'
import PrintVoucher from '@/components/registro-infantes/PrintVoucher.vue'

const store = useRegistrationStore()

// Reset on page leave
onUnmounted(() => {
  store.reset()
})
</script>

<template>
  <q-page class="registration-page q-pa-lg">
    <!-- Page header -->
    <div class="row items-center q-mb-lg">
      <div class="page-icon-wrap q-mr-md">
        <q-icon name="how_to_reg" size="26px" color="primary" />
      </div>
      <div>
        <div class="text-h5 text-weight-bold">Registro de Entrada</div>
        <div class="text-caption text-grey-6">
          Ingreso de nuevos visitantes y vinculación de pulseras.
        </div>
      </div>

      <!-- Step indicator -->
      <q-space />
      <div class="row q-gutter-sm items-center">
        <q-chip
          :color="store.step === 'form' ? 'primary' : 'grey-3'"
          :text-color="store.step === 'form' ? 'white' : 'grey-7'"
          icon="edit_note"
          label="1. Datos"
          dense
        />
        <q-icon name="chevron_right" color="grey-4" />
        <q-chip
          :color="
            store.step === 'rfid' ? 'primary' : store.step === 'complete' ? 'positive' : 'grey-3'
          "
          :text-color="['rfid', 'complete'].includes(store.step) ? 'white' : 'grey-7'"
          icon="nfc"
          label="2. RFID"
          dense
        />
        <q-icon name="chevron_right" color="grey-4" />
        <q-chip
          :color="store.step === 'complete' ? 'positive' : 'grey-3'"
          :text-color="store.step === 'complete' ? 'white' : 'grey-7'"
          icon="check_circle"
          label="3. Listo"
          dense
        />
      </div>
    </div>

    <!-- Voucher shown on complete -->
    <div v-if="store.step === 'complete'" class="q-mb-lg">
      <PrintVoucher />
      <div class="text-center q-mt-md">
        <q-btn flat color="primary" icon="add" label="Nuevo registro" @click="store.reset()" />
      </div>
    </div>

    <!-- Main form layout -->
    <div v-else class="row q-col-gutter-lg">
      <!-- Left column -->
      <div class="col-12 col-md-8">
        <TutorForm />
        <ChildrenSection v-if="store.step === 'form'" />

        <!-- RFID Section appears after payment -->
        <RfidSection v-if="store.step === 'rfid'" />
      </div>

      <!-- Right column: summary -->
      <div class="col-12 col-md-4">
        <OrderSummary />
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.registration-page {
  background: #f7f8fc;
  min-height: 100vh;
}

.page-icon-wrap {
  background: #e8f0fe;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
