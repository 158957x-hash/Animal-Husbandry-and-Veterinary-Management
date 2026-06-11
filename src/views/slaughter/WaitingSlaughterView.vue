<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { statusText, statusType } from '../../domain/stateMachine'

const store = useAppStore()
async function create(entryId: string) {
  await store.createWaitingSlaughterBatch(entryId)
  ElMessage.success('已生成待宰批次')
}
</script>

<template>
  <section class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><strong>可转待宰入场记录</strong></template>
      <div v-for="entry in store.data.entryChecks.filter((item) => item.status === 'entry_passed')" :key="entry.id" class="task-item">
        <div><b>{{ entry.plateNo }}</b><p>{{ entry.checks.find((item) => item.label === '数量一致性')?.message }}</p></div>
        <el-button size="small" type="success" :disabled="store.data.waitingSlaughterBatches.some((item) => item.entryCheckId === entry.id)" @click="create(entry.id)">生成待宰</el-button>
      </div>
    </el-card>
    <el-card class="panel-card">
      <template #header><strong>待宰批次</strong></template>
      <div v-for="batch in store.data.waitingSlaughterBatches" :key="batch.id" class="task-item large">
        <div><b>{{ batch.animalType }} {{ batch.quantity }} 头</b><p>关联入场：{{ batch.entryCheckId }}</p></div>
        <el-tag :type="statusType[batch.status]">{{ statusText[batch.status] }}</el-tag>
      </div>
      <el-empty v-if="!store.data.waitingSlaughterBatches.length" description="暂无待宰批次" />
    </el-card>
  </section>
</template>
