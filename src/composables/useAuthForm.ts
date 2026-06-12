import { reactive, ref, computed, onMounted } from 'vue'
import { Notify } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { getRoleHome } from '@/utils/roleHome'
import { inactivityTimer } from '@/utils/inactivityTimer'
import { branchService } from '@/services/branchService'
import type { LoginRequest, ApiError } from '@/types/auth'
import type { Branch } from '@/types/branch'

export function useAuthForm() {
  const auth = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const credentials = reactive<LoginRequest>({
    sucursalId: null,
    email: '',
    password: '',
    rememberMe: false,
  })

  const showPassword = ref(false)
  const branches = ref<Branch[]>([])
  const branchesLoading = ref(false)

  const branchOptions = computed(() => [
    { label: 'Ninguna (Administrador Sistema)', value: null },
    ...branches.value.filter((b) => b.isActive).map((b) => ({ label: b.nombre, value: b.id })),
  ])

  const emailRules = [
    (v: string) => !!v || 'El usuario o correo electrónico es requerido.',
    (v: string) => v.length >= 3 || 'Debe tener al menos 3 caracteres.',
  ]

  const passwordRules = [
    (v: string) => !!v || 'La contraseña es requerida.',
    (v: string) => v.length >= 6 || 'La contraseña debe tener al menos 6 caracteres.',
  ]

  onMounted(async () => {
    branchesLoading.value = true
    try {
      branches.value = await branchService.listBranches()
    } catch {
      // El login sigue funcionando aunque no carguen las sucursales
    } finally {
      branchesLoading.value = false
    }
  })

  async function handleLogin(): Promise<void> {
    try {
      await auth.login({ ...credentials })
      inactivityTimer.start()

      Notify.create({
        type: 'positive',
        message: '¡Bienvenido!',
        icon: 'check_circle',
      })

      const redirect = route.query.redirect as string | undefined
      await router.push(redirect ?? { name: getRoleHome(auth.currentUser!.roles) })
    } catch (err) {
      Notify.create({
        type: 'negative',
        message: (err as ApiError).message ?? auth.error ?? 'Error al iniciar sesión.',
        icon: 'error',
      })
    }
  }

  return {
    credentials,
    showPassword,
    branchOptions,
    branchesLoading,
    emailRules,
    passwordRules,
    isLoading: () => auth.loading,
    handleLogin,
  }
}
