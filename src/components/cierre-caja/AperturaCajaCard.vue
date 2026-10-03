<template>
  <section class="apertura" aria-labelledby="apertura-title">
    <header class="apertura__head">
      <span class="apertura__icon"><q-icon name="lock_open" size="22px" /></span>
      <div class="apertura__titles">
        <h2 id="apertura-title" class="apertura__title">Apertura de caja</h2>
        <span class="apertura__subtitle">{{ cajeroNombre }} · {{ fechaHoy }}</span>
      </div>
    </header>

    <div class="apertura__body">
      <div class="apertura__field">
        <span class="field-label">Cajero</span>
        <q-input :model-value="cajeroNombre" outlined dense readonly />
      </div>

      <div class="apertura__field">
        <span class="field-label">Fondo inicial en efectivo</span>
        <q-input
          v-model.number="fondoInicial"
          type="text"
          inputmode="decimal"
          outlined
          dense
          prefix="$"
          placeholder="0.00"
          :rules="[
            (val) => (val !== null && val !== '') || 'El fondo inicial es requerido',
            (val) => Number(val) >= 0 || 'El monto debe ser mayor o igual a 0',
            reglaDecimal,
          ]"
          hide-bottom-space
          @keydown="filtrarTeclaDecimal"
        />
        <div class="apertura__quick">
          <button
            v-for="monto in montosSugeridos"
            :key="monto"
            type="button"
            class="apertura__chip"
            :class="{ 'apertura__chip--on': fondoInicial === monto }"
            @click="fondoInicial = monto"
          >
            ${{ monto.toLocaleString('es-MX') }}
          </button>
        </div>
      </div>

      <div class="apertura__row">
        <div class="apertura__field">
          <span class="field-label">Turno de trabajo</span>
          <q-select
            v-model="turnoSeleccionado"
            outlined
            dense
            :options="opcionesTurnos"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            placeholder="Selecciona el turno"
            :loading="cargandoTurnos"
          />
        </div>
        <div class="apertura__field">
          <span class="field-label">Terminal / estación</span>
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
                : 'Selecciona la caja'
            "
            :loading="cargandoCajas"
            :disable="esAdminSistema && !sucursalSeleccionada"
          />
        </div>
      </div>
      <p
        v-if="
          !cargandoCajas && opcionesCajas.length === 0 && (!esAdminSistema || sucursalSeleccionada)
        "
        class="apertura__hint"
      >
        No hay cajas registradas para esta sucursal todavía. Se creará una nueva automáticamente.
      </p>

      <div class="apertura__field">
        <span class="field-label">Tu PIN de caja</span>
        <q-input
          v-model="pin"
          outlined
          dense
          :type="verPin ? 'text' : 'password'"
          autocomplete="off"
          placeholder="4 dígitos (o tu contraseña, si aún no tienes PIN)"
          hide-bottom-space
          :rules="[(v: string) => !!v || 'Ingresa tu PIN de caja']"
        >
          <template #append>
            <q-icon
              :name="verPin ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              size="19px"
              @click="verPin = !verPin"
            />
          </template>
        </q-input>
      </div>

      <div class="apertura__field">
        <span class="field-label">Notas</span>
        <q-input v-model="observaciones" outlined type="textarea" rows="2" placeholder="Opcional" />
      </div>

      <div
        v-if="esAdminSistema && !sucursalSeleccionada"
        class="apertura__callout apertura__callout--warn"
      >
        <q-icon name="storefront" size="19px" />
        Selecciona una sucursal en el menú lateral antes de abrir caja.
      </div>
      <div v-if="turno.error" class="apertura__callout apertura__callout--bad">
        <q-icon name="error" size="19px" />{{ turno.error }}
      </div>
      <div class="apertura__callout">
        <q-icon name="info" size="19px" />
        Sin caja abierta no se puede cobrar en POS, registrar niños ni recibir pagos de eventos.
      </div>
    </div>

    <footer class="apertura__foot">
      <q-btn
        unelevated
        color="primary"
        label="Abrir caja"
        class="apertura__submit"
        :loading="turno.cargando"
        :disable="!puedeAbrirCaja"
        @click="realizarApertura"
      />
    </footer>
  </section>
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
const pin = ref('')
const verPin = ref(false)

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

const cajeroNombre = computed(
  () => authStore.currentUser?.name ?? authStore.currentUser?.email ?? '—',
)
const fechaHoy = new Date().toLocaleDateString('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

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
  if (!pin.value) return false
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

  if (!pin.value) {
    $q.notify({
      type: 'warning',
      message: 'Ingresa tu PIN de caja para abrir el turno.',
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
    pin.value,
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

<style scoped lang="scss">
.apertura {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;

  &__head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 22px 24px 18px;
    border-bottom: 1px solid var(--border-soft);
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--tone-ok-bg);
    color: var(--tone-ok-fg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__subtitle {
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__quick {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  &__chip {
    height: 30px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid var(--border-input);
    background: #fff;
    color: var(--text-body);
    font: inherit;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;

    &--on {
      background: var(--tone-info-bg);
      border-color: var(--q-primary);
      color: var(--q-primary);
    }
  }

  &__hint {
    margin: -8px 0 0;
    font-size: 12px;
    color: var(--tone-warn-fg);
  }

  &__callout {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tone-info-bg);
    color: var(--tone-info-fg);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;

    &--warn {
      background: var(--tone-warn-bg);
      color: var(--tone-warn-fg);
    }

    &--bad {
      background: var(--tone-bad-bg);
      color: var(--tone-bad-fg);
    }
  }

  &__foot {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid var(--border-soft);
    background: var(--bg-subtle);
  }

  &__submit {
    min-height: 42px;
    padding: 0 18px;
    font-weight: 800;
  }
}
</style>
