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
const inactiveBranches = computed(() => branches.value.filter((b) => !b.isActive).length)
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
        <div class="page-eyebrow">Panel de control</div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Resumen general del sistema TEC-FS.</p>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="stat-row">
      <!-- Total Usuarios -->
      <div class="stat-card">
        <div class="stat-card__top">
          <div class="stat-icon stat-icon--blue">
            <q-icon name="group" size="20px" />
          </div>
          <span class="stat-tag stat-tag--blue">Sistema</span>
        </div>
        <div v-if="loading" class="stat-val"><q-skeleton type="text" width="60px" /></div>
        <div v-else class="stat-val">{{ totalUsers.toLocaleString() }}</div>
        <div class="stat-label">Total Usuarios</div>
        <div class="stat-card__footer">
          <q-icon name="trending_up" size="13px" color="green-6" />
          <span class="stat-hint stat-hint--green">Registrados en el sistema</span>
        </div>
      </div>

      <!-- Sucursales Activas -->
      <div class="stat-card">
        <div class="stat-card__top">
          <div class="stat-icon stat-icon--green">
            <q-icon name="store" size="20px" />
          </div>
          <span class="stat-tag stat-tag--green">Operativas</span>
        </div>
        <div v-if="loading" class="stat-val"><q-skeleton type="text" width="60px" /></div>
        <div v-else class="stat-val">{{ activeBranches }}</div>
        <div class="stat-label">Sucursales Activas</div>
        <div class="stat-card__footer">
          <q-icon name="check_circle" size="13px" color="green-6" />
          <span class="stat-hint stat-hint--green">En funcionamiento</span>
        </div>
      </div>

      <!-- Sucursales Inactivas -->
      <div class="stat-card">
        <div class="stat-card__top">
          <div
            class="stat-icon"
            :class="inactiveBranches > 0 ? 'stat-icon--red' : 'stat-icon--slate'"
          >
            <q-icon name="store_mall_directory" size="20px" />
          </div>
          <span
            class="stat-tag"
            :class="inactiveBranches > 0 ? 'stat-tag--red' : 'stat-tag--slate'"
          >
            {{ inactiveBranches > 0 ? 'Alerta' : 'Sin alertas' }}
          </span>
        </div>
        <div v-if="loading" class="stat-val"><q-skeleton type="text" width="60px" /></div>
        <div
          v-else
          class="stat-val"
          :style="{ color: inactiveBranches > 0 ? '#dc2626' : undefined }"
        >
          {{ inactiveBranches }}
        </div>
        <div class="stat-label">Sucursales Inactivas</div>
        <div class="stat-card__footer">
          <q-icon
            :name="inactiveBranches > 0 ? 'warning' : 'verified'"
            size="13px"
            :color="inactiveBranches > 0 ? 'orange-7' : 'grey-5'"
          />
          <span class="stat-hint" :class="inactiveBranches > 0 ? 'stat-hint--orange' : ''">
            {{ inactiveBranches > 0 ? 'Requieren atención' : 'Todo en orden' }}
          </span>
        </div>
      </div>

      <!-- Total Sucursales -->
      <div class="stat-card">
        <div class="stat-card__top">
          <div class="stat-icon stat-icon--purple">
            <q-icon name="account_tree" size="20px" />
          </div>
          <span class="stat-tag stat-tag--purple">Red</span>
        </div>
        <div v-if="loading" class="stat-val"><q-skeleton type="text" width="60px" /></div>
        <div v-else class="stat-val">{{ branches.length }}</div>
        <div class="stat-label">Total Sucursales</div>
        <div class="stat-card__footer">
          <q-icon name="place" size="13px" color="grey-5" />
          <span class="stat-hint">Puntos registrados</span>
        </div>
      </div>
    </div>

    <!-- Bottom grid -->
    <div class="bottom-grid">
      <!-- Estado de sucursales -->
      <div class="panel">
        <div class="panel__header">
          <div>
            <div class="panel__title">Estado de Sucursales</div>
            <div class="panel__sub">Últimas {{ branchList.length }} sucursales registradas</div>
          </div>
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            label="Ver todas"
            icon-right="arrow_forward"
            size="sm"
            @click="router.push({ name: 'sucursales-listar' })"
          />
        </div>

        <div v-if="loading" class="q-pa-sm">
          <q-skeleton v-for="i in 4" :key="i" type="text" class="q-mb-xs" />
        </div>

        <div v-else-if="branchList.length === 0" class="panel__empty">
          <q-icon name="store" size="36px" color="grey-3" />
          <div class="panel__empty-text">No hay sucursales registradas.</div>
          <q-btn
            unelevated
            color="primary"
            label="Agregar sucursal"
            size="sm"
            dense
            @click="router.push({ name: 'sucursales-crear' })"
          />
        </div>

        <div v-else class="branch-list">
          <div v-for="branch in branchList" :key="branch.id" class="branch-row">
            <div class="branch-row__left">
              <div
                class="branch-status-dot"
                :style="{ background: branch.isActive ? '#16a34a' : '#ef4444' }"
              />
              <div class="branch-info">
                <div class="branch-name">{{ branch.nombre }}</div>
                <div class="branch-meta">{{ branch.direccion ?? 'Sin dirección registrada' }}</div>
              </div>
            </div>
            <span
              class="branch-badge"
              :class="branch.isActive ? 'branch-badge--green' : 'branch-badge--red'"
            >
              {{ branch.isActive ? 'Activa' : 'Inactiva' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Panel derecho: accesos rápidos + movimientos -->
      <div class="side-panels">
        <!-- Accesos rápidos -->
        <div class="panel panel--compact">
          <div class="panel__title" style="margin-bottom: 12px">Accesos rápidos</div>
          <div class="quick-actions">
            <button class="quick-btn" @click="router.push({ name: 'usuarios-crear' })">
              <div class="quick-btn__icon quick-btn__icon--blue">
                <q-icon name="person_add" size="18px" />
              </div>
              <span>Nuevo usuario</span>
            </button>
            <button class="quick-btn" @click="router.push({ name: 'sucursales-crear' })">
              <div class="quick-btn__icon quick-btn__icon--green">
                <q-icon name="add_business" size="18px" />
              </div>
              <span>Nueva sucursal</span>
            </button>
            <button class="quick-btn" @click="router.push({ name: 'usuarios-listar' })">
              <div class="quick-btn__icon quick-btn__icon--purple">
                <q-icon name="manage_accounts" size="18px" />
              </div>
              <span>Gestionar usuarios</span>
            </button>
            <button class="quick-btn" @click="router.push({ name: 'sucursales-listar' })">
              <div class="quick-btn__icon quick-btn__icon--amber">
                <q-icon name="storefront" size="18px" />
              </div>
              <span>Ver sucursales</span>
            </button>
          </div>
        </div>

        <!-- Últimos movimientos -->
        <div class="panel panel--compact">
          <div class="panel__title" style="margin-bottom: 12px">Actividad reciente</div>
          <div class="movements">
            <div class="movement">
              <div class="movement__icon movement__icon--blue">
                <q-icon name="store" size="14px" />
              </div>
              <div class="movement__body">
                <div class="movement__title">Sucursal registrada</div>
                <div class="movement__sub">Módulo de sucursales</div>
              </div>
              <div class="movement__time">Hoy</div>
            </div>
            <div class="movement">
              <div class="movement__icon movement__icon--green">
                <q-icon name="person_add" size="14px" />
              </div>
              <div class="movement__body">
                <div class="movement__title">Usuario registrado</div>
                <div class="movement__sub">Módulo de usuarios</div>
              </div>
              <div class="movement__time">Hoy</div>
            </div>
            <div class="movement">
              <div class="movement__icon movement__icon--orange">
                <q-icon name="login" size="14px" />
              </div>
              <div class="movement__body">
                <div class="movement__title">Sesión iniciada</div>
                <div class="movement__sub">Admin Sistema</div>
              </div>
              <div class="movement__time">Hoy</div>
            </div>
          </div>
        </div>
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
  margin-bottom: 24px;
}

.page-eyebrow {
  font-size: 11.5px;
  font-weight: 600;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
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

/* ── Stat row ──────────────────────────────────────────────── */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.15s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

/* Icons */
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon--blue {
  background: #eff6ff;
  color: #2563eb;
}
.stat-icon--green {
  background: #f0fdf4;
  color: #16a34a;
}
.stat-icon--red {
  background: #fff1f2;
  color: #dc2626;
}
.stat-icon--slate {
  background: #f8fafc;
  color: #94a3b8;
}
.stat-icon--purple {
  background: #f5f3ff;
  color: #7c3aed;
}

/* Tags */
.stat-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
}

.stat-tag--blue {
  background: #eff6ff;
  color: #2563eb;
}
.stat-tag--green {
  background: #f0fdf4;
  color: #16a34a;
}
.stat-tag--red {
  background: #fff1f2;
  color: #dc2626;
}
.stat-tag--slate {
  background: #f8fafc;
  color: #94a3b8;
}
.stat-tag--purple {
  background: #f5f3ff;
  color: #7c3aed;
}

.stat-val {
  font-size: 30px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  margin-top: 4px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.stat-card__footer {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.stat-hint {
  font-size: 11.5px;
  color: #94a3b8;
}

.stat-hint--green {
  color: #16a34a;
}
.stat-hint--orange {
  color: #d97706;
}

/* ── Bottom grid ─────────────────────────────────────────── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  align-items: start;
}

.panel {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.panel--compact {
  padding: 16px 18px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 8px;
}

.panel__title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
}

.panel__sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 0;
  text-align: center;
}

.panel__empty-text {
  font-size: 13px;
  color: #94a3b8;
}

/* Branch list */
.branch-list {
  display: flex;
  flex-direction: column;
}

.branch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid #f8fafc;
}

.branch-row:last-child {
  border-bottom: none;
}

.branch-row__left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.branch-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.branch-info {
  min-width: 0;
}

.branch-name {
  font-size: 13.5px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.branch-meta {
  font-size: 11.5px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.branch-badge {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 3px 9px;
  border-radius: 20px;
  flex-shrink: 0;
}

.branch-badge--green {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.branch-badge--red {
  background: #fff1f2;
  color: #e11d48;
  border: 1px solid #fecdd3;
}

/* Side panels */
.side-panels {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Quick actions */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 12px 8px;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  background: #fafafa;
  cursor: pointer;
  font-size: 11.5px;
  font-weight: 500;
  color: #475569;
  text-align: center;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
  line-height: 1.3;
}

.quick-btn:hover {
  background: #fff;
  border-color: #cbd5e1;
  color: #1e293b;
}

.quick-btn__icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-btn__icon--blue {
  background: #eff6ff;
  color: #2563eb;
}
.quick-btn__icon--green {
  background: #f0fdf4;
  color: #16a34a;
}
.quick-btn__icon--purple {
  background: #f5f3ff;
  color: #7c3aed;
}
.quick-btn__icon--amber {
  background: #fffbeb;
  color: #d97706;
}

/* Movements */
.movements {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.movement {
  display: flex;
  align-items: center;
  gap: 10px;
}

.movement__icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.movement__icon--blue {
  background: #eff6ff;
  color: #2563eb;
}
.movement__icon--green {
  background: #f0fdf4;
  color: #16a34a;
}
.movement__icon--orange {
  background: #fff7ed;
  color: #d97706;
}

.movement__body {
  flex: 1;
  min-width: 0;
}

.movement__title {
  font-size: 12.5px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.movement__sub {
  font-size: 11px;
  color: #94a3b8;
}

.movement__time {
  font-size: 11px;
  color: #cbd5e1;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 900px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
