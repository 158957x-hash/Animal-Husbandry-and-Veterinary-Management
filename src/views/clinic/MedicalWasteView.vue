<script setup lang="ts">
import { computed, reactive, ref, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import type { MedicalWasteRecord, WasteSourceBusinessType } from '../../domain/models'

const store = useAppStore()
const keyword = ref('')
const dialogVisible = ref(false)
const detailVisible = ref(false)
const completeVisible = ref(false)
const barcodeVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const current = ref<MedicalWasteRecord>()
const currentBarcode = ref<MedicalWasteRecord>()
const barcodeCanvas = ref<HTMLCanvasElement>()
const expandedCabinet = ref('')
const selectedLocation = ref('')

const cabinets = [
  { id: 'cabinet-a', name: '暂存柜A', drawers: ['第1层', '第2层', '第3层'] },
  { id: 'cabinet-b', name: '暂存柜B', drawers: ['第1层', '第2层', '第3层'] },
  { id: 'cabinet-c', name: '暂存柜C', drawers: ['第1层', '第2层', '第3层'] },
]

const records = computed(() =>
  store.data.medicalWasteRecords.filter(
    (item) =>
      !keyword.value ||
      item.wasteNo.includes(keyword.value) ||
      item.type.includes(keyword.value) ||
      item.disposalCompany.includes(keyword.value),
  ),
)

const sourceOptions = computed(() => [
  ...store.data.immunizationLedgers.map((item) => ({
    label: `免疫-${item.vaccineName}-${item.vaccineBatchNo}`,
    value: item.id,
    type: 'immunization' as WasteSourceBusinessType,
  })),
  ...store.data.prescriptions.map((item) => ({
    label: `处方-${item.prescriptionNo}-${item.drugName}`,
    value: item.id,
    type: 'prescription' as WasteSourceBusinessType,
  })),
])

const form = reactive({
  type: '疫苗瓶及注射器',
  sourceBusinessType: 'immunization' as WasteSourceBusinessType,
  sourceBusinessId: '',
  weight: 1.2,
  generatedAt: formatDateTime(new Date()),
  storageLocation: '',
  disposalCompany: '合肥绿安医疗废弃物处置有限公司',
  handoverPerson: '',
})

const completeForm = reactive({
  handledAt: formatDateTime(new Date()),
  handlingMethod: '高温焚烧',
  voucherNo: `WASTE-${Date.now()}`,
})

const handlingMethods = ['高温焚烧', '化学消毒', '高压蒸汽灭菌', '微波消毒', '填埋处理', '其他']

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDisplayDateTime(iso: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function setSource(idValue: string) {
  const option = sourceOptions.value.find((item) => item.value === idValue)
  if (option) form.sourceBusinessType = option.type
}

function toggleCabinet(id: string) {
  expandedCabinet.value = expandedCabinet.value === id ? '' : id
}

function selectDrawer(cabinetName: string, drawer: string) {
  selectedLocation.value = `${cabinetName} - ${drawer}`
  form.storageLocation = selectedLocation.value
}

function openCreate() {
  const first = sourceOptions.value[0]
  form.type = '疫苗瓶及注射器'
  form.sourceBusinessType = first?.type || 'immunization'
  form.sourceBusinessId = first?.value || ''
  form.weight = 1.2
  form.generatedAt = formatDateTime(new Date())
  form.storageLocation = ''
  form.disposalCompany = '合肥绿安医疗废弃物处置有限公司'
  form.handoverPerson = store.session?.name || '当前用户'
  selectedLocation.value = ''
  expandedCabinet.value = ''
  mode.value = 'create'
  current.value = undefined
  dialogVisible.value = true
}

function openEdit(row: MedicalWasteRecord) {
  if (row.status === 'handled') return ElMessage.warning('已处理记录不能编辑')
  Object.assign(form, {
    type: row.type,
    sourceBusinessType: row.sourceBusinessType,
    sourceBusinessId: row.sourceBusinessId,
    weight: row.weight,
    generatedAt: row.generatedAt,
    storageLocation: row.storageLocation,
    disposalCompany: row.disposalCompany,
    handoverPerson: row.handoverPerson,
  })
  selectedLocation.value = row.storageLocation
  expandedCabinet.value = ''
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
  completeForm.handledAt = formatDateTime(new Date())
  completeForm.handlingMethod = '高温焚烧'
  completeForm.voucherNo = `WASTE-${Date.now()}`
  completeVisible.value = true
}

async function save() {
  if (!form.type || !form.sourceBusinessId || form.weight <= 0 || !form.storageLocation || !form.disposalCompany || !form.handoverPerson) {
    return ElMessage.warning('请填写废弃物类型、来源、重量、暂存位置、处理单位和交接人')
  }
  let result: MedicalWasteRecord | undefined
  if (mode.value === 'create') {
    result = await store.createMedicalWaste({ ...form })
  } else if (current.value) {
    await store.updateMedicalWaste(current.value.id, { ...form })
  }
  dialogVisible.value = false
  ElMessage.success(mode.value === 'create' ? '诊疗废弃物已登记' : '诊疗废弃物记录已保存')

  if (mode.value === 'create' && result) {
    currentBarcode.value = result
    await nextTick()
    drawBarcode(result.wasteNo)
    barcodeVisible.value = true
  }
}

async function complete() {
  if (!current.value || !completeForm.handledAt || !completeForm.handlingMethod || !completeForm.voucherNo) {
    return ElMessage.warning('请填写处理方式、处理时间和处理凭证')
  }
  await store.completeMedicalWaste({
    wasteId: current.value.id,
    ...completeForm,
  })
  completeVisible.value = false
  ElMessage.success('废弃物处理已完成')
}

async function voidRecord(row: MedicalWasteRecord) {
  const { value } = await ElMessageBox.prompt('请输入作废原因', `作废废弃物记录 ${row.wasteNo}`)
  await store.voidMedicalWaste(row.id, value || '废弃物记录作废')
  ElMessage.success('废弃物记录已作废')
}

function drawBarcode(code: string) {
  if (!barcodeCanvas.value) return
  const canvas = barcodeCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  // 生成条码图案
  const barCount = code.length * 8
  const barWidth = (w - 40) / barCount
  let x = 20

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i)
    for (let bit = 0; bit < 8; bit++) {
      const isBlack = (charCode >> bit) & 1
      ctx.fillStyle = isBlack ? '#1a1a1a' : '#ffffff'
      ctx.fillRect(x, 20, barWidth, h - 60)
      x += barWidth
    }
  }

  // 底部文字
  ctx.fillStyle = '#333'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(code, w / 2, h - 12)
}

function printBarcode() {
  if (!currentBarcode.value || !barcodeCanvas.value) return
  const dataUrl = barcodeCanvas.value.toDataURL('image/png')
  const printWindow = window.open('', '_blank', 'width=400,height=300')
  if (!printWindow) return
  printWindow.document.write(`
    <html>
      <head><title>废弃物条码</title></head>
      <body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif">
        <h3 style="margin:0 0 12px">${currentBarcode.value?.wasteNo}</h3>
        <img src="${dataUrl}" style="max-width:360px" />
        <p style="margin-top:8px;color:#666">${currentBarcode.value?.type} | ${currentBarcode.value?.weight}kg</p>
        <p style="color:#999">${currentBarcode.value?.storageLocation}</p>
      </body>
    </html>
  `)
  printWindow.document.close()
  setTimeout(() => printWindow.print(), 500)
}
</script>

<template>
  <div class="farmer-modern-page">
    <section class="gov-page-header">
      <div>
        <h2>诊疗废弃物处理</h2>
        <p>记录诊疗废弃物产生、暂存、交接和处理凭证，确保处置过程可追溯。</p>
      </div>
      <div class="gov-page-header__actions">
        <el-button @click="store.refresh()">刷新</el-button>
        <el-button type="success" @click="openCreate">登记废弃物</el-button>
      </div>
    </section>

    <section class="gov-toolbar-card gov-compact-card">
      <div class="gov-filter-grid">
        <el-input v-model="keyword" placeholder="按编号、类型或处理单位筛选" clearable />
        <div class="gov-card-title__actions">
          <el-button>导出</el-button>
        </div>
      </div>
    </section>

    <section class="gov-table-card gov-compact-card">
      <div class="gov-table-card__header">
        <div><strong>废弃物处理台账</strong><small>登记、暂存、交接、处理全过程记录</small></div>
      </div>
      <el-table :data="records" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="wasteNo" label="业务编号" min-width="160" />
        <el-table-column prop="type" label="废弃物类型" min-width="150" />
        <el-table-column prop="weight" label="重量 kg" width="90" />
        <el-table-column prop="storageLocation" label="暂存位置" min-width="160" />
        <el-table-column prop="disposalCompany" label="处理单位" min-width="180" />
        <el-table-column label="处理方式" width="120">
          <template #default="{ row }">{{ row.handlingMethod || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'handled' ? 'success' : row.status === 'voided' ? 'info' : 'warning'">
              {{ row.status === 'handled' ? '已处理' : row.status === 'voided' ? '已作废' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showDetail(row)">查看</el-button>
            <el-button v-if="row.status === 'pending'" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="success" @click="openComplete(row)">处理完成</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="warning" @click="voidRecord(row)">作废</el-button>
            <el-button size="small" @click="currentBarcode = row; nextTick(() => { drawBarcode(row.wasteNo); barcodeVisible = true })">条码</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="gov-pagination-bar">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="records.length" :page-size="10" />
      </div>
    </section>

    <!-- 登记/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="mode === 'create' ? '登记诊疗废弃物' : '编辑诊疗废弃物记录'" width="720px" destroy-on-close>
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="废弃物类型">
              <el-select v-model="form.type" class="full-width">
                <el-option label="疫苗瓶及注射器" value="疫苗瓶及注射器" />
                <el-option label="过期药品" value="过期药品" />
                <el-option label="废弃试剂" value="废弃试剂" />
                <el-option label="废弃敷料" value="废弃敷料" />
                <el-option label="废弃手术器械" value="废弃手术器械" />
                <el-option label="其他医疗废弃物" value="其他医疗废弃物" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数量/重量 kg">
              <el-input-number v-model="form.weight" :min="0.1" :step="0.1" class="full-width" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="来源记录">
          <el-select v-model="form.sourceBusinessId" class="full-width" @change="setSource">
            <el-option v-for="item in sourceOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="产生时间">
          <el-date-picker v-model="form.generatedAt" type="datetime" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm" placeholder="选择产生时间" class="full-width" />
        </el-form-item>

        <!-- 可视化柜子抽屉选择 -->
        <el-form-item label="暂存位置" required>
          <div class="cabinet-grid">
            <div v-for="cabinet in cabinets" :key="cabinet.id" class="cabinet-unit">
              <button
                type="button"
                class="cabinet-btn"
                :class="{ expanded: expandedCabinet === cabinet.id }"
                @click="toggleCabinet(cabinet.id)"
              >
                {{ cabinet.name }}
              </button>
              <div v-if="expandedCabinet === cabinet.id" class="drawer-list">
                <button
                  v-for="drawer in cabinet.drawers"
                  :key="drawer"
                  type="button"
                  class="drawer-btn"
                  :class="{ selected: selectedLocation === `${cabinet.name} - ${drawer}` }"
                  @click="selectDrawer(cabinet.name, drawer)"
                >
                  {{ drawer }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="selectedLocation" class="selected-location">
            <el-tag type="success" size="large">已选择：{{ selectedLocation }}</el-tag>
          </div>
        </el-form-item>

        <el-form-item label="处理单位">
          <el-input v-model="form.disposalCompany" />
        </el-form-item>
        <el-form-item label="交接人">
          <el-input :model-value="store.session?.name || '当前用户'" disabled />
          <div style="color:#909399;font-size:12px;margin-top:4px">交接人固定为当前登录用户</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="success" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 处理完成弹窗 -->
    <el-dialog v-model="completeVisible" title="完成废弃物处理" width="560px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="处理方式" required>
          <el-select v-model="completeForm.handlingMethod" class="full-width">
            <el-option v-for="method in handlingMethods" :key="method" :label="method" :value="method" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理时间" required>
          <el-date-picker
            v-model="completeForm.handledAt"
            type="datetime"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm"
            placeholder="选择处理时间"
            class="full-width"
          />
        </el-form-item>
        <el-form-item label="处理凭证编号">
          <el-input v-model="completeForm.voucherNo" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeVisible = false">取消</el-button>
        <el-button type="success" @click="complete">确认完成</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="废弃物处理详情" width="560px">
      <div v-if="current" class="gov-detail-grid">
        <div class="gov-detail-item"><span>编号</span><b>{{ current.wasteNo }}</b></div>
        <div class="gov-detail-item"><span>类型</span><b>{{ current.type }}</b></div>
        <div class="gov-detail-item"><span>重量</span><b>{{ current.weight }} kg</b></div>
        <div class="gov-detail-item"><span>暂存位置</span><b>{{ current.storageLocation }}</b></div>
        <div class="gov-detail-item"><span>处理单位</span><b>{{ current.disposalCompany }}</b></div>
        <div class="gov-detail-item"><span>交接人</span><b>{{ current.handoverPerson }}</b></div>
        <div class="gov-detail-item"><span>处理方式</span><b>{{ current.handlingMethod || '-' }}</b></div>
        <div class="gov-detail-item"><span>处理时间</span><b>{{ formatDisplayDateTime(current.handledAt || '') }}</b></div>
        <div class="gov-detail-item"><span>凭证</span><b>{{ current.voucherNo || '-' }}</b></div>
        <div class="gov-detail-item"><span>状态</span><b><el-tag :type="current.status === 'handled' ? 'success' : current.status === 'voided' ? 'info' : 'warning'">{{ current.status === 'handled' ? '已处理' : current.status === 'voided' ? '已作废' : '待处理' }}</el-tag></b></div>
      </div>
    </el-dialog>

    <!-- 条码弹窗 -->
    <el-dialog v-model="barcodeVisible" title="废弃物条码" width="460px">
      <div v-if="currentBarcode" class="barcode-area">
        <canvas ref="barcodeCanvas" width="400" height="140" />
        <div class="barcode-info">
          <p><strong>{{ currentBarcode.wasteNo }}</strong></p>
          <p>{{ currentBarcode.type }} | {{ currentBarcode.weight }}kg</p>
          <p>{{ currentBarcode.storageLocation }}</p>
        </div>
        <el-button type="primary" @click="printBarcode">打印条码</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.full-width {
  width: 100%;
}

.cabinet-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.cabinet-unit {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cabinet-btn {
  width: 120px;
  padding: 16px 12px;
  border: 2px solid #d0d9e4;
  border-radius: 10px;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cabinet-btn:hover {
  border-color: #1d5f99;
  background: linear-gradient(180deg, #e8f0fe 0%, #d6e4f8 100%);
}

.cabinet-btn.expanded {
  border-color: #1d5f99;
  background: linear-gradient(180deg, #d6e4f8 0%, #bdd3f0 100%);
  color: #1d5f99;
}

.drawer-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0 0 4px;
}

.drawer-btn {
  padding: 8px 12px;
  border: 1px solid #e0e5ec;
  border-radius: 6px;
  background: #ffffff;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.drawer-btn:hover {
  border-color: #1d5f99;
  background: #f0f6ff;
}

.drawer-btn.selected {
  border-color: #1d5f99;
  background: #1d5f99;
  color: #ffffff;
  font-weight: 600;
}

.selected-location {
  margin-top: 10px;
}

.barcode-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.barcode-area canvas {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.barcode-info {
  text-align: center;
  color: #475569;
  font-size: 14px;
}

.barcode-info p {
  margin: 2px 0;
}
</style>