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
  // ── Ruta de desarrollo (solo disponible en DEV, árbol eliminado en build) ──
  ...(import.meta.env.DEV
    ? ([
        {
          path: '/dev',
          name: 'dev-menu',
          component: () => import('@/pages/DevMenuPage.vue'),
          meta: { title: '⚗ Dev Menu' },
        },
      ] as RouteRecordRaw[])
    : []),
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
    path: '/padres',
    component: () => import('@/layouts/PadresLayout.vue'),
    children: [
      {
        path: 'access',
        name: 'padres-access',
        component: () => import('@/pages/padres/AccessPadrePage.vue'),
      },
      {
        path: 'dashboard',
        name: 'padres-dashboard',
        component: () => import('@/pages/padres/DashboardPadrePage.vue'),
      },
    ],
  },
  {
    path: '/home',
    component: () => import('@/layouts/AppShell.vue'),
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
    component: () => import('@/layouts/AppShell.vue'),
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
      {
        path: 'cierre',
        name: 'pos-cierre',
        component: () => import('@/pages/CierreCajaPage.vue'),
        meta: { requiresAuth: true, title: 'Cierre de Caja' },
      },
      {
        path: 'historial-arqueos',
        name: 'pos-historial-arqueos',
        component: () => import('@/pages/HistorialArqueosPage.vue'),
        meta: {
          requiresAuth: true,
          permissions: ['turnos_caja:historial'],
          title: 'Historial de Arqueos',
        },
      },
      {
        path: 'historial',
        name: 'pos-historial',
        component: () => import('@/components/historial/HistorialView.vue'),
        meta: { permissions: ['restaurante:registrar_pago'], title: 'Historial' },
      },
    ],
  },
  {
    path: '/usuarios',
    component: () => import('@/layouts/AppShell.vue'),
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
    path: '/roles',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'roles-listar',
        component: () => import('@/pages/RolesPage.vue'),
        meta: { permissions: ['permisos:ver'], title: 'Roles' },
      },
    ],
  },
  {
    path: '/sucursales',
    component: () => import('@/layouts/AppShell.vue'),
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
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'reportes-dashboard',
        component: () => import('@/pages/sysadmin/SysAdminDashboardPage.vue'),
        meta: { permissions: ['reportes:dashboard'] },
      },
      {
        path: 'inventario',
        name: 'reportes-inventario',
        component: () => import('@/pages/ReporteInventarioPage.vue'),
        meta: { permissions: ['reportes:inventario'], title: 'Reporte de Stock' },
      },
    ],
  },
  {
    path: '/eventos',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/eventos/resumen' },
      {
        path: 'resumen',
        name: 'eventos-resumen',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { permissions: ['reservaciones:listar'], title: 'Resumen de Eventos' },
      },
      {
        path: 'reservaciones',
        name: 'eventos-reservaciones',
        component: () => import('@/pages/ReservacionesPage.vue'),
        meta: { permissions: ['reservaciones:listar'], title: 'Reservaciones' },
      },
      {
        path: 'reservaciones/nueva',
        name: 'eventos-reservaciones-crear',
        component: () => import('@/pages/NuevaReservacionPage.vue'),
        meta: { permissions: ['reservaciones:crear'], title: 'Nueva Reservación' },
      },
      {
        path: 'calendario',
        name: 'eventos-calendario',
        component: () => import('@/pages/CalendarioPage.vue'),
        meta: { permissions: ['reservaciones:listar'], title: 'Calendario' },
      },
      {
        path: 'reservaciones/:id/cierre',
        name: 'eventos-reservaciones-cierre',
        component: () => import('@/pages/CierreEventoPage.vue'),
        meta: { permissions: ['reservaciones:editar'], title: 'Cierre de Evento' },
      },
      {
        path: 'pagos',
        name: 'eventos-pagos',
        component: () => import('@/pages/PagosPage.vue'),
        meta: { permissions: ['reservaciones:gestionar_pagos'], title: 'Pagos' },
      },
    ],
  },
  {
    path: '/extras',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'extras-listar',
        component: () => import('@/pages/ExtrasPage.vue'),
        // :crear (no :listar) porque esta es la pantalla de GESTIÓN del catálogo:
        // roles que solo necesitan leerlo (Cajero, para reservaciones) no deben verla.
        meta: { permissions: ['extras:crear'], title: 'Extras' },
      },
    ],
  },
  {
    path: '/paquetes',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'paquetes-listar',
        component: () => import('@/pages/PaquetesPage.vue'),
        meta: { permissions: ['paquetes:crear'], title: 'Paquetes' },
      },
    ],
  },
  {
    path: '/tipos-evento',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'tipos-evento-listar',
        component: () => import('@/pages/TiposEventoPage.vue'),
        meta: { permissions: ['tipos_evento:crear'], title: 'Tipos de Evento' },
      },
    ],
  },
  {
    path: '/metodos-pago',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'metodos-pago-listar',
        component: () => import('@/pages/MetodosPagoPage.vue'),
        meta: { permissions: ['metodos_pago:crear'], title: 'Métodos de Pago' },
      },
    ],
  },
  {
    path: '/estancias',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'registro-infantes',
        name: 'estancias-registro-infantes',
        component: () => import('@/pages/RegistrationPage.vue'),
        meta: { permissions: ['estancias:checkin'], title: 'Registro de Entrada' },
      },
      {
        path: 'control-acceso',
        name: 'estancias-control-acceso',
        component: () => import('@/pages/AccessControlPage.vue'),
        meta: { permissions: ['estancias:ver_activos'], title: 'Control de Acceso' },
      },
      {
        path: 'checkout',
        name: 'estancias-checkout',
        component: () => import('@/pages/CheckoutPage.vue'),
        meta: { permissions: ['estancias:checkout'], title: 'Checkout' },
      },
      {
        path: 'pulseras/registro',
        name: 'estancias-pulseras-registro',
        component: () => import('@/pages/RegistroPulserasPage.vue'),
        meta: { permissions: ['pulseras:crear'], title: 'Registro de Pulseras' },
      },
      {
        path: 'pulseras',
        name: 'estancias-pulseras',
        component: () => import('@/pages/PulserasPage.vue'),
        meta: { permissions: ['pulseras:listar'], title: 'Pulseras' },
      },
    ],
  },
  {
    path: '/productos',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'productos-listar',
        component: () => import('@/pages/ProductosPage.vue'),
        meta: { permissions: ['inventario:gestionar_productos'], title: 'Productos' },
      },
    ],
  },
  {
    path: '/proveedores',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'proveedores-listar',
        component: () => import('@/pages/ProveedoresPage.vue'),
        meta: { permissions: ['inventario:gestionar_proveedores'], title: 'Proveedores' },
      },
    ],
  },
  {
    path: '/insumos',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'insumos-listar',
        component: () => import('@/pages/InsumosPage.vue'),
        meta: { permissions: ['inventario:gestionar_insumos'], title: 'Insumos' },
      },
      {
        path: ':id/kardex',
        name: 'insumos-kardex',
        component: () => import('@/pages/KardexInsumoPage.vue'),
        meta: { permissions: ['inventario:ver_movimientos'], title: 'Kardex' },
      },
    ],
  },
  {
    path: '/compras',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'compras-listar',
        component: () => import('@/pages/ComprasPage.vue'),
        meta: { permissions: ['inventario:gestionar_compras'], title: 'Compras' },
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'horarios',
        name: 'admin-horarios',
        component: () => import('@/pages/admin/HorariosPage.vue'),
        meta: { permissions: ['horarios:listar'], title: 'Horarios' },
      },
      {
        path: 'cajas',
        name: 'admin-cajas',
        component: () => import('@/pages/admin/CajasAdminPage.vue'),
        meta: { permissions: ['cajas:crear'], title: 'Cajas' },
      },
    ],
  },
  {
    path: '/lealtad',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'configuracion',
        name: 'lealtad-configuracion',
        component: () => import('@/pages/LealtadConfiguracionPage.vue'),
        meta: { permissions: ['lealtad:gestionar_configuracion'], title: 'Puntos de Lealtad' },
      },
      {
        path: 'kardex',
        name: 'lealtad-kardex',
        component: () => import('@/pages/KardexLealtadPage.vue'),
        meta: { permissions: ['lealtad:ver_saldo'], title: 'Kardex de Lealtad' },
      },
      {
        path: 'reporte',
        name: 'lealtad-reporte',
        component: () => import('@/pages/ReporteLealtadPage.vue'),
        meta: { permissions: ['lealtad:ver_reporte'], title: 'Reporte de Lealtad' },
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
