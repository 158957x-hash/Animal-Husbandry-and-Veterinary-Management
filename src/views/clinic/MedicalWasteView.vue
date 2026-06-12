<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const form = reactive({ type: '疫苗瓶及注射器', sourceBusinessType: 'immunization' as const, sourceBusinessId: '', weight: 1.2, generatedAt: '2026-06-12T10:00:00.000Z', storageLocation: '诊疗中心医疗废弃物暂存柜', disposalCompany: '合肥绿安医疗废弃物处置有限公司', handoverPerson: '王护士' })

async function createWaste() {
  const sourceBusinessId = form.sourceBusinessId || store.data.immunizationLedgers[0]?.id || store.data.prescriptions[0]?.id
  if (!sourceBusinessId) return ElMessage.warning('请先登记免疫或处方记录')
  await store.createMedicalWaste({ ...form, sourceBusinessId })
  ElMessage.success('诊疗废弃物已登记')
}

async function complete(id: string) {
  await store.completeMedicalWaste({ wasteId: id, handledAt: new Date().toISOString(), voucherNo: `WASTE-${Date.now()}` })
  ElMessage.success('废弃物处理已完成')
}
</script>

<template>
  <div class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><b>诊疗废弃物登记</b></template>
      <el-form label-position="top">
        <el-form-item label="废弃物类型"><el-input v-model="form.type" /></el-form-item>
        <el-form-item label="来源业务"><el-select v-model="form.sourceBusinessType" class="full-width"><el-option label="免疫记录" value="immunization" /><el-option label="处方记录" value="prescription" /></el-select></el-form-item>
        <el-form-item label="来源记录">
          <el-select v-model="form.sourceBusinessId" class="full-width">
            <el-option v-for="item in store.data.immunizationLedgers" :key="item.id" :label="`免疫-${item.vaccineName}`" :value="item.id" />
            <el-option v-for="item in store.data.prescriptions" :key="item.id" :label="`处方-${item.prescriptionNo}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量/重量 kg"><el-input-number v-model="form.weight" :min="0.1" class="full-width" /></el-form-item>
        <el-form-item label="产生时间"><el-input v-model="form.generatedAt" /></el-form-item>
        <el-form-item label="暂存位置"><el-input v-model="form.storageLocation" /></el-form-item>
        <el-form-item label="处理单位"><el-input v-model="form.disposalCompany" /></el-form-item>
        <el-form-item label="交接人"><el-input v-model="form.handoverPerson" /></el-form-item>
        <el-button type="success" class="full-width" @click="createWaste">登记废弃物</el-button>
      </el-form>
    </el-card>

    <el-card class="panel-card">
      <template #header><b>废弃物处理台账</b></template>
      <div v-for="item in store.data.medicalWasteRecords" :key="item.id" class="task-item large">
        <div>
          <b>{{ item.wasteNo }}｜{{ item.type }}</b>
          <p>{{ item.weight }}kg｜{{ item.storageLocation }}</p>
          <p>{{ item.disposalCompany }}｜凭证 {{ item.voucherNo || '待上传' }}</p>
        </div>
        <div class="action-inline">
          <el-tag :type="item.status === 'handled' ? 'success' : 'warning'">{{ item.status === 'handled' ? '已处理' : '待处理' }}</el-tag>
          <el-button v-if="item.status === 'pending'" size="small" type="success" @click="complete(item.id)">完成处理</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>
