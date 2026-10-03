/**
 * stores/turnoCaja.ts
 *
 * Store Pinia que implementa la máquina de estados del Cierre de Caja.
 * Los estados son idénticos al modelo del backend:
 *
 *   OPERANDO → EN_CONTEO → ESPERANDO_REVISION → BALANCE_REVELADO → CERRADO
 *                  ↑____cancelarConteo()___|
 *
 * Este store es la única fuente de verdad para el estado del turno,
 * el resultado del balance y la autorización del administrador.
 */

import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { Notify } from 'quasar'
import { turnoCajaService, TurnoNoEncontradoError } from '@/services/turnoCajaService'
import { mensajeDeError, resolveErrorMessage } from '@/utils/errorHandler'
import { useAuthStore } from '@/stores/auth'
import type { ApiError } from '@/types/auth'
import type {
  EstadoTurno,
  TurnoActivoResponse,
  DesgloseEfectivo,
  FilaMetodoPago,
  FilaBalance,
  RevisionAdminResponse,
  RetiroParcialPayload,
  RetiroParcialResponse,
  IngresoEfectivoPayload,
  ResultadoCierre,
  ResultadoCargaTurno,
} from '@/types/turnoCaja'

// v-model.number sobre <q-input type="text"> no convierte "" a 0 ni a null: Vue
// solo castea cuando parseFloat produce un número válido, así que al borrar un
// campo (billete/moneda/monto/total) el ref se queda con el string "" — y "" ?? 0
// no lo atrapa porque ?? solo reemplaza null/undefined, no cualquier valor "falsy".
// Eso llegaba tal cual al payload y Pydantic lo rechazaba con 422 "unable to parse
// string as an integer" (reproducido: dos campos vacíos → el mismo error dos veces).
function aNumero(valor: number | string | null | undefined): number {
  if (valor === null || valor === undefined || valor === '') return 0
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

// El email del admin que autenticó la revisión se necesita para validar su PIN en el
// cierre. Solo vive en memoria, así que se respalda en sessionStorage por turno para
// sobrevivir a una recarga (tab-scoped). Puede fallar (modo privado, storage bloqueado).
const CLAVE_ADMIN_EMAIL = 'mercury:turnoCaja:adminEmail'

function guardarAdminEmail(turnoId: string, email: string): void {
  try {
    sessionStorage.setItem(CLAVE_ADMIN_EMAIL, JSON.stringify({ turnoId, email }))
  } catch {
    // sin persistencia: tras recargar habrá que re-autenticar al admin
  }
}

function leerAdminEmail(turnoId: string): string {
  try {
    const raw = sessionStorage.getItem(CLAVE_ADMIN_EMAIL)
    if (!raw) return ''
    const guardado = JSON.parse(raw) as { turnoId?: string; email?: string }
    return guardado.turnoId === turnoId ? (guardado.email ?? '') : ''
  } catch {
    return ''
  }
}

function borrarAdminEmail(): void {
  try {
    sessionStorage.removeItem(CLAVE_ADMIN_EMAIL)
  } catch {
    // nada que limpiar
  }
}

// Notificación flotante (se autodesvanece), igual que el resto de avisos de la
// app (ej. "¡Bienvenido!" al iniciar sesión) -- reemplaza los q-banner fijos que
// antes quedaban pegados en la página incluso al cambiar de vista (apertura,
// retiro, ingreso, cierre comparten este store y su `error`).
function notificarError(mensaje: string): void {
  Notify.create({
    type: 'negative',
    message: mensaje,
    position: 'top',
    timeout: 4000,
    icon: 'error',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useTurnoCajaStore = defineStore('turnoCaja', () => {
  // ── Turno cargado desde el backend ────────────────────────────────────────
  const turnoId = ref<string | null>(null)
  const cajeroNombre = ref('')
  const terminal = ref('')
  const sucursalNombre = ref('')
  const fondoInicial = ref(0)
  const totalRetiros = ref(0)
  const totalIngresos = ref(0)
  const totalVentas = ref(0)
  const totalVentasEfectivo = ref(0)
  /** "Vendido en turno": numero de tickets y total vendido, visibles mientras
   * el turno está abierto (sin desglose por método ni efectivo esperado). */
  const numeroVentas = ref(0)
  const totalVendido = ref(0)
  const fechaApertura = ref<string | null>(null)
  const estado = ref<EstadoTurno>('SIN_TURNO')

  // ── Estado de carga y errores ─────────────────────────────────────────────
  const cargando = ref(false)
  const error = ref<string | null>(null)
  // Sucursal para la que ya se cargó el turno con éxito (memo de
  // `asegurarTurnoCargado`). Vive en el estado para que `resetAllStores` (logout)
  // lo invalide junto con el resto del store.
  const cargadoParaSucursal = ref<string | null>(null)
  let cargaEnVuelo: { clave: string; promesa: Promise<ResultadoCargaTurno> } | null = null
  const ultimoRetiro = ref<RetiroParcialResponse | null>(null)

  // ── Modal de autenticación de administrador ───────────────────────────────
  const mostrarDialogAdmin = ref(false)
  const mostrarDialogAutorizacion = ref(false)

  // ── Resultado de la revisión del admin ────────────────────────────────────
  const adminNombre = ref('')
  const adminEmail = ref('')
  const balancePorMetodo = ref<FilaBalance[]>([])
  const totalEsperado = ref(0)
  const totalDeclarado = ref(0)
  const diferenciaNeta = ref(0)
  // true si el balance de la revisión está en memoria (se pierde al recargar la página)
  const revisionAplicada = ref(false)

  // ── Formulario del cajero (la página lo llena, el store lo lee al enviar) ─
  const desgloseEfectivo = ref<DesgloseEfectivo>({
    billetes: [
      { value: 1000, amount: null },
      { value: 500, amount: null },
      { value: 200, amount: null },
      { value: 100, amount: null },
      { value: 50, amount: null },
      { value: 20, amount: null },
    ],
    monedas: [
      { value: 20, label: '$20', amount: null },
      { value: 10, label: '$10', amount: null },
      { value: 5, label: '$5', amount: null },
      { value: 2, label: '$2', amount: null },
      { value: 1, label: '$1', amount: null },
      { value: 0.5, label: '50¢', amount: null },
    ],
    total: 0,
  })
  const metodosPago = ref<FilaMetodoPago[]>([])
  const totalContadoDeclarado = ref<number | null>(null)

  // ── Credenciales efímeras del admin (se limpian tras el intento) ──────────
  const credencialesAdmin = reactive({ email: '', password: '', error: '', cargando: false })

  // ─────────────────────────────────────────────────────────────────────────
  // Computed — flags semánticos para los v-if del template
  // ─────────────────────────────────────────────────────────────────────────

  const sinTurno = computed(
    () => estado.value === 'SIN_TURNO' || (!turnoId.value && !cargando.value),
  )
  const estaOperando = computed(() => estado.value === 'OPERANDO')
  const enConteo = computed(() => estado.value === 'EN_CONTEO')
  const esperandoRevision = computed(() => estado.value === 'ESPERANDO_REVISION')
  const balanceRevelado = computed(() => estado.value === 'BALANCE_REVELADO')
  const estaCerrado = computed(() => estado.value === 'CERRADO')

  /** true si el cajero puede editar el formulario */
  const formularioEditable = computed(() => enConteo.value)

  /** true si hay diferencias (para forzar observaciones) */
  const hayDiferencias = computed(() => diferenciaNeta.value !== 0)

  /** Efectivo físico esperado en caja: fondo + ingresos - retiros + ventas cobradas en efectivo. */
  const efectivoDisponible = computed(
    () => fondoInicial.value + totalIngresos.value - totalRetiros.value + totalVentasEfectivo.value,
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Acciones
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Transición: SIN_TURNO → OPERANDO
   * Abre un nuevo turno de caja con el fondo inicial especificado.
   */
  async function abrirTurno(
    fondoInicialMonto: number,
    terminalNombre = 'CAJA 01',
    observaciones = '',
    turnoId?: string,
    sucursalId?: string,
  ): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const turno = await turnoCajaService.abrirTurno({
        fondoInicial: fondoInicialMonto,
        terminal: terminalNombre,
        observacionesApertura: observaciones,
        turnoId,
        sucursalId,
      })
      _aplicarTurno(turno)
    } catch (err) {
      error.value = mensajeDeError(err, 'No se pudo abrir el turno.')
      notificarError(error.value)
    } finally {
      cargando.value = false
    }
  }

  /**
   * Carga el turno activo al montar la página.
   *
   * Contrato: nunca lanza; devuelve `ResultadoCargaTurno`.
   * - Turno encontrado: `{ ok: true, hayTurno: true }`.
   * - 404 (TurnoNoEncontradoError): pasa a SIN_TURNO y devuelve `{ ok: true, hayTurno: false }`.
   * - Cualquier otro error (red, 5xx, 403): conserva el estado previo, asigna `error`
   *   y devuelve `{ ok: false, error }`.
   */
  async function cargarTurnoActivo(sucursalId?: string | null): Promise<ResultadoCargaTurno> {
    cargando.value = true
    error.value = null
    try {
      const turno = await turnoCajaService.cargarTurnoActivo(sucursalId)
      _aplicarTurno(turno)
      return { ok: true, hayTurno: true }
    } catch (err) {
      if (err instanceof TurnoNoEncontradoError) {
        estado.value = 'SIN_TURNO'
        turnoId.value = null
        fechaApertura.value = null
        return { ok: true, hayTurno: false }
      }
      const mensaje = mensajeDeError(err, 'No se pudo cargar el turno activo.')
      error.value = mensaje
      return { ok: false, error: mensaje }
    } finally {
      cargando.value = false
    }
  }

  /**
   * Garantiza que el turno ya se pidió al backend antes de validarlo. Memoizado:
   * llamadas concurrentes comparten una sola petición y, si ya se cargó para la
   * sucursal vigente, resuelve de inmediato. Una carga fallida no se memoiza (se
   * reintenta en la siguiente llamada). Nunca lanza.
   */
  function asegurarTurnoCargado(): Promise<ResultadoCargaTurno> {
    const auth = useAuthStore()
    // Solo AdministradorSistema necesita indicar la sucursal; el resto usa la suya.
    const sucursalId = auth.isSistema ? auth.currentBranchId : null
    const clave = sucursalId ?? 'propia'

    if (cargadoParaSucursal.value === clave) {
      return Promise.resolve({ ok: true, hayTurno: turnoId.value !== null })
    }
    if (cargaEnVuelo?.clave === clave) return cargaEnVuelo.promesa

    const promesa = cargarTurnoActivo(sucursalId)
      .then((resultado) => {
        if (resultado.ok) cargadoParaSucursal.value = clave
        return resultado
      })
      .finally(() => {
        if (cargaEnVuelo?.promesa === promesa) cargaEnVuelo = null
      })
    cargaEnVuelo = { clave, promesa }
    return promesa
  }

  /** Reinicia el estado local para permitir abrir un nuevo turno tras cerrar el previo */
  function reiniciarCicloTurno(): void {
    turnoId.value = null
    cajeroNombre.value = ''
    terminal.value = ''
    sucursalNombre.value = ''
    fondoInicial.value = 0
    totalRetiros.value = 0
    totalIngresos.value = 0
    totalVentasEfectivo.value = 0
    numeroVentas.value = 0
    totalVendido.value = 0
    fechaApertura.value = null
    estado.value = 'SIN_TURNO'
    error.value = null
    adminNombre.value = ''
    balancePorMetodo.value = []
    totalEsperado.value = 0
    totalDeclarado.value = 0
    diferenciaNeta.value = 0
    adminEmail.value = ''
    revisionAplicada.value = false
    borrarAdminEmail()
    metodosPago.value = []
    _resetFormulario()
  }

  /**
   * Transición: OPERANDO → EN_CONTEO
   * Notifica al backend que el cajero inicia el conteo.
   */
  async function iniciarConteo(): Promise<void> {
    if (!turnoId.value || !estaOperando.value) return
    cargando.value = true
    error.value = null
    try {
      const turno = await turnoCajaService.iniciarConteo(turnoId.value)
      _aplicarTurno(turno)
    } catch (err) {
      error.value = mensajeDeError(err, 'No se pudo iniciar el conteo.')
      notificarError(error.value)
    } finally {
      cargando.value = false
    }
  }

  /**
   * Transición: EN_CONTEO → ESPERANDO_REVISION
   * Envía el conteo al backend y abre el modal de autenticación del admin.
   */
  async function enviarConteo(): Promise<void> {
    if (!turnoId.value || !enConteo.value) return

    const totalDeclaradoMonto = aNumero(totalContadoDeclarado.value)
    if (totalDeclaradoMonto <= 0) {
      error.value = 'El total declarado debe ser mayor a $0.00 para poder generar el corte de caja.'
      notificarError(error.value)
      return
    }

    cargando.value = true
    error.value = null
    try {
      const turno = await turnoCajaService.enviarConteo({
        turnoId: turnoId.value,
        desgloseEfectivo: {
          billetes: desgloseEfectivo.value.billetes.map((b) => ({
            denominacion: b.value,
            cantidad: aNumero(b.amount),
          })),
          monedas: desgloseEfectivo.value.monedas.map((m) => ({
            denominacion: m.value,
            cantidad: aNumero(m.amount),
          })),
          total: desgloseEfectivo.value.total,
        },
        metodosPago: metodosPago.value.map((m) => ({
          metodo: m.metodo,
          monto: aNumero(m.monto),
        })),
        totalDeclarado: totalDeclaradoMonto,
      })
      _aplicarTurno(turno)
      credencialesAdmin.email = ''
      credencialesAdmin.password = ''
      credencialesAdmin.error = ''
      mostrarDialogAdmin.value = true
    } catch (err) {
      // El service envuelve el ApiError original en `cause`, así que el código/status
      // hay que leerlo de ahí (no del error recibido).
      const causa = (err as Error & { cause?: ApiError }).cause
      // Si el backend dice que el conteo ya estaba enviado (ej. la página se recargó
      // mientras estaba en ESPERANDO_REVISION y por eso mostraba otra vez este
      // formulario), no es un error real para el cajero — el conteo sí se registró,
      // solo falta la revisión del administrador. Se resincroniza el turno real:
      // _aplicarTurno ya abre el modal automáticamente si el estado es ESPERANDO_REVISION.
      if (causa?.code === 'TRANSICION_INVALIDA' || causa?.statusCode === 409) {
        await cargarTurnoActivo()
        if (esperandoRevision.value) return
      }
      error.value = mensajeDeError(err, 'No se pudo enviar el conteo.')
      notificarError(error.value)
    } finally {
      cargando.value = false
    }
  }

  /**
   * Transición: ESPERANDO_REVISION → BALANCE_REVELADO
   * Valida credenciales del admin y aplica el balance comparativo.
   */
  async function autenticarAdmin(): Promise<boolean> {
    // BALANCE_REVELADO también se acepta: tras recargar se pierde el balance en memoria
    // y el admin debe volver a autenticarse para recuperarlo.
    if (!turnoId.value || !(esperandoRevision.value || balanceRevelado.value)) return false
    if (!credencialesAdmin.email || !credencialesAdmin.password) return false

    credencialesAdmin.cargando = true
    credencialesAdmin.error = ''
    try {
      const resultado: RevisionAdminResponse = await turnoCajaService.autenticarAdmin({
        turnoId: turnoId.value,
        adminEmail: credencialesAdmin.email,
        adminPassword: credencialesAdmin.password,
      })
      _aplicarRevision(resultado)
      adminEmail.value = credencialesAdmin.email
      guardarAdminEmail(turnoId.value, credencialesAdmin.email)
      mostrarDialogAdmin.value = false
      mostrarDialogAutorizacion.value = true
      estado.value = 'BALANCE_REVELADO'
      return true
    } catch (err) {
      credencialesAdmin.error = mensajeDeError(
        err,
        'Usuario o contraseña de administrador incorrectos.',
      )
      return false
    } finally {
      credencialesAdmin.cargando = false
      credencialesAdmin.email = ''
      credencialesAdmin.password = ''
    }
  }

  /**
   * Transición: EN_CONTEO | ESPERANDO_REVISION → OPERANDO
   * Cancela el conteo en curso.
   */
  async function cancelarConteo(): Promise<void> {
    if (!turnoId.value) return
    cargando.value = true
    error.value = null
    try {
      const turno = await turnoCajaService.cancelarConteo(turnoId.value)
      _aplicarTurno(turno)
      mostrarDialogAdmin.value = false
      mostrarDialogAutorizacion.value = false
      _resetFormulario()
    } catch (err) {
      error.value = mensajeDeError(err, 'No se pudo cancelar el conteo.')
      notificarError(error.value)
    } finally {
      cargando.value = false
    }
  }

  /**
   * Registra un retiro parcial sobre el turno activo (solo en OPERANDO).
   * No cambia el estado del turno; refresca fondo/retiros al terminar.
   */
  async function registrarRetiro(
    concepto: RetiroParcialPayload['concepto'],
    tipoDestinatario: RetiroParcialPayload['tipoDestinatario'],
    monto: number,
    observaciones?: string,
  ): Promise<boolean> {
    if (!turnoId.value) return false
    cargando.value = true
    error.value = null
    try {
      ultimoRetiro.value = await turnoCajaService.registrarRetiro({
        turnoId: turnoId.value,
        concepto,
        tipoDestinatario,
        monto,
        observaciones,
      })
      await cargarTurnoActivo()
      return true
    } catch (err) {
      error.value = mensajeDeError(err, 'No se pudo registrar el retiro.')
      notificarError(error.value)
      return false
    } finally {
      cargando.value = false
    }
  }

  async function registrarIngreso(monto: number): Promise<boolean> {
    if (!turnoId.value) return false
    cargando.value = true
    error.value = null
    try {
      const payload: IngresoEfectivoPayload = { turnoId: turnoId.value, monto }
      await turnoCajaService.registrarIngreso(payload)
      await cargarTurnoActivo()
      return true
    } catch (err) {
      error.value = mensajeDeError(err, 'No se pudo registrar el ingreso de efectivo.')
      notificarError(error.value)
      return false
    } finally {
      cargando.value = false
    }
  }

  /**
   * Transición: BALANCE_REVELADO → CERRADO
   * Confirma el cierre definitivo del turno.
   * @param observaciones - Requerido si hayDiferencias === true
   *
   * Nunca lanza: devuelve `{ ok: true, pdfUrl, arqueoId }` o `{ ok: false, error }`.
   * `arqueoId` (cierre_caja.id) es distinto de turnoId y es el que espera
   * GET /turnos-caja/historial/{cierre_id}/pdf. Si falla, el turno NO cambia de
   * estado; el consumidor no debe reiniciar el ciclo ni redirigir.
   */
  async function confirmarCierre(
    observaciones: string,
    esExtraordinario = false,
    tokensPin: { cajero: string | null; admin: string | null } = { cajero: null, admin: null },
  ): Promise<ResultadoCierre> {
    if (!turnoId.value) return { ok: false, error: 'No hay un turno activo para cerrar.' }
    cargando.value = true
    error.value = null
    try {
      const resp = await turnoCajaService.confirmarCierre({
        turnoId: turnoId.value,
        observaciones,
        tipoCierre: esExtraordinario ? 'EXTRAORDINARIO' : 'NORMAL',
        tokenPinCajero: tokensPin.cajero,
        tokenPinAdmin: tokensPin.admin,
      })
      estado.value = 'CERRADO'
      mostrarDialogAutorizacion.value = false
      mostrarDialogAdmin.value = false
      return { ok: true, pdfUrl: resp.pdfUrl, arqueoId: resp.arqueoId }
    } catch (err) {
      const mensaje = resolveErrorMessage(err as ApiError)
      error.value = mensaje
      notificarError(mensaje)
      return { ok: false, error: mensaje }
    } finally {
      cargando.value = false
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers privados
  // ─────────────────────────────────────────────────────────────────────────

  function _aplicarTurno(turno: TurnoActivoResponse): void {
    turnoId.value = turno.id
    cajeroNombre.value = turno.cajeroNombre
    terminal.value = turno.terminal
    sucursalNombre.value = turno.sucursalNombre
    fondoInicial.value = turno.fondoInicial
    totalRetiros.value = turno.totalRetiros
    totalIngresos.value = turno.totalIngresos
    totalVentas.value = turno.totalVentas ?? 0
    numeroVentas.value = turno.numeroVentas ?? 0
    totalVendido.value = turno.totalVendido ?? 0
    const movEfectivo = turno.movimientos.find((m) => m.metodo.trim().toLowerCase() === 'efectivo')
    totalVentasEfectivo.value = movEfectivo?.totalVentas ?? 0
    fechaApertura.value = turno.fechaApertura ?? null
    estado.value = turno.estado

    // Si el turno ya llega en ESPERANDO_REVISION (ej. el cajero recargó la página
    // después de enviar el conteo), abre directo el modal de autenticación del
    // administrador en vez de dejar solo el overlay de espera sin salida.
    if (turno.estado === 'ESPERANDO_REVISION' && !mostrarDialogAdmin.value) {
      mostrarDialogAdmin.value = true
    }

    // Si el turno llega en BALANCE_REVELADO (ej. recarga tras autenticar al admin), el
    // backend ya incluye adminEmail y balancePorMetodo en esta misma respuesta (QA #8),
    // así que no hace falta re-autenticar al admin para recuperarlos. El sessionStorage
    // y la re-autenticación quedan solo como respaldo para backends viejos que todavía
    // no manden esos campos.
    if (turno.estado === 'BALANCE_REVELADO') {
      if (turno.adminEmail) {
        adminEmail.value = turno.adminEmail
      } else if (!adminEmail.value) {
        adminEmail.value = leerAdminEmail(turno.id)
      }
      if (turno.balancePorMetodo && turno.balancePorMetodo.length > 0) {
        balancePorMetodo.value = turno.balancePorMetodo
        revisionAplicada.value = true
        mostrarDialogAutorizacion.value = true
      } else if (revisionAplicada.value) {
        mostrarDialogAutorizacion.value = true
      } else if (!mostrarDialogAutorizacion.value) {
        mostrarDialogAdmin.value = true
      }
    }

    // Precarga las filas de métodos de pago con los movimientos reales del turno.
    // Se conservan las filas agregadas manualmente por el cajero que no vinieron del sistema.
    // "Efectivo" nunca entra aquí: ya tiene su propio bloque (EfectivoDesgloseForm) —
    // incluirlo también en este listado duplicaba la fila en pantalla.
    const filasManuales = metodosPago.value.filter((f) => f.origen === 'manual')
    const filasSistema = turno.movimientos
      .filter((m) => m.metodo.trim().toLowerCase() !== 'efectivo')
      .map((m) => ({
        id: crypto.randomUUID(),
        metodo: m.metodo,
        monto: null,
        origen: 'sistema' as const,
      }))
    metodosPago.value = [...filasSistema, ...filasManuales]
  }

  function _aplicarRevision(revision: RevisionAdminResponse): void {
    adminNombre.value = revision.adminNombre
    balancePorMetodo.value = revision.balancePorMetodo
    totalEsperado.value = revision.totalEsperado
    totalDeclarado.value = revision.totalDeclarado
    diferenciaNeta.value = revision.diferenciaNeta
    revisionAplicada.value = true
  }

  function _resetFormulario(): void {
    desgloseEfectivo.value.billetes.forEach((b) => (b.amount = null))
    desgloseEfectivo.value.monedas.forEach((m) => (m.amount = null))
    desgloseEfectivo.value.total = 0
    metodosPago.value = metodosPago.value.filter((f) => f.origen === 'sistema')
    metodosPago.value.forEach((f) => (f.monto = null))
    totalContadoDeclarado.value = null
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Retorno público
  // ─────────────────────────────────────────────────────────────────────────

  return {
    // estado del turno
    turnoId,
    cajeroNombre,
    terminal,
    sucursalNombre,
    fondoInicial,
    totalRetiros,
    totalIngresos,
    totalVentas,
    totalVentasEfectivo,
    numeroVentas,
    totalVendido,
    efectivoDisponible,
    fechaApertura,
    estado,
    cargando,
    error,
    cargadoParaSucursal,
    ultimoRetiro,
    // flags semánticos
    sinTurno,
    estaOperando,
    enConteo,
    esperandoRevision,
    balanceRevelado,
    estaCerrado,
    formularioEditable,
    hayDiferencias,
    // formulario del cajero
    desgloseEfectivo,
    metodosPago,
    totalContadoDeclarado,
    // resultado del admin
    mostrarDialogAdmin,
    mostrarDialogAutorizacion,
    credencialesAdmin,
    adminNombre,
    adminEmail,
    balancePorMetodo,
    totalEsperado,
    totalDeclarado,
    diferenciaNeta,
    // acciones
    abrirTurno,
    cargarTurnoActivo,
    asegurarTurnoCargado,
    reiniciarCicloTurno,
    iniciarConteo,
    enviarConteo,
    autenticarAdmin,
    cancelarConteo,
    registrarRetiro,
    registrarIngreso,
    confirmarCierre,
  }
})
