import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  postOnboarding,
  fetchMetodoPagoPorDefecto,
  type OnboardingDetalle,
  type OnboardingPago,
} from '@/api/onboardingClient'
import { productosApi } from '@/api/productosApi'
import { useAuthStore } from '@/stores/auth'
import { useAccessControlStore } from '@/stores/accessControl'
import { reservacionesApi } from '@/api/reservacionesApi'
import type { EventoDelDia } from '@/types/reservaciones'
import type { PrecioEstancia, TramoEstancia } from '@/types/producto'

export interface Child {
  id: string
  name: string
  age: number | null
  notes: string
  rfidBracelet: string
  saved: boolean
}

export interface TutorData {
  fullName: string
  relationship: string
  phone: string
  secondaryGuardian: string | null
  inePhoto: File | null
  arrivalPhotos: File[]
  estimatedTime: string
}

const HOUR_OPTIONS: Record<string, number> = {
  '1 hr': 1,
  '2 hr': 2,
  '3 hr': 3,
  '4 hr': 4,
  '5 hr': 5,
}

export type RegistrationStep = 'form' | 'rfid' | 'complete'
export type RegistrationMode = 'normal' | 'evento'

export const useRegistrationStore = defineStore('registration', () => {
  const authStore = useAuthStore()
  const accessControlStore = useAccessControlStore()
  const step = ref<RegistrationStep>('form')

  const modo = ref<RegistrationMode>('normal')
  const eventoSeleccionado = ref<EventoDelDia | null>(null)
  const isLoadingEvento = ref(false)
  const eventoNoEncontrado = ref(false)

  const isEventoMode = computed(() => modo.value === 'evento')
  const isLocked = computed(
    () => isEventoMode.value || step.value === 'rfid' || step.value === 'complete',
  )

  const tutor = ref<TutorData>({
    fullName: '',
    relationship: 'Padre / Madre',
    phone: '',
    secondaryGuardian: '',
    inePhoto: null,
    arrivalPhotos: [],
    estimatedTime: '1 hr',
  })

  const children = ref<Child[]>([createChild()])
  const currentChildIndex = ref(0)

  const productoBase = ref<PrecioEstancia | null>(null)
  const pulseras = computed(() => accessControlStore.pulserasDisponibles)
  const metodoPagoId = ref<string | null>(null)
  const pagosFromModal = ref<OnboardingPago[]>([])
  const isLoadingCatalog = ref(false)
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  const registroId = ref('')
  const totalFromServer = ref<number | null>(null)
  const pagadoFromServer = ref<number | null>(null)
  const estadoFromServer = ref('')

  function createChild(): Child {
    return {
      id: crypto.randomUUID(),
      name: '',
      age: null,
      notes: '',
      rfidBracelet: '',
      saved: false,
    }
  }

  function addChild() {
    children.value.push(createChild())
    currentChildIndex.value = children.value.length - 1
  }

  function removeChild(index: number) {
    if (children.value.length > 1) {
      children.value.splice(index, 1)
      if (currentChildIndex.value >= children.value.length) {
        currentChildIndex.value = children.value.length - 1
      }
    }
  }

  function saveChild(index: number) {
    children.value[index].saved = true
  }

  function editChild(index: number) {
    children.value[index].saved = false
  }

  async function loadProductos() {
    if (!authStore.currentBranchId) {
      submitError.value = 'No hay una sucursal activa en la sesión.'
      return
    }
    isLoadingCatalog.value = true
    submitError.value = null
    try {
      productoBase.value = await productosApi.obtenerPreciosEstancia()
    } catch (err) {
      submitError.value = 'No se pudo cargar el catálogo de precios de estancia.'
      console.error(err)
    } finally {
      isLoadingCatalog.value = false
    }
  }

  async function loadMetodoPago() {
    try {
      metodoPagoId.value = await fetchMetodoPagoPorDefecto()
    } catch (err) {
      submitError.value = 'No se pudo cargar el método de pago.'
      console.error(err)
    }
  }

  async function cargarEventoProximo() {
    if (!authStore.currentBranchId) return
    isLoadingEvento.value = true
    eventoNoEncontrado.value = false
    try {
      const evento = await reservacionesApi.eventoProximo(authStore.currentBranchId)
      if (evento) {
        seleccionarEvento(evento)
      } else {
        eventoSeleccionado.value = null
        eventoNoEncontrado.value = true
      }
    } catch (err) {
      submitError.value = 'No se pudo consultar el evento próximo.'
      console.error(err)
    } finally {
      isLoadingEvento.value = false
    }
  }

  function cambiarModo(nuevoModo: RegistrationMode) {
    modo.value = nuevoModo
    eventoSeleccionado.value = null
    eventoNoEncontrado.value = false

    if (nuevoModo === 'evento') {
      void cargarEventoProximo()
    }
  }

  function seleccionarEvento(evento: EventoDelDia) {
    eventoSeleccionado.value = evento
    tutor.value.fullName = [evento.nombre_cliente, evento.apellidos_cliente]
      .filter(Boolean)
      .join(' ')
    tutor.value.phone = evento.telefono_cliente
  }

  const savedChildren = computed(() => children.value.filter((c) => c.saved))
  const hours = computed(() => HOUR_OPTIONS[tutor.value.estimatedTime] ?? 1)

  // ── Cálculo de tarifa por tramos ──────────────────────────────────────────

  const tramoAplicable = computed<TramoEstancia | null>(() => {
    if (!productoBase.value?.config_estancia?.length) return null
    const h = hours.value
    return (
      productoBase.value.config_estancia.find(
        (tramo) => h >= tramo.min_horas && h <= tramo.max_horas,
      ) ?? null
    )
  })

  const tieneTarifaValida = computed(() => {
    if (modo.value === 'evento') return true
    return tramoAplicable.value !== null
  })

  const pricePerChild = computed(() => {
    if (modo.value === 'evento') return 0
    if (!tramoAplicable.value) return 0
    return Number(tramoAplicable.value.precio) * hours.value
  })

  const total = computed(() => savedChildren.value.length * pricePerChild.value)

  const usedBracelets = computed(() => children.value.map((c) => c.rfidBracelet).filter(Boolean))

  const availableBraceletsForChild = (childId: string) => {
    const child = children.value.find((c) => c.id === childId)
    return pulseras.value.filter(
      (p) => !usedBracelets.value.includes(p.id) || p.id === child?.rfidBracelet,
    )
  }

  const allChildrenHaveBracelet = computed(
    () => savedChildren.value.length > 0 && savedChildren.value.every((c) => c.rfidBracelet !== ''),
  )

  const cupoEventoRestante = computed(() => {
    if (!eventoSeleccionado.value) return Infinity
    return eventoSeleccionado.value.numero_personas - savedChildren.value.length
  })

  const horasEvento = computed(() => {
    if (!eventoSeleccionado.value) return '1 hr'
    const inicio = eventoSeleccionado.value.hora_inicio
    const fin = eventoSeleccionado.value.hora_fin
    const [hInicio] = inicio.split(':').map(Number)
    const [hFin] = fin.split(':').map(Number)
    const diff = hFin - hInicio
    if (diff <= 0) return '1 hr'
    if (diff > 5) return '5 hr'
    return `${diff} hr`
  })

  const maxChildrenAllowed = computed(() => {
    if (modo.value === 'evento' && eventoSeleccionado.value) {
      return eventoSeleccionado.value.numero_personas
    }
    return Math.max(0, pulseras.value.length - 1)
  })

  const reachedBraceletLimit = computed(
    () => savedChildren.value.length >= maxChildrenAllowed.value,
  )

  const showBraceletLimitBanner = computed(() => {
    if (modo.value === 'evento') {
      return savedChildren.value.length >= maxChildrenAllowed.value
    }
    if (maxChildrenAllowed.value === 1) {
      return true
    }
    return savedChildren.value.length >= 2 && savedChildren.value.length >= maxChildrenAllowed.value
  })

  const canProceedToRFID = computed(() => {
    const hasValidName = tutor.value.fullName.trim().length > 3

    const cleanPhone = tutor.value.phone.replace(/\D/g, '')
    const hasValidPhone = cleanPhone.length === 10

    const hasInePhoto = tutor.value.inePhoto !== null
    const hasArrivalPhotos = tutor.value.arrivalPhotos.length > 0

    const hasChildren = savedChildren.value.length > 0

    const childrenAreValid = savedChildren.value.every(
      (child) =>
        child.name.trim().length > 0 && child.age !== null && child.age > 0 && child.age < 18,
    )

    return (
      hasValidName &&
      hasValidPhone &&
      hasInePhoto &&
      hasArrivalPhotos &&
      hasChildren &&
      childrenAreValid &&
      tieneTarifaValida.value
    )
  })

  const motivosPendientes = computed(() => {
    const motivos: string[] = []

    if (tutor.value.fullName.trim().length <= 3) {
      motivos.push('Captura el nombre completo del tutor')
    }
    if (tutor.value.phone.replace(/\D/g, '').length !== 10) {
      motivos.push('El teléfono del tutor debe tener 10 dígitos')
    }
    if (tutor.value.inePhoto === null) {
      motivos.push('Toma la foto de INE del tutor')
    }
    if (tutor.value.arrivalPhotos.length === 0) {
      motivos.push('Toma al menos una foto de llegada del tutor')
    }
    if (savedChildren.value.length === 0) {
      motivos.push('Guarda al menos un niño')
    } else if (
      !savedChildren.value.every(
        (child) =>
          child.name.trim().length > 0 && child.age !== null && child.age > 0 && child.age < 18,
      )
    ) {
      motivos.push('Revisa el nombre y la edad de cada niño guardado')
    }

    if (!tieneTarifaValida.value) {
      motivos.push(`No existe tarifa configurada para ${hours.value} hora(s) de estancia.`)
    }

    return motivos
  })

  async function proceedToRFID(pagos?: OnboardingPago[]) {
    if (pagos) {
      pagosFromModal.value = pagos
    }
    step.value = 'rfid'
  }

  async function completeRegistration() {
    const esEvento = modo.value === 'evento'

    if (!productoBase.value) {
      submitError.value =
        'Esta sucursal no tiene un producto de tipo "estancia" configurado. ' +
        'Ve a Catálogo > Productos y crea uno antes de completar el registro.'
      return
    }

    if (!tieneTarifaValida.value) {
      submitError.value = `No hay un precio configurado para ${hours.value} hora(s).`
      return
    }

    if (esEvento && !eventoSeleccionado.value) {
      submitError.value = 'Selecciona el evento antes de completar el registro.'
      return
    }

    if (!esEvento && !metodoPagoId.value) {
      metodoPagoId.value = 'b827363b-6453-40e4-9536-f7a004711f91'
    }

    if (!authStore.currentBranchId) {
      submitError.value = 'No hay una sucursal activa en la sesión.'
      return
    }

    isSubmitting.value = true
    submitError.value = null

    const detalles: OnboardingDetalle[] = savedChildren.value.map((child) => ({
      nino: { nombreCompleto: child.name, edad: child.age ?? 0, notas: child.notes },
      productoId: productoBase.value!.id,
      cantidad: hours.value,
      pulseraId: child.rfidBracelet,
    }))

    const payload = {
      sucursalId: authStore.currentBranchId,
      tutor: {
        nombreCompleto: tutor.value.fullName,
        telefono: tutor.value.phone,
      },
      nombreSegundoTutor: tutor.value.secondaryGuardian || null,
      parentesco: tutor.value.relationship,
      detalles,
      pagos: esEvento
        ? []
        : pagosFromModal.value.length > 0
          ? pagosFromModal.value
          : [{ metodoPagoId: metodoPagoId.value!, monto: total.value }],
      reservacionId: esEvento ? eventoSeleccionado.value!.id : null,
    }

    try {
      const response = await postOnboarding(
        payload,
        tutor.value.inePhoto!,
        tutor.value.arrivalPhotos,
      )

      registroId.value = response.registroId
      totalFromServer.value = response.total
      pagadoFromServer.value = response.pagado
      estadoFromServer.value = response.estado
      step.value = 'complete'
    } catch (err) {
      submitError.value = 'No se pudo completar el registro. Intenta de nuevo.'
      console.error(err)
    } finally {
      isSubmitting.value = false
    }
  }

  function reset() {
    step.value = 'form'
    modo.value = 'normal'
    eventoSeleccionado.value = null
    eventoNoEncontrado.value = false
    pagosFromModal.value = []
    tutor.value = {
      fullName: '',
      relationship: 'Padre / Madre',
      phone: '',
      secondaryGuardian: '',
      inePhoto: null,
      arrivalPhotos: [],
      estimatedTime: '1 hr',
    }
    children.value = [createChild()]
    currentChildIndex.value = 0
  }

  return {
    step,
    modo,
    isEventoMode,
    isLocked,
    eventoSeleccionado,
    isLoadingEvento,
    eventoNoEncontrado,
    cupoEventoRestante,
    horasEvento,
    tutor,
    children,
    currentChildIndex,
    productoBase,
    pulseras,
    isLoadingCatalog,
    isSubmitting,
    submitError,
    registroId,
    totalFromServer,
    pagadoFromServer,
    estadoFromServer,
    savedChildren,
    hours,
    tramoAplicable,
    tieneTarifaValida,
    pricePerChild,
    total,
    usedBracelets,
    availableBraceletsForChild,
    allChildrenHaveBracelet,
    canProceedToRFID,
    motivosPendientes,
    maxChildrenAllowed,
    reachedBraceletLimit,
    showBraceletLimitBanner,
    addChild,
    removeChild,
    saveChild,
    editChild,
    proceedToRFID,
    completeRegistration,
    reset,
    loadProductos,
    loadMetodoPago,
    cargarEventoProximo,
    cambiarModo,
    seleccionarEvento,
  }
})
