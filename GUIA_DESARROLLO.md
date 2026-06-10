# GUÍA DE DESARROLLO - MERCURIO FRONTEND

## Estándares de Codificación

### Nombrado de Archivos y Componentes

```
✅ CORRECTO:
- DashboardPage.vue
- AdminLayout.vue
- useReservaciones.ts (para composables)
- reservaciones.ts (para stores de Pinia)

❌ INCORRECTO:
- dashboard.vue
- admin-layout.vue
- Dashboard.ts
```

### Estructura de Componentes Vue

Todos los componentes deben seguir esta estructura:

```vue
/**
 * NOMBRE DEL COMPONENTE
 * 
 * PROPÓSITO:
 * Descripción clara de qué hace este componente
 * 
 * CARACTERÍSTICAS PRINCIPALES:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 */

<template>
  <!-- Contenido del template -->
</template>

<script setup lang="ts">
// Importes
import { ref, computed } from 'vue'

// Interfaces y tipos
interface Datos {
  id: number
  nombre: string
}

// Estado reactivo (ref, reactive)
const state = ref('')

// Propiedades computadas
const computed = computed(() => {
  return state.value.toUpperCase()
})

// Métodos
const metodo = () => {
  // Lógica
}
</script>

<style lang="scss" scoped>
// Estilos del componente
</style>
```

### Organización de Métodos y Propiedades

Dentro de `<script setup>`:

```typescript
// 1. Importes
import { ref, computed, watch } from 'vue'

// 2. Interfaces y tipos
interface MiInterfaz {
  propiedad: string
}

// 3. Estado reactivo
const miVariable = ref('')

// 4. Props computadas
const miComputada = computed(() => {
  return miVariable.value
})

// 5. Métodos
const miMetodo = () => {
  // Lógica
}

// 6. Watchers
watch(miVariable, (valor) => {
  // Reaccionar a cambios
})
```

---

## Convenciones de CSS (SCSS)

### Sistema BEM para clases

```scss
// Bloque principal
.sidebar {
  background: #1a237e;
  
  // Elemento dentro del bloque
  &__logo {
    padding: 24px 20px;
  }
  
  // Modificador (variación del bloque)
  &--active {
    background: #blue;
  }
  
  // Sub-elemento dentro de elemento
  &__logo-title {
    font-size: 1.2rem;
  }
}
```

### Variables CSS Globales

Siempre usar variables CSS en lugar de valores hardcodeados:

```scss
// ✅ CORRECTO
color: var(--text-primary);
background: var(--bg-card);
border-radius: var(--radius-md);
box-shadow: var(--shadow-lg);

// ❌ INCORRECTO
color: #0F172A;
background: #ffffff;
border-radius: 16px;
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
```

### Responsive Design

Siempre considerar mobile-first:

```scss
.contenedor {
  width: 100%; // Mobile
  padding: 16px;
  
  @media (min-width: 768px) {
    // Tablet
    padding: 24px;
  }
  
  @media (min-width: 1024px) {
    // Desktop
    width: 80%;
    padding: 32px;
  }
}
```

---

## TypeScript - Tipos y Interfaces

### Nombrado de Interfaces

```typescript
// ✅ CORRECTO - Singular, PascalCase
interface Reservacion {
  id: number
  nombre: string
}

// ❌ INCORRECTO
interface reservacion {}
interface IReservacion {}
interface Reservaciones {}
```

### Tipos de Datos Comunes

```typescript
// Booleanos
const isActive = ref<boolean>(false)

// Strings
const nombre = ref<string>('')

// Números
const edad = ref<number>(0)

// Unión de tipos
const status = ref<'pending' | 'confirmed' | 'paid'>('pending')

// Arrays
const items = ref<Reservacion[]>([])

// Objetos
const user = ref<{ name: string; email: string }>({
  name: '',
  email: ''
})
```

---

## Cómo Agregar Una Nueva Página

### Paso 1: Crear el componente
Crear archivo `src/pages/MiPaginaPage.vue`:

```vue
/**
 * PÁGINA: MI PÁGINA
 * 
 * PROPÓSITO:
 * Breve descripción de qué hace esta página
 */

<template>
  <q-page class="page-content">
    <!-- Contenido -->
  </q-page>
</template>

<script setup lang="ts">
// Lógica
</script>

<style lang="scss" scoped>
// Estilos
</style>
```

### Paso 2: Agregar la ruta
En `src/router/index.ts`, agregar dentro del array `children`:

```typescript
{
  path: '/mi-pagina',
  name: 'mi-pagina',
  component: () => import('../pages/MiPaginaPage.vue'),
  meta: { title: 'Mi Página - FEC Admin' }
}
```

### Paso 3: Agregar al menú
En `src/layouts/AdminLayout.vue`, agregar item al sidebar:

```vue
<div
  class="sidebar__item"
  :class="{ 'sidebar__item--active': $route.name === 'mi-pagina' }"
  @click="$router.push({ name: 'mi-pagina' })"
>
  <q-icon name="icon_name" />
  Mi Página
</div>
```

---

## Cómo Usar Quasar Componentes

### Botones
```vue
<!-- Botón primario -->
<q-btn
  unelevated
  color="primary"
  label="Guardar"
  icon="save"
  @click="guardar"
/>

<!-- Botón con outline -->
<q-btn
  outline
  color="primary"
  label="Cancelar"
/>

<!-- Botón plano -->
<q-btn
  flat
  label="Más información"
/>
```

### Tablas
```vue
<q-table
  :rows="datos"
  :columns="columnas"
  row-key="id"
  flat
  hide-pagination
/>
```

### Inputs
```vue
<!-- Input de texto -->
<q-input
  v-model="nombre"
  dense
  outlined
  label="Nombre"
  placeholder="Ingresa el nombre"
/>

<!-- Input de número -->
<q-input
  v-model.number="edad"
  dense
  outlined
  type="number"
  label="Edad"
/>

<!-- Select -->
<q-select
  v-model="opcion"
  dense
  outlined
  :options="opciones"
  label="Elige una opción"
/>

<!-- Checkbox -->
<q-checkbox
  v-model="aceptado"
  label="Acepto términos y condiciones"
/>

<!-- Date picker -->
<q-input
  v-model="fecha"
  dense
  outlined
  type="date"
  label="Fecha"
/>
```

### Dialogs y Modales
```vue
<q-dialog v-model="mostrarDialogo">
  <q-card>
    <q-card-section>
      Contenido del diálogo
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat label="Cancelar" v-close-dialog />
      <q-btn unelevated color="primary" label="Confirmar" @click="confirmar" />
    </q-card-actions>
  </q-card>
</q-dialog>
```

### Iconos Disponibles
- Material Icons (ej: `save`, `delete`, `edit`, `add`, etc)
- MDI v7 (ej: `mdi-github`)
- Ver documentación oficial de Quasar

---

## Estado Global con Pinia

### Crear un Store

Crear archivo `src/stores/miStore.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMiStore = defineStore('miStore', () => {
  // Estado
  const contador = ref(0)
  
  // Propiedades computadas
  const contadorDoble = computed(() => contador.value * 2)
  
  // Acciones (métodos)
  const incrementar = () => {
    contador.value++
  }
  
  const decrementar = () => {
    contador.value--
  }
  
  return {
    contador,
    contadorDoble,
    incrementar,
    decrementar
  }
})
```

### Usar el Store en un componente

```typescript
import { useMiStore } from '@/stores/miStore'

const miStore = useMiStore()

// Acceder a estado
console.log(miStore.contador)

// Acceder a propiedades computadas
console.log(miStore.contadorDoble)

// Llamar acciones
miStore.incrementar()
```

---

## Composables Reutilizables

### Crear un composable

Crear archivo `src/composables/useMiComposable.ts`:

```typescript
import { ref, computed } from 'vue'

export function useMiComposable() {
  // Estado local del composable
  const estado = ref('')
  
  // Métodos
  const metodo = () => {
    // Lógica
  }
  
  // Propiedades computadas
  const propiedad = computed(() => {
    return estado.value.toUpperCase()
  })
  
  return {
    estado,
    metodo,
    propiedad
  }
}
```

### Usar el composable

```typescript
import { useMiComposable } from '@/composables/useMiComposable'

const { estado, metodo, propiedad } = useMiComposable()
```

---

## Testing (Próximo a Implementar)

### Estructura de tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MiComponente from '@/components/MiComponente.vue'

describe('MiComponente', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(MiComponente)
  })

  it('Debe renderizar correctamente', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('Debe actualizar el texto al hacer clic', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('Actualizado')
  })
})
```

---

## Debugging y Troubleshooting

### Vue DevTools
- Usar extensión Vue DevTools para Chrome/Firefox
- Inspeccionar componentes, estado, rutas

### Quasar Dev Tools
- `Quasar Dev Tools` incluye inspector de componentes

### Logging
```typescript
// Para debugging
console.log('Variable:', miVariable.value)
console.warn('Advertencia:', mensaje)
console.error('Error:', error)

// Breakpoints en DevTools
debugger
```

---

## Performance Optimization

### Lazy Loading de Componentes
```typescript
// Router - Carga perezosa automática con import()
component: () => import('../pages/MiPaginaPage.vue')
```

### Computed vs Method
```typescript
// ✅ CORRECTO - Cached (más rápido si se usa múltiples veces)
const resultado = computed(() => {
  return datos.value.filter(x => x.activo)
})

// ❌ Evitar si se llama muchas veces - Se recalcula siempre
const resultado = () => {
  return datos.value.filter(x => x.activo)
}
```

### Watch con opciones
```typescript
// Solo ejecutar cuando el usuario deja de escribir (debounce)
watch(busqueda, (valor) => {
  buscar(valor)
}, { 
  debounce: 500 
})
```

---

## Buenas Prácticas

1. **Mantener componentes pequeños** - Máximo 300 líneas
2. **Reutilizar componentes** - Crear componentes genéricos
3. **Documentar funciones complejas** - Especialmente en lógica de negocio
4. **Usar TypeScript** - Evitar `any`
5. **Evitar el prop drilling** - Usar store o composables
6. **Usar scoped styles** - Para evitar conflictos de CSS
7. **Nombrar eventos descriptivamente** - `@update:nombre` no `@click`
8. **Comentar el "por qué"** - No el "qué" (el código lo dice)

---

## Checklist Pre-Commit

Antes de hacer commit, verificar:

- [ ] Código formateado correctamente
- [ ] Sin console.log de debug
- [ ] Sin comentarios innecesarios
- [ ] TypeScript sin errores
- [ ] Componentes documentados
- [ ] Responsive en mobile/tablet/desktop
- [ ] Sin imports no utilizados
- [ ] Nombres descriptivos de variables/funciones

---

**Última actualización:** 10 de junio de 2026
