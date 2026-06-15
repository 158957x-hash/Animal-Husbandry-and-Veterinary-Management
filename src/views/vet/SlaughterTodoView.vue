<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { SlaughterApplicationStatus } from '../../domain/models'

const store = useAppStore()
const router = useRouter()
const activeTab = ref<SlaughterApplicationStatus | 'all'>('pending_accept')

const statusLabelMap: Record<string, string> = {
  pending_accept: '待受理',
  accepted: '已受理',
  ante_mortem_checking: '宰前检查中',
  post_mortem_checking: '宰后检疫中',
  pending_product_cert: '待产品出证',
  product_cert_issued: '已出证',
  returned: '已退回',
  abnormal: '异常',
}

const detectionLabelMap: Record<string, string> = {
  negative: '阴性',
  positive: '阳性',
}

const pendingAcceptList = computed(() => store.data.slaughterApplications.filter((item) => item.status === 'pending_accept'))
const anteMortemList = computed(() => store.data.slaughterApplications.filter((item) => item.status === 'ante_mortem_checking'))
const postMortemList = computed(() => store.data.slaughterApplications.filter((item) => item.status === 'post_mortem_checking'))
const pendingCertList = computed(() => store.data.slaughterApplications.filter((item) => item.status === 'pending_product_cert'))
const issuedList = computed(() => store.data.slaughterApplications.filter((item) => item.status === 'product_cert_issued'))

const currentList = computed(() => {
  if (activeTab.value === 'pending_accept') return pendingAcceptList.value
  if (activeTab.value === 'ante_mortem_checking') return anteMortemList.value
  if (activeTab.value === 'post_mortem_checking') return postMortemList.value
  if (activeTab.value === 'pending_product_cert') return pendingCertList.value
  if (activeTab.value === 'product_cert_issued') return issuedList.value
  return []
})

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

function getActionLabel(status: SlaughterApplicationStatus) {
  if (status === 'pending_accept') return '受理'
  if (status === 'ante_mortem_checking') return '进入宰前检查'
  if (status === 'post_mortem_checking') return '进入宰后检疫'
  if (status === 'pending_product_cert') return '产品出证'
  if (status === 'product_cert_issued') return '查看产品证'
  return '查看'
}

function getActionType(status: SlaughterApplicationStatus) {
  if (status === 'pending_accept') return 'success'
  if (status === 'ante_mortem_checking') return 'warning'
  if (status === 'post_mortem_checking') return 'warning'
  if (status === 'pending_product_cert') return 'success'
  return 'primary'
}

const emptyDescMap: Record<string, string> = {
  pending_accept: '暂无待受理申报',
  ante_mortem_checking: '暂无宰前检查中申报',
  post_mortem_checking: '暂无宰后检疫中申报',
  pending_product_cert: '暂无待产品出证申报',
  product_cert_issued: '暂无已出证申报',
}
</script>

<template>
  <section class="stack">
    <el-card class="panel-card">
      <div class="card-header-line">
        <div>
          <h2>屠宰检疫待办</h2>
          <p>查看所有屠宰检疫申报，按状态分类处理受理、宰前检查、宰后检疫和产品出证。</p>
        </div>
        <div class="action-inline">
          <el-button @click="store.refresh()">刷新</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="panel-card">
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <strong>申报列表</strong>
          <el-radio-group v-model="activeTab" size="small">
            <el-radio-button value="pending_accept">待受理 ({{ pendingAcceptList.length }})</el-radio-button>
            <el-radio-button value="ante_mortem_checking">宰前检查中 ({{ anteMortemList.length }})</el-radio-button>
            <el-radio-button value="post_mortem_checking">宰后检疫中 ({{ postMortemList.length }})</el-radio-button>
            <el-radio-button value="pending_product_cert">待产品出证 ({{ pendingCertList.length }})</el-radio-button>
            <el-radio-button value="product_cert_issued">已出证 ({{ issuedList.length }})</el-radio-button>
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
            <el-button :type="getActionType(scope.row.status)" size="small" @click="router.push(`/vet/slaughter-audit/${scope.row.id}`)">{{ getActionLabel(scope.row.status) }}</el-button>
            <el-button size="small" @click="router.push(`/vet/slaughter-audit/${scope.row.id}`)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!currentList.length" :description="emptyDescMap[activeTab] || '暂无数据'" />
    </el-card>
  </section>
</template>
