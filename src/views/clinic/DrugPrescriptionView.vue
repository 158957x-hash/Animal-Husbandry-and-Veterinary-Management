<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const approvedInstitutions = computed(() => store.data.clinicInstitutions.filter((item) => item.status === 'approved'))
const approvedVets = computed(() => store.data.veterinarians.filter((item) => item.status === 'approved'))
const drugForm = reactive({ institutionId: '', drugName: '阿莫西林克拉维酸钾片', batchNo: 'DRUG202606', manufacturer: '安徽动物药业有限公司', approvalNo: '兽药字120102001', validTo: '2028-06-30', quantity: 80, supplier: '省级兽药配送中心', traceCode: 'TRACE-AH-DRUG-001' })
const prescriptionForm = reactive({ petId: '', diagnosis: '皮肤细菌感染', drugId: '', dosage: '每日两次，每次半片，连用 5 日', quantity: 6, veterinarianId: '' })

async function stockIn() {
  const institutionId = drugForm.institutionId || approvedInstitutions.value[0]?.id
  if (!institutionId) return ElMessage.warning('请先完成诊疗机构备案审核')
  await store.stockInDrug({ ...drugForm, institutionId })
  ElMessage.success('药品已入库')
}

async function issue() {
  const petId = prescriptionForm.petId || store.data.petProfiles[0]?.id
  const drugId = prescriptionForm.drugId || store.data.drugInventories[0]?.id
  const veterinarianId = prescriptionForm.veterinarianId || approvedVets.value[0]?.id
  if (!petId || !drugId || !veterinarianId) return ElMessage.warning('请先准备宠物、药品和备案通过兽医')
  try {
    await store.issuePrescription({ ...prescriptionForm, petId, drugId, veterinarianId })
    ElMessage.success('处方已开具，药品已自动出库')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '处方开具失败')
  }
}
</script>

<template>
  <div class="page-grid two-col">
    <div class="stack">
      <el-card class="panel-card">
        <template #header><b>药品入库</b></template>
        <el-form label-position="top">
          <el-form-item label="药品名称"><el-input v-model="drugForm.drugName" /></el-form-item>
          <el-form-item label="批号"><el-input v-model="drugForm.batchNo" /></el-form-item>
          <el-form-item label="生产企业"><el-input v-model="drugForm.manufacturer" /></el-form-item>
          <el-form-item label="批准文号"><el-input v-model="drugForm.approvalNo" /></el-form-item>
          <el-form-item label="有效期"><el-input v-model="drugForm.validTo" /></el-form-item>
          <el-form-item label="入库数量"><el-input-number v-model="drugForm.quantity" :min="1" class="full-width" /></el-form-item>
          <el-form-item label="供应商"><el-input v-model="drugForm.supplier" /></el-form-item>
          <el-form-item label="追溯码"><el-input v-model="drugForm.traceCode" /></el-form-item>
          <el-button type="success" class="full-width" @click="stockIn">药品入库</el-button>
        </el-form>
      </el-card>
      <el-card class="panel-card">
        <template #header><b>开具处方笺</b></template>
        <el-form label-position="top">
          <el-form-item label="宠物"><el-select v-model="prescriptionForm.petId" class="full-width"><el-option v-for="item in store.data.petProfiles" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
          <el-form-item label="诊断结果"><el-input v-model="prescriptionForm.diagnosis" /></el-form-item>
          <el-form-item label="药品"><el-select v-model="prescriptionForm.drugId" class="full-width"><el-option v-for="item in store.data.drugInventories" :key="item.id" :label="`${item.drugName} 库存${item.quantity}`" :value="item.id" /></el-select></el-form-item>
          <el-form-item label="用法用量"><el-input v-model="prescriptionForm.dosage" /></el-form-item>
          <el-form-item label="数量"><el-input-number v-model="prescriptionForm.quantity" :min="1" class="full-width" /></el-form-item>
          <el-form-item label="开方兽医"><el-select v-model="prescriptionForm.veterinarianId" class="full-width"><el-option v-for="item in approvedVets" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
          <el-button type="success" class="full-width" @click="issue">开具处方</el-button>
        </el-form>
      </el-card>
    </div>

    <div class="stack">
      <el-card class="panel-card"><template #header><b>药品库存</b></template><div v-for="item in store.data.drugInventories" :key="item.id" class="task-item"><b>{{ item.drugName }}</b><p>批号 {{ item.batchNo }}｜库存 {{ item.quantity }}｜{{ item.traceCode }}</p></div></el-card>
      <el-card class="panel-card"><template #header><b>处方与出库记录</b></template><div v-for="item in store.data.prescriptions" :key="item.id" class="task-item"><b>{{ item.prescriptionNo }}｜{{ item.drugName }}</b><p>{{ item.diagnosis }}｜数量 {{ item.quantity }}｜{{ item.dosage }}</p></div></el-card>
    </div>
  </div>
</template>
