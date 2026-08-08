<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { userService } from '@/services/userService'
import { branchService } from '@/services/branchService'
import type { UserListItem } from '@/types/user'
import type { Branch } from '@/types/branch'
import EstadoBadge from '@/components/shared/EstadoBadge.vue'

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
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <!-- Encabezado -->
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">Dashboard</div>
        <div class="text-body2" style="color: var(--text-secondary)">
          Resumen general del sistema Woow Kids.
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <q-icon name="group" />
          </div>
          <div v-if="loading" class="stat-card__value"><q-skeleton type="text" width="60px" /></div>
          <div v-else class="stat-card__value">{{ totalUsers.toLocaleString() }}</div>
          <div class="stat-card__label">Total Usuarios</div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--green">
            <q-icon name="store" />
          </div>
          <div v-if="loading" class="stat-card__value"><q-skeleton type="text" width="60px" /></div>
          <div v-else class="stat-card__value">{{ activeBranches }}</div>
          <div class="stat-card__label">Sucursales Activas</div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <div class="stat-card">
          <div class="stat-card__top">
            <div
              class="stat-card__icon"
              :class="inactiveBranches > 0 ? 'stat-card__icon--red' : 'stat-card__icon--grey'"
            >
              <q-icon name="store_mall_directory" />
            </div>
            <div
              v-if="inactiveBranches > 0"
              class="stat-card__corner-badge stat-card__corner-badge--negative"
            >
              Alerta
            </div>
          </div>
          <div v-if="loading" class="stat-card__value"><q-skeleton type="text" width="60px" /></div>
          <div v-else class="stat-card__value">{{ inactiveBranches }}</div>
          <div class="stat-card__label">Sucursales Inactivas</div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--pink">
            <q-icon name="account_tree" />
          </div>
          <div v-if="loading" class="stat-card__value"><q-skeleton type="text" width="60px" /></div>
          <div v-else class="stat-card__value">{{ branches.length }}</div>
          <div class="stat-card__label">Total Sucursales</div>
        </div>
      </div>
    </div>

    <!-- Grid inferior -->
    <div class="row q-col-gutter-md">
      <!-- Estado de sucursales -->
      <div class="col-12 col-md-8">
        <div class="panel-card">
          <div class="panel-card__header">
            <h3>Estado de Sucursales</h3>
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

          <div v-if="loading" class="q-pa-md">
            <q-skeleton v-for="i in 4" :key="i" type="text" class="q-mb-xs" />
          </div>

          <div v-else-if="branchList.length === 0" class="empty-state">
            <q-icon name="store" size="36px" color="grey-4" />
            <div class="empty-state__text">No hay sucursales registradas.</div>
            <q-btn
              unelevated
              no-caps
              color="primary"
              label="Agregar sucursal"
              size="sm"
              dense
              style="border-radius: 8px; font-weight: 600"
              @click="router.push({ name: 'sucursales-crear' })"
            />
          </div>

          <div v-else class="branch-list">
            <div v-for="branch in branchList" :key="branch.id" class="branch-row">
              <div class="branch-row__left">
                <div class="branch-name">{{ branch.nombre }}</div>
                <div class="branch-meta">{{ branch.direccion ?? 'Sin dirección registrada' }}</div>
              </div>
              <EstadoBadge
                :tono="branch.isActive ? 'verde' : 'rojo'"
                :label="branch.isActive ? 'Activa' : 'Inactiva'"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Panel derecho: accesos rápidos + actividad -->
      <div class="col-12 col-md-4">
        <div class="q-gutter-y-md">
          <!-- Accesos rápidos -->
          <div class="panel-card">
            <div class="panel-card__header">
              <h3>Accesos rápidos</h3>
            </div>
            <div class="quick-actions">
              <button class="quick-btn" @click="router.push({ name: 'usuarios-crear' })">
                <div class="quick-btn__icon stat-card__icon--blue">
                  <q-icon name="person_add" size="18px" />
                </div>
                <span>Nuevo usuario</span>
              </button>
              <button class="quick-btn" @click="router.push({ name: 'sucursales-crear' })">
                <div class="quick-btn__icon stat-card__icon--green">
                  <q-icon name="add_business" size="18px" />
                </div>
                <span>Nueva sucursal</span>
              </button>
              <button class="quick-btn" @click="router.push({ name: 'usuarios-listar' })">
                <div class="quick-btn__icon stat-card__icon--pink">
                  <q-icon name="manage_accounts" size="18px" />
                </div>
                <span>Gestionar usuarios</span>
              </button>
              <button class="quick-btn" @click="router.push({ name: 'sucursales-listar' })">
                <div class="quick-btn__icon stat-card__icon--orange">
                  <q-icon name="storefront" size="18px" />
                </div>
                <span>Ver sucursales</span>
              </button>
            </div>
          </div>

          <!-- Actividad reciente -->
          <div class="panel-card">
            <div class="panel-card__header">
              <h3>Actividad reciente</h3>
            </div>
            <div class="movements">
              <div class="movement">
                <div class="movement__icon stat-card__icon--blue">
                  <q-icon name="store" size="14px" />
                </div>
                <div class="movement__body">
                  <div class="movement__title">Sucursal registrada</div>
                  <div class="movement__sub">Módulo de sucursales</div>
                </div>
                <div class="movement__time">Hoy</div>
              </div>
              <div class="movement">
                <div class="movement__icon stat-card__icon--green">
                  <q-icon name="person_add" size="14px" />
                </div>
                <div class="movement__body">
                  <div class="movement__title">Usuario registrado</div>
                  <div class="movement__sub">Módulo de usuarios</div>
                </div>
                <div class="movement__time">Hoy</div>
              </div>
              <div class="movement">
                <div class="movement__icon stat-card__icon--orange">
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
    </div>
  </q-page>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 0;
  text-align: center;
}

.empty-state__text {
  font-size: 13px;
  color: var(--text-muted);
}

.branch-list {
  display: flex;
  flex-direction: column;
  padding: 4px 20px 8px;
}

.branch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid var(--bg-main);
}

.branch-row:last-child {
  border-bottom: none;
}

.branch-row__left {
  flex: 1;
  min-width: 0;
}

.branch-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.branch-meta {
  font-size: 11.5px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Accesos rápidos */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 4px 20px 20px;
}

.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 12px 8px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-main);
  cursor: pointer;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-secondary);
  text-align: center;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
  line-height: 1.3;
}

.quick-btn:hover {
  background: var(--bg-card);
  border-color: var(--text-muted);
  color: var(--text-primary);
}

.quick-btn__icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Actividad reciente */
.movements {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 20px 20px;
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

.movement__body {
  flex: 1;
  min-width: 0;
}

.movement__title {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.movement__sub {
  font-size: 11px;
  color: var(--text-muted);
}

.movement__time {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
