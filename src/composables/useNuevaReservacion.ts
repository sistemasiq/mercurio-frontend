import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useTurnoCajaStore } from '@/stores/turnoCaja'

/**
 * Navegación al asistente de nueva reservación.
 *
 * Confirmar una reservación exige registrar el anticipo, y ese cobro se registra
 * contra la apertura de caja de quien lo captura (el endpoint de pagos de
 * reservación depende de `apertura_operando_id`). Sin turno abierto el asistente
 * no puede terminar, así que el botón resuelve antes a dónde mandar al usuario.
 *
 * Vive en un composable porque la pantalla de Reservaciones y el Dashboard tienen
 * el mismo botón: cuando la lógica estaba duplicada, el mismo error existía en
 * los dos lados.
 */
export function useNuevaReservacion() {
  const router = useRouter()
  const $q = useQuasar()

  return function irANuevaReservacion(): void {
    const turno = useTurnoCajaStore()
    const auth = useAuthStore()

    if (turno.estaOperando) {
      void router.push({ name: 'eventos-reservaciones-crear' })
      return
    }

    // El Administrador de sucursal no opera caja por diseño, y el guard del router
    // lo rebota de /pos/cierre al historial de arqueos. Mandarlo ahí lo dejaba en
    // una pantalla que no pidió y sin ninguna explicación, así que aquí se le dice
    // qué falta en vez de navegarlo a ningún lado.
    const esAdminDeSucursal = auth.hasRole('Administrador') && !auth.hasRole('AdministradorSistema')
    if (esAdminDeSucursal) {
      $q.notify({
        type: 'warning',
        message: 'Se necesita una caja abierta para registrar el anticipo.',
        caption: 'Tu rol no opera caja: pide a un cajero que abra su turno.',
        position: 'top-right',
        timeout: 6000,
      })
      return
    }

    $q.notify({
      type: 'warning',
      message: 'Abre tu caja para poder registrar el anticipo de la reservación.',
      position: 'top-right',
      timeout: 5000,
    })
    void router.push({ name: 'pos-cierre' })
  }
}
