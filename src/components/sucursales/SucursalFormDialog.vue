<template>
  <BaseDialog
    v-model="show"
    :title="branchId ? 'Editar sucursal' : 'Nueva sucursal'"
    :subtitle="
      branchId
        ? form.nombre || 'Datos generales de la ubicación.'
        : 'Datos generales de la ubicación.'
    "
    icon="store"
    :width="640"
    persistent
    :primary-label="branchId ? 'Guardar cambios' : 'Crear sucursal'"
    :loading="guardando"
    :primary-disabled="cargando || (!!branchId && !hayCambios)"
    @confirm="guardar"
  >
    <div v-if="cargando" class="row justify-center q-py-xl">
      <q-spinner-dots color="primary" size="36px" />
    </div>
    <q-form v-else ref="formRef" greedy class="form-grid" @submit.prevent="guardar">
      <span class="form-grid__section">General</span>
      <label class="form-grid__field">
        <span class="field-label">Clave</span>
        <q-input
          v-model="form.clave"
          dense
          outlined
          placeholder="Ej. SUC-LP-01"
          lazy-rules
          hide-bottom-space
          :rules="[(v: string) => !!v?.trim() || 'La clave es requerida']"
        />
      </label>
      <label class="form-grid__field">
        <span class="field-label">Nombre</span>
        <q-input
          v-model="form.nombre"
          dense
          outlined
          autofocus
          placeholder="Ej. Plaza Andares"
          lazy-rules
          hide-bottom-space
          :rules="[(v: string) => !!v?.trim() || 'El nombre es requerido']"
        />
      </label>
      <label class="form-grid__field">
        <span class="field-label">Teléfono</span>
        <q-input
          v-model="form.telefono"
          dense
          outlined
          mask="+52 ### ### ####"
          placeholder="+52 000 000 0000"
          lazy-rules
          hide-bottom-space
          :rules="[(v: string) => !!v?.trim() || 'El teléfono es requerido']"
        />
      </label>
      <label class="form-grid__field">
        <span class="field-label">Email</span>
        <q-input
          v-model="form.correo"
          dense
          outlined
          type="email"
          placeholder="sucursal@woowkids.mx"
        />
      </label>

      <span class="form-grid__section">Dirección</span>
      <label class="form-grid__field form-grid__field--full">
        <span class="field-label">Dirección completa</span>
        <q-input
          v-model="form.direccion"
          dense
          outlined
          type="textarea"
          rows="2"
          placeholder="Calle, número, colonia"
        />
      </label>
      <label class="form-grid__field">
        <span class="field-label">Ciudad</span>
        <q-input v-model="form.ciudad" dense outlined placeholder="Ej. Guadalajara" />
      </label>
      <label class="form-grid__field">
        <span class="field-label">Estado</span>
        <q-input v-model="form.estado" dense outlined placeholder="Ej. Jalisco" />
      </label>
      <label class="form-grid__field">
        <span class="field-label">Código postal</span>
        <q-input v-model="form.codigoPostal" dense outlined placeholder="Ej. 45040" />
      </label>
      <label class="form-grid__field">
        <span class="field-label">Zona horaria</span>
        <q-select
          v-model="form.zonaHoraria"
          dense
          outlined
          emit-value
          map-options
          :options="zonaHorariaOptions"
        />
      </label>

      <span class="form-grid__section">Responsable</span>
      <label class="form-grid__field form-grid__field--full">
        <span class="field-label">Administrador (opcional)</span>
        <q-select
          v-model="administrador"
          dense
          outlined
          use-input
          clearable
          input-debounce="0"
          option-value="id"
          option-label="label"
          :placeholder="administrador ? undefined : 'Buscar por nombre'"
          :options="adminOptions"
          :loading="adminLoading"
          @filter="filtrarAdmins"
        >
          <template #no-option>
            <q-item><q-item-section class="cell-muted">Sin administradores</q-item-section></q-item>
          </template>
        </q-select>
      </label>
    </q-form>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Notify, type QForm } from 'quasar'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { branchService } from '@/services/branchService'
import { userService } from '@/services/userService'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'

interface AdminOption {
  id: string
  label: string
}

const props = defineProps<{ branchId: string | null }>()
const emit = defineEmits<{ (e: 'saved'): void }>()
const show = defineModel<boolean>({ required: true })

const formRef = ref<QForm | null>(null)
const cargando = ref(false)
const guardando = ref(false)
const form = reactive({
  clave: '',
  nombre: '',
  telefono: '',
  correo: '',
  direccion: '',
  ciudad: '',
  estado: '',
  codigoPostal: '',
  zonaHoraria: 'America/Mexico_City',
})

const zonaHorariaOptions = [
  { label: 'Ciudad de México (centro)', value: 'America/Mexico_City' },
  { label: 'Tijuana (noroeste)', value: 'America/Tijuana' },
  { label: 'Hermosillo (Pacífico, sin horario de verano)', value: 'America/Hermosillo' },
  { label: 'Chihuahua (Pacífico)', value: 'America/Chihuahua' },
  { label: 'Cancún (sureste)', value: 'America/Cancun' },
]
const administrador = ref<AdminOption | null>(null)
const original = ref('')

const adminOptionsAll = ref<AdminOption[]>([])
const adminOptions = ref<AdminOption[]>([])
const adminLoading = ref(false)

const snapshot = () => JSON.stringify({ ...form, admin: administrador.value?.id ?? null })
const hayCambios = computed(() => snapshot() !== original.value)

// Se observa también branchId (cambia en el mismo tick que se abre) y se
// ejecuta al montar, porque los accesos directos abren el diálogo de inicio.
watch(
  () => [show.value, props.branchId] as const,
  ([abierto]) => {
    if (abierto) void cargar()
  },
  { immediate: true },
)

async function cargar() {
  Object.assign(form, {
    clave: '',
    nombre: '',
    telefono: '',
    correo: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    zonaHoraria: 'America/Mexico_City',
  })
  administrador.value = null
  cargando.value = !!props.branchId
  adminLoading.value = true

  const [branch, users] = await Promise.allSettled([
    props.branchId ? branchService.getBranch(props.branchId) : Promise.resolve(null),
    userService.listUsers(),
  ])

  if (users.status === 'fulfilled') {
    adminOptionsAll.value = users.value
      .filter((u) => u.role === 'Administrador' && u.isActive)
      .map((u) => ({ id: u.id, label: u.name }))
  } else {
    Notify.create({ type: 'warning', message: 'No se pudieron cargar los administradores.' })
  }
  adminOptions.value = adminOptionsAll.value
  adminLoading.value = false

  if (branch.status === 'rejected') {
    Notify.create({ type: 'negative', message: 'Error al cargar la sucursal.' })
    show.value = false
    return
  }
  if (branch.value) {
    const b = branch.value
    Object.assign(form, {
      clave: b.clave ?? '',
      nombre: b.nombre,
      telefono: b.telefono ?? '',
      correo: b.correo ?? '',
      direccion: b.direccion ?? '',
      ciudad: b.ciudad ?? '',
      estado: b.estado ?? '',
      codigoPostal: b.codigoPostal ?? '',
      zonaHoraria: b.zonaHoraria || 'America/Mexico_City',
    })
    administrador.value = adminOptionsAll.value.find((a) => a.id === b.administradorId) ?? null
  }
  original.value = snapshot()
  cargando.value = false
}

function filtrarAdmins(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase()
    adminOptions.value = needle
      ? adminOptionsAll.value.filter((o) => o.label.toLowerCase().includes(needle))
      : adminOptionsAll.value
  })
}

async function guardar() {
  const valid = await formRef.value?.validate()
  if (!valid) return
  const payload = {
    nombre: form.nombre,
    direccion: form.direccion || null,
    ciudad: form.ciudad || null,
    estado: form.estado || null,
    codigo_postal: form.codigoPostal || null,
    zona_horaria: form.zonaHoraria,
    telefono: form.telefono || null,
    correo: form.correo || null,
    clave: form.clave || null,
    administrador_id: administrador.value?.id ?? null,
  }
  guardando.value = true
  try {
    if (props.branchId) {
      await branchService.updateBranch(props.branchId, payload)
      Notify.create({ type: 'positive', message: 'Sucursal actualizada con éxito.' })
    } else {
      await branchService.createBranch(payload)
      Notify.create({ type: 'positive', message: 'Sucursal creada con éxito.' })
    }
    show.value = false
    emit('saved')
  } catch (err) {
    Notify.create({ type: 'negative', message: resolveErrorMessage(err as ApiError) })
  } finally {
    guardando.value = false
  }
}
</script>
