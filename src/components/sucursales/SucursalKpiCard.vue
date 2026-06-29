<template>
  <q-card class="kpi-card" flat bordered>
    <q-card-section class="kpi-content">
      <div class="kpi-text">
        <div class="kpi-label">{{ label }}</div>
        <div class="kpi-value">{{ value }}</div>
      </div>
      <div class="kpi-icon" :style="{ backgroundColor: iconBg }">
        <q-icon :name="icon" size="22px" :style="{ color: iconColor }" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: number
  icon: string
  iconColor: string
  iconBg: string
}>()
</script>

<style scoped lang="scss">
.kpi-card {
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.kpi-content {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.kpi-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kpi-label {
  font-size: 11px;
  color: #9e9e9e;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
}

.kpi-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  flex-shrink: 0;
}
</style>
