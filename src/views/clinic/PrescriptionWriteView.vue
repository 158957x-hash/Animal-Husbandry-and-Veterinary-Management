<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Delete, Plus } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { ConsultationPrescriptionInput, PrescriptionItem } from '../../domain/models'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const consultationId = computed(() => route.params.id as string)
const consultation = computed(() => store.data.consultations.find((c) => c.id === consultationId.value))

const drugKeyword = ref('')
const drugCategory = ref('')

const availableDrugs = computed(() => {
  let list = store.data.drugInventories.filter((d) => d.active && d.quantity > 0)
  if (drugKeyword.value) {
    const kw = drugKeyword.value.toLowerCase()
    list = list.filter((d) =>
      d.drugName.toLowerCase().includes(kw) ||
      d.batchNo.toLowerCase().includes(kw) ||
      d.approvalNo.toLowerCase().includes(kw) ||
      d.manufacturer.toLowerCase().includes(kw)
    )
  }
  return list
})

const recommendedDrugs = computed(() => {
  const diagnosis = consultation.value?.treatmentRecord?.finalDiagnosis || consultation.value?.treatmentRecord?.preliminaryDiagnosis || ''
  const diag = diagnosis.toLowerCase()
  if (diag.includes('感染') || diag.includes('炎')) {
    return availableDrugs.value.filter((d) =>
      d.drugName.includes('阿莫西林') || d.drugName.includes('头孢') || d.drugName.includes('甲硝唑')
    )
  }
  if (diag.includes('寄生虫') || diag.includes('螨') || diag.includes('虫')) {
    return availableDrugs.value.filter((d) =>
      d.drugName.includes('伊维菌素') || d.drugName.includes('驱虫')
    )
  }
  return []
})

const sortedDrugs = computed(() => {
  const recommended = recommendedDrugs.value
  const others = availableDrugs.value.filter((d) => !recommended.some((r) => r.id === d.id))
  return [...recommended, ...others]
})

const diagnosis = ref('')
const needDispensing = ref(true)
const drugItems = ref<PrescriptionItem[]>([])

const submitting = ref(false)

onMounted(() => {
  if (consultation.value?.treatmentRecord) {
    diagnosis.value = consultation.value.treatmentRecord.finalDiagnosis || consultation.value.treatmentRecord.preliminaryDiagnosis
  }
})

function addDrugItem() {
  drugItems.value.push({
    drugId: '',
    drugName: '',
    specification: '',
    batchNo: '',
    unit: '',
    currentStock: 9999,
    singleDose: '',
    frequency: '',
    days: 1,
    quantity: 1,
    administration: '',
    notes: '',
  })
}

function removeDrugItem(index: number) {
  drugItems.value.splice(index, 1)
}

function onDrugSelect(index: number, drugId: string) {
  const drug = store.data.drugInventories.find((d) => d.id === drugId)
  if (drug) {
    drugItems.value[index] = {
      ...drugItems.value[index],
      drugId: drug.id,
      drugName: drug.drugName,
      specification: drug.specification,
      batchNo: drug.batchNo,
      unit: drug.unit,
      currentStock: drug.quantity,
    }
    // Auto-recommend quantity
    if (recommendedDrugs.value.some((r) => r.id === drugId)) {
      drugItems.value[index].quantity = drug.quantity >= 10 ? 10 : drug.quantity
      drugItems.value[index].days = 7
      drugItems.value[index].frequency = 'BID（每日2次）'
      drugItems.value[index].administration = '口服'
    }
  }
}

function calculateQuantity(index: number) {
  const item = drugItems.value[index]
  if (item.days && item.singleDose) {
    item.quantity = item.days
  }
}

async function submit() {
  if (!diagnosis.value) return ElMessage.warning('请填写诊断结果')
  if (drugItems.value.length === 0) return ElMessage.warning('请至少添加一种药品')
  for (let i = 0; i < drugItems.value.length; i++) {
    const item = drugItems.value[i]
    if (!item.drugId) return ElMessage.warning(`药品${i + 1}：请选择药品`)
    if (!item.singleDose) return ElMessage.warning(`药品${i + 1}：请填写单次剂量`)
    if (!item.administration) return ElMessage.warning(`药品${i + 1}：请选择用药方式`)
  }

  const input: ConsultationPrescriptionInput = {
    consultationId: consultationId.value,
    diagnosis: diagnosis.value,
    items: drugItems.value,
    needDispensing: needDispensing.value,
  }

  submitting.value = true
  try {
    await store.createConsultationPrescription(input)
    if (needDispensing.value) {
      ElMessage.success('处方开具成功，已生成药品领用单')
      router.push(`/clinic/veterinarian/consultation/${consultationId.value}/requisition`)
    } else {
      ElMessage.success('处方开具成功')
      router.push('/clinic/veterinarian/consultations')
    }
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/clinic/veterinarian/consultations')
}

const freqOptions = ['QD（每日1次）', 'BID（每日2次）', 'TID（每日3次）', 'QID（每日4次）', 'QOD（隔日1次）', '单次', 'PRN（必要时）']
const adminOptions = ['口服', '皮下注射', '肌肉注射', '静脉注射', '外用', '滴眼', '滴耳', '直肠给药']
</script>

<template>
  <div class="prescription-page">
    <div class="page-header-card">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft" link>返回</el-button>
        <h2>开具处方笺</h2>
      </div>
      <div class="header-right">
        <span class="consultation-no">{{ consultation?.consultationNo }}</span>
        <span class="pet-name">{{ consultation?.petName }}</span>
      </div>
    </div>

    <!-- 关联诊疗记录 -->
    <div v-if="consultation" class="card">
      <div class="card-title">关联诊疗记录</div>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="接诊编号">{{ consultation.consultationNo }}</el-descriptions-item>
        <el-descriptions-item label="宠物主人">{{ consultation.petOwnerName }}</el-descriptions-item>
        <el-descriptions-item label="宠物名称">{{ consultation.petName }}</el-descriptions-item>
        <el-descriptions-item label="动物种类">{{ consultation.species }}</el-descriptions-item>
        <el-descriptions-item label="体重">{{ consultation.weight }} kg</el-descriptions-item>
        <el-descriptions-item label="初步诊断">{{ consultation.treatmentRecord?.preliminaryDiagnosis || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最终诊断">{{ consultation.treatmentRecord?.finalDiagnosis || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理意见">{{ consultation.treatmentRecord?.treatmentOpinion || '-' }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 处方信息 -->
    <div v-if="consultation" class="card">
      <div class="card-title">处方信息</div>
      <el-form label-width="100px" label-position="right">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="诊断结果" required>
              <el-input v-model="diagnosis" placeholder="基于诊疗记录确认诊断" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开方兽医">
              <el-input :model-value="consultation.veterinarianName" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="是否需要出药">
          <el-switch v-model="needDispensing" active-text="是（生成药品领用单）" inactive-text="否（无需出药）" />
        </el-form-item>
      </el-form>
    </div>

    <!-- 药品明细 -->
    <div v-if="consultation" class="card">
      <div class="card-title">
        <span>药品明细</span>
        <el-button type="primary" size="small" :icon="Plus" @click="addDrugItem" style="margin-left: auto">添加药品</el-button>
      </div>

      <div v-for="(item, index) in drugItems" :key="index" class="drug-item">
        <div class="drug-item-header">
          <span class="drug-index">药品 {{ index + 1 }}</span>
          <el-button type="danger" size="small" link :icon="Delete" @click="removeDrugItem(index)">删除</el-button>
        </div>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="选择药品" label-width="80px">
              <el-select :model-value="item.drugId" placeholder="请选择药品" filterable style="width: 100%" @change="(val: string) => onDrugSelect(index, val)">
                <el-option-group v-if="recommendedDrugs.length" label="推荐药品">
                  <el-option v-for="drug in recommendedDrugs" :key="drug.id" :label="`${drug.drugName} (库存: ${drug.quantity})`" :value="drug.id" />
                </el-option-group>
                <el-option-group label="全部药品">
                  <el-option v-for="drug in availableDrugs" :key="drug.id" :label="`${drug.drugName} (库存: ${drug.quantity})`" :value="drug.id" />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="规格" label-width="60px">
              <el-input :model-value="item.specification" disabled size="small" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="批号" label-width="60px">
              <el-input :model-value="item.batchNo" disabled size="small" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="单位" label-width="60px">
              <el-input :model-value="item.unit" disabled size="small" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="库存" label-width="60px">
              <el-input :model-value="item.currentStock" disabled size="small" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="单次剂量" label-width="80px">
              <el-input v-model="item.singleDose" placeholder="如 0.2ml" size="small" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="用药频次" label-width="80px">
              <el-select v-model="item.frequency" placeholder="请选择" size="small" style="width: 100%">
                <el-option v-for="f in freqOptions" :key="f" :label="f" :value="f" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="用药天数" label-width="80px">
              <el-input-number v-model="item.days" :min="1" :max="30" size="small" style="width: 100%" @change="calculateQuantity(index)" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="开药数量" label-width="80px">
              <el-input-number v-model="item.quantity" :min="1" :max="item.currentStock || 9999" size="small" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用药方式" label-width="80px">
              <el-select v-model="item.administration" placeholder="请选择用药方式" size="small" style="width: 100%">
                <el-option v-for="a in adminOptions" :key="a" :label="a" :value="a" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用药说明" label-width="80px">
              <el-input v-model="item.notes" placeholder="用药注意事项" size="small" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div v-if="drugItems.length === 0" class="empty-hint">
        请点击"添加药品"按钮添加处方药品
      </div>
    </div>

    <!-- Submit -->
    <div class="card">
      <el-button type="primary" size="large" :loading="submitting" @click="submit" style="width: 100%">开具处方笺</el-button>
    </div>
  </div>
</template>

<style scoped>
.prescription-page { display: flex; flex-direction: column; gap: 16px; max-width: 960px; margin: 0 auto; }
.page-header-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-header-card h2 { margin: 0; font-size: 18px; color: #1d2129; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-right { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #86909c; }
.consultation-no { font-weight: 500; color: #4e5969; }
.pet-name { color: #165dff; font-weight: 500; }
.card { background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.card-title { display: flex; align-items: center; font-size: 15px; font-weight: 600; color: #1d2129; margin-bottom: 14px; border-left: 3px solid #165dff; padding-left: 10px; }
.drug-item { border: 1px solid #e5e6eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.drug-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.drug-index { font-size: 14px; font-weight: 600; color: #165dff; }
.empty-hint { text-align: center; padding: 24px; color: #86909c; font-size: 13px; }
</style>