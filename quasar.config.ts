import { defineConfig } from '#q-app/wrappers'

export default defineConfig((/* ctx */) => {
  return {
    boot: [],

    css: ['app.scss'],

    extras: ['roboto-font', 'material-icons', 'mdi-v7'],

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
          primary: '#025FE0',
          secondary: '#F31258',
          accent: '#65B80B',
          dark: '#0B1450',
          positive: '#3FA834',
          negative: '#DC2626',
          info: '#0FA4FE',
          warning: '#FFC107',
        },
      },
      plugins: ['Notify', 'Dialog', 'Loading'],
    },

    animations: [],
  }
})
