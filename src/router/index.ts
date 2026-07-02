// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    publicOnly?: boolean
    permissions?: string[]
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
        path: '',
        name: 'home',
        component: () => import('@/pages/home/HomePage.vue'),
        meta: { requiresAuth: true, title: 'Inicio' },
      },
    ],
  },
  {
    path: '/pos',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'caja',
        name: 'pos-caja',
        component: () => import('@/components/DashboardComponent.vue'),
        meta: { permissions: ['pos:acceder'], title: 'Caja' },
      },
      {
        path: 'cocina',
        name: 'pos-cocina',
        component: () => import('@/components/comandas/VisorCocina.vue'),
        meta: { permissions: ['restaurante:gestionar_cocina'], title: 'Visor Cocina' },
      },
    ],
  },
  {
    path: '/usuarios',
    component: () => import('@/layouts/SysAdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'usuarios-listar',
        component: () => import('@/pages/sysadmin/UsersPage.vue'),
        meta: { permissions: ['usuarios:listar'] },
      },
      {
        path: 'nuevo',
        name: 'usuarios-crear',
        component: () => import('@/pages/sysadmin/UserRegisterPage.vue'),
        meta: { permissions: ['usuarios:crear'] },
      },
      {
        path: ':id/editar',
        name: 'usuarios-editar',
        component: () => import('@/pages/sysadmin/UserEditPage.vue'),
        meta: { permissions: ['usuarios:editar'] },
      },
    ],
  },
  {
    path: '/sucursales',
    component: () => import('@/layouts/SysAdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'sucursales-listar',
        component: () => import('@/pages/locations/SucursalesPage.vue'),
        meta: { permissions: ['sucursales:listar'] },
      },
      {
        path: 'nueva',
        name: 'sucursales-crear',
        component: () => import('@/components/NewBranchPage.vue'),
        meta: { permissions: ['sucursales:crear'] },
      },
      {
        path: ':id/editar',
        name: 'sucursales-editar',
        component: () => import('@/components/EditBranchPage.vue'),
        meta: { permissions: ['sucursales:editar'] },
      },
      {
        path: ':id',
        name: 'sucursales-detalle',
        component: () => import('@/components/DetailBranchPage.vue'),
        meta: { permissions: ['sucursales:ver'] },
      },
    ],
  },
  {
    path: '/reportes',
    component: () => import('@/layouts/SysAdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'reportes-dashboard',
        component: () => import('@/pages/sysadmin/SysAdminDashboardPage.vue'),
        meta: { permissions: ['reportes:dashboard'] },
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
