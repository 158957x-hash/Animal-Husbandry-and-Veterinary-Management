<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { SlaughterBatchStatus } from '../../domain/models'

const store = useAppStore()
const router = useRouter()

const batchStatusText: Record<SlaughterBatchStatus, string> = {
  pending_self_check: '待自检',
  self_check_passed: '自检通过',
  self_check_failed: '自检未通过',
  pending_slaughter_apply: '待申报',
  slaughter_applied: '已申报',
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

function getEntryNo(entryRecordId: string) {
  const entry = store.data.slaughterEntryRecords.find((e) => e.id === entryRecordId)
  return entry?.entryNo ?? '-'
}

function getCertNo(quarantineCertificateId: string) {
  const cert = store.data.quarantineCertificates.find((c) => c.id === quarantineCertificateId)
  return cert?.certificateNo ?? '-'
}

function getFarmName(entryRecordId: string) {
  const entry = store.data.slaughterEntryRecords.find((e) => e.id === entryRecordId)
  return entry?.originFarm ?? '-'
}

function getAction(status: SlaughterBatchStatus) {
  if (status === 'pending_self_check') return { label: '去自检', type: 'primary' as const, path: '/slaughter/self-check' }
  if (status === 'self_check_passed' || status === 'pending_slaughter_apply') return { label: '去申报', type: 'success' as const, path: '/slaughter/slaughter-apply' }
  if (status === 'ante_mortem_checking' || status === 'post_mortem_checking') return { label: '查看', type: 'info' as const, path: '' }
  if (status === 'product_cert_issued') return { label: '查看产品证', type: 'success' as const, path: '' }
  return null
}

function handleAction(batch: { id: string; status: SlaughterBatchStatus }) {
  const action = getAction(batch.status)
  if (action?.path) router.push(action.path)
}
</script>

<template>
  <section class="stack">
    <div class="page-header">
      <h2>待宰管理</h2>
      <p>管理入场后的待宰批次，按流程推进自检、申报、检疫等环节</p>
    </div>

    <el-card class="panel-card">
      <template #header><strong>待宰批次列表</strong></template>
      <el-table :data="store.data.slaughterBatches" stripe>
        <el-table-column prop="batchNo" label="批次编号" min-width="160" />
        <el-table-column label="入场编号" min-width="160">
          <template #default="scope">{{ getEntryNo(scope.row.entryRecordId) }}</template>
        </el-table-column>
        <el-table-column label="动物证编号" min-width="160">
          <template #default="scope">{{ getCertNo(scope.row.quarantineCertificateId) }}</template>
        </el-table-column>
        <el-table-column label="养殖场" min-width="140">
          <template #default="scope">{{ getFarmName(scope.row.entryRecordId) }}</template>
        </el-table-column>
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="entryQuantity" label="入场数量" width="90" />
        <el-table-column prop="waitingQuantity" label="待宰数量" width="90" />
        <el-table-column prop="earTagRange" label="耳标号段" min-width="200" />
        <el-table-column prop="waitingPenNo" label="待宰圈编号" min-width="120" />
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'self_check_failed'" type="danger">自检异常</el-tag>
            <el-tag v-else :type="batchStatusType[scope.row.status]">{{ batchStatusText[scope.row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="入场时间" min-width="160">
          <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              v-if="getAction(scope.row.status)"
              :type="getAction(scope.row.status)!.type"
              size="small"
              @click="handleAction(scope.row)"
            >
              {{ getAction(scope.row.status)!.label }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!store.data.slaughterBatches.length" description="暂无待宰批次" />
    </el-card>
  </section>
</template>
