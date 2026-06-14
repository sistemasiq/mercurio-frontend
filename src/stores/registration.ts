import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  inePhoto: string | null
  arrivalPhoto: string | null
  estimatedTime: string
}

// Hardcoded available bracelets
export const AVAILABLE_BRACELETS = [
  { id: 'B-8821', label: 'B-8821', inUse: false },
  { id: 'B-8822', label: 'B-8822', inUse: false },
  { id: 'B-8823', label: 'B-8823', inUse: false },
  { id: 'B-8824', label: 'B-8824', inUse: false },
  { id: 'B-8825', label: 'B-8825', inUse: false },
  { id: 'B-9001', label: 'B-9001', inUse: false },
  { id: 'B-9002', label: 'B-9002', inUse: false },
]

const PRICE_PER_HOUR: Record<string, number> = {
  '1 hr': 150,
  '2 hr': 270,
  '3 hr': 360,
}

export type RegistrationStep = 'form' | 'rfid' | 'complete'

export const useRegistrationStore = defineStore('registration', () => {
  const step = ref<RegistrationStep>('form')

  const tutor = ref<TutorData>({
    fullName: '',
    relationship: 'Padre / Madre',
    phone: '',
    inePhoto: null,
    arrivalPhoto: null,
    estimatedTime: '1 hr',
  })

  const children = ref<Child[]>([createChild()])
  const currentChildIndex = ref(0)
  const folioId = ref('')

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

  const savedChildren = computed(() => children.value.filter((c) => c.saved))

  const pricePerChild = computed(() => PRICE_PER_HOUR[tutor.value.estimatedTime] ?? 150)

  const total = computed(() => savedChildren.value.length * pricePerChild.value)

  const usedBracelets = computed(() => children.value.map((c) => c.rfidBracelet).filter(Boolean))

  const availableBraceletsForChild = (childId: string) => {
    const child = children.value.find((c) => c.id === childId)
    return AVAILABLE_BRACELETS.filter(
      (b) => !usedBracelets.value.includes(b.id) || b.id === child?.rfidBracelet,
    )
  }

  const allChildrenHaveBracelet = computed(
    () => savedChildren.value.length > 0 && savedChildren.value.every((c) => c.rfidBracelet),
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

  function proceedToRFID() {
    if (!canProceedToRFID.value) return

    step.value = 'rfid'
    folioId.value = `#KC-${Math.floor(10000 + Math.random() * 89999)}-DP`
  }

  function completeRegistration() {
    step.value = 'complete'
  }

  function reset() {
    step.value = 'form'
    tutor.value = {
      fullName: '',
      relationship: 'Padre / Madre',
      phone: '',
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
    savedChildren,
    pricePerChild,
    total,
    usedBracelets,
    availableBraceletsForChild,
    allChildrenHaveBracelet,
    canProceedToRFID,
    addChild,
    removeChild,
    saveChild,
    editChild,
    proceedToRFID,
    completeRegistration,
    reset,
  }
})
