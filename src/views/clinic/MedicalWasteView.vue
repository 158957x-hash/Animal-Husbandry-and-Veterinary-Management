<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import type { MedicalWasteRecord, WasteSourceBusinessType } from '../../domain/models'

const store = useAppStore()
const keyword = ref('')
const dialogVisible = ref(false)
const detailVisible = ref(false)
const completeVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const current = ref<MedicalWasteRecord>()
const records = computed(() => store.data.medicalWasteRecords.filter((item) => !keyword.value || item.wasteNo.includes(keyword.value) || item.type.includes(keyword.value) || item.disposalCompany.includes(keyword.value)))
const sourceOptions = computed(() => [
  ...store.data.immunizationLedgers.map((item) => ({ label: `免疫-${item.vaccineName}-${item.vaccineBatchNo}`, value: item.id, type: 'immunization' as WasteSourceBusinessType })),
  ...store.data.prescriptions.map((item) => ({ label: `处方-${item.prescriptionNo}-${item.drugName}`, value: item.id, type: 'prescription' as WasteSourceBusinessType })),
])
const form = reactive({ type: '疫苗瓶及注射器', sourceBusinessType: 'immunization' as WasteSourceBusinessType, sourceBusinessId: '', weight: 1.2, generatedAt: '2026-06-12T10:00:00.000Z', storageLocation: '诊疗中心医疗废弃物暂存柜', disposalCompany: '合肥绿安医疗废弃物处置有限公司', handoverPerson: '王护士' })
const completeForm = reactive({ handledAt: new Date().toISOString(), voucherNo: `WASTE-${Date.now()}` })

function setSource(idValue: string) {
  const option = sourceOptions.value.find((item) => item.value === idValue)
  if (option) form.sourceBusinessType = option.type
}

function openCreate() {
  const first = sourceOptions.value[0]
  Object.assign(form, { type: '疫苗瓶及注射器', sourceBusinessType: first?.type || 'immunization', sourceBusinessId: first?.value || '', weight: 1.2, generatedAt: new Date().toISOString(), storageLocation: '诊疗中心医疗废弃物暂存柜', disposalCompany: '合肥绿安医疗废弃物处置有限公司', handoverPerson: '王护士' })
  mode.value = 'create'
  current.value = undefined
  dialogVisible.value = true
}

function openEdit(row: MedicalWasteRecord) {
  if (row.status === 'handled') return ElMessage.warning('已处理记录不能编辑')
  Object.assign(form, row)
  mode.value = 'edit'
  current.value = row
  dialogVisible.value = true
}

function showDetail(row: MedicalWasteRecord) {
  current.value = row
  detailVisible.value = true
}

function openComplete(row: MedicalWasteRecord) {
  current.value = row
  Object.assign(completeForm, { handledAt: new Date().toISOString(), voucherNo: `WASTE-${Date.now()}` })
  completeVisible.value = true
}

async function save() {
  if (!form.type || !form.sourceBusinessId || form.weight <= 0 || !form.storageLocation || !form.disposalCompany || !form.handoverPerson) return ElMessage.warning('请填写废弃物类型、来源、重量、暂存位置、处理单位和交接人')
  if (mode.value === 'create') await store.createMedicalWaste({ ...form })
  else if (current.value) await store.updateMedicalWaste(current.value.id, { ...form })
  dialogVisible.value = false
  ElMessage.success(mode.value === 'create' ? '诊疗废弃物已登记' : '诊疗废弃物记录已保存')
}

async function complete() {
  if (!current.value || !completeForm.handledAt || !completeForm.voucherNo) return ElMessage.warning('请填写处理时间和处理凭证')
  await store.completeMedicalWaste({ wasteId: current.value.id, ...completeForm })
  completeVisible.value = false
  ElMessage.success('废弃物处理已完成')
}

async function voidRecord(row: MedicalWasteRecord) {
  const { value } = await ElMessageBox.prompt('请输入作废原因', `作废废弃物记录 ${row.wasteNo}`)
  await store.voidMedicalWaste(row.id, value || '废弃物记录作废')
  ElMessage.success('废弃物记录已作废')
}
</script>

<template>
  <div class="page-grid">
    <el-card class="panel-card">
      <div class="card-header-line">
        <div>
          <h2>诊疗废弃物处理</h2>
          <p>默认展示废弃物处理台账，新增登记、编辑待处理记录和处理完成均通过业务按钮办理。</p>
        </div>
        <div class="action-inline">
          <el-button @click="store.refresh()">刷新</el-button>
          <el-button type="success" @click="openCreate">登记废弃物</el-button>
        </div>
      </div>
      <div class="action-inline">
        <el-input v-model="keyword" placeholder="按编号、类型或处理单位筛选" clearable />
        <el-button>导出</el-button>
      </div>
    </el-card>

    <el-card class="panel-card">
      <template #header><b>废弃物处理台账</b></template>
      <el-table :data="records" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="wasteNo" label="业务编号" min-width="160" />
        <el-table-column prop="type" label="废弃物类型" min-width="150" />
        <el-table-column prop="weight" label="重量 kg" width="90" />
        <el-table-column prop="storageLocation" label="暂存位置" min-width="160" />
        <el-table-column prop="disposalCompany" label="处理单位" min-width="180" />
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'handled' ? 'success' : row.status === 'voided' ? 'info' : 'warning'">{{ row.status === 'handled' ? '已处理' : row.status === 'voided' ? '已作废' : '待处理' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="260"><template #default="{ row }"><el-button size="small" @click="showDetail(row)">查看</el-button><el-button v-if="row.status === 'pending'" size="small" @click="openEdit(row)">编辑</el-button><el-button v-if="row.status === 'pending'" size="small" type="success" @click="openComplete(row)">处理完成</el-button><el-button v-if="row.status === 'pending'" size="small" type="warning" @click="voidRecord(row)">作废</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="mode === 'create' ? '登记诊疗废弃物' : '编辑诊疗废弃物记录'" width="640px">
      <el-form label-position="top">
        <el-form-item label="废弃物类型"><el-input v-model="form.type" /></el-form-item>
        <el-form-item label="来源记录"><el-select v-model="form.sourceBusinessId" class="full-width" @change="setSource"><el-option v-for="item in sourceOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item label="数量/重量 kg"><el-input-number v-model="form.weight" :min="0.1" class="full-width" /></el-form-item>
        <el-form-item label="产生时间"><el-input v-model="form.generatedAt" /></el-form-item>
        <el-form-item label="暂存位置"><el-input v-model="form.storageLocation" /></el-form-item>
        <el-form-item label="处理单位"><el-input v-model="form.disposalCompany" /></el-form-item>
        <el-form-item label="交接人"><el-input v-model="form.handoverPerson" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="success" @click="save">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="completeVisible" title="完成废弃物处理" width="520px">
      <el-form label-position="top">
        <el-form-item label="处理时间"><el-input v-model="completeForm.handledAt" /></el-form-item>
        <el-form-item label="处理凭证编号"><el-input v-model="completeForm.voucherNo" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="completeVisible = false">取消</el-button><el-button type="success" @click="complete">确认完成</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="废弃物处理详情" width="560px">
      <div v-if="current" class="info-list">
        <p><span>编号</span><b>{{ current.wasteNo }}</b></p>
        <p><span>类型重量</span><b>{{ current.type }}｜{{ current.weight }}kg</b></p>
        <p><span>暂存位置</span><b>{{ current.storageLocation }}</b></p>
        <p><span>处理单位</span><b>{{ current.disposalCompany }}</b></p>
        <p><span>凭证</span><b>{{ current.voucherNo || '待上传' }}</b></p>
      </div>
    </el-dialog>
  </div>
</template>
