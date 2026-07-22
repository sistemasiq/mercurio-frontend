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
  const estado = ref<EstadoTurno>('OPERANDO')

  // ── Estado de carga y errores ─────────────────────────────────────────────
  const cargando = ref(false)
  const error = ref<string | null>(null)

  // ── Modal de autenticación de administrador ───────────────────────────────
  const mostrarDialogAdmin = ref(false)

  // ── Resultado de la revisión del admin ────────────────────────────────────
  const adminNombre = ref('')
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
  const metodosPago = ref<FilaMetodoPago[]>([{ id: 1, metodo: 'vouchers', monto: null }])
  const totalContadoDeclarado = ref<number | null>(null)

  // ── Credenciales efímeras del admin (se limpian tras el intento) ──────────
  const credencialesAdmin = reactive({ email: '', password: '', error: '', cargando: false })

  // ─────────────────────────────────────────────────────────────────────────
  // Computed — flags semánticos para los v-if del template
  // ─────────────────────────────────────────────────────────────────────────

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

  /** Carga el turno activo al montar la página. */
  async function cargarTurnoActivo(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const turno = await turnoCajaService.cargarTurnoActivo()
      _aplicarTurno(turno)
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      cargando.value = false
    }
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
    cargando.value = true
    error.value = null
    try {
      const turno = await turnoCajaService.enviarConteo({
        turnoId: turnoId.value,
        desgloseEfectivo: {
          billetes: desgloseEfectivo.value.billetes.map((b) => ({
            denominacion: b.value,
            cantidad: b.amount ?? 0,
          })),
          monedas: desgloseEfectivo.value.monedas.map((m) => ({
            denominacion: m.value,
            cantidad: m.amount ?? 0,
          })),
          total: desgloseEfectivo.value.total,
        },
        metodosPago: metodosPago.value.map((m) => ({
          metodo: m.metodo,
          monto: m.monto ?? 0,
        })),
        totalDeclarado: totalContadoDeclarado.value ?? 0,
      })
      _aplicarTurno(turno)
      mostrarDialogAdmin.value = true
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      cargando.value = false
    }
  }

  /**
   * Transición: ESPERANDO_REVISION → BALANCE_REVELADO
   * Valida credenciales del admin y aplica el balance comparativo.
   */
  async function autenticarAdmin(): Promise<void> {
    if (!turnoId.value || !esperandoRevision.value) return
    if (!credencialesAdmin.email || !credencialesAdmin.password) return

    credencialesAdmin.cargando = true
    credencialesAdmin.error = ''
    try {
      const resultado: RevisionAdminResponse = await turnoCajaService.autenticarAdmin({
        turnoId: turnoId.value,
        adminEmail: credencialesAdmin.email,
        adminPassword: credencialesAdmin.password,
      })
      _aplicarRevision(resultado)
      mostrarDialogAdmin.value = false
      estado.value = 'BALANCE_REVELADO'
    } catch (err) {
      credencialesAdmin.error = (err as Error).message
    } finally {
      credencialesAdmin.cargando = false
      credencialesAdmin.password = ''
    }
  }

  /** Cancela el modal sin autenticar — vuelve a EN_CONTEO en UI. */
  function cancelarDialogAdmin(): void {
    mostrarDialogAdmin.value = false
    // No revertimos el estado del backend; el cajero puede reintentar
    // o cancelar el conteo explícitamente con cancelarConteo().
    credencialesAdmin.error = ''
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
      _resetFormulario()
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      cargando.value = false
    }
  }

  /**
   * Transición: BALANCE_REVELADO → CERRADO
   * Confirma el cierre definitivo del turno.
   * @param observaciones - Requerido si hayDiferencias === true
   */
  async function confirmarCierre(observaciones: string): Promise<string | null> {
    if (!turnoId.value || !balanceRevelado.value) return null
    cargando.value = true
    error.value = null
    try {
      const resp = await turnoCajaService.confirmarCierre({
        turnoId: turnoId.value,
        observaciones,
      })
      estado.value = 'CERRADO'
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
    estado.value = turno.estado

    // Precarga las filas de métodos de pago con los movimientos reales del turno
    if (turno.movimientos.length > 0) {
      metodosPago.value = turno.movimientos.map((m, idx) => ({
        id: idx + 1,
        metodo: m.metodo,
        monto: null,
      }))
    }
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
    metodosPago.value = [{ id: 1, metodo: 'vouchers', monto: null }]
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
    estado,
    cargando,
    error,
    // flags semánticos
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
    credencialesAdmin,
    adminNombre,
    balancePorMetodo,
    totalEsperado,
    totalDeclarado,
    diferenciaNeta,
    // acciones
    cargarTurnoActivo,
    iniciarConteo,
    enviarConteo,
    autenticarAdmin,
    cancelarDialogAdmin,
    cancelarConteo,
    confirmarCierre,
    // helper de pruebas (DEV only — tree-shaken en producción)
    ...(import.meta.env.DEV ? { inyectarTurnoMock, inyectarRevisionMock } : {}),
  }
})
