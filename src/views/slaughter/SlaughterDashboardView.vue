<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { SlaughterBatchStatus } from '../../domain/models'

const store = useAppStore()

const batchStatusText: Record<SlaughterBatchStatus, string> = {
  pending_self_check: '待自检',
  self_check_passed: '自检通过',
  self_check_failed: '自检未通过',
  pending_slaughter_apply: '待提交屠宰检疫申报',
  slaughter_applied: '已申报屠宰检疫',
  ante_mortem_checking: '宰前检查中',
  ante_mortem_passed: '宰前检查通过',
  ante_mortem_failed: '宰前检查未通过',
  post_mortem_checking: '宰后检疫中',
  post_mortem_passed: '宰后检疫通过',
  post_mortem_failed: '宰后检疫未通过',
  pending_product_cert: '待出产品证',
  meat_quality_certificate_issued: '肉品品质证已出',
  product_cert_issued: '产品证已出',
  abnormal: '异常',
}

const batchStatusType: Record<SlaughterBatchStatus, 'info' | 'success' | 'warning' | 'danger' | 'primary'> = {
  pending_self_check: 'warning',
  self_check_passed: 'success',
  self_check_failed: 'danger',
  pending_slaughter_apply: 'warning',
  slaughter_applied: 'primary',
  ante_mortem_checking: 'warning',
  ante_mortem_passed: 'success',
  ante_mortem_failed: 'danger',
  post_mortem_checking: 'warning',
  post_mortem_passed: 'success',
  post_mortem_failed: 'danger',
  pending_product_cert: 'warning',
  meat_quality_certificate_issued: 'success',
  product_cert_issued: 'success',
  abnormal: 'danger',
}

const todayEntryCount = computed(() => {
  const today = new Date().toLocaleDateString('zh-CN')
  return store.data.slaughterEntryRecords.filter((item) => new Date(item.createdAt).toLocaleDateString('zh-CN') === today).length
})

const waitingSlaughterCount = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'pending_self_check').length)
const pendingSlaughterApplyCount = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'pending_slaughter_apply').length)
const pendingSelfCheckCount = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'pending_self_check').length)
const productCertCount = computed(() => store.data.productCertificates.length)
const markInventoryTotal = computed(() => store.data.quarantineMarkInventories.reduce((sum, item) => sum + item.available, 0))

const recentEntries = computed(() => store.data.slaughterEntryRecords.slice(0, 8))
const pendingSelfCheckBatches = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'pending_self_check'))
const pendingSlaughterApplyBatches = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'pending_slaughter_apply'))
</script>

<template>
  <div class="page-grid">
    <div class="topbar">
      <h1>屠宰企业工作台</h1>
      <div class="topbar-stats">
        <span>入场批次 {{ todayEntryCount }}</span>
        <span>待宰 {{ waitingSlaughterCount }}</span>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><span>今日入场批次</span><b>{{ todayEntryCount }}</b></div>
      <div class="kpi-card"><span>待宰批次</span><b>{{ waitingSlaughterCount }}</b></div>
      <div class="kpi-card"><span>待提交屠宰检疫申报</span><b>{{ pendingSlaughterApplyCount }}</b></div>
      <div class="kpi-card"><span>非瘟检测待确认</span><b>{{ pendingSelfCheckCount }}</b></div>
      <div class="kpi-card"><span>已出产品证数量</span><b>{{ productCertCount }}</b></div>
      <div class="kpi-card"><span>检疫标志库存</span><b>{{ markInventoryTotal }}</b></div>
    </div>

    <el-card class="panel-card">
      <template #header><b>最近入场记录</b></template>
      <el-table :data="recentEntries" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="entryNo" label="入场编号" min-width="140" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="vehiclePlateNo" label="运输车辆" width="120" />
        <el-table-column prop="originFarm" label="来源养殖场" min-width="140" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'entry_passed' ? 'success' : row.status === 'entry_rejected' ? 'danger' : 'warning'" size="small">
              {{ row.status === 'entry_passed' ? '入场通过' : row.status === 'entry_rejected' ? '入场驳回' : '待查验' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="入场时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.checkedAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!recentEntries.length" description="暂无入场记录" />
    </el-card>

    <div class="page-grid two-col">
      <el-card class="panel-card">
        <template #header><b>待处理自检记录</b></template>
        <div v-for="batch in pendingSelfCheckBatches" :key="batch.id" class="task-item">
          <div>
            <b>{{ batch.batchNo }}</b>
            <p>{{ batch.animalType }} {{ batch.entryQuantity }} 头</p>
          </div>
          <el-tag type="warning">{{ batchStatusText[batch.status] }}</el-tag>
        </div>
        <el-empty v-if="!pendingSelfCheckBatches.length" description="暂无待自检批次" />
      </el-card>

      <el-card class="panel-card">
        <template #header><b>待提交屠宰检疫申报</b></template>
        <div v-for="batch in pendingSlaughterApplyBatches" :key="batch.id" class="task-item">
          <div>
            <b>{{ batch.batchNo }}</b>
            <p>{{ batch.animalType }} {{ batch.waitingQuantity }} 头待宰</p>
          </div>
          <el-tag type="warning">{{ batchStatusText[batch.status] }}</el-tag>
        </div>
        <el-empty v-if="!pendingSlaughterApplyBatches.length" description="暂无待申报批次" />
      </el-card>
    </div>
  </div>
</template>
