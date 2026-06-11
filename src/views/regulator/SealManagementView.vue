<script setup lang="ts">
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const actionText = { receive: '领用', issue: '发放', use: '使用', recycle: '回收', destroy: '销毁' }
</script>

<template>
  <section class="stack">
    <el-card class="panel-card">
      <template #header><strong>检疫标志和检疫证章管理</strong></template>
      <el-table :data="store.data.sealRecords">
        <el-table-column prop="sealNo" label="证章编号" min-width="180" />
        <el-table-column label="动作" width="100"><template #default="scope"><el-tag>{{ actionText[scope.row.action] }}</el-tag></template></el-table-column>
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="businessNo" label="关联业务" min-width="180" />
        <el-table-column prop="operator" label="操作人" width="150" />
        <el-table-column label="时间" width="190"><template #default="scope">{{ formatTime(scope.row.createdAt) }}</template></el-table-column>
      </el-table>
    </el-card>
  </section>
</template>
