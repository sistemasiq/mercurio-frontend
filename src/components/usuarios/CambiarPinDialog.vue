<template>
  <BaseDialog
    v-model="show"
    title="Cambiar mi PIN"
    subtitle="El PIN se usa para abrir y cerrar tu caja."
    icon="password"
    :width="480"
    persistent
    primary-label="Guardar"
    :loading="guardando"
    @confirm="guardar"
  >
    <q-form ref="formRef" greedy class="form-grid" @submit.prevent="guardar">
      <label class="form-grid__field form-grid__field--full">
        <span class="field-label">PIN actual (o tu contraseña, si aún no tienes uno)</span>
        <q-input
          v-model="form.actual"
          dense
          outlined
          :type="verActual ? 'text' : 'password'"
          autocomplete="off"
          lazy-rules
          hide-bottom-space
          :rules="actualRules"
        >
          <template #append>
            <q-icon
              :name="verActual ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              size="19px"
              @click="verActual = !verActual"
            />
          </template>
        </q-input>
      </label>
      <label class="form-grid__field form-grid__field--full">
        <span class="field-label">PIN nuevo</span>
        <q-input
          v-model="form.pinNuevo"
          dense
          outlined
          maxlength="4"
          inputmode="numeric"
          autocomplete="off"
          placeholder="4 dígitos"
          lazy-rules
          hide-bottom-space
          :rules="pinRules"
        />
      </label>
      <label class="form-grid__field form-grid__field--full">
        <span class="field-label">Confirmar PIN nuevo</span>
        <q-input
          v-model="form.confirmarPinNuevo"
          dense
          outlined
          maxlength="4"
          inputmode="numeric"
          autocomplete="off"
          lazy-rules
          hide-bottom-space
          :rules="confirmarRules"
        />
      </label>
    </q-form>
  </BaseDialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Notify, type QForm } from 'quasar'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { userService } from '@/services/userService'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'

const show = defineModel<boolean>({ required: true })

const formRef = ref<QForm | null>(null)
const guardando = ref(false)
const verActual = ref(false)

const form = reactive({
  actual: '',
  pinNuevo: '',
  confirmarPinNuevo: '',
})

function resetForm(): void {
  form.actual = ''
  form.pinNuevo = ''
  form.confirmarPinNuevo = ''
  verActual.value = false
}

watch(show, (abierto) => {
  if (abierto) resetForm()
})

const actualRules = [(v: string) => !!v || 'Ingresa tu PIN actual o tu contraseña']
const pinRules = [
  (v: string) => !!v || 'El PIN nuevo es requerido',
  (v: string) => /^\d{4}$/.test(v) || 'El PIN debe tener 4 dígitos',
]
const confirmarRules = [(v: string) => v === form.pinNuevo || 'Los PIN no coinciden']

async function guardar(): Promise<void> {
  const valid = await formRef.value?.validate()
  if (!valid) return
  guardando.value = true
  try {
    await userService.cambiarMiPin(form.actual, form.pinNuevo)
    Notify.create({ type: 'positive', message: 'PIN actualizado correctamente.' })
    show.value = false
  } catch (err) {
    Notify.create({ type: 'negative', message: resolveErrorMessage(err as ApiError) })
  } finally {
    guardando.value = false
  }
}
</script>
