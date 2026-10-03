# DOCUMENTACIÓN - MERCURIO FRONTEND

## Visión General del Proyecto

**Mercurio** es un sistema de gestión de eventos y reservaciones para centros de entretenimiento infantil. Permite a administradores gestionar reservaciones, pagos, clientes y eventos de forma eficiente.

---

## 📁 Estructura de Directorios

```
mercurio-frontend/
├── src/
│   ├── main.ts                 # Punto de entrada de la aplicación
│   ├── App.vue                 # Componente raíz
│   ├── boot/
│   │   └── pinia.ts           # Inicializador de estado global (Pinia)
│   ├── css/
│   │   └── app.scss           # Estilos globales y variables CSS
│   ├── layouts/
│   │   └── AdminLayout.vue    # Layout principal con sidebar y header
│   ├── pages/
│   │   ├── DashboardPage.vue           # Panel de control
│   │   ├── ReservacionesPage.vue       # Listado de reservaciones
│   │   ├── NuevaReservacionPage.vue    # Formulario de nueva reservación
│   │   ├── CalendarioPage.vue          # Vista de calendario
│   │   ├── PagosPage.vue               # Gestión de pagos
│   │   └── ClientesPage.vue            # Gestión de clientes
│   └── router/
│       └── index.ts           # Configuración de rutas
├── index.html                  # Archivo HTML principal
├── package.json               # Dependencias del proyecto
├── quasar.config.ts          # Configuración de Quasar Framework
└── tsconfig.json             # Configuración de TypeScript
```

---

## 🔄 Flujo de La Aplicación

### 1. Inicialización
```
main.ts
  ├─ Crea instancia de Vue 3
  ├─ Configura Quasar Framework (plugins, colores)
  ├─ Inicializa Pinia (estado global)
  ├─ Carga el router
  └─ Monta en #app
```

### 2. Estructura de Rutas
```
/ (AdminLayout)
├─ /dashboard                 → DashboardPage
├─ /reservaciones            → ReservacionesPage
├─ /reservaciones/nueva      → NuevaReservacionPage
├─ /calendario               → CalendarioPage
├─ /pagos                    → PagosPage
└─ /clientes                 → ClientesPage

Cualquier ruta no definida → Redirige a /dashboard
```

---

## 🧩 Componentes Principales

### AdminLayout.vue (Layout Principal)
**Propósito:** Define la estructura general de la aplicación

**Estructura:**
- **Sidebar Izquierdo:** Navegación principal con menú expandible
- **Header Superior:** Buscador, notificaciones, información del usuario
- **Contenedor de Páginas:** Área donde se renderizan las páginas dinámicamente

**Características:**
- Menú expandible para Reservaciones
- Estados dinámicos según la ruta actual (resalta el item activo)
- Soporte para diferentes roles (Admin vs Cajero)
- Transiciones suaves con animaciones

**Datos Clave:**
```typescript
interface Reservacion {
  id: number
  nombre: string
  fecha: string
  status: 'pending' | 'confirmed' | 'paid'
}
```

---

## 📄 Páginas de la Aplicación

### 1. DashboardPage (Panel de Control)
**Estado:** ✅ Implementado

**Contenido:**
- **Tarjetas de Estadísticas:** Eventos próximos, confirmados, ingresos
- **Tabla de Eventos:** Listado de eventos pendientes de pago
- **Mini Calendario:** Vista del mes actual con indicadores de estado
- **Próximos Eventos:** Listado de eventos este mes

**Datos Mostrados:**
- 24 eventos próximos
- 156 eventos confirmados
- $4.2k en ingresos recientes
- Eventos para liquidar en tabla

---

### 2. NuevaReservacionPage (Crear Reservación)
**Estado:** 🔧 En desarrollo (Stepper multi-pasos)

**Flujo en 3 Pasos:**

**Paso 1: Datos del Evento**
- Datos del cliente (nombre, teléfono, email)
- Número de niños
- Tipo de evento
- Selección de fecha con calendario interactivo
- Horario del evento

**Paso 2: Paquetes y Extras**
- Selección de paquetes de comida (Básico Plus, Estándar, Premium)
- Servicios adicionales (DJ, animación, mesa de dulces)

**Paso 3: Resumen y Confirmación**
- Desglose de pago (paquete, servicios, IVA)
- Anticipo requerido (30% del total)
- Monto a pagar el día del evento
- Términos y condiciones

**Cálculos Automáticos:**
```
Subtotal = Paquete + Servicios Adicionales
IVA = Subtotal * 0.16
Total = Subtotal + IVA
Anticipo = Total * 0.30
Restante = Total - Anticipo
```

---

### 3. ReservacionesPage
**Estado:** ⏳ Próximamente

**Funcionalidades Planeadas:**
- Listado de todas las reservaciones
- Búsqueda y filtrado
- Ver detalles de cada reservación
- Editar información
- Cambiar estado (pendiente → confirmado → pagado)

---

### 4. CalendarioPage
**Estado:** ⏳ Próximamente

**Funcionalidades Planeadas:**
- Vista de calendario completo
- Mostrar eventos en cada fecha
- Visualizar disponibilidad de horarios
- Bloquear fechas no disponibles
- Exportar calendario

---

### 5. PagosPage
**Estado:** ⏳ Próximamente

**Funcionalidades Planeadas:**
- Registrar pagos de clientes
- Ver pagos pendientes
- Procesar pagos (efectivo, tarjeta, transferencia)
- Generar recibos
- Reporte de ingresos

---

### 6. ClientesPage
**Estado:** ⏳ Próximamente

**Funcionalidades Planeadas:**
- Listado de clientes
- Agregar nuevo cliente
- Editar información de cliente
- Ver historico de eventos por cliente
- Estadísticas por cliente

---

## 🎨 Estilos y Diseño

### Paleta de Colores (app.scss)
```scss
$primary:   #4F46E5  // Indigo (botones, enlaces)
$secondary: #EC4899  // Rosa (acciones secundarias)
$accent:    #8B5CF6  // Violeta (highlights)
$dark:      #0F172A  // Gris oscuro (textos)
$positive:  #10B981  // Verde (confirmación)
$negative:  #EF4444  // Rojo (errores)
$info:      #0EA5E9  // Azul (información)
$warning:   #F59E0B  // Ámbar (advertencias)
```

### Variables CSS Globales (disponibles en todos los componentes)
```css
--sidebar-width: 260px
--header-height: 64px
--bg-main: #F8FAFC           // Fondo general
--bg-card: #ffffff            // Fondo de tarjetas
--text-primary: #0F172A      // Texto principal
--text-secondary: #475569    // Texto secundario
--text-muted: #94A3B8        // Texto deshabilitado
--border-color: #E2E8F0
--shadow-sm: ...             // Sombra pequeña
--shadow-md: ...             // Sombra media
--shadow-lg: ...             // Sombra grande
--radius-sm: 8px             // Borde redondeado pequeño
--radius-md: 16px            // Borde redondeado medio
--radius-lg: 24px            // Borde redondeado grande
```

### Tipografía
- **Fuente Principal:** Inter (importada de Google Fonts)
- **Pesos:** 300, 400, 500, 600, 700, 800

---

## 🔧 Tecnologías Utilizadas

### Framework y Herramientas
- **Vue 3** - Framework principal (versión moderna, composition API)
- **Quasar Framework** - Componentes UI y utilidades
- **Vue Router** - Sistema de rutas
- **Pinia** - Manejo de estado global
- **TypeScript** - Tipado estático
- **SCSS** - Preprocesador CSS

### Componentes Quasar Utilizados
- `q-layout` - Layout principal
- `q-drawer` - Sidebar
- `q-header` - Header superior
- `q-table` - Tablas
- `q-stepper` - Formulario multi-pasos
- `q-input` - Campos de entrada
- `q-select` - Selects
- `q-btn` - Botones
- `q-icon` - Iconos (Material Icons, MDI)
- `q-card` - Tarjetas
- `q-date` - Selectores de fecha

---

## 📊 Estado de Implementación

| Página | Estado | Completitud |
|--------|--------|-------------|
| Dashboard | ✅ Implementado | 100% |
| Nueva Reservación | 🔧 En desarrollo | 60% |
| Reservaciones | ⏳ Próximamente | 10% |
| Calendario | ⏳ Próximamente | 5% |
| Pagos | ⏳ Próximamente | 5% |
| Clientes | ⏳ Próximamente | 5% |

---

## 🚀 Cómo Ejecutar el Proyecto

### Instalación
```bash
cd mercurio-frontend
npm install
```

### Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Build para Producción
```bash
npm run build
```

---

## 📋 Guía de Contribución

Al agregar nuevas características:

1. **Crear nueva página en `src/pages/`**
   - Nombre en formato: `NombrePage.vue`
   - Incluir documentación en el `<script setup>`

2. **Agregar ruta en `src/router/index.ts`**
   - Incluir `meta.title` para el título de la página
   - Agrupar rutas relacionadas

3. **Documentar el componente**
   - Explicar propósito y flujo principal
   - Detallar componentes principales
   - Incluir estructuras de datos

4. **Seguir convenciones de estilo**
   - Usar variables CSS globales
   - Aplicar BEM para clases SCSS
   - Mantener tipado TypeScript

---

## 📝 Notas Importantes

- La aplicación usa **hash history** para URLs (ej: `/#/dashboard`)
- Los datos actualmente son **datos de ejemplo** (hardcoded)
- El backend no está implementado aún
- Las páginas en estado "Próximamente" mostrarán placeholder

---

## 🔗 Recursos Útiles

- [Vue 3 Documentation](https://vuejs.org)
- [Quasar Framework](https://quasar.dev)
- [Vue Router](https://router.vuejs.org)
- [Pinia](https://pinia.vuejs.org)
- [TypeScript](https://www.typescriptlang.org)

---

**Última actualización:** 10 de junio de 2026
