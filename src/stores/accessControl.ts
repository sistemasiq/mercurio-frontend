import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchActivos,
  fetchPulseras,
  type ActivoDto,
  type PulseraDto,
} from '@/api/onboardingClient'
import { useAuthStore } from '@/stores/auth'

export type StayStatus = 'activo' | 'por_expirar' | 'excedido'

export interface ActiveChild extends ActivoDto {
  status: StayStatus
  minutosRestantes: number // positive = remaining, negative = exceeded
  progressPercent: number // 0-100, capped at 100
}

const EXPIRING_THRESHOLD_MINUTES = 15

export const useAccessControlStore = defineStore('accessControl', () => {
  const authStore = useAuthStore()
  const rawActivos = ref<ActivoDto[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  const now = ref(Date.now())

  let tickTimer: ReturnType<typeof setInterval> | null = null

  function startTicking() {
    stopTicking()
    tickTimer = setInterval(() => {
      now.value = Date.now()
    }, 60_000)
  }

  function stopTicking() {
    if (tickTimer) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  const checkoutChild = ref<ActiveChild | null>(null)

  function setCheckoutChild(child: ActiveChild) {
    checkoutChild.value = child
  }

  function clearCheckoutChild() {
    checkoutChild.value = null
  }

  function computeStatus(item: ActivoDto): ActiveChild {
    const elapsedMs = lastUpdated.value ? now.value - lastUpdated.value.getTime() : 0
    const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60_000))
    const minutosTranscurridos = item.minutosTranscurridos + elapsedMinutes

    const minutosRestantes = item.minutosPagados - minutosTranscurridos
    const progressPercent = Math.min(
      100,
      Math.round((minutosTranscurridos / item.minutosPagados) * 100),
    )

    let status: StayStatus = 'activo'
    if (minutosRestantes < 0) {
      status = 'excedido'
    } else if (minutosRestantes <= EXPIRING_THRESHOLD_MINUTES) {
      status = 'por_expirar'
    }

    return { ...item, minutosTranscurridos, status, minutosRestantes, progressPercent }
  }

  const activos = computed<ActiveChild[]>(() => rawActivos.value.map(computeStatus))

  const totalActivos = computed(() => activos.value.filter((a) => a.status === 'activo').length)

  const porExpirar = computed(() => activos.value.filter((a) => a.status === 'por_expirar').length)

  const excedidos = computed(() => activos.value.filter((a) => a.status === 'excedido').length)

  const pulserasDisponibles = ref<PulseraDto[]>([])
  const pulserasLibres = computed(() => pulserasDisponibles.value.length)
  const puedeVerPulseras = computed(() => authStore.hasPermission('pulseras:listar'))

  async function loadActivos() {
    if (!authStore.currentBranchId) {
      error.value = 'No hay una sucursal activa en la sesión.'
      return
    }
    isLoading.value = true
    error.value = null
    try {
      rawActivos.value = await fetchActivos(authStore.currentBranchId)
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = 'No se pudo cargar la lista de niños activos.'
      console.error(err)
    } finally {
      isLoading.value = false
    }

    // Las pulseras alimentan el indicador de disponibilidad y el selector de
    // registro; requieren un permiso aparte (pulseras:listar) y no deben
    // bloquear la lista de activos.
    if (puedeVerPulseras.value) {
      try {
        pulserasDisponibles.value = await fetchPulseras(authStore.currentBranchId)
      } catch (err) {
        console.error(err)
      }
    }
  }

  function formatMinutosLabel(item: ActiveChild): string {
    const transcurridoH = Math.floor(item.minutosTranscurridos / 60)
    const transcurridoM = item.minutosTranscurridos % 60
    const pagadoH = Math.floor(item.minutosPagados / 60)

    const transcurridoStr =
      transcurridoH > 0 ? `${transcurridoH}h ${transcurridoM}m` : `${transcurridoM}m`
    const pagadoStr = pagadoH > 0 ? `${pagadoH}h` : `${item.minutosPagados}m`

    return `${transcurridoStr} / ${pagadoStr}`
  }

  function formatRemainingLabel(item: ActiveChild): string {
    if (item.status === 'excedido') {
      const exceededBy = Math.abs(item.minutosRestantes)
      const h = Math.floor(item.minutosPagados / 60)
      const hLabel = h > 0 ? `${h}h` : `${item.minutosPagados}m`
      return `+${exceededBy}m (${hLabel})`
    }
    return `< ${item.minutosRestantes} min`
  }

  return {
    rawActivos,
    activos,
    totalActivos,
    isLoading,
    error,
    lastUpdated,
    startTicking,
    stopTicking,
    checkoutChild,
    setCheckoutChild,
    clearCheckoutChild,
    porExpirar,
    excedidos,
    pulserasLibres,
    pulserasDisponibles,
    puedeVerPulseras,
    loadActivos,
    formatMinutosLabel,
    formatRemainingLabel,
  }
})
