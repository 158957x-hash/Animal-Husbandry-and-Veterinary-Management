<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { ConsultationRecord } from '../../domain/models'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const consultationId = computed(() => route.params.id as string)
const consultation = computed(() => store.data.consultations.find((c) => c.id === consultationId.value))
const prescription = computed(() => {
  if (!consultation.value?.prescriptionId) return null
  return store.data.consultationPrescriptions.find((p) => p.id === consultation.value?.prescriptionId)
})

function getStatusTag(row: ConsultationRecord) {
  const map: Record<string, { type: string; label: string }> = {
    pending: { type: 'warning', label: '待接诊' },
    filling_record: { type: 'primary', label: '待填写诊疗记录' },
    pending_prescription: { type: 'primary', label: '待开方' },
    completed: { type: 'success', label: '已完成' },
  }
  return map[row.status] || { type: 'info', label: row.status }
}

function getDispensingTag(row: ConsultationRecord) {
  const map: Record<string, { type: string; label: string }> = {
    no_dispensing: { type: 'info', label: '无需出药' },
    pending_dispensing: { type: 'warning', label: '待出药' },
    dispensed: { type: 'success', label: '已出药' },
  }
  return map[row.dispensingStatus] || { type: 'info', label: row.dispensingStatus }
}

function goBack() {
  router.push('/clinic/veterinarian/consultations')
}
</script>

<template>
  <div class="detail-page">
    <div class="page-header-card">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft" link>返回</el-button>
        <h2>接诊详情</h2>
      </div>
      <div v-if="consultation" class="header-right">
        <el-tag :type="getStatusTag(consultation).type" size="small">{{ getStatusTag(consultation).label }}</el-tag>
        <el-tag :type="getDispensingTag(consultation).type" size="small">{{ getDispensingTag(consultation).label }}</el-tag>
      </div>
    </div>

    <div v-if="consultation" class="card">
      <div class="card-title">接诊信息</div>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="接诊编号">{{ consultation.consultationNo }}</el-descriptions-item>
        <el-descriptions-item label="接诊时间">{{ consultation.consultationTime ? new Date(consultation.consultationTime).toLocaleString('zh-CN') : '-' }}</el-descriptions-item>
        <el-descriptions-item label="接诊兽医">{{ consultation.veterinarianName }}</el-descriptions-item>
        <el-descriptions-item label="登记时间">{{ new Date(consultation.createdAt).toLocaleString('zh-CN') }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-if="consultation" class="card">
      <div class="card-title">宠物与主人信息</div>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="宠物名称">{{ consultation.petName }}</el-descriptions-item>
        <el-descriptions-item label="动物种类">{{ consultation.species }}</el-descriptions-item>
        <el-descriptions-item label="品种">{{ consultation.breed }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ consultation.gender }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ consultation.age }}岁</el-descriptions-item>
        <el-descriptions-item label="体重">{{ consultation.weight }} kg</el-descriptions-item>
        <el-descriptions-item label="主人">{{ consultation.petOwnerName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ consultation.petOwnerPhone }}</el-descriptions-item>
        <el-descriptions-item label="主诉" :span="2">{{ consultation.chiefComplaint }}</el-descriptions-item>
        <el-descriptions-item label="初步症状" :span="2">{{ consultation.initialSymptoms }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-if="consultation?.treatmentRecord" class="card">
      <div class="card-title">诊疗记录</div>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="体温">{{ consultation.treatmentRecord.temperature }}℃</el-descriptions-item>
        <el-descriptions-item label="体重">{{ consultation.treatmentRecord.weight }} kg</el-descriptions-item>
        <el-descriptions-item label="精神状态">{{ consultation.treatmentRecord.mentalState }}</el-descriptions-item>
        <el-descriptions-item label="食欲情况">{{ consultation.treatmentRecord.appetite }}</el-descriptions-item>
        <el-descriptions-item label="临床症状" :span="4">{{ consultation.treatmentRecord.clinicalSymptoms }}</el-descriptions-item>
        <el-descriptions-item label="检查项目">{{ consultation.treatmentRecord.checkItems }}</el-descriptions-item>
        <el-descriptions-item label="检查结果">{{ consultation.treatmentRecord.checkResult }}</el-descriptions-item>
        <el-descriptions-item label="初步诊断">{{ consultation.treatmentRecord.preliminaryDiagnosis }}</el-descriptions-item>
        <el-descriptions-item label="最终诊断">{{ consultation.treatmentRecord.finalDiagnosis }}</el-descriptions-item>
        <el-descriptions-item label="处理意见" :span="4">{{ consultation.treatmentRecord.treatmentOpinion }}</el-descriptions-item>
        <el-descriptions-item label="是否需要复诊">{{ consultation.treatmentRecord.needFollowUp ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="复诊时间">{{ consultation.treatmentRecord.followUpTime ? new Date(consultation.treatmentRecord.followUpTime).toLocaleString('zh-CN') : '-' }}</el-descriptions-item>
        <el-descriptions-item label="医嘱说明" :span="2">{{ consultation.treatmentRecord.medicalAdvice }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-if="prescription" class="card">
      <div class="card-title">处方笺</div>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="处方编号">{{ prescription.prescriptionNo }}</el-descriptions-item>
        <el-descriptions-item label="诊断结果">{{ prescription.diagnosis }}</el-descriptions-item>
        <el-descriptions-item label="开方兽医">{{ prescription.veterinarianName }}</el-descriptions-item>
        <el-descriptions-item label="开方时间">{{ new Date(prescription.createdAt).toLocaleString('zh-CN') }}</el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 12px;">
        <div class="sub-title">药品明细</div>
        <el-table :data="prescription.items" stripe size="small" style="width: 100%">
          <el-table-column prop="drugName" label="药品名称" width="180" />
          <el-table-column prop="batchNo" label="批号" width="140" />
          <el-table-column prop="singleDose" label="单次剂量" width="80" />
          <el-table-column prop="frequency" label="用药频次" width="120" />
          <el-table-column prop="days" label="用药天数" width="80" />
          <el-table-column prop="quantity" label="数量" width="60" />
          <el-table-column prop="administration" label="用药方式" width="100" />
          <el-table-column prop="notes" label="用药说明" min-width="160" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-page { display: flex; flex-direction: column; gap: 16px; max-width: 960px; margin: 0 auto; }
.page-header-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-header-card h2 { margin: 0; font-size: 18px; color: #1d2129; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-right { display: flex; align-items: center; gap: 8px; }
.card { background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.card-title { font-size: 15px; font-weight: 600; color: #1d2129; margin-bottom: 14px; border-left: 3px solid #165dff; padding-left: 10px; }
.sub-title { font-size: 14px; font-weight: 600; color: #4e5969; margin-bottom: 8px; }
</style>