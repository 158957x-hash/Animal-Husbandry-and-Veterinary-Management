<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const router = useRouter()
const precheckVisible = ref(true)
const form = reactive({
  batchId: store.data.farmBatches[0]?.id ?? '',
  quantity: 60,
  destination: '皖北标准化屠宰中心',
  vehicleId: store.data.vehicles[0]?.id ?? '',
})

const selectedBatch = computed(() => store.data.farmBatches.find((item) => item.id === form.batchId))
const selectedVehicle = computed(() => store.data.vehicles.find((item) => item.id === form.vehicleId))
const previewChecks = computed(() => {
  const batch = selectedBatch.value
  const vehicle = selectedVehicle.value
  return [
    { label: '存栏', passed: Boolean(batch && batch.stock >= form.quantity), message: batch ? `当前 ${batch.stock}，申报 ${form.quantity}` : '请选择批次' },
    { label: '强制免疫', passed: Boolean(batch?.immuneQualified), message: batch?.immuneQualified ? '免疫合格' : '免疫不合格' },
    { label: '耳标', passed: Boolean(batch && form.quantity <= batch.earTagEnd - batch.earTagStart + 1), message: batch ? `${batch.earTagPrefix}-${batch.earTagStart} 起` : '请选择批次' },
    { label: '车辆备案', passed: Boolean(vehicle?.registered), message: vehicle?.registered ? `${vehicle.plateNo} 已备案` : '车辆未备案' },
    { label: '承运人备案', passed: Boolean(vehicle && !vehicle.blacklisted), message: vehicle && !vehicle.blacklisted ? vehicle.carrier : '命中黑名单' },
    { label: '定位设备', passed: Boolean(vehicle?.registered), message: vehicle?.registered ? '定位设备在线' : '定位设备未备案' },
    { label: '目的地信息', passed: Boolean(form.destination), message: form.destination || '目的地不能为空' },
  ]
})

async function submit() {
  const result = await store.submitOriginApplication(form)
  if (result.validationResults.every((item) => item.passed)) {
    ElMessage.success('产地检疫申报已提交')
    router.push(`/farmer/origin-detail/${result.id}`)
  } else {
    ElMessage.warning('申报已记录，但存在预警，请调整后重新申报')
  }
}
</script>

<template>
  <el-dialog v-model="precheckVisible" title="申报前自查提醒" width="620px">
    <div class="check-list">
      <div v-for="check in previewChecks" :key="check.label" class="check-row">
        <el-tag :type="check.passed ? 'success' : 'danger'">{{ check.passed ? '通过' : '待完善' }}</el-tag>
        <div><b>{{ check.label }}</b><p>{{ check.message }}</p></div>
      </div>
    </div>
    <template #footer><el-button type="success" @click="precheckVisible = false">我已知晓，继续申报</el-button></template>
  </el-dialog>
  <section class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><strong>产地检疫申报</strong></template>
      <el-form label-position="top">
        <el-form-item label="养殖批次">
          <el-select v-model="form.batchId" class="full-width">
            <el-option v-for="batch in store.data.farmBatches" :key="batch.id" :label="`${batch.farmName} / ${batch.animalType} / 存栏 ${batch.stock}`" :value="batch.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="申报数量">
          <el-input-number v-model="form.quantity" :min="1" :max="9999" class="full-width" />
        </el-form-item>
        <el-form-item label="目的屠宰场">
          <el-input v-model="form.destination" />
        </el-form-item>
        <el-form-item label="运输车辆">
          <el-select v-model="form.vehicleId" class="full-width">
            <el-option v-for="vehicle in store.data.vehicles" :key="vehicle.id" :label="`${vehicle.plateNo} / ${vehicle.carrier} / ${vehicle.channel}`" :value="vehicle.id" />
          </el-select>
        </el-form-item>
        <el-button type="success" size="large" class="full-width" @click="submit">提交产地检疫申报</el-button>
        <el-button plain class="full-width" style="margin: 12px 0 0" @click="precheckVisible = true">重新自查</el-button>
      </el-form>
    </el-card>

    <div class="stack">
      <el-card class="panel-card metric-card">
        <template #header><strong>批次信息</strong></template>
        <div v-if="selectedBatch" class="info-list">
          <p><span>养殖场</span><b>{{ selectedBatch.farmName }}</b></p>
          <p><span>动物品种</span><b>{{ selectedBatch.animalType }} / {{ selectedBatch.breed }}</b></p>
          <p><span>耳标段</span><b>{{ selectedBatch.earTagPrefix }} {{ selectedBatch.earTagStart }}-{{ selectedBatch.earTagEnd }}</b></p>
          <p><span>起运地</span><b>{{ selectedBatch.location }}</b></p>
        </div>
      </el-card>
      <el-card class="panel-card">
        <template #header><strong>自动校验预览</strong></template>
        <div class="check-list">
          <div v-for="check in previewChecks" :key="check.label" class="check-row">
            <el-tag :type="check.passed ? 'success' : 'danger'">{{ check.passed ? '通过' : '异常' }}</el-tag>
            <div><b>{{ check.label }}</b><p>{{ check.message }}</p></div>
          </div>
        </div>
      </el-card>
    </div>
  </section>
</template>
