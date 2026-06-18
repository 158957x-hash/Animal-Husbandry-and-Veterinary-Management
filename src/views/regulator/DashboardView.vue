<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { statusText } from '../../domain/stateMachine'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const kpis = computed(() => [
  { label: '产地申报', value: store.data.originApplications.length },
  { label: '动物证明', value: store.data.quarantineCertificates.length },
  { label: '运输任务', value: store.data.transportTasks.length },
  { label: '产品证明', value: store.data.productCertificates.length },
])
const latestStatus = computed(() => {
  const app = store.latestOriginApplication
  const slaughter = store.data.slaughterApplications[0]
  return slaughter?.status ?? app?.status ?? 'draft'
})
</script>

<template>
  <section class="farmer-modern-page regulator-dashboard dashboard stack">
    <section class="gov-page-header">
      <div>
        <h2>监管驾驶舱</h2>
        <p>集中查看产地申报、动物证明、运输任务和产品证明等监管链路数据。</p>
      </div>
    </section>
    <div class="gov-kpi-grid">
      <article v-for="item in kpis" :key="item.label" class="gov-kpi-card">
        <span>{{ item.label }}</span>
        <b>{{ item.value }}</b>
      </article>
    </div>
    <el-card class="gov-compact-card chain-card">
      <template #header><strong>养殖场到屠宰场完整链路</strong></template>
      <div class="chain-flow">
        <span>养殖批次</span>
        <span>产地申报</span>
        <span>动物出证</span>
        <span>运输监管</span>
        <span>入场查验</span>
        <span>屠宰申报</span>
        <span>产品出证</span>
      </div>
      <p class="chain-status">当前最新业务状态：{{ statusText[latestStatus] }}</p>
    </el-card>
    <section class="page-grid two-col">
      <el-card class="gov-compact-card">
        <template #header><strong>预警记录</strong></template>
        <div v-for="alert in store.data.alerts" :key="alert.id" class="alert-item" :class="alert.level">
          <b>{{ alert.type }}</b>
          <p>{{ alert.message }}</p>
          <small>{{ formatTime(alert.createdAt) }}</small>
        </div>
        <el-empty v-if="!store.data.alerts.length" description="暂无预警" />
      </el-card>
      <el-card class="gov-compact-card">
        <template #header><strong>操作日志</strong></template>
        <el-timeline>
          <el-timeline-item v-for="log in store.data.operationLogs" :key="log.id" :timestamp="formatTime(log.createdAt)">
            <b>{{ log.actor }}</b>
            <p>{{ log.action }}：{{ log.target }}</p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-if="!store.data.operationLogs.length" description="暂无日志" />
      </el-card>
    </section>
  </section>
</template>
