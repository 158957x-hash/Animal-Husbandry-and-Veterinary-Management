<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const filters = reactive({ certificateNo: '', animalType: '', plateNo: '', issuedBy: '', destination: '' })
const rows = computed(() => store.data.quarantineCertificates.filter((item) => {
  return (!filters.certificateNo || item.certificateNo.includes(filters.certificateNo))
    && (!filters.animalType || item.animalType === filters.animalType)
    && (!filters.plateNo || item.vehiclePlateNo.includes(filters.plateNo))
    && (!filters.issuedBy || item.issuedBy.includes(filters.issuedBy))
    && (!filters.destination || item.destination.includes(filters.destination))
}))
</script>

<template>
  <section class="stack">
    <el-card class="panel-card">
      <template #header><strong>产地检疫证明抽查</strong></template>
      <el-form :inline="true">
        <el-form-item label="证明编号"><el-input v-model="filters.certificateNo" clearable /></el-form-item>
        <el-form-item label="动物种类"><el-input v-model="filters.animalType" clearable /></el-form-item>
        <el-form-item label="车牌号"><el-input v-model="filters.plateNo" clearable /></el-form-item>
        <el-form-item label="官方兽医"><el-input v-model="filters.issuedBy" clearable /></el-form-item>
        <el-form-item label="目的地"><el-input v-model="filters.destination" clearable /></el-form-item>
        <el-button type="success">导出抽查结果</el-button>
      </el-form>
      <el-table :data="rows">
        <el-table-column prop="certificateNo" label="证明编号" min-width="190" />
        <el-table-column prop="animalType" label="动物种类" width="110" />
        <el-table-column prop="vehiclePlateNo" label="车牌号" width="130" />
        <el-table-column prop="issuedBy" label="官方兽医" width="140" />
        <el-table-column prop="destination" label="目的地" min-width="180" />
        <el-table-column label="出证时间" width="190"><template #default="scope">{{ formatTime(scope.row.validFrom) }}</template></el-table-column>
        <el-table-column label="证明状态" width="110"><template #default="scope"><el-tag :type="new Date(scope.row.validTo) > new Date() ? 'success' : 'danger'">{{ new Date(scope.row.validTo) > new Date() ? '有效' : '失效' }}</el-tag></template></el-table-column>
      </el-table>
    </el-card>
  </section>
</template>
