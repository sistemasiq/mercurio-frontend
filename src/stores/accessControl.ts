import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchActivos, fetchPulseras, type ActivoDto } from '@/api/onboardingClient'
import { useAuthStore } from '@/stores/auth'

export type StayStatus = 'activo' | 'por_expirar' | 'excedido'

export interface ActiveChild extends ActivoDto {
  status: StayStatus
  minutosRestantes: number // positive = remaining, negative = exceeded
  progressPercent: number // 0-100, capped at 100
}

const EXPIRING_THRESHOLD_MINUTES = 15
const REFRESH_INTERVAL_MS = 60_000 // 1 minute

export const useAccessControlStore = defineStore('accessControl', () => {
  const authStore = useAuthStore()
  const rawActivos = ref<ActivoDto[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  const checkoutChild = ref<ActiveChild | null>(null)

  function setCheckoutChild(child: ActiveChild) {
    checkoutChild.value = child
  }

  function clearCheckoutChild() {
    checkoutChild.value = null
  }

  let refreshTimer: ReturnType<typeof setInterval> | null = null

  function computeStatus(item: ActivoDto): ActiveChild {
    const minutosRestantes = item.minutos_pagados - item.minutos_transcurridos
    const progressPercent = Math.min(
      100,
      Math.round((item.minutos_transcurridos / item.minutos_pagados) * 100),
    )

    let status: StayStatus = 'activo'
    if (minutosRestantes < 0) {
      status = 'excedido'
    } else if (minutosRestantes <= EXPIRING_THRESHOLD_MINUTES) {
      status = 'por_expirar'
    }

    return { ...item, status, minutosRestantes, progressPercent }
  }

  const activos = computed<ActiveChild[]>(() => rawActivos.value.map(computeStatus))

  const totalActivos = computed(() => activos.value.length)

  const porExpirar = computed(() => activos.value.filter((a) => a.status === 'por_expirar').length)

  const excedidos = computed(() => activos.value.filter((a) => a.status === 'excedido').length)

  const pulserasLibres = ref(0)
  const capacidadTotal = computed(() => totalActivos.value + pulserasLibres.value)

  const disponibilidadPercent = computed(() => {
    if (capacidadTotal.value === 0) return 0
    return Math.round((pulserasLibres.value / capacidadTotal.value) * 100)
  })

  async function loadActivos() {
    if (!authStore.currentBranchId) {
      error.value = 'No hay una sucursal activa en la sesión.'
      return
    }
    isLoading.value = true
    error.value = null
    try {
      const [activosData, pulserasData] = await Promise.all([
        fetchActivos(authStore.currentBranchId),
        fetchPulseras(authStore.currentBranchId),
      ])
      rawActivos.value = activosData
      pulserasLibres.value = pulserasData.length
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = 'No se pudo cargar la lista de niños activos.'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh()
    refreshTimer = setInterval(() => {
      loadActivos()
    }, REFRESH_INTERVAL_MS)
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  function formatMinutosLabel(item: ActiveChild): string {
    const transcurridoH = Math.floor(item.minutos_transcurridos / 60)
    const transcurridoM = item.minutos_transcurridos % 60
    const pagadoH = Math.floor(item.minutos_pagados / 60)

    const transcurridoStr =
      transcurridoH > 0 ? `${transcurridoH}h ${transcurridoM}m` : `${transcurridoM}m`
    const pagadoStr = pagadoH > 0 ? `${pagadoH}h` : `${item.minutos_pagados}m`

    return `${transcurridoStr} / ${pagadoStr}`
  }

  function formatRemainingLabel(item: ActiveChild): string {
    if (item.status === 'excedido') {
      const exceededBy = Math.abs(item.minutosRestantes)
      const h = Math.floor(item.minutos_pagados / 60)
      const hLabel = h > 0 ? `${h}h` : `${item.minutos_pagados}m`
      return `+${exceededBy}m (${hLabel})`
    }
    return `< ${item.minutosRestantes} min`
  }

  return {
    rawActivos,
    activos,
    isLoading,
    error,
    lastUpdated,
    checkoutChild,
    setCheckoutChild,
    clearCheckoutChild,
    totalActivos,
    porExpirar,
    excedidos,
    disponibilidadPercent,
    pulserasLibres,
    capacidadTotal,
    loadActivos,
    startAutoRefresh,
    stopAutoRefresh,
    formatMinutosLabel,
    formatRemainingLabel,
  }
})
