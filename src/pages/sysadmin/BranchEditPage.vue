<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { branchService } from '@/services/branchService'
import type { ApiError } from '@/types/auth'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()

const id = route.params.id as string
const loading = ref(false)
const loadingData = ref(true)

const form = reactive({
  nombre: '',
  direccion: '',
  telefono: '',
})

const nombreRules = [(v: string) => !!v.trim() || 'El nombre es requerido']

function resolveErrorMessage(err: ApiError): string {
  if (err.statusCode === 404) return 'Sucursal no encontrada.'
  if (err.statusCode === 409) return 'Ya existe una sucursal con ese nombre.'
  return 'No se pudo guardar la sucursal. Verifica los datos.'
}

async function handleSubmit(): Promise<void> {
  loading.value = true
  try {
    await branchService.updateBranch(id, {
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim() || null,
      telefono: form.telefono.trim() || null,
    })
    $q.notify({ type: 'positive', message: 'Sucursal actualizada correctamente.' })
    router.push({ name: 'sysadmin-branches' })
  } catch (err) {
    $q.notify({ type: 'negative', message: resolveErrorMessage(err as ApiError) })
  } finally {
    loading.value = false
  }
}

function confirmDelete(): void {
  $q.dialog({
    title: 'Eliminar sucursal',
    message: `¿Eliminar "${form.nombre}"? Esta acción no se puede deshacer.`,
    cancel: { flat: true, label: 'Cancelar' },
    ok: { color: 'negative', label: 'Eliminar' },
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      await branchService.deleteBranch(id)
      $q.notify({ type: 'positive', message: 'Sucursal eliminada.' })
      router.push({ name: 'sysadmin-branches' })
    } catch {
      $q.notify({ type: 'negative', message: 'No se pudo eliminar la sucursal.' })
      loading.value = false
    }
  })
}

onMounted(async () => {
  try {
    const branch = await branchService.getBranch(id)
    form.nombre = branch.nombre
    form.direccion = branch.direccion ?? ''
    form.telefono = branch.telefono ?? ''
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la sucursal.' })
    router.push({ name: 'sysadmin-branches' })
  } finally {
    loadingData.value = false
  }
})
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
      <div class="text-h5 text-weight-bold">Editar sucursal</div>
    </div>

    <q-card flat bordered style="max-width: 560px">
      <q-inner-loading :showing="loadingData" />

      <q-card-section v-if="!loadingData">
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

          <div class="row justify-between q-mt-md">
            <q-btn
              flat
              color="negative"
              icon="delete"
              label="Eliminar"
              :disable="loading"
              @click="confirmDelete"
            />
            <div class="row q-gutter-sm">
              <q-btn
                flat
                label="Cancelar"
                :disable="loading"
                @click="router.push({ name: 'sysadmin-branches' })"
              />
              <q-btn type="submit" color="primary" label="Guardar" :loading="loading" />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>
