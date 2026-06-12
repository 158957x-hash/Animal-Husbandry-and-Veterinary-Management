<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { statusText, statusType } from '../../domain/stateMachine'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const router = useRouter()

const totalStock = computed(() => store.data.farmBatches.reduce((sum, item) => sum + item.stock, 0))
const availableStock = computed(() => store.data.farmBatches.filter((item) => item.immuneQualified).reduce((sum, item) => sum + item.stock, 0))
const submittedCount = computed(() => store.data.originApplications.filter((item) => ['submitted', 'origin_reviewing'].includes(item.status)).length)
const issuedCount = computed(() => store.data.originApplications.filter((item) => ['certificate_issued', 'transporting', 'arrived'].includes(item.status)).length)
const transportingCount = computed(() => store.data.originApplications.filter((item) => item.status === 'transporting').length)
const recentApplications = computed(() => store.data.originApplications.slice(0, 6))
const farmerAlerts = computed(() => store.data.alerts.filter((item) => !item.resolved))
</script>

<template>
  <div class="page-grid">
    <el-card class="panel-card">
      <div class="card-header-line">
        <div>
          <h2>养殖场户工作台</h2>
          <p>集中查看存栏、申报、出证、运输和预警情况，及时办理待办事项。</p>
        </div>
        <div class="action-inline">
          <el-button @click="router.push('/farmer/origin-applications')">查看全部申报</el-button>
          <el-button type="success" @click="router.push('/farmer/origin-apply')">新增申报</el-button>
        </div>
      </div>
    </el-card>

    <div class="kpi-grid">
      <div class="kpi-card"><span>当前存栏</span><strong>{{ totalStock }}</strong><small>头/只</small></div>
      <div class="kpi-card"><span>可申报数量</span><strong>{{ availableStock }}</strong><small>免疫合格批次</small></div>
      <div class="kpi-card"><span>已提交申报</span><strong>{{ submittedCount }}</strong><small>待官方兽医受理</small></div>
      <div class="kpi-card"><span>待审核申报</span><strong>{{ submittedCount }}</strong><small>等待官方兽医</small></div>
      <div class="kpi-card"><span>已出证数量</span><strong>{{ issuedCount }}</strong><small>电子检疫证明</small></div>
      <div class="kpi-card"><span>运输中任务</span><strong>{{ transportingCount }}</strong><small>调运监管中</small></div>
      <div class="kpi-card"><span>预警数量</span><strong>{{ farmerAlerts.length }}</strong><small>待关注事项</small></div>
    </div>

    <el-card class="panel-card">
      <template #header><b>最近申报记录</b></template>
      <el-table :data="recentApplications" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="applicationNo" label="申报编号" min-width="160" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="destination" label="目的地" min-width="180" />
        <el-table-column label="状态" width="130"><template #default="{ row }"><el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag></template></el-table-column>
        <el-table-column label="更新时间" min-width="170"><template #default="{ row }">{{ formatTime(row.updatedAt) }}</template></el-table-column>
        <el-table-column label="操作" width="110"><template #default="{ row }"><el-button size="small" @click="router.push(`/farmer/origin-detail/${row.id}`)">查看</el-button></template></el-table-column>
      </el-table>
      <el-empty v-if="!recentApplications.length" description="暂无申报记录，请点击新增申报开始办理" />
    </el-card>
  </div>
</template>
