import { defineStore } from 'pinia'
import { obtenerComandas } from '@/services/comandaService'
import { fetchActivos } from '@/api/onboardingClient'

interface ShellIndicadoresState {
  comandasPendientes: number
  ninosActivos: number
}

// Comandas aún no entregadas ni canceladas (mismo criterio que la tarjeta
// "Comandas abiertas" de Inicio): P = pendiente, E = en preparación, L = lista.
const ESTADOS_COMANDA_ABIERTA = new Set(['P', 'E', 'L'])

/**
 * Contadores compartidos y livianos del Sidebar (Cocina y Control de Acceso).
 * AppShell los refresca por polling cada 30 s mientras el usuario tenga el
 * permiso del módulo correspondiente; no requiere que la pantalla de Cocina o
 * Control de Acceso esté montada.
 */
export const useShellIndicadoresStore = defineStore('shellIndicadores', {
  state: (): ShellIndicadoresState => ({
    comandasPendientes: 0,
    ninosActivos: 0,
  }),
  actions: {
    async refrescarComandas(signal?: AbortSignal) {
      try {
        const comandas = await obtenerComandas(signal)
        this.comandasPendientes = comandas.filter((c) =>
          ESTADOS_COMANDA_ABIERTA.has(c.estado_actual),
        ).length
      } catch {
        // silencioso: es polling de fondo
      }
    },
    async refrescarNinosActivos(sucursalId: string) {
      try {
        const activos = await fetchActivos(sucursalId)
        this.ninosActivos = activos.length
      } catch {
        // silencioso: es polling de fondo
      }
    },
    limpiar() {
      this.comandasPendientes = 0
      this.ninosActivos = 0
    },
  },
})
