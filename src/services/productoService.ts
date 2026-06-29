import axios, { type AxiosInstance } from 'axios'
import type { Producto } from '@/types/producto'

const productoApi: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function obtenerProductos(signal?: AbortSignal): Promise<Producto[]> {
  const response = await productoApi.get<Producto[]>('/productos/', { signal })
  return response.data
}
