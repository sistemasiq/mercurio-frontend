/**
 * CONFIGURACIÓN DEL SISTEMA DE RUTAS (ROUTER)
 * 
 * FUNCIÓN PRINCIPAL:
 * Este archivo define todas las rutas de navegación de la aplicación
 * y cómo se estructura la navegación entre páginas.
 * 
 * ESTRUCTURA DE RUTAS:
 * - Ruta base "/" → Carga AdminLayout como contenedor principal
 * - Rutas hijas dentro de "/" → Se renderizan dentro de AdminLayout
 * - Cualquier ruta desconocida → Redirige a /dashboard
 * 
 * FLUJO DE NAVEGACIÓN:
 * 1. Usuario hace clic en un link o navega a una URL
 * 2. Router compara la URL con las rutas definidas
 * 3. Si encuentra coincidencia, carga el componente
 * 4. Si no encuentra, redirige a /dashboard
 * 5. Actualiza el título del navegador con el meta.title
 * 
 * RUTAS DISPONIBLES:
 * - /dashboard → Panel principal con estadísticas
 * - /reservaciones → Listado de todas las reservaciones
 * - /reservaciones/nueva → Crear nueva reservación
 * - /calendario → Vista de calendario
 * - /pagos → Gestión de pagos
 * - /clientes → Listado de clientes
 */

import { defineRouter } from '#q-app/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Definición de todas las rutas de la aplicación
const routes: RouteRecordRaw[] = [
  {
    // Ruta base que contiene el layout principal
    path: '/',
    // AdminLayout es el contenedor que tiene sidebar, header y router-view
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      // Redirige automáticamente de / a /dashboard
      {
        path: '',
        redirect: '/dashboard'
      },
      // Dashboard: Panel de control con estadísticas y eventos próximos
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('../pages/DashboardPage.vue'),
        meta: { title: 'Dashboard - FEC Admin' }
      },
      // Reservaciones: Listado de todas las reservaciones
      {
        path: '/reservaciones',
        name: 'reservaciones',
        component: () => import('../pages/ReservacionesPage.vue'),
        meta: { title: 'Reservaciones' }
      },
      // Nueva Reservación: Formulario para crear una nueva reservación
      {
        path: '/reservaciones/nueva',
        name: 'nueva-reservacion',
        component: () => import('../pages/NuevaReservacionPage.vue'),
        meta: { title: 'Nueva Reservación' }
      },
      // Calendario: Vista de calendario de eventos
      {
        path: '/calendario',
        name: 'calendario',
        component: () => import('../pages/CalendarioPage.vue'),
        meta: { title: 'Calendario' }
      },
      // Pagos: Gestión y registro de pagos
      {
        path: '/pagos',
        name: 'pagos',
        component: () => import('../pages/PagosPage.vue'),
        meta: { title: 'Pagos' }
      },
      // Clientes: Listado y gestión de clientes
      {
        path: '/clientes',
        name: 'clientes',
        component: () => import('../pages/ClientesPage.vue'),
        meta: { title: 'Clientes' }
      }
    ]
  },
  // Ruta catch-all: Cualquier URL no definida redirige a dashboard
  {
    path: '/:catchAll(.*)*',
    redirect: '/dashboard'
  }
]

// Crea y configura el router
export default defineRouter(function (/* { store, ssrContext } */) {
  // Crea la instancia del router
  const Router = createRouter({
    // Hace scroll al top cuando navegas a una ruta nueva
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    // Usa hash history: URLs como /#/dashboard
    // (ideal para aplicaciones sin servidor backend)
    history: createWebHashHistory()
  })

  // Hook que se ejecuta después de cada navegación
  // Actualiza el título del navegador con el meta.title de la ruta
  Router.afterEach((to) => {
    const title = to.meta?.title as string
    if (title) document.title = title
  })

  return Router
})
