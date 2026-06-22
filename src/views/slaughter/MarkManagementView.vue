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
const inventoryDetailVisible = ref(false)
const inventoryDetailPage = ref(1)
const selectedInventory = ref<any>(null)

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
const returnSelectedMarkNos = ref<string[]>([])
const returnAvailableMarks = computed(() => {
  return store.data.quarantineMarks.filter(
    (m) => m.markType === returnForm.markType && m.status === 'issued' && m.ownerOrg === '皖北标准化屠宰中心'
  )
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

const usedMarks = computed(() => store.data.quarantineMarks.filter((item) => item.status === 'used'))
const slaughterInventories = computed(() => store.data.quarantineMarkInventories.filter((item) => item.orgId === 'org-slaughter-001'))
const issueRecords = computed(() => store.data.quarantineMarkIssueOrders.filter((item) => item.orgId === 'org-slaughter-001' && item.status === 'issued'))
const returnOrders = computed(() => store.data.quarantineMarkReturnOrders.filter((item) => item.orgId === 'org-slaughter-001'))
const applicationRecords = computed(() => store.data.quarantineMarkApplications.filter((item) => (item.applicationType || 'apply') === 'apply'))
const returnApplicationRecords = computed(() => store.data.quarantineMarkApplications.filter((item) => item.applicationType === 'return'))
const inventoryDetailRows = computed(() => {
  if (!selectedInventory.value) return []
  const prefix = selectedInventory.value.markType === 'card_ring' ? 'KH' : 'BQ'
  const applicableObject = selectedInventory.value.markType === 'card_ring' ? '胴体' : '副产品 / 包装箱 / 分割产品'
  const spec = selectedInventory.value.markType === 'card_ring' ? 'Φ35mm 卡环' : '60mm × 40mm 标签'
  const material = selectedInventory.value.markType === 'card_ring' ? '食品级塑料' : '防水不干胶'
  const color = selectedInventory.value.markType === 'card_ring' ? '绿色' : '蓝白'
  return Array.from({ length: 10 }, (_, index) => {
    const seq = String(index + 1).padStart(4, '0')
    const markNo = `${prefix}20260616${seq}`
    return {
      qrCode: `https://trace.animal-vet.gov.cn/mark/${markNo}`,
      markNo,
      markType: selectedInventory.value.markType,
      purpose: '检疫验讫标志',
      applicableObject,
      spec,
      material,
      color,
      productionBatchNo: 'SCPC20260616001',
      status: '可用',
      issuedAt: '2026-06-16T10:00:00.000Z',
    }
  })
})

function openInventoryDetail(row: any) {
  selectedInventory.value = row
  inventoryDetailPage.value = 1
  inventoryDetailVisible.value = true
}

function showDetail() {
  ElMessage.info('详情功能待接入')
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
  if (returnSelectedMarkNos.value.length !== returnForm.quantity) {
    ElMessage.warning(`请选择 ${returnForm.quantity} 个待退回标志，当前已选 ${returnSelectedMarkNos.value.length} 个`)
    return
  }
  await store.applyQuarantineMarkReturn({ ...returnForm, markNos: returnSelectedMarkNos.value })
  ElMessage.success('标志退回申请已提交，等待监管端审核')
  returnDialogVisible.value = false
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
          <el-table :data="slaughterInventories" stripe class="full-table">
            <el-table-column type="index" label="序号" width="70" />
            <el-table-column label="标志类型" min-width="120"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="total" label="总量" min-width="100" />
            <el-table-column prop="available" label="可用" min-width="100" />
            <el-table-column prop="used" label="已用" min-width="100" />
            <el-table-column prop="returned" label="已退回" min-width="100" />
            <el-table-column prop="voided" label="已作废" min-width="100" />
            <el-table-column label="操作" width="110" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openInventoryDetail(row)">查看详情</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="申领记录" name="applications">
          <el-table :data="applicationRecords" stripe class="full-table">
            <el-table-column prop="applicationNo" label="申领编号" min-width="150" />
            <el-table-column label="标志类型" width="120"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="quantity" label="申领数量" width="100" />
            <el-table-column prop="reason" label="用途说明" min-width="180" />
            <el-table-column prop="appliedBy" label="申请人" width="110" />
            <el-table-column label="状态" width="120"><template #default="{ row }"><el-tag :type="applicationStatusType[row.status as MarkApplicationStatus]" size="small">{{ applicationStatusText[row.status as MarkApplicationStatus] }}</el-tag></template></el-table-column>
            <el-table-column label="发放范围" min-width="220"><template #default="{ row }">{{ row.issuedRangeStart || '-' }} ~ {{ row.issuedRangeEnd || '-' }}</template></el-table-column>
            <el-table-column label="申领时间" min-width="160"><template #default="{ row }">{{ formatTime(row.createdAt) }}</template></el-table-column>
            <el-table-column label="操作" width="110" fixed="right"><template #default><el-button link type="primary" @click="showDetail">查看详情</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="发放记录" name="issueRecords">
          <el-table :data="issueRecords" stripe class="full-table">
            <el-table-column prop="issueNo" label="发放单号" min-width="150" />
            <el-table-column label="标志类型" width="120"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="quantity" label="发放数量" width="100" />
            <el-table-column label="编号段" min-width="240"><template #default="{ row }">{{ row.rangeStart }} ~ {{ row.rangeEnd }}</template></el-table-column>
            <el-table-column prop="issuedBy" label="发放人" width="140" />
            <el-table-column label="发放时间" min-width="160"><template #default="{ row }">{{ formatTime(row.issuedAt) }}</template></el-table-column>
            <el-table-column label="操作" width="110" fixed="right"><template #default><el-button link type="primary" @click="showDetail">查看详情</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="退回记录" name="returns">
          <el-table :data="returnApplicationRecords" stripe class="full-table">
            <el-table-column prop="applicationNo" label="退回申请编号" min-width="150" />
            <el-table-column label="标志类型" width="120"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column prop="quantity" label="退回数量" width="100" />
            <el-table-column prop="reason" label="退回原因" min-width="180" />
            <el-table-column label="状态" width="130"><template #default="{ row }"><el-tag :type="applicationStatusType[row.status as MarkApplicationStatus]" size="small">{{ applicationStatusText[row.status as MarkApplicationStatus] }}</el-tag></template></el-table-column>
            <el-table-column label="退回入库单" min-width="150"><template #default="{ row }">{{ returnOrders.find((item) => item.applicationId === row.id)?.returnNo || '-' }}</template></el-table-column>
            <el-table-column label="操作" width="110" fixed="right"><template #default><el-button link type="primary" @click="showDetail">查看详情</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="使用记录" name="usage">
          <el-table :data="usedMarks" stripe class="full-table">
            <el-table-column prop="markNo" label="标志编号" min-width="150" />
            <el-table-column label="标志类型" width="120"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
            <el-table-column label="使用对象" min-width="140"><template #default="{ row }">{{ row.productBatchNo || row.slaughterBatchId || '-' }}</template></el-table-column>
            <el-table-column label="使用时间" min-width="160"><template #default="{ row }">{{ formatTime(row.usedAt) }}</template></el-table-column>
            <el-table-column label="操作" width="110" fixed="right"><template #default><el-button link type="primary" @click="showDetail">查看详情</el-button></template></el-table-column>
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

    <el-dialog v-model="returnDialogVisible" title="退回检疫验讫标志申请" width="680px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="标志类型" required><el-select v-model="returnForm.markType" class="full-width"><el-option label="卡环式" value="card_ring" /><el-option label="粘贴式" value="sticker" /></el-select></el-form-item>
        <el-form-item label="退回数量" required><el-input-number v-model="returnForm.quantity" :min="1" class="full-width" /></el-form-item>
        <el-form-item label="退回原因" required><el-input v-model="returnForm.reason" type="textarea" :rows="3" placeholder="请输入退回原因" /></el-form-item>
        <el-form-item label="申请人" required><el-input v-model="returnForm.appliedBy" placeholder="请输入申请人姓名" /></el-form-item>
        <el-form-item :label="'选择待退回标志 (已选 ' + returnSelectedMarkNos.length + ' / ' + returnForm.quantity + ')'">
          <el-table :data="returnAvailableMarks" stripe size="small" max-height="280" @selection-change="returnSelectedMarkNos = ($event as any[]).map((r: any) => r.markNo)">
            <el-table-column type="selection" width="60" />
            <el-table-column prop="markNo" label="标志编号" min-width="180" />
            <el-table-column label="发放时间" min-width="160"><template #default="{ row }">{{ formatTime(row.issuedAt) }}</template></el-table-column>
          </el-table>
          <div v-if="returnAvailableMarks.length < returnForm.quantity" style="margin-top:8px;color:#f56c6c;font-size:13px">
            注意：当前仅有 {{ returnAvailableMarks.length }} 个该类型可用标志，不足退回数量 {{ returnForm.quantity }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="returnDialogVisible = false">取消</el-button><el-button type="primary" @click="submitReturnApplication">提交退回申请</el-button></template>
    </el-dialog>

    <el-dialog v-model="inventoryDetailVisible" title="标志库存详情" width="1080px" top="6vh">
      <div v-if="selectedInventory" class="inventory-detail-summary">
        <p><span>标志类型</span><b>{{ markTypeText[selectedInventory.markType as MarkType] }}</b></p>
        <p><span>库存总量</span><b>{{ selectedInventory.total }}</b></p>
        <p><span>可用数量</span><b>{{ selectedInventory.available }}</b></p>
        <p><span>已使用</span><b>{{ selectedInventory.used }}</b></p>
      </div>
      <el-table :data="inventoryDetailRows" stripe border class="full-table">
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="qrCode" label="标志二维码编号" min-width="240" show-overflow-tooltip />
        <el-table-column prop="markNo" label="编号" min-width="160" />
        <el-table-column label="标志类型" width="110"><template #default="{ row }">{{ markTypeText[row.markType as MarkType] }}</template></el-table-column>
        <el-table-column prop="purpose" label="标志用途" width="130" />
        <el-table-column prop="applicableObject" label="适用对象" min-width="150" show-overflow-tooltip />
        <el-table-column prop="spec" label="标志规格" min-width="130" />
        <el-table-column prop="material" label="标志材质" min-width="130" />
        <el-table-column prop="color" label="标志颜色" width="100" />
        <el-table-column prop="productionBatchNo" label="生产批次号" min-width="150" />
        <el-table-column prop="status" label="状态" width="90"><template #default="{ row }"><el-tag type="success" size="small">{{ row.status }}</el-tag></template></el-table-column>
      </el-table>
      <div class="table-pagination">
        <el-pagination
          v-model:current-page="inventoryDetailPage"
          background
          layout="total, prev, pager, next, jumper"
          :page-size="10"
          :total="selectedInventory?.available || 0"
        />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.full-table {
  width: 100%;
}

.inventory-detail-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.inventory-detail-summary p {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  margin: 0;
  background: #f7faf8;
  border: 1px solid #e4efe8;
  border-radius: 12px;
}

.inventory-detail-summary span {
  color: #667085;
  font-size: 13px;
}

.inventory-detail-summary b {
  color: #12372a;
  font-size: 20px;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
}

:deep(.el-tabs__content) {
  width: 100%;
  overflow: visible;
}

:deep(.el-table) {
  --el-table-header-bg-color: #f6faf7;
}
</style>
