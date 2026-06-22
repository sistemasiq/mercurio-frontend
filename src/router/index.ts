// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    publicOnly?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },

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
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/pages/DashboardPage.vue'),
          meta: { requiresAuth: false },
        },
        {
          path: 'cocina',
          name: 'cocina',
          component: () => import('@/components/comandas/VisorCocina.vue'),
          meta: { requiresAuth: false },
        },
      ],
    },

    
    {
      path: '/debug/historial',
      name: 'debug-historial',
      component: () => import('@/components/historial/HistorialView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/debug/detalle-pagado',
      name: 'debug-detalle-pagado',
      component: () => import('@/components/historial/DetalleOrdenPagada.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/debug/detalle-cancelado',
      name: 'debug-detalle-cancelado',
      component: () => import('@/components/historial/DetalleOrdenCancelada.vue'),
      meta: { requiresAuth: false },
    },

    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

export default router