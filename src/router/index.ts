import { defineRouter } from '#q-app/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'
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
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { publicOnly: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { title: 'Dashboard', requiresAuth: true },
      },
      {
        path: '/reservaciones',
        name: 'reservaciones',
        component: () => import('@/pages/ReservacionesPage.vue'),
        meta: { title: 'Reservaciones', requiresAuth: true },
      },
      {
        path: '/reservaciones/nueva',
        name: 'nueva-reservacion',
        component: () => import('@/pages/NuevaReservacionPage.vue'),
        meta: { title: 'Nueva Reservación', requiresAuth: true },
      },
      {
        path: '/calendario',
        name: 'calendario',
        component: () => import('@/pages/CalendarioPage.vue'),
        meta: { title: 'Calendario', requiresAuth: true },
      },
      {
        path: '/pagos',
        name: 'pagos',
        component: () => import('@/pages/PagosPage.vue'),
        meta: { title: 'Pagos', requiresAuth: true },
      },
      {
        path: '/clientes',
        name: 'clientes',
        component: () => import('@/pages/ClientesPage.vue'),
        meta: { title: 'Clientes', requiresAuth: true },
      },
      {
        path: '/extras',
        name: 'extras',
        component: () => import('@/pages/ExtrasPage.vue'),
        meta: { title: 'Extras', requiresAuth: true },
      },
      {
        path: '/paquetes',
        name: 'paquetes',
        component: () => import('@/pages/PaquetesPage.vue'),
        meta: { title: 'Paquetes', requiresAuth: true },
      },
      {
        path: '/sucursales',
        name: 'sucursales',
        component: () => import('@/pages/SucursalesPage.vue'),
        meta: { title: 'Sucursales', requiresAuth: true },
      },
      {
        path: '/tipos-evento',
        name: 'tipos-evento',
        component: () => import('@/pages/TiposEventoPage.vue'),
        meta: { title: 'Tipos de Evento', requiresAuth: true },
      },
      {
        path: '/metodos-pago',
        name: 'metodos-pago',
        component: () => import('@/pages/MetodosPagoPage.vue'),
        meta: { title: 'Métodos de Pago', requiresAuth: true },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/dashboard',
  },
]

export default defineRouter(function () {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHashHistory(),
  })

  Router.afterEach((to) => {
    const title = to.meta?.title as string
    if (title) document.title = title
  })

  return Router
})
