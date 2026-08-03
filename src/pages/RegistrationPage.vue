<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRegistrationStore } from '@/stores/registration'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { useRouter } from 'vue-router'
import TutorForm from '@/components/registro-infantes/TutorForm.vue'
import ChildrenSection from '@/components/registro-infantes/ChildrenSection.vue'
import OrderSummary from '@/components/registro-infantes/OrderSummary.vue'
import RfidSection from '@/components/registro-infantes/RfidSection.vue'
import PrintVoucher from '@/components/registro-infantes/PrintVoucher.vue'

const store = useRegistrationStore()
const turno = useTurnoCajaStore()
const router = useRouter()

onMounted(() => {
  // Se valida al entrar, no hasta el final del registro: si no hay turno
  // abierto no tiene sentido dejar llenar todo el formulario del tutor/niño
  // para enterarse hasta el final. Redirige de inmediato, sin bloquear con un panel.
  if (!turno.estaOperando) {
    router.push('/pos/cierre')
    return
  }
  store.loadProductos()
})

onUnmounted(() => {
  store.reset()
})
</script>

<template>
  <q-page class="registration-page q-pa-lg">
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
          label="2. Pulseras"
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

    <div v-if="store.step === 'complete'" class="q-mb-lg">
      <PrintVoucher />
      <div class="text-center q-mt-md">
        <q-btn flat color="primary" icon="add" label="Volver" @click="router.back()" />
      </div>
    </div>

    <div v-else class="row q-col-gutter-lg">
      <div class="col-12 col-md-8">
        <TutorForm />
        <ChildrenSection v-if="store.step === 'form'" />
        <RfidSection v-if="store.step === 'rfid'" />
      </div>

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
