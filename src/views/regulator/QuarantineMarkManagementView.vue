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

const addForm = reactive({
  markType: 'card_ring' as MarkType,
  quantity: 100,
  batchNo: 'SCPC20260616001',
  spec: '标准规格',
  material: '食品级塑料',
  color: '绿色',
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
const returnOrders = computed(() => store.data.quarantineMarkReturnOrders)
const pendingReturnOrders = computed(() => returnOrders.value.filter((item) => item.status === 'pending_return'))
const markRows = computed(() => store.data.quarantineMarks)

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
  return row.productionBatchNo || row.batchNo || row.issuedAt?.slice(0, 10).replace(/-/g, '') || '-'
}

async function approveApplication(id: string) {
  await store.approveQuarantineMarkApplication(id)
  ElMessage.success('审核通过，已生成后续待办单据')
}

async function issueOrder(id: string) {
  await store.issueQuarantineMarks(id)
  ElMessage.success('标志已发放，发放记录已生成')
}

async function completeReturn(id: string) {
  await store.completeQuarantineMarkReturn(id)
  ElMessage.success('退回标志已入库')
}

function addInventory() {
  const prefix = addForm.markType === 'card_ring' ? 'KH' : 'BQ'
  const start = store.data.quarantineMarks.length + 1
  for (let i = 0; i < addForm.quantity; i += 1) {
    store.data.quarantineMarks.unshift({
      id: `mark-new-${Date.now()}-${i}`,
      markNo: `${prefix}${addForm.batchNo}${String(start + i).padStart(4, '0')}`,
      markType: addForm.markType,
      ownerOrg: '监管端库存',
      status: 'in_stock',
      qrCode: `${prefix}-QR-${addForm.batchNo}-${start + i}`,
      issuedAt: new Date().toISOString(),
    })
  }
  let inventory = store.data.quarantineMarkInventories.find((item) => item.markType === addForm.markType && item.orgId === 'org-regulator-001')
  if (!inventory) {
    inventory = { id: `inv-reg-${Date.now()}`, orgId: 'org-regulator-001', markType: addForm.markType, total: 0, available: 0, used: 0, returned: 0, voided: 0 }
    store.data.quarantineMarkInventories.unshift(inventory)
  }
  inventory.total += addForm.quantity
  inventory.available += addForm.quantity
  ElMessage.success('监管库存已新增')
  addDialogVisible.value = false
}
</script>

<template>
  <section class="stack">
    <div class="page-header">
      <h2>检疫验讫标志管理 - {{ titleMap[activeMode] }}</h2>
      <p>屠宰端申领/退回申请，监管端审核后生成待发放单或待退回单，并完成发放记录和退回入库记录。</p>
    </div>

    <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr);">
      <article class="kpi-card"><span>待审核</span><b>{{ reviewApplications.length }}</b><small>申领/退回申请</small></article>
      <article class="kpi-card"><span>待发放</span><b>{{ pendingIssueOrders.length }}</b><small>审核后待发放单</small></article>
      <article class="kpi-card"><span>待退回入库</span><b>{{ pendingReturnOrders.length }}</b><small>审核后待退回单</small></article>
      <article class="kpi-card"><span>可用库存</span><b>{{ store.data.quarantineMarkInventories.reduce((sum, item) => sum + item.available, 0) }}</b><small>屠宰端 + 监管端</small></article>
    </div>

    <el-card v-if="activeMode === 'review'" class="panel-card">
      <template #header><strong>申领/退回审核</strong></template>
      <el-table :data="reviewApplications" stripe>
        <el-table-column prop="applicationNo" label="申请单号" min-width="150" />
        <el-table-column label="业务类型" width="110"><template #default="{ row }">{{ applicationTypeText(row.applicationType) }}</template></el-table-column>
        <el-table-column prop="orgName" label="申请单位" min-width="180" />
        <el-table-column label="标志类型" width="110"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="reason" label="申请说明" min-width="180" />
        <el-table-column prop="appliedBy" label="申请人" width="110" />
        <el-table-column label="状态" width="130"><template #default="{ row }"><el-tag :type="statusType[row.status] || 'info'" size="small">{{ applicationStatusText[row.status as MarkApplicationStatus] || row.status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="120"><template #default="{ row }"><el-button link type="primary" @click="approveApplication(row.id)">审核通过</el-button></template></el-table-column>
      </el-table>
      <el-empty v-if="!reviewApplications.length" description="暂无待审核申请" />
    </el-card>

    <el-card v-if="activeMode === 'issue'" class="panel-card">
      <template #header><strong>标志发放</strong></template>
      <el-table :data="issueOrders" stripe>
        <el-table-column prop="issueNo" label="发放单号" min-width="150" />
        <el-table-column prop="orgName" label="领用单位" min-width="180" />
        <el-table-column label="标志类型" width="110"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
        <el-table-column prop="quantity" label="发放数量" width="100" />
        <el-table-column label="编号段" min-width="240"><template #default="{ row }">{{ row.rangeStart }} ~ {{ row.rangeEnd }}</template></el-table-column>
        <el-table-column label="状态" width="110"><template #default="{ row }"><el-tag :type="statusType[row.status] || 'info'" size="small">{{ statusText[row.status] || row.status }}</el-tag></template></el-table-column>
        <el-table-column label="发放时间" min-width="160"><template #default="{ row }">{{ formatTime(row.issuedAt) }}</template></el-table-column>
        <el-table-column label="操作" width="120"><template #default="{ row }"><el-button v-if="row.status === 'pending_issue'" link type="success" @click="issueOrder(row.id)">发放</el-button><span v-else>-</span></template></el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="activeMode === 'inventory'" class="panel-card">
      <template #header><div class="card-header-line"><strong>标志库存</strong><el-button type="primary" @click="addDialogVisible = true">新增库存</el-button></div></template>
      <el-table :data="markRows" stripe>
        <el-table-column prop="qrCode" label="标志二维码编号" min-width="170"><template #default="{ row }">{{ row.qrCode || row.markNo }}</template></el-table-column>
        <el-table-column label="标志类型" width="110"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
        <el-table-column label="标志用途" width="120"><template #default>{{ markPurpose() }}</template></el-table-column>
        <el-table-column label="适用对象" min-width="180"><template #default="{ row }">{{ applicableObject(row.markType) }}</template></el-table-column>
        <el-table-column label="标志规格" min-width="130"><template #default="{ row }">{{ markSpec(row.markType) }}</template></el-table-column>
        <el-table-column label="标志材质" min-width="130"><template #default="{ row }">{{ markMaterial(row.markType) }}</template></el-table-column>
        <el-table-column label="标志颜色" width="100"><template #default="{ row }">{{ markColor(row.markType) }}</template></el-table-column>
        <el-table-column prop="markNo" label="编号" min-width="150" />
        <el-table-column label="生产批次号" min-width="140"><template #default="{ row }">{{ batchNo(row) }}</template></el-table-column>
        <el-table-column prop="ownerOrg" label="所属单位" min-width="160" />
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="statusType[row.status] || 'info'" size="small">{{ statusText[row.status] || row.status }}</el-tag></template></el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="activeMode === 'return'" class="panel-card">
      <template #header><strong>标志退回入库</strong></template>
      <el-table :data="returnOrders" stripe>
        <el-table-column prop="returnNo" label="退回入库单号" min-width="150" />
        <el-table-column prop="orgName" label="退回单位" min-width="180" />
        <el-table-column label="标志类型" width="110"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
        <el-table-column prop="quantity" label="退回数量" width="100" />
        <el-table-column prop="reason" label="退回原因" min-width="180" />
        <el-table-column label="状态" width="130"><template #default="{ row }"><el-tag :type="statusType[row.status] || 'info'" size="small">{{ statusText[row.status] || row.status }}</el-tag></template></el-table-column>
        <el-table-column label="入库时间" min-width="160"><template #default="{ row }">{{ formatTime(row.returnedAt) }}</template></el-table-column>
        <el-table-column label="操作" width="130"><template #default="{ row }"><el-button v-if="row.status === 'pending_return'" link type="success" @click="completeReturn(row.id)">退回入库</el-button><span v-else>-</span></template></el-table-column>
      </el-table>
      <el-empty v-if="!returnOrders.length" description="暂无退回入库单" />
    </el-card>

    <el-dialog v-model="addDialogVisible" title="新增标志库存" width="520px">
      <el-form label-width="110px">
        <el-form-item label="标志类型"><el-select v-model="addForm.markType"><el-option label="卡环式" value="card_ring" /><el-option label="粘贴式" value="sticker" /></el-select></el-form-item>
        <el-form-item label="新增数量"><el-input-number v-model="addForm.quantity" :min="1" /></el-form-item>
        <el-form-item label="生产批次号"><el-input v-model="addForm.batchNo" /></el-form-item>
        <el-form-item label="标志规格"><el-input v-model="addForm.spec" /></el-form-item>
        <el-form-item label="标志材质"><el-input v-model="addForm.material" /></el-form-item>
        <el-form-item label="标志颜色"><el-input v-model="addForm.color" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="addDialogVisible = false">取消</el-button><el-button type="primary" @click="addInventory">确认新增</el-button></template>
    </el-dialog>
  </section>
</template>
