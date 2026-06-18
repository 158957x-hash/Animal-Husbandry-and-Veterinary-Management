<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { statusText, statusType } from '../../domain/stateMachine'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const router = useRouter()
const activeTab = ref('pending')
const keywordInput = ref('')
const appliedKeyword = ref('')

const matchedKeyword = (item: { applicationNo: string; animalType: string; destination: string }) => {
  const keyword = appliedKeyword.value
  return !keyword || item.applicationNo.includes(keyword) || item.animalType.includes(keyword) || item.destination.includes(keyword)
}

const pendingList = computed(() => store.data.originApplications.filter((item) => item.status === 'submitted' && matchedKeyword(item)))
const rejectedList = computed(() => store.data.originApplications.filter((item) => item.status === 'rejected' && matchedKeyword(item)))
const issuedList = computed(() => store.data.originApplications.filter((item) => ['certificate_issued', 'transporting', 'arrived'].includes(item.status) && matchedKeyword(item)))

const currentList = computed(() => {
  if (activeTab.value === 'pending') return pendingList.value
  if (activeTab.value === 'rejected') return rejectedList.value
  if (activeTab.value === 'issued') return issuedList.value
  return []
})
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
          <h2>产地检疫管理</h2>
          <p>查看所有产地检疫申报，对已提交的申报进行现场查验。</p>
        </div>
      </div>
      <div class="page-toolbar">
        <el-input v-model="keywordInput" class="filter-keyword" placeholder="按申报编号、动物、目的地筛选" clearable @keyup.enter="searchApplications" />
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
            <el-radio-button value="pending">待审核 ({{ pendingList.length }})</el-radio-button>
            <el-radio-button value="rejected">已驳回 ({{ rejectedList.length }})</el-radio-button>
            <el-radio-button value="issued">已出证 ({{ issuedList.length }})</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-table :data="currentList" stripe>
        <el-table-column prop="applicationNo" label="申报编号" min-width="180" />
        <el-table-column prop="animalType" label="动物种类" width="110" />
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="destination" label="目的地" min-width="180" />
        <el-table-column label="状态" width="140">
          <template #default="scope">
            <el-tag :type="statusType[scope.row.status]">{{ statusText[scope.row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" min-width="170">
          <template #default="scope">{{ formatTime(scope.row.submittedAt || scope.row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="table-actions">
              <el-button v-if="scope.row.status === 'submitted'" type="success" size="small" @click="router.push(`/vet/origin-inspection/${scope.row.id}`)">现场查验</el-button>
              <el-button size="small" @click="router.push(`/vet/origin-inspection/${scope.row.id}`)">查看详情</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="gov-pagination-bar">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="currentList.length" :page-size="10" />
      </div>
      <el-empty v-if="!currentList.length" :description="activeTab === 'pending' ? '暂无待审核申报' : activeTab === 'rejected' ? '暂无已驳回申报' : '暂无已出证申报'" />
    </el-card>
  </section>
</template>
