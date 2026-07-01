<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import TopHeader from '@/components/navigation/TopHeader.vue'
import SideNavBar from '@/components/navigation/SideNavBar.vue'
import { ref, provide, computed } from 'vue'

const auth = useAuthStore()
const router = useRouter()

// Search term shared with pages via provide/inject
const searchTerm = ref('')
// Sidebar collapsed state and width shared with pages
const sidebarCollapsed = ref(false)
const sidebarWidth = computed(() => (sidebarCollapsed.value ? '72px' : '256px'))

provide('searchTerm', searchTerm)
provide('sidebarCollapsed', sidebarCollapsed)
provide('sidebarWidth', sidebarWidth)

async function handleLogout(): Promise<void> {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <SideNavBar v-model:collapsed="sidebarCollapsed" />
    <!-- Use TopHeader component instead of the blue toolbar title -->
    <TopHeader v-model="searchTerm" :sidebar-collapsed="sidebarCollapsed" @logout="handleLogout" />

    <q-page-container
      :style="{
        paddingTop: '64px',
        marginLeft: sidebarWidth,
        width: `calc(100% - ${sidebarWidth})`,
      }"
    >
      <router-view />
    </q-page-container>
  </q-layout>
</template>
