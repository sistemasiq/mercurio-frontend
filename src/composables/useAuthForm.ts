import { reactive, ref } from 'vue'
import { Notify } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { getRoleHome } from '@/utils/roleHome'
import { inactivityTimer } from '@/utils/inactivityTimer'
import type { LoginRequest, ApiError } from '@/types/auth'

export function useAuthForm() {
  const auth = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const credentials = reactive<LoginRequest>({
    branchId: '',
    email: '',
    password: '',
    rememberMe: false,
  })

  const showPassword = ref(false)

  const branchIdRules = [(v: string) => !!v || 'El ID de sucursal es requerido.']

  const emailRules = [
    (v: string) => !!v || 'El usuario o correo electrónico es requerido.',
    (v: string) => v.length >= 3 || 'Debe tener al menos 3 caracteres.',
  ]

  const passwordRules = [
    (v: string) => !!v || 'La contraseña es requerida.',
    (v: string) => v.length >= 6 || 'La contraseña debe tener al menos 6 caracteres.',
  ]

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
    branchIdRules,
    emailRules,
    passwordRules,
    isLoading: () => auth.loading,
    handleLogin,
  }
}
