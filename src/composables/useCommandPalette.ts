import { ref } from 'vue'

// Estado módulo-singleton: tanto el botón del Sidebar como el atajo de
// teclado (Ctrl/Cmd+K) controlan el mismo diálogo, montado una sola vez en
// AppShell.
const open = ref(false)

export function useCommandPalette() {
  function openPalette(): void {
    open.value = true
  }
  function closePalette(): void {
    open.value = false
  }
  function togglePalette(): void {
    open.value = !open.value
  }

  return { open, openPalette, closePalette, togglePalette }
}
