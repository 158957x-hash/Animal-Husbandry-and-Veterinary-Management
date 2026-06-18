<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { SlaughterEntryRecord, SlaughterEntryStatus } from '../../domain/models'

const store = useAppStore()
const router = useRouter()

const keywordInput = ref('')
const statusFilterInput = ref<SlaughterEntryStatus | ''>('')
const appliedKeyword = ref('')
const appliedStatus = ref<SlaughterEntryStatus | ''>('')

const entryStatusText: Record<SlaughterEntryStatus, string> = {
  pending_check: '待查验',
  checking: '待查验',
  entry_passed: '已通过',
  entry_rejected: '未通过',
}
const entryStatusType: Record<SlaughterEntryStatus, 'info' | 'success' | 'danger' | 'warning'> = {
  pending_check: 'warning',
  checking: 'warning',
  entry_passed: 'success',
  entry_rejected: 'danger',
}

const filteredEntries = computed(() => {
  const keyword = appliedKeyword.value.toLowerCase()
  return store.data.slaughterEntryRecords.filter((entry) => {
    const certificateNo = getCertificateNo(entry.quarantineCertificateId).toLowerCase()
    const matchedKeyword = !keyword || [entry.entryNo, certificateNo, entry.originFarm, entry.animalType, entry.vehiclePlateNo, entry.carrier].some((value) => value.toLowerCase().includes(keyword))
    const matchedStatus = !appliedStatus.value || normalizeStatus(entry.status) === appliedStatus.value
    return matchedKeyword && matchedStatus
  })
})

function normalizeStatus(status: SlaughterEntryStatus): SlaughterEntryStatus {
  if (status === 'checking') return 'pending_check'
  return status
}

function getCertificateNo(certificateId: string) {
  const cert = store.data.quarantineCertificates.find((item) => item.id === certificateId)
  return cert?.certificateNo ?? '-'
}

function getDisplayTime(entry: SlaughterEntryRecord) {
  return entry.checkedAt || entry.createdAt
}

function searchEntries() {
  appliedKeyword.value = keywordInput.value.trim()
  appliedStatus.value = statusFilterInput.value
}

async function refreshEntries() {
  await store.refresh()
  searchEntries()
}

function handleEntryAction(entry: SlaughterEntryRecord) {
  if (normalizeStatus(entry.status) === 'pending_check') {
    router.push(`/slaughter/entry-check/${entry.id}/process`)
    return
  }
  router.push(`/slaughter/entry-check/${entry.id}/detail`)
}
</script>

<template>
  <section class="gov-page">
    <el-card class="gov-compact-card">
      <div class="page-hero">
        <div>
          <h2>入场查验</h2>
          <p>承接已出具产地检疫证明的调运动物批次，按查验状态办理入场核验。</p>
        </div>
      </div>
    </el-card>

    <el-card class="gov-compact-card search-card-flat">
      <div class="page-toolbar compact">
        <el-input v-model="keywordInput" class="filter-keyword" placeholder="按入场编号、动物证编号、养殖场、车牌筛选" clearable @keyup.enter="searchEntries" />
        <el-select v-model="statusFilterInput" class="filter-short" placeholder="查验状态" clearable>
          <el-option label="待查验" value="pending_check" />
          <el-option label="已通过" value="entry_passed" />
          <el-option label="未通过" value="entry_rejected" />
        </el-select>
        <div class="toolbar-actions">
          <el-button type="primary" @click="searchEntries">搜索</el-button>
          <el-button @click="refreshEntries">刷新</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="gov-compact-card">
      <template #header><strong>入场查验列表</strong></template>
      <el-table :data="filteredEntries" stripe>
        <el-table-column prop="entryNo" label="入场编号" min-width="170" />
        <el-table-column label="动物证编号" min-width="180">
          <template #default="scope">
            {{ getCertificateNo(scope.row.quarantineCertificateId) }}
          </template>
        </el-table-column>
        <el-table-column prop="originFarm" label="养殖场" min-width="150" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="vehiclePlateNo" label="运输车辆" min-width="120" />
        <el-table-column label="查验状态" width="110">
          <template #default="scope">
            <el-tag :type="entryStatusType[normalizeStatus(scope.row.status)] ?? 'info'">
              {{ entryStatusText[normalizeStatus(scope.row.status)] ?? scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" min-width="170">
          <template #default="scope">{{ formatTime(getDisplayTime(scope.row)) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button :type="normalizeStatus(scope.row.status) === 'pending_check' ? 'primary' : 'default'" size="small" @click="handleEntryAction(scope.row)">
              {{ normalizeStatus(scope.row.status) === 'pending_check' ? '去查验' : '查看详情' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="gov-pagination-bar">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="filteredEntries.length" :page-size="10" />
      </div>
      <el-empty v-if="!filteredEntries.length" description="暂无入场查验数据" />
    </el-card>
  </section>
</template>
