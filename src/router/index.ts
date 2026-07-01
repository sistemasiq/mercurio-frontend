// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { UserRole } from '@/types/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    publicOnly?: boolean
    roles?: UserRole[]
    title?: string
  }
}

const routes: RouteRecordRaw[] = [
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
        path: 'cocina',
        name: 'cocina',
        component: () => import('@/components/comandas/VisorCocina.vue'),
        meta: { requiresAuth: true, roles: ['Cocina'] as UserRole[], title: 'Visor Cocina' },
      },
      {
        path: 'caja',
        name: 'caja',
        component: () => import('@/components/DashboardComponent.vue'),
        meta: { requiresAuth: true, roles: ['Cajero'] as UserRole[], title: 'Caja' },
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
        component: () => import('@/pages/locations/SucursalesPage.vue'),
      },
      {
        path: 'branches/new',
        name: 'sysadmin-branches-new',
        component: () => import('@/components/NewBranchPage.vue'),
      },
      {
        path: 'branches/:id/edit',
        name: 'sysadmin-branches-edit',
        component: () => import('@/components/EditBranchPage.vue'),
      },
      {
        path: 'branches/:id',
        name: 'sysadmin-branches-detail',
        component: () => import('@/components/DetailBranchPage.vue'),
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'reservaciones',
        name: 'reservaciones',
        component: () => import('@/pages/ReservacionesPage.vue'),
        meta: { title: 'Reservaciones' },
      },
      {
        path: 'reservaciones/nueva',
        name: 'nueva-reservacion',
        component: () => import('@/pages/NuevaReservacionPage.vue'),
        meta: { title: 'Nueva Reservación' },
      },
      {
        path: 'calendario',
        name: 'calendario',
        component: () => import('@/pages/CalendarioPage.vue'),
        meta: { title: 'Calendario' },
      },
      {
        path: 'pagos',
        name: 'pagos',
        component: () => import('@/pages/PagosPage.vue'),
        meta: { title: 'Pagos' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

router.afterEach((to) => {
  const title = to.meta?.title as string
  if (title) document.title = title
})

export default router
