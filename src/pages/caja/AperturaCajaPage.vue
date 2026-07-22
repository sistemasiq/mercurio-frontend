<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const turnoAsignado = ref('Turno Matutino (08:00 - 16:00)')
const cajaFisica = ref('Caja Principal 01')
const fondoInicial = ref('2,000.00')
const observaciones = ref('')

const opcionesTurno = ['Turno Matutino (08:00 - 16:00)', 'Turno Vespertino (16:00 - 00:00)']
const opcionesCaja = ['Caja Principal 01', 'Caja Principal 02']

function aperturarCaja(): void {
  router.push({ name: 'caja-activa' })
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="page-center">
      <q-card flat bordered class="main-card">
        <!-- Header -->
        <q-card-section class="q-pb-sm">
          <div class="row items-center q-gutter-md q-mb-sm">
            <div class="card-icon-block">
              <q-icon name="point_of_sale" size="24px" color="white" />
            </div>
            <div>
              <div class="card-title">Apertura de caja</div>
              <div class="card-subtitle">Inicia tu turno registrando el fondo inicial.</div>
            </div>
          </div>
          <q-separator />
        </q-card-section>

        <!-- Formulario -->
        <q-card-section>
          <div class="form-fields">
            <!-- Turno Asignado -->
            <div>
              <div class="field-label">Turno Asignado</div>
              <q-select v-model="turnoAsignado" :options="opcionesTurno" outlined dense />
              <div class="field-hint">
                Verifica que el horario coincida con
                <span class="hint-link">tu asistencia</span>.
              </div>
            </div>

            <!-- Caja Física -->
            <div>
              <div class="field-label">Caja Física</div>
              <q-select v-model="cajaFisica" :options="opcionesCaja" outlined dense />
            </div>

            <!-- Fondo Inicial -->
            <div>
              <div class="field-label">Fondo Inicial</div>
              <q-input v-model="fondoInicial" outlined dense prefix="$" input-class="text-right" />
              <div class="field-hint">Monto en efectivo recibido para cambio.</div>
            </div>

            <!-- Observaciones -->
            <div>
              <div class="field-label-optional">Observaciones (Opcional)</div>
              <q-input
                v-model="observaciones"
                outlined
                dense
                type="textarea"
                placeholder="Ej. Faltan billetes de baja denominación..."
                rows="3"
              />
            </div>

            <!-- Botón -->
            <q-btn
              label="Aperturar Caja"
              icon="lock"
              unelevated
              no-caps
              full-width
              class="apertura-btn"
              @click="aperturarCaja"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<style scoped>
.page-center {
  max-width: 600px;
  margin: 0 auto;
}

.main-card {
  border-radius: 12px;
}

.card-icon-block {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #1a237e;
  flex-shrink: 0;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.card-subtitle {
  font-size: 13px;
  color: #5c6bc0;
  margin-top: 2px;
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

.field-hint {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.hint-link {
  color: #1a237e;
  text-decoration: underline;
  cursor: pointer;
}

.apertura-btn {
  background: #1a237e !important;
  color: white !important;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 0;
}
</style>
