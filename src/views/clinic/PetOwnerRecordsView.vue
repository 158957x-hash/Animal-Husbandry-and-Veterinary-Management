<script setup lang="ts">
import { useAppStore } from '../../stores/app'

const store = useAppStore()
</script>

<template>
  <div class="farmer-modern-page page-grid">
    <el-card class="gov-compact-card chain-card">
      <h2>宠物主人档案</h2>
      <p class="chain-status">查看宠物档案、免疫台账和处方记录</p>
    </el-card>
    <el-card class="gov-compact-card">
      <template #header><b>我的宠物</b></template>
      <div v-for="pet in store.data.petProfiles" :key="pet.id" class="task-item large">
        <div>
          <b>{{ pet.name }}｜{{ pet.species }}</b>
          <p>{{ pet.breed }}｜{{ pet.gender }}｜{{ pet.age }} 岁｜{{ pet.identityNo }}</p>
          <p>主人：{{ store.data.petOwners.find((item) => item.id === pet.ownerId)?.name }}</p>
        </div>
      </div>
    </el-card>
    <el-card class="gov-compact-card">
      <template #header><b>免疫台账</b></template>
      <div v-for="item in store.data.immunizationLedgers" :key="item.id" class="task-item"><b>{{ item.vaccineName }}</b><p>{{ item.immunizedAt }} 接种，下次 {{ item.nextImmunizedAt }}</p></div>
    </el-card>
    <el-card class="gov-compact-card">
      <template #header><b>处方记录</b></template>
      <div v-for="item in store.data.prescriptions" :key="item.id" class="task-item"><b>{{ item.prescriptionNo }}｜{{ item.drugName }}</b><p>{{ item.diagnosis }}｜{{ item.dosage }}</p></div>
    </el-card>
  </div>
</template>
