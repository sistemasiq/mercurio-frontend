<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notify } from 'quasar'
import type { QTableColumn } from 'quasar'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import SucursalFormDialog from '@/components/sucursales/SucursalFormDialog.vue'
import SucursalModalDesactivar from '@/components/sucursales/SucursalModalDesactivar.vue'
import { branchService } from '@/services/branchService'
import { userService } from '@/services/userService'
import { cajaAdminService } from '@/services/cajaAdminService'
import { horarioService } from '@/services/horarioService'
import { useAuthStore } from '@/stores/auth'
import { rolTono } from '@/utils/rolTono'
import { resolveErrorMessage } from '@/utils/errorHandler'
import { DIAS_SEMANA } from '@/types/horario'
import type { Branch, IndicadoresSucursal } from '@/types/branch'
import type { ApiError } from '@/types/auth'
import type { UserListItem } from '@/types/user'
import type { CajaAdmin } from '@/types/caja-admin'
import type { Horario } from '@/types/horario'
import type { Sucursal } from '@/composables/useSucursales'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const id = computed(() => {
  const param = route.params.id
  return Array.isArray(param) ? param[0] : (param ?? '')
})

const branch = ref<Branch | null>(null)
const usuarios = ref<UserListItem[]>([])
const loading = ref(false)
const busqueda = ref('')
const formAbierto = ref(false)
const desactivarAbierto = ref(false)

// ── Indicadores por sucursal (periodo) ─────────────────────────────────────
function primerDiaDelMes(): string {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`
}
function hoyIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const periodoDesde = ref(primerDiaDelMes())
const periodoHasta = ref(hoyIso())
const indicadores = ref<IndicadoresSucursal | null>(null)
const indicadoresCargando = ref(false)
const indicadoresError = ref('')
const exportando = ref(false)

async function cargarIndicadores() {
  if (!id.value) return
  indicadoresCargando.value = true
  indicadoresError.value = ''
  try {
    indicadores.value = await branchService.getIndicadores(
      id.value,
      periodoDesde.value,
      periodoHasta.value,
    )
  } catch (err) {
    indicadoresError.value = resolveErrorMessage(err as ApiError)
  } finally {
    indicadoresCargando.value = false
  }
}

async function exportarIndicadores() {
  if (!id.value) return
  exportando.value = true
  try {
    await branchService.exportarIndicadores(id.value, periodoDesde.value, periodoHasta.value)
  } catch {
    Notify.create({ type: 'negative', message: 'Error al exportar los indicadores.' })
  } finally {
    exportando.value = false
  }
}

async function cargar() {
  loading.value = true
  try {
    const [b, users] = await Promise.allSettled([
      branchService.getBranch(id.value),
      userService.listUsers(),
    ])
    if (b.status === 'rejected') {
      router.push({ name: 'sucursales-listar' })
      return
    }
    branch.value = b.value
    usuarios.value =
      users.status === 'fulfilled' ? users.value.filter((u) => u.branchId === id.value) : []
  } finally {
    loading.value = false
  }
  void cargarIndicadores()
}

onMounted(cargar)

const usuariosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return usuarios.value
  return usuarios.value.filter(
    (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  )
})
const activos = computed(() => usuarios.value.filter((u) => u.isActive).length)

const subtitulo = computed(() =>
  [branch.value?.clave, branch.value?.direccion, branch.value?.telefono]
    .filter(Boolean)
    .join(' · '),
)

const sucursalModal = computed<Sucursal | null>(() =>
  branch.value
    ? {
        id: branch.value.id,
        clave: branch.value.clave ?? '-',
        nombre: branch.value.nombre,
        ciudad: branch.value.direccion ?? '-',
        estado: '-',
        gerente: branch.value.administradorName,
        fechaCreacion: branch.value.creado ?? '',
        statusClave: branch.value.isActive ? 'activa' : 'inactiva',
      }
    : null,
)

function formatFecha(fechaIso: string | null): string {
  if (!fechaIso) return '—'
  try {
    return format(parseISO(fechaIso), "dd MMM yyyy 'a las' HH:mm", { locale: es })
  } catch {
    return fechaIso
  }
}

async function desactivar() {
  try {
    await branchService.deleteBranch(id.value)
    Notify.create({ type: 'positive', message: 'Sucursal desactivada correctamente.' })
    await cargar()
  } catch {
    Notify.create({ type: 'negative', message: 'Error al desactivar la sucursal.' })
  }
}

async function reactivar() {
  try {
    await branchService.restoreBranch(id.value)
    Notify.create({ type: 'positive', message: 'Sucursal reactivada correctamente.' })
    await cargar()
  } catch {
    Notify.create({ type: 'negative', message: 'Error al reactivar la sucursal.' })
  }
}

const columns: QTableColumn[] = [
  { name: 'name', label: 'Usuario', field: 'name', align: 'left', sortable: true },
  { name: 'role', label: 'Rol', field: 'role', align: 'left', sortable: true },
  { name: 'status', label: 'Estado', field: 'isActive', align: 'left' },
]

// ── Pestañas Cajas y Horarios (C2) ──────────────────────────────────────────
// Los endpoints /cajas y /horarios filtran por la sucursal del usuario
// autenticado (vía token), no por un parámetro `sucursal_id`: reflejan la
// sucursal de la sesión, que coincide con esta vista cuando el admin ve su
// propia sucursal.
const tab = ref<'resumen' | 'cajas' | 'horarios'>('resumen')

const cajas = ref<CajaAdmin[]>([])
const cajasCargando = ref(false)
const cajasError = ref('')
let cajasCargadas = false

async function cargarCajas() {
  if (cajasCargadas) return
  cajasCargando.value = true
  cajasError.value = ''
  try {
    cajas.value = await cajaAdminService.listCajas()
    cajasCargadas = true
  } catch (err) {
    cajasError.value = resolveErrorMessage(err as ApiError)
  } finally {
    cajasCargando.value = false
  }
}

const horarios = ref<Horario[]>([])
const horariosCargando = ref(false)
const horariosError = ref('')
let horariosCargados = false

async function cargarHorarios() {
  if (horariosCargados) return
  horariosCargando.value = true
  horariosError.value = ''
  try {
    horarios.value = await horarioService.listHorarios()
    horariosCargados = true
  } catch (err) {
    horariosError.value = resolveErrorMessage(err as ApiError)
  } finally {
    horariosCargando.value = false
  }
}

function alCambiarTab(nombre: string | number) {
  if (nombre === 'cajas') void cargarCajas()
  if (nombre === 'horarios') void cargarHorarios()
}

function diasLabel(dias: number[] | null): string {
  if (!dias || !dias.length) return 'Todos los días'
  return dias
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DIAS_SEMANA.find((ds) => ds.value === d)?.label ?? d)
    .join(', ')
}

const cajasColumns: QTableColumn[] = [
  { name: 'nombre', label: 'Caja', field: 'nombre', align: 'left', sortable: true },
  { name: 'numero', label: 'Número', field: 'numero', align: 'left' },
  { name: 'turno', label: 'Turno', field: 'turnoActual', align: 'left' },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left' },
]

const horariosColumns: QTableColumn[] = [
  { name: 'nombre', label: 'Horario', field: 'nombre', align: 'left', sortable: true },
  { name: 'rango', label: 'Horario', field: 'horaInicio', align: 'left' },
  { name: 'dias', label: 'Días', field: 'dias', align: 'left' },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left' },
]
</script>

<template>
  <q-page class="page-content list-page">
    <PageHeader
      :title="branch?.nombre ?? 'Sucursal'"
      :subtitle="subtitulo"
      back-label="Sucursales"
      :back-to="{ name: 'sucursales-listar' }"
    >
      <template v-if="branch" #actions>
        <template v-if="auth.hasPermission('sucursales:editar')">
          <q-btn
            v-if="branch.isActive"
            outline
            icon="block"
            label="Desactivar"
            @click="desactivarAbierto = true"
          />
          <q-btn v-else outline icon="restart_alt" label="Reactivar" @click="reactivar" />
        </template>
        <q-btn
          v-if="auth.hasPermission('sucursales:editar')"
          unelevated
          color="primary"
          icon="edit"
          label="Editar"
          @click="formAbierto = true"
        />
      </template>
    </PageHeader>

    <div v-if="loading && !branch" class="state-card">
      <StateBlock variant="loading" />
    </div>

    <template v-else-if="branch">
      <q-tabs
        v-model="tab"
        class="detail-tabs"
        dense
        align="left"
        active-color="primary"
        indicator-color="primary"
        @update:model-value="alCambiarTab"
      >
        <q-tab name="resumen" label="Resumen" />
        <q-tab name="cajas" label="Cajas" />
        <q-tab name="horarios" label="Horarios" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated class="detail-panels">
        <q-tab-panel name="resumen" class="detail-panel">
          <div class="kpi-row">
            <KpiCard
              label="Estado"
              :value="branch.isActive ? 'Activa' : 'Inactiva'"
              :value-color="branch.isActive ? 'var(--tone-ok-fg)' : 'var(--text-secondary)'"
            />
            <KpiCard label="Usuarios" :value="usuarios.length" :note="`${activos} activos`" />
            <KpiCard
              label="Administrador"
              :value="branch.administradorName ?? 'Sin asignar'"
              :note="branch.correo ?? ''"
            />
            <KpiCard
              label="Horario"
              :value="`${branch.horaApertura.slice(0, 5)} - ${branch.horaCierre.slice(0, 5)}`"
            />
          </div>

          <div class="indicadores-card">
            <div class="indicadores-card__header">
              <h3 class="indicadores-card__title">Indicadores del periodo</h3>
              <div class="indicadores-card__periodo">
                <q-input
                  v-model="periodoDesde"
                  dense
                  outlined
                  type="date"
                  label="Desde"
                  @update:model-value="cargarIndicadores"
                />
                <q-input
                  v-model="periodoHasta"
                  dense
                  outlined
                  type="date"
                  label="Hasta"
                  @update:model-value="cargarIndicadores"
                />
                <q-btn
                  outline
                  icon="download"
                  label="Exportar"
                  :loading="exportando"
                  @click="exportarIndicadores"
                />
              </div>
            </div>
            <StateBlock v-if="indicadoresError" variant="error" :body="indicadoresError" />
            <div v-else class="kpi-row">
              <KpiCard
                label="Ventas"
                :value="
                  indicadoresCargando
                    ? '—'
                    : `$${(indicadores?.ventas ?? 0).toLocaleString('es-MX')}`
                "
              />
              <KpiCard
                label="Niños atendidos"
                :value="indicadoresCargando ? '—' : (indicadores?.ninosAtendidos ?? 0)"
              />
              <KpiCard
                label="Eventos"
                :value="indicadoresCargando ? '—' : (indicadores?.eventos ?? 0)"
              />
              <KpiCard
                label="Cajas abiertas"
                :value="indicadoresCargando ? '—' : (indicadores?.cajasAbiertas ?? 0)"
              />
            </div>
          </div>

          <DataTableCard
            v-model:search="busqueda"
            search-placeholder="Buscar usuario"
            :count="`${usuariosFiltrados.length} usuarios`"
          >
            <q-table
              :rows="usuariosFiltrados"
              :columns="columns"
              row-key="id"
              flat
              :loading="loading"
              :rows-per-page-options="[10, 25, 50]"
            >
              <template #body-cell-name="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ props.row.name }}</div>
                  <div class="cell-sub">{{ props.row.email }}</div>
                </q-td>
              </template>
              <template #body-cell-role="props">
                <q-td :props="props">
                  <StatusBadge :tone="rolTono(props.row.role)" :label="props.row.role" />
                </q-td>
              </template>
              <template #body-cell-status="props">
                <q-td :props="props">
                  <StatusBadge
                    :tone="props.row.isActive ? 'ok' : 'off'"
                    :label="props.row.isActive ? 'Activo' : 'Inactivo'"
                  />
                </q-td>
              </template>
              <template #no-data>
                <StateBlock
                  class="full-width"
                  :variant="busqueda ? 'no-results' : 'empty'"
                  :title="busqueda ? undefined : 'Sin usuarios asignados'"
                  :body="busqueda ? undefined : 'Asigna usuarios a esta sucursal desde Usuarios.'"
                />
              </template>
            </q-table>
          </DataTableCard>

          <p class="branch-meta">
            Creada {{ formatFecha(branch.creado) }}
            <template v-if="branch.creadorName"> por {{ branch.creadorName }}</template>
            <template v-if="branch.modificado && branch.modificadorName">
              · Modificada {{ formatFecha(branch.modificado) }} por {{ branch.modificadorName }}
            </template>
          </p>
        </q-tab-panel>

        <q-tab-panel name="cajas" class="detail-panel">
          <StateBlock
            v-if="cajasError"
            variant="error"
            :body="cajasError"
            action-label="Reintentar"
            @action="
              () => {
                cajasCargadas = false
                cargarCajas()
              }
            "
          />
          <DataTableCard v-else hide-search :count="`${cajas.length} cajas`">
            <q-table
              :rows="cajas"
              :columns="cajasColumns"
              row-key="id"
              flat
              :loading="cajasCargando"
              :rows-per-page-options="[10, 25, 50]"
            >
              <template #body-cell-numero="props">
                <q-td :props="props">#{{ props.row.numero }}</q-td>
              </template>
              <template #body-cell-turno="props">
                <q-td :props="props">
                  <StatusBadge
                    v-if="props.row.turnoActual"
                    tone="ok"
                    :label="`Abierta · ${props.row.turnoActual.cajero}`"
                  />
                  <span v-else class="cell-muted">Cerrada</span>
                </q-td>
              </template>
              <template #body-cell-activo="props">
                <q-td :props="props">
                  <StatusBadge
                    :tone="props.row.activo ? 'ok' : 'off'"
                    :label="props.row.activo ? 'Activa' : 'Inactiva'"
                  />
                </q-td>
              </template>
              <template #no-data>
                <StateBlock
                  class="full-width"
                  variant="empty"
                  title="Sin cajas registradas"
                  body="Crea cajas desde Administración > Cajas."
                />
              </template>
            </q-table>
          </DataTableCard>
        </q-tab-panel>

        <q-tab-panel name="horarios" class="detail-panel">
          <StateBlock
            v-if="horariosError"
            variant="error"
            :body="horariosError"
            action-label="Reintentar"
            @action="
              () => {
                horariosCargados = false
                cargarHorarios()
              }
            "
          />
          <DataTableCard v-else hide-search :count="`${horarios.length} horarios`">
            <q-table
              :rows="horarios"
              :columns="horariosColumns"
              row-key="id"
              flat
              :loading="horariosCargando"
              :rows-per-page-options="[10, 25, 50]"
            >
              <template #body-cell-rango="props">
                <q-td :props="props">
                  {{ props.row.horaInicio.slice(0, 5) }} - {{ props.row.horaFin.slice(0, 5) }}
                </q-td>
              </template>
              <template #body-cell-dias="props">
                <q-td :props="props">{{ diasLabel(props.row.dias) }}</q-td>
              </template>
              <template #body-cell-activo="props">
                <q-td :props="props">
                  <StatusBadge
                    :tone="props.row.activo ? 'ok' : 'off'"
                    :label="props.row.activo ? 'Activo' : 'Inactivo'"
                  />
                </q-td>
              </template>
              <template #no-data>
                <StateBlock
                  class="full-width"
                  variant="empty"
                  title="Sin horarios registrados"
                  body="Crea horarios desde Administración > Horarios."
                />
              </template>
            </q-table>
          </DataTableCard>
        </q-tab-panel>
      </q-tab-panels>
    </template>

    <SucursalFormDialog v-model="formAbierto" :branch-id="id" @saved="cargar" />
    <SucursalModalDesactivar
      v-model="desactivarAbierto"
      :sucursal="sucursalModal"
      @confirmar="desactivar"
    />
  </q-page>
</template>

<style scoped lang="scss">
.detail-tabs {
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.detail-panels {
  background: transparent;
}

.detail-panel {
  padding: 0;
}

.indicadores-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 16px;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-strong);
  }

  &__periodo {
    display: flex;
    gap: 8px;

    .q-field {
      width: 160px;
    }
  }
}

.state-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.branch-meta {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-secondary);
}
</style>
