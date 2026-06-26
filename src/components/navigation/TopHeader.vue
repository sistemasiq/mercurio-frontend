<template>
  <header class="top-header-wrapper" :style="{ zIndex: 1000, position: 'sticky', top: 0 }">
    <div :style="{ paddingLeft: sidebarWidth }" class="header-content">
      <!-- search: left side -->
      <div class="search-section">
        <div class="search-container">
          <q-icon name="search" class="search-icon" size="sm" />
          <input
            type="text"
            :value="props.modelValue"
            @input="onInput"
            placeholder="Buscar productos..."
            class="search-input"
          />
        </div>
      </div>

      <!-- spacer -->
      <div class="flex-spacer"></div>

      <!-- right: icons + profile -->
      <div class="profile-section">
        <button aria-label="Notificaciones" class="icon-button notification-button">
          <q-icon name="notifications" size="md" class="icon-notification" />
        </button>

        <div class="divider-line"></div>

        <div class="profile-info">
          <div class="profile-text hidden sm:flex">
            <p class="profile-name">Admin Staff</p>
            <p class="profile-role">Gerente</p>
          </div>

          <div ref="menuRef" class="avatar-wrapper">
            <button @click="toggleMenu" aria-label="Open profile menu" class="avatar-button">
              <img
                alt="Staff profile avatar"
                class="avatar-image"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7ySbF9j45XrFfHW63lhpQbVQ8UMmEvur0NF6_-ebSxuT2aBGnoEChgF3zXJJALAFYMwcbY6A2h3jtAdIVR_rv-DTnVNwaYy7i8_8KGh61mh-s2UxXOn8GzrIC2RaRTK5iurGVof2R8BsRM2FJ0Xph6espZuDi1Gohr2teNhuW7vk96RTlj0ixCwluLbyZobX5Mrdf5RWmcvpsuirYpAP9TVgSU4EW-xYMB4yidIoHMmdwSI8d16ARJhvSuC4dqKMMa7mxT2-RFqeB"
              />
            </button>

            <transition name="fade">
              <div v-if="showMenu" class="dropdown-menu">
                <button @click="onLogout" class="dropdown-item">
                  <q-icon name="logout" size="sm" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// Manejo bidireccional del texto de búsqueda (v-model) hacia el Layout padre
const props = defineProps<{ modelValue: string; sidebarCollapsed?: boolean }>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'logout'): void
}>();

import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const showMenu = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function onLogout() {
  showMenu.value = false
  emit('logout')
}

function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (!menuRef.value) return
  if (menuRef.value.contains(target)) return
  showMenu.value = false
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

const sidebarWidth = computed(() => (props.sidebarCollapsed ? '72px' : '256px'))
</script>

<style scoped>
/* Header wrapper */
.top-header-wrapper {
  width: 100%;
  height: 64px;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.header-content {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-right: 24px;
  gap: 20px;
  transition: padding-left 0.3s ease;
}

/* Search section */
.search-section {
  flex: 0 0 auto;
  min-width: 280px;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 12px;
  transition: all 0.2s ease;
  height: 40px;
}

.search-container:hover {
  background-color: #f0f1f3;
  border-color: #c4c7d0;
}

.search-container:focus-within {
  background-color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  color: #9ca3af;
  margin-right: 8px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #1f2937;
  font-family: 'Inter', -apple-system, sans-serif;
  min-width: 0;
}

.search-input::placeholder {
  color: #9ca3af;
}

/* Spacer */
.flex-spacer {
  flex: 1;
  min-width: 20px;
}

/* Profile section */
.profile-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background-color: transparent;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-button:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.icon-notification {
  color: inherit !important;
}

.divider-line {
  width: 1px;
  height: 24px;
  background-color: #d1d5db;
  margin: 0 8px;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-text {
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.profile-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1;
}

.profile-role {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
  line-height: 1;
}

/* Avatar */
.avatar-wrapper {
  position: relative;
}

.avatar-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.avatar-button:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* Dropdown menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 1200;
  overflow: hidden;
  animation: slideDown 0.2s ease;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 12px 16px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: 'Inter', -apple-system, sans-serif;
  text-align: left;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.dropdown-item:active {
  background-color: #e5e7eb;
}

.dropdown-item :deep(i) {
  flex-shrink: 0;
  color: #9ca3af;
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    padding-right: 16px;
    gap: 12px;
  }

  .search-section {
    min-width: 200px;
  }

  .profile-text {
    display: none !important;
  }

  .divider-line {
    display: none;
  }
}
</style>