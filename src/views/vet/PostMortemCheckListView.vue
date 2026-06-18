<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { PostProductBatch, PostMortemCheckStatus2 } from '../../domain/models'

const store = useAppStore()
const router = useRouter()
const activeTab = ref<'pending' | 'completed' | 'harmless_required'>('pending')
const keywordInput = ref('')
const appliedKeyword = ref('')

const statusLabelMap: Record<PostMortemCheckStatus2, string> = {
  not_started: '未开始',
  pending: '待检疫',
  in_progress: '检疫中',
  passed: '合格',
  failed: '不合格',
  partial_failed: '部分不合格',
  harmless_required: '需无害化',
}

const statusTypeMap: Record<PostMortemCheckStatus2, string> = {
  not_started: 'info',
  pending: 'warning',
  in_progress: 'info',
  passed: 'success',
  failed: 'danger',
  partial_failed: 'warning',
  harmless_required: 'danger',
}

function matchedKeyword(item: PostProductBatch) {
  const keyword = appliedKeyword.value
  if (!keyword) return true
  return (
    item.productBatchNo.includes(keyword) ||
    item.slaughterBatchNo.includes(keyword) ||
    item.slaughterhouseName.includes(keyword) ||
    (item.animalType || '').includes(keyword) ||
    (item.productName || '').includes(keyword)
  )
}

const pendingList = computed(() =>
  store.data.postProductBatches
    .filter((item) => item.postCheckStatus === 'pending' && matchedKeyword(item))
)

const completedList = computed(() =>
  store.data.postProductBatches
    .filter((item) => item.postCheckStatus === 'passed' && matchedKeyword(item))
)

const harmlessRequiredList = computed(() =>
  store.data.postProductBatches
    .filter((item) => item.postCheckStatus === 'harmless_required' && matchedKeyword(item))
)

const currentList = computed(() => {
  if (activeTab.value === 'pending') return pendingList.value
  if (activeTab.value === 'completed') return completedList.value
  if (activeTab.value === 'harmless_required') return harmlessRequiredList.value
  return []
})

const emptyDescMap: Record<string, string> = {
  pending: '暂无待检疫产品批次',
  completed: '暂无已完成检疫记录',
  harmless_required: '暂无需要无害化处理的批次',
}

function searchBatches() {
  appliedKeyword.value = keywordInput.value.trim()
}

async function refreshBatches() {
  await store.refresh()
  searchBatches()
}

function goToDetail(item: PostProductBatch) {
  const done = ['passed', 'failed', 'partial_failed', 'harmless_required']
  if (done.includes(item.postCheckStatus)) {
    router.push(`/vet/post-mortem-check/${item.id}/detail`)
  } else {
    router.push(`/vet/post-mortem-check/${item.id}`)
  }
}
</script>

<template>
  <section class="gov-page">
    <el-card class="gov-compact-card">
      <div class="page-hero">
        <div>
          <h2>宰后检疫</h2>
          <p>查看所有宰后产品批次，按状态分类进行宰后检疫工作。</p>
        </div>
      </div>
      <div class="page-toolbar">
        <el-input v-model="keywordInput" class="filter-keyword" placeholder="按批次编号、企业、动物种类、产品名称筛选" clearable @keyup.enter="searchBatches" />
        <div class="toolbar-actions">
          <el-button type="primary" @click="searchBatches">搜索</el-button>
          <el-button @click="refreshBatches">刷新</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="gov-compact-card">
      <template #header>
        <div class="card-title">
          <strong>产品批次列表</strong>
          <el-radio-group v-model="activeTab" size="small">
            <el-radio-button value="pending">待检疫 ({{ pendingList.length }})</el-radio-button>
            <el-radio-button value="completed">已完成 ({{ completedList.length }})</el-radio-button>
            <el-radio-button value="harmless_required">需要无害化 ({{ harmlessRequiredList.length }})</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-table :data="currentList" stripe>
        <el-table-column prop="productBatchNo" label="产品批次编号" min-width="180" />
        <el-table-column prop="slaughterBatchNo" label="屠宰批次编号" min-width="160" />
        <el-table-column prop="slaughterhouseName" label="屠宰企业" min-width="160" />
        <el-table-column label="动物种类" width="100">
          <template #default="scope">{{ scope.row.animalType || '-' }}</template>
        </el-table-column>
        <el-table-column prop="productName" label="产品名称" min-width="120" />
        <el-table-column prop="productWeight" label="产品重量(kg)" width="100" />
        <el-table-column label="当前状态" width="120">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.postCheckStatus]" size="small">{{ statusLabelMap[scope.row.postCheckStatus] || scope.row.postCheckStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="170">
          <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="scope">
            <div class="table-actions">
              <el-button type="primary" size="small" @click="goToDetail(scope.row)">
                {{ ['pending', 'in_progress', 'harmless_required'].includes(scope.row.postCheckStatus) ? '开始检疫' : '查看详情' }}
              </el-button>
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
