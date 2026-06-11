<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const byAnimal = computed(() => Object.entries(store.data.quarantineCertificates.reduce<Record<string, number>>((acc, item) => {
  acc[item.animalType] = (acc[item.animalType] ?? 0) + item.quantity
  return acc
}, {})))
const byDestination = computed(() => Object.entries(store.data.quarantineCertificates.reduce<Record<string, number>>((acc, item) => {
  acc[item.destination] = (acc[item.destination] ?? 0) + item.quantity
  return acc
}, {})))
</script>

<template>
  <section class="stack">
    <div class="kpi-grid">
      <article class="kpi-card"><span>出证数量</span><b>{{ store.data.quarantineCertificates.length }}</b></article>
      <article class="kpi-card"><span>调运动物数量</span><b>{{ store.data.quarantineCertificates.reduce((sum, item) => sum + item.quantity, 0) }}</b></article>
      <article class="kpi-card"><span>落地报告</span><b>{{ store.data.landingReports.length }}</b></article>
      <article class="kpi-card"><span>有效证明</span><b>{{ store.data.quarantineCertificates.filter((item) => new Date(item.validTo) > new Date()).length }}</b></article>
    </div>
    <section class="page-grid two-col">
      <el-card class="panel-card"><template #header><strong>按动物种类统计</strong></template><div v-for="[name, value] in byAnimal" :key="name" class="stat-bar"><span>{{ name }}</span><el-progress :percentage="Math.min(100, value)" /><b>{{ value }}</b></div></el-card>
      <el-card class="panel-card"><template #header><strong>按目的地统计</strong></template><div v-for="[name, value] in byDestination" :key="name" class="stat-bar"><span>{{ name }}</span><el-progress :percentage="Math.min(100, value)" status="success" /><b>{{ value }}</b></div><el-button type="success">导出统计</el-button></el-card>
    </section>
  </section>
</template>
