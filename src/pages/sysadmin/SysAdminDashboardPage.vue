<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { userService } from '@/services/userService'
import { branchService } from '@/services/branchService'
import type { UserListItem } from '@/types/user'
import type { Branch } from '@/types/branch'

const $q = useQuasar()
const router = useRouter()

const users = ref<UserListItem[]>([])
const branches = ref<Branch[]>([])
const loading = ref(true)

const totalUsers = computed(() => users.value.length)
const activeBranches = computed(() => branches.value.filter((b) => b.isActive).length)
const branchList = computed(() => branches.value.slice(0, 5))

onMounted(async () => {
  try {
    const [u, b] = await Promise.all([userService.listUsers(), branchService.listBranches()])
    users.value = u
    branches.value = b
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar datos del dashboard.' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <q-page padding class="dashboard">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Bienvenido al panel de control de TEC-FS.</p>
      </div>
      <div class="row q-gutter-sm">
        <q-btn outline color="grey-7" label="Descargar reporte" icon="download" dense />
        <q-btn
          unelevated
          color="primary"
          label="Nueva sucursal"
          icon="add"
          dense
          @click="router.push({ name: 'sysadmin-branches-new' })"
        />
      </div>
    </div>

    <!-- Stat cards -->
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-card__icon" style="background: #eff6ff">
          <q-icon name="group" color="blue" size="22px" />
        </div>
        <div class="stat-card__body">
          <div v-if="loading" class="stat-card__val">
            <q-skeleton type="text" width="60px" />
          </div>
          <div v-else class="stat-card__val">{{ totalUsers.toLocaleString() }}</div>
          <div class="stat-card__label">Total Usuarios</div>
        </div>
        <q-badge color="blue" outline label="Sistema" class="stat-card__badge" />
      </div>

      <div class="stat-card">
        <div class="stat-card__icon" style="background: #f0fdf4">
          <q-icon name="store" color="green" size="22px" />
        </div>
        <div class="stat-card__body">
          <div v-if="loading" class="stat-card__val">
            <q-skeleton type="text" width="60px" />
          </div>
          <div v-else class="stat-card__val">{{ activeBranches }}</div>
          <div class="stat-card__label">Sucursales Activas</div>
        </div>
        <q-badge color="green" outline label="Operativas" class="stat-card__badge" />
      </div>

      <div class="stat-card">
        <div class="stat-card__icon" style="background: #fff7ed">
          <q-icon name="speed" color="orange" size="22px" />
        </div>
        <div class="stat-card__body">
          <div class="stat-card__val">99.98%</div>
          <div class="stat-card__label">Uptime</div>
        </div>
        <q-badge color="orange" outline label="Alta disp." class="stat-card__badge" />
      </div>

      <div class="stat-card">
        <div class="stat-card__icon" style="background: #f0fdf4">
          <q-icon name="security" color="green" size="22px" />
        </div>
        <div class="stat-card__body">
          <div class="stat-card__val" style="font-size: 20px">Protegido</div>
          <div class="stat-card__label">Seguridad</div>
        </div>
        <q-badge color="green" outline label="OK" class="stat-card__badge" />
      </div>
    </div>

    <!-- Bottom grid -->
    <div class="bottom-grid">
      <!-- Estado de sucursales -->
      <div class="panel">
        <div class="panel__header">
          <span class="panel__title">Estado de Sucursales</span>
          <q-btn
            flat
            dense
            color="primary"
            label="Ver todas"
            size="sm"
            @click="router.push({ name: 'sysadmin-branches' })"
          />
        </div>

        <div v-if="loading" class="q-pa-md">
          <q-skeleton v-for="i in 4" :key="i" type="text" class="q-mb-sm" />
        </div>

        <div v-else-if="branchList.length === 0" class="panel__empty">
          <q-icon name="store" size="32px" color="grey-4" />
          <div class="text-grey-5">No hay sucursales registradas.</div>
        </div>

        <div v-else>
          <div v-for="branch in branchList" :key="branch.id" class="branch-row">
            <div
              class="branch-dot"
              :style="{ background: branch.isActive ? '#16a34a' : '#ef4444' }"
            />
            <div class="branch-name">{{ branch.nombre }}</div>
            <q-badge
              :color="branch.isActive ? 'green' : 'red'"
              :label="branch.isActive ? 'Activa' : 'Inactiva'"
              outline
              class="branch-badge"
            />
          </div>
        </div>
      </div>

      <!-- Panel derecho -->
      <div class="panel panel--blue">
        <div class="panel__header">
          <span class="panel__title" style="color: #fff">Últimos movimientos</span>
        </div>
        <div class="movements">
          <div class="movement-item">
            <div class="movement-icon bg-blue-1">
              <q-icon name="store" color="blue" size="16px" />
            </div>
            <div class="movement-body">
              <div class="movement-title">Sucursal registrada</div>
              <div class="movement-sub">Módulo de sucursales</div>
            </div>
            <div class="movement-time">Hoy</div>
          </div>
          <div class="movement-item">
            <div class="movement-icon bg-green-1">
              <q-icon name="person_add" color="green" size="16px" />
            </div>
            <div class="movement-body">
              <div class="movement-title">Usuario registrado</div>
              <div class="movement-sub">Módulo de usuarios</div>
            </div>
            <div class="movement-time">Hoy</div>
          </div>
          <div class="movement-item">
            <div class="movement-icon bg-orange-1">
              <q-icon name="login" color="orange" size="16px" />
            </div>
            <div class="movement-body">
              <div class="movement-title">Sesión iniciada</div>
              <div class="movement-sub">Admin Sistema</div>
            </div>
            <div class="movement-time">Hoy</div>
          </div>
        </div>
        <q-btn
          flat
          dense
          label="Ver todos los logs"
          color="white"
          size="sm"
          class="q-mt-md"
          style="opacity: 0.7"
        />
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  line-height: 1.2;
}

.page-sub {
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
}

/* Stat row */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: flex-start;
  gap: 14px;
  position: relative;
}

.stat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card__val {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.1;
}

.stat-card__label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.stat-card__badge {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 10px;
}

/* Bottom grid */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.panel--blue {
  background: #1d4ed8;
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel__title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  text-align: center;
}

/* Branch list */
.branch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.branch-row:last-child {
  border-bottom: none;
}

.branch-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.branch-name {
  flex: 1;
  font-size: 13.5px;
  color: #1e293b;
  font-weight: 500;
}

.branch-badge {
  font-size: 10px;
}

/* Movements */
.movements {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.movement-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.movement-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.movement-body {
  flex: 1;
}

.movement-title {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.movement-sub {
  font-size: 11px;
  color: #93c5fd;
}

.movement-time {
  font-size: 11px;
  color: #93c5fd;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
