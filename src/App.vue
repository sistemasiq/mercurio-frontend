<template>
  <router-view />
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'

// El diseño usa Material Icons Outlined en toda la app. Los nombres "planos"
// (home, edit, …) se resuelven a la variante outlined; los que ya traen
// prefijo (o_, r_, s_, sym_o_, mdi-, img:) se dejan como están; el icon set
// outlined de Quasar ya usa o_ en sus íconos internos.
const $q = useQuasar()
const PLAIN_ICON = /^(?!o_|r_|s_|sym_)[a-z0-9_]+$/

$q.iconMapFn = (iconName: string) =>
  PLAIN_ICON.test(iconName) ? { cls: 'material-icons-outlined', content: iconName } : undefined
</script>
