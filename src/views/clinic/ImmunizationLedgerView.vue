<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const approvedVets = computed(() => store.data.veterinarians.filter((item) => item.status === 'approved'))
const approvedInstitutions = computed(() => store.data.clinicInstitutions.filter((item) => item.status === 'approved'))
const form = reactive({ petId: '', vaccineName: '犬六联疫苗', vaccineBatchNo: 'VAC202606', immunizedAt: '2026-06-12', nextImmunizedAt: '2027-06-12', veterinarianId: '', institutionId: '' })

async function submit() {
  const petId = form.petId || store.data.petProfiles[0]?.id
  const veterinarianId = form.veterinarianId || approvedVets.value[0]?.id
  const institutionId = form.institutionId || approvedInstitutions.value[0]?.id
  if (!petId || !veterinarianId || !institutionId) return ElMessage.warning('请先完成宠物、兽医和机构备案数据')
  await store.createImmunizationRecord({ ...form, petId, veterinarianId, institutionId })
  ElMessage.success('免疫台账已登记')
}
</script>

<template>
  <div class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><b>免疫台账登记</b></template>
      <el-form label-position="top">
        <el-form-item label="宠物">
          <el-select v-model="form.petId" class="full-width"><el-option v-for="item in store.data.petProfiles" :key="item.id" :label="item.name" :value="item.id" /></el-select>
        </el-form-item>
        <el-form-item label="疫苗名称"><el-input v-model="form.vaccineName" /></el-form-item>
        <el-form-item label="疫苗批号"><el-input v-model="form.vaccineBatchNo" /></el-form-item>
        <el-form-item label="免疫日期"><el-input v-model="form.immunizedAt" /></el-form-item>
        <el-form-item label="下次免疫日期"><el-input v-model="form.nextImmunizedAt" /></el-form-item>
        <el-form-item label="接种兽医">
          <el-select v-model="form.veterinarianId" class="full-width"><el-option v-for="item in approvedVets" :key="item.id" :label="item.name" :value="item.id" /></el-select>
        </el-form-item>
        <el-form-item label="接种机构">
          <el-select v-model="form.institutionId" class="full-width"><el-option v-for="item in approvedInstitutions" :key="item.id" :label="item.name" :value="item.id" /></el-select>
        </el-form-item>
        <el-button type="success" class="full-width" @click="submit">登记免疫记录</el-button>
      </el-form>
    </el-card>

    <el-card class="panel-card">
      <template #header><b>宠物免疫台账</b></template>
      <div v-for="item in store.data.immunizationLedgers" :key="item.id" class="task-item large">
        <div>
          <b>{{ store.data.petProfiles.find((pet) => pet.id === item.petId)?.name }}｜{{ item.vaccineName }}</b>
          <p>批号：{{ item.vaccineBatchNo }}｜免疫日期：{{ item.immunizedAt }}</p>
          <p>下次免疫：{{ item.nextImmunizedAt }}｜接种兽医：{{ store.data.veterinarians.find((vet) => vet.id === item.veterinarianId)?.name }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>
