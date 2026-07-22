<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const montoRetirar = ref('')
const concepto = ref<string | null>(null)
const personaRecibe = ref<string | null>(null)
const observaciones = ref('')

const opcionesConcepto = ['Gastos operativos', 'Compra de insumos', 'Pago a proveedor', 'Otro']
const opcionesPersona = ['Supervisor de turno', 'Administrador', 'Otro']

function volverAOperaciones(): void {
  router.push({ name: 'caja-activa' })
}
</script>

<template>
  <q-page class="q-pa-lg">
    <!-- Back link -->
    <div class="back-link q-mb-lg" @click="volverAOperaciones">
      <q-icon name="arrow_back" size="14px" />
      <span>VOLVER A OPERACIONES</span>
    </div>

    <div class="page-center">
      <q-card flat bordered class="main-card">
        <!-- Header -->
        <q-card-section class="q-pb-sm">
          <div class="row items-center q-gutter-sm q-mb-xs">
            <q-icon name="payments" size="22px" style="color: #1a237e" />
            <div class="card-title">Registrar Retiro Parcial</div>
          </div>
          <div class="card-subtitle q-mb-sm">
            Extraer fondos de la caja actual para operaciones específicas.
          </div>
          <q-separator />
        </q-card-section>

        <!-- Formulario -->
        <q-card-section>
          <div class="form-fields">
            <!-- Monto a retirar -->
            <div>
              <div class="field-label">Monto a retirar *</div>
              <q-input
                v-model="montoRetirar"
                outlined
                dense
                prefix="$"
                placeholder="0.00"
                input-class="text-right"
              />
            </div>

            <!-- Concepto y Persona en fila -->
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="field-label">Concepto / Tipo de retiro *</div>
                <q-select
                  v-model="concepto"
                  :options="opcionesConcepto"
                  :display-value="concepto ?? 'Seleccione concepto (clave)'"
                  outlined
                  dense
                />
              </div>
              <div class="col-6">
                <div class="field-label">Persona que recibe *</div>
                <q-select
                  v-model="personaRecibe"
                  :options="opcionesPersona"
                  :display-value="personaRecibe ?? 'Seleccione rol'"
                  outlined
                  dense
                />
              </div>
            </div>

            <!-- Observaciones -->
            <div>
              <div class="field-label-optional">Observaciones</div>
              <q-input
                v-model="observaciones"
                outlined
                dense
                type="textarea"
                placeholder="Detalles adicionales sobre este retiro..."
                rows="3"
              />
            </div>

            <!-- Botón -->
            <q-btn
              label="Registrar retiro"
              icon="payments"
              unelevated
              no-caps
              full-width
              class="retiro-btn"
            />

            <!-- Nota informativa -->
            <div class="info-box">
              <div class="row items-start no-wrap q-gutter-xs">
                <q-icon name="info" size="16px" class="info-icon" />
                <div class="info-text">
                  El retiro parcial afectará inmediatamente el saldo en caja. Asegúrese de
                  <span class="info-link">imprimir el ticket de comprobante</span> y recabar la
                  <span class="info-link">firma de quien recibe el efectivo</span>.
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #1a237e;
  cursor: pointer;
  user-select: none;
}

.back-link:hover {
  text-decoration: underline;
}

.page-center {
  max-width: 600px;
  margin: 0 auto;
}

.main-card {
  border-radius: 12px;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.card-subtitle {
  font-size: 13px;
  color: #5c6bc0;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #f59e0b;
  margin-bottom: 6px;
}

.field-label-optional {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.retiro-btn {
  background: #1a237e !important;
  color: white !important;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 0;
}

.info-box {
  background: #e3f2fd;
  border-radius: 8px;
  padding: 12px 14px;
}

.info-icon {
  color: #1565c0;
  margin-top: 1px;
  flex-shrink: 0;
}

.info-text {
  font-size: 12.5px;
  color: #1565c0;
  line-height: 1.5;
}

.info-link {
  text-decoration: underline;
  cursor: pointer;
}
</style>
