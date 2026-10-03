<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/auth'
import { useSucursalesStore } from '@/stores/sucursales'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { getInitials, getAvatarColor } from '@/utils/avatar'
import CambiarPinDialog from '@/components/usuarios/CambiarPinDialog.vue'
import type { NavGroup } from '@/types/navigation'

// C1: diálogo "Cambiar mi PIN" en el menú del usuario. Toque mínimo de este
// archivo (propiedad de C4): solo este ref y el botón/diálogo abajo.
const showCambiarPin = ref(false)

const auth = useAuthStore()
const turno = useTurnoCajaStore()
const sucursalesStore = useSucursalesStore()
const route = useRoute()
const router = useRouter()
const { visibleGroups, badgeFor } = useAppNavigation()
const { openPalette } = useCommandPalette()

// ── Grupos plegables ────────────────────────────────────────────────────────
// Se abre el grupo de la ruta activa (en Inicio, Operación). El resto queda
// plegado y muestra el total de sus contadores en el encabezado.
const openGroups = ref<Set<string>>(new Set())

// Ítem del menú de la ruta actual: coincidencia exacta o, para pantallas fuera
// del menú (detalle de sucursal, kardex de insumo…), el ítem cuya ruta es el
// prefijo más largo de la actual.
const activeItem = computed<string | null>(() => {
  const items = visibleGroups.value.flatMap((g) => g.items)
  if (items.some((i) => i.routeName === route.name)) return route.name as string
  let best: { name: string; length: number } | null = null
  for (const item of items) {
    const itemPath = router.resolve({ name: item.routeName }).path
    if (route.path.startsWith(itemPath + '/') && (!best || itemPath.length > best.length)) {
      best = { name: item.routeName, length: itemPath.length }
    }
  }
  return best?.name ?? null
})

function groupOfRoute(name: string | null): string | null {
  if (!name || name === 'home') return 'Operación'
  return visibleGroups.value.find((g) => g.items.some((i) => i.routeName === name))?.label ?? null
}

watch(
  activeItem,
  (name) => {
    const label = name || route.name === 'home' ? groupOfRoute(name) : null
    if (label) openGroups.value = new Set([...openGroups.value, label])
  },
  { immediate: true },
)

function isOpen(group: NavGroup): boolean {
  return !group.label || openGroups.value.has(group.label)
}

function toggleGroup(label: string): void {
  const next = new Set(openGroups.value)
  if (next.has(label)) next.delete(label)
  else next.add(label)
  openGroups.value = next
}

function groupBadge(group: NavGroup): number {
  return group.items.reduce((sum, item) => sum + (badgeFor(item.routeName)?.count ?? 0), 0)
}

function isActive(routeName: string): boolean {
  return activeItem.value === routeName
}

// ── Sucursal ────────────────────────────────────────────────────────────────
// AdministradorSistema no tiene sucursal propia; el selector le permite
// "pararse" en una para ver sus catálogos/listados sin cerrar sesión.
const branchLabel = computed(() => {
  if (!auth.isSistema) return auth.currentBranchName ?? '—'
  const viendo = sucursalesStore.activas.find((s) => s.id === auth.viewingBranchId)
  return viendo?.nombre ?? 'Todas las sucursales'
})

function selectBranch(sucursalId: string | null): void {
  auth.setViewingBranch(sucursalId)
}

// ── Estado de caja ──────────────────────────────────────────────────────────
// Solo aplica al Cajero, que es a quien RN-CIE-001 bloquea de vender/cobrar
// (comandas, check-in/checkout, eventos) sin turno OPERANDO.
const showShift = computed(() => auth.hasRole('Cajero'))

const shift = computed(() => {
  if (turno.estaOperando) {
    const desde = turno.fechaApertura ? format(new Date(turno.fechaApertura), 'HH:mm') : null
    // "Vendido en turno" (B9 B.4): solo total y número de ventas, sin
    // desglose por método ni efectivo esperado (conteo a ciegas).
    const ventas = `${turno.numeroVentas} ${turno.numeroVentas === 1 ? 'venta' : 'ventas'} · $${turno.totalVendido.toLocaleString('es-MX')}`
    const meta = [desde ? `desde ${desde}` : null, ventas].filter(Boolean).join(' · ')
    return { tone: 'ok', label: 'Caja abierta', meta }
  }
  if (turno.sinTurno) {
    return { tone: 'bad', label: 'Sin apertura de caja', meta: 'Abrir caja' }
  }
  // EN_CONTEO / ESPERANDO_REVISION / BALANCE_REVELADO / CERRADO: hay un turno,
  // pero tampoco se puede vender mientras no vuelva a OPERANDO.
  return { tone: 'warn', label: 'En corte de caja', meta: '' }
})

// ── Usuario ─────────────────────────────────────────────────────────────────
const userName = computed(() => auth.currentUser?.name ?? auth.currentUser?.email ?? '')
const userRole = computed(() => auth.primaryRole ?? '')
const userInitials = computed(() => getInitials(userName.value))
const userColor = computed(() => getAvatarColor(userName.value))

async function handleLogout(): Promise<void> {
  await auth.logout()
  // Recarga completa (no router.push): descarta toda la memoria de la app, de
  // modo que nada del usuario saliente llegue al siguiente en esta terminal.
  window.location.assign(router.resolve({ name: 'login' }).href)
}
</script>

<template>
  <aside class="sb">
    <div class="sb-brand">
      <img src="/woow-kids-mascot.png" alt="Woow Kids" class="sb-brand__img" />
      <div class="sb-brand__text">
        <span class="sb-brand__name">Woow Kids</span>
        <span class="sb-brand__app">Mercurio</span>
      </div>
    </div>

    <div class="sb-top">
      <component
        :is="auth.isSistema ? 'button' : 'div'"
        type="button"
        class="sb-branch"
        :class="{ 'sb-branch--select': auth.isSistema }"
      >
        <q-icon name="storefront" size="18px" class="sb-branch__icon" />
        <div class="sb-branch__text">
          <span class="sb-branch__label">Sucursal</span>
          <span class="sb-branch__name">{{ branchLabel }}</span>
        </div>
        <template v-if="auth.isSistema">
          <q-icon name="unfold_more" size="18px" class="sb-branch__chevron" />
          <q-menu fit anchor="bottom left" self="top left" class="sb-branch-menu">
            <q-list dense>
              <q-item
                v-close-popup
                clickable
                :active="!auth.viewingBranchId"
                @click="selectBranch(null)"
              >
                <q-item-section>Todas las sucursales</q-item-section>
              </q-item>
              <q-item
                v-for="s in sucursalesStore.activas"
                :key="s.id"
                v-close-popup
                clickable
                :active="auth.viewingBranchId === s.id"
                @click="selectBranch(s.id)"
              >
                <q-item-section>{{ s.nombre }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </template>
      </component>
    </div>

    <div class="sb-top sb-top--search">
      <button type="button" class="sb-search" @click="openPalette">
        <q-icon name="search" size="17px" class="sb-search__icon" />
        <span class="sb-search__label">Buscar o ir a…</span>
        <kbd class="sb-search__kbd">Ctrl K</kbd>
      </button>
    </div>

    <nav class="sb-nav" aria-label="Menú principal">
      <div v-for="group in visibleGroups" :key="group.label ?? 'root'" class="sb-group">
        <button
          v-if="group.label"
          type="button"
          class="sb-group__head"
          :aria-expanded="isOpen(group)"
          @click="toggleGroup(group.label)"
        >
          <span class="sb-group__label">{{ group.label }}</span>
          <span v-if="!isOpen(group) && groupBadge(group) > 0" class="sb-group__badge">
            {{ groupBadge(group) }}
          </span>
          <q-icon :name="isOpen(group) ? 'expand_less' : 'expand_more'" size="16px" />
        </button>
        <template v-if="isOpen(group)">
          <router-link
            v-for="item in group.items"
            :key="item.routeName"
            :to="{ name: item.routeName }"
            class="sb-item"
            :class="{ 'sb-item--active': isActive(item.routeName) }"
          >
            <q-icon :name="item.icon" size="19px" class="sb-item__icon" />
            <span class="sb-item__label">{{ item.label }}</span>
            <span
              v-if="badgeFor(item.routeName)"
              class="sb-item__badge"
              :class="`sb-item__badge--${badgeFor(item.routeName)?.tone}`"
            >
              {{ badgeFor(item.routeName)?.count }}
            </span>
          </router-link>
        </template>
      </div>
    </nav>

    <div class="sb-foot">
      <router-link
        v-if="showShift"
        :to="{ name: 'pos-cierre' }"
        class="sb-shift"
        :class="`sb-shift--${shift.tone}`"
      >
        <span class="sb-shift__dot" />
        <span class="sb-shift__label">{{ shift.label }}</span>
        <span v-if="shift.meta" class="sb-shift__meta">{{ shift.meta }}</span>
      </router-link>

      <div class="sb-user">
        <div class="sb-user__avatar" :style="{ background: userColor }">{{ userInitials }}</div>
        <div class="sb-user__text">
          <span class="sb-user__name">{{ userName }}</span>
          <span class="sb-user__role">{{ userRole }}</span>
        </div>
        <q-btn
          flat
          round
          dense
          icon="password"
          size="13px"
          class="sb-user__logout"
          aria-label="Cambiar mi PIN"
          @click="showCambiarPin = true"
        >
          <q-tooltip>Cambiar mi PIN</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          dense
          icon="logout"
          size="13px"
          class="sb-user__logout"
          aria-label="Cerrar sesión"
          @click="handleLogout"
        >
          <q-tooltip>Cerrar sesión</q-tooltip>
        </q-btn>
      </div>
    </div>

    <CambiarPinDialog v-model="showCambiarPin" />
  </aside>
</template>

<style scoped lang="scss">
.sb {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

// ── Marca ───────────────────────────────────────────────────────────────────
.sb-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 14px;

  &__img {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    object-fit: cover;
  }

  &__text {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
    white-space: nowrap;
  }

  &__name {
    font-size: 15px;
    font-weight: 800;
    color: var(--text-strong);
    letter-spacing: -0.01em;
  }

  &__app {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
  }
}

// ── Sucursal ────────────────────────────────────────────────────────────────
.sb-top {
  padding: 0 12px;
}

.sb-branch {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: #fff;
  font: inherit;
  text-align: left;

  &--select {
    cursor: pointer;

    &:hover {
      background: var(--bg-subtle);
    }
  }

  &__icon {
    color: var(--q-primary);
  }

  &__text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__label {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  &__name {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__chevron {
    color: var(--text-muted);
  }
}

.sb-top--search {
  padding-top: 8px;
}

.sb-search {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-subtle);
  font: inherit;
  text-align: left;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--bg-muted);
  }

  &__icon {
    color: var(--text-muted);
  }

  &__label {
    flex: 1;
    font-size: 12.5px;
    font-weight: 500;
  }

  &__kbd {
    font-size: 10.5px;
    font-weight: 700;
    color: var(--text-secondary);
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1px 5px;
  }
}

// ── Navegación ──────────────────────────────────────────────────────────────
.sb-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.sb-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px 6px;
    border: 0;
    background: none;
    font: inherit;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 8px;

    &:hover {
      color: var(--text-primary);
    }
  }

  &__label {
    flex: 1;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  &__badge {
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: #fde8ee;
    color: #c40f47;
    font-size: 10.5px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.sb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 10px;
  border-radius: 9px;
  color: var(--text-body);
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.12s;

  &__icon {
    color: var(--text-secondary);
  }

  &__label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;

    &--warn {
      background: #fff4d6;
      color: var(--tone-warn-fg);
    }

    &--bad {
      background: var(--tone-bad-bg);
      color: var(--tone-bad-fg);
    }
  }

  &:hover {
    background: var(--bg-muted);
  }

  &--active,
  &--active:hover {
    background: var(--tone-info-bg);
    color: var(--q-primary);
    font-weight: 700;

    .sb-item__icon {
      color: var(--q-primary);
    }
  }
}

// ── Pie: caja y usuario ─────────────────────────────────────────────────────
.sb-foot {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--border-soft);
}

.sb-shift {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  text-decoration: none;
  white-space: nowrap;

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  &__label {
    font-size: 12.5px;
    font-weight: 800;
  }

  &__meta {
    margin-left: auto;
    font-size: 11.5px;
    font-weight: 600;
  }

  &--ok {
    background: #eef8ec;
    color: var(--tone-ok-fg);

    .sb-shift__dot {
      background: var(--tone-ok-dot);
    }
  }

  &--bad {
    background: #fdf1f1;
    color: var(--tone-bad-fg);

    .sb-shift__dot {
      background: var(--tone-bad-dot);
    }
  }

  &--warn {
    background: #fff7e6;
    color: var(--tone-warn-fg);

    .sb-shift__dot {
      background: var(--tone-warn-dot);
    }
  }
}

.sb-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 4px;

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 16px;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__role {
    font-size: 11.5px;
    color: var(--text-secondary);
  }

  &__logout {
    color: var(--text-secondary);

    &:hover {
      color: var(--tone-bad-fg);
    }
  }
}
</style>
