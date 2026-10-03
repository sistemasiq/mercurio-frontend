<template>
  <q-page class="page-content list-page">
    <PageHeader title="Reporte de Lealtad" subtitle="Uso del programa de puntos en la sucursal.">
      <template #actions>
        <div class="periodo">
          <q-input
            v-model="desde"
            dense
            outlined
            type="date"
            label="Desde"
            class="periodo__input"
          />
          <q-input
            v-model="hasta"
            dense
            outlined
            type="date"
            label="Hasta"
            class="periodo__input"
          />
          <q-btn unelevated color="primary" label="Filtrar" @click="cargar" />
          <q-btn
            outline
            color="primary"
            icon="download"
            label="Exportar"
            :loading="exportando"
            :disable="!authStore.currentBranchId"
            @click="exportar"
          />
        </div>
      </template>
    </PageHeader>

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <div v-if="store.error" class="state-card">
      <StateBlock variant="error" :body="store.error" action-label="Reintentar" @action="cargar" />
    </div>

    <div v-else class="kpi-row">
      <KpiCard
        label="Clientes con saldo"
        icon="groups"
        :value="fmt(store.reporte?.clientes_con_saldo)"
      />
      <KpiCard label="Puntos otorgados" icon="redeem" :value="fmt(store.reporte?.total_otorgado)" />
      <KpiCard
        label="Puntos redimidos"
        icon="shopping_bag"
        :value="fmt(store.reporte?.total_redimido)"
      />
      <KpiCard
        label="Puntos caducados"
        icon="event_busy"
        :value="fmt(store.reporte?.total_caducado)"
      />
      <KpiCard
        label="Saldo vigente total"
        icon="account_balance_wallet"
        :value="fmt(store.reporte?.saldo_vigente)"
        note="pasivo del programa"
        note-tone="warn"
      />
    </div>

    <section v-if="!store.error" class="state-card top-clientes">
      <h2 class="top-clientes__title">Top de clientes del periodo</h2>
      <q-table
        :rows="store.reporte?.top_clientes ?? []"
        :columns="columnasTopClientes"
        row-key="celular"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props">{{ props.row.nombre ?? 'Sin nombre' }}</q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            variant="empty"
            title="Sin datos"
            body="No hay puntos otorgados en el periodo seleccionado."
          />
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import { onMounted, ref } from 'vue'
import { Notify } from 'quasar'
import type { QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useLealtadStore } from '@/stores/lealtad'
import type { TopClienteLealtad } from '@/types/lealtad'

const authStore = useAuthStore()
const store = useLealtadStore()

const desde = ref('')
const hasta = ref('')
const exportando = ref(false)

const cargar = () => {
  if (!authStore.currentBranchId) return
  store.cargarReporte(authStore.currentBranchId, desde.value || undefined, hasta.value || undefined)
}

onMounted(cargar)

async function exportar() {
  if (!authStore.currentBranchId) return
  exportando.value = true
  try {
    await store.exportarReporte(
      authStore.currentBranchId,
      desde.value || undefined,
      hasta.value || undefined,
    )
  } catch {
    Notify.create({ type: 'negative', message: 'Error al exportar el reporte de lealtad.' })
  } finally {
    exportando.value = false
  }
}

const fmt = (n?: number): string => (n ?? 0).toLocaleString('es-MX')

const columnasTopClientes: QTableColumn<TopClienteLealtad>[] = [
  { name: 'celular', label: 'Celular', field: 'celular', align: 'left' },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  {
    name: 'puntos_otorgados',
    label: 'Puntos otorgados',
    field: 'puntos_otorgados',
    align: 'right',
    sortable: true,
  },
]
</script>

<style scoped lang="scss">
.state-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.periodo {
  display: flex;
  align-items: center;
  gap: 8px;

  &__input {
    width: 150px;
  }
}

.top-clientes {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
    color: var(--text-strong);
  }
}
</style>
