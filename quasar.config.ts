import { defineConfig } from '#q-app/wrappers'

export default defineConfig((/* ctx */) => {
  return {
    boot: [],

    css: ['app.scss'],

    extras: [
      'roboto-font',
      'material-icons',
      'mdi-v7',
    ],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20',
      },
      vueRouterMode: 'hash',
      typescript: {
        strict: true,
        vueShim: true,
      },
    },

    devServer: {
      open: true,
    },

    framework: {
      config: {
        brand: {
          primary: '#1a237e',
          secondary: '#e53935',
          accent: '#5c6bc0',
          dark: '#0f1221',
          positive: '#00c853',
          negative: '#d32f2f',
          info: '#29b6f6',
          warning: '#ffa000',
        }
      },
      plugins: ['Notify', 'Dialog', 'Loading'],
    },

    animations: [],
  }
})
