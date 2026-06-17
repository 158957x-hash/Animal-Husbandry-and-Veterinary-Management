<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { VeterinarianAnnualReport } from '../../domain/models'

const store = useAppStore()
const isClinicAdmin = computed(() => store.currentRole === 'clinic_admin')
const isRegulator = computed(() => store.currentRole === 'regulator')

const keyword = ref('')
const activeTab = ref(isClinicAdmin.value ? 'pending' : 'pending')
const reviewVisible = ref(false)
const reviewReport = ref<VeterinarianAnnualReport | null>(null)
const reviewRemark = ref('')
const detailVisible = ref(false)
const currentReport = ref<VeterinarianAnnualReport | null>(null)
const currentPage = ref(0)

const allReports = computed(() => {
  let list = store.data.veterinarianAnnualReports
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter((item) =>
      String(item.year).includes(kw) ||
      item.veterinarianName.toLowerCase().includes(kw) ||
      item.institutionName.toLowerCase().includes(kw)
    )
  }
  return list
})

// Clinic admin tabs
const clinicPendingList = computed(() => allReports.value.filter((r) => r.status === 'submitted_to_clinic'))
const clinicApprovedList = computed(() => allReports.value.filter((r) => r.status === 'clinic_approved'))
const clinicRejectedList = computed(() => allReports.value.filter((r) => r.status === 'clinic_rejected'))

// Regulator tabs
const regPendingList = computed(() => allReports.value.filter((r) => r.status === 'submitted_to_regulator'))
const regApprovedList = computed(() => allReports.value.filter((r) => r.status === 'approved'))
const regRejectedList = computed(() => allReports.value.filter((r) => r.status === 'rejected'))

const currentList = computed(() => {
  if (isClinicAdmin.value) {
    if (activeTab.value === 'pending') return clinicPendingList.value
    if (activeTab.value === 'approved') return clinicApprovedList.value
    return clinicRejectedList.value
  }
  if (activeTab.value === 'pending') return regPendingList.value
  if (activeTab.value === 'approved') return regApprovedList.value
  return regRejectedList.value
})

function getStatusTag(row: VeterinarianAnnualReport) {
  const map: Record<string, { type: string; label: string }> = {
    generated: { type: 'warning', label: '已生成' },
    submitted_to_clinic: { type: 'primary', label: '待审核' },
    clinic_approved: { type: 'success', label: '已通过' },
    clinic_rejected: { type: 'danger', label: '已退回' },
    submitted_to_regulator: { type: 'primary', label: '待审核' },
    approved: { type: 'success', label: '已通过' },
    rejected: { type: 'danger', label: '已驳回' },
    archived: { type: 'success', label: '已归档' },
    withdrawn: { type: 'warning', label: '已退回' },
  }
  return map[row.status] || { type: 'info', label: row.status }
}

function getArchiveTag(row: VeterinarianAnnualReport) {
  if (row.archiveStatus === 'archived') return { type: 'success' as const, label: '已归档' }
  return { type: 'info' as const, label: '未归档' }
}

function onTabChange() {
  keyword.value = ''
}

// ---- Detail Dialog ----
function openDetail(row: VeterinarianAnnualReport) {
  currentReport.value = row
  currentPage.value = 0
  detailVisible.value = true
}

function reportNextPage() {
  if (!currentReport.value) return
  if (currentPage.value < currentReport.value.sections.length - 1) currentPage.value++
}

function reportPrevPage() {
  if (currentPage.value > 0) currentPage.value--
}

// ---- Clinic Admin Review Dialog ----
function openClinicReview(row: VeterinarianAnnualReport) {
  reviewReport.value = row
  reviewRemark.value = ''
  currentPage.value = 0
  reviewVisible.value = true
}

async function clinicApproveAction() {
  if (!reviewReport.value) return
  await store.clinicReviewVetAnnualReport(reviewReport.value.id, true, reviewRemark.value || '审核通过，可以提交监管端')
  ElMessage.success('已审核通过，可提交至监管端')
  reviewVisible.value = false
}

async function clinicRejectAction() {
  if (!reviewReport.value) return
  if (!reviewRemark.value) return ElMessage.warning('请填写退回原因')
  await store.clinicReviewVetAnnualReport(reviewReport.value.id, false, reviewRemark.value)
  ElMessage.success('已退回执业兽医')
  reviewVisible.value = false
}

async function submitToRegulator(row: VeterinarianAnnualReport) {
  await store.submitVetAnnualReportToRegulator(row.id)
  ElMessage.success('已提交至监管端')
}

// ---- Regulator Review Dialog ----
function openRegReview(row: VeterinarianAnnualReport) {
  reviewReport.value = row
  reviewRemark.value = ''
  currentPage.value = 0
  reviewVisible.value = true
}

async function regApproveAction() {
  if (!reviewReport.value) return
  await store.reviewVetAnnualReport(reviewReport.value.id, true, reviewRemark.value || '审核通过')
  ElMessage.success('审核通过')
  reviewVisible.value = false
}

async function regRejectAction() {
  if (!reviewReport.value) return
  if (!reviewRemark.value) return ElMessage.warning('请填写驳回原因')
  await store.reviewVetAnnualReport(reviewReport.value.id, false, reviewRemark.value)
  ElMessage.success('已驳回')
  reviewVisible.value = false
}

async function archiveReport(row: VeterinarianAnnualReport) {
  await store.archiveVetAnnualReport(row.id, '材料齐全，予以归档')
  ElMessage.success('年度报告已归档')
}
</script>

<template>
  <div class="review-page">
    <div class="page-header-card">
      <div class="header-left">
        <h2>执业兽医年度报告{{ isClinicAdmin ? '审核' : '管理' }}</h2>
        <p v-if="isClinicAdmin">审核本机构执业兽医提交的年度报告，审核通过后提交至监管端。</p>
        <p v-else>审核各机构提交的执业兽医年度报告，审核通过后可归档，驳回后机构需重新提交。</p>
      </div>
      <div class="header-right">
        <el-button @click="store.refresh()">刷新</el-button>
      </div>
    </div>

    <!-- Search -->
    <div class="search-card">
      <div class="search-row">
        <el-input v-model="keyword" placeholder="搜索姓名、机构或年度" clearable class="search-input">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary"><el-icon><Search /></el-icon>搜索</el-button>
      </div>
    </div>

    <!-- Tabbed Review -->
    <div class="tab-card">
      <el-tabs v-model="activeTab" class="review-tabs" @tab-change="onTabChange">
        <!-- Clinic Admin Tabs -->
        <template v-if="isClinicAdmin">
          <el-tab-pane name="pending">
            <template #label>
              <span class="tab-label">待审核<el-badge :value="clinicPendingList.length" :max="99" class="tab-badge" /></span>
            </template>
          </el-tab-pane>
          <el-tab-pane name="approved">
            <template #label>
              <span class="tab-label">已通过<el-badge :value="clinicApprovedList.length" :max="99" class="tab-badge" /></span>
            </template>
          </el-tab-pane>
          <el-tab-pane name="rejected">
            <template #label>
              <span class="tab-label">已退回<el-badge :value="clinicRejectedList.length" :max="99" class="tab-badge" /></span>
            </template>
          </el-tab-pane>
        </template>
        <!-- Regulator Tabs -->
        <template v-if="isRegulator">
          <el-tab-pane name="pending">
            <template #label>
              <span class="tab-label">待审核<el-badge :value="regPendingList.length" :max="99" class="tab-badge" /></span>
            </template>
          </el-tab-pane>
          <el-tab-pane name="approved">
            <template #label>
              <span class="tab-label">已通过<el-badge :value="regApprovedList.length" :max="99" class="tab-badge" /></span>
            </template>
          </el-tab-pane>
          <el-tab-pane name="rejected">
            <template #label>
              <span class="tab-label">已驳回<el-badge :value="regRejectedList.length" :max="99" class="tab-badge" /></span>
            </template>
          </el-tab-pane>
        </template>
      </el-tabs>

      <el-table :data="currentList" stripe style="width: 100%" empty-text="暂无数据">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="veterinarianName" label="姓名" width="100" />
        <el-table-column prop="institutionName" label="所属机构" min-width="160" />
        <el-table-column prop="year" label="年度" width="80" />
        <el-table-column label="报告编号" width="200">
          <template #default="{ row }">ZYSY-NB-{{ row.year }}-0001</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row).type" size="small">{{ getStatusTag(row).label }}</el-tag>
          </template>
        </el-table-column>
        <!-- Archive status for regulator approved tab -->
        <el-table-column v-if="isRegulator && activeTab === 'approved'" label="归档状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getArchiveTag(row).type" size="small">{{ getArchiveTag(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">
            {{ new Date(row.submittedToClinicAt || row.submittedToRegulatorAt || row.generatedAt).toLocaleDateString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="isClinicAdmin ? 260 : 220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="openDetail(row)">查看详情</el-button>
            <!-- Clinic Admin: 待审核 -->
            <template v-if="isClinicAdmin && row.status === 'submitted_to_clinic'">
              <el-button size="small" type="primary" @click="openClinicReview(row)">审核</el-button>
            </template>
            <!-- Clinic Admin: 已通过 - 提交至监管 -->
            <template v-if="isClinicAdmin && row.status === 'clinic_approved'">
              <el-button size="small" type="primary" @click="submitToRegulator(row)">提交至监管</el-button>
            </template>
            <!-- Regulator: 待审核 -->
            <template v-if="isRegulator && row.status === 'submitted_to_regulator'">
              <el-button size="small" type="primary" @click="openRegReview(row)">审核</el-button>
            </template>
            <!-- Regulator: 已通过 - 归档 -->
            <template v-if="isRegulator && row.status === 'approved' && row.archiveStatus !== 'archived'">
              <el-button size="small" type="success" @click="archiveReport(row)">归档</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Review Dialog -->
    <el-dialog v-model="reviewVisible" :title="isClinicAdmin ? '审核执业兽医年度报告' : '审核执业兽医年度报告'" width="800px" :close-on-click-modal="false">
      <div v-if="reviewReport" class="review-detail">
        <div class="review-section">
          <h4>报告基本信息</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="报告年度">{{ reviewReport.year }}年度</el-descriptions-item>
            <el-descriptions-item label="报告编号">ZYSY-NB-{{ reviewReport.year }}-0001</el-descriptions-item>
            <el-descriptions-item label="执业兽医">{{ reviewReport.veterinarianName }}</el-descriptions-item>
            <el-descriptions-item label="所属机构">{{ reviewReport.institutionName }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTag(reviewReport).type" size="small">{{ getStatusTag(reviewReport).label }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="生成时间">{{ new Date(reviewReport.generatedAt).toLocaleString('zh-CN') }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="review-section">
          <h4>报告内容</h4>
          <div class="page-indicator">
            <span>{{ reviewReport.sections[currentPage]?.title }}</span>
            <span class="page-num">{{ currentPage + 1 }} / {{ reviewReport.sections.length }}</span>
          </div>
          <div class="report-content" v-html="reviewReport.sections[currentPage]?.html" />
          <div class="report-pagination">
            <el-button :disabled="currentPage === 0" @click="reportPrevPage"><el-icon><ArrowLeft /></el-icon>上一页</el-button>
            <span class="page-info">{{ currentPage + 1 }} / {{ reviewReport.sections.length }}</span>
            <el-button :disabled="currentPage >= reviewReport.sections.length - 1" @click="reportNextPage">下一页<el-icon><ArrowRight /></el-icon></el-button>
          </div>
        </div>
        <div class="review-section">
          <h4>审核意见</h4>
          <el-input v-model="reviewRemark" type="textarea" :rows="2" placeholder="请输入审核意见（通过可不填，驳回必填）" />
        </div>
      </div>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <!-- Clinic Admin Review -->
        <template v-if="isClinicAdmin">
          <el-button type="danger" @click="clinicRejectAction">退回</el-button>
          <el-button type="success" @click="clinicApproveAction">审核通过</el-button>
        </template>
        <!-- Regulator Review -->
        <template v-if="isRegulator">
          <el-button type="danger" @click="regRejectAction">驳回</el-button>
          <el-button type="success" @click="regApproveAction">审核通过</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" :title="`${currentReport?.year || ''}年度报告详情`" width="820px" destroy-on-close>
      <div v-if="currentReport" class="report-body">
        <div class="detail-status">
          <el-tag :type="getStatusTag(currentReport).type">{{ getStatusTag(currentReport).label }}</el-tag>
          <span class="detail-institution">{{ currentReport.veterinarianName }} · {{ currentReport.institutionName }}</span>
        </div>
        <div v-if="currentReport.sections.length">
          <div class="page-indicator">
            <span>{{ currentReport.sections[currentPage]?.title }}</span>
            <span class="page-num">{{ currentPage + 1 }} / {{ currentReport.sections.length }}</span>
          </div>
          <div class="report-content" v-html="currentReport.sections[currentPage]?.html" />
          <div class="report-pagination">
            <el-button :disabled="currentPage === 0" @click="reportPrevPage"><el-icon><ArrowLeft /></el-icon>上一页</el-button>
            <span class="page-info">{{ currentPage + 1 }} / {{ currentReport.sections.length }}</span>
            <el-button :disabled="currentPage >= currentReport.sections.length - 1" @click="reportNextPage">下一页<el-icon><ArrowRight /></el-icon></el-button>
          </div>
        </div>
        <div v-else class="report-empty">
          <p>报告模板尚未配置，暂不支持预览。</p>
        </div>
        <div v-if="currentReport.clinicReviewRemark" class="review-remark">
          <span>机构审核备注：</span>{{ currentReport.clinicReviewRemark }}
        </div>
        <div v-if="currentReport.regulatorRemark" class="review-remark">
          <span>监管审核备注：</span>{{ currentReport.regulatorRemark }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.review-page { display: flex; flex-direction: column; gap: 16px; }
.page-header-card { display: flex; justify-content: space-between; align-items: flex-start; background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-header-card h2 { margin: 0 0 6px; font-size: 18px; color: #1d2129; }
.page-header-card p { margin: 0; font-size: 13px; color: #86909c; }
.header-right { display: flex; gap: 8px; flex-shrink: 0; }
.search-card { background: #fff; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.search-row { display: flex; gap: 12px; align-items: center; }
.search-input { flex: 1; max-width: 360px; }
.tab-card { background: #fff; border-radius: 8px; padding: 4px 16px 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.tab-label { display: inline-flex; align-items: center; gap: 6px; }
.tab-badge { margin-left: 4px; }
.review-detail { max-height: 55vh; overflow-y: auto; padding-right: 8px; }
.review-section { margin-bottom: 20px; }
.review-section h4 { margin: 0 0 10px; font-size: 14px; color: #1d2129; border-left: 3px solid #165dff; padding-left: 10px; }
.report-body { max-height: 55vh; overflow-y: auto; padding-right: 8px; }
.detail-status { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f2f3f5; }
.detail-institution { font-size: 14px; color: #4e5969; font-weight: 500; }
.page-indicator { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f7f8fa; border-radius: 6px; margin-bottom: 16px; font-size: 14px; font-weight: 600; color: #1d2129; }
.page-num { font-size: 12px; color: #86909c; font-weight: 400; }
.report-content { line-height: 1.8; font-size: 14px; color: #1d2129; }
.report-content :deep(.report-table) { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
.report-content :deep(.report-table th), .report-content :deep(.report-table td) { border: 1px solid #e5e6eb; padding: 8px 12px; text-align: left; }
.report-content :deep(.report-table th) { background: #f7f8fa; font-weight: 600; color: #1d2129; }
.report-content :deep(.report-table td.num) { text-align: right; }
.report-content :deep(h5) { margin: 16px 0 8px; font-size: 14px; color: #165dff; }
.report-content :deep(p) { margin: 8px 0; color: #4e5969; font-size: 13px; line-height: 1.8; }
.report-empty { text-align: center; padding: 40px; color: #86909c; }
.report-empty p { margin: 4px 0; font-size: 14px; }
.review-remark { margin-top: 16px; padding: 12px; background: #f7f8fa; border-radius: 6px; font-size: 13px; color: #4e5969; }
.review-remark span { font-weight: 600; color: #1d2129; }
.report-pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f2f3f5; }
.page-info { font-size: 13px; color: #86909c; }
</style>