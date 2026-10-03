# REFERENCIA DE COMPONENTES - MERCURIO FRONTEND

## AdminLayout.vue - Layout Principal

### Propósito
Define la estructura general de la aplicación con tres áreas principales: sidebar, header y área de contenido.

### Estructura Visual
```
┌─────────────────────────────────────────────────┐
│ ☰  BUSCAR...    🔔  ❓  👤 Usuario Admin      │ Header
├──────────┬────────────────────────────────────┤
│          │                                    │
│ SIDEBAR  │                                    │
│          │      CONTENIDO DINÁMICO            │
│  - 📊 Dashboard                                │
│  - 📅 Reservaciones ▼                          │ Main
│    • + Nueva Reservación                       │
│    • Evento 1                                  │
│  - 📆 Calendario                               │
│  - 💳 Pagos                                    │
│  - 👥 Clientes                                 │
│                                                │
│ + Nueva Reserva                                │
└──────────┴────────────────────────────────────┘
```

### Estado Reactivo
```typescript
interface Reservacion {
  id: number
  nombre: string
  fecha: string
  status: 'pending' | 'confirmed' | 'paid'
}

// Datos
searchQuery = ref('')
reservacionesOpen = ref(false)
recentReservaciones = [
  { id: 1, nombre: 'Graduación Preescolar', fecha: '12 Oct', status: 'pending' }
  // ...
]

// Propiedades computadas
isReservacionesActive // true si está en ruta de reservaciones
isCajero              // true si es rol Cajero
roleTitle            // 'FEC Cajero' o 'FEC Admin'
userName             // Nombre del usuario
userRole             // Rol/puesto del usuario
userInitials         // Iniciales para avatar
```

### Métodos Principales
```typescript
toggleReservaciones()      // Abre/cierra submenu
```

### Características Principales
- Menú expandible de Reservaciones con submenu
- Indicadores visuales (colores) de estado de reservación
- Navegación automática a las rutas
- Información dinámicas del usuario según rol
- Animaciones suaves en transiciones

---

## DashboardPage.vue - Panel de Control

### Propósito
Mostrar resumen general del sistema con estadísticas clave y próximos eventos.

### Contenido
```
┌─────────────────────────────────────────────┐
│  📊 DASHBOARD - Eventos Próximos por Pagar  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐ ┌────────────┐ ┌────────┐│
│  │24 Eventos   │ │156         │ │$4.2k▲  ││ Estadísticas
│  │Próximos     │ │Confirmados │ │+8%     ││
│  └─────────────┘ └────────────┘ └────────┘│
│                                             │
│  ┌─────────────────────┐ ┌──────────────┐ │
│  │ TABLA DE EVENTOS    │ │ Mini         │ │
│  │ Evento | Fecha | $  │ │ Calendario   │ │
│  │                     │ │              │ │
│  │ Graduación Preescolar                 │ │
│  │ Cumpleaños Sofía                      │ │
│  │ Pool Party - Mateo                    │ │
│  │ Boda Civil - Ruiz                     │ │
│  └─────────────────────┘ │              │ │
│                          │              │ │
│  ┌──────────────────────────────────────┐ │
│  │ Próximos Eventos Este Mes            │ │
│  │ Pool Party - Mateo    14:00 - 18:00  │ │
│  │ Graduación Preescolar 19:00 - 23:00  │ │
│  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Interfaces
```typescript
interface Evento {
  id: number
  nombre: string
  fecha: string
  monto: string
  contacto: string
  pendiente: string
}

interface EventoMes {
  id: number
  nombre: string
  horario: string
  dia: number
}

interface CalendarDay {
  day: number | ''
  month: number
  isToday: boolean
  isPending: boolean
  isConfirmed: boolean
  isOtherMonth: boolean
}
```

### Estado
```typescript
// Datos de eventos
upcomingEvents = [
  { id: 1, nombre: 'Graduación Preescolar', fecha: '12 Oct 2026', monto: '$2,500.00', ... }
  // ...
]

upcomingThisMonth = [
  { id: 1, nombre: 'Pool Party - Mateo', horario: '14:00 – 18:00', dia: 10 }
  // ...
]

// Datos de calendario
calendarDays = [...]  // Grilla de 42 celdas (6 semanas)
daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

// Columnas de tabla
columns = [
  { name: 'nombre', label: 'NOMBRE DEL EVENTO', ... }
  // ...
]
```

### Funcionalidades
- Muestra estadísticas clave (tarjetas coloridas)
- Tabla con eventos próximos a liquidar
- Mini calendario del mes actual
- Indicadores visuales de estado (puntos de colores)
- Listado de eventos próximos con horarios

---

## NuevaReservacionPage.vue - Crear Reservación

### Propósito
Formulario multi-pasos (stepper) para crear nuevas reservaciones.

### Flujo en Pasos
```
PASO 1: Datos del Evento
├─ Datos del Cliente
│  ├─ Nombre completo
│  ├─ Teléfono
│  ├─ Email
│  ├─ Número de niños
│  └─ Tipo de evento
├─ Fecha y Horario
│  ├─ Calendario interactivo
│  ├─ Fecha seleccionada
│  ├─ Hora de inicio
│  ├─ Hora de fin
│  └─ Horario seleccionado

       ↓ [Continuar a Paquetes]

PASO 2: Paquetes y Extras
├─ Selección de Paquetes (cartas horizontales)
│  ├─ Básico Plus ($3,500)
│  ├─ Estándar ($4,800)
│  └─ Premium ($7,200)
└─ Servicios Externos (cartas horizontales)
   ├─ Show Infantil ($1,800)
   ├─ DJ Profesional ($2,500)
   └─ Mesa de Dulces ($3,200)

       ↓ [Continuar a Resumen]

PASO 3: Resumen y Confirmación
├─ Revisión de datos
├─ Desglose de Pago (panel sticky)
│  ├─ Paquete $X
│  ├─ Servicios $X
│  ├─ IVA 16% $X
│  ├─ Total $X
│  ├─ Anticipo 30% $X
│  └─ Restante a pagar $X
├─ Términos y condiciones
└─ Botón confirmar
```

### Interfaces
```typescript
interface Package {
  id: number
  name: string
  capacity: number
  price: string
  priceNum: number
  features: string[]
  recommended?: boolean
}

interface ExternalService {
  id: number
  name: string
  desc: string
  price: string
  priceNum: number
  selected: boolean
}

interface BookingCalendarDay {
  day: number | ''
  isToday: boolean
  isBooked: boolean
  isOtherMonth: boolean
}
```

### Estado
```typescript
// Control de pasos
step = ref(1)  // 1, 2, o 3

// Datos del formulario
form = {
  nombre: '',
  telefono: '',
  email: '',
  ninos: 20,
  tipoEvento: 'Cumpleaños Infantil',
  selectedDay: 5,
  horaInicio: '15:00',
  horaFin: '18:00',
  selectedPackage: 1,
  termsAccepted: false
}

// Calendario
currentMonth = 9   // 0-based (Octubre)
currentYear = 2026
bookedDays = [3, 7, 10, 15, 21, 22]  // Días no disponibles

// Paquetes disponibles
packages = [
  { id: 1, name: 'Básico Plus', capacity: 20, price: '$3,500', priceNum: 3500, ... }
  // ...
]

// Servicios externos
externalServices = [
  { id: 1, name: 'Show Infantil', desc: 'Animación por 2 horas', price: '$1,800', ... }
  // ...
]
```

### Métodos Principales
```typescript
prevMonth()              // Navega al mes anterior
nextMonth()             // Navega al mes siguiente
selectDay(day: number)  // Selecciona un día
handleDayClick(day)     // Maneja click en día
selectPackage(pkg)      // Selecciona paquete
toggleService(svc)      // Agrega/quita servicio
```

### Propiedades Computadas
```typescript
currentMonthLabel      // "Octubre 2026"
bookingCalendarDays    // Array de 42 celdas para renderizar
selectedDateLabel      // "5 de Octubre, 2026"
timeSlotLabel          // "03:00 PM – 06:00 PM"

// Cálculos de pago
selectedPkg            // Paquete actual seleccionado
packagePriceNum        // Precio del paquete (número)
extraServicesNum       // Suma de servicios seleccionados
subtotal               // Paquete + servicios
ivaNum                 // Subtotal * 0.16 (redondeado)
totalNum               // Subtotal + IVA
advanceNum             // Total * 0.30 (redondeado)
remainingNum           // Total - Anticipo

// Versiones formateadas para mostrar
packagePrice           // "$3,500.00"
extraServicesTotal     // "$1,800.00"
ivaAmount              // "$800.00"
totalAmount            // "$6,100.00"
advanceAmount          // "$1,830.00"
remainingAmount        // "$4,270.00"
```

### Características
- Stepper visual con 3 pasos
- Calendario interactivo con días marcados como no disponibles
- Selección de paquetes con recomendación
- Agregación de servicios externos (múltiple selección)
- Cálculo automático de precios con IVA
- Anticipo requerido (30% del total)
- Panel sticky con desglose de pago
- Validación de términos antes de confirmar

---

## Páginas en Desarrollo

### ReservacionesPage.vue
**Estado:** ⏳ Próximamente
- Listado de reservaciones
- Búsqueda y filtrado
- Ver/editar detalles

### CalendarioPage.vue
**Estado:** ⏳ Próximamente
- Calendario mes/semana/día
- Eventos en cada fecha
- Bloqueo de fechas

### PagosPage.vue
**Estado:** ⏳ Próximamente
- Registrar pagos
- Pagos pendientes
- Generar recibos

### ClientesPage.vue
**Estado:** ⏳ Próximamente
- Listado de clientes
- Agregar/editar
- Histórico de eventos

---

## Estilos Comunes

### Tarjetas (panel-card)
```vue
<div class="panel-card">
  <div class="panel-card__header">
    <h3>Título</h3>
    <q-btn ... />
  </div>
  <!-- Contenido -->
</div>
```

### Secciones de Formulario (form-section)
```vue
<div class="form-section">
  <div class="form-section__title">
    <q-icon name="..." />
    Título de Sección
  </div>
  <!-- Campos -->
</div>
```

### Etiquetas de Campo (field-label)
```vue
<div class="field-label">ETIQUETA</div>
```

---

## Iconos Disponibles

### Material Icons (recomendados)
- `dashboard` - Dashboard
- `event` - Eventos
- `event_note` - Reservaciones
- `calendar_today` - Calendario
- `payment` - Pagos
- `group` - Clientes
- `person_outline` - Persona
- `check_circle` - Confirmado
- `access_time` - Hora
- `edit` - Editar
- `delete` - Eliminar
- `save` - Guardar
- `close` - Cerrar
- `search` - Buscar
- `notifications_none` - Notificaciones
- `help_outline` - Ayuda

---

**Última actualización:** 10 de junio de 2026
