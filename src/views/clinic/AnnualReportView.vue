<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { AnnualReport } from '../../domain/models'

const store = useAppStore()
const isRegulator = computed(() => store.currentRole === 'regulator')

const keyword = ref('')
const activeTab = ref('pending')
const reviewVisible = ref(false)
const reviewReport = ref<AnnualReport | null>(null)
const reviewRemark = ref('')
const detailVisible = ref(false)
const currentReport = ref<AnnualReport | null>(null)
const currentPage = ref(0)

// Clinic admin
const yearDialogVisible = ref(false)
const selectedYear = ref(new Date().getFullYear())
const generating = ref(false)
const progressPercent = ref(0)
const progressText = ref('')
const reportDialogVisible = ref(false)

const approvedInstitutions = computed(() => store.data.clinicInstitutions.filter((item) => item.status === 'approved' && item.active))

const allReports = computed(() => {
  let list = store.data.annualReports
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter((item) =>
      String(item.year).includes(kw) || item.institutionName.toLowerCase().includes(kw)
    )
  }
  return list
})

const pendingList = computed(() => allReports.value.filter((r) => r.status === 'pending'))
const approvedList = computed(() => allReports.value.filter((r) => r.status === 'approved'))
const rejectedList = computed(() => allReports.value.filter((r) => r.status === 'rejected'))
const currentList = computed(() => {
  if (activeTab.value === 'pending') return pendingList.value
  if (activeTab.value === 'approved') return approvedList.value
  return rejectedList.value
})

const clinicReports = computed(() => allReports.value)

function getStatusTag(row: AnnualReport) {
  const map: Record<string, { type: string; label: string }> = {
    draft: { type: 'info', label: '草稿' },
    generated: { type: 'warning', label: '已生成' },
    submitted: { type: 'primary', label: '已提交' },
    pending: { type: 'warning', label: '待审核' },
    approved: { type: 'success', label: '已通过' },
    rejected: { type: 'danger', label: '已驳回' },
    withdrawn: { type: 'warning', label: '已退回' },
    archived: { type: 'success', label: '已归档' },
  }
  return map[row.status] || { type: 'info', label: row.status }
}

function getArchiveTag(row: AnnualReport) {
  if (row.archiveStatus === 'archived') return { type: 'success' as const, label: '已归档' }
  return { type: 'info' as const, label: '未归档' }
}

// ---- Regulator Actions ----
function openReview(row: AnnualReport) {
  reviewReport.value = row
  reviewRemark.value = ''
  reviewVisible.value = true
}

async function approve() {
  if (!reviewReport.value) return
  await store.reviewAnnualReport(reviewReport.value.id, true, reviewRemark.value || '审核通过')
  ElMessage.success('审核通过')
  reviewVisible.value = false
}

async function reject() {
  if (!reviewReport.value) return
  if (!reviewRemark.value) return ElMessage.warning('请填写驳回原因')
  await store.reviewAnnualReport(reviewReport.value.id, false, reviewRemark.value)
  ElMessage.success('已驳回')
  reviewVisible.value = false
}

async function archiveReport(row: AnnualReport) {
  await store.archiveAnnualReport(row.id, '材料齐全，予以归档')
  ElMessage.success('年度报告已归档')
}

function openDetail(row: AnnualReport) {
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

function onTabChange() {
  keyword.value = ''
}

// ---- Clinic Admin Actions ----
function openYearDialog() {
  selectedYear.value = new Date().getFullYear()
  yearDialogVisible.value = true
}

async function startGenerate() {
  const inst = approvedInstitutions.value[0]
  if (!inst) return ElMessage.warning('请先完成诊疗机构备案审核')
  yearDialogVisible.value = false
  generating.value = true
  progressPercent.value = 0
  const steps = [
    { p: 5, t: '正在连接AI引擎...' }, { p: 15, t: '正在采集诊疗机构基本信息...' }, { p: 30, t: '正在汇总执业兽医人员数据...' },
    { p: 50, t: '正在统计年度诊疗服务情况...' }, { p: 70, t: '正在整理宠物主人建档与免疫台账...' },
    { p: 85, t: '正在分析处方笺与药品使用数据...' }, { p: 95, t: '正在生成年度自查报告...' }, { p: 100, t: 'AI智能生成完成！' },
  ]
  for (const step of steps) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400))
    progressPercent.value = step.p; progressText.value = step.t
  }
  const report = await store.generateAnnualReport(inst.id, selectedYear.value)
  generating.value = false
  ElMessage.success('AI智能生成年度报告完成！')
  currentReport.value = report; currentPage.value = 0; reportDialogVisible.value = true
}

async function saveReport() {
  if (!currentReport.value) return
  await store.saveAnnualReport(currentReport.value.id)
  ElMessage.success('报告已保存为草稿'); reportDialogVisible.value = false
}

function regenerate() { reportDialogVisible.value = false; openYearDialog() }

async function saveAndSubmit() {
  if (!currentReport.value) return
  await store.saveAnnualReport(currentReport.value.id)
  await store.submitAnnualReport(currentReport.value.id)
  ElMessage.success('年度报告已保存并提交至监管端'); reportDialogVisible.value = false
}

async function submitReport(id: string) {
  await store.submitAnnualReport(id)
  ElMessage.success('年度报告已提交至监管端')
}
</script>

<template>
  <div class="report-page">
    <div class="page-header-card">
      <div class="header-left">
        <h2>年度报告{{ isRegulator ? '审核' : '管理' }}</h2>
        <p v-if="!isRegulator">年度报告由AI智能汇聚诊疗业务数据生成，支持保存、提交至监管端审核归档。</p>
        <p v-else>审核诊疗机构提交的年度报告，审核通过后可归档，驳回后机构需重新提交。</p>
      </div>
      <div class="header-right">
        <el-button @click="store.refresh()">刷新</el-button>
        <el-button v-if="!isRegulator" type="primary" @click="openYearDialog">AI智能生成年度报告</el-button>
      </div>
    </div>

    <!-- Search (regulator) -->
    <div v-if="isRegulator" class="search-card">
      <div class="search-row">
        <el-input v-model="keyword" placeholder="搜索机构名称或年度" clearable class="search-input">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary"><el-icon><Search /></el-icon>搜索</el-button>
      </div>
    </div>

    <!-- Regulator: Tabbed Review -->
    <template v-if="isRegulator">
      <div class="tab-card">
        <el-tabs v-model="activeTab" class="review-tabs" @tab-change="onTabChange">
          <el-tab-pane name="pending"><template #label><span class="tab-label">待审核<el-badge :value="pendingList.length" :max="99" class="tab-badge" /></span></template></el-tab-pane>
          <el-tab-pane name="approved"><template #label><span class="tab-label">已通过<el-badge :value="approvedList.length" :max="99" class="tab-badge" /></span></template></el-tab-pane>
          <el-tab-pane name="rejected"><template #label><span class="tab-label">已驳回<el-badge :value="rejectedList.length" :max="99" class="tab-badge" /></span></template></el-tab-pane>
        </el-tabs>
        <el-table :data="currentList" stripe style="width: 100%" empty-text="暂无数据">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="institutionName" label="诊疗机构" min-width="180" />
          <el-table-column prop="year" label="年度" width="80" />
          <el-table-column label="报告编号" width="200"><template #default="{ row }">ZLJG-NB-{{ row.year }}-0001</template></el-table-column>
          <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="getStatusTag(row).type" size="small">{{ getStatusTag(row).label }}</el-tag></template></el-table-column>
          <el-table-column v-if="activeTab === 'approved'" label="归档状态" width="100"><template #default="{ row }"><el-tag :type="getArchiveTag(row).type" size="small">{{ getArchiveTag(row).label }}</el-tag></template></el-table-column>
          <el-table-column label="提交时间" width="170"><template #default="{ row }">{{ new Date(row.submittedAt || row.generatedAt).toLocaleDateString('zh-CN') }}</template></el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openDetail(row)">查看详情</el-button>
              <el-button v-if="row.status === 'pending'" size="small" type="primary" @click="openReview(row)">审核</el-button>
              <el-button v-if="row.status === 'approved' && row.archiveStatus !== 'archived'" size="small" type="success" @click="archiveReport(row)">归档</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- Clinic Admin: Table -->
    <template v-if="!isRegulator">
      <div class="search-card">
        <div class="search-row">
          <el-input v-model="keyword" placeholder="搜索机构名称、年度或编号" clearable class="search-input">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary"><el-icon><Search /></el-icon>搜索</el-button>
        </div>
      </div>
      <div class="table-card">
        <el-table :data="clinicReports" stripe style="width: 100%" empty-text="暂无年度报告数据">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="institutionName" label="诊疗机构" min-width="180" />
          <el-table-column prop="year" label="年度" width="80" />
          <el-table-column label="报告编号" width="200"><template #default="{ row }">ZLJG-NB-{{ row.year }}-0001</template></el-table-column>
          <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="getStatusTag(row).type" size="small">{{ getStatusTag(row).label }}</el-tag></template></el-table-column>
          <el-table-column prop="veterinarianCount" label="兽医数" width="80" />
          <el-table-column prop="prescriptionCount" label="处方数" width="80" />
          <el-table-column label="生成时间" width="170"><template #default="{ row }">{{ new Date(row.generatedAt).toLocaleDateString('zh-CN') }}</template></el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openDetail(row)">查看详情</el-button>
              <el-button v-if="row.status === 'generated' || row.status === 'draft'" size="small" link type="success" @click="submitReport(row.id)">提交</el-button>
              <el-button v-if="row.status === 'withdrawn' || row.status === 'rejected'" size="small" link type="warning" @click="openYearDialog">重新生成</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- Review Dialog -->
    <el-dialog v-model="reviewVisible" title="审核年度报告" width="800px" :close-on-click-modal="false">
      <div v-if="reviewReport" class="review-detail">
        <div class="review-section">
          <h4>报告基本信息</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="报告年度">{{ reviewReport.year }}年度</el-descriptions-item>
            <el-descriptions-item label="报告编号">ZLJG-NB-{{ reviewReport.year }}-0001</el-descriptions-item>
            <el-descriptions-item label="诊疗机构">{{ reviewReport.institutionName }}</el-descriptions-item>
            <el-descriptions-item label="状态"><el-tag :type="getStatusTag(reviewReport).type" size="small">{{ getStatusTag(reviewReport).label }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="兽医数">{{ reviewReport.veterinarianCount }}</el-descriptions-item>
            <el-descriptions-item label="处方数">{{ reviewReport.prescriptionCount }}</el-descriptions-item>
            <el-descriptions-item label="宠物数">{{ reviewReport.petCount }}</el-descriptions-item>
            <el-descriptions-item label="免疫数">{{ reviewReport.immunizationCount }}</el-descriptions-item>
            <el-descriptions-item label="生成时间">{{ new Date(reviewReport.generatedAt).toLocaleString('zh-CN') }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ reviewReport.submittedAt ? new Date(reviewReport.submittedAt).toLocaleString('zh-CN') : '-' }}</el-descriptions-item>
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
        <el-button type="danger" @click="reject">驳回</el-button>
        <el-button type="success" @click="approve">审核通过</el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" :title="`${currentReport?.year || ''}年度报告详情`" width="820px" destroy-on-close>
      <div v-if="currentReport && currentReport.sections.length" class="report-body">
        <div class="detail-status">
          <el-tag :type="getStatusTag(currentReport).type">{{ getStatusTag(currentReport).label }}</el-tag>
          <span class="detail-institution">{{ currentReport.institutionName }}</span>
        </div>
        <div class="page-indicator"><span>{{ currentReport.sections[currentPage]?.title }}</span><span class="page-num">{{ currentPage + 1 }} / {{ currentReport.sections.length }}</span></div>
        <div class="report-content" v-html="currentReport.sections[currentPage]?.html" />
        <div class="report-pagination">
          <el-button :disabled="currentPage === 0" @click="reportPrevPage"><el-icon><ArrowLeft /></el-icon>上一页</el-button>
          <span class="page-info">{{ currentPage + 1 }} / {{ currentReport.sections.length }}</span>
          <el-button :disabled="currentPage >= currentReport.sections.length - 1" @click="reportNextPage">下一页<el-icon><ArrowRight /></el-icon></el-button>
        </div>
      </div>
    </el-dialog>

    <!-- Clinic dialogs: Year/Generate/Result -->
    <el-dialog v-model="yearDialogVisible" title="选择报告年度" width="400px" :close-on-click-modal="false">
      <div class="year-select-body"><p class="year-hint">请选择需要生成年度报告的年份</p><el-select v-model="selectedYear" size="large" class="year-select"><el-option v-for="y in 10" :key="y" :label="`${2021+y-1}年度`" :value="2021+y-1" /></el-select></div>
      <template #footer><el-button @click="yearDialogVisible = false">取消</el-button><el-button type="primary" @click="startGenerate">确认生成</el-button></template>
    </el-dialog>
    <el-dialog v-model="generating" title="AI智能生成年度报告" width="520px" :close-on-click-modal="false" :show-close="false">
      <div class="generating-body"><div class="ai-animation"><div class="ai-pulse"></div><div class="ai-ring"></div></div><el-progress :percentage="progressPercent" :stroke-width="6" :show-text="false" /><p class="generating-text">{{ progressText }}</p><p class="generating-sub">AI正在自动汇总诊疗业务数据，请稍候...</p></div>
    </el-dialog>
    <el-dialog v-model="reportDialogVisible" :title="`${currentReport?.year || ''}年度报告`" width="820px" :close-on-click-modal="false" destroy-on-close>
      <div v-if="currentReport && currentReport.sections.length" class="report-body">
        <div class="page-indicator"><span>{{ currentReport.sections[currentPage]?.title }}</span><span class="page-num">{{ currentPage + 1 }} / {{ currentReport.sections.length }}</span></div>
        <div class="report-content" v-html="currentReport.sections[currentPage]?.html" />
        <div class="report-pagination">
          <el-button :disabled="currentPage === 0" @click="reportPrevPage"><el-icon><ArrowLeft /></el-icon>上一页</el-button>
          <span class="page-info">{{ currentPage + 1 }} / {{ currentReport.sections.length }}</span>
          <el-button :disabled="currentPage >= currentReport.sections.length - 1" @click="reportNextPage">下一页<el-icon><ArrowRight /></el-icon></el-button>
        </div>
      </div>
      <template #footer><div class="report-footer"><el-button disabled>编辑</el-button><el-button @click="saveReport">保存</el-button><el-button type="warning" @click="regenerate">重新生成</el-button><el-button type="primary" @click="saveAndSubmit">保存并提交</el-button></div></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.report-page { display: flex; flex-direction: column; gap: 16px; }
.page-header-card { display: flex; justify-content: space-between; align-items: flex-start; background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-header-card h2 { margin: 0 0 6px; font-size: 18px; color: #1d2129; }
.page-header-card p { margin: 0; font-size: 13px; color: #86909c; }
.header-right { display: flex; gap: 8px; flex-shrink: 0; }
.search-card { background: #fff; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.search-row { display: flex; gap: 12px; align-items: center; }
.search-input { flex: 1; max-width: 360px; }
.table-card { background: #fff; border-radius: 8px; padding: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
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
.report-content :deep(.report-table td.num) { text-align: right; font-variant-numeric: tabular-nums; }
.report-content :deep(h5) { margin: 16px 0 8px; font-size: 14px; color: #165dff; }
.report-content :deep(p) { margin: 8px 0; color: #4e5969; font-size: 13px; line-height: 1.8; }
.report-pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f2f3f5; }
.page-info { font-size: 13px; color: #86909c; }
.report-footer { display: flex; justify-content: flex-end; gap: 8px; }
.year-select-body { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 20px 0; }
.year-hint { color: #86909c; font-size: 14px; margin: 0; }
.year-select { width: 200px; }
.generating-body { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 30px 0; }
.ai-animation { position: relative; width: 80px; height: 80px; }
.ai-pulse { width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(#165dff, #4080ff, #165dff); animation: ai-spin 1.5s linear infinite; }
.ai-ring { position: absolute; top: -8px; left: -8px; width: 96px; height: 96px; border-radius: 50%; border: 2px solid #165dff33; animation: ai-ring 1.5s ease-out infinite; }
@keyframes ai-spin { to { transform: rotate(360deg); } }
@keyframes ai-ring { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
.generating-text { font-size: 15px; color: #1d2129; font-weight: 500; margin: 0; }
.generating-sub { font-size: 12px; color: #c9cdd4; margin: 0; }
</style>