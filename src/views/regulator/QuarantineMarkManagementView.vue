<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { MarkApplicationStatus, MarkType } from '../../domain/models'

const store = useAppStore()
const route = useRoute()
const addDialogVisible = ref(false)
const reviewDialogVisible = ref(false)
const issueDialogVisible = ref(false)
const returnDialogVisible = ref(false)
const issueTab = ref('pending')
const returnTab = ref('pending')
const inventoryPage = ref(1)
const inventoryPageSize = ref(10)
const detailPageMap = reactive<Record<string, number>>({})
const selectedReview = ref<any>(null)
const selectedIssue = ref<any>(null)
const selectedReturn = ref<any>(null)

const addForm = reactive({
  markType: 'card_ring' as MarkType,
  markNo: 'KH202606160001',
  batchNo: 'SCPC20260616001',
  spec: '标准规格',
  material: '食品级塑料',
  color: '绿色',
})

const reviewForm = reactive({
  reviewer: '市级畜牧兽医监管员',
  opinion: '申请信息完整，数量合理，同意生成待发放单。',
})

const issueForm = reactive({
  method: '现场领取',
  receiver: '屠宰企业经办人',
  issuer: '市级畜牧兽医监管员',
  remark: '核验领用单位信息后发放。',
})
const issueSelectedMarkNos = ref<string[]>([])
const issueAvailableMarks = computed(() => {
  if (!selectedIssue.value) return []
  return store.data.quarantineMarks.filter(
    (m) => m.markType === selectedIssue.value.markType && m.status === 'in_stock'
  )
})

const returnForm = reactive({
  warehouseLocation: '监管端标志库-A区',
  operator: '市级畜牧兽医监管员',
  acceptanceRemark: '退回标志数量与申请一致，外观完好，准予入库。',
})
const returnSelectedMarkNos = ref<string[]>([])
const returnAvailableMarks = computed(() => {
  if (!selectedReturn.value) return []
  return store.data.quarantineMarks.filter(
    (m) => m.markType === selectedReturn.value.markType && m.status === 'issued' && m.ownerOrg === selectedReturn.value.orgId
  )
})

const activeMode = computed(() => {
  const path = route.path
  if (path.endsWith('/issue')) return 'issue'
  if (path.endsWith('/inventory')) return 'inventory'
  if (path.endsWith('/return')) return 'return'
  return 'review'
})

const titleMap: Record<string, string> = {
  review: '申领/退回审核',
  issue: '标志发放',
  inventory: '标志库存',
  return: '标志退回',
}

const markTypeText: Record<MarkType, string> = {
  card_ring: '卡环式',
  sticker: '粘贴式',
}

const applicationStatusText: Record<MarkApplicationStatus, string> = {
  pending_review: '申领待审核',
  approved: '已审核待发放',
  rejected: '申领已驳回',
  issued: '已发放',
  return_pending_review: '退回待审核',
  return_approved: '已审核待退回入库',
  return_rejected: '退回已驳回',
  returned: '已退回入库',
}

const statusText: Record<string, string> = {
  pending_review: '待审核',
  approved: '待发放',
  issued: '已发放',
  pending_issue: '待发放',
  in_stock: '在库',
  used: '已使用',
  returned: '已退回',
  voided: '已作废',
  return_pending_review: '退回待审核',
  return_approved: '待退回入库',
  pending_return: '待退回入库',
}

const statusType: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
  pending_review: 'warning',
  approved: 'primary',
  issued: 'success',
  pending_issue: 'warning',
  in_stock: 'success',
  used: 'info',
  returned: 'warning',
  voided: 'danger',
  return_pending_review: 'warning',
  return_approved: 'primary',
  pending_return: 'warning',
}

const reviewApplications = computed(() =>
  store.data.quarantineMarkApplications.filter((item) => item.status === 'pending_review' || item.status === 'return_pending_review')
)

const issueOrders = computed(() => store.data.quarantineMarkIssueOrders)
const pendingIssueOrders = computed(() => issueOrders.value.filter((item) => item.status === 'pending_issue'))
const issuedOrders = computed(() => issueOrders.value.filter((item) => item.status === 'issued'))
const returnOrders = computed(() => store.data.quarantineMarkReturnOrders)
const pendingReturnOrders = computed(() => returnOrders.value.filter((item) => item.status === 'pending_return'))
const returnedOrders = computed(() => returnOrders.value.filter((item) => item.status === 'returned'))

const inventoryGroups = computed(() => {
  const map = new Map<string, any>()
  store.data.quarantineMarks.forEach((mark) => {
    const groupBatchNo = batchNo(mark)
    const key = `${groupBatchNo}-${mark.markType}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        productionBatchNo: groupBatchNo,
        markType: mark.markType,
        purpose: markPurpose(),
        applicableObject: applicableObject(mark.markType),
        spec: markSpec(mark.markType),
        material: markMaterial(mark.markType),
        color: markColor(mark.markType),
        total: 0,
        inStock: 0,
        issued: 0,
        used: 0,
        returned: 0,
        voided: 0,
        items: [],
      })
    }
    const group = map.get(key)
    group.total += 1
    group.items.push(mark)
    if (mark.status === 'in_stock') group.inStock += 1
    if (mark.status === 'issued') group.issued += 1
    if (mark.status === 'used') group.used += 1
    if (mark.status === 'returned') group.returned += 1
    if (mark.status === 'voided') group.voided += 1
  })
  return Array.from(map.values()).sort((a, b) => String(b.productionBatchNo).localeCompare(String(a.productionBatchNo)))
})

const pagedInventoryGroups = computed(() => {
  const start = (inventoryPage.value - 1) * inventoryPageSize.value
  return inventoryGroups.value.slice(start, start + inventoryPageSize.value)
})

function applicationTypeText(type?: string) {
  return type === 'return' ? '退回申请' : '申领申请'
}

function markPurpose() {
  return '检疫验讫标志'
}

function applicableObject(markType: MarkType) {
  return markType === 'card_ring' ? '胴体' : '副产品 / 包装箱 / 分割产品'
}

function markSpec(markType: MarkType) {
  return markType === 'card_ring' ? 'Φ35mm 卡环' : '60mm × 40mm 标签'
}

function markMaterial(markType: MarkType) {
  return markType === 'card_ring' ? '食品级塑料' : '防水不干胶'
}

function markColor(markType: MarkType) {
  return markType === 'card_ring' ? '绿色' : '蓝白'
}

function batchNo(row: any) {
  return row.productionBatchNo || row.batchNo || row.markNo?.slice(2, 10) || row.issuedAt?.slice(0, 10).replace(/-/g, '') || '-'
}

function openReviewDialog(row: any) {
  selectedReview.value = row
  reviewForm.reviewer = '市级畜牧兽医监管员'
  reviewForm.opinion = row.applicationType === 'return' ? '退回原因明确，数量合理，同意生成待退回入库单。' : '申请信息完整，数量合理，同意生成待发放单。'
  reviewDialogVisible.value = true
}

function openIssueDialog(row: any) {
  selectedIssue.value = row
  issueForm.method = '现场领取'
  issueForm.receiver = '屠宰企业经办人'
  issueForm.issuer = '市级畜牧兽医监管员'
  issueForm.remark = '核验领用单位信息后发放。'
  issueSelectedMarkNos.value = []
  issueDialogVisible.value = true
}

function openReturnDialog(row: any) {
  selectedReturn.value = row
  returnForm.warehouseLocation = '监管端标志库-A区'
  returnForm.operator = '市级畜牧兽医监管员'
  returnForm.acceptanceRemark = '退回标志数量与申请一致，外观完好，准予入库。'
  returnSelectedMarkNos.value = []
  returnDialogVisible.value = true
}

async function confirmReview() {
  if (!selectedReview.value) return
  if (!reviewForm.reviewer || !reviewForm.opinion) {
    ElMessage.warning('请填写审核人和审核意见')
    return
  }
  await store.approveQuarantineMarkApplication(selectedReview.value.id)
  ElMessage.success('审核通过，已生成后续待办单据')
  reviewDialogVisible.value = false
}

async function rejectReview() {
  if (!selectedReview.value) return
  if (!reviewForm.reviewer || !reviewForm.opinion) {
    ElMessage.warning('请填写审核人和驳回意见')
    return
  }
  await store.rejectQuarantineMarkApplication(selectedReview.value.id, reviewForm.opinion)
  ElMessage.success('已驳回该申请')
  reviewDialogVisible.value = false
}

async function confirmIssue() {
  if (!selectedIssue.value) return
  if (!issueForm.receiver || !issueForm.issuer) {
    ElMessage.warning('请填写领取人和发放人')
    return
  }
  if (issueSelectedMarkNos.value.length !== selectedIssue.value.quantity) {
    ElMessage.warning(`请选择 ${selectedIssue.value.quantity} 个标志，当前已选 ${issueSelectedMarkNos.value.length} 个`)
    return
  }
  await store.issueQuarantineMarks(selectedIssue.value.id, issueSelectedMarkNos.value)
  ElMessage.success('标志已发放，发放记录已生成')
  issueDialogVisible.value = false
}

async function confirmReturn() {
  if (!selectedReturn.value) return
  if (!returnForm.warehouseLocation || !returnForm.operator || !returnForm.acceptanceRemark) {
    ElMessage.warning('请填写入库仓位、经办人和验收说明')
    return
  }
  await store.completeQuarantineMarkReturn(selectedReturn.value.id)
  ElMessage.success('退回标志已入库')
  returnDialogVisible.value = false
}

function openManualAddDialog() {
  addForm.markNo = addForm.markType === 'card_ring' ? 'KH202606160001' : 'BQ202606160001'
  addDialogVisible.value = true
}

function pendingFeature(name: string) {
  ElMessage.info(`${name}功能待接入`)
}

function addInventory() {
  if (!addForm.markNo) {
    ElMessage.warning('请输入标志编号')
    return
  }
  if (store.data.quarantineMarks.some((item) => item.markNo === addForm.markNo)) {
    ElMessage.warning('该标志编号已存在')
    return
  }
  store.data.quarantineMarks.unshift({
    id: `mark-new-${Date.now()}`,
    markNo: addForm.markNo,
    markType: addForm.markType,
    ownerOrg: '监管端库存',
    status: 'in_stock',
    qrCode: `${addForm.markNo}-QR`,
    issuedAt: new Date().toISOString(),
  })
  let inventory = store.data.quarantineMarkInventories.find((item) => item.markType === addForm.markType && item.orgId === 'org-regulator-001')
  if (!inventory) {
    inventory = { id: `inv-reg-${Date.now()}`, orgId: 'org-regulator-001', markType: addForm.markType, total: 0, available: 0, used: 0, returned: 0, voided: 0 }
    store.data.quarantineMarkInventories.unshift(inventory)
  }
  inventory.total += 1
  inventory.available += 1
  ElMessage.success('单个标志已新增')
  addDialogVisible.value = false
}

function detailPage(key: string) {
  return detailPageMap[key] || 1
}

function detailRows(row: any) {
  const currentPage = detailPage(row.key)
  const start = (currentPage - 1) * 8
  return row.items.slice(start, start + 8)
}

function setDetailPage(key: string, page: number) {
  detailPageMap[key] = page
}
</script>

<template>
  <section class="stack mark-admin-page">
    <div class="page-header">
      <h2>检疫验讫标志管理 - {{ titleMap[activeMode] }}</h2>
      <p>屠宰端申领/退回申请，监管端审核后生成待发放单或待退回单，并完成发放记录和退回入库记录。</p>
    </div>

    <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr);">
      <article class="kpi-card"><span>待审核</span><b>{{ reviewApplications.length }}</b><small>申领/退回申请</small></article>
      <article class="kpi-card"><span>待发放</span><b>{{ pendingIssueOrders.length }}</b><small>审核后待发放单</small></article>
      <article class="kpi-card"><span>待退回入库</span><b>{{ pendingReturnOrders.length }}</b><small>审核后待退回单</small></article>
      <article class="kpi-card"><span>库存批次</span><b>{{ inventoryGroups.length }}</b><small>按批次和类型合并</small></article>
    </div>

    <el-card v-if="activeMode === 'review'" class="panel-card mark-card">
      <template #header><strong>申领/退回审核</strong></template>
      <el-table :data="reviewApplications" stripe class="full-table">
        <el-table-column prop="applicationNo" label="申请单号" min-width="150" />
        <el-table-column label="业务类型" width="110"><template #default="{ row }">{{ applicationTypeText(row.applicationType) }}</template></el-table-column>
        <el-table-column prop="orgName" label="申请单位" min-width="180" />
        <el-table-column label="标志类型" width="110"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="reason" label="申请说明" min-width="180" show-overflow-tooltip />
        <el-table-column prop="appliedBy" label="申请人" width="110" />
        <el-table-column label="状态" width="130"><template #default="{ row }"><el-tag :type="statusType[row.status] || 'info'" size="small">{{ applicationStatusText[row.status as MarkApplicationStatus] || row.status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="150" fixed="right"><template #default="{ row }"><el-button type="primary" size="small" @click="openReviewDialog(row)">审核</el-button></template></el-table-column>
      </el-table>
      <el-empty v-if="!reviewApplications.length" description="暂无待审核申请" />
    </el-card>

    <el-card v-if="activeMode === 'issue'" class="panel-card mark-card">
      <template #header><strong>标志发放</strong></template>
      <el-tabs v-model="issueTab">
        <el-tab-pane label="待发放" name="pending">
          <el-table :data="pendingIssueOrders" stripe class="full-table">
            <el-table-column prop="issueNo" label="发放单号" min-width="150" />
            <el-table-column prop="orgName" label="领用单位" min-width="180" />
            <el-table-column label="标志类型" width="110"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="quantity" label="发放数量" width="100" />
            <el-table-column label="编号段" min-width="240"><template #default="{ row }">{{ row.rangeStart }} ~ {{ row.rangeEnd }}</template></el-table-column>
            <el-table-column label="状态" width="110"><template #default="{ row }"><el-tag :type="statusType[row.status] || 'info'" size="small">{{ statusText[row.status] || row.status }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="150" fixed="right"><template #default="{ row }"><el-button type="success" size="small" @click="openIssueDialog(row)">办理发放</el-button></template></el-table-column>
          </el-table>
          <el-empty v-if="!pendingIssueOrders.length" description="暂无待发放单" />
        </el-tab-pane>
        <el-tab-pane label="发放记录" name="records">
          <el-table :data="issuedOrders" stripe class="full-table">
            <el-table-column prop="issueNo" label="发放单号" min-width="150" />
            <el-table-column prop="orgName" label="领用单位" min-width="180" />
            <el-table-column label="标志类型" width="110"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="quantity" label="发放数量" width="100" />
            <el-table-column label="编号段" min-width="240"><template #default="{ row }">{{ row.rangeStart }} ~ {{ row.rangeEnd }}</template></el-table-column>
            <el-table-column prop="issuedBy" label="发放人" width="150" />
            <el-table-column label="发放时间" min-width="170"><template #default="{ row }">{{ formatTime(row.issuedAt) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card v-if="activeMode === 'inventory'" class="panel-card mark-card">
      <template #header>
        <div class="card-header-line">
          <strong>标志库存</strong>
          <div class="inventory-add-actions">
            <el-button @click="pendingFeature('导入新增')">导入新增</el-button>
            <el-button @click="pendingFeature('扫码新增')">扫码新增</el-button>
            <el-button type="primary" @click="openManualAddDialog">手动新增</el-button>
          </div>
        </div>
      </template>
      <el-table :data="pagedInventoryGroups" stripe class="full-table batch-table">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="mark-detail-panel">
              <el-table :data="detailRows(row)" size="small" border class="full-table">
                <el-table-column prop="qrCode" label="标志二维码编号" min-width="220"><template #default="scope">{{ scope.row.qrCode || scope.row.markNo }}</template></el-table-column>
                <el-table-column prop="markNo" label="编号" min-width="160" />
                <el-table-column prop="ownerOrg" label="所属单位" min-width="170" />
                <el-table-column label="状态" width="110"><template #default="scope"><el-tag :type="statusType[scope.row.status] || 'info'" size="small">{{ statusText[scope.row.status] || scope.row.status }}</el-tag></template></el-table-column>
                <el-table-column label="发放时间" min-width="170"><template #default="scope">{{ formatTime(scope.row.issuedAt) }}</template></el-table-column>
                <el-table-column label="使用时间" min-width="170"><template #default="scope">{{ formatTime(scope.row.usedAt) }}</template></el-table-column>
              </el-table>
              <div class="table-pagination compact-pagination">
                <el-pagination
                  size="small"
                  background
                  layout="prev, pager, next"
                  :current-page="detailPage(row.key)"
                  :page-size="8"
                  :total="row.items.length"
                  @current-change="(page: number) => setDetailPage(row.key, page)"
                />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="productionBatchNo" label="生产批次号" min-width="130" />
        <el-table-column label="标志类型" width="110"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
        <el-table-column prop="purpose" label="标志用途" width="130" />
        <el-table-column prop="applicableObject" label="适用对象" min-width="180" show-overflow-tooltip />
        <el-table-column prop="spec" label="标志规格" min-width="130" />
        <el-table-column prop="material" label="标志材质" min-width="130" />
        <el-table-column prop="color" label="标志颜色" width="100" />
        <el-table-column prop="total" label="总数量" width="90" />
        <el-table-column prop="inStock" label="在库" width="80" />
        <el-table-column prop="issued" label="已发放" width="90" />
        <el-table-column prop="used" label="已使用" width="90" />
        <el-table-column prop="returned" label="已退回" width="90" />
        <el-table-column prop="voided" label="已作废" width="90" />
      </el-table>
      <div class="table-pagination">
        <el-pagination
          v-model:current-page="inventoryPage"
          v-model:page-size="inventoryPageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[5, 10, 20]"
          :total="inventoryGroups.length"
        />
      </div>
    </el-card>

    <el-card v-if="activeMode === 'return'" class="panel-card mark-card">
      <template #header><strong>标志退回入库</strong></template>
      <el-tabs v-model="returnTab">
        <el-tab-pane label="待退回入库" name="pending">
          <el-table :data="pendingReturnOrders" stripe class="full-table">
            <el-table-column prop="returnNo" label="退回入库单号" min-width="150" />
            <el-table-column prop="orgName" label="退回单位" min-width="180" />
            <el-table-column label="标志类型" width="110"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="quantity" label="退回数量" width="100" />
            <el-table-column prop="reason" label="退回原因" min-width="180" show-overflow-tooltip />
            <el-table-column label="状态" width="130"><template #default="{ row }"><el-tag :type="statusType[row.status] || 'info'" size="small">{{ statusText[row.status] || row.status }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="150" fixed="right"><template #default="{ row }"><el-button type="success" size="small" @click="openReturnDialog(row)">办理入库</el-button></template></el-table-column>
          </el-table>
          <el-empty v-if="!pendingReturnOrders.length" description="暂无待退回入库单" />
        </el-tab-pane>
        <el-tab-pane label="退回记录" name="records">
          <el-table :data="returnedOrders" stripe class="full-table">
            <el-table-column prop="returnNo" label="退回入库单号" min-width="150" />
            <el-table-column prop="orgName" label="退回单位" min-width="180" />
            <el-table-column label="标志类型" width="110"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="quantity" label="退回数量" width="100" />
            <el-table-column prop="returnedBy" label="入库经办人" width="150" />
            <el-table-column label="入库时间" min-width="170"><template #default="{ row }">{{ formatTime(row.returnedAt) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="reviewDialogVisible" title="标志申请审核" width="680px" destroy-on-close>
      <div v-if="selectedReview" class="dialog-summary-grid">
        <p><span>申请单号</span><b>{{ selectedReview.applicationNo }}</b></p>
        <p><span>业务类型</span><b>{{ applicationTypeText(selectedReview.applicationType) }}</b></p>
        <p><span>申请单位</span><b>{{ selectedReview.orgName }}</b></p>
        <p><span>标志类型</span><b>{{ markTypeText[selectedReview.markType as MarkType] }}</b></p>
        <p><span>申请数量</span><b>{{ selectedReview.quantity }}</b></p>
        <p><span>申请人</span><b>{{ selectedReview.appliedBy }}</b></p>
        <p class="wide"><span>申请原因</span><b>{{ selectedReview.reason }}</b></p>
        <p><span>申请时间</span><b>{{ formatTime(selectedReview.createdAt) }}</b></p>
      </div>
      <div v-if="selectedReview?.applicationType === 'return' && selectedReview?.markNos?.length" style="margin-bottom:14px">
        <el-table :data="selectedReview.markNos.map((no: string, i: number) => ({ index: i + 1, markNo: no }))" stripe size="small" max-height="260">
          <el-table-column prop="index" label="序号" width="60" />
          <el-table-column prop="markNo" label="退回标志编号" min-width="180" />
        </el-table>
      </div>
      <el-form label-position="top" class="dialog-form-block">
        <el-form-item label="审核人" required><el-input v-model="reviewForm.reviewer" /></el-form-item>
        <el-form-item label="审核意见" required><el-input v-model="reviewForm.opinion" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="danger" plain @click="rejectReview">审核驳回</el-button>
        <el-button type="primary" @click="confirmReview">审核通过</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="issueDialogVisible" title="办理标志发放" width="720px" destroy-on-close>
      <div v-if="selectedIssue" class="dialog-summary-grid">
        <p><span>发放单号</span><b>{{ selectedIssue.issueNo }}</b></p>
        <p><span>领用单位</span><b>{{ selectedIssue.orgName }}</b></p>
        <p><span>标志类型</span><b>{{ markTypeText[selectedIssue.markType as MarkType] }}</b></p>
        <p><span>发放数量</span><b>{{ selectedIssue.quantity }}</b></p>
        <p class="wide"><span>编号段</span><b>{{ selectedIssue.rangeStart }} ~ {{ selectedIssue.rangeEnd }}</b></p>
      </div>
      <el-form label-position="top" class="dialog-form-block two-col-form">
        <el-form-item label="发放方式"><el-select v-model="issueForm.method" class="full-width"><el-option label="现场领取" value="现场领取" /><el-option label="专人配送" value="专人配送" /></el-select></el-form-item>
        <el-form-item label="领取人" required><el-input v-model="issueForm.receiver" /></el-form-item>
        <el-form-item label="发放人" required><el-input v-model="issueForm.issuer" /></el-form-item>
        <el-form-item label="发放备注"><el-input v-model="issueForm.remark" /></el-form-item>
        <el-form-item class="wide" :label="'选择待发放标志 (已选 ' + issueSelectedMarkNos.length + ' / ' + (selectedIssue?.quantity ?? 0) + ')'">
          <el-table :data="issueAvailableMarks" stripe size="small" max-height="300" @selection-change="issueSelectedMarkNos = ($event as any[]).map((r: any) => r.markNo)">
            <el-table-column type="selection" width="60" />
            <el-table-column prop="markNo" label="标志编号" min-width="160" />
            <el-table-column label="二维码编号" min-width="200" prop="qrCode" show-overflow-tooltip />
            <el-table-column label="生产批次" width="140" prop="productionBatchNo" />
          </el-table>
          <div v-if="issueAvailableMarks.length < selectedIssue?.quantity" style="margin-top:8px;color:#f56c6c;font-size:13px">
            注意：库存中仅有 {{ issueAvailableMarks.length }} 个该类型在库标志，无法满足申领数量 {{ selectedIssue?.quantity }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="issueDialogVisible = false">取消</el-button><el-button type="success" @click="confirmIssue">确认发放</el-button></template>
    </el-dialog>

    <el-dialog v-model="returnDialogVisible" title="办理退回入库" width="720px" destroy-on-close>
      <div v-if="selectedReturn" class="dialog-summary-grid">
        <p><span>退回单号</span><b>{{ selectedReturn.returnNo }}</b></p>
        <p><span>退回单位</span><b>{{ selectedReturn.orgName }}</b></p>
        <p><span>标志类型</span><b>{{ markTypeText[selectedReturn.markType as MarkType] }}</b></p>
        <p><span>退回数量</span><b>{{ selectedReturn.quantity }}</b></p>
        <p class="wide"><span>退回原因</span><b>{{ selectedReturn.reason }}</b></p>
      </div>
      <el-form label-position="top" class="dialog-form-block two-col-form">
        <el-form-item label="入库仓位" required><el-input v-model="returnForm.warehouseLocation" /></el-form-item>
        <el-form-item label="经办人" required><el-input v-model="returnForm.operator" /></el-form-item>
        <el-form-item class="wide" label="验收说明" required><el-input v-model="returnForm.acceptanceRemark" type="textarea" :rows="3" /></el-form-item>
        <el-form-item class="wide" :label="'退回标志明细 (' + (selectedReturn?.markNos?.length || selectedReturn?.quantity || 0) + ' 个)'">
          <el-table v-if="selectedReturn?.markNos?.length" :data="selectedReturn.markNos.map((no: string, i: number) => ({ index: i + 1, markNo: no }))" stripe size="small" max-height="300">
            <el-table-column prop="index" label="序号" width="70" />
            <el-table-column prop="markNo" label="标志编号" min-width="180" />
          </el-table>
          <el-empty v-else description="暂无退回标志明细" :image-size="60" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="returnDialogVisible = false">取消</el-button><el-button type="success" @click="confirmReturn">确认入库</el-button></template>
    </el-dialog>

    <el-dialog v-model="addDialogVisible" title="手动新增单个标志" width="560px">
      <el-form label-width="110px">
        <el-form-item label="标志类型"><el-select v-model="addForm.markType" class="full-width"><el-option label="卡环式" value="card_ring" /><el-option label="粘贴式" value="sticker" /></el-select></el-form-item>
        <el-form-item label="标志编号" required><el-input v-model="addForm.markNo" placeholder="请输入单个标志编号" /></el-form-item>
        <el-form-item label="生产批次号"><el-input v-model="addForm.batchNo" /></el-form-item>
        <el-form-item label="标志规格"><el-input v-model="addForm.spec" /></el-form-item>
        <el-form-item label="标志材质"><el-input v-model="addForm.material" /></el-form-item>
        <el-form-item label="标志颜色"><el-input v-model="addForm.color" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="addDialogVisible = false">取消</el-button><el-button type="primary" @click="addInventory">确认新增</el-button></template>
    </el-dialog>
  </section>
</template>

<style scoped>
.mark-admin-page .mark-card {
  overflow: hidden;
}

.full-table {
  width: 100%;
}

.inventory-add-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
}

.compact-pagination {
  padding-top: 10px;
}

.mark-detail-panel {
  padding: 12px 16px;
  background: linear-gradient(180deg, #f8fbf9, #ffffff);
  border-radius: 10px;
}

.dialog-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  padding: 14px;
  margin-bottom: 14px;
  background: #f7faf8;
  border: 1px solid #e4efe8;
  border-radius: 12px;
}

.dialog-summary-grid p {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin: 0;
  font-size: 13px;
}

.dialog-summary-grid p.wide {
  grid-column: 1 / -1;
}

.dialog-summary-grid span {
  color: #6b7c70;
  white-space: nowrap;
}

.dialog-summary-grid b {
  color: #1f2d24;
  font-weight: 600;
  text-align: right;
}

.dialog-form-block {
  padding-top: 2px;
}

.two-col-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.two-col-form .wide {
  grid-column: 1 / -1;
}

:deep(.batch-table .el-table__expanded-cell) {
  background: #f5f8f6;
}

@media (max-width: 900px) {
  .dialog-summary-grid,
  .two-col-form {
    grid-template-columns: 1fr;
  }
}
</style>
