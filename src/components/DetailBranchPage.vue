<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type BranchContact = {
  phone: string
  email: string
  manager: string
}

type BranchInfo = {
  code: string
  name: string
  status: string
  createdBy: string
  createdAt: string
  updatedAt: string
  contact: BranchContact
  addressLines: string[]
}

const route = useRoute()
const router = useRouter()

const branchId = computed(() => {
  const param = route.params.branchId
  return Array.isArray(param) ? param[0] : (param ?? 'SUC-LP-01')
})

const branch = computed<BranchInfo>(() => ({
  code: branchId.value,
  name: 'Plaza Colibrí',
  status: 'Activa',
  createdBy: 'Sistema de Administración',
  createdAt: '12 de oct. de 2023',
  updatedAt: 'Hace 2 horas',
  contact: {
    phone: '+1 (555) 123-4567',
    email: 'downtown@metro.com',
    manager: 'María González',
  },
  addressLines: ['Avenida Mariano Jiménez', 'Plaza Colibrí', 'La Piedad, Michoacán', 'México'],
}))

const contactItems = computed(() => [
  {
    icon: 'phone',
    label: 'Teléfono Principal',
    value: branch.value.contact.phone,
  },
  {
    icon: 'mail',
    label: 'Correo Electrónico',
    value: branch.value.contact.email,
    accent: true,
  },
  {
    icon: 'person',
    label: 'Administrador',
    value: branch.value.contact.manager,
  },
])

const metadata = computed(() => [
  { label: 'Creado por', value: branch.value.createdBy },
  { label: 'Fecha de creación', value: branch.value.createdAt },
  { label: 'Última modificación', value: branch.value.updatedAt },
])

function handleEdit(): void {
  router.push({ name: 'BranchEdit', params: { branchId: branch.value.code } })
}
</script>

<template>
  <q-page padding class="bg-grey-1 branch-info-page">
    <!-- Encabezado -->
    <div class="row items-start justify-between q-mb-lg header-wrap">
      <div class="header-copy">
        <q-breadcrumbs class="text-grey-7 q-mb-sm" active-color="dark">
          <q-breadcrumbs-el label="Inicio" />
          <q-breadcrumbs-el label="Administración" />
          <q-breadcrumbs-el label="Sucursales" />
          <q-breadcrumbs-el :label="branch.name" />
          <q-breadcrumbs-el label="Informacion" class="text-weight-bold" />
        </q-breadcrumbs>

        <div class="row items-center q-gutter-sm q-mb-xs">
          <h1 class="text-h4 text-weight-bold q-my-none text-dark">{{ branch.name }}</h1>
          <q-badge color="positive" text-color="white" class="status-badge">
            {{ branch.status }}
          </q-badge>
        </div>

        <p class="text-subtitle2 text-grey-7 q-mt-sm q-mb-none">
          Vista general de la sucursal <strong>{{ branch.code }}</strong>
        </p>
      </div>

      <q-btn outline color="dark" icon="edit" label="Editar" class="btn-edit" @click="handleEdit" />
    </div>

    <!-- Contenido principal -->
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-lg-8">
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <q-card flat bordered class="info-card h-100">
              <q-card-section class="section-header">
                <div class="section-title">
                  <q-icon name="support_agent" size="18px" color="primary" class="q-mr-sm" />
                  Contacto
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section class="q-pt-lg contact-section">
                <div v-for="item in contactItems" :key="item.label" class="contact-item">
                  <q-icon :name="item.icon" size="18px" color="grey-7" class="contact-item__icon" />
                  <div class="contact-item__content">
                    <div class="contact-item__label">{{ item.label }}</div>
                    <div
                      class="contact-item__value"
                      :class="{ 'contact-item__value--accent': item.accent }"
                    >
                      {{ item.value }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card flat bordered class="info-card h-100">
              <q-card-section class="section-header">
                <div class="section-title">
                  <q-icon name="place" size="18px" color="primary" class="q-mr-sm" />
                  Ubicación
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section class="q-pt-lg location-section">
                <div v-for="line in branch.addressLines" :key="line" class="address-line">
                  {{ line }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-4">
        <q-card flat bordered class="meta-card">
          <q-card-section class="section-header section-header--compact">
            <div class="section-title section-title--compact">
              <q-icon name="history" size="18px" color="primary" class="q-mr-sm" />
              Detalles del registro
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="meta-section">
            <div v-for="item in metadata" :key="item.label" class="meta-row">
              <div class="meta-row__label">{{ item.label }}</div>
              <div class="meta-row__value">{{ item.value }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.branch-info-page {
  color: #111827;
}

.header-wrap {
  gap: 16px;
}

.header-copy {
  min-width: 0;
}

.status-badge {
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  padding-inline: 10px;
}

.btn-edit {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  padding: 8px 18px;
  flex-shrink: 0;
}

.info-card,
.meta-card {
  border-radius: 12px;
  border-color: #e5e7eb;
  background: #ffffff;
}

.section-header {
  padding: 20px 24px 16px;
}

.section-header--compact {
  padding-bottom: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.section-title--compact {
  font-size: 16px;
}

.detail-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-block {
  padding: 4px 0;
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
}

.detail-value {
  font-size: 15px;
  font-weight: 500;
  color: #111827;
}

.detail-value--strong {
  font-weight: 700;
}

.contact-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.contact-item__icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.contact-item__content {
  min-width: 0;
}

.contact-item__label {
  font-size: 12px;
  line-height: 1.2;
  color: #6b7280;
  margin-bottom: 3px;
}

.contact-item__value {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  word-break: break-word;
}

.contact-item__value--accent {
  color: #2563eb;
}

.location-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.address-line {
  font-size: 14px;
  color: #374151;
}

.meta-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.meta-row {
  display: grid;
  gap: 4px;
}

.meta-row__label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.meta-row__value {
  font-size: 14px;
  color: #374151;
}

.h-100 {
  height: 100%;
}

@media (max-width: 1023px) {
  .header-wrap {
    align-items: flex-start;
  }

  .btn-edit {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 599px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    padding-inline: 18px;
  }
}
</style>
