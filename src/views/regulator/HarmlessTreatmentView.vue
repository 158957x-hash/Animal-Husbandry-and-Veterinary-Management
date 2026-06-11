<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const form = reactive({ method: '高温化制', processedQuantity: 0, processedWeight: 0, photoCount: 3, operator: '无害化中心 李伟' })
async function complete(taskId: string, quantity: number, weight: number) {
  await store.completeHarmlessTreatment({ taskId, method: form.method, processedQuantity: form.processedQuantity || quantity, processedWeight: form.processedWeight || weight, photoCount: form.photoCount, operator: form.operator })
  ElMessage.success('无害化处理已闭环')
}
</script>

<template>
  <section class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><strong>无害化处理任务</strong></template>
      <div v-for="task in store.data.harmlessTasks" :key="task.id" class="task-item large">
        <div>
          <b>{{ task.taskNo }}</b>
          <p>来源：{{ task.source }} · {{ task.reason }}</p>
          <p>数量 {{ task.quantity }} · 重量 {{ task.weight }}kg · {{ formatTime(task.createdAt) }}</p>
        </div>
        <div class="action-inline"><el-tag :type="task.status === 'completed' ? 'success' : 'warning'">{{ task.status === 'completed' ? '已完成' : '待处理' }}</el-tag><el-button size="small" type="success" :disabled="task.status === 'completed'" @click="complete(task.id, task.quantity, task.weight)">确认处理</el-button></div>
      </div>
      <el-empty v-if="!store.data.harmlessTasks.length" description="暂无无害化任务" />
    </el-card>
    <el-card class="panel-card">
      <template #header><strong>处理确认</strong></template>
      <el-form label-position="top">
        <el-form-item label="处理方式"><el-input v-model="form.method" /></el-form-item>
        <el-form-item label="处理数量"><el-input-number v-model="form.processedQuantity" :min="0" class="full-width" /></el-form-item>
        <el-form-item label="处理重量 kg"><el-input-number v-model="form.processedWeight" :min="0" class="full-width" /></el-form-item>
        <el-form-item label="照片数量"><el-input-number v-model="form.photoCount" :min="0" class="full-width" /></el-form-item>
        <el-form-item label="处理人"><el-input v-model="form.operator" /></el-form-item>
      </el-form>
    </el-card>
  </section>
</template>
