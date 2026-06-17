<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Delete } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { DrugRequisitionItem } from '../../domain/models'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const consultationId = computed(() => route.params.id as string)
const consultation = computed(() => store.data.consultations.find((c) => c.id === consultationId.value))

const requisition = computed(() => {
  if (!consultation.value?.prescriptionId) return null
  return store.data.drugRequisitions.find((r) => r.prescriptionId === consultation.value?.prescriptionId)
})

const prescription = computed(() => {
  if (!consultation.value?.prescriptionId) return null
  return store.data.consultationPrescriptions.find((p) => p.id === consultation.value?.prescriptionId)
})

const items = ref<DrugRequisitionItem[]>([])

onMounted(() => {
  if (requisition.value) {
    items.value = requisition.value.items.map((item) => ({ ...item }))
  }
})

function removeItem(index: number) {
  items.value.splice(index, 1)
}

function validateItems() {
  for (const item of items.value) {
    if (item.quantity <= 0) return false
  }
  return items.value.length > 0
}

const submitting = ref(false)

async function confirmAndSubmit() {
  if (!requisition.value) return ElMessage.warning('领用单不存在')
  if (!validateItems()) return ElMessage.warning('请确保所有药品数量大于0，且至少保留一种药品')

  submitting.value = true
  try {
    await store.confirmDrugRequisition(requisition.value.id, items.value)
    ElMessage.success('药品领用单已确认并提交至诊疗机构')
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
  <div class="requisition-page">
    <div class="page-header-card">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft" link>返回</el-button>
        <h2>确认药品领用单</h2>
      </div>
      <div class="header-right">
        <span class="no">{{ requisition?.requisitionNo }}</span>
        <span class="pet-name">{{ requisition?.petName }}</span>
      </div>
    </div>

    <!-- 处方信息 -->
    <div v-if="prescription" class="card">
      <div class="card-title">处方信息</div>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="处方编号">{{ prescription.prescriptionNo }}</el-descriptions-item>
        <el-descriptions-item label="接诊编号">{{ prescription.consultationNo }}</el-descriptions-item>
        <el-descriptions-item label="宠物主人">{{ prescription.petOwnerName }}</el-descriptions-item>
        <el-descriptions-item label="宠物名称">{{ prescription.petName }}</el-descriptions-item>
        <el-descriptions-item label="诊断结果">{{ prescription.diagnosis }}</el-descriptions-item>
        <el-descriptions-item label="开方兽医">{{ prescription.veterinarianName }}</el-descriptions-item>
        <el-descriptions-item label="开方时间">{{ new Date(prescription.createdAt).toLocaleString('zh-CN') }}</el-descriptions-item>
        <el-descriptions-item label="领用单号">{{ requisition?.requisitionNo }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 药品领用明细 -->
    <div v-if="items.length" class="card">
      <div class="card-title">
        <span>药品领用明细（可编辑数量，可移除药品）</span>
      </div>

      <el-table :data="items" stripe style="width: 100%">
        <el-table-column prop="drugName" label="药品名称" width="180" />
        <el-table-column prop="specification" label="规格" width="140" />
        <el-table-column prop="batchNo" label="批号" width="140" />
        <el-table-column prop="currentStock" label="当前库存" width="80" />
        <el-table-column prop="singleDose" label="单次剂量" width="80" />
        <el-table-column prop="frequency" label="用药频次" width="120" />
        <el-table-column prop="days" label="用药天数" width="80" />
        <el-table-column label="出药数量" width="120">
          <template #default="{ row, $index }">
            <el-input-number v-model="row.quantity" :min="1" :max="row.currentStock" size="small" style="width: 100px" />
          </template>
        </el-table-column>
        <el-table-column prop="administration" label="用药方式" width="100" />
        <el-table-column prop="notes" label="用药说明" min-width="160" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ $index }">
            <el-button type="danger" size="small" link :icon="Delete" @click="removeItem($index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-else class="card">
      <div class="empty-hint">暂无药品领用明细</div>
    </div>

    <!-- Submit -->
    <div class="card">
      <el-button type="primary" size="large" :loading="submitting" @click="confirmAndSubmit" :disabled="!items.length" style="width: 100%">
        确认领用单并提交至诊疗机构
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.requisition-page { display: flex; flex-direction: column; gap: 16px; max-width: 960px; margin: 0 auto; }
.page-header-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-header-card h2 { margin: 0; font-size: 18px; color: #1d2129; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-right { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #86909c; }
.no { font-weight: 500; color: #4e5969; }
.pet-name { color: #165dff; font-weight: 500; }
.card { background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.card-title { display: flex; align-items: center; font-size: 15px; font-weight: 600; color: #1d2129; margin-bottom: 14px; border-left: 3px solid #165dff; padding-left: 10px; }
.empty-hint { text-align: center; padding: 24px; color: #86909c; font-size: 13px; }
</style>