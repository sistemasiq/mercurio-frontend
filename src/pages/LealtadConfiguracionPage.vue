<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 700px; margin: 0 auto">
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
            Puntos de Lealtad
          </div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Configuración del programa de puntos de esta sucursal.
          </div>
        </div>
      </div>

      <!-- Sin sucursal activa -->
      <q-banner
        v-if="!authStore.currentBranchId"
        dense
        rounded
        class="bg-orange-1 text-orange-9 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="info" color="orange-9" /></template>
        No hay una sucursal activa en la sesión.
      </q-banner>

      <!-- Error -->
      <q-banner
        v-if="store.error"
        dense
        rounded
        class="bg-red-1 text-red-8 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="error_outline" color="negative" /></template>
        {{ store.error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="cargar" />
        </template>
      </q-banner>

      <!-- Formulario -->
      <q-card flat bordered class="q-pa-lg" style="border-radius: 12px">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <div class="field-label">% DE RETORNO</div>
            <q-input
              v-model.number="form.porcentaje_retorno"
              dense
              outlined
              type="number"
              min="0"
              max="100"
              step="0.01"
              suffix="%"
              hint="% del total pagado que se convierte en puntos"
            />
          </div>
          <div class="col-12 col-sm-6">
            <div class="field-label">DÍAS DE CADUCIDAD</div>
            <q-input
              v-model.number="form.dias_caducidad"
              dense
              outlined
              type="number"
              min="1"
              step="1"
              hint="Días desde que se otorgan hasta que caducan"
            />
          </div>
          <div class="col-12 col-sm-6">
            <div class="field-label">VALOR DEL PUNTO</div>
            <q-input
              v-model.number="form.valor_punto"
              dense
              outlined
              type="number"
              min="0.01"
              step="0.01"
              prefix="$"
              hint="Pesos que vale 1 punto al canjearse"
            />
          </div>
          <div class="col-12 col-sm-6 flex items-center">
            <q-toggle v-model="form.activo" label="Programa activo" color="primary" />
          </div>
        </div>

        <div class="row justify-end q-mt-lg">
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Guardar"
            :loading="guardando"
            :disable="!authStore.currentBranchId || !form.dias_caducidad"
            style="border-radius: 8px; font-weight: 600"
            @click="guardar"
          />
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useLealtadStore } from '@/stores/lealtad'
import type { ConfiguracionLealtadInput } from '@/types/lealtad'
import type { ApiError } from '@/types/auth'

const $q = useQuasar()
const authStore = useAuthStore()
const store = useLealtadStore()

const guardando = ref(false)

const form = reactive<ConfiguracionLealtadInput>({
  porcentaje_retorno: 0,
  dias_caducidad: 30,
  valor_punto: 1,
  activo: true,
})

const cargar = async () => {
  if (!authStore.currentBranchId) return
  await store.cargarConfiguracion(authStore.currentBranchId)
  if (store.configuracion) {
    form.porcentaje_retorno = store.configuracion.porcentaje_retorno
    form.dias_caducidad = store.configuracion.dias_caducidad
    form.valor_punto = store.configuracion.valor_punto
    form.activo = store.configuracion.activo
  }
}

const guardar = async () => {
  if (!authStore.currentBranchId) return
  guardando.value = true
  try {
    await store.guardarConfiguracion(authStore.currentBranchId, { ...form })
    $q.notify({ type: 'positive', message: 'Configuración de lealtad guardada' })
  } catch (error: unknown) {
    const apiError = error as ApiError
    $q.notify({ type: 'negative', message: apiError.message ?? 'No se pudo guardar' })
  } finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>

<style scoped></style>
