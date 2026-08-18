<template>
  <div class="apertura-caja-card">
    <div class="apertura-header">
      <div class="apertura-icon-badge">
        <q-icon name="point_of_sale" size="28px" color="primary" />
      </div>
      <div>
        <h2 class="apertura-title">Apertura de Caja</h2>
        <p class="apertura-subtitle">
          Ingresa el fondo inicial asignado para comenzar el turno de venta.
        </p>
      </div>
    </div>

    <div class="apertura-body">
      <!-- Formulario de fondo inicial -->
      <div class="form-group q-mb-md">
        <label class="field-label">Fondo Inicial ($ MXN)</label>
        <q-input
          v-model.number="fondoInicial"
          type="text"
          inputmode="decimal"
          outlined
          dense
          prefix="$"
          placeholder="0.00"
          class="fondo-input"
          :rules="[
            (val) => (val !== null && val !== '') || 'El fondo inicial es requerido',
            (val) => Number(val) >= 0 || 'El monto debe ser mayor o igual a 0',
            reglaDecimal,
          ]"
          @keydown="filtrarTeclaDecimal"
        >
          <template #prepend>
            <q-icon name="payments" color="primary" />
          </template>
        </q-input>

        <!-- Accesos rápidos para el fondo -->
        <div class="quick-amounts-row q-mt-xs">
          <span class="quick-label">Montos sugeridos:</span>
          <div class="quick-buttons">
            <q-btn
              v-for="monto in montosSugeridos"
              :key="monto"
              flat
              dense
              no-caps
              size="sm"
              class="quick-btn"
              :class="{ 'quick-btn--active': fondoInicial === monto }"
              @click="fondoInicial = monto"
            >
              ${{ monto.toLocaleString('es-MX') }}
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Selección de Turno (Base de datos) -->
      <div class="form-group q-mb-md">
        <label class="field-label">Turno de Trabajo (BD)</label>
        <q-select
          v-model="turnoSeleccionado"
          outlined
          dense
          :options="opcionesTurnos"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          placeholder="Selecciona el turno de trabajo"
          class="turno-select"
          :loading="cargandoTurnos"
        >
          <template #prepend>
            <q-icon name="schedule" color="primary" />
          </template>
        </q-select>
      </div>

      <!-- Aviso para AdministradorSistema si no ha elegido sucursal en el selector
           global del encabezado (no se duplica el picker aquí, ver authStore.currentBranchId) -->
      <q-banner
        v-if="esAdminSistema && !sucursalSeleccionada"
        rounded
        class="bg-warning text-dark q-mb-md"
      >
        <template #avatar><q-icon name="storefront" /></template>
        Selecciona una sucursal en el menú superior antes de abrir caja.
      </q-banner>

      <!-- Selección de Terminal / Estación (Cajas BD, filtradas por sucursal) -->
      <div class="form-group q-mb-md">
        <label class="field-label">Terminal / Estación (Caja BD)</label>
        <q-select
          v-model="cajaSeleccionada"
          outlined
          dense
          :options="opcionesCajas"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          :placeholder="
            esAdminSistema && !sucursalSeleccionada
              ? 'Primero selecciona una sucursal'
              : 'Selecciona la caja o estación'
          "
          class="caja-select"
          :loading="cargandoCajas"
          :disable="esAdminSistema && !sucursalSeleccionada"
        >
          <template #prepend>
            <q-icon name="desktop_windows" color="primary" />
          </template>
        </q-select>
        <p
          v-if="
            !cargandoCajas &&
            opcionesCajas.length === 0 &&
            (!esAdminSistema || sucursalSeleccionada)
          "
          class="field-hint field-hint--warning"
        >
          No hay cajas registradas para esta sucursal todavía. Se creará una nueva automáticamente.
        </p>
      </div>

      <!-- Observaciones de apertura (opcional) -->
      <div class="form-group q-mb-md">
        <label class="field-label">Notas u Observaciones de Apertura (opcional)</label>
        <q-input
          v-model="observaciones"
          outlined
          dense
          type="textarea"
          rows="2"
          placeholder="Notas iniciales, condición física de caja, etc."
        />
      </div>

      <!-- Banner de error si existe -->
      <q-banner v-if="turno.error" rounded class="bg-negative text-white q-mb-md">
        <template #avatar><q-icon name="error" /></template>
        {{ turno.error }}
      </q-banner>

      <!-- Acciones de confirmación -->
      <div class="apertura-actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          size="lg"
          class="btn-abrir-caja"
          icon="key"
          label="Abrir Caja e Iniciar Turno"
          :loading="turno.cargando"
          :disable="!puedeAbrirCaja"
          @click="realizarApertura"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { useAuthStore } from '@/stores/auth'
import { turnoCajaService } from '@/services/turnoCajaService'
import { filtrarTeclaDecimal, reglaDecimal } from '@/utils/validacionNumerica'
import type { TurnoItem, CajaItem } from '@/types/turnoCaja'

interface OptionItem {
  label: string
  value: string
}

const $q = useQuasar()
const turno = useTurnoCajaStore()
const authStore = useAuthStore()

const fondoInicial = ref<number | null>(0)
const observaciones = ref('')

// AdministradorSistema no tiene sucursal propia en el JWT (branchId === null) y
// controla todas las sucursales: usa la que ya eligió en el selector global del
// encabezado (authStore.currentBranchId) en vez de un picker propio duplicado aquí.
const esAdminSistema = computed(() => authStore.hasRole('AdministradorSistema'))
const sucursalSeleccionada = computed(() => authStore.currentBranchId)

// Turnos dinámicos
const turnoSeleccionado = ref<string | null>(null)
const opcionesTurnos = ref<OptionItem[]>([])
const cargandoTurnos = ref(false)

// Cajas dinámicas
const cajaSeleccionada = ref<string | null>(null)
const opcionesCajas = ref<OptionItem[]>([])
const cargandoCajas = ref(false)

const montosSugeridos = [500, 1000, 1500, 2000, 3000, 5000]

// Campos obligatorios en BD (apertura_caja: fondo_inicial, caja_id) más la regla de
// negocio de que AdministradorSistema debe elegir explícitamente la sucursal.
const puedeAbrirCaja = computed(() => {
  // v-model.number sobre <q-input type="text"> deja "" (no null) cuando se borra el
  // campo, y "" < 0 es false en JS (compara como 0) — sin el chequeo de tipo, este
  // guard dejaba pasar un campo vacío. Ver mismo bug corregido en stores/turnoCaja.ts.
  if (typeof fondoInicial.value !== 'number' || !Number.isFinite(fondoInicial.value)) return false
  if (fondoInicial.value < 0) return false
  if (esAdminSistema.value && !sucursalSeleccionada.value) return false
  if (opcionesCajas.value.length > 0 && !cajaSeleccionada.value) return false
  return true
})

const emit = defineEmits<{
  (e: 'apertura-exitosa'): void
}>()

async function cargarCajas() {
  // El admin de sistema debe elegir sucursal primero; los demás usan la suya propia.
  const sucursalId = esAdminSistema.value
    ? sucursalSeleccionada.value
    : authStore.currentUser?.branchId

  if (esAdminSistema.value && !sucursalId) {
    opcionesCajas.value = []
    cajaSeleccionada.value = null
    return
  }

  cargandoCajas.value = true
  try {
    const cajasList: CajaItem[] = await turnoCajaService.obtenerCajas(sucursalId)
    opcionesCajas.value = (cajasList ?? []).map((c) => ({
      label: `${c.codigo} - ${c.nombre}`,
      value: c.codigo,
    }))
    cajaSeleccionada.value = opcionesCajas.value.length > 0 ? opcionesCajas.value[0].value : null
  } catch (err) {
    console.error('Error al consultar cajas desde la base de datos:', err)
  } finally {
    cargandoCajas.value = false
  }
}

watch(sucursalSeleccionada, cargarCajas)

onMounted(async () => {
  // 1. Petición HTTP al Backend: Obtener SOLO los turnos configurados en la BD (public.turnos)
  cargandoTurnos.value = true
  try {
    const list: TurnoItem[] = await turnoCajaService.obtenerTurnos()
    opcionesTurnos.value = (list ?? []).map((t) => ({
      label: t.horaInicio
        ? `${t.nombre} (${t.horaInicio.slice(0, 5)} - ${t.horaFin?.slice(0, 5)})`
        : t.nombre,
      value: t.id,
    }))
    if (opcionesTurnos.value.length > 0 && !turnoSeleccionado.value) {
      turnoSeleccionado.value = opcionesTurnos.value[0].value
    }
  } catch (err) {
    console.error('Error al consultar turnos desde la base de datos:', err)
  } finally {
    cargandoTurnos.value = false
  }

  // La sucursal de AdministradorSistema ya viene del selector global del
  // encabezado (authStore.currentBranchId); cargarCajas() la usa directamente.
  await cargarCajas()
})

async function realizarApertura() {
  if (
    typeof fondoInicial.value !== 'number' ||
    !Number.isFinite(fondoInicial.value) ||
    fondoInicial.value < 0
  ) {
    $q.notify({
      type: 'warning',
      message: 'Ingresa un fondo inicial válido mayor o igual a $0.00',
    })
    return
  }

  if (esAdminSistema.value && !sucursalSeleccionada.value) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona una sucursal en el menú superior antes de abrir caja.',
    })
    return
  }

  const terminalFinal = cajaSeleccionada.value || 'CAJA 01'

  await turno.abrirTurno(
    fondoInicial.value,
    terminalFinal,
    observaciones.value,
    turnoSeleccionado.value ?? undefined,
    esAdminSistema.value ? (sucursalSeleccionada.value ?? undefined) : undefined,
  )

  if (!turno.error && turno.estaOperando) {
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `Caja abierta exitosamente con $${fondoInicial.value.toLocaleString('es-MX')} de fondo inicial.`,
    })
    emit('apertura-exitosa')
  }
}
</script>

<style scoped>
.apertura-caja-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  padding: 28px;
  max-width: 620px;
  margin: 0 auto;
}

.apertura-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--bg-main);
}

.apertura-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(2, 95, 224, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #025fe0;
  flex-shrink: 0;
}

.apertura-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.apertura-subtitle {
  font-size: 13.5px;
  color: var(--text-secondary);
  margin: 0;
}

.field-hint {
  font-size: 12px;
  margin: 6px 0 0;
}
.field-hint--warning {
  color: #b45309;
}

.quick-amounts-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.quick-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.quick-btn {
  border-radius: 6px;
  font-size: 12px;
  color: #025fe0;
  background: rgba(2, 95, 224, 0.06);
}

.quick-btn--active {
  background: #025fe0;
  color: var(--bg-card);
}

.apertura-actions {
  margin-top: 24px;
}

.btn-abrir-caja {
  width: 100%;
  border-radius: 8px;
  font-weight: 600;
}
</style>
