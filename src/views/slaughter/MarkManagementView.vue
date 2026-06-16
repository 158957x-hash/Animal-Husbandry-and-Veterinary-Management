<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { MarkType, MarkApplicationStatus } from '../../domain/models'

const store = useAppStore()
const activeTab = ref('inventory')
const applyDialogVisible = ref(false)
const returnDialogVisible = ref(false)
const usageDialogVisible = ref(false)

const applyForm = reactive({
  markType: 'card_ring' as MarkType,
  quantity: 100,
  reason: '',
  appliedBy: '',
})

const returnForm = reactive({
  markType: 'card_ring' as MarkType,
  quantity: 10,
  reason: '',
  appliedBy: '',
})

const usageForm = reactive({
  productBatchId: '',
  quarantineCertificateNo: '',
  meatQualityCertificateNo: '',
  markType: 'card_ring' as MarkType,
  useObject: '胴体',
  quantity: 0,
  markRangeStart: '',
  markRangeEnd: '',
  operator: '',
})

const markTypeText: Record<MarkType, string> = {
  card_ring: '卡环式',
  sticker: '粘贴式',
}

const applicationStatusText: Record<MarkApplicationStatus, string> = {
  pending_review: '申领待审核',
  approved: '待发放',
  rejected: '申领已驳回',
  issued: '已发放',
  return_pending_review: '退回待审核',
  return_approved: '待退回入库',
  return_rejected: '退回已驳回',
  returned: '已退回入库',
}

const applicationStatusType: Record<MarkApplicationStatus, 'info' | 'success' | 'warning' | 'danger' | 'primary'> = {
  pending_review: 'warning',
  approved: 'primary',
  rejected: 'danger',
  issued: 'success',
  return_pending_review: 'warning',
  return_approved: 'primary',
  return_rejected: 'danger',
  returned: 'success',
}

const issuedProductBatches = computed(() =>
  store.data.postProductBatches.filter((item) => item.productCertStatus === 'issued'),
)

const usedMarks = computed(() => store.data.quarantineMarks.filter((item) => item.status === 'used'))
const slaughterInventories = computed(() => store.data.quarantineMarkInventories.filter((item) => item.orgId === 'org-slaughter-001'))
const issueRecords = computed(() => store.data.quarantineMarkIssueOrders.filter((item) => item.orgId === 'org-slaughter-001' && item.status === 'issued'))
const returnOrders = computed(() => store.data.quarantineMarkReturnOrders.filter((item) => item.orgId === 'org-slaughter-001'))
const applicationRecords = computed(() => store.data.quarantineMarkApplications.filter((item) => (item.applicationType || 'apply') === 'apply'))
const returnApplicationRecords = computed(() => store.data.quarantineMarkApplications.filter((item) => item.applicationType === 'return'))

function onProductBatchSelect(batchId: string) {
  const batch = store.data.postProductBatches.find((b) => b.id === batchId)
  if (!batch) return
  const quarantineCert = store.data.quarantineCertificates.find((c) => c.id === batch.quarantineCertificateId)
  usageForm.quarantineCertificateNo = quarantineCert?.certificateNo || ''
  const meatQualityCert = store.data.meatQualityCertificates.find((c) => c.productBatchNo === batch.productBatchNo)
  usageForm.meatQualityCertificateNo = meatQualityCert?.certificateNo || ''
  const availableMarks = store.data.quarantineMarks.filter((m) => m.markType === usageForm.markType && m.status === 'in_stock')
  usageForm.markRangeStart = availableMarks[0]?.markNo || ''
  usageForm.markRangeEnd = availableMarks[Math.min(usageForm.quantity || 1, availableMarks.length) - 1]?.markNo || ''
}

function onQuantityChange() {
  const availableMarks = store.data.quarantineMarks.filter((m) => m.markType === usageForm.markType && m.status === 'in_stock')
  usageForm.markRangeStart = availableMarks[0]?.markNo || ''
  usageForm.markRangeEnd = availableMarks[Math.min(usageForm.quantity || 1, availableMarks.length) - 1]?.markNo || ''
}

function openUsageDialog() {
  usageForm.productBatchId = ''
  usageForm.quarantineCertificateNo = ''
  usageForm.meatQualityCertificateNo = ''
  usageForm.markType = 'card_ring'
  usageForm.useObject = '胴体'
  usageForm.quantity = 0
  usageForm.markRangeStart = ''
  usageForm.markRangeEnd = ''
  usageForm.operator = ''
  usageDialogVisible.value = true
}

async function submitApplication() {
  if (!applyForm.reason || !applyForm.appliedBy) {
    ElMessage.warning('请填写完整的申领信息')
    return
  }
  await store.applyQuarantineMarks({ ...applyForm })
  ElMessage.success('标志申领已提交，等待监管端审核')
  applyDialogVisible.value = false
}

async function submitReturnApplication() {
  if (!returnForm.reason || !returnForm.appliedBy) {
    ElMessage.warning('请填写完整的退回申请信息')
    return
  }
  await store.applyQuarantineMarkReturn({ ...returnForm })
  ElMessage.success('标志退回申请已提交，等待监管端审核')
  returnDialogVisible.value = false
}

async function submitMarkUsage() {
  if (!usageForm.productBatchId || !usageForm.operator || !usageForm.quantity) {
    ElMessage.warning('请填写完整的使用信息')
    return
  }
  const batch = store.data.postProductBatches.find((b) => b.id === usageForm.productBatchId)
  if (!batch) return
  const productCert = store.data.productCertificates.find((c) => c.productBatchNo === batch.productBatchNo)
  const quarantineCert = store.data.quarantineCertificates.find((c) => c.id === batch.quarantineCertificateId)
  const meatQualityCert = store.data.meatQualityCertificates.find((c) => c.productBatchNo === batch.productBatchNo)
  await store.submitMarkUsage({
    productBatchId: batch.id,
    productCertificateId: productCert?.id || '',
    quarantineCertificateId: quarantineCert?.id || '',
    meatQualityCertificateId: meatQualityCert?.id || '',
    slaughterApplicationId: batch.slaughterApplicationId,
    markType: usageForm.markType,
    quantity: usageForm.quantity,
    useObject: usageForm.useObject,
    operator: usageForm.operator,
  })
  ElMessage.success('检疫验讫标志使用记录已提交')
  usageDialogVisible.value = false
}
</script>

<template>
  <div class="gov-page">
    <el-card class="panel-card">
      <div class="page-hero">
        <div>
          <h2>检疫验讫标志管理</h2>
          <p>屠宰端负责申领、使用和退回申请；监管端审核、发放和退回入库。</p>
        </div>
        <div class="page-hero-actions">
          <el-button type="success" @click="applyDialogVisible = true">申领标志</el-button>
          <el-button type="warning" @click="returnDialogVisible = true">退回申请</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="panel-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="标志库存" name="inventory">
          <el-table :data="slaughterInventories" stripe>
            <el-table-column type="index" label="序号" width="70" />
            <el-table-column label="标志类型" width="120"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="total" label="总量" width="100" />
            <el-table-column prop="available" label="可用" width="100" />
            <el-table-column prop="used" label="已用" width="100" />
            <el-table-column prop="returned" label="已退回" width="100" />
            <el-table-column prop="voided" label="已作废" width="100" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="申领记录" name="applications">
          <el-table :data="applicationRecords" stripe>
            <el-table-column prop="applicationNo" label="申领编号" min-width="150" />
            <el-table-column label="标志类型" width="120"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="quantity" label="申领数量" width="100" />
            <el-table-column prop="reason" label="用途说明" min-width="180" />
            <el-table-column prop="appliedBy" label="申请人" width="110" />
            <el-table-column label="状态" width="120"><template #default="{ row }"><el-tag :type="applicationStatusType[row.status as MarkApplicationStatus]" size="small">{{ applicationStatusText[row.status as MarkApplicationStatus] }}</el-tag></template></el-table-column>
            <el-table-column label="发放范围" min-width="220"><template #default="{ row }">{{ row.issuedRangeStart || '-' }} ~ {{ row.issuedRangeEnd || '-' }}</template></el-table-column>
            <el-table-column label="申领时间" min-width="160"><template #default="{ row }">{{ formatTime(row.createdAt) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="发放记录" name="issueRecords">
          <el-table :data="issueRecords" stripe>
            <el-table-column prop="issueNo" label="发放单号" min-width="150" />
            <el-table-column label="标志类型" width="120"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="quantity" label="发放数量" width="100" />
            <el-table-column label="编号段" min-width="240"><template #default="{ row }">{{ row.rangeStart }} ~ {{ row.rangeEnd }}</template></el-table-column>
            <el-table-column prop="issuedBy" label="发放人" width="140" />
            <el-table-column label="发放时间" min-width="160"><template #default="{ row }">{{ formatTime(row.issuedAt) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="退回记录" name="returns">
          <el-table :data="returnApplicationRecords" stripe>
            <el-table-column prop="applicationNo" label="退回申请编号" min-width="150" />
            <el-table-column label="标志类型" width="120"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="quantity" label="退回数量" width="100" />
            <el-table-column prop="reason" label="退回原因" min-width="180" />
            <el-table-column label="状态" width="130"><template #default="{ row }"><el-tag :type="applicationStatusType[row.status as MarkApplicationStatus]" size="small">{{ applicationStatusText[row.status as MarkApplicationStatus] }}</el-tag></template></el-table-column>
            <el-table-column label="退回入库单" min-width="150"><template #default="{ row }">{{ returnOrders.find((item) => item.applicationId === row.id)?.returnNo || '-' }}</template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="使用记录" name="usage">
          <div class="tab-toolbar"><el-button type="primary" @click="openUsageDialog">使用检疫验讫标志</el-button></div>
          <el-table :data="usedMarks" stripe>
            <el-table-column prop="markNo" label="标志编号" min-width="150" />
            <el-table-column label="标志类型" width="120"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column label="使用对象" min-width="140"><template #default="{ row }">{{ row.productBatchNo || row.slaughterBatchId || '-' }}</template></el-table-column>
            <el-table-column label="使用时间" min-width="160"><template #default="{ row }">{{ formatTime(row.usedAt) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="applyDialogVisible" title="申领检疫验讫标志" width="480px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="标志类型" required><el-select v-model="applyForm.markType" class="full-width"><el-option label="卡环式" value="card_ring" /><el-option label="粘贴式" value="sticker" /></el-select></el-form-item>
        <el-form-item label="申领数量" required><el-input-number v-model="applyForm.quantity" :min="1" class="full-width" /></el-form-item>
        <el-form-item label="用途说明" required><el-input v-model="applyForm.reason" type="textarea" :rows="3" placeholder="请输入标志用途说明" /></el-form-item>
        <el-form-item label="申请人" required><el-input v-model="applyForm.appliedBy" placeholder="请输入申请人姓名" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="applyDialogVisible = false">取消</el-button><el-button type="primary" @click="submitApplication">提交申领</el-button></template>
    </el-dialog>

    <el-dialog v-model="returnDialogVisible" title="退回检疫验讫标志申请" width="480px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="标志类型" required><el-select v-model="returnForm.markType" class="full-width"><el-option label="卡环式" value="card_ring" /><el-option label="粘贴式" value="sticker" /></el-select></el-form-item>
        <el-form-item label="退回数量" required><el-input-number v-model="returnForm.quantity" :min="1" class="full-width" /></el-form-item>
        <el-form-item label="退回原因" required><el-input v-model="returnForm.reason" type="textarea" :rows="3" placeholder="请输入退回原因" /></el-form-item>
        <el-form-item label="申请人" required><el-input v-model="returnForm.appliedBy" placeholder="请输入申请人姓名" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="returnDialogVisible = false">取消</el-button><el-button type="primary" @click="submitReturnApplication">提交退回申请</el-button></template>
    </el-dialog>

    <el-dialog v-model="usageDialogVisible" title="使用检疫验讫标志" width="580px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="选择产品批次" required><el-select v-model="usageForm.productBatchId" class="full-width" placeholder="请选择已出证的产品批次" @change="onProductBatchSelect"><el-option v-for="batch in issuedProductBatches" :key="batch.id" :label="`${batch.productBatchNo} (${batch.productName})`" :value="batch.id" /></el-select></el-form-item>
        <el-form-item label="动物产品检疫证明编号"><el-input :model-value="usageForm.quarantineCertificateNo" disabled /></el-form-item>
        <el-form-item label="肉品品质检验合格证编号"><el-input :model-value="usageForm.meatQualityCertificateNo" disabled /></el-form-item>
        <el-form-item label="标志类型" required><el-radio-group v-model="usageForm.markType" @change="onQuantityChange"><el-radio-button label="card_ring">卡环式</el-radio-button><el-radio-button label="sticker">粘贴式</el-radio-button></el-radio-group></el-form-item>
        <el-form-item label="使用对象" required><el-select v-model="usageForm.useObject" class="full-width"><el-option label="胴体" value="胴体" /><el-option label="副产品" value="副产品" /><el-option label="包装箱" value="包装箱" /><el-option label="分割产品" value="分割产品" /></el-select></el-form-item>
        <el-form-item label="使用数量" required><el-input-number v-model="usageForm.quantity" :min="1" class="full-width" @change="onQuantityChange" /></el-form-item>
        <el-form-item label="标志编号段起止"><el-row :gutter="8"><el-col :span="12"><el-input :model-value="usageForm.markRangeStart" disabled placeholder="起始编号" /></el-col><el-col :span="12"><el-input :model-value="usageForm.markRangeEnd" disabled placeholder="截止编号" /></el-col></el-row></el-form-item>
        <el-form-item label="经办人" required><el-input v-model="usageForm.operator" placeholder="请输入经办人姓名" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="usageDialogVisible = false">取消</el-button><el-button type="primary" @click="submitMarkUsage">提交使用</el-button></template>
    </el-dialog>
  </div>
</template>
