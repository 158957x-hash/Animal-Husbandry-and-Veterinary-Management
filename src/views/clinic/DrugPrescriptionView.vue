<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { DrugInventory } from '../../domain/models'

const store = useAppStore()

const searchForm = reactive({
  drugName: '',
  batchNo: '',
  manufacturer: '',
  approvalNo: '',
})

const stockDialog = ref(false)
const drugEditDialog = ref(false)
const currentDrug = ref<DrugInventory>()
const approvedInstitutions = computed(() => store.data.clinicInstitutions.filter((item) => item.status === 'approved' && item.active))

const drugs = computed(() => {
  return store.data.drugInventories.filter((item) => {
    if (searchForm.drugName && !item.drugName.includes(searchForm.drugName)) return false
    if (searchForm.batchNo && !item.batchNo.includes(searchForm.batchNo)) return false
    if (searchForm.manufacturer && !item.manufacturer.includes(searchForm.manufacturer)) return false
    if (searchForm.approvalNo && !item.approvalNo.includes(searchForm.approvalNo)) return false
    return true
  })
})

const drugForm = reactive({ institutionId: '', drugName: '', specification: '', batchNo: '', unit: '盒', manufacturer: '', approvalNo: '', validTo: '', quantity: 0, supplier: '', traceCode: '' })
const drugEditForm = reactive({ institutionId: '', drugName: '', specification: '', batchNo: '', unit: '', manufacturer: '', approvalNo: '', validTo: '', supplier: '', traceCode: '' })

function openStock() {
  Object.assign(drugForm, { institutionId: approvedInstitutions.value[0]?.id || '', drugName: '', specification: '', batchNo: `DRUG${Date.now().toString().slice(-6)}`, unit: '盒', manufacturer: '', approvalNo: '', validTo: '', quantity: 0, supplier: '', traceCode: '' })
  stockDialog.value = true
}

function openDrugEdit(row: DrugInventory) {
  currentDrug.value = row
  Object.assign(drugEditForm, row)
  drugEditDialog.value = true
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
  await ElMessageBox.confirm(`确认停用 ${row.drugName}？`, '停用确认')
  await store.disableDrugInventory(row.id)
  ElMessage.success('药品已停用')
}

function onSearch() { /* computed reacts */ }
function onReset() {
  Object.assign(searchForm, { drugName: '', batchNo: '', manufacturer: '', approvalNo: '' })
}
</script>

<template>
  <div class="inventory-page">
    <div class="page-header-card">
      <div class="header-left">
        <h2>药品库存管理</h2>
        <p>管理药品库存信息，支持入库、编辑、停用及库存盘点。</p>
      </div>
      <div class="header-right">
        <el-button @click="store.refresh()" :icon="Refresh">刷新</el-button>
        <el-button type="primary" @click="openStock">药品入库</el-button>
        <el-button type="warning">库存盘点</el-button>
      </div>
    </div>

    <div class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="药品名称">
          <el-input v-model="searchForm.drugName" placeholder="请输入药品名称" clearable />
        </el-form-item>
        <el-form-item label="批号">
          <el-input v-model="searchForm.batchNo" placeholder="请输入批号" clearable />
        </el-form-item>
        <el-form-item label="生产企业">
          <el-input v-model="searchForm.manufacturer" placeholder="请输入生产企业" clearable />
        </el-form-item>
        <el-form-item label="批准文号">
          <el-input v-model="searchForm.approvalNo" placeholder="请输入批准文号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table :data="drugs" stripe style="width: 100%" empty-text="暂无药品库存">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="drugName" label="药品名称" min-width="180" />
        <el-table-column prop="specification" label="规格" width="140" />
        <el-table-column prop="batchNo" label="批号" width="140" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="quantity" label="当前库存" width="90" />
        <el-table-column prop="manufacturer" label="生产企业" min-width="160" />
        <el-table-column prop="approvalNo" label="批准文号" width="180" />
        <el-table-column prop="validTo" label="有效期" width="110">
          <template #default="{ row }">{{ new Date(row.validTo).toLocaleDateString('zh-CN') }}</template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" min-width="140" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.active ? 'success' : 'info'" size="small">{{ row.active ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="openDrugEdit(row)">编辑</el-button>
            <el-button v-if="row.active" size="small" link type="warning" @click="disableDrug(row)">停用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 入库弹窗 -->
    <el-dialog v-model="stockDialog" title="药品入库" width="620px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="入库机构"><el-select v-model="drugForm.institutionId" class="full-width"><el-option v-for="item in approvedInstitutions" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="药品名称"><el-input v-model="drugForm.drugName" /></el-form-item>
        <el-form-item label="规格"><el-input v-model="drugForm.specification" /></el-form-item>
        <el-form-item label="批号"><el-input v-model="drugForm.batchNo" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="drugForm.unit" /></el-form-item>
        <el-form-item label="生产企业"><el-input v-model="drugForm.manufacturer" /></el-form-item>
        <el-form-item label="批准文号"><el-input v-model="drugForm.approvalNo" /></el-form-item>
        <el-form-item label="有效期"><el-input v-model="drugForm.validTo" /></el-form-item>
        <el-form-item label="入库数量"><el-input-number v-model="drugForm.quantity" :min="1" class="full-width" /></el-form-item>
        <el-form-item label="供应商"><el-input v-model="drugForm.supplier" /></el-form-item>
        <el-form-item label="追溯码"><el-input v-model="drugForm.traceCode" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="stockDialog = false">取消</el-button><el-button type="success" @click="stockIn">保存</el-button></template>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="drugEditDialog" title="编辑药品信息" width="620px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="所属机构"><el-select v-model="drugEditForm.institutionId" class="full-width"><el-option v-for="item in approvedInstitutions" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="药品名称"><el-input v-model="drugEditForm.drugName" /></el-form-item>
        <el-form-item label="规格"><el-input v-model="drugEditForm.specification" /></el-form-item>
        <el-form-item label="批号"><el-input v-model="drugEditForm.batchNo" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="drugEditForm.unit" /></el-form-item>
        <el-form-item label="生产企业"><el-input v-model="drugEditForm.manufacturer" /></el-form-item>
        <el-form-item label="批准文号"><el-input v-model="drugEditForm.approvalNo" /></el-form-item>
        <el-form-item label="有效期"><el-input v-model="drugEditForm.validTo" /></el-form-item>
        <el-form-item label="供应商"><el-input v-model="drugEditForm.supplier" /></el-form-item>
        <el-form-item label="追溯码"><el-input v-model="drugEditForm.traceCode" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="drugEditDialog = false">取消</el-button><el-button type="success" @click="saveDrug">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.inventory-page { display: flex; flex-direction: column; gap: 16px; }
.page-header-card { display: flex; justify-content: space-between; align-items: flex-start; background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-header-card h2 { margin: 0 0 6px; font-size: 18px; color: #1d2129; }
.page-header-card p { margin: 0; font-size: 13px; color: #86909c; }
.header-right { display: flex; gap: 8px; flex-shrink: 0; }
.search-card { background: #fff; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.table-card { background: #fff; border-radius: 8px; padding: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.full-width { width: 100%; }
</style>