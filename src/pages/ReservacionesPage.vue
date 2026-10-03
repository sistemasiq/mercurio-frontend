<template>
  <q-page class="page-content list-page">
    <PageHeader title="Reservaciones" subtitle="Todas las reservaciones de la sucursal.">
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nueva Reservación"
          @click="irANuevaReservacion"
        />
      </template>
    </PageHeader>

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      search-placeholder="Buscar folio, cliente o festejado"
      :filters="FILTROS"
      :count="`${reservacionesFiltradas.length} reservaciones`"
    >
      <q-table
        :rows="reservacionesFiltradas"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-folio="props">
          <q-td :props="props" class="cell-muted">
            {{ props.row.folio ?? props.row.id.slice(0, 8) }}
          </q-td>
        </template>
        <template #body-cell-cliente="props">
          <q-td :props="props">
            <span class="text-weight-bold">
              {{ props.row.nombre_cliente }} {{ props.row.apellidos_cliente ?? '' }}
            </span>
            <span v-if="props.row.nombre_festejado" class="cell-sub">
              {{ props.row.nombre_festejado
              }}<template v-if="props.row.edad_festejado">
                · cumple {{ props.row.edad_festejado }}</template
              >
            </span>
          </q-td>
        </template>
        <template #body-cell-fecha_evento="props">
          <q-td :props="props">
            <span class="text-weight-bold">{{ etiquetaFecha(props.row.fecha_evento) }}</span>
            <span class="cell-sub">
              {{ props.row.hora_inicio.slice(0, 5) }} – {{ props.row.hora_fin.slice(0, 5) }}
            </span>
          </q-td>
        </template>
        <template #body-cell-paquete="props">
          <q-td :props="props">{{ nombrePaquete(props.row.paquete_id) }}</q-td>
        </template>
        <template #body-cell-precio_total="props">
          <q-td :props="props" class="text-weight-bold">
            {{ formatMXN(Number(props.row.precio_total)) }}
          </q-td>
        </template>
        <template #body-cell-saldo_pendiente="props">
          <q-td
            :props="props"
            class="text-weight-bold"
            :class="{ 'saldo--due': Number(props.row.saldo_pendiente) > 0 }"
          >
            {{ formatMXN(Number(props.row.saldo_pendiente)) }}
          </q-td>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <StatusBadge
              :tone="estadoTonoReservacion(props.row.estado)"
              :label="estadoLabelReservacion(props.row.estado)"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" auto-width>
            <div class="acciones-fila">
              <!-- Agregar horas y personalizar solo tienen sentido mientras el
                   evento se pueda modificar: pasado el plazo de liquidación la
                   reservación se cancela sola si sigue debiendo. -->
              <q-btn
                flat
                round
                dense
                icon="more_time"
                class="action-btn"
                :disable="!esEditable(props.row)"
                aria-label="Agregar horas"
                @click="abrirAgregarHoras(props.row)"
              >
                <q-tooltip>{{ motivoBloqueo(props.row) || 'Agregar horas al evento' }}</q-tooltip>
              </q-btn>

              <q-btn
                flat
                round
                dense
                icon="tune"
                class="action-btn"
                :disable="!esEditable(props.row)"
                aria-label="Personalizar"
                @click="abrirPersonalizar(props.row)"
              >
                <q-tooltip>{{ motivoBloqueo(props.row) || 'Personalizar el evento' }}</q-tooltip>
              </q-btn>

              <q-btn
                unelevated
                dense
                no-caps
                size="sm"
                color="primary"
                icon="point_of_sale"
                label="Cobrar"
                class="btn-cerrar"
                @click="
                  router.push({
                    name: 'eventos-reservaciones-cierre',
                    params: { id: props.row.id },
                  })
                "
              >
                <q-tooltip>Cerrar evento y cobrar el saldo</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="busqueda || filtro !== 'todas' ? 'no-results' : 'empty'"
            :title="busqueda || filtro !== 'todas' ? undefined : 'No hay reservaciones registradas'"
            :body="busqueda || filtro !== 'todas' ? undefined : 'Crea la primera reservación.'"
          />
        </template>
      </q-table>
    </DataTableCard>

    <!-- ── Agregar horas ──────────────────────────────────────────────────── -->
    <BaseDialog
      v-model="dialogHoras"
      title="Agregar horas al evento"
      :subtitle="seleccionada?.nombre_cliente"
      icon="more_time"
      :width="460"
      persistent
      :primary-label="(desgloseHoras?.ajuste ?? 0) < 0 ? 'Quitar horas' : 'Agregar horas'"
      :loading="guardando"
      :primary-disabled="!horasExtra || desgloseHoras?.anticipoExcede"
      @confirm="confirmarAgregarHoras"
    >
      <div class="dlg-stack">
        <div>
          <div class="field-label">Horas adicionales</div>
          <q-input
            v-model.number="horasExtra"
            dense
            outlined
            type="number"
            :min="minHorasExtra"
            max="12"
            hint="Usa un número negativo para quitar horas."
          />

          <div v-if="desgloseHoras" class="preview-box q-mt-md">
            <div class="preview-box__titulo">Duración</div>
            <div class="preview-box__fila">
              <span>Horas del evento</span>
              <span class="preview-box__valor">{{ desgloseHoras.horasAntes }} h</span>
            </div>
            <div class="preview-box__fila">
              <span>{{
                desgloseHoras.ajuste < 0 ? 'Horas que se quitan' : 'Horas que se agregan'
              }}</span>
              <span
                class="preview-box__valor"
                :class="desgloseHoras.ajuste < 0 ? 'valor--resta' : 'valor--suma'"
              >
                {{ desgloseHoras.ajuste > 0 ? '+' : '' }}{{ desgloseHoras.ajuste }} h
              </span>
            </div>
            <div class="preview-box__fila preview-box__fila--destacada">
              <span>Duración nueva</span>
              <span class="preview-box__valor">{{ desgloseHoras.horasDespues }} h</span>
            </div>

            <div class="preview-box__titulo">Desglose del pago</div>
            <div class="preview-box__fila">
              <span>Paquete base</span>
              <span class="preview-box__valor">{{ fmt(desgloseHoras.base) }}</span>
            </div>
            <div class="preview-box__fila">
              <span>
                Pulseras
                <span class="preview-box__detalle">
                  {{ desgloseHoras.invitados }} inv. × {{ fmt(desgloseHoras.tarifaPulsera) }} ×
                  {{ desgloseHoras.horasDespues }} h
                </span>
              </span>
              <span class="preview-box__valor">
                <span class="preview-box__previo">{{ fmt(desgloseHoras.pulserasAntes) }}</span>
                → {{ fmt(desgloseHoras.pulserasDespues) }}
              </span>
            </div>
            <div v-if="desgloseHoras.precioHoras > 0" class="preview-box__fila">
              <span>Horas de salón <span class="preview-box__detalle">tarifa anterior</span></span>
              <span class="preview-box__valor">{{ fmt(desgloseHoras.precioHoras) }}</span>
            </div>
            <div v-if="desgloseHoras.productos > 0" class="preview-box__fila">
              <span>Productos</span>
              <span class="preview-box__valor">{{ fmt(desgloseHoras.productos) }}</span>
            </div>
            <div v-if="desgloseHoras.extras > 0" class="preview-box__fila">
              <span>Extras</span>
              <span class="preview-box__valor">{{ fmt(desgloseHoras.extras) }}</span>
            </div>
            <div v-if="desgloseHoras.descuento > 0" class="preview-box__fila">
              <span>Descuento</span>
              <span class="preview-box__valor valor--resta"
                >−{{ fmt(desgloseHoras.descuento) }}</span
              >
            </div>
            <div class="preview-box__fila preview-box__fila--total">
              <span>Total</span>
              <span class="preview-box__valor">
                <span class="preview-box__previo">{{ fmt(desgloseHoras.totalAntes) }}</span>
                → {{ fmt(desgloseHoras.totalDespues) }}
              </span>
            </div>
            <div class="preview-box__fila">
              <span>{{
                desgloseHoras.diferencia < 0 ? 'Se reduce en' : 'Se agrega al total'
              }}</span>
              <span
                class="preview-box__valor"
                :class="desgloseHoras.diferencia < 0 ? 'valor--resta' : 'valor--suma'"
              >
                {{ desgloseHoras.diferencia > 0 ? '+' : '' }}{{ fmt(desgloseHoras.diferencia) }}
              </span>
            </div>
            <div class="preview-box__fila">
              <span>Ya pagado</span>
              <span class="preview-box__valor">{{ fmt(desgloseHoras.pagado) }}</span>
            </div>
            <div class="preview-box__fila preview-box__fila--destacada">
              <span>Saldo pendiente</span>
              <span class="preview-box__valor">{{ fmt(desgloseHoras.saldo) }}</span>
            </div>
          </div>

          <div
            v-if="desgloseHoras?.anticipoExcede"
            class="aviso-inline aviso-inline--error q-mt-md"
          >
            <q-icon name="error_outline" size="16px" />
            <span>
              El total nuevo ({{ fmt(desgloseHoras.totalDespues) }}) queda por debajo de lo ya
              pagado ({{ fmt(desgloseHoras.pagado) }}). Habría que devolver la diferencia antes de
              quitar esas horas.
            </span>
          </div>

          <div v-if="sinTarifaPulsera" class="aviso-inline q-mt-md">
            <q-icon name="info" size="16px" />
            <span>
              Este paquete no tiene tarifa de pulsera por hora, así que agregar horas no cambia el
              precio. Defínela en el catálogo de Paquetes si debe cobrarse.
            </span>
          </div>
        </div>
      </div>
    </BaseDialog>

    <!-- ── Personalizar evento ────────────────────────────────────────────── -->
    <BaseDialog
      v-model="dialogPersonalizar"
      title="Personalizar evento"
      :subtitle="`${seleccionada?.nombre_cliente ?? ''} · ${seleccionada?.fecha_evento ?? ''}`"
      icon="tune"
      :width="460"
      persistent
      primary-label="Guardar cambios"
      :loading="guardando"
      :primary-disabled="!previewPersonalizar || previewPersonalizar.anticipoExcede"
      @confirm="confirmarPersonalizar"
    >
      <div class="dlg-stack">
        <div>
          <div class="field-label">Número de invitados</div>
          <q-input v-model.number="invitadosEdit" dense outlined type="number" min="1" />
          <div v-if="fueraDeRango" class="aviso-inline q-mt-xs">
            <q-icon name="warning" size="16px" />
            <span>
              El paquete cubre de {{ paqueteDe(seleccionada)?.min_invitados }} a
              {{ paqueteDe(seleccionada)?.max_invitados }} invitados.
            </span>
          </div>
        </div>

        <div>
          <div class="field-label">Duración (horas)</div>
          <q-input v-model.number="horasEdit" dense outlined type="number" min="1" max="12" />
        </div>

        <div v-if="previewPersonalizar" class="preview-box">
          <div class="preview-box__fila">
            <span>Pulseras</span>
            <span class="preview-box__valor">
              {{ fmt(Number(previewPersonalizar.precio_personas_extra)) }}
            </span>
          </div>
          <div class="preview-box__fila preview-box__fila--total">
            <span>Total</span>
            <span class="preview-box__valor">
              {{ fmt(previewPersonalizar.totalAnterior) }} →
              {{ fmt(Number(previewPersonalizar.precio_total)) }}
            </span>
          </div>
        </div>

        <div v-if="previewPersonalizar?.anticipoExcede" class="aviso-inline aviso-inline--error">
          <q-icon name="error_outline" size="16px" />
          <span>
            El nuevo total quedaría por debajo de los
            {{ fmt(Number(seleccionada?.anticipo ?? 0)) }} ya pagados. Reduce menos el evento o
            devuelve la diferencia antes de bajarlo.
          </span>
        </div>
      </div>
    </BaseDialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import type { QTableColumn } from 'quasar'
import { useRouter } from 'vue-router'
import { useReservacionesStore } from '@/stores/reservaciones'
import { usePaquetesStore } from '@/stores/paquetes'
import { useAuthStore } from '@/stores/auth'
import { estadoLabelReservacion, estadoTonoReservacion } from '@/utils/estadoReservacion'
import { formatMXN } from '@/utils/formatoMoneda'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip } from '@/types/ui'
import type { Reservaciones, ReservacionesUpdate } from '@/types/reservaciones'
import { useNuevaReservacion } from '@/composables/useNuevaReservacion'
import { useQuasar } from 'quasar'
import {
  dentroDePlazo,
  fechaLimiteLiquidacion,
  recalcularReservacion,
  sumarHoras,
} from '@/utils/reservacionPrecio'

const router = useRouter()
const store = useReservacionesStore()
const paquetesStore = usePaquetesStore()
const authStore = useAuthStore()
const irANuevaReservacion = useNuevaReservacion()
const $q = useQuasar()

onMounted(() => {
  if (!authStore.currentBranchId) return
  store.cargar(authStore.currentBranchId)
  // El precio por hora de la pulsera vive en el paquete, no en la reservación:
  // hace falta para recalcular al agregar horas o cambiar invitados.
  paquetesStore.cargar(authStore.currentBranchId)
})

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

const paqueteDe = (r: Reservaciones | null) =>
  r ? paquetesStore.paquetes.find((p) => p.id === r.paquete_id) : undefined

const tarifaPulsera = (r: Reservaciones | null) => paqueteDe(r)?.precio_hora_pulsera ?? '0'

/**
 * Una reservación se puede modificar mientras siga dentro del plazo de
 * liquidación y no esté cerrada. Después del plazo el evento se cancela solo si
 * debe algo, así que cambiarle el alcance ya no tiene sentido.
 */
const esEditable = (r: Reservaciones): boolean =>
  ['pendiente', 'confirmada'].includes(r.estado) && dentroDePlazo(r.fecha_evento)

/** Explica por qué está bloqueado, para que el botón gris no sea un misterio. */
const motivoBloqueo = (r: Reservaciones): string => {
  if (!['pendiente', 'confirmada'].includes(r.estado)) {
    return `No se puede modificar: la reservación está ${estadoLabelReservacion(r.estado).toLowerCase()}.`
  }
  if (!dentroDePlazo(r.fecha_evento)) {
    const limite = fechaLimiteLiquidacion(r.fecha_evento).toLocaleDateString('es-MX')
    return `Fuera de plazo: sólo se podía modificar hasta el ${limite}.`
  }
  return ''
}

// ── Diálogos de edición ──────────────────────────────────────────────────────

const seleccionada = ref<Reservaciones | null>(null)
const guardando = ref(false)

const dialogHoras = ref(false)
const horasExtra = ref(1)

const dialogPersonalizar = ref(false)
const invitadosEdit = ref(0)
const horasEdit = ref(1)

const sinTarifaPulsera = computed(() => parseFloat(tarifaPulsera(seleccionada.value)) <= 0)

const previewHoras = computed(() => {
  const r = seleccionada.value
  if (!r || !horasExtra.value) return null
  return recalcularReservacion(r, tarifaPulsera(r), {
    horas: r.horas_reservadas + horasExtra.value,
  })
})

/**
 * Desglose completo del ajuste de horas: la duración antes y después, y cómo
 * queda cada componente del precio.
 *
 * Se muestran también los conceptos que no cambian (paquete, productos, extras)
 * porque el cajero está por cobrarle al cliente: ver sólo la línea de pulseras
 * obliga a adivinar de dónde sale el total nuevo. Los que cambian —pulseras y
 * total— se presentan como "antes → después".
 */
const desgloseHoras = computed(() => {
  const r = seleccionada.value
  const nuevo = previewHoras.value
  if (!r || !nuevo) return null

  const n = (v: string) => parseFloat(v) || 0
  const totalDespues = Number(nuevo.precio_total)
  const pagado = n(r.anticipo)
  const ajuste = nuevo.horas_reservadas - r.horas_reservadas

  return {
    horasAntes: r.horas_reservadas,
    horasDespues: nuevo.horas_reservadas,
    ajuste,
    invitados: nuevo.numero_personas,
    tarifaPulsera: n(tarifaPulsera(r)),
    base: n(r.precio_base),
    precioHoras: n(r.precio_horas),
    productos: n(r.precio_productos),
    extras: n(r.precio_extras),
    descuento: n(r.descuento),
    pulserasAntes: n(r.precio_personas_extra),
    pulserasDespues: Number(nuevo.precio_personas_extra),
    totalAntes: nuevo.totalAnterior,
    totalDespues,
    diferencia: totalDespues - nuevo.totalAnterior,
    pagado,
    saldo: totalDespues - pagado,
    anticipoExcede: nuevo.anticipoExcede,
  }
})

/**
 * Horas que se pueden restar como máximo. El evento no puede quedar en menos de
 * una hora, así que el tope depende de lo que dure hoy.
 */
const minHorasExtra = computed(() => -(Math.max(1, seleccionada.value?.horas_reservadas ?? 1) - 1))

const previewPersonalizar = computed(() => {
  const r = seleccionada.value
  if (!r || invitadosEdit.value < 1 || horasEdit.value < 1) return null
  return recalcularReservacion(r, tarifaPulsera(r), {
    invitados: invitadosEdit.value,
    horas: horasEdit.value,
  })
})

const fueraDeRango = computed(() => {
  const pkg = paqueteDe(seleccionada.value)
  if (!pkg || invitadosEdit.value < 1) return false
  return invitadosEdit.value < pkg.min_invitados || invitadosEdit.value > pkg.max_invitados
})

const abrirAgregarHoras = (r: Reservaciones) => {
  seleccionada.value = r
  horasExtra.value = 1
  dialogHoras.value = true
}

const abrirPersonalizar = (r: Reservaciones) => {
  seleccionada.value = r
  invitadosEdit.value = r.numero_personas
  horasEdit.value = Math.max(1, r.horas_reservadas)
  dialogPersonalizar.value = true
}

const aplicarCambios = async (cambios: Record<string, unknown>, mensaje: string): Promise<void> => {
  const r = seleccionada.value
  if (!r) return
  guardando.value = true
  try {
    await store.actualizarReservacion(r.id, cambios as ReservacionesUpdate)
    $q.notify({ type: 'positive', message: mensaje, position: 'top-right' })
    dialogHoras.value = false
    dialogPersonalizar.value = false
    if (authStore.currentBranchId) await store.cargar(authStore.currentBranchId)
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: (err as Error).message || 'No se pudieron guardar los cambios',
      position: 'top-right',
      timeout: 6000,
    })
  } finally {
    guardando.value = false
  }
}

const confirmarAgregarHoras = async () => {
  const r = seleccionada.value
  const nuevo = previewHoras.value
  // `anticipoExcede` importa desde que se pueden quitar horas: bajar el total
  // por debajo de lo ya pagado lo rechaza la BD (chk_reservaciones_anticipo).
  if (!r || !nuevo || nuevo.anticipoExcede) return
  const quitadas = horasExtra.value < 0
  await aplicarCambios(
    {
      horas_reservadas: nuevo.horas_reservadas,
      // Se ajusta el horario para que la agenda refleje la duración real.
      hora_fin: sumarHoras(r.hora_fin, horasExtra.value),
      precio_personas_extra: nuevo.precio_personas_extra,
      precio_total: nuevo.precio_total,
    },
    quitadas
      ? `Se quitaron ${Math.abs(horasExtra.value)} hora(s) del evento`
      : `Se agregaron ${horasExtra.value} hora(s) al evento`,
  )
}

const confirmarPersonalizar = async () => {
  const r = seleccionada.value
  const nuevo = previewPersonalizar.value
  if (!r || !nuevo || nuevo.anticipoExcede) return
  const horasDelta = nuevo.horas_reservadas - r.horas_reservadas
  await aplicarCambios(
    {
      numero_personas: nuevo.numero_personas,
      horas_reservadas: nuevo.horas_reservadas,
      ...(horasDelta !== 0 ? { hora_fin: sumarHoras(r.hora_fin, horasDelta) } : {}),
      precio_personas_extra: nuevo.precio_personas_extra,
      precio_total: nuevo.precio_total,
    },
    'Reservación actualizada',
  )
}

type Filtro = 'proximas' | 'pendientes' | 'confirmadas' | 'cerradas' | 'canceladas' | 'todas'
const FILTROS: FilterChip<Filtro>[] = [
  { label: 'Próximas', value: 'proximas' },
  { label: 'Pendientes de pago', value: 'pendientes' },
  { label: 'Confirmadas', value: 'confirmadas' },
  { label: 'Cerradas', value: 'cerradas' },
  { label: 'Canceladas', value: 'canceladas' },
  { label: 'Todas', value: 'todas' },
]
const filtro = ref<Filtro | null>('proximas')
const busqueda = ref('')

const hoyISO = new Date().toLocaleDateString('en-CA')

function cumpleFiltro(r: Reservaciones): boolean {
  switch (filtro.value) {
    case 'proximas':
      return r.fecha_evento.slice(0, 10) >= hoyISO && r.estado !== 'cancelada'
    case 'pendientes':
      return Number(r.saldo_pendiente) > 0 && r.estado !== 'cancelada'
    case 'confirmadas':
      return r.estado === 'confirmada'
    case 'cerradas':
      return r.estado === 'completada'
    case 'canceladas':
      return r.estado === 'cancelada'
    default:
      return true
  }
}

const reservacionesFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return store.reservaciones
    .filter(cumpleFiltro)
    .filter(
      (r) =>
        !q ||
        `${r.folio ?? ''} ${r.nombre_cliente} ${r.apellidos_cliente ?? ''} ${r.nombre_festejado ?? ''}`
          .toLowerCase()
          .includes(q),
    )
    .sort((a, b) =>
      `${a.fecha_evento}${a.hora_inicio}`.localeCompare(`${b.fecha_evento}${b.hora_inicio}`),
    )
})

function nombrePaquete(id: string): string {
  return paquetesStore.paquetes.find((p) => p.id === id)?.nombre ?? '—'
}

function etiquetaFecha(fecha: string): string {
  const [y, m, d] = fecha.slice(0, 10).split('-').map(Number)
  const dia = new Date(y!, m! - 1, d)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diff = Math.round((dia.getTime() - hoy.getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  const texto = dia.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1).replace('.', '')
}

const columns: QTableColumn[] = [
  { name: 'folio', label: 'Folio', field: 'folio', align: 'left', sortable: true },
  {
    name: 'cliente',
    label: 'Cliente / festejado',
    field: 'nombre_cliente',
    align: 'left',
    sortable: true,
  },
  { name: 'fecha_evento', label: 'Fecha', field: 'fecha_evento', align: 'left', sortable: true },
  { name: 'paquete', label: 'Paquete', field: 'paquete_id', align: 'left' },
  { name: 'precio_total', label: 'Total', field: 'precio_total', align: 'right' },
  { name: 'saldo_pendiente', label: 'Saldo', field: 'saldo_pendiente', align: 'right' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]
</script>

<style scoped lang="scss">
.saldo--due {
  color: var(--tone-bad-fg);
}

.acciones-fila {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

/* Antes era un botón plano con icono y texto que se apilaban en dos renglones y
   estiraban la fila. Compacto y sólido, la acción principal se distingue de las
   dos secundarias sin dominar la tabla. */
.btn-cerrar {
  border-radius: 8px;
  font-weight: 600;
  padding: 2px 10px;
  margin-left: 4px;
}

.preview-box {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  font-size: 0.85rem;
}

.preview-box__fila {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 7px 12px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.preview-box__fila:last-child {
  border-bottom: none;
}

.preview-box__fila--total {
  background: var(--bg-main);
  font-weight: 700;
  color: var(--text-primary);
}

/* Cierra cada bloque (duración, pago) sin el peso visual de la fila de total. */
.preview-box__fila--destacada {
  font-weight: 600;
  color: var(--text-primary);
}

/* Encabezado de cada bloque del desglose. */
.preview-box__titulo {
  padding: 6px 12px;
  background: var(--bg-main);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

/* Cómo se compone el importe (invitados × tarifa × horas). */
.preview-box__detalle {
  display: block;
  font-size: 0.72rem;
  color: var(--text-secondary);
  opacity: 0.75;
}

/* El importe que se reemplaza, para que el cambio se lea de un vistazo. */
.preview-box__previo {
  text-decoration: line-through;
  font-weight: 500;
  opacity: 0.55;
}

.preview-box__valor {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: var(--text-primary);
  text-align: right;
  white-space: nowrap;
}

.valor--suma {
  color: var(--tone-ok-fg);
}

.valor--resta {
  color: var(--tone-bad-fg);
}

.aviso-inline {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.78rem;
  line-height: 1.35;
  color: var(--tone-warn-fg);
}

.aviso-inline--error {
  color: var(--tone-bad-fg);
}
</style>
