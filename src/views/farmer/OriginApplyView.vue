<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const editingId = computed(() => route.params.id as string | undefined)
const editingApplication = computed(() => editingId.value ? store.data.originApplications.find((item) => item.id === editingId.value) : undefined)
const form = reactive({
  batchId: store.data.farmBatches[0]?.id ?? '',
  quantity: 60,
  destination: '皖北标准化屠宰中心',
  destinationAddress: '安徽省亳州市利辛县屠宰加工园区 1 号',
  purpose: 'slaughter' as const,
  departureTime: '2026-06-13T08:00:00.000Z',
  contactPerson: '王场长',
  contactPhone: '13900002222',
  remark: '',
  vehicleId: store.data.vehicles[0]?.id ?? '',
})

watch(editingApplication, (value) => {
  if (value) Object.assign(form, { batchId: value.batchId, quantity: value.quantity, destination: value.destination, destinationAddress: value.destinationAddress, purpose: value.purpose, departureTime: value.departureTime, contactPerson: value.contactPerson, contactPhone: value.contactPhone, remark: value.remark || '', vehicleId: value.vehicleId })
}, { immediate: true })

const selectedBatch = computed(() => store.data.farmBatches.find((item) => item.id === form.batchId))
const selectedVehicle = computed(() => store.data.vehicles.find((item) => item.id === form.vehicleId))
const previewChecks = computed(() => {
  const batch = selectedBatch.value
  const vehicle = selectedVehicle.value
  return [
    { label: '存栏校验', passed: Boolean(batch && batch.stock >= form.quantity), message: batch ? `当前存栏 ${batch.stock}，申报 ${form.quantity}` : '请选择批次', basis: '根据养殖批次当前存栏与本次申报数量比对。' },
    { label: '强制免疫', passed: Boolean(batch?.immuneQualified), message: batch?.immuneQualified ? '免疫记录在有效期内' : '免疫不合格', basis: '读取批次免疫合格标识，未合格批次提交后会产生预警。' },
    { label: '耳标状态', passed: Boolean(batch && form.quantity <= batch.earTagEnd - batch.earTagStart + 1), message: batch ? `耳标 ${batch.earTagPrefix}-${batch.earTagStart} 至 ${batch.earTagStart + form.quantity - 1} 可用` : '请选择批次', basis: '按批次耳标起止号段校验是否覆盖本次数量。' },
    { label: '车辆备案', passed: Boolean(vehicle?.registered), message: vehicle?.registered ? `${vehicle.plateNo} 已备案` : '车辆未备案', basis: '读取车辆基础备案状态。' },
    { label: '承运人备案', passed: Boolean(vehicle && !vehicle.blacklisted), message: vehicle && !vehicle.blacklisted ? `${vehicle.carrier} 已备案` : '命中黑名单', basis: '根据承运车辆绑定承运人及黑名单状态校验。' },
    { label: '目的地备案', passed: Boolean(form.destination && form.destinationAddress), message: form.destination && form.destinationAddress ? `${form.destination}已备案` : '目的地和详细地址不能为空', basis: '核验目的地名称和详细地址是否填写完整。' },
    { label: '定位设备状态', passed: Boolean(vehicle?.registered), message: vehicle?.registered ? '定位设备在线' : '定位设备未备案', basis: '核验运输车辆定位设备备案和在线状态。' },
  ]
})

const hasPrecheckError = computed(() => previewChecks.value.some((item) => !item.passed))

function validateForm() {
  if (!form.batchId || !form.vehicleId || !form.destination || !form.destinationAddress || !form.purpose || !form.departureTime || !form.contactPerson || !form.contactPhone || form.quantity <= 0) {
    ElMessage.warning('请填写养殖批次、申报数量、检疫用途、启运时间、联系人、联系电话、目的地和运输车辆')
    return false
  }
  return true
}

async function saveDraft() {
  if (!validateForm()) return
  const result = editingApplication.value ? await store.updateOriginDraft(editingApplication.value.id, { ...form }) : await store.saveOriginDraft({ ...form })
  ElMessage.success('申报草稿已保存')
  router.push('/farmer/origin-applications')
  return result
}

async function submit() {
  if (!validateForm()) return
  if (hasPrecheckError.value) return ElMessage.error('申报前自查存在异常，请整改后再提交')
  let result
  if (editingApplication.value?.status === 'rejected') result = await store.resubmitRejectedOriginApplication(editingApplication.value.id, { ...form })
  else if (editingApplication.value?.status === 'draft') result = await store.submitOriginDraft(editingApplication.value.id)
  else result = await store.submitOriginApplication({ ...form })
  ElMessage.success(editingApplication.value?.status === 'rejected' ? '申报已重新提交' : '产地检疫申报已提交')
  router.push(`/farmer/origin-detail/${result.id}`)
}
</script>

<template>
  <section class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><strong>{{ editingApplication ? editingApplication.status === 'rejected' ? '编辑后重新提交产地检疫申报' : '编辑产地检疫申报草稿' : '新增产地检疫申报' }}</strong></template>
      <el-alert v-if="editingApplication?.status === 'rejected'" type="error" :closable="false" :title="`驳回原因：${editingApplication.rejectReason || '未填写'}`" />
      <el-form label-position="top" style="margin-top: 12px">
        <el-form-item label="养殖批次">
          <el-select v-model="form.batchId" class="full-width">
            <el-option v-for="batch in store.data.farmBatches" :key="batch.id" :label="`${batch.farmName} / ${batch.animalType} / 存栏 ${batch.stock}`" :value="batch.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="申报数量"><el-input-number v-model="form.quantity" :min="1" :max="9999" class="full-width" /></el-form-item>
        <el-form-item label="检疫用途">
          <el-select v-model="form.purpose" class="full-width">
            <el-option label="屠宰" value="slaughter" />
            <el-option label="继续饲养" value="breeding" />
            <el-option label="交易" value="trade" />
            <el-option label="展示" value="exhibition" />
          </el-select>
        </el-form-item>
        <el-form-item label="启运时间"><el-input v-model="form.departureTime" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="form.contactPerson" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.contactPhone" /></el-form-item>
        <el-form-item label="目的地"><el-input v-model="form.destination" /></el-form-item>
        <el-form-item label="目的地详细地址"><el-input v-model="form.destinationAddress" /></el-form-item>
        <el-form-item label="运输车辆">
          <el-select v-model="form.vehicleId" class="full-width">
            <el-option v-for="vehicle in store.data.vehicles" :key="vehicle.id" :label="`${vehicle.plateNo} / ${vehicle.carrier} / ${vehicle.channel}`" :value="vehicle.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="承运人"><el-input :model-value="selectedVehicle?.carrier || ''" disabled /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
        <div class="action-inline">
          <el-button @click="router.push('/farmer/origin-applications')">返回列表</el-button>
          <el-button @click="saveDraft">保存草稿</el-button>
          <el-button :disabled="hasPrecheckError" type="success" @click="submit">提交申报</el-button>
        </div>
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
        <template #header><div class="card-header-line"><strong>申报前自查清单</strong><el-button size="small" @click="store.refresh()">重新自查</el-button></div></template>
        <el-alert v-if="hasPrecheckError" type="error" :closable="false" title="存在自查异常，系统不会提交到官方兽医待办，请先整改异常项。" style="margin-bottom: 12px" />
        <div class="check-list">
          <div v-for="check in previewChecks" :key="check.label" class="check-row">
            <el-tag :type="check.passed ? 'success' : 'danger'">{{ check.passed ? '通过' : '异常' }}</el-tag>
            <div><b>{{ check.label }}：{{ check.message }}</b><p>{{ check.basis }}</p></div>
          </div>
        </div>
      </el-card>
    </div>
  </section>
</template>
