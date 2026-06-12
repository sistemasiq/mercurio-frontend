import { createRouter, createWebHistory } from 'vue-router'
import type { UserRole } from '@/types/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    publicOnly?: boolean
    roles?: UserRole[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/',
      component: () => import('@/layouts/AuthLayout.vue'),
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('@/pages/auth/LoginPage.vue'),
          meta: { publicOnly: true },
        },
      ],
    },
    {
      path: '/home',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: 'admin',
          name: 'home-admin',
          component: () => import('@/pages/home/AdminHomePage.vue'),
          meta: { requiresAuth: true, roles: ['Administrador'] as UserRole[] },
        },
        {
          path: 'cashier',
          name: 'home-cashier',
          component: () => import('@/pages/home/CashierHomePage.vue'),
          meta: { requiresAuth: true, roles: ['Cajero'] as UserRole[] },
        },
        {
          path: 'kitchen',
          name: 'home-kitchen',
          component: () => import('@/pages/home/KitchenHomePage.vue'),
          meta: { requiresAuth: true, roles: ['Cocina'] as UserRole[] },
        },
      ],
    },
    {
      path: '/sysadmin',
      component: () => import('@/layouts/SysAdminLayout.vue'),
      meta: { requiresAuth: true, roles: ['AdministradorSistema'] as UserRole[] },
      children: [
        {
          path: 'dashboard',
          name: 'sysadmin-dashboard',
          component: () => import('@/pages/sysadmin/SysAdminDashboardPage.vue'),
        },
        {
          path: 'users',
          name: 'sysadmin-users',
          component: () => import('@/pages/sysadmin/UsersPage.vue'),
        },
        {
          path: 'users/new',
          name: 'sysadmin-users-new',
          component: () => import('@/pages/sysadmin/UserRegisterPage.vue'),
        },
        {
          path: 'users/:id/edit',
          name: 'sysadmin-users-edit',
          component: () => import('@/pages/sysadmin/UserEditPage.vue'),
        },
        {
          path: 'branches',
          name: 'sysadmin-branches',
          component: () => import('@/pages/sysadmin/BranchesPage.vue'),
        },
        {
          path: 'branches/new',
          name: 'sysadmin-branches-new',
          component: () => import('@/pages/sysadmin/BranchRegisterPage.vue'),
        },
        {
          path: 'branches/:id/edit',
          name: 'sysadmin-branches-edit',
          component: () => import('@/pages/sysadmin/BranchEditPage.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

export default router
