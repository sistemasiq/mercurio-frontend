<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getInitials, getAvatarColor } from '@/utils/avatar'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const leftOpen = ref(true)

const navItems = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    routeName: 'reportes-dashboard',
    permission: 'reportes:dashboard',
  },
  {
    label: 'Sucursales',
    icon: 'store',
    routeName: 'sucursales-listar',
    permission: 'sucursales:listar',
  },
  { label: 'Usuarios', icon: 'group', routeName: 'usuarios-listar', permission: 'usuarios:listar' },
]

const navMain = computed(() => navItems.filter((item) => auth.hasPermission(item.permission)))

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
  const module = routeName.split('-')[0]
  return (route.name?.toString() ?? '').startsWith(`${module}-`)
}

async function handleLogout(): Promise<void> {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <q-layout view="hHh LpR fFf">
    <!-- ── Sidebar ─────────────────────────────────────────── -->
    <q-drawer
      v-model="leftOpen"
      side="left"
      :width="220"
      :breakpoint="0"
      show-if-above
      class="sb-drawer"
    >
      <div class="sb-root">
        <!-- Logo -->
        <div class="sb-logo">
          <div class="sb-logo-icon">
            <q-icon name="apps" size="16px" color="white" />
          </div>
          <div>
            <div class="sb-brand">TEC-FS</div>
            <div class="sb-sub">Admin Console</div>
          </div>
        </div>

        <!-- Nav label -->
        <div class="sb-section-label">MENÚ PRINCIPAL</div>

        <!-- Nav principal -->
        <q-list class="sb-nav" padding>
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
        </q-list>

        <!-- Nav extra -->
        <div class="sb-section-label">SISTEMA</div>
        <q-list class="sb-nav sb-nav--extra" padding>
          <q-item
            v-for="item in navExtra"
            :key="item.label"
            v-ripple
            clickable
            disable
            class="sb-item sb-item--disabled"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" size="18px" />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
            <q-item-section side>
              <span class="coming-soon">Pronto</span>
            </q-item-section>
          </q-item>
        </q-list>

        <div class="sb-spacer" />

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
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <!-- Left: current section title -->
        <q-toolbar-title class="header-brand">
          <q-icon name="apps" size="16px" color="primary" class="q-mr-xs" />
          TEC-FS
          <span class="header-brand-sub">Admin</span>
        </q-toolbar-title>

        <q-space />

        <!-- Right: actions -->
        <div class="header-actions">
          <!-- Notifications -->
          <q-btn flat round dense class="action-btn" aria-label="Notificaciones">
            <q-icon name="notifications_none" size="20px" />
            <q-badge color="red" floating rounded label="3" style="font-size: 9px" />
          </q-btn>

          <!-- Settings -->
          <q-btn flat round dense class="action-btn" aria-label="Configuración">
            <q-icon name="settings" size="20px" />
          </q-btn>

          <!-- Help -->
          <q-btn flat round dense class="action-btn" aria-label="Ayuda">
            <q-icon name="help_outline" size="20px" />
          </q-btn>

          <div class="header-divider" />

          <!-- User info -->
          <div class="header-user">
            <div class="header-avatar" :style="{ background: userColor }">
              {{ userInitials }}
            </div>
            <div class="header-user-info">
              <div class="header-user-name">{{ userName }}</div>
              <div class="header-user-role">Admin Sistema</div>
            </div>
          </div>

          <!-- Logout -->
          <q-btn
            flat
            round
            dense
            class="action-btn action-btn--logout"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            @click="handleLogout"
          >
            <q-icon name="logout" size="20px" />
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- ── Contenido ──────────────────────────────────────── -->
    <q-page-container class="page-bg">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
/* ── Sidebar ─────────────────────────────────────────────── */
.sb-drawer :deep(.q-drawer) {
  background: #ffffff !important;
  border-right: 1px solid #e2e8f0 !important;
  box-shadow: none !important;
}

.sb-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Logo area */
.sb-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.sb-logo-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sb-brand {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  letter-spacing: 0.01em;
}

.sb-sub {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 1.3;
}

/* Section labels */
.sb-section-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.08em;
  padding: 16px 20px 6px;
  flex-shrink: 0;
}

/* Nav */
.sb-nav {
  padding: 0 8px !important;
  flex-shrink: 0;
}

.sb-nav--extra {
  flex: 1;
}

.sb-item {
  border-radius: 8px !important;
  margin-bottom: 2px;
  min-height: 40px !important;
  padding: 0 10px !important;
  color: #475569 !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  transition:
    background 0.12s,
    color 0.12s;
}

.sb-item :deep(.q-icon) {
  color: #94a3b8 !important;
  transition: color 0.12s;
}

.sb-item:hover {
  background: #f8fafc !important;
  color: #1e293b !important;
}

.sb-item:hover :deep(.q-icon) {
  color: #64748b !important;
}

.sb-item--active {
  background: #eff6ff !important;
  color: #2563eb !important;
  font-weight: 600 !important;
  border-left: 3px solid #2563eb;
  padding-left: 7px !important;
}

.sb-item--active :deep(.q-icon) {
  color: #2563eb !important;
}

.sb-item--disabled {
  opacity: 0.45 !important;
}

.coming-soon {
  font-size: 9.5px;
  font-weight: 600;
  color: #94a3b8;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 1px 5px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.sb-spacer {
  flex: 1;
  min-height: 16px;
}

/* User footer */
.sb-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.sb-avatar {
  width: 32px;
  height: 32px;
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
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 128px;
  line-height: 1.3;
}

.sb-user-role {
  font-size: 10.5px;
  color: #94a3b8;
  line-height: 1.3;
}

/* ── Header ─────────────────────────────────────────────── */
.app-header {
  background: #ffffff !important;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05) !important;
  color: #1e293b !important;
}

.app-toolbar {
  min-height: 54px;
  padding: 0 20px;
}

.header-brand {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  flex: 0 0 auto;
  gap: 4px;
}

.header-brand-sub {
  color: #94a3b8;
  font-weight: 400;
  margin-left: 4px;
}

/* Actions cluster */
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  color: #64748b !important;
  transition:
    color 0.12s,
    background 0.12s;
}

.action-btn:hover {
  color: #1e293b !important;
  background: #f1f5f9 !important;
}

.action-btn--logout:hover {
  color: #dc2626 !important;
  background: #fff1f2 !important;
}

.header-divider {
  width: 1px;
  height: 24px;
  background: #e2e8f0;
  margin: 0 8px;
  flex-shrink: 0;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: default;
}

.header-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.header-user-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
  white-space: nowrap;
}

.header-user-role {
  font-size: 10.5px;
  color: #94a3b8;
  line-height: 1.2;
}

/* ── Page container ──────────────────────────────────────── */
.page-bg {
  background: #f1f5f9;
}
</style>
