<script setup lang="ts">
import { useRegistrationStore } from '@/stores/registration'
import type { Child } from '@/stores/registration'
import ChildCard from './ChildCard.vue'

const store = useRegistrationStore()

function getChildFirstName(child: Child, index: number) {
  if (child.name && child.name.trim()) {
    return child.name.trim().split(' ')[0]
  }
  return `Niño ${index + 1}`
}
</script>

<template>
  <q-card flat bordered class="registration-card q-mb-md">
    <q-card-section>
      <!-- Header -->
      <div class="row items-center q-mb-md">
        <q-icon name="child_care" size="22px" color="amber-8" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-bold">Niños Registrados</span>

        <!-- Pagination indicator -->
        <div class="row items-center q-ml-sm text-caption text-grey-7">
          <q-btn
            flat
            dense
            round
            icon="chevron_left"
            size="xs"
            :disable="store.currentChildIndex === 0"
            @click="store.currentChildIndex--"
          />
          <span class="q-px-xs">
            {{ store.currentChildIndex + 1 }} / {{ store.children.length }}
          </span>
          <q-btn
            flat
            dense
            round
            icon="chevron_right"
            size="xs"
            :disable="store.currentChildIndex === store.children.length - 1"
            @click="store.currentChildIndex++"
          />
        </div>

        <q-space />

        <!-- Saved badge -->
        <q-chip
          v-if="store.savedChildren.length > 0"
          dense
          color="positive"
          text-color="white"
          icon="check"
          :label="`${store.savedChildren.length} guardado${store.savedChildren.length > 1 ? 's' : ''}`"
          size="lg"
        />

        <!-- Add child -->
        <q-btn
          flat
          dense
          icon="add_circle_outline"
          label="Agregar otro niño"
          color="primary"
          size="md"
          class="q-ml-md"
          :disable="store.step !== 'form' || store.reachedBraceletLimit"
          @click="(store.addChild(), (store.currentChildIndex = store.children.length - 1))"
        />
      </div>

      <!-- Aviso de límite de pulseras (Solo aparece a partir del segundo niño si se llega al límite) -->
      <q-banner
        v-if="store.showBraceletLimitBanner"
        dense
        rounded
        class="bg-orange-1 text-orange-9 q-mb-sm"
        style="font-size: 13px"
      >
        <template #avatar>
          <q-icon name="warning" color="orange-9" size="18px" />
        </template>
        Hay {{ store.pulseras.length }} pulseras disponibles en este momento, pero una corresponde
        al tutor. No es posible registrar más de {{ store.maxChildrenAllowed }}
        {{ store.maxChildrenAllowed === 1 ? 'niño' : 'niños' }}.
      </q-banner>

      <!-- Show only the current child -->
      <ChildCard :index="store.currentChildIndex" />

      <!-- Unsaved chips navigation -->
      <div v-if="store.children.length > 1" class="row q-gutter-sm q-mt-md">
        <q-chip
          v-for="(child, i) in store.children"
          :key="child.id"
          clickable
          :color="i === store.currentChildIndex ? 'primary' : child.saved ? 'positive' : 'grey-3'"
          :text-color="i === store.currentChildIndex || child.saved ? 'white' : 'grey-9'"
          :icon="child.saved ? 'check' : 'edit'"
          :label="getChildFirstName(child, i)"
          size="lg"
          class="text-weight-medium q-px-lg"
          @click="store.currentChildIndex = i"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.registration-card {
  border-radius: 12px;
}
</style>
