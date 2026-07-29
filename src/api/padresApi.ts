import type { PadreDashboardResponse } from '@/types/padres'

const MOCK_RESPONSE: PadreDashboardResponse = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMWIyYzNkNC11dWlkLXR1dG9yIiwibm9tYnJlIjoiTWFyw61hIEdhcmPDrWEgTMOzcGV6In0.example',
  token_type: 'Bearer',
  expires_in: 7200,
  tutor: {
    id: 'a1b2c3d4-uuid-tutor',
    nombreCompleto: 'María García López',
    telefono: '5512345678',
    sucursal: {
      id: 'x9y8z7w6-uuid-sucursal',
      nombre: 'Mercurio Santa Fe',
    },
  },
  ninosActivos: [
    {
      id: 'n1n2n3n4-uuid-nino-1',
      nombreCompleto: 'Sofía García',
      edad: 5,
      estadoVisita: 'Activo',
      horaEntrada: '2026-07-24T14:30:00Z',
      horaSalidaEsperada: '2026-07-24T16:30:00Z',
      'minutos Transcurridos': 45,
      'minutos Pagados': 120,
      pulsera: 'RF-0042',
    },
  ],
}

export const padresApi = {
  async loginConToken(_token: string): Promise<PadreDashboardResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(structuredClone(MOCK_RESPONSE))
      }, 1000)
    })
  },
}
