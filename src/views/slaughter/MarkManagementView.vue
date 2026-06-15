<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { MarkType, MarkApplicationStatus } from '../../domain/models'

const store = useAppStore()
const activeTab = ref('inventory')
const applyDialogVisible = ref(false)

const applyForm = reactive({
  markType: 'card_ring' as MarkType,
  quantity: 100,
  reason: '',
  appliedBy: '',
})

const markTypeText: Record<MarkType, string> = {
  card_ring: '卡环式',
  sticker: '粘贴式',
}

const applicationStatusText: Record<MarkApplicationStatus, string> = {
  pending_review: '待审核',
  approved: '已审核',
  rejected: '已驳回',
  issued: '已发放',
}

const applicationStatusType: Record<MarkApplicationStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  pending_review: 'warning',
  approved: 'info',
  rejected: 'danger',
  issued: 'success',
}

const usedMarks = computed(() => store.data.quarantineMarks.filter((item) => item.status === 'used'))

async function submitApplication() {
  if (!applyForm.reason || !applyForm.appliedBy) {
    ElMessage.warning('请填写完整的申领信息')
    return
  }
  await store.applyQuarantineMarks({
    markType: applyForm.markType,
    quantity: applyForm.quantity,
    reason: applyForm.reason,
    appliedBy: applyForm.appliedBy,
  })
  ElMessage.success('标志申领已提交，等待审核')
  applyDialogVisible.value = false
}

async function approveApplication(id: string) {
  await store.approveQuarantineMarkApplication(id)
  ElMessage.success('申领已审批通过')
}

async function issueMarks(id: string) {
  await store.issueQuarantineMarks(id)
  ElMessage.success('标志已发放')
}
</script>

<template>
  <div class="page-grid">
    <div class="topbar">
      <h1>检疫验讫标志管理</h1>
      <el-button type="success" @click="applyDialogVisible = true">申领标志</el-button>
    </div>

    <el-card class="panel-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="标志库存" name="inventory">
          <el-table :data="store.data.quarantineMarkInventories" stripe>
            <el-table-column type="index" label="序号" width="70" />
            <el-table-column label="标志类型" width="120">
              <template #default="{ row }">{{ markTypeText[row.markType as MarkType] || row.markType }}</template>
            </el-table-column>
            <el-table-column prop="total" label="总量" width="100" />
            <el-table-column prop="available" label="可用" width="100" />
            <el-table-column prop="used" label="已用" width="100" />
            <el-table-column prop="returned" label="已退回" width="100" />
            <el-table-column prop="voided" label="已作废" width="100" />
          </el-table>
          <el-empty v-if="!store.data.quarantineMarkInventories.length" description="暂无库存数据" />
        </el-tab-pane>

        <el-tab-pane label="申领记录" name="applications">
          <el-table :data="store.data.quarantineMarkApplications" stripe>
            <el-table-column type="index" label="序号" width="70" />
            <el-table-column prop="applicationNo" label="申领编号" min-width="140" />
            <el-table-column label="标志类型" width="120">
              <template #default="{ row }">{{ markTypeText[row.markType as MarkType] || row.markType }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="申领数量" width="100" />
            <el-table-column prop="reason" label="用途说明" min-width="160" />
            <el-table-column prop="appliedBy" label="申请人" width="100" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="applicationStatusType[row.status as MarkApplicationStatus]" size="small">
                  {{ applicationStatusText[row.status as MarkApplicationStatus] || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发放范围" min-width="180">
              <template #default="{ row }">
                <span v-if="row.issuedRangeStart && row.issuedRangeEnd">{{ row.issuedRangeStart }} ~ {{ row.issuedRangeEnd }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="申领时间" min-width="160">
              <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 'pending_review'" type="primary" size="small" @click="approveApplication(row.id)">审批</el-button>
                <el-button v-if="row.status === 'approved'" type="success" size="small" @click="issueMarks(row.id)">发放</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!store.data.quarantineMarkApplications.length" description="暂无申领记录" />
        </el-tab-pane>

        <el-tab-pane label="使用记录" name="usage">
          <el-table :data="usedMarks" stripe>
            <el-table-column type="index" label="序号" width="70" />
            <el-table-column prop="markNo" label="标志编号" min-width="140" />
            <el-table-column label="标志类型" width="120">
              <template #default="{ row }">{{ markTypeText[row.markType as MarkType] || row.markType }}</template>
            </el-table-column>
            <el-table-column label="使用对象" min-width="140">
              <template #default="{ row }">{{ row.productBatchNo || row.slaughterBatchId || '-' }}</template>
            </el-table-column>
            <el-table-column label="关联产品证" min-width="140">
              <template #default="{ row }">{{ row.productCertificateId || '-' }}</template>
            </el-table-column>
            <el-table-column label="使用时间" min-width="160">
              <template #default="{ row }">{{ formatTime(row.usedAt) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!usedMarks.length" description="暂无使用记录" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="applyDialogVisible" title="申领检疫验讫标志" width="480px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="标志类型" required>
          <el-select v-model="applyForm.markType" class="full-width">
            <el-option label="卡环式" value="card_ring" />
            <el-option label="粘贴式" value="sticker" />
          </el-select>
        </el-form-item>
        <el-form-item label="申领数量" required>
          <el-input-number v-model="applyForm.quantity" :min="1" class="full-width" />
        </el-form-item>
        <el-form-item label="用途说明" required>
          <el-input v-model="applyForm.reason" type="textarea" :rows="3" placeholder="请输入标志用途说明" />
        </el-form-item>
        <el-form-item label="申请人" required>
          <el-input v-model="applyForm.appliedBy" placeholder="请输入申请人姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApplication">提交申领</el-button>
      </template>
    </el-dialog>
  </div>
</template>
