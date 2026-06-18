<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { SlaughterApplicationStatus } from '../../domain/models'

const store = useAppStore()
const router = useRouter()
const activeTab = ref<'accepted_pending_pre_check' | 'pre_check_completed'>('accepted_pending_pre_check')
const keywordInput = ref('')
const appliedKeyword = ref('')

const statusLabelMap: Record<string, string> = {
  accepted_pending_pre_check: '待宰前检查',
  pre_check_passed: '宰前检查通过',
  post_product_generated: '已生成产品批次',
  quality_cert_generated: '已生成品质检验证',
  post_check_passed: '宰后检疫合格',
  product_cert_pending: '待产品出证',
  product_cert_issued: '已出产品证',
  mark_used: '已使用标志',
  completed: '已完成',
  returned: '已退回',
  abnormal: '异常',
}

const detectionLabelMap: Record<string, string> = {
  negative: '阴性',
  positive: '阳性',
}

function getRelatedCertNo(app: { quarantineCertificateId?: string }) {
  if (!app.quarantineCertificateId) return '-'
  const cert = store.data.quarantineCertificates.find((c) => c.id === app.quarantineCertificateId)
  return cert?.certificateNo || '-'
}

function getEntryRecordSlaughterhouse(entryRecordId?: string) {
  if (!entryRecordId) return '-'
  const entry = store.data.slaughterEntryRecords.find((e) => e.id === entryRecordId)
  return entry?.slaughterhouseName || '-'
}

function matchedKeyword(app: { applicationNo: string; animalType?: string; quarantineCertificateId?: string; entryRecordId?: string }) {
  const keyword = appliedKeyword.value
  return !keyword || app.applicationNo.includes(keyword) || (app.animalType || '').includes(keyword) || getRelatedCertNo(app).includes(keyword) || getEntryRecordSlaughterhouse(app.entryRecordId).includes(keyword)
}

const pendingPreCheckList = computed(() => store.data.slaughterApplications.filter((item) => item.status === 'accepted_pending_pre_check' && matchedKeyword(item)))
const preCheckCompletedList = computed(() =>
  store.data.slaughterApplications.filter((item) =>
    ['pre_check_passed', 'post_product_generated', 'quality_cert_generated', 'post_check_passed', 'post_check_failed', 'product_cert_pending', 'product_cert_issued', 'mark_used', 'completed'].includes(item.status) &&
    matchedKeyword(item)
  )
)

const currentList = computed(() => {
  if (activeTab.value === 'accepted_pending_pre_check') return pendingPreCheckList.value
  if (activeTab.value === 'pre_check_completed') return preCheckCompletedList.value
  return []
})

function getActionLabel(status: SlaughterApplicationStatus) {
  if (status === 'accepted_pending_pre_check') return '进入宰前检查'
  if (status === 'pre_check_passed') return '查看宰前检查'
  if (status === 'post_product_generated') return '查看产品批次'
  if (status === 'quality_cert_generated') return '查看品质检验'
  if (status === 'post_check_passed') return '查看宰后检疫'
  if (status === 'product_cert_pending') return '产品出证'
  if (status === 'product_cert_issued') return '查看产品证'
  if (status === 'mark_used' || status === 'completed') return '查看详情'
  return '查看'
}

function getActionType(status: SlaughterApplicationStatus) {
  if (status === 'accepted_pending_pre_check') return 'warning'
  if (status === 'pre_check_passed' || status === 'post_product_generated' || status === 'quality_cert_generated' || status === 'post_check_passed') return 'success'
  if (status === 'product_cert_pending') return 'success'
  return 'primary'
}

const emptyDescMap: Record<string, string> = {
  accepted_pending_pre_check: '暂无待宰前检查申报',
  pre_check_completed: '暂无宰前检查完成记录',
}

function searchApplications() {
  appliedKeyword.value = keywordInput.value.trim()
}

async function refreshApplications() {
  await store.refresh()
  searchApplications()
}
</script>

<template>
  <section class="gov-page">
    <el-card class="gov-compact-card">
      <div class="page-hero">
        <div>
          <h2>宰前检疫</h2>
          <p>查看所有宰前检疫申报，按状态分类处理受理、宰前检查、宰后检疫和产品出证。</p>
        </div>
      </div>
      <div class="page-toolbar">
        <el-input v-model="keywordInput" class="filter-keyword" placeholder="按申报编号、企业、动物证筛选" clearable @keyup.enter="searchApplications" />
        <div class="toolbar-actions">
          <el-button type="primary" @click="searchApplications">搜索</el-button>
          <el-button @click="refreshApplications">刷新</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="gov-compact-card">
      <template #header>
        <div class="card-title">
          <strong>申报列表</strong>
          <el-radio-group v-model="activeTab" size="small">
            <el-radio-button value="accepted_pending_pre_check">待宰前检查 ({{ pendingPreCheckList.length }})</el-radio-button>
            <el-radio-button value="pre_check_completed">宰前检查完成 ({{ preCheckCompletedList.length }})</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-table :data="currentList" stripe>
        <el-table-column prop="applicationNo" label="申报编号" min-width="180" />
        <el-table-column label="屠宰企业" min-width="160">
          <template #default="scope">{{ getEntryRecordSlaughterhouse(scope.row.entryRecordId) }}</template>
        </el-table-column>
        <el-table-column label="动物种类" width="100">
          <template #default="scope">{{ scope.row.animalType || '-' }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="关联动物证编号" min-width="180">
          <template #default="scope">{{ getRelatedCertNo(scope.row) }}</template>
        </el-table-column>
        <el-table-column label="非瘟结果" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.africanSwineFeverResult === 'negative' ? 'success' : 'danger'" size="small">{{ detectionLabelMap[scope.row.africanSwineFeverResult] || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="违禁药物结果" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.bannedDrugResult === 'negative' ? 'success' : 'danger'" size="small">{{ detectionLabelMap[scope.row.bannedDrugResult] || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前状态" width="120">
          <template #default="scope">
            <el-tag size="small">{{ statusLabelMap[scope.row.status] || scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" min-width="170">
          <template #default="scope">{{ formatTime(scope.row.submittedAt || scope.row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="table-actions">
              <el-button :type="getActionType(scope.row.status)" size="small" @click="router.push(`/vet/slaughter-audit/${scope.row.id}`)">{{ getActionLabel(scope.row.status) }}</el-button>
              <el-button size="small" @click="router.push(`/vet/slaughter-audit/${scope.row.id}`)">查看</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="gov-pagination-bar">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="currentList.length" :page-size="10" />
      </div>
      <el-empty v-if="!currentList.length" :description="emptyDescMap[activeTab] || '暂无数据'" />
    </el-card>
  </section>
</template>