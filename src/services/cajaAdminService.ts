import { cajasAdminApi } from '@/api/cajasAdminApi'
import type { CajaAdmin, CajaCreate, CajaUpdate } from '@/types/caja-admin'

export const cajaAdminService = {
  async listCajas(): Promise<CajaAdmin[]> {
    return cajasAdminApi.list()
  },

  async createCaja(payload: CajaCreate): Promise<CajaAdmin> {
    return cajasAdminApi.create(payload)
  },

  async updateCaja(id: string, payload: CajaUpdate): Promise<CajaAdmin> {
    return cajasAdminApi.update(id, payload)
  },

  async deleteCaja(id: string): Promise<void> {
    return cajasAdminApi.remove(id)
  },
}
