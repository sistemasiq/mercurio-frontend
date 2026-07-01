<script setup lang="ts">
import { useRegistrationStore } from '@/stores/registration'

const store = useRegistrationStore()

function availableOptions(childId: string) {
  return store.availableBraceletsForChild(childId)
}
</script>

<template>
  <q-card flat bordered class="rfid-card q-mb-md">
    <q-card-section>
      <div class="row items-center q-mb-md">
        <q-icon name="nfc" size="22px" color="blue-8" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-bold">Pulseras</span>
        <q-chip
          dense
          :color="store.allChildrenHaveBracelet ? 'positive' : 'orange'"
          text-color="store.allChildrenHaveBracelet ? 'white' : 'black'"
          :label="
            store.allChildrenHaveBracelet
              ? 'Todos con pulsera'
              : `${store.savedChildren.filter((c) => c.rfidBracelet).length}/${store.savedChildren.length} con pulsera asignada`
          "
          size="md"
          class="q-ml-md"
        />
      </div>

      <div
        v-for="child in store.savedChildren"
        :key="child.id"
        class="rfid-row row items-center q-mb-sm q-pa-sm"
        :class="child.rfidBracelet ? 'rfid-assigned' : 'rfid-pending'"
      >
        <q-icon
          :name="child.rfidBracelet ? 'check_circle' : 'radio_button_unchecked'"
          :color="child.rfidBracelet ? 'positive' : 'grey-5'"
          size="20px"
          class="q-mr-sm"
        />
        <div class="col">
          <div class="text-weight-medium" style="font-size: 13px">{{ child.name }}</div>
          <div class="text-caption text-grey-6">{{ child.age }} años</div>
        </div>

        <div style="width: 180px">
          <q-select
            v-model="child.rfidBracelet"
            :options="availableOptions(child.id)"
            option-value="id"
            option-label="pulsera_rfid"
            emit-value
            map-options
            label="Pulsera"
            outlined
            dense
            clearable
            lazy-rules
            :rules="[
              (val) =>
                (val !== null && val !== undefined && val !== '') || 'La pulsera es obligatoria',
            ]"
            :color="child.rfidBracelet ? 'positive' : 'primary'"
          >
            <template #prepend>
              <q-icon name="nfc" size="16px" :color="child.rfidBracelet ? 'positive' : 'grey-6'" />
            </template>
          </q-select>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.rfid-card {
  border-radius: 12px;
}
.rfid-row {
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}
.rfid-pending {
  background: #fff5f5;
  border-color: #fee2e2;
}
.rfid-assigned {
  background: #f0fdf4;
  border-color: #86efac;
}
</style>
