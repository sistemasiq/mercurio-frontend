export default interface AuditFields {
  id: string
  activo: boolean
  creado?: string
  creado_por?: string | null
  modificado?: string | null
  modificado_por?: string | null
}
