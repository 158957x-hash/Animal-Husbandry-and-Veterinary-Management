<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
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

/* ---- 柜子可视化 ---- */
const cabinets = [
  { id: 'cabinet-a', name: '门诊药房A柜', drawers: ['第1层', '第2层', '第3层', '第4层'] },
  { id: 'cabinet-b', name: '门诊药房B柜', drawers: ['第1层', '第2层', '第3层', '第4层'] },
  { id: 'cabinet-c', name: '注射室药柜', drawers: ['第1层', '第2层', '第3层'] },
  { id: 'cabinet-d', name: '住院部药柜', drawers: ['第1层', '第2层', '第3层'] },
  { id: 'cabinet-e', name: '冷藏柜', drawers: ['上层', '中层', '下层'] },
]
const selectedCabinet = ref('')
const selectedDrawer = ref('')
const selectedLocation = ref('')
const editSelectedCabinet = ref('')
const editSelectedDrawer = ref('')
const editSelectedLocation = ref('')

function selectCabinetDrawer(cabinetName: string, drawer: string) {
  selectedCabinet.value = cabinetName
  selectedDrawer.value = drawer
  selectedLocation.value = `${cabinetName} - ${drawer}`
  drugForm.storageLocation = selectedLocation.value
}

function selectEditCabinetDrawer(cabinetName: string, drawer: string) {
  editSelectedCabinet.value = cabinetName
  editSelectedDrawer.value = drawer
  editSelectedLocation.value = `${cabinetName} - ${drawer}`
  drugEditForm.storageLocation = editSelectedLocation.value
}

/* ---- 药品名称自动补全 ---- */
const drugNameSuggestions = ref<{ value: string; drug: DrugInventory }[]>([])
const drugNameQuery = ref('')

function queryDrugNames(query: string) {
  drugNameQuery.value = query
  if (!query) {
    drugNameSuggestions.value = []
    return
  }
  const seen = new Set<string>()
  drugNameSuggestions.value = store.data.drugInventories
    .filter((d) => d.drugName.includes(query) && !seen.has(d.drugName) && seen.add(d.drugName))
    .map((d) => ({ value: d.drugName, drug: d }))
}

function selectDrugName(item: { value: string; drug: DrugInventory }) {
  drugNameQuery.value = item.value
  drugForm.drugName = item.value
  drugForm.specification = item.drug.specification
  drugForm.unit = item.drug.unit
  drugForm.manufacturer = item.drug.manufacturer
  drugForm.approvalNo = item.drug.approvalNo
  drugForm.supplier = item.drug.supplier
  drugForm.validTo = item.drug.validTo
  drugNameSuggestions.value = []
}

const editDrugNameSuggestions = ref<{ value: string; drug: DrugInventory }[]>([])
const editDrugNameQuery = ref('')

function queryEditDrugNames(query: string) {
  editDrugNameQuery.value = query
  if (!query) {
    editDrugNameSuggestions.value = []
    return
  }
  const seen = new Set<string>()
  editDrugNameSuggestions.value = store.data.drugInventories
    .filter((d) => d.drugName.includes(query) && !seen.has(d.drugName) && seen.add(d.drugName))
    .map((d) => ({ value: d.drugName, drug: d }))
}

function selectEditDrugName(item: { value: string; drug: DrugInventory }) {
  editDrugNameQuery.value = item.value
  drugEditForm.drugName = item.value
  drugEditForm.specification = item.drug.specification
  drugEditForm.unit = item.drug.unit
  drugEditForm.manufacturer = item.drug.manufacturer
  drugEditForm.approvalNo = item.drug.approvalNo
  drugEditForm.supplier = item.drug.supplier
  drugEditForm.validTo = item.drug.validTo
  editDrugNameSuggestions.value = []
}

type MergedDrugInventory = DrugInventory & { locationCount: number }

const drugs = computed<MergedDrugInventory[]>(() => {
  const filtered = store.data.drugInventories.filter((item) => {
    if (searchForm.drugName && !item.drugName.includes(searchForm.drugName)) return false
    if (searchForm.batchNo && !item.batchNo.includes(searchForm.batchNo)) return false
    if (searchForm.manufacturer && !item.manufacturer.includes(searchForm.manufacturer)) return false
    if (searchForm.approvalNo && !item.approvalNo.includes(searchForm.approvalNo)) return false
    return true
  })
  const map = new Map<string, MergedDrugInventory>()
  for (const item of filtered) {
    const key = `${item.drugName}|${item.specification}|${item.batchNo}|${item.unit}`
    const existing = map.get(key)
    if (existing) {
      existing.quantity += item.quantity
      existing.locationCount += 1
      existing.active = existing.active || item.active
    } else {
      map.set(key, { ...item, locationCount: 1 })
    }
  }
  return Array.from(map.values())
})

const drugForm = reactive({ institutionId: '', drugName: '', specification: '', batchNo: '', unit: '盒', manufacturer: '', approvalNo: '', validTo: '', quantity: 0, storageLocation: '', supplier: '', traceCode: '' })
const drugEditForm = reactive({ institutionId: '', drugName: '', specification: '', batchNo: '', unit: '', manufacturer: '', approvalNo: '', validTo: '', storageLocation: '', supplier: '', traceCode: '' })

function openStock() {
  Object.assign(drugForm, { institutionId: approvedInstitutions.value[0]?.id || '', drugName: '', specification: '', batchNo: `DRUG${Date.now().toString().slice(-6)}`, unit: '盒', manufacturer: '', approvalNo: '', validTo: '', quantity: 0, storageLocation: '', supplier: '', traceCode: '' })
  drugNameQuery.value = ''
  drugNameSuggestions.value = []
  selectedCabinet.value = ''
  selectedDrawer.value = ''
  selectedLocation.value = ''
  stockDialog.value = true
}

function openDrugEdit(row: DrugInventory) {
  currentDrug.value = row
  Object.assign(drugEditForm, row)
  editDrugNameQuery.value = row.drugName
  editDrugNameSuggestions.value = []
  editSelectedCabinet.value = ''
  editSelectedDrawer.value = ''
  editSelectedLocation.value = row.storageLocation || ''
  // 解析现有位置到柜子/抽屉
  if (row.storageLocation) {
    const parts = row.storageLocation.split(' - ')
    if (parts.length === 2) {
      editSelectedCabinet.value = parts[0]
      editSelectedDrawer.value = parts[1]
    }
  }
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
  <div class="farmer-modern-page inventory-page">
    <section class="gov-page-header">
      <div>
        <h2>药品库存管理</h2>
        <p>管理药品库存信息，支持入库、编辑、停用及库存盘点。</p>
      </div>
      <div class="gov-page-header__actions">
        <el-button @click="store.refresh()" :icon="Refresh">刷新</el-button>
        <el-button type="primary" @click="openStock">药品入库</el-button>
        <el-button type="warning">库存盘点</el-button>
      </div>
    </section>

    <section class="gov-toolbar-card gov-compact-card">
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
    </section>

    <section class="gov-table-card gov-compact-card">
      <div class="gov-table-card__header"><div><strong>库存列表</strong><small>按药品名称、规格、批号和单位合并展示库存</small></div></div>
      <el-table :data="drugs" stripe style="width: 100%" empty-text="暂无药品库存">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="drugName" label="药品名称" min-width="180" />
        <el-table-column prop="specification" label="规格" width="140" />
        <el-table-column prop="batchNo" label="批号" width="140" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="quantity" label="当前库存" width="90" />
        <el-table-column label="库位数量" width="90">
          <template #default="{ row }">{{ row.locationCount }}处</template>
        </el-table-column>
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
      <div class="gov-pagination-bar">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="drugs.length" :page-size="10" />
      </div>
    </section>

    <!-- 入库弹窗 -->
    <el-dialog v-model="stockDialog" title="药品入库" width="680px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="入库机构"><el-select v-model="drugForm.institutionId" class="full-width"><el-option v-for="item in approvedInstitutions" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="药品名称">
          <el-autocomplete
            v-model="drugNameQuery"
            :fetch-suggestions="queryDrugNames"
            :trigger-on-focus="false"
            placeholder="输入药品名称，可从已有药品中选择"
            class="full-width"
            @select="selectDrugName"
            @input="(v: string) => { drugForm.drugName = v; queryDrugNames(v) }"
            clearable
          />
        </el-form-item>
        <el-form-item label="规格"><el-input v-model="drugForm.specification" /></el-form-item>
        <el-form-item label="批号"><el-input v-model="drugForm.batchNo" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="drugForm.unit" /></el-form-item>
        <el-form-item label="生产企业"><el-input v-model="drugForm.manufacturer" /></el-form-item>
        <el-form-item label="批准文号"><el-input v-model="drugForm.approvalNo" /></el-form-item>
        <el-form-item label="有效期"><el-input v-model="drugForm.validTo" /></el-form-item>
        <el-form-item label="入库数量"><el-input-number v-model="drugForm.quantity" :min="1" class="full-width" /></el-form-item>
        <el-form-item label="库存位置">
          <div class="cabinet-grid">
            <div v-for="cab in cabinets" :key="cab.id" class="cabinet-block">
              <div class="cabinet-name">{{ cab.name }}</div>
              <div class="drawer-list">
                <div
                  v-for="d in cab.drawers"
                  :key="d"
                  class="drawer-item"
                  :class="{ 'drawer-active': selectedCabinet === cab.name && selectedDrawer === d }"
                  @click="selectCabinetDrawer(cab.name, d)"
                >{{ d }}</div>
              </div>
            </div>
          </div>
          <div v-if="selectedLocation" class="selected-location">已选择：<b>{{ selectedLocation }}</b></div>
        </el-form-item>
        <el-form-item label="供应商"><el-input v-model="drugForm.supplier" /></el-form-item>
        <el-form-item label="追溯码"><el-input v-model="drugForm.traceCode" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="stockDialog = false">取消</el-button><el-button type="success" @click="stockIn">保存</el-button></template>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="drugEditDialog" title="编辑药品信息" width="680px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="所属机构"><el-select v-model="drugEditForm.institutionId" class="full-width"><el-option v-for="item in approvedInstitutions" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="药品名称">
          <el-autocomplete
            v-model="editDrugNameQuery"
            :fetch-suggestions="queryEditDrugNames"
            :trigger-on-focus="false"
            placeholder="输入药品名称，可从已有药品中选择"
            class="full-width"
            @select="selectEditDrugName"
            @input="(v: string) => { drugEditForm.drugName = v; queryEditDrugNames(v) }"
            clearable
          />
        </el-form-item>
        <el-form-item label="规格"><el-input v-model="drugEditForm.specification" /></el-form-item>
        <el-form-item label="批号"><el-input v-model="drugEditForm.batchNo" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="drugEditForm.unit" /></el-form-item>
        <el-form-item label="生产企业"><el-input v-model="drugEditForm.manufacturer" /></el-form-item>
        <el-form-item label="批准文号"><el-input v-model="drugEditForm.approvalNo" /></el-form-item>
        <el-form-item label="有效期"><el-input v-model="drugEditForm.validTo" /></el-form-item>
        <el-form-item label="库存位置">
          <div class="cabinet-grid">
            <div v-for="cab in cabinets" :key="cab.id" class="cabinet-block">
              <div class="cabinet-name">{{ cab.name }}</div>
              <div class="drawer-list">
                <div
                  v-for="d in cab.drawers"
                  :key="d"
                  class="drawer-item"
                  :class="{ 'drawer-active': editSelectedCabinet === cab.name && editSelectedDrawer === d }"
                  @click="selectEditCabinetDrawer(cab.name, d)"
                >{{ d }}</div>
              </div>
            </div>
          </div>
          <div v-if="editSelectedLocation" class="selected-location">已选择：<b>{{ editSelectedLocation }}</b></div>
        </el-form-item>
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

/* ========== 柜子可视化选择 ========== */
.cabinet-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.cabinet-block {
  flex: 1;
  min-width: 140px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.cabinet-name {
  background: linear-gradient(135deg, #1a7a4c 0%, #0d5e38 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 6px 8px;
}
.drawer-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
}
.drawer-item {
  padding: 5px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}
.drawer-item:hover {
  border-color: #1a7a4c;
  color: #1a7a4c;
  background: #ecfdf5;
}
.drawer-item.drawer-active {
  border-color: #1a7a4c;
  background: #1a7a4c;
  color: #fff;
  font-weight: 600;
}
.selected-location {
  margin-top: 10px;
  padding: 6px 12px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  font-size: 13px;
  color: #065f46;
}
</style>