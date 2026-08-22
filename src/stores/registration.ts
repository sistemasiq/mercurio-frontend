import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchProductos,
  postOnboarding,
  fetchMetodoPagoPorDefecto,
  type ProductoDto,
  type OnboardingDetalle,
  type OnboardingPago,
} from '@/api/onboardingClient'
import { useAuthStore } from '@/stores/auth'
import { useAccessControlStore } from '@/stores/accessControl'
import { reservacionesApi } from '@/api/reservacionesApi'
import type { EventoDelDia } from '@/types/reservaciones'

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
  braceletGuardianId: string
  inePhoto: File | null
  arrivalPhoto: File | null
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

  const tutor = ref<TutorData>({
    fullName: '',
    relationship: 'Padre / Madre',
    phone: '',
    secondaryGuardian: '',
    braceletGuardianId: '',
    inePhoto: null,
    arrivalPhoto: null,
    estimatedTime: '1 hr',
  })

  const children = ref<Child[]>([createChild()])
  const currentChildIndex = ref(0)

  const productoBase = ref<ProductoDto | null>(null)
  const pulseras = computed(() => accessControlStore.pulserasDisponibles)
  const metodoPagoId = ref<string | null>(null)
  const pagosFromModal = ref<OnboardingPago[]>([])
  const cambioFromModal = ref(0)
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
      const productos = await fetchProductos(authStore.currentBranchId)
      productoBase.value = productos[0] ?? null
    } catch (err) {
      submitError.value = 'No se pudo cargar el catálogo de precios.'
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
  const tutorHasBracelet = computed(() => tutor.value.braceletGuardianId !== '')
  const hours = computed(() => HOUR_OPTIONS[tutor.value.estimatedTime] ?? 1)

  const pricePerChild = computed(() => {
    if (modo.value === 'evento') return 0
    if (!productoBase.value) return 0
    return productoBase.value.precioUnitario * hours.value
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
    () =>
      tutor.value.braceletGuardianId !== '' &&
      savedChildren.value.length > 0 &&
      savedChildren.value.every((c) => c.rfidBracelet !== ''),
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
    const hasArrivalPhoto = tutor.value.arrivalPhoto !== null

    const hasChildren = savedChildren.value.length > 0

    const childrenAreValid = savedChildren.value.every(
      (child) =>
        child.name.trim().length > 0 && child.age !== null && child.age > 0 && child.age < 18,
    )

    return (
      hasValidName &&
      hasValidPhone &&
      hasInePhoto &&
      hasArrivalPhoto &&
      hasChildren &&
      childrenAreValid
    )
  })

  /** Lista de requisitos que faltan para poder completar el pago -- para
   * mostrarle al operador exactamente qué falta en vez de un aviso genérico
   * cuando el botón "Completar pago" está deshabilitado. */
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
    if (tutor.value.arrivalPhoto === null) {
      motivos.push('Toma la foto de llegada del tutor')
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

    return motivos
  })

  async function proceedToRFID(pagos?: OnboardingPago[], cambio?: number) {
    if (pagos) {
      pagosFromModal.value = pagos
      cambioFromModal.value = cambio ?? 0
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

    if (esEvento && !eventoSeleccionado.value) {
      submitError.value = 'Selecciona el evento antes de completar el registro.'
      return
    }

    if (!esEvento && !metodoPagoId.value) {
      //Hasta no tener componente para hacer pruebas se tomara este
      metodoPagoId.value = 'b827363b-6453-40e4-9536-f7a004711f91'
      //console.log("No hay nada")
      //submitError.value = 'No hay métodos de pago configurados. Crea uno en Métodos de Pago.'
      //return
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
      pulseraTutorId: tutor.value.braceletGuardianId,
      parentesco: tutor.value.relationship,
      detalles,
      pagos: esEvento
        ? []
        : pagosFromModal.value.length > 0
          ? pagosFromModal.value
          : [{ metodoPagoId: metodoPagoId.value!, monto: total.value }],
      cambio: cambioFromModal.value > 0 ? cambioFromModal.value : undefined,
      reservacionId: esEvento ? eventoSeleccionado.value!.id : null,
    }

    try {
      const response = await postOnboarding(
        payload,
        tutor.value.inePhoto!,
        tutor.value.arrivalPhoto!,
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
    cambioFromModal.value = 0
    tutor.value = {
      fullName: '',
      relationship: 'Padre / Madre',
      phone: '',
      secondaryGuardian: '',
      braceletGuardianId: '',
      inePhoto: null,
      arrivalPhoto: null,
      estimatedTime: '1 hr',
    }
    children.value = [createChild()]
    currentChildIndex.value = 0
  }

  return {
    step,
    modo,
    isEventoMode,
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
    pricePerChild,
    total,
    usedBracelets,
    availableBraceletsForChild,
    allChildrenHaveBracelet,
    canProceedToRFID,
    motivosPendientes,
    maxChildrenAllowed,
    reachedBraceletLimit,
    tutorHasBracelet,
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
