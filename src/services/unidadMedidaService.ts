import { unidadesMedidaApi } from '@/api/unidadesMedidaApi'
import type { UnidadMedida } from '@/types/unidadMedida'

export async function listarUnidadesMedida(): Promise<UnidadMedida[]> {
  return unidadesMedidaApi.listar()
}
