/**
 * @file turnoCajaMock.ts
 * @description Datos de prueba para el módulo de Cierre de Caja.
 *
 * ⚠️  SOLO PARA DESARROLLO LOCAL — nunca importar desde código de producción.
 *     Este archivo existe para poder ejercitar todas las fases de la UI
 *     sin depender del módulo de apertura de turno.
 *
 * Uso desde el store (solo cuando import.meta.env.DEV === true):
 *   import { MOCK_TURNO_ACTIVO } from '@/mocks/turnoCajaMock'
 */

import type { TurnoActivoResponse, RevisionAdminResponse } from '@/types/turnoCaja'

// ─────────────────────────────────────────────────────────────────────────────
// Turno activo mock — estado EN_CONTEO listo para que el cajero declare
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_TURNO_ACTIVO: TurnoActivoResponse = {
  id: '999',
  sucursalId: 'suc-001',
  sucursalNombre: 'Sucursal Centro (TEST)',
  cajeroId: 'usr-042',
  cajeroNombre: 'Ana López (mock)',
  terminal: 'CAJA 01 - TEST',
  estado: 'EN_CONTEO',
  fondoInicial: 2000.0,
  fechaApertura: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // hace 8 horas
  totalVentas: 18_450.0, // visible solo para el admin; el cajero no lo ve
  totalRetiros: 1500.0,
  movimientos: [
    { metodo: 'vouchers', totalVentas: 3_200.0 },
    { metodo: 'tarjeta', totalVentas: 9_750.0 },
    { metodo: 'transferencia', totalVentas: 5_500.0 },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Respuesta de revisión admin mock — simula un cierre con diferencia
// (faltante de $250 en efectivo para que se active el campo de observaciones)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_REVISION_ADMIN: RevisionAdminResponse = {
  autorizado: true,
  adminNombre: 'Carlos Mendoza (mock)',
  totalEsperado: 20_450.0,
  totalDeclarado: 20_200.0,
  diferenciaNeta: -250.0,
  balancePorMetodo: [
    {
      metodo: 'efectivo',
      label: 'Efectivo',
      declarado: 1_750.0,
      esperado: 2_000.0,
      diferencia: -250.0,
    },
    {
      metodo: 'vouchers',
      label: 'Vouchers / Tickets',
      declarado: 3_200.0,
      esperado: 3_200.0,
      diferencia: 0,
    },
    {
      metodo: 'tarjeta',
      label: 'Tarjeta de crédito/débito',
      declarado: 9_750.0,
      esperado: 9_750.0,
      diferencia: 0,
    },
    {
      metodo: 'transferencia',
      label: 'Transferencia',
      declarado: 5_500.0,
      esperado: 5_500.0,
      diferencia: 0,
    },
  ],
}
