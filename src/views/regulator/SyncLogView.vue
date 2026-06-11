<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'

const store = useAppStore()
async function retry(id: string) {
  await store.retrySyncLog(id)
  ElMessage.success('已重新同步')
}
</script>

<template>
  <section class="stack">
    <el-card class="panel-card">
      <template #header><strong>接口同步日志</strong></template>
      <el-table :data="store.data.syncLogs">
        <el-table-column prop="target" label="同步目标" min-width="210" />
        <el-table-column prop="businessType" label="业务类型" width="140" />
        <el-table-column prop="businessNo" label="业务编号" min-width="180" />
        <el-table-column label="状态" width="100"><template #default="scope"><el-tag :type="scope.row.status === 'success' ? 'success' : scope.row.status === 'failed' ? 'danger' : 'warning'">{{ scope.row.status }}</el-tag></template></el-table-column>
        <el-table-column label="同步时间" width="190"><template #default="scope">{{ formatTime(scope.row.syncedAt) }}</template></el-table-column>
        <el-table-column prop="failureReason" label="失败原因" min-width="160" />
        <el-table-column label="操作" width="120"><template #default="scope"><el-button size="small" :disabled="scope.row.status === 'success'" @click="retry(scope.row.id)">重试</el-button></template></el-table-column>
      </el-table>
    </el-card>
  </section>
</template>
