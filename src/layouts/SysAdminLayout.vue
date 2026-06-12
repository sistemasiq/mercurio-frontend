<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const drawerOpen = ref(true)

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', routeName: 'sysadmin-dashboard' },
  { label: 'Usuarios', icon: 'group', routeName: 'sysadmin-users' },
]

function isActive(routeName: string): boolean {
  return route.name === routeName
}

async function handleLogout(): Promise<void> {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawerOpen = !drawerOpen" />
        <q-toolbar-title>Mercury — Admin Sistema</q-toolbar-title>
        <span class="text-body2 q-mr-md">{{
          auth.currentUser?.name ?? auth.currentUser?.email
        }}</span>
        <q-btn flat dense icon="logout" label="Salir" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" :width="220" bordered>
      <q-list padding>
        <q-item
          v-for="item in navItems"
          :key="item.routeName"
          clickable
          :active="isActive(item.routeName)"
          active-class="bg-primary text-white"
          @click="router.push({ name: item.routeName })"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
