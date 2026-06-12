<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { branchService } from '@/services/branchService'
import type { ApiError } from '@/types/auth'

const $q = useQuasar()
const router = useRouter()

const loading = ref(false)

const form = reactive({
  nombre: '',
  direccion: '',
  telefono: '',
})

const nombreRules = [(v: string) => !!v.trim() || 'El nombre es requerido']

function resolveErrorMessage(err: ApiError): string {
  if (err.statusCode === 409) return 'Ya existe una sucursal con ese nombre.'
  return 'No se pudo registrar la sucursal. Verifica los datos.'
}

async function handleSubmit(): Promise<void> {
  loading.value = true
  try {
    await branchService.createBranch({
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim() || null,
      telefono: form.telefono.trim() || null,
    })
    $q.notify({ type: 'positive', message: 'Sucursal registrada correctamente.' })
    router.push({ name: 'sysadmin-branches' })
  } catch (err) {
    $q.notify({ type: 'negative', message: resolveErrorMessage(err as ApiError) })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <q-page padding>
    <div class="flex items-center q-mb-lg q-gutter-sm">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        @click="router.push({ name: 'sysadmin-branches' })"
      />
      <div class="text-h5 text-weight-bold">Nueva sucursal</div>
    </div>

    <q-card flat bordered style="max-width: 560px">
      <q-card-section>
        <q-form class="q-gutter-y-md" @submit.prevent="handleSubmit">
          <q-input
            v-model="form.nombre"
            label="Nombre *"
            outlined
            :rules="nombreRules"
            lazy-rules
          />

          <q-input v-model="form.direccion" label="Dirección" outlined />

          <q-input v-model="form.telefono" label="Teléfono" outlined />

          <div class="row justify-end q-gutter-sm q-mt-md">
            <q-btn
              flat
              label="Cancelar"
              :disable="loading"
              @click="router.push({ name: 'sysadmin-branches' })"
            />
            <q-btn type="submit" color="primary" label="Registrar" :loading="loading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>
