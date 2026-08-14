import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { branchService } from '@/services/branchService'
import type { Branch } from '@/types/branch'

export type Sucursal = {
  id: string
  clave: string
  nombre: string
  ciudad: string
  estado: string
  gerente: string | null
  fechaCreacion: string
  statusClave: 'activa' | 'inactiva'
}

export interface SucursalesStats {
  total: number
  activas: number
  inactivas: number
}

interface Filtros {
  estado: string | null
}

function mapBranchToSucursal(b: Branch): Sucursal {
  return {
    id: b.id,
    clave: b.clave ?? '-',
    nombre: b.nombre,
    ciudad: b.direccion ?? '-',
    estado: '-',
    gerente: b.administradorName ?? null,
    fechaCreacion: b.creado ?? '',
    statusClave: b.isActive ? 'activa' : 'inactiva',
  }
}

export function useSucursales() {
  const router = useRouter()
  const allSucursales = ref<Sucursal[]>([])
  const loading = ref(false)
  const busqueda = ref('')
  const filtros = ref<Filtros>({ estado: null })

  const sucursales = computed(() => {
    let result = allSucursales.value
    if (busqueda.value) {
      const q = busqueda.value.toLowerCase()
      result = result.filter(
        (s) => s.nombre.toLowerCase().includes(q) || s.clave.toLowerCase().includes(q),
      )
    }
    if (filtros.value.estado) {
      result = result.filter((s) => s.statusClave === filtros.value.estado)
    }
    return result
  })

  const stats = computed<SucursalesStats>(() => ({
    total: allSucursales.value.length,
    activas: allSucursales.value.filter((s) => s.statusClave === 'activa').length,
    inactivas: allSucursales.value.filter((s) => s.statusClave === 'inactiva').length,
  }))

  async function cargarSucursales() {
    loading.value = true
    try {
      const data = await branchService.listBranches()
      allSucursales.value = data.map(mapBranchToSucursal)
    } catch (error: unknown) {
      const e = error as { statusCode?: number; code?: string; message?: string }
      console.error('Error cargando sucursales:', e)
      Notify.create({
        type: 'negative',
        message: `Error al cargar sucursales: ${e?.message ?? e?.code ?? 'Error desconocido'} (${e?.statusCode ?? '?'})`,
        timeout: 5000,
      })
    } finally {
      loading.value = false
    }
  }

  async function editar(id: string) {
    await router.push({ name: 'sucursales-editar', params: { id } })
  }

  async function verDetalle(id: string) {
    await router.push({ name: 'sucursales-detalle', params: { id } })
  }

  return {
    sucursales,
    stats,
    loading,
    busqueda,
    filtros,
    cargarSucursales,
    editar,
    verDetalle,
  }
}
