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
import { turnoCajaService } from '@/services/turnoCajaService'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import type {
  EstadoTurno,
  TurnoActivoResponse,
  DesgloseEfectivo,
  FilaMetodoPago,
  FilaBalance,
  RevisionAdminResponse,
  RetiroParcialPayload,
} from '@/types/turnoCaja'

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
  const totalVentas = ref(0)
  const estado = ref<EstadoTurno>('SIN_TURNO')

  // ── Estado de carga y errores ─────────────────────────────────────────────
  const cargando = ref(false)
  const error = ref<string | null>(null)

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
      error.value = (err as Error).message
    } finally {
      cargando.value = false
    }
  }

  /** Carga el turno activo al montar la página. */
  async function cargarTurnoActivo(sucursalId?: string | null): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const turno = await turnoCajaService.cargarTurnoActivo(sucursalId)
      _aplicarTurno(turno)
    } catch {
      estado.value = 'SIN_TURNO'
      turnoId.value = null
      error.value = null
    } finally {
      cargando.value = false
    }
  }

  /** Reinicia el estado local para permitir abrir un nuevo turno tras cerrar el previo */
  function reiniciarCicloTurno(): void {
    turnoId.value = null
    cajeroNombre.value = ''
    terminal.value = ''
    sucursalNombre.value = ''
    fondoInicial.value = 0
    totalRetiros.value = 0
    estado.value = 'SIN_TURNO'
    error.value = null
    adminNombre.value = ''
    balancePorMetodo.value = []
    totalEsperado.value = 0
    totalDeclarado.value = 0
    diferenciaNeta.value = 0
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
      error.value = (err as Error).message
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
      const apiErr = err as ApiError
      // Si el backend dice que el conteo ya estaba enviado (ej. la página se recargó
      // mientras estaba en ESPERANDO_REVISION y por eso mostraba otra vez este
      // formulario), no es un error real para el cajero — el conteo sí se registró,
      // solo falta la revisión del administrador. Se resincroniza el turno real:
      // _aplicarTurno ya abre el modal automáticamente si el estado es ESPERANDO_REVISION.
      if (apiErr.code === 'TRANSICION_INVALIDA') {
        try {
          await cargarTurnoActivo()
          if (esperandoRevision.value) return
        } catch {
          // si la resincronización falla, se maneja como error normal abajo
        }
      }
      error.value = (err as Error).message
    } finally {
      cargando.value = false
    }
  }

  /**
   * Transición: ESPERANDO_REVISION → BALANCE_REVELADO
   * Valida credenciales del admin y aplica el balance comparativo.
   */
  async function autenticarAdmin(): Promise<boolean> {
    if (!turnoId.value || !esperandoRevision.value) return false
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
      mostrarDialogAdmin.value = false
      mostrarDialogAutorizacion.value = true
      estado.value = 'BALANCE_REVELADO'
      return true
    } catch (err) {
      credencialesAdmin.error =
        (err as Error).message || 'Usuario o contraseña de administrador incorrectos.'
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
      error.value = (err as Error).message
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
      await turnoCajaService.registrarRetiro({
        turnoId: turnoId.value,
        concepto,
        tipoDestinatario,
        monto,
        observaciones,
      })
      await cargarTurnoActivo()
      return true
    } catch (err) {
      error.value = (err as Error).message
      return false
    } finally {
      cargando.value = false
    }
  }

  /**
   * Transición: BALANCE_REVELADO → CERRADO
   * Confirma el cierre definitivo del turno.
   * @param observaciones - Requerido si hayDiferencias === true
   */
  async function confirmarCierre(
    observaciones: string,
    esExtraordinario = false,
  ): Promise<string | null> {
    if (!turnoId.value) return null
    cargando.value = true
    error.value = null
    try {
      const resp = await turnoCajaService.confirmarCierre({
        turnoId: turnoId.value,
        observaciones,
        tipoCierre: esExtraordinario ? 'EXTRAORDINARIO' : 'NORMAL',
      })
      estado.value = 'CERRADO'
      mostrarDialogAutorizacion.value = false
      mostrarDialogAdmin.value = false
      return resp.pdfUrl
    } catch (err) {
      error.value = resolveErrorMessage(err as ApiError)
      return null
    } finally {
      cargando.value = false
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helper de pruebas — SOLO DESARROLLO
  // ─────────────────────────────────────────────────────────────────────────

  /* v8 ignore next 20 */
  async function inyectarAperturaMock(fondo = 2000): Promise<void> {
    if (!import.meta.env.DEV) return
    error.value = null
    _aplicarTurno({
      id: `mock-turno-${Date.now()}`,
      sucursalId: 'suc-001',
      sucursalNombre: 'Sucursal Centro (TEST)',
      cajeroId: 'usr-001',
      cajeroNombre: 'Ana López (mock)',
      terminal: 'CAJA 01 - TEST',
      estado: 'OPERANDO',
      fondoInicial: fondo,
      fechaApertura: new Date().toISOString(),
      totalVentas: 0,
      totalRetiros: 0,
      movimientos: [],
    })
  }

  /**
   * Inyecta un turno mock en el store sin llamar al backend.
   * Disponible únicamente cuando `import.meta.env.DEV === true`.
   * En producción esta función no existe (tree-shaken por Vite).
   */
  /* v8 ignore next 20 */
  async function inyectarTurnoMock(): Promise<void> {
    if (!import.meta.env.DEV) return
    const { MOCK_TURNO_ACTIVO } = await import('@/mocks/turnoCajaMock')
    error.value = null
    _aplicarTurno(MOCK_TURNO_ACTIVO)
  }

  /**
   * Salta la autenticación real del admin e inyecta directamente la respuesta
   * de revisión mock, transitando el store a BALANCE_REVELADO.
   * Disponible únicamente cuando `import.meta.env.DEV === true`.
   */
  /* v8 ignore next 20 */
  async function inyectarRevisionMock(): Promise<void> {
    if (!import.meta.env.DEV) return
    const { MOCK_REVISION_ADMIN } = await import('@/mocks/turnoCajaMock')
    _aplicarRevision(MOCK_REVISION_ADMIN)
    mostrarDialogAdmin.value = false
    estado.value = 'BALANCE_REVELADO'
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
    totalVentas.value = turno.totalVentas ?? 0
    estado.value = turno.estado

    // Si el turno ya llega en ESPERANDO_REVISION (ej. el cajero recargó la página
    // después de enviar el conteo), abre directo el modal de autenticación del
    // administrador en vez de dejar solo el overlay de espera sin salida.
    if (turno.estado === 'ESPERANDO_REVISION' && !mostrarDialogAdmin.value) {
      mostrarDialogAdmin.value = true
    }

    // Precarga las filas de métodos de pago con los movimientos reales del turno.
    // Se conservan las filas agregadas manualmente por el cajero que no vinieron del sistema.
    // "Efectivo" nunca entra aquí: ya tiene su propio bloque (EfectivoDesgloseForm) —
    // incluirlo también en este listado duplicaba la fila en pantalla.
    const filasManuales = metodosPago.value.filter((f) => f.origen === 'manual')
    const filasSistema = turno.movimientos
      .filter((m) => m.metodo.trim().toLowerCase() !== 'efectivo')
      .map((m, idx) => ({
        id: idx + 1,
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
    totalVentas,
    estado,
    cargando,
    error,
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
    reiniciarCicloTurno,
    iniciarConteo,
    enviarConteo,
    autenticarAdmin,
    cancelarConteo,
    registrarRetiro,
    confirmarCierre,
    // helper de pruebas (DEV only — tree-shaken en producción)
    ...(import.meta.env.DEV
      ? { inyectarAperturaMock, inyectarTurnoMock, inyectarRevisionMock }
      : {}),
  }
})
