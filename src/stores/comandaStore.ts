// src/stores/comandaStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { IComanda, EstadoComanda } from '../types/comanda';
import type { Producto } from '@/types/producto';

interface ItemTicket {
  producto: Producto;
  cantidad: number;
  notas?: string;
}

export const useComandasStore = defineStore('comandas', () => {
  // Datos hardcodeados iniciales directo en el estado de Mercurio
  const _comandas = ref<IComanda[]>([
    {
      id: 'ord-0038',
      folio: '001',
      mesa: 'Mesa 4',
      meseroId: 'usr-123',
      meseroNombre: 'Andrés Palmerín',
      estado: 'en_proceso', // Naranja
      notasGenerales: '12 min • PARA LLEVAR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        { id: '1', nombre: 'Hamburguesa Doble Queso', cantidad: 2, precioUnitario: 85, observaciones: 'Sin cebolla, extra pepinillos' },
        { id: '2', nombre: 'Papas Fritas Grandes', cantidad: 1, precioUnitario: 45 },
        { id: '3', nombre: 'Refresco de Cola', cantidad: 2, precioUnitario: 25 }
      ]
    },
    {
      id: 'ord-0042',
      folio: '002',
      mesa: 'Mesa 12',
      meseroId: 'usr-123',
      meseroNombre: 'Andrés Palmerín',
      estado: 'pendiente', // Gris
      notasGenerales: '5 min • PENDIENTE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        { id: '4', nombre: 'Pizza Margarita Familiar', cantidad: 1, precioUnitario: 180, observaciones: 'Masa delgada' },
        { id: '5', nombre: 'Ensalada César', cantidad: 1, precioUnitario: 90, observaciones: 'Alergia: Sin crutones' }
      ]
    },
    {
      id: 'ord-0043',
      folio: '003',
      mesa: 'Mostrador',
      meseroId: 'usr-123',
      meseroNombre: 'Andrés Palmerín',
      estado: 'pendiente', // Gris
      notasGenerales: '1 min • MOSTRADOR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        { id: '6', nombre: 'Helado de Vainilla', cantidad: 4, precioUnitario: 20 },
        { id: '7', nombre: 'Café Americano', cantidad: 2, precioUnitario: 30 }
      ]
    }
  ]);

  const _loading = ref<boolean>(false);

  // Getters
  const comandasActivas = computed(() => _comandas.value);
  const isLoading = computed(() => _loading.value);
  
  // Modificado: Cocina muestra Pendientes, En Proceso Y TAMBIÉN "Listos" para poder entregarlos
  const comandasEnCocina = computed(() => 
    _comandas.value.filter(c => c.estado === 'pendiente' || c.estado === 'en_proceso' || c.estado === 'listo')
  );

  // Contadores exactos para los chips de la UI
  const totalPendientes = computed(() => _comandas.value.filter(c => c.estado === 'pendiente').length);
  const totalEnProceso = computed(() => _comandas.value.filter(c => c.estado === 'en_proceso').length);
  const totalListos = computed(() => _comandas.value.filter(c => c.estado === 'listo').length);

  function crearComanda(mesa: string, items: ItemTicket[], notas?: string) {
  // Generamos un número de folio automático basado en cuántas órdenes ya existen
  const nuevoFolio = String(_comandas.value.length + 1).padStart(3, '0');
  
  const nuevaComanda: IComanda = {
    id: `ord-00${Date.now()}`, // ID único temporal
    folio: nuevoFolio,
    mesa: mesa,
    meseroId: 'usr-123',
    meseroNombre: 'Diana Ayala', 
    estado: 'pendiente',         // Entra directo a la fila de espera
    notasGenerales: notas || '1 min • NUEVO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Mapeamos los items de tu caja al formato estricto que espera la cocina
    items: items.map((item, index) => ({
      id: String(index + 1),
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precio_unitario,
      observaciones: item.notas || undefined
    }))
  };

  // Metemos la nueva orden al arreglo reactivo de Pinia
  _comandas.value.push(nuevaComanda);
}

function actualizarEstado(id: string, nuevoEstado: EstadoComanda) {
  const index = _comandas.value.findIndex(c => c.id === id);
  if (index !== -1) {

    _comandas.value[index] = {
      ..._comandas.value[index],
      estado: nuevoEstado,
      updatedAt: new Date().toISOString()
    };
  }
}

  return {
    comandasActivas,
    comandasEnCocina,
    totalPendientes,
    totalEnProceso,
    totalListos,
    isLoading,
    crearComanda,
    actualizarEstado
  };
});