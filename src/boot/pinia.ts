/**
 * INICIALIZADOR DE PINIA (MANEJO DE ESTADO GLOBAL)
 * 
 * FUNCIÓN:
 * Este archivo es un "boot file" de Quasar que se ejecuta automáticamente
 * durante la inicialización de la aplicación.
 * 
 * CÓMO FUNCIONA:
 * 1. Se ejecuta antes de que la aplicación esté completamente lista
 * 2. Inicializa Pinia en la instancia de Vue
 * 3. Permite el uso de stores (almacenes de estado) en toda la app
 * 
 * ¿QUÉ ES PINIA?
 * Es una librería de manejo de estado (similar a Vuex) que permite:
 * - Guardar datos globales accesibles desde cualquier componente
 * - Crear y usar "stores" reactivos
 * - Compartir información entre componentes sin prop drilling
 * 
 * EJEMPLO DE USO:
 * En cualquier componente puedes usar:
 * const store = useMyStore()
 * store.contador++
 */

import { defineBoot } from '#q-app/wrappers'
import { createPinia } from 'pinia'

// Boot file: función que se ejecuta automáticamente al iniciar la app
export default defineBoot(({ app }) => {
  // Agrega Pinia a la aplicación Vue
  app.use(createPinia())
})
