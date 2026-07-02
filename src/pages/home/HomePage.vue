<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface HomeCard {
  permission: string
  routeName: string
  icon: string
  color: string
  title: string
  description: string
}

const auth = useAuthStore()
const router = useRouter()

const cards: HomeCard[] = [
  {
    permission: 'pos:acceder',
    routeName: 'pos-caja',
    icon: 'point_of_sale',
    color: 'secondary',
    title: 'Caja',
    description: 'Operaciones de punto de venta y turnos.',
  },
  {
    permission: 'restaurante:gestionar_cocina',
    routeName: 'pos-cocina',
    icon: 'restaurant',
    color: 'orange',
    title: 'Cocina',
    description: 'Visor de comandas y estado de pedidos.',
  },
  {
    permission: 'usuarios:listar',
    routeName: 'usuarios-listar',
    icon: 'group',
    color: 'primary',
    title: 'Usuarios',
    description: 'Gestión de usuarios del sistema.',
  },
  {
    permission: 'sucursales:listar',
    routeName: 'sucursales-listar',
    icon: 'store',
    color: 'primary',
    title: 'Sucursales',
    description: 'Gestión de sucursales de la franquicia.',
  },
  {
    permission: 'reportes:dashboard',
    routeName: 'reportes-dashboard',
    icon: 'query_stats',
    color: 'primary',
    title: 'Reportes',
    description: 'Panel general de indicadores.',
  },
  {
    permission: 'estancias:ver_activos',
    routeName: 'control-acceso',
    icon: 'badge',
    color: 'orange',
    title: 'Control de Acceso',
    description: 'Monitoreo de niños en estancia activa.',
  },
]

const visibleCards = computed(() => cards.filter((card) => auth.hasPermission(card.permission)))
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="text-h5 text-weight-bold q-mb-xs">
      Bienvenido, <strong>{{ auth.currentUser?.name ?? auth.currentUser?.email }}</strong>
    </div>
    <p class="text-body2 text-grey-6 q-mb-lg">Elige a dónde quieres ir.</p>

    <div class="row q-col-gutter-md">
      <div v-for="card in visibleCards" :key="card.routeName" class="col-12 col-sm-6 col-md-4">
        <q-card class="cursor-pointer" flat bordered @click="router.push({ name: card.routeName })">
          <q-card-section class="text-center">
            <q-icon :name="card.icon" :color="card.color" size="48px" />
            <div class="text-h6 q-mt-sm">{{ card.title }}</div>
            <p class="text-body2 text-grey-6">{{ card.description }}</p>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-if="visibleCards.length === 0" class="text-center text-grey-6 q-mt-xl">
      No tienes módulos asignados todavía. Contacta a un administrador.
    </div>
  </q-page>
</template>
