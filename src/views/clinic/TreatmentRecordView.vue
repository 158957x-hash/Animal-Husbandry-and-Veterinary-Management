<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { TreatmentRecordInput } from '../../domain/models'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const consultationId = computed(() => route.params.id as string)
const consultation = computed(() => store.data.consultations.find((c) => c.id === consultationId.value))

const checkItemOptions = [
  '皮肤刮片镜检', '耳道分泌物镜检', '粪便检查', '血液常规', '血液生化',
  'X光检查', 'B超检查', '尿常规', '心电图', 'PCR检测',
  '细菌培养及药敏', '眼压检查', '荧光染色', '其他',
]

const form = ref<TreatmentRecordInput>({
  temperature: 38.5,
  weight: consultation.value?.weight || 0,
  mentalState: '',
  appetite: '',
  clinicalSymptoms: '',
  checkItems: '',
  checkResult: '',
  preliminaryDiagnosis: '',
  finalDiagnosis: '',
  treatmentOpinion: '',
  needFollowUp: false,
  followUpTime: '',
  medicalAdvice: '',
})

const submitting = ref(false)

onMounted(() => {
  if (consultation.value?.treatmentRecord) {
    form.value = { ...consultation.value.treatmentRecord }
  }
  if (consultation.value?.weight) {
    form.value.weight = consultation.value.weight
  }
})

async function submit() {
  if (!form.value.clinicalSymptoms) return ElMessage.warning('请填写临床症状')
  if (!form.value.preliminaryDiagnosis) return ElMessage.warning('请填写初步诊断')
  if (!form.value.treatmentOpinion) return ElMessage.warning('请填写处理意见')

  submitting.value = true
  try {
    await store.saveTreatmentRecord(consultationId.value, form.value)
    ElMessage.success('诊疗记录保存成功')
    router.push('/clinic/veterinarian/consultations')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/clinic/veterinarian/consultations')
}
</script>

<template>
  <div class="treatment-page">
    <div class="page-header-card">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft" link>返回</el-button>
        <h2>填写诊疗记录</h2>
      </div>
      <div class="header-right">
        <span class="consultation-no">{{ consultation?.consultationNo }}</span>
        <span class="pet-name">{{ consultation?.petName }}</span>
      </div>
    </div>

    <div v-if="consultation" class="card">
      <div class="card-title">基本信息</div>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="宠物名称">{{ consultation.petName }}</el-descriptions-item>
        <el-descriptions-item label="主人">{{ consultation.petOwnerName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ consultation.petOwnerPhone }}</el-descriptions-item>
        <el-descriptions-item label="接诊编号">{{ consultation.consultationNo }}</el-descriptions-item>
        <el-descriptions-item label="主诉">{{ consultation.chiefComplaint }}</el-descriptions-item>
        <el-descriptions-item label="初步症状" :span="3">{{ consultation.initialSymptoms }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-if="consultation" class="card">
      <div class="card-title">诊疗详情</div>
      <el-form :model="form" label-width="120px" label-position="right">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="体温" required>
              <el-input-number v-model="form.temperature" :min="35" :max="43" :precision="1" :step="0.1" style="width: 100%" />
              <span class="unit">℃</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="体重" required>
              <el-input-number v-model="form.weight" :min="0" :precision="1" :step="0.5" style="width: 100%" />
              <span class="unit">kg</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="精神状态">
              <el-select v-model="form.mentalState" placeholder="请选择" style="width: 100%">
                <el-option label="良好" value="良好" />
                <el-option label="一般" value="一般" />
                <el-option label="沉郁" value="沉郁" />
                <el-option label="嗜睡" value="嗜睡" />
                <el-option label="兴奋" value="兴奋" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="食欲情况">
              <el-select v-model="form.appetite" placeholder="请选择" style="width: 100%">
                <el-option label="正常" value="正常" />
                <el-option label="减退" value="减退" />
                <el-option label="废绝" value="废绝" />
                <el-option label="亢进" value="亢进" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="临床症状" required>
          <el-input v-model="form.clinicalSymptoms" type="textarea" :rows="3" placeholder="详细描述临床症状" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="检查项目">
              <el-select v-model="form.checkItems" placeholder="请选择检查项目" style="width: 100%" filterable>
                <el-option v-for="item in checkItemOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检查结果">
              <el-input v-model="form.checkResult" placeholder="检查结果描述" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="初步诊断" required>
              <el-input v-model="form.preliminaryDiagnosis" placeholder="初步诊断结果" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最终诊断">
              <el-input v-model="form.finalDiagnosis" placeholder="最终诊断结果" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="处理意见" required>
          <el-input v-model="form.treatmentOpinion" type="textarea" :rows="2" placeholder="诊疗处理方案" />
        </el-form-item>
        <el-form-item label="是否需要复诊">
          <el-switch v-model="form.needFollowUp" active-text="是" inactive-text="否" />
        </el-form-item>
        <el-form-item v-if="form.needFollowUp" label="复诊时间">
          <el-date-picker v-model="form.followUpTime" type="datetime" placeholder="请选择复诊时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" />
        </el-form-item>
        <el-form-item label="医嘱说明">
          <el-input v-model="form.medicalAdvice" type="textarea" :rows="2" placeholder="给宠物主人的医嘱建议" />
        </el-form-item>
      </el-form>
    </div>

    <div class="card">
      <el-button type="primary" size="large" :loading="submitting" @click="submit" style="width: 100%">保存诊疗记录</el-button>
    </div>
  </div>
</template>

<style scoped>
.treatment-page { display: flex; flex-direction: column; gap: 16px; max-width: 960px; margin: 0 auto; }
.page-header-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-header-card h2 { margin: 0; font-size: 18px; color: #1d2129; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-right { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #86909c; }
.consultation-no { font-weight: 500; color: #4e5969; }
.pet-name { color: #165dff; font-weight: 500; }
.card { background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.card-title { font-size: 15px; font-weight: 600; color: #1d2129; margin-bottom: 14px; border-left: 3px solid #165dff; padding-left: 10px; }
.unit { margin-left: 8px; color: #86909c; font-size: 13px; }
</style>