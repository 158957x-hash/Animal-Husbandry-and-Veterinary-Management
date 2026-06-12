<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const router = useRouter()
const currentYear = new Date().getFullYear()
const monthlyPrescriptions = computed(() => store.data.prescriptions.filter((item) => new Date(item.issuedAt).getMonth() === new Date().getMonth()).length)
const submittedReports = computed(() => store.data.annualReports.filter((item) => item.year === currentYear && item.status === 'submitted').length)
const reportRate = computed(() => {
  const approved = store.data.clinicInstitutions.filter((item) => item.status === 'approved').length
  return approved === 0 ? 0 : Math.round((submittedReports.value / approved) * 100)
})
</script>

<template>
  <div class="page-grid">
    <div class="kpi-grid">
      <div class="kpi-card"><span>诊疗机构</span><b>{{ store.data.clinicInstitutions.length }}</b></div>
      <div class="kpi-card"><span>执业兽医</span><b>{{ store.data.veterinarians.length }}</b></div>
      <div class="kpi-card"><span>宠物建档</span><b>{{ store.data.petProfiles.length }}</b></div>
      <div class="kpi-card"><span>本月处方</span><b>{{ monthlyPrescriptions }}</b></div>
      <div class="kpi-card"><span>报告提交率</span><b>{{ reportRate }}%</b></div>
      <div class="kpi-card"><span>废弃物待处理</span><b>{{ store.data.medicalWasteRecords.filter((item) => item.status === 'pending').length }}</b></div>
    </div>

    <el-card class="panel-card chain-card">
      <h2>动物诊疗管理数据流</h2>
      <div class="chain-flow">
        <span>机构备案</span>
        <span>兽医备案</span>
        <span>宠物建档</span>
        <span>免疫台账</span>
        <span>药品入库</span>
        <span>处方出库</span>
        <span>废弃物处理</span>
        <span>年度报告</span>
      </div>
    </el-card>

    <el-card class="panel-card">
      <template #header><div class="card-header-line"><b>快捷办理</b></div></template>
      <div class="flow-strip">
        <el-button type="success" @click="router.push('/clinic/admin/institutions')">机构备案</el-button>
        <el-button type="success" @click="router.push('/clinic/admin/veterinarians')">兽医备案</el-button>
        <el-button @click="router.push('/clinic/veterinarian/pets')">宠物建档</el-button>
        <el-button @click="router.push('/clinic/veterinarian/immunization')">免疫登记</el-button>
        <el-button @click="router.push('/clinic/veterinarian/prescriptions')">处方开具</el-button>
        <el-button @click="router.push('/clinic/admin/reports')">年度报告</el-button>
      </div>
    </el-card>
  </div>
</template>
