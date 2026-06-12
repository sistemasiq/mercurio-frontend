<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getInitials, getAvatarColor } from '@/utils/avatar'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const navMain = [
  { label: 'Dashboard', icon: 'dashboard', routeName: 'sysadmin-dashboard' },
  { label: 'Sucursales', icon: 'store', routeName: 'sysadmin-branches' },
  { label: 'Usuarios', icon: 'group', routeName: 'sysadmin-users' },
]

const navExtra = [
  { label: 'Logs', icon: 'article' },
  { label: 'Network', icon: 'lan' },
  { label: 'Security', icon: 'security' },
  { label: 'Settings', icon: 'settings' },
]

const userInitials = computed(() => getInitials(auth.currentUser?.name ?? ''))
const userColor = computed(() => getAvatarColor(auth.currentUser?.name ?? ''))
const userName = computed(() => auth.currentUser?.name ?? auth.currentUser?.email ?? '')

function isActive(routeName: string): boolean {
  return (route.name?.toString() ?? '').startsWith(routeName)
}

async function handleLogout(): Promise<void> {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <!-- ── Sidebar ─────────────────────────────────────────── -->
    <q-drawer :width="220" permanent style="background: #0f172a">
      <div class="sb-root">
        <!-- Logo -->
        <div class="sb-logo">
          <q-icon name="apps" size="18px" color="blue-4" />
          <div>
            <div class="sb-brand">TEC-FS</div>
            <div class="sb-sub">Admin Console</div>
          </div>
        </div>

        <!-- Nav principal -->
        <q-list class="sb-nav">
          <q-item
            v-for="item in navMain"
            :key="item.routeName"
            v-ripple
            clickable
            class="sb-item"
            :class="{ 'sb-item--active': isActive(item.routeName) }"
            @click="router.push({ name: item.routeName })"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" size="18px" />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>

          <q-separator class="sb-sep" />

          <q-item
            v-for="item in navExtra"
            :key="item.label"
            v-ripple
            clickable
            disable
            class="sb-item sb-item--muted"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" size="18px" />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-list>

        <!-- Usuario -->
        <div class="sb-user">
          <div class="sb-avatar" :style="{ background: userColor }">
            {{ userInitials }}
          </div>
          <div class="sb-user-info">
            <div class="sb-user-name">{{ userName }}</div>
            <div class="sb-user-role">Admin Sistema</div>
          </div>
        </div>
      </div>
    </q-drawer>

    <!-- ── Header ─────────────────────────────────────────── -->
    <q-header style="background: #ffffff; border-bottom: 1px solid #e2e8f0; color: #1e293b">
      <q-toolbar style="min-height: 56px">
        <q-toolbar-title class="header-title">TEC-FS Admin Console</q-toolbar-title>

        <q-input
          :model-value="undefined"
          dense
          rounded
          outlined
          placeholder="Buscar en el sistema..."
          class="header-search q-mr-md"
          style="max-width: 260px; width: 100%"
        >
          <template #prepend>
            <q-icon name="search" size="16px" color="grey-5" />
          </template>
        </q-input>

        <q-btn flat round dense icon="notifications_none" color="grey-7" class="q-mr-xs" />
        <q-btn flat round dense icon="settings" color="grey-7" class="q-mr-sm" />
        <q-btn
          unelevated
          dense
          color="negative"
          label="SALIR"
          class="logout-btn"
          @click="handleLogout"
        />
      </q-toolbar>
    </q-header>

    <!-- ── Contenido ──────────────────────────────────────── -->
    <q-page-container style="background: #f1f5f9">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
/* Sidebar shell */
.sb-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sb-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.sb-brand {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.sb-sub {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.2;
}

/* Nav */
.sb-nav {
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
}

.sb-item {
  border-radius: 8px !important;
  margin-bottom: 2px;
  min-height: 40px !important;
  padding: 0 12px !important;
  color: #94a3b8 !important;
  transition:
    background 0.15s,
    color 0.15s;
}

.sb-item:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  color: #f8fafc !important;
}

.sb-item--active {
  background: rgba(59, 130, 246, 0.15) !important;
  color: #60a5fa !important;
}

.sb-item--active :deep(.q-icon) {
  color: #60a5fa !important;
}

.sb-item--muted {
  opacity: 0.3 !important;
}

.sb-sep {
  background: rgba(255, 255, 255, 0.06) !important;
  margin: 8px 4px;
}

/* User footer */
.sb-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.sb-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.sb-user-name {
  font-size: 12.5px;
  font-weight: 500;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
  line-height: 1.3;
}

.sb-user-role {
  font-size: 10.5px;
  color: #64748b;
  line-height: 1.3;
}

/* Header */
.header-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #1e293b;
  flex: 0 0 auto;
  max-width: 220px;
}

.header-search :deep(.q-field__control) {
  background: #f1f5f9;
  border-radius: 20px !important;
}

.header-search :deep(.q-field--outlined .q-field__control::before) {
  border: none !important;
}

.logout-btn {
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 6px;
  letter-spacing: 0.04em;
}
</style>
