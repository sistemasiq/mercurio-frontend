export type EstadoComanda = 'pendiente' | 'en_proceso' | 'listo' | 'entregado';

export interface IItemComanda {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  observaciones?: string;
}

export interface IComanda {
  id: string;
  folio: string;
  mesa: string;
  meseroId: string;
  meseroNombre: string;
  estado: EstadoComanda;
  items: IItemComanda[];
  notasGenerales?: string;
  createdAt: string;
  updatedAt: string;
}