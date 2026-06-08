import { config } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia } from 'pinia'

// Instala Quasar y Pinia globalmente para todos los tests de componentes.
config.global.plugins = [Quasar, createPinia()]
