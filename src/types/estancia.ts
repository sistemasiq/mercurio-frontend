/* src/types/estancia.ts
 Mensajes WebSocket del canal de estancias (app/api/routers/estancias.py).
 Son eventos "señal": el front no reconstruye estado local a partir de
 estos payloads, simplemente dispara un refetch de Control de Acceso
 (fetchActivos + fetchPulseras) para no duplicar la lógica de armado del
 DTO ActivoDto (que involucra varios JOINs) en dos lugares distintos.
*/
export type EstanciaWsMessage =
  | { type: 'estancia_creada'; sucursalId: string; registroId: string }
  | { type: 'estancia_checkout'; sucursalId: string; detalleId: string; registroId: string }
