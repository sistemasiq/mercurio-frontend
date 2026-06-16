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
        {
          path: 'branches/new',
          name: 'NewBranch',
          component: () => import('@/components/NewBranchPage.vue'),
          meta: { requiresAuth: true, roles: ['Administrador'] as UserRole[] },
        },
        {
          path: 'branches/:branchId/edit',
          name: 'EditBranch',
          component: () => import('@/components/EditBranchPage.vue'),
          meta: { requiresAuth: true, roles: ['Administrador'] as UserRole[] },
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
