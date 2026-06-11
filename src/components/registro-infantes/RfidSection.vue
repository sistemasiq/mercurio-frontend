<script setup lang="ts">
import { ref } from 'vue'
import { useRegistrationStore } from '@/stores/registration'

interface BraceletOption {
  id: string
  label: string
  inUse: boolean
}

const store = useRegistrationStore()
const filteredOptions = ref<Record<string, BraceletOption[]>>({})

function filterFn(val: string, update: (callback: () => void) => void, childId: string) {
  const allAvailable = store.availableBraceletsForChild(childId)

  if (val === '') {
    update(() => {
      filteredOptions.value[childId] = allAvailable
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    // Filtramos la lista buscando coincidencias por el texto o etiqueta de la pulsera
    filteredOptions.value[childId] = allAvailable.filter(
      (v) => v.label.toLowerCase().indexOf(needle) > -1,
    )
  })
}
</script>

<template>
  <q-card flat bordered class="rfid-card q-mb-md">
    <q-card-section>
      <div class="row items-center q-mb-md">
        <q-icon name="nfc" size="22px" color="blue-8" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-bold">Vinculación RFID</span>
        <q-chip
          dense
          :color="store.allChildrenHaveBracelet ? 'positive' : 'orange'"
          text-color="white"
          :label="
            store.allChildrenHaveBracelet
              ? 'Todos vinculados'
              : `${store.savedChildren.filter((c) => c.rfidBracelet).length}/${store.savedChildren.length} vinculados`
          "
          size="sm"
          class="q-ml-sm"
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
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            :options="filteredOptions[child.id] || store.availableBraceletsForChild(child.id)"
            option-value="id"
            option-label="label"
            emit-value
            map-options
            label="Escribe o escanea..."
            outlined
            dense
            clearable
            :color="child.rfidBracelet ? 'positive' : 'primary'"
            @filter="(val, update) => filterFn(val, update, child.id)"
          >
            <template #prepend>
              <q-icon name="nfc" size="16px" :color="child.rfidBracelet ? 'positive' : 'grey-6'" />
            </template>
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey"> No disponible o no existe </q-item-section>
              </q-item>
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
  background: #fafafa;
}
.rfid-assigned {
  background: #f0fdf4;
  border-color: #86efac;
}
</style>
