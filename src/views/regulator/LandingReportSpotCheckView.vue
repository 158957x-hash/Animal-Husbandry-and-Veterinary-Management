<script setup lang="ts">
import { useAppStore } from '../../stores/app'
import { statusText, statusType } from '../../domain/stateMachine'
import { formatTime } from '../../lib/format'

const store = useAppStore()
</script>

<template>
  <section class="stack">
    <el-card class="panel-card">
      <template #header><strong>落地报告抽查</strong></template>
      <el-table :data="store.data.transportTasks">
        <el-table-column prop="plateNo" label="车牌号" width="130" />
        <el-table-column label="运输状态" width="160"><template #default="scope"><el-tag :type="statusType[scope.row.status]">{{ statusText[scope.row.status] }}</el-tag></template></el-table-column>
        <el-table-column label="检疫证明" min-width="190"><template #default="scope">{{ store.data.quarantineCertificates.find((item) => item.id === scope.row.certificateId)?.certificateNo }}</template></el-table-column>
        <el-table-column label="目的地" min-width="190"><template #default="scope">{{ store.data.quarantineCertificates.find((item) => item.id === scope.row.certificateId)?.destination }}</template></el-table-column>
        <el-table-column label="落地报告" min-width="220">
          <template #default="scope">
            <template v-if="store.data.landingReports.find((item) => item.transportTaskId === scope.row.id)">
              <el-tag type="success">已提交</el-tag>
              {{ store.data.landingReports.find((item) => item.transportTaskId === scope.row.id)?.actualDestination }}
            </template>
            <el-tag v-else type="warning">待提交</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="到达时间" width="190"><template #default="scope">{{ formatTime(scope.row.arrivedAt) }}</template></el-table-column>
      </el-table>
    </el-card>
  </section>
</template>
