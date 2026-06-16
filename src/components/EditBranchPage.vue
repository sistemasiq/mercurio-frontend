<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const branchCode = computed(() => {
  const param = route.params.branchId
  return Array.isArray(param) ? param[0] : (param ?? 'SUC-LP-01')
})

const branchName = ref('Plaza Colibrí')
const branchAddress = ref('Avenida Mariano Jiménez, Plaza Colibrí, La Piedad, Michoacán, México.')
const branchPhone = ref('+52 352 123 4567')
const branchEmail = ref('plazacolibri@playground.os')

const branchAdministrator = ref('Ana Silva')

const administratorOptions = ref(['Ana Silva', 'María López', 'Carlos Gómez', 'Juan Pérez'])
</script>

<template>
  <q-page padding class="bg-grey-1 branch-edit-page">
    <div class="row items-start justify-between q-mb-lg header-wrap">
      <div class="header-copy">
        <q-breadcrumbs class="text-grey-7 q-mb-sm" active-color="dark">
          <q-breadcrumbs-el label="Inicio" />
          <q-breadcrumbs-el label="Administración" />
          <q-breadcrumbs-el label="Sucursales" />
          <q-breadcrumbs-el :label="branchName" />
          <q-breadcrumbs-el label="Editar" class="text-weight-bold" />
        </q-breadcrumbs>

        <div class="row items-center q-gutter-sm q-mb-xs">
          <h1 class="text-h4 text-weight-bold q-my-none text-dark">{{ branchName }}</h1>
          <q-badge color="positive" text-color="white" class="status-badge">
            <b>Activa</b>
          </q-badge>
        </div>

        <p class="text-subtitle2 text-grey-7 q-mt-sm q-mb-none">
          Vista general de la sucursal <strong>{{ branchCode }}</strong>
        </p>
      </div>

      <div class="row q-gutter-sm actions-wrap">
        <q-btn outline color="dark" label="Cancelar" class="btn-cancel" />
        <q-btn color="primary" icon="save" label="Guardar Cambios" class="btn-save" />
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-lg-8">
        <q-card class="q-mb-lg form-card" flat bordered>
          <q-card-section class="card-header-section">
            <div class="text-h6 text-weight-bold flex items-center">
              <q-icon name="info" size="sm" color="primary" class="q-mr-sm" />
              Información General
            </div>
          </q-card-section>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="field-label">Clave de Sucursal</div>
              <q-input
                :model-value="branchCode"
                outlined
                dense
                readonly
                class="field-input field-input--readonly"
              />
            </div>

            <div class="col-12 col-md-6">
              <div class="field-label">Nombre de la Sucursal</div>
              <q-input
                v-model="branchName"
                outlined
                dense
                class="field-input"
                placeholder="Plaza Colibrí"
              />
            </div>

            <div class="col-12">
              <div class="field-label">Dirección Completa</div>
              <q-input v-model="branchAddress" outlined dense class="field-input">
                <template #prepend>
                  <q-icon name="place" color="grey-6" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <div class="field-label">Teléfono de Contacto</div>
              <q-input v-model="branchPhone" outlined dense class="field-input">
                <template #prepend>
                  <q-icon name="phone" color="grey-6" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <div class="field-label">Correo Electrónico</div>
              <q-input v-model="branchEmail" outlined dense class="field-input">
                <template #prepend>
                  <q-icon name="mail" color="grey-6" />
                </template>
              </q-input>
            </div>
          </div>
        </q-card>

        <q-card class="form-card" flat bordered>
          <q-card-section class="card-header-section">
            <div class="text-h6 text-weight-bold flex items-center">
              <q-icon name="group" size="sm" color="primary" class="q-mr-sm" />
              Gestión y Responsabilidades
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pt-lg">
            <div class="field-label">Administrador Responsable</div>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-md-8">
                <q-select
                  v-model="branchAdministrator"
                  outlined
                  dense
                  use-input
                  input-debounce="0"
                  :options="administratorOptions"
                  class="field-input"
                  placeholder="Buscar por nombre o ID de usuario..."
                >
                  <template #prepend>
                    <q-icon name="search" color="grey-6" />
                  </template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">Sin resultados</q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-4">
                <q-btn
                  outline
                  color="primary"
                  icon="person_add"
                  label="+ Crear Nuevo Administrador"
                  class="full-width btn-new-manager"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-4">
        <q-card class="tip-card" flat>
          <q-card-section>
            <div class="flex items-center q-mb-sm">
              <q-icon name="lightbulb" color="primary" size="sm" class="q-mr-sm" />
              <span class="text-weight-bold text-primary">Tip de Administrador</span>
            </div>
            <p class="text-body2 text-grey-8 q-mb-none">
              Asegúrate de que la Clave de Sucursal siga el formato estandarizado
              <strong>(SUC-XX-00)</strong> para facilitar el filtrado en reportes globales.
            </p>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.branch-edit-page {
  color: #111827;
}

.header-wrap {
  gap: 16px;
}

.header-copy {
  min-width: 0;
}

.actions-wrap {
  flex-shrink: 0;
}

.btn-cancel,
.btn-save {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  padding: 8px 20px;
}

.form-card {
  border-radius: 12px;
  border-color: #e5e7eb;
  background: #ffffff;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}

.btn-new-manager {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  height: 40px;
}

.tip-card {
  border-radius: 12px;
  background-color: #e8f0fe;
  border: 1px solid #c5d8fb;
}

@media (max-width: 1023px) {
  .header-wrap {
    align-items: flex-start;
  }

  .actions-wrap {
    width: 100%;
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
  }
}

.status-badge {
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  padding-inline: 10px;
}
</style>
