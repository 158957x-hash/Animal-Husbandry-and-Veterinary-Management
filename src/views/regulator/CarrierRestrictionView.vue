<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'

const store = useAppStore()
async function release(id: string) {
  await store.releaseCarrierRestriction(id, '已完成线下核查和整改，解除限制')
  ElMessage.success('承运限制已解除')
}
</script>

<template>
  <section class="stack">
    <el-card class="panel-card">
      <template #header><strong>承运限制管理</strong></template>
      <el-table :data="store.data.carrierRestrictions">
        <el-table-column prop="plateNo" label="车牌号" width="130" />
        <el-table-column prop="carrier" label="承运人" width="120" />
        <el-table-column prop="reason" label="限制原因" min-width="220" />
        <el-table-column label="关联证明" min-width="190"><template #default="scope">{{ store.data.quarantineCertificates.find((item) => item.id === scope.row.certificateId)?.certificateNo }}</template></el-table-column>
        <el-table-column label="状态" width="110"><template #default="scope"><el-tag :type="scope.row.status === 'restricted' ? 'danger' : 'success'">{{ scope.row.status === 'restricted' ? '限制中' : '已解除' }}</el-tag></template></el-table-column>
        <el-table-column label="限制时间" width="190"><template #default="scope">{{ formatTime(scope.row.restrictedAt) }}</template></el-table-column>
        <el-table-column label="操作" width="130"><template #default="scope"><el-button size="small" type="success" :disabled="scope.row.status !== 'restricted'" @click="release(scope.row.id)">解除限制</el-button></template></el-table-column>
      </el-table>
    </el-card>
  </section>
</template>
