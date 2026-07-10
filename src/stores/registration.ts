import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchProductos,
  fetchPulseras,
  postOnboarding,
  METODO_PAGO_ID,
  type ProductoDto,
  type PulseraDto,
  type OnboardingDetalle,
} from '@/api/onboardingClient'
import { useAuthStore } from '@/stores/auth'

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

export const useRegistrationStore = defineStore('registration', () => {
  const authStore = useAuthStore()
  const step = ref<RegistrationStep>('form')

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
  const folioId = ref('')

  const productoBase = ref<ProductoDto | null>(null)
  const pulseras = ref<PulseraDto[]>([])
  const isLoadingCatalog = ref(false)
  const isLoadingPulseras = ref(false)
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

  async function loadPulseras() {
    if (!authStore.currentBranchId) {
      submitError.value = 'No hay una sucursal activa en la sesión.'
      return
    }
    isLoadingPulseras.value = true
    submitError.value = null
    try {
      pulseras.value = await fetchPulseras(authStore.currentBranchId)
    } catch (err) {
      submitError.value = 'No se pudo cargar el catálogo de pulseras.'
      console.error(err)
    } finally {
      isLoadingPulseras.value = false
    }
  }

  const savedChildren = computed(() => children.value.filter((c) => c.saved))
  const tutorHasBracelet = computed(() => tutor.value.braceletGuardianId !== '')
  const hours = computed(() => HOUR_OPTIONS[tutor.value.estimatedTime] ?? 1)

  const pricePerChild = computed(() => {
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

  // Cuántos niños se pueden registrar según las pulseras disponibles en la sucursal
  const maxChildrenAllowed = computed(() => pulseras.value.length)

  const reachedBraceletLimit = computed(
    () => maxChildrenAllowed.value > 0 && children.value.length >= maxChildrenAllowed.value,
  )

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

  async function proceedToRFID() {
    step.value = 'rfid'
    await loadPulseras()
  }

  async function completeRegistration() {
    if (!productoBase.value) {
      submitError.value = 'No hay catálogo de productos cargado.'
      return
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
      pagos: [{ metodoPagoId: METODO_PAGO_ID, monto: total.value }],
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
    folioId.value = ''
  }

  return {
    step,
    tutor,
    children,
    currentChildIndex,
    folioId,
    productoBase,
    pulseras,
    isLoadingCatalog,
    isLoadingPulseras,
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
    maxChildrenAllowed,
    reachedBraceletLimit,
    tutorHasBracelet,
    addChild,
    removeChild,
    saveChild,
    editChild,
    proceedToRFID,
    completeRegistration,
    reset,
    loadProductos,
    loadPulseras,
  }
})
