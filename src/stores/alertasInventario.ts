import { defineStore } from 'pinia'
import { listarAlertas } from '@/services/insumoService'
import type { Insumo } from '@/types/insumo'
import { playAlertChime } from '@/utils/notificationSound'

interface AlertasInventarioState {
  criticos: Insumo[]
  porReordenar: Insumo[]
  cargado: boolean
  // Sucursal de la última llamada a `refrescar`. Permite descartar una
  // respuesta que llega después de que el usuario ya cambió de sucursal
  // otra vez (Bug QA #44).
  sucursalVigente: string | null
}

/**
 * Estado compartido de alertas de inventario (insumos bajo mínimo / bajo punto
 * de reorden) de la sucursal activa. AppShell lo refresca en intervalo; el
 * Reporte de Stock y el badge del menú lo leen.
 */
export const useAlertasInventarioStore = defineStore('alertasInventario', {
  state: (): AlertasInventarioState => ({
    criticos: [],
    porReordenar: [],
    cargado: false,
    sucursalVigente: null,
  }),
  getters: {
    totalAlertas: (s): number => s.criticos.length + s.porReordenar.length,
    idsConAlerta: (s): Set<string> => new Set([...s.criticos, ...s.porReordenar].map((i) => i.id)),
  },
  actions: {
    async refrescar(sucursalId: string, avisar = true) {
      this.sucursalVigente = sucursalId
      try {
        const idsPrevios = this.idsConAlerta
        const data = await listarAlertas(sucursalId)
        // La sucursal activa pudo cambiar mientras esta petición estaba en
        // vuelo (p. ej. dos cambios de sucursal en menos de 1 s): una
        // respuesta que ya no corresponde a la sucursal vigente se descarta
        // para no mostrar el badge ni tocar el timbre con datos ajenos (#44).
        if (this.sucursalVigente !== sucursalId) return
        this.criticos = data.criticos
        this.porReordenar = data.por_reordenar
        // Timbre solo para insumos que ACABAN de entrar en alerta, y nunca en la
        // primera carga (para no repetir avisos de algo ya conocido).
        if (avisar && this.cargado) {
          const nuevos = [...data.criticos, ...data.por_reordenar].filter(
            (i) => !idsPrevios.has(i.id),
          )
          if (nuevos.length > 0) playAlertChime()
        }
        this.cargado = true
      } catch {
        // silencioso: es polling de fondo
      }
    },
    limpiar() {
      this.criticos = []
      this.porReordenar = []
      this.cargado = false
      this.sucursalVigente = null
    },
  },
})
