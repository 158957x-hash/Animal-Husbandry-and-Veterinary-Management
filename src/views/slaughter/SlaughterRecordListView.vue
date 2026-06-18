<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { SlaughterRecordStatus } from '../../domain/models'

const store = useAppStore()

const statusText: Record<SlaughterRecordStatus, string> = {
  not_generated: '未生成',
  auto_generated: '已自动生成',
  completed: '已完成',
  abnormal: '异常',
}

const statusType: Record<SlaughterRecordStatus, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  not_generated: 'info',
  auto_generated: 'warning',
  completed: 'success',
  abnormal: 'danger',
}

const records = computed(() => {
  return store.data.slaughterRecords.map((record) => {
    const batch = store.data.slaughterBatches.find((b) => b.id === record.waitingBatchId)
    const application = store.data.slaughterApplications.find((a) => a.id === record.slaughterApplicationId)
    const cert = store.data.quarantineCertificates.find((c) => c.id === record.quarantineCertificateId)
    const productBatch = store.data.postProductBatches.find((p) => p.slaughterRecordId === record.id)
    return {
      ...record,
      batchNo: batch?.batchNo || '-',
      applicationNo: application?.applicationNo || '-',
      certificateNo: cert?.certificateNo || '-',
      productBatchNo: productBatch?.productBatchNo || '-',
    }
  })
})
</script>

<template>
  <section class="gov-page">
    <el-card class="gov-compact-card">
      <div class="page-hero">
        <div>
          <h2>宰后管理</h2>
        </div>
      </div>
    </el-card>

    <el-card class="gov-compact-card">
      <template #header><b>屠宰记录列表</b></template>
      <el-table :data="records" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="recordNo" label="屠宰记录编号" min-width="150" />
        <el-table-column prop="batchNo" label="待宰批次编号" min-width="150" />
        <el-table-column prop="applicationNo" label="屠宰检疫申报编号" min-width="160" />
        <el-table-column prop="certificateNo" label="动物检疫合格证明编号" min-width="170" />
        <el-table-column prop="animalType" label="动物种类" width="90" />
        <el-table-column prop="preCheckConclusion" label="宰前检查结论" min-width="180" show-overflow-tooltip />
        <el-table-column prop="actualSlaughterQuantity" label="实际屠宰数量" width="120" />
        <el-table-column label="屠宰完成时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.slaughterCompletedTime) }}</template>
        </el-table-column>
        <el-table-column prop="productBatchNo" label="产品批次编号" min-width="150" />
        <el-table-column label="当前状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link>查看详情</el-button>
            <el-button size="small" type="primary" link>查看宰前检查记录</el-button>
            <el-button size="small" type="primary" link>查看产品批次</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="gov-pagination-bar">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="records.length" :page-size="10" />
      </div>
      <el-empty v-if="!records.length" description="暂无屠宰作业记录" />
    </el-card>
  </section>
</template>

<style scoped></style>