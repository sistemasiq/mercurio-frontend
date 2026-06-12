<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { userService } from '@/services/userService'
import type { UserListItem } from '@/types/user'

const users = ref<UserListItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const totalUsers = computed(() => users.value.length)
const activeUsers = computed(() => users.value.filter((u) => u.isActive).length)

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    users.value = await userService.listUsers()
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
              <span v-else>{{ totalUsers }}</span>
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
              <span v-else>{{ activeUsers }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>
