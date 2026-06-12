<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import type { DrugInventory, Prescription } from '../../domain/models'

const store = useAppStore()
const keyword = ref('')
const stockDialog = ref(false)
const drugEditDialog = ref(false)
const prescriptionDialog = ref(false)
const detailVisible = ref(false)
const currentDrug = ref<DrugInventory>()
const currentPrescription = ref<Prescription>()
const approvedInstitutions = computed(() => store.data.clinicInstitutions.filter((item) => item.status === 'approved' && item.active))
const approvedVets = computed(() => store.data.veterinarians.filter((item) => item.status === 'approved' && item.active))
const drugs = computed(() => store.data.drugInventories.filter((item) => !keyword.value || item.drugName.includes(keyword.value) || item.batchNo.includes(keyword.value)))
const prescriptions = computed(() => store.data.prescriptions.filter((item) => !keyword.value || item.prescriptionNo.includes(keyword.value) || item.drugName.includes(keyword.value)))
const drugForm = reactive({ institutionId: '', drugName: '阿莫西林克拉维酸钾片', batchNo: 'DRUG202606', manufacturer: '安徽动物药业有限公司', approvalNo: '兽药字120102001', validTo: '2028-06-30', quantity: 80, supplier: '省级兽药配送中心', traceCode: 'TRACE-AH-DRUG-001' })
const drugEditForm = reactive({ institutionId: '', drugName: '', batchNo: '', manufacturer: '', approvalNo: '', validTo: '', supplier: '', traceCode: '' })
const prescriptionForm = reactive({ petId: '', diagnosis: '皮肤细菌感染', drugId: '', dosage: '每日两次，每次半片，连用 5 日', quantity: 6, veterinarianId: '' })

function openStock() {
  Object.assign(drugForm, { institutionId: approvedInstitutions.value[0]?.id || '', drugName: '阿莫西林克拉维酸钾片', batchNo: `DRUG${Date.now().toString().slice(-6)}`, manufacturer: '安徽动物药业有限公司', approvalNo: '兽药字120102001', validTo: '2028-06-30', quantity: 80, supplier: '省级兽药配送中心', traceCode: `TRACE-${Date.now().toString().slice(-6)}` })
  stockDialog.value = true
}

function openDrugEdit(row: DrugInventory) {
  currentDrug.value = row
  Object.assign(drugEditForm, row)
  drugEditDialog.value = true
}

function openPrescription() {
  Object.assign(prescriptionForm, { petId: store.data.petProfiles.find((item) => item.active)?.id || '', diagnosis: '皮肤细菌感染', drugId: store.data.drugInventories.find((item) => item.active && item.quantity > 0)?.id || '', dosage: '每日两次，每次半片，连用 5 日', quantity: 6, veterinarianId: approvedVets.value[0]?.id || '' })
  prescriptionDialog.value = true
}

function showPrescription(row: Prescription) {
  currentPrescription.value = row
  detailVisible.value = true
}

async function stockIn() {
  if (!drugForm.institutionId || !drugForm.drugName || !drugForm.batchNo || drugForm.quantity <= 0) return ElMessage.warning('请填写机构、药品名称、批号和入库数量')
  await store.stockInDrug({ ...drugForm })
  stockDialog.value = false
  ElMessage.success('药品已入库')
}

async function saveDrug() {
  if (!currentDrug.value || !drugEditForm.drugName || !drugEditForm.batchNo || !drugEditForm.institutionId) return ElMessage.warning('请填写药品名称、批号和所属机构')
  await store.updateDrugInventory(currentDrug.value.id, { ...drugEditForm })
  drugEditDialog.value = false
  ElMessage.success('药品基础信息已保存')
}

async function disableDrug(row: DrugInventory) {
  await ElMessageBox.confirm(`确认停用 ${row.drugName}？停用后不能用于新增处方。`, '停用确认')
  await store.disableDrugInventory(row.id)
  ElMessage.success('药品已停用')
}

async function issue() {
  if (!prescriptionForm.petId || !prescriptionForm.drugId || !prescriptionForm.veterinarianId) return ElMessage.warning('请填写宠物、药品和开方兽医')
  try {
    await store.issuePrescription({ ...prescriptionForm })
    prescriptionDialog.value = false
    ElMessage.success('处方已开具，药品已自动出库')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '处方开具失败')
  }
}

async function voidRow(row: Prescription) {
  const { value } = await ElMessageBox.prompt('请输入作废原因', `作废处方 ${row.prescriptionNo}`)
  await store.voidPrescription(row.id, value || '处方作废确认')
  ElMessage.success('处方已作废，库存已回补并生成冲销记录')
}
</script>

<template>
  <div class="page-grid">
    <el-card class="panel-card"><div class="card-header-line"><div><h2>药品库存与处方笺</h2><p>药品库存列表和处方列表默认展示，入库与开方通过弹窗办理；处方生效后自动出库。</p></div><div class="action-inline"><el-button @click="store.refresh()">刷新</el-button><el-button @click="openStock">药品入库</el-button><el-button type="success" @click="openPrescription">新增处方</el-button></div></div><div class="action-inline"><el-input v-model="keyword" placeholder="按药品、批号、处方编号筛选" clearable /><el-button>导出</el-button></div></el-card>
    <div class="page-grid two-col">
      <el-card class="panel-card"><template #header><b>药品库存列表</b></template><el-table :data="drugs" stripe><el-table-column type="index" label="序号" width="70" /><el-table-column prop="drugName" label="药品名称" min-width="160" /><el-table-column prop="batchNo" label="批号" /><el-table-column prop="quantity" label="库存" width="90" /><el-table-column prop="validTo" label="有效期" /><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.active ? 'success' : 'info'">{{ row.active ? '启用' : '停用' }}</el-tag></template></el-table-column><el-table-column label="操作" width="170"><template #default="{ row }"><el-button size="small" @click="openDrugEdit(row)">编辑</el-button><el-button v-if="row.active" size="small" type="warning" @click="disableDrug(row)">停用</el-button></template></el-table-column></el-table></el-card>
      <el-card class="panel-card"><template #header><b>处方笺列表</b></template><el-table :data="prescriptions" stripe><el-table-column type="index" label="序号" width="70" /><el-table-column prop="prescriptionNo" label="处方编号" min-width="150" /><el-table-column prop="drugName" label="药品" /><el-table-column prop="quantity" label="数量" width="80" /><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'voided' ? 'info' : 'success'">{{ row.status === 'voided' ? '已作废' : '已生效' }}</el-tag></template></el-table-column><el-table-column label="操作" width="180"><template #default="{ row }"><el-button size="small" @click="showPrescription(row)">查看</el-button><el-button v-if="row.status !== 'voided'" size="small" type="warning" @click="voidRow(row)">作废</el-button></template></el-table-column></el-table></el-card>
    </div>
    <el-card class="panel-card"><template #header><b>药品入出库记录</b></template><el-table :data="store.data.drugInOutRecords" stripe><el-table-column type="index" label="序号" width="70" /><el-table-column label="类型" width="100"><template #default="{ row }">{{ row.type === 'in' ? '入库' : row.type === 'out' ? '出库' : '冲销' }}</template></el-table-column><el-table-column prop="drugName" label="药品" /><el-table-column prop="quantity" label="数量" /><el-table-column prop="operator" label="操作人" /><el-table-column prop="createdAt" label="时间" /></el-table></el-card>
    <el-dialog v-model="stockDialog" title="药品入库" width="620px"><el-form label-position="top"><el-form-item label="入库机构"><el-select v-model="drugForm.institutionId" class="full-width"><el-option v-for="item in approvedInstitutions" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item><el-form-item label="药品名称"><el-input v-model="drugForm.drugName" /></el-form-item><el-form-item label="批号"><el-input v-model="drugForm.batchNo" /></el-form-item><el-form-item label="生产企业"><el-input v-model="drugForm.manufacturer" /></el-form-item><el-form-item label="批准文号"><el-input v-model="drugForm.approvalNo" /></el-form-item><el-form-item label="有效期"><el-input v-model="drugForm.validTo" /></el-form-item><el-form-item label="入库数量"><el-input-number v-model="drugForm.quantity" :min="1" class="full-width" /></el-form-item><el-form-item label="供应商"><el-input v-model="drugForm.supplier" /></el-form-item><el-form-item label="追溯码"><el-input v-model="drugForm.traceCode" /></el-form-item></el-form><template #footer><el-button @click="stockDialog = false">取消</el-button><el-button type="success" @click="stockIn">保存</el-button></template></el-dialog>
    <el-dialog v-model="drugEditDialog" title="编辑药品基础信息" width="620px"><el-form label-position="top"><el-form-item label="所属机构"><el-select v-model="drugEditForm.institutionId" class="full-width"><el-option v-for="item in approvedInstitutions" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item><el-form-item label="药品名称"><el-input v-model="drugEditForm.drugName" /></el-form-item><el-form-item label="批号"><el-input v-model="drugEditForm.batchNo" /></el-form-item><el-form-item label="生产企业"><el-input v-model="drugEditForm.manufacturer" /></el-form-item><el-form-item label="批准文号"><el-input v-model="drugEditForm.approvalNo" /></el-form-item><el-form-item label="有效期"><el-input v-model="drugEditForm.validTo" /></el-form-item><el-form-item label="供应商"><el-input v-model="drugEditForm.supplier" /></el-form-item><el-form-item label="追溯码"><el-input v-model="drugEditForm.traceCode" /></el-form-item></el-form><template #footer><el-button @click="drugEditDialog = false">取消</el-button><el-button type="success" @click="saveDrug">保存</el-button></template></el-dialog>
    <el-dialog v-model="prescriptionDialog" title="新增处方笺" width="620px"><el-form label-position="top"><el-form-item label="宠物"><el-select v-model="prescriptionForm.petId" class="full-width"><el-option v-for="item in store.data.petProfiles.filter((pet) => pet.active)" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item><el-form-item label="诊断结果"><el-input v-model="prescriptionForm.diagnosis" /></el-form-item><el-form-item label="药品"><el-select v-model="prescriptionForm.drugId" class="full-width"><el-option v-for="item in store.data.drugInventories.filter((drug) => drug.active)" :key="item.id" :label="`${item.drugName} 库存${item.quantity}`" :value="item.id" /></el-select></el-form-item><el-form-item label="用法用量"><el-input v-model="prescriptionForm.dosage" /></el-form-item><el-form-item label="数量"><el-input-number v-model="prescriptionForm.quantity" :min="1" class="full-width" /></el-form-item><el-form-item label="开方兽医"><el-select v-model="prescriptionForm.veterinarianId" class="full-width"><el-option v-for="item in approvedVets" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item></el-form><template #footer><el-button @click="prescriptionDialog = false">取消</el-button><el-button type="success" @click="issue">开具处方</el-button></template></el-dialog>
    <el-dialog v-model="detailVisible" title="处方详情" width="520px"><div v-if="currentPrescription" class="info-list"><p><span>处方编号</span><b>{{ currentPrescription.prescriptionNo }}</b></p><p><span>诊断结果</span><b>{{ currentPrescription.diagnosis }}</b></p><p><span>药品</span><b>{{ currentPrescription.drugName }} × {{ currentPrescription.quantity }}</b></p><p><span>用法用量</span><b>{{ currentPrescription.dosage }}</b></p><p><span>状态</span><b>{{ currentPrescription.status === 'voided' ? '已作废' : '已生效' }}</b></p></div></el-dialog>
  </div>
</template>
