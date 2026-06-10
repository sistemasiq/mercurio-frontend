/**
 * Punto de entrada principal de la aplicación Mercurio
 * 
 * FUNCIÓN PRINCIPAL:
 * Este archivo es el bootstrap de la aplicación Vue 3 que:
 * 1. Crea la instancia de Vue
 * 2. Configura Quasar Framework con estilos y iconos
 * 3. Inicializa Pinia para manejo de estado global
 * 4. Configura el router para navegación entre páginas
 * 5. Monta la aplicación en el elemento #app del DOM
 * 
 * FLUJO DE INICIALIZACIÓN:
 * Importa → Crea App → Configura Quasar → Agrega Pinia → Agrega Router → Monta en #app
 */

import { createApp } from 'vue'
import { Quasar, Notify, Dialog, Loading } from 'quasar'
import { createPinia } from 'pinia'
import router from './router'

import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/mdi-v7/mdi-v7.css'

import 'quasar/src/css/index.sass'
import './css/app.scss'

import App from './App.vue'

// Crea la instancia principal de la aplicación Vue
const app = createApp(App)

// Configura Quasar con plugins y paleta de colores corporativa
// Notify: para notificaciones Toast
// Dialog: para diálogos modales
// Loading: para indicadores de carga
app.use(Quasar, {
  plugins: { Notify, Dialog, Loading },
  config: {
    brand: {
      primary: '#1a237e',
      secondary: '#e53935',
      accent: '#9C27B0',
      dark: '#1d1d1d',
      positive: '#21BA45',
      negative: '#C10015',
      info: '#31CCEC',
      warning: '#F2C037'
    }
  }
})

// Inicializa Pinia para manejo centralizado del estado
app.use(createPinia())

// Configura el sistema de rutas para navegación entre páginas
app.use(router)

// Monta la aplicación en el elemento con id="app" en index.html
app.mount('#app')
