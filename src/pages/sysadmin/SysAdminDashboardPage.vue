<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userService } from '@/services/userService'
import type { SystemStats } from '@/types/user'

const stats = ref<SystemStats | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    stats.value = await userService.getStats()
  } catch {
    error.value = 'No se pudieron cargar las estadísticas.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-lg">Dashboard</div>

    <q-banner v-if="error" class="bg-negative text-white q-mb-md" rounded>
      {{ error }}
    </q-banner>

    <div class="row q-gutter-md">
      <q-card class="col-12 col-sm-3">
        <q-card-section class="flex items-center no-wrap q-gutter-md">
          <q-icon name="group" color="primary" size="48px" />
          <div>
            <div class="text-body2 text-grey-7">Usuarios totales</div>
            <div class="text-h4 text-weight-bold">
              <q-skeleton v-if="loading" type="text" width="40px" />
              <span v-else>{{ stats?.totalUsers ?? '—' }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-12 col-sm-3">
        <q-card-section class="flex items-center no-wrap q-gutter-md">
          <q-icon name="person_check" color="positive" size="48px" />
          <div>
            <div class="text-body2 text-grey-7">Usuarios activos</div>
            <div class="text-h4 text-weight-bold">
              <q-skeleton v-if="loading" type="text" width="40px" />
              <span v-else>{{ stats?.activeUsers ?? '—' }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-12 col-sm-3">
        <q-card-section class="flex items-center no-wrap q-gutter-md">
          <q-icon name="store" color="secondary" size="48px" />
          <div>
            <div class="text-body2 text-grey-7">Sucursales</div>
            <div class="text-h4 text-weight-bold">
              <q-skeleton v-if="loading" type="text" width="40px" />
              <span v-else>{{ stats?.totalBranches ?? '—' }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>
