import { createApp } from 'vue'
import { config } from '@vue/test-utils'
import { Quasar, Notify } from 'quasar'
import { createPinia } from 'pinia'

// Instala Quasar y Pinia globalmente para todos los tests de componentes.
config.global.plugins = [Quasar, createPinia()]

// Notify.create(...) es global a Quasar (no depende de un árbol de componentes
// montado) pero sí necesita que algún app.use(Quasar, {plugins:{Notify}}) haya
// corrido antes -- los tests de stores (Pinia puro, sin @vue/test-utils mount())
// nunca disparan config.global.plugins, así que se instala aquí una vez, en un
// app headless que nunca se monta, solo para registrar el plugin.
createApp({}).use(Quasar, { plugins: { Notify } })
