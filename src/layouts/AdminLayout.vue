<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Sidebar / Drawer -->
    <q-drawer
      :model-value="true"
      :width="280"
      :breakpoint="700"
      show-if-above
      no-swipe-close
    >
      <div class="sidebar full-height column">
        <!-- Logo -->
        <div class="sidebar__logo">
          <div class="logo-title">{{ roleTitle }}</div>
          <div class="logo-sub">Staff Portal</div>
        </div>

        <!-- Navigation -->
        <nav class="sidebar__nav">
          <!-- Dashboard -->
          <div
            class="sidebar__item"
            :class="{ 'sidebar__item--active': $route.name === 'dashboard' }"
            @click="$router.push({ name: 'dashboard' })"
          >
            <q-icon name="dashboard" />
            Dashboard
          </div>

          <!-- Reservaciones (expandable) -->
          <div>
            <div
              class="sidebar__item sidebar__item--parent"
              :class="{ 'sidebar__item--active': isReservacionesActive }"
              @click="toggleReservaciones"
            >
              <q-icon name="event_note" />
              Reservaciones
              <q-icon
                :name="reservacionesOpen ? 'expand_less' : 'expand_more'"
                size="18px"
                class="q-ml-auto"
              />
            </div>

            <!-- Sub-items -->
            <transition name="submenu">
              <div v-if="reservacionesOpen" class="sidebar__submenu">
                <!-- Nueva Reservación -->
                <div
                  class="sidebar__subitem sidebar__subitem--new"
                  :class="{ 'sidebar__subitem--active': $route.name === 'nueva-reservacion' }"
                  @click="$router.push({ name: 'nueva-reservacion' })"
                >
                  <q-icon name="add_circle_outline" size="14px" />
                  Nueva Reservación
                </div>

                <!-- Separator -->
                <div class="sidebar__submenu-label">Recientes</div>

                <!-- Existing reservations -->
                <div
                  v-for="res in recentReservaciones"
                  :key="res.id"
                  class="sidebar__subitem"
                  @click="$router.push({ name: 'reservaciones' })"
                >
                  <span
                    class="sidebar__res-dot"
                    :class="`sidebar__res-dot--${res.status}`"
                  ></span>
                  <div class="sidebar__res-info">
                    <span class="sidebar__res-name">{{ res.nombre }}</span>
                    <span class="sidebar__res-date">{{ res.fecha }}</span>
                  </div>
                </div>

                <!-- Ver todas -->
                <div
                  class="sidebar__subitem sidebar__subitem--all"
                  @click="$router.push({ name: 'reservaciones' })"
                >
                  <q-icon name="list_alt" size="14px" />
                  Ver todas
                </div>
              </div>
            </transition>
          </div>

          <!-- Calendario -->
          <div
            class="sidebar__item"
            :class="{ 'sidebar__item--active': $route.name === 'calendario' }"
            @click="$router.push({ name: 'calendario' })"
          >
            <q-icon name="calendar_today" />
            Calendario
          </div>

          <!-- Pagos -->
          <div
            class="sidebar__item"
            :class="{ 'sidebar__item--active': $route.name === 'pagos' }"
            @click="$router.push({ name: 'pagos' })"
          >
            <q-icon name="payment" />
            Pagos
          </div>

          <!-- Clientes -->
          <div
            class="sidebar__item"
            :class="{ 'sidebar__item--active': $route.name === 'clientes' }"
            @click="$router.push({ name: 'clientes' })"
          >
            <q-icon name="group" />
            Clientes
          </div>
        </nav>

        <!-- Nueva Reserva Button -->
        <div class="nueva-reserva-btn">
          <q-btn
            unelevated
            color="secondary"
            label="+ Nueva Reserva"
            class="full-width"
            style="border-radius: 8px; font-weight: 700;"
            @click="$router.push({ name: 'reservaciones' })"
          />
        </div>
      </div>
    </q-drawer>

    <!-- Header -->
    <q-header class="bg-white text-dark" style="box-shadow: var(--shadow-sm);">
      <div class="top-header">
        <!-- Search -->
        <div class="top-header__search">
          <q-input
            v-model="searchQuery"
            dense
            outlined
            placeholder="Buscar reservaciones, clientes..."
            style="font-size: 0.875rem;"
          >
            <template #prepend>
              <q-icon name="search" color="grey-5" size="18px" />
            </template>
          </q-input>
        </div>

        <!-- Actions -->
        <div class="top-header__actions">
          <q-btn flat round dense icon="notifications_none" color="grey-7">
            <q-badge color="red" floating transparent>3</q-badge>
          </q-btn>
          <q-btn flat round dense icon="help_outline" color="grey-7" />

          <!-- User Info -->
          <div class="top-header__user">
            <div class="text-right">
              <div class="user-name">{{ userName }}</div>
              <div class="user-role">{{ userRole }}</div>
            </div>
            <q-avatar size="36px" color="primary" text-color="white">
              <span>{{ userInitials }}</span>
            </q-avatar>
          </div>
        </div>
      </div>
    </q-header>

    <!-- Page Content -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
/**
 * LAYOUT PRINCIPAL DE ADMINISTRACIÓN
 * 
 * ESTRUCTURA DE COMPONENTES:
 * Este layout define la estructura general de toda la aplicación con:
 * 1. SIDEBAR IZQUIERDO - Navegación principal y menú expandible
 * 2. HEADER SUPERIOR - Buscador, notificaciones, info del usuario
 * 3. CONTENEDOR DE PÁGINAS - Área donde se renderizan las páginas
 * 
 * CARACTERÍSTICAS PRINCIPALES:
 * - Menú expandible de Reservaciones con submenu
 * - Navbar con búsqueda y usuario info
 * - Estados dinámicos según la ruta actual
 * - Soporte para diferentes roles (Admin vs Cajero)
 * 
 * FUNCIONAMIENTO:
 * El layout se mantiene visible mientras navegas entre páginas,
 * y solo el contenido dentro de <router-view /> cambia.
 */

import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

interface Reservacion {
  id: number
  nombre: string
  fecha: string
  status: 'pending' | 'confirmed' | 'paid'
}

const route = useRoute()
const searchQuery = ref('')

const reservacionesOpen = ref(false)

const isReservacionesActive = computed(() =>
  ['reservaciones', 'nueva-reservacion'].includes(route.name as string)
)

// Abre automáticamente el submenu cuando estás en una página de reservaciones
watch(isReservacionesActive, (val) => {
  if (val) reservacionesOpen.value = true
}, { immediate: true })

// Alterna entre abrir/cerrar el submenu de reservaciones
const toggleReservaciones = () => {
  reservacionesOpen.value = !reservacionesOpen.value
}

// Lista de reservaciones recientes para mostrar en el submenu
const recentReservaciones: Reservacion[] = [
  { id: 1, nombre: 'Graduación Preescolar', fecha: '12 Oct',  status: 'pending' },
  { id: 2, nombre: 'Cumpleaños Sofía',      fecha: '15 Oct',  status: 'pending' },
  { id: 3, nombre: 'Pool Party - Mateo',    fecha: '10 Oct',  status: 'paid' },
  { id: 4, nombre: 'Boda Civil - Ruiz',     fecha: '20 Oct',  status: 'confirmed' },
]

// Determina si el usuario actual es un cajero o administrador
// Basado en la página actual que está visitando
const isCajero = computed(() =>
  ['nueva-reservacion', 'reservaciones'].includes(route.name as string)
)

// Título del rol que se muestra en el sidebar
const roleTitle    = computed(() => isCajero.value ? 'FEC Cajero' : 'FEC Admin')
// Nombre del usuario actual (datos de ejemplo)
const userName     = computed(() => isCajero.value ? 'Cajero Staff' : 'Admin EVE-01')
// Rol del usuario (descripción del puesto/turno)
const userRole     = computed(() => isCajero.value ? 'TURNO TARDE' : 'SUPER ADMINISTRADOR')
// Iniciales del usuario para mostrar en el avatar
const userInitials = computed(() => isCajero.value ? 'CS' : 'AE')
</script>

<style lang="scss" scoped>
// ── Submenu animation ─────────────────────────────────────────────────────────
.submenu-enter-active,
.submenu-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 400px;
  overflow: hidden;
}
.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}

// ── Sidebar sub-menu ──────────────────────────────────────────────────────────
.sidebar__submenu {
  background: rgba(0, 0, 0, 0.15);
  padding: 4px 0;
}

.sidebar__item--parent {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar__submenu-label {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  padding: 8px 20px 4px 44px;
}

.sidebar__subitem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 8px 44px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
  transition: all 0.15s;
  border-left: 2px solid transparent;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }

  &--active {
    color: #fff;
    border-left-color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.08);
  }

  &--new {
    color: #a5b4fc;
    font-weight: 600;
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 4px;

    &:hover {
      color: #c7d2fe;
    }
  }

  &--all {
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    margin-top: 4px;
    padding-top: 10px;

    &:hover {
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

// ── Reservation mini-card in sidebar ──────────────────────────────────────────
.sidebar__res-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;

  &--pending   { background: #f87171; }
  &--confirmed { background: #60a5fa; }
  &--paid      { background: #4ade80; }
}

.sidebar__res-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.sidebar__res-name {
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.sidebar__res-date {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.38);
  line-height: 1.2;
}
</style>
