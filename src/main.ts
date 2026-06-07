import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setupPlugins } from './boot/setupPlugins'

const app = createApp(App)

setupPlugins(app, router)

app.mount('#app')
