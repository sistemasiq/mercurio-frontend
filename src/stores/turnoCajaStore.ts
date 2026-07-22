/**
 * turnoCajaStore
 *
 * Máquina de estados del proceso de cierre de caja.
 *
 * Transiciones válidas:
 *   EN_CONTEO → ESPERANDO_REVISION   (cajero envía su conteo)
 *   ESPERANDO_REVISION → BALANCE_REVELADO  (administrador se autentica)
 *   BALANCE_REVELADO → EN_CONTEO     (reset / nuevo turno)
 */

import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export type EstadoCierre = 'EN_CONTEO' | 'ESPERANDO_REVISION' | 'BALANCE_REVELADO'

export interface AdminAuth {
  autorizado: boolean
  cargando: boolean
  error: string
  usuario: string
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useTurnoCajaStore = defineStore('turnoCaja', () => {
  // ── Estado de la máquina ──────────────────
  const estado = ref<EstadoCierre>('EN_CONTEO')

  // ── Computed helpers ──────────────────────
  const enConteo = computed(() => estado.value === 'EN_CONTEO')
  const esperandoRevision = computed(() => estado.value === 'ESPERANDO_REVISION')
  const balanceRevelado = computed(() => estado.value === 'BALANCE_REVELADO')

  // ── Autorización del administrador ────────
  const adminAuth = reactive<AdminAuth>({
    autorizado: false,
    cargando: false,
    error: '',
    usuario: '',
  })

  // ── Control del dialog de login ──────────
  const mostrarDialogAdmin = ref(false)

  // ─────────────────────────────────────────
  // Acciones
  // ─────────────────────────────────────────

  /**
   * El cajero termina su conteo:
   * cambia el estado a ESPERANDO_REVISION y abre el modal de admin.
   */
  function enviarConteo() {
    if (!enConteo.value) return
    estado.value = 'ESPERANDO_REVISION'
    mostrarDialogAdmin.value = true
  }

  /**
   * El administrador se autentica con usuario + PIN.
   * En una app real este método llamaría al endpoint de validación.
   *
   * @example  await turnoCajaStore.autenticarAdmin({ usuario: 'admin', pin: '1234' })
   */
  async function autenticarAdmin(credenciales: { usuario: string; pin: string }) {
    if (!esperandoRevision.value) return

    adminAuth.cargando = true
    adminAuth.error = ''

    try {
      // TODO: reemplazar por la llamada real, p. ej.:
      // await api.post('/api/auth/supervisor', credenciales)
      await new Promise<void>((resolve) => setTimeout(resolve, 600))

      if (credenciales.pin === '1234') {
        adminAuth.autorizado = true
        adminAuth.usuario = credenciales.usuario
        mostrarDialogAdmin.value = false
        estado.value = 'BALANCE_REVELADO'
      } else {
        adminAuth.error = 'PIN incorrecto. Verifica con el administrador en turno.'
      }
    } finally {
      adminAuth.cargando = false
    }
  }

  /** Cierra el dialog sin autenticar y vuelve a EN_CONTEO. */
  function cancelarAutenticacion() {
    mostrarDialogAdmin.value = false
    estado.value = 'EN_CONTEO'
    adminAuth.error = ''
  }

  /** Revoca la autorización del administrador y regresa a EN_CONTEO. */
  function revocarAutorizacion() {
    adminAuth.autorizado = false
    adminAuth.usuario = ''
    adminAuth.error = ''
    estado.value = 'EN_CONTEO'
  }

  /** Reinicia el store a su estado inicial tras un cierre exitoso. */
  function resetTurno() {
    estado.value = 'EN_CONTEO'
    adminAuth.autorizado = false
    adminAuth.cargando = false
    adminAuth.error = ''
    adminAuth.usuario = ''
    mostrarDialogAdmin.value = false
  }

  return {
    // estado
    estado,
    enConteo,
    esperandoRevision,
    balanceRevelado,
    // auth
    adminAuth,
    mostrarDialogAdmin,
    // acciones
    enviarConteo,
    autenticarAdmin,
    cancelarAutenticacion,
    revocarAutorizacion,
    resetTurno,
  }
})
