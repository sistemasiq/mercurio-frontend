// src/stores/comandasStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { IComanda, IItemComanda, EstadoComanda } from '../types/comanda';

export const useComandasStore = defineStore('comandas', () => {
  // Estado reactivo (Privado por convención usando guion bajo)
  const _comandas = ref<IComanda[]>([]);
  const _loading = ref<boolean>(false);

  // Getters (Propiedades Computadas)
  const comandasActivas = computed(() => _comandas.value);
  
  const isLoading = computed(() => _loading.value);
  
  // Filtra solo las comandas activas que el cocinero debe ver (Pendientes y En Proceso)
  const comandasEnCocina = computed(() => 
    _comandas.value.filter(c => c.estado === 'pendiente' || c.estado === 'en_proceso')
  );

  // Getters adicionales para alimentar los badges contadores del Header de Cocina
  const totalPendientes = computed(() => 
    _comandas.value.filter(c => c.estado === 'pendiente').length
  );
  
  const totalEnProceso = computed(() => 
    _comandas.value.filter(c => c.estado === 'en_proceso').length
  );
  
  const totalListos = computed(() => 
    _comandas.value.filter(c => c.estado === 'listo').length
  );

  /**
   * Acción para registrar una nueva comanda (Mesero -> Cocina)
   */
  function crearComanda(mesa: string, items: IItemComanda[], notas?: string) {
    _loading.value = true;
    try {
      const nuevaComanda: IComanda = {
        id: crypto.randomUUID(),
        // Genera folios autoincrementables limpios: COM-001, COM-002, etc.
        folio: `COM-${String(_comandas.value.length + 1).padStart(3, '0')}`,
        mesa,
        meseroId: 'usr-123', // Estático temporalmente hasta integrar auth
        meseroNombre: 'Andrés Palmerín',
        estado: 'pendiente',
        items,
        notasGenerales: notas,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      _comandas.value.push(nuevaComanda);
      
      // TODO: Conexión con Backend de Mercurio en el futuro:
      // const response = await axios.post('/api/comandas', nuevaComanda);
    } catch (error) {
      console.error('Error al crear la comanda en Mercurio:', error);
    } finally {
      _loading.value = false;
    }
  }

  /**
   * Acción para actualizar el ciclo de vida de una orden (KDS / Caja)
   */
  function actualizarEstado(id: string, nuevoEstado: EstadoComanda) {
    const comanda = _comandas.value.find(c => c.id === id);
    if (comanda) {
      comanda.estado = nuevoEstado;
      comanda.updatedAt = new Date().toISOString();
      
      // TODO: Sincronizar estado con la base de datos vía Axios:
      // await axios.patch(`/api/comandas/${id}`, { estado: nuevoEstado });
    }
  }

  // Retornamos el estado, propiedades computadas y métodos públicos
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