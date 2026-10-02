<template>
  <router-view />
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'

// El diseño usa Material Icons Outlined en toda la app. Los nombres "planos"
// (home, edit, …) se resuelven a la variante outlined; los que ya traen
// prefijo (o_, sym_o_, mdi-, img:) se dejan como están.
const $q = useQuasar()
const PLAIN_ICON = /^[a-z0-9_]+$/

$q.iconMapFn = (iconName: string) =>
  PLAIN_ICON.test(iconName) ? { cls: 'material-icons-outlined', content: iconName } : undefined
</script>
