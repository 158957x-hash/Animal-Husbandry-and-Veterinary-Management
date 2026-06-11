<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { statusText, statusType } from '../../domain/stateMachine'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const router = useRouter()
</script>

<template>
  <section class="stack">
    <el-card class="panel-card">
      <template #header><strong>产地检疫待办</strong></template>
      <el-table :data="store.data.originApplications" class="data-table">
        <el-table-column prop="applicationNo" label="申报编号" min-width="180" />
        <el-table-column prop="animalType" label="动物种类" width="110" />
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="destination" label="目的地" min-width="180" />
        <el-table-column label="状态" width="170">
          <template #default="scope">
            <el-tag :type="statusType[scope.row.status]">{{ statusText[scope.row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" min-width="180">
          <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="success" size="small" :disabled="scope.row.status !== 'submitted'" @click="router.push(`/vet/origin-inspection/${scope.row.id}`)">现场查验</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>
