<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { SlaughterBatchStatus } from '../../domain/models'

const store = useAppStore()
const router = useRouter()

const keywordInput = ref('')
const statusFilterInput = ref<SlaughterBatchStatus | ''>('')
const appliedKeyword = ref('')
const appliedStatus = ref<SlaughterBatchStatus | ''>('')

const statusText: Record<SlaughterBatchStatus, string> = {
  pending_slaughter_apply: '待提交屠宰检疫申报',
  draft_application: '申报草稿',
  submitted_pending_accept: '已提交待受理',
  returned_for_correction: '退回补正',
  accepted_pending_ante_mortem: '已受理/待宰前检查',
  ante_mortem_passed: '宰前检查通过',
  ante_mortem_failed: '宰前检查不通过',
  emergency_slaughtering: '急宰处理中',
  death_registration: '待宰死亡登记',
  abnormal: '待宰异常',
  slaughter_applied: '已申报',
  ante_mortem_checking: '宰前检查中',
  post_mortem_checking: '宰后检疫中',
  post_mortem_passed: '宰后检疫通过',
  post_mortem_failed: '宰后检疫未通过',
  pending_product_cert: '待出产品证',
  meat_quality_certificate_issued: '肉品品质证已出',
  product_cert_issued: '产品证已出',
}

const statusType: Record<SlaughterBatchStatus, 'info' | 'success' | 'warning' | 'danger' | 'primary'> = {
  pending_slaughter_apply: 'warning',
  draft_application: 'info',
  submitted_pending_accept: 'primary',
  returned_for_correction: 'danger',
  accepted_pending_ante_mortem: 'primary',
  ante_mortem_passed: 'success',
  ante_mortem_failed: 'danger',
  emergency_slaughtering: 'warning',
  death_registration: 'danger',
  abnormal: 'danger',
  slaughter_applied: 'primary',
  ante_mortem_checking: 'warning',
  post_mortem_checking: 'warning',
  post_mortem_passed: 'success',
  post_mortem_failed: 'danger',
  pending_product_cert: 'warning',
  meat_quality_certificate_issued: 'success',
  product_cert_issued: 'success',
}

const preSlaughterStatuses: SlaughterBatchStatus[] = [
  'pending_slaughter_apply', 'draft_application', 'submitted_pending_accept',
  'returned_for_correction', 'accepted_pending_ante_mortem',
  'ante_mortem_passed', 'ante_mortem_failed',
  'emergency_slaughtering', 'death_registration', 'abnormal',
]

const filteredBatches = computed(() => {
  const keyword = appliedKeyword.value.toLowerCase()
  return store.data.slaughterBatches.filter((batch) => {
    const entryNo = getEntryNo(batch.entryRecordId).toLowerCase()
    const certNo = getCertNo(batch.quarantineCertificateId).toLowerCase()
    const farmName = getFarmName(batch.entryRecordId).toLowerCase()
    const matchedKeyword = !keyword || [batch.batchNo, entryNo, certNo, farmName, batch.animalType, batch.waitingPenNo].some((v) => v.toLowerCase().includes(keyword))
    const matchedStatus = !appliedStatus.value || batch.status === appliedStatus.value
    return matchedKeyword && matchedStatus
  })
})

function getEntryNo(entryRecordId: string) {
  return store.data.slaughterEntryRecords.find((e) => e.id === entryRecordId)?.entryNo ?? '-'
}

function getCertNo(quarantineCertificateId: string) {
  return store.data.quarantineCertificates.find((c) => c.id === quarantineCertificateId)?.certificateNo ?? '-'
}

function getFarmName(entryRecordId: string) {
  return store.data.slaughterEntryRecords.find((e) => e.id === entryRecordId)?.originFarm ?? '-'
}

function getEntryTime(entryRecordId: string) {
  return store.data.slaughterEntryRecords.find((e) => e.id === entryRecordId)?.entryTime ?? ''
}

function getSlaughterApplyStatus(batchId: string) {
  const app = store.data.slaughterApplications.find((a) => a.batchId === batchId)
  if (!app) return '-'
  const map: Record<string, string> = { pending_accept: '待受理', accepted: '已受理', ante_mortem_checking: '宰前检查中', returned: '已退回', abnormal: '异常', post_mortem_checking: '宰后检疫中', pending_product_cert: '待出产品证', product_cert_issued: '产品证已出' }
  return map[app.status] ?? app.status
}

function getAnteMortemStatus(batchId: string) {
  const check = store.data.anteMortemChecks.find((c) => c.waitingBatchId === batchId)
  if (!check) return '-'
  return check.passed ? '通过' : '不通过'
}

function searchBatches() {
  appliedKeyword.value = keywordInput.value.trim()
  appliedStatus.value = statusFilterInput.value
}

async function refreshBatches() {
  await store.refresh()
  searchBatches()
}

function getActions(status: SlaughterBatchStatus) {
  switch (status) {
    case 'pending_slaughter_apply':
      return [
        { label: '提交屠宰检疫申报', type: 'primary' as const, action: 'apply' },
        { label: '急宰申报', type: 'warning' as const, action: 'emergency' },
        { label: '死亡登记', type: 'info' as const, action: 'death' },
        { label: '登记异常', type: 'danger' as const, action: 'abnormal' },
        { label: '查看详情', type: 'default' as const, action: 'detail' },
      ]
    case 'draft_application':
      return [
        { label: '继续编辑', type: 'primary' as const, action: 'edit' },
        { label: '删除草稿', type: 'danger' as const, action: 'delete_draft' },
        { label: '查看详情', type: 'default' as const, action: 'detail' },
      ]
    case 'submitted_pending_accept':
      return [
        { label: '查看申报', type: 'primary' as const, action: 'view_apply' },
        { label: '撤回申报', type: 'warning' as const, action: 'withdraw' },
        { label: '查看详情', type: 'default' as const, action: 'detail' },
      ]
    case 'returned_for_correction':
      return [
        { label: '查看退回原因', type: 'danger' as const, action: 'view_return' },
        { label: '修改后重新提交', type: 'primary' as const, action: 'resubmit' },
        { label: '查看详情', type: 'default' as const, action: 'detail' },
      ]
    case 'accepted_pending_ante_mortem':
      return [
        { label: '查看受理记录', type: 'primary' as const, action: 'view_accept' },
        { label: '查看检疫进度', type: 'info' as const, action: 'view_progress' },
        { label: '查看详情', type: 'default' as const, action: 'detail' },
      ]
    case 'ante_mortem_passed':
      return [
        { label: '转入屠宰作业', type: 'success' as const, action: 'to_slaughter' },
        { label: '查看宰前检查记录', type: 'info' as const, action: 'view_ante_mortem' },
        { label: '查看详情', type: 'default' as const, action: 'detail' },
      ]
    case 'ante_mortem_failed':
      return [
        { label: '查看不通过原因', type: 'danger' as const, action: 'view_fail' },
        { label: '登记异常', type: 'warning' as const, action: 'abnormal' },
        { label: '进入无害化处理', type: 'danger' as const, action: 'harmless' },
      ]
    case 'emergency_slaughtering':
      return [
        { label: '查看急宰申报', type: 'primary' as const, action: 'view_emergency' },
        { label: '查看处理进度', type: 'info' as const, action: 'view_progress' },
      ]
    case 'death_registration':
      return [
        { label: '登记死亡', type: 'primary' as const, action: 'register_death' },
        { label: '上传附件', type: 'info' as const, action: 'upload' },
        { label: '进入无害化处理', type: 'danger' as const, action: 'harmless' },
      ]
    case 'abnormal':
      return [
        { label: '查看异常', type: 'danger' as const, action: 'view_abnormal' },
        { label: '处理异常', type: 'primary' as const, action: 'handle_abnormal' },
        { label: '上传附件', type: 'info' as const, action: 'upload' },
      ]
    default:
      return [{ label: '查看详情', type: 'default' as const, action: 'detail' }]
  }
}

function handleAction(batchId: string, action: string) {
  if (action === 'detail') {
    router.push(`/slaughter/waiting-slaughter/${batchId}/detail`)
    return
  }
  if (action === 'apply') {
    router.push(`/slaughter/quarantine-apply/${batchId}`)
    return
  }
  if (action === 'to_slaughter') {
    ElMessage.info('转入屠宰作业入口已保留')
    return
  }
  const actionLabels: Record<string, string> = {
    emergency: '急宰申报', death: '死亡登记', abnormal: '登记异常',
    edit: '继续编辑', delete_draft: '删除草稿', view_apply: '查看申报', withdraw: '撤回申报',
    view_return: '查看退回原因', resubmit: '修改后重新提交', view_accept: '查看受理记录',
    view_progress: '查看检疫进度', view_ante_mortem: '查看宰前检查记录', view_fail: '查看不通过原因',
    harmless: '进入无害化处理', view_emergency: '查看急宰申报', register_death: '登记死亡',
    upload: '上传附件', view_abnormal: '查看异常', handle_abnormal: '处理异常',
  }
  ElMessage.info(`${actionLabels[action] || action}入口已保留`)
}
</script>

<template>
  <section class="gov-page">
    <el-card class="panel-card">
      <div class="page-hero">
        <div>
          <h2>待宰管理</h2>
          <p>管理入场后至宰前检查通过的待宰批次，按流程推进自检、申报、检疫等环节。宰前检查通过后转入屠宰作业。</p>
        </div>
      </div>
    </el-card>

    <el-card class="panel-card search-card-flat">
      <div class="page-toolbar compact">
        <el-input v-model="keywordInput" class="filter-keyword" placeholder="按批次编号、入场编号、动物证编号、养殖场筛选" clearable @keyup.enter="searchBatches" />
        <el-select v-model="statusFilterInput" class="filter-short" placeholder="当前状态" clearable>
          <el-option v-for="s in preSlaughterStatuses" :key="s" :label="statusText[s]" :value="s" />
        </el-select>
        <div class="toolbar-actions">
          <el-button type="primary" @click="searchBatches">搜索</el-button>
          <el-button @click="refreshBatches">刷新</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="panel-card">
      <template #header><strong>待宰批次列表</strong></template>
      <el-table :data="filteredBatches" stripe>
        <el-table-column prop="batchNo" label="待宰批次编号" min-width="160" />
        <el-table-column label="入场编号" min-width="160">
          <template #default="scope">{{ getEntryNo(scope.row.entryRecordId) }}</template>
        </el-table-column>
        <el-table-column label="动物证编号" min-width="170">
          <template #default="scope">{{ getCertNo(scope.row.quarantineCertificateId) }}</template>
        </el-table-column>
        <el-table-column label="来源养殖场" min-width="140">
          <template #default="scope">{{ getFarmName(scope.row.entryRecordId) }}</template>
        </el-table-column>
        <el-table-column prop="animalType" label="动物种类" width="90" />
        <el-table-column prop="entryQuantity" label="实到数量" width="90" />
        <el-table-column prop="waitingPenNo" label="待宰圈" min-width="110" />
        <el-table-column label="入场时间" min-width="160">
          <template #default="scope">{{ formatTime(scope.row.entryTime || getEntryTime(scope.row.entryRecordId)) }}</template>
        </el-table-column>
        <el-table-column label="申报状态" width="120">
          <template #default="scope">{{ getSlaughterApplyStatus(scope.row.id) }}</template>
        </el-table-column>
        <el-table-column label="宰前检查" width="100">
          <template #default="scope">{{ getAnteMortemStatus(scope.row.id) }}</template>
        </el-table-column>
        <el-table-column label="当前状态" width="150">
          <template #default="scope">
            <el-tag :type="statusType[scope.row.status]">{{ statusText[scope.row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" class-name="waiting-action-column">
          <template #default="scope">
            <div class="table-actions-inline">
              <el-button
                v-for="(act, idx) in getActions(scope.row.status).slice(0, 2)"
                :key="idx"
                :type="act.type"
                size="small"
                @click="handleAction(scope.row.id, act.action)"
              >{{ act.label }}</el-button>
              <el-dropdown v-if="getActions(scope.row.status).length > 2" trigger="click">
                <el-button size="small">更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-for="(act, idx) in getActions(scope.row.status).slice(2)" :key="idx" @click="handleAction(scope.row.id, act.action)">{{ act.label }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!filteredBatches.length" description="暂无待宰批次" />
    </el-card>
  </section>
</template>

<style scoped>
.table-actions-inline {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  align-items: center;
  width: max-content;
  min-width: 100%;
}

.table-actions-inline .el-button {
  margin: 0;
  flex: 0 0 auto;
}

:deep(.waiting-action-column .cell) {
  overflow: visible;
  padding-right: 14px;
}
</style>
