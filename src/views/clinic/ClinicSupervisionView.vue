<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const router = useRouter()
</script>

<template>
  <div class="page-grid">
    <div class="kpi-grid">
      <div class="kpi-card"><span>待审机构</span><b>{{ store.data.clinicInstitutions.filter((item) => item.status === 'pending').length }}</b></div>
      <div class="kpi-card"><span>待审兽医</span><b>{{ store.data.veterinarians.filter((item) => item.status === 'pending').length }}</b></div>
      <div class="kpi-card"><span>处方数量</span><b>{{ store.data.prescriptions.length }}</b></div>
      <div class="kpi-card"><span>废弃物待处理</span><b>{{ store.data.medicalWasteRecords.filter((item) => item.status === 'pending').length }}</b></div>
    </div>
    <el-card class="panel-card chain-card">
      <h2>监管人员工作台</h2>
      <p class="chain-status">同一监管人员角色，统一进入检疫监管与诊疗监管</p>
      <div class="flow-strip">
        <el-button type="success" @click="router.push('/regulator/dashboard')">检疫监管</el-button>
        <el-button type="success" @click="router.push('/regulator/clinic-supervision')">诊疗监管</el-button>
      </div>
    </el-card>
    <el-card class="panel-card">
      <template #header><b>诊疗监管事项</b></template>
      <div class="flow-strip">
        <el-button @click="router.push('/regulator/clinic-institutions')">机构备案审核</el-button>
        <el-button @click="router.push('/regulator/clinic-veterinarians')">兽医备案审核</el-button>
        <el-button @click="router.push('/regulator/clinic-reports')">年度报告查看</el-button>
        <el-button @click="router.push('/regulator/clinic-drug-supervision')">药品处方监管</el-button>
        <el-button @click="router.push('/regulator/clinic-waste-supervision')">废弃物监管</el-button>
      </div>
    </el-card>
  </div>
</template>
