<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const year = ref(new Date().getFullYear())
const approvedInstitutions = computed(() => store.data.clinicInstitutions.filter((item) => item.status === 'approved'))

async function generate(institutionId?: string) {
  const target = institutionId || approvedInstitutions.value[0]?.id
  if (!target) return ElMessage.warning('请先完成诊疗机构备案审核')
  await store.generateAnnualReport(target, year.value)
  ElMessage.success('年度报告已自动汇总')
}

async function submit(id: string) {
  await store.submitAnnualReport(id)
  ElMessage.success('年度报告已提交')
}
</script>

<template>
  <div class="page-grid">
    <el-card class="panel-card">
      <template #header><div class="card-header-line"><b>年度报告管理</b><el-button type="success" @click="generate()">自动汇总年度报告</el-button></div></template>
      <el-input-number v-model="year" :min="2020" :max="2035" />
    </el-card>
    <el-card v-for="item in store.data.annualReports" :key="item.id" class="panel-card">
      <div class="task-item large">
        <div>
          <b>{{ store.data.clinicInstitutions.find((clinic) => clinic.id === item.institutionId)?.name }}｜{{ item.year }} 年度报告</b>
          <p>兽医 {{ item.veterinarianCount }}｜宠物 {{ item.petCount }}｜免疫 {{ item.immunizationCount }}｜处方 {{ item.prescriptionCount }}</p>
          <p>入库 {{ item.drugStockInQuantity }}｜出库 {{ item.drugStockOutQuantity }}｜废弃物处理 {{ item.wasteHandledCount }}</p>
        </div>
        <div class="action-inline">
          <el-tag :type="item.status === 'submitted' ? 'success' : 'warning'">{{ item.status === 'submitted' ? '已提交' : '已生成' }}</el-tag>
          <el-button v-if="item.status === 'generated'" size="small" type="success" @click="submit(item.id)">提交报告</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>
