// Este módulo delega completamente a branchService.
// Se mantiene para compatibilidad con importaciones existentes.
export { branchService as sucursalesService } from '@/services/branchService'
export type { Branch as Sucursal } from '@/types/branch'
