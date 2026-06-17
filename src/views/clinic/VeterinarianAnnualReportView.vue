<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { VeterinarianAnnualReport } from '../../domain/models'

const store = useAppStore()

const keyword = ref('')
const yearDialogVisible = ref(false)
const selectedYear = ref(new Date().getFullYear())
const generating = ref(false)
const progressPercent = ref(0)
const progressText = ref('')
const reportDialogVisible = ref(false)
const currentReport = ref<VeterinarianAnnualReport | null>(null)
const currentPage = ref(0)
const detailVisible = ref(false)

const currentVet = computed(() => {
  return store.data.veterinarians.find((v) => v.status === 'approved' && v.active)
})

const filteredReports = computed(() => {
  let list = store.data.veterinarianAnnualReports
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter((item) =>
      String(item.year).includes(kw) ||
      item.veterinarianName.toLowerCase().includes(kw)
    )
  }
  return list
})

function getStatusTag(row: VeterinarianAnnualReport) {
  const map: Record<string, { type: string; label: string }> = {
    generated: { type: 'warning', label: '已生成' },
    submitted_to_clinic: { type: 'primary', label: '已提交机构' },
    clinic_approved: { type: 'success', label: '机构已通过' },
    clinic_rejected: { type: 'danger', label: '机构已退回' },
    submitted_to_regulator: { type: 'primary', label: '已提交监管' },
    archived: { type: 'success', label: '已归档' },
    withdrawn: { type: 'warning', label: '已退回' },
  }
  return map[row.status] || { type: 'info', label: row.status }
}

// ---- AI Generate Flow ----
function openYearDialog() {
  selectedYear.value = new Date().getFullYear()
  yearDialogVisible.value = true
}

async function startGenerate() {
  const vet = currentVet.value
  if (!vet) return ElMessage.warning('未找到有效的执业兽医备案')

  yearDialogVisible.value = false
  generating.value = true
  progressPercent.value = 0
  progressText.value = '正在连接AI引擎...'

  const steps = [
    { p: 5, t: '正在连接AI引擎...' },
    { p: 15, t: '正在采集执业兽医基本信息...' },
    { p: 30, t: '正在统计年度接诊与处方数据...' },
    { p: 50, t: '正在汇总免疫台账记录...' },
    { p: 70, t: '正在分析疾病诊疗类型分布...' },
    { p: 85, t: '正在汇总药品使用与废弃物处理...' },
    { p: 95, t: '正在生成年度总结与自查报告...' },
    { p: 100, t: 'AI智能生成完成！' },
  ]

  for (const step of steps) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400))
    progressPercent.value = step.p
    progressText.value = step.t
  }

  const report = await store.generateVetAnnualReport(vet.id, selectedYear.value)
  generating.value = false
  ElMessage.success('AI智能生成年度报告完成！')

  currentReport.value = report
  currentPage.value = 0
  reportDialogVisible.value = true
}

// ---- Report Dialog ----
function reportNextPage() {
  if (!currentReport.value) return
  if (currentPage.value < currentReport.value.sections.length - 1) {
    currentPage.value++
  }
}

function reportPrevPage() {
  if (currentPage.value > 0) currentPage.value--
}

function regenerate() {
  reportDialogVisible.value = false
  openYearDialog()
}

async function submitToClinic() {
  if (!currentReport.value) return
  await store.submitVetAnnualReportToClinic(currentReport.value.id)
  ElMessage.success('年度报告已提交至诊疗机构审核')
  reportDialogVisible.value = false
}

function openDetail(row: VeterinarianAnnualReport) {
  currentReport.value = row
  currentPage.value = 0
  detailVisible.value = true
}
</script>

<template>
  <div class="report-page">
    <div class="page-header-card">
      <div class="header-left">
        <h2>执业兽医年度报告</h2>
        <p>执业兽医个人年度工作报告，由AI智能汇聚诊疗业务数据生成，提交至诊疗机构审核后转报监管端。</p>
      </div>
      <div class="header-right">
        <el-button @click="store.refresh()">刷新</el-button>
        <el-button type="primary" @click="openYearDialog">
          AI智能生成年度报告
        </el-button>
      </div>
    </div>

    <div class="search-card">
      <div class="search-row">
        <el-input v-model="keyword" placeholder="搜索年度" clearable class="search-input">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary"><el-icon><Search /></el-icon>搜索</el-button>
      </div>
    </div>

    <div class="table-card">
      <el-table :data="filteredReports" stripe style="width: 100%" empty-text="暂无年度报告数据">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="veterinarianName" label="姓名" width="100" />
        <el-table-column prop="year" label="年度" width="80" />
        <el-table-column prop="institutionName" label="所属机构" min-width="160" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row).type" size="small">{{ getStatusTag(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="生成时间" width="170">
          <template #default="{ row }">{{ new Date(row.generatedAt).toLocaleDateString('zh-CN') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="openDetail(row)">查看详情</el-button>
            <el-button v-if="row.status === 'generated'" size="small" link type="success" @click="submitToClinic">提交</el-button>
            <el-button v-if="row.status === 'clinic_rejected'" size="small" link type="warning" @click="openYearDialog">重新生成</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Year Selection Dialog -->
    <el-dialog v-model="yearDialogVisible" title="选择报告年度" width="400px" :close-on-click-modal="false">
      <div class="year-select-body">
        <p class="year-hint">请选择需要生成年度报告的年份</p>
        <el-select v-model="selectedYear" size="large" class="year-select">
          <el-option v-for="y in 10" :key="y" :label="`${2021 + y - 1}年度`" :value="2021 + y - 1" />
        </el-select>
      </div>
      <template #footer><el-button @click="yearDialogVisible = false">取消</el-button><el-button type="primary" @click="startGenerate">确认生成</el-button></template>
    </el-dialog>

    <!-- Generating Dialog -->
    <el-dialog v-model="generating" title="AI智能生成年度报告" width="520px" :close-on-click-modal="false" :show-close="false">
      <div class="generating-body">
        <div class="ai-animation"><div class="ai-pulse"></div><div class="ai-ring"></div></div>
        <el-progress :percentage="progressPercent" :stroke-width="6" :show-text="false" />
        <p class="generating-text">{{ progressText }}</p>
        <p class="generating-sub">AI正在自动汇总诊疗业务数据，请稍候...</p>
      </div>
    </el-dialog>

    <!-- Result Dialog -->
    <el-dialog v-model="reportDialogVisible" :title="`${currentReport?.year || ''}年度报告`" width="820px" :close-on-click-modal="false" destroy-on-close>
      <div v-if="currentReport && currentReport.sections.length" class="report-body">
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
        <p>请等待管理员配置执业兽医年度报告模板。</p>
      </div>
      <template #footer>
        <div class="report-footer">
          <el-button disabled>编辑</el-button>
          <el-button @click="reportDialogVisible = false">保存</el-button>
          <el-button type="warning" @click="regenerate">重新生成</el-button>
          <el-button type="primary" @click="submitToClinic">保存并提交</el-button>
        </div>
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
          <span>审核备注：</span>{{ currentReport.clinicReviewRemark }}
        </div>
      </div>
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
.report-empty { text-align: center; padding: 40px; color: #86909c; }
.report-empty p { margin: 4px 0; font-size: 14px; }
.review-remark { margin-top: 16px; padding: 12px; background: #f7f8fa; border-radius: 6px; font-size: 13px; color: #4e5969; }
.review-remark span { font-weight: 600; color: #1d2129; }
.report-pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f2f3f5; }
.page-info { font-size: 13px; color: #86909c; }
.report-footer { display: flex; justify-content: flex-end; gap: 8px; }
</style>