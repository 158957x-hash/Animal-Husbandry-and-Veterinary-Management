<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { statusText, statusType } from '../../domain/stateMachine'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const router = useRouter()
const activeTab = ref('pending')

const pendingList = computed(() => store.data.originApplications.filter((item) => item.status === 'submitted'))
const rejectedList = computed(() => store.data.originApplications.filter((item) => item.status === 'rejected'))
const issuedList = computed(() => store.data.originApplications.filter((item) => ['certificate_issued', 'transporting', 'arrived'].includes(item.status)))

const currentList = computed(() => {
  if (activeTab.value === 'pending') return pendingList.value
  if (activeTab.value === 'rejected') return rejectedList.value
  if (activeTab.value === 'issued') return issuedList.value
  return []
})
</script>

<template>
  <section class="stack">
    <el-card class="panel-card">
      <div class="card-header-line">
        <div>
          <h2>产地检疫管理</h2>
          <p>查看所有产地检疫申报，对已提交的申报进行现场查验。</p>
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
            <el-button v-if="scope.row.status === 'submitted'" type="success" size="small" @click="router.push(`/vet/origin-inspection/${scope.row.id}`)">现场查验</el-button>
            <el-button size="small" @click="router.push(`/vet/origin-inspection/${scope.row.id}`)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!currentList.length" :description="activeTab === 'pending' ? '暂无待审核申报' : activeTab === 'rejected' ? '暂无已驳回申报' : '暂无已出证申报'" />
    </el-card>
  </section>
</template>
