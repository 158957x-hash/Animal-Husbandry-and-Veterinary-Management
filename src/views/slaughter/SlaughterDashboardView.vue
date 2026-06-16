<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { SlaughterBatchStatus } from '../../domain/models'

const store = useAppStore()

const batchStatusText: Record<SlaughterBatchStatus, string> = {
  pending_slaughter_apply: '待提交屠宰检疫申报',
  draft_application: '申报草稿',
  submitted_pending_accept: '已提交待受理',
  returned_for_correction: '退回补正',
  accepted_pending_ante_mortem: '已受理/待宰前检查',
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
  emergency_slaughtering: '急宰处理中',
  death_registration: '待宰死亡登记',
  abnormal: '异常',
}

const todayEntryCount = computed(() => {
  const today = new Date().toLocaleDateString('zh-CN')
  return store.data.slaughterEntryRecords.filter((item) => new Date(item.createdAt).toLocaleDateString('zh-CN') === today).length
})

const waitingSlaughterCount = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'pending_slaughter_apply').length)
const pendingSlaughterApplyCount = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'pending_slaughter_apply').length)
const productCertCount = computed(() => store.data.productCertificates.length)
const markInventoryTotal = computed(() => store.data.quarantineMarkInventories.reduce((sum, item) => sum + item.available, 0))

const recentEntries = computed(() => store.data.slaughterEntryRecords.slice(0, 8))
const pendingSlaughterApplyBatches = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'pending_slaughter_apply'))
</script>

<template>
  <div class="gov-page">
    <el-card class="panel-card">
      <div class="page-hero">
        <div>
          <h2>屠宰企业工作台</h2>
          <p>汇总入场、待宰、自检、申报、出证和检疫标志库存，辅助企业按流程办理检疫事项。</p>
        </div>
        <div class="status-summary">
          <el-tag type="success">入场批次 {{ todayEntryCount }}</el-tag>
          <el-tag type="warning">待宰 {{ waitingSlaughterCount }}</el-tag>
        </div>
      </div>
    </el-card>

    <div class="kpi-grid">
      <div class="kpi-card"><span>今日入场批次</span><b>{{ todayEntryCount }}</b></div>
      <div class="kpi-card"><span>待宰批次</span><b>{{ waitingSlaughterCount }}</b></div>
      <div class="kpi-card"><span>待提交屠宰检疫申报</span><b>{{ pendingSlaughterApplyCount }}</b></div>
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
</template>
