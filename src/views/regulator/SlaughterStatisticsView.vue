<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const totalQualified = computed(() => store.data.postMortemChecks.reduce((sum, item) => sum + item.qualifiedQuantity, 0))
const totalUnqualified = computed(() => store.data.postMortemChecks.reduce((sum, item) => sum + item.unqualifiedQuantity, 0))
const harmlessWeight = computed(() => store.data.harmlessTasks.reduce((sum, item) => sum + (item.processedWeight ?? item.weight), 0))
const productWeight = computed(() => store.data.productCertificates.reduce((sum, item) => sum + item.weight, 0))
</script>

<template>
  <section class="stack">
    <div class="kpi-grid">
      <article class="kpi-card"><span>入场批次</span><b>{{ store.data.entryChecks.length }}</b></article>
      <article class="kpi-card"><span>检疫合格</span><b>{{ totalQualified }}</b></article>
      <article class="kpi-card"><span>检疫不合格</span><b>{{ totalUnqualified }}</b></article>
      <article class="kpi-card"><span>产品重量 kg</span><b>{{ productWeight }}</b></article>
    </div>
    <section class="page-grid two-col">
      <el-card class="panel-card"><template #header><strong>分畜种屠宰数量</strong></template><div v-for="batch in store.data.waitingSlaughterBatches" :key="batch.id" class="stat-bar"><span>{{ batch.animalType }}</span><el-progress :percentage="Math.min(100, batch.quantity)" /><b>{{ batch.quantity }}</b></div></el-card>
      <el-card class="panel-card"><template #header><strong>无害化与出证统计</strong></template><div class="info-list"><p><span>病害动物无害化重量</span><b>{{ harmlessWeight }}kg</b></p><p><span>产品检疫证明</span><b>{{ store.data.productCertificates.length }}</b></p><p><span>肉品品质合格证</span><b>{{ store.data.meatQualityCertificates.length }}</b></p><p><span>省内来源</span><b>{{ store.data.quarantineCertificates.filter((item) => item.origin.includes('安徽')).length }}</b></p></div><el-button type="success">导出屠宰统计</el-button></el-card>
    </section>
  </section>
</template>
