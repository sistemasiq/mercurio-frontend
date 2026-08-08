<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon: string
  iconColor: string
  iconBg: string
  caption?: string
  captionColor?: string
  captionIcon?: string
}>()
</script>

<template>
  <q-card flat bordered class="access-stat-card">
    <q-card-section>
      <div class="row items-center justify-between q-mb-sm">
        <span class="stat-label">{{ label }}</span>
        <div class="stat-icon-wrap" :style="{ background: iconBg }">
          <q-icon :name="icon" size="18px" :color="iconColor" />
        </div>
      </div>
      <div class="stat-value">{{ value }}</div>
      <div v-if="caption" class="row items-center q-mt-xs">
        <q-icon
          v-if="captionIcon"
          :name="captionIcon"
          size="14px"
          :color="captionColor"
          class="q-mr-xs"
        />
        <span class="stat-caption" :class="`text-${captionColor}`">{{ caption }}</span>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.access-stat-card {
  border-radius: 12px;
}

.stat-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.stat-caption {
  font-size: 12px;
}
</style>
