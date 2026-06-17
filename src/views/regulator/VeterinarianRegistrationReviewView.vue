<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, User } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { VeterinarianRegistrationApplication } from '../../domain/models'

const store = useAppStore()
const activeTab = ref('pending')
const selectedIds = ref<string[]>([])

// Search
const searchNo = ref('')
const searchType = ref('')
const searchStatus = ref('')

// Review dialog
const reviewVisible = ref(false)
const reviewApp = ref<VeterinarianRegistrationApplication | null>(null)
const reviewRemark = ref('')

// Detail dialog
const detailVisible = ref(false)
const detailApp = ref<VeterinarianRegistrationApplication | null>(null)

const applications = computed(() => store.data.veterinarianRegistrationApplications)

const pendingList = computed(() => applications.value.filter((item) => item.status === 'pending'))
const approvedList = computed(() => applications.value.filter((item) => item.status === 'approved'))
const rejectedList = computed(() => applications.value.filter((item) => item.status === 'rejected'))

const currentList = computed(() => {
  let list: VeterinarianRegistrationApplication[] = []
  if (activeTab.value === 'pending') list = pendingList.value
  else if (activeTab.value === 'approved') list = approvedList.value
  else list = rejectedList.value

  if (searchNo.value) {
    const kw = searchNo.value.toLowerCase()
    list = list.filter((item) => item.applicationNo.toLowerCase().includes(kw))
  }
  if (searchType.value) {
    list = list.filter((item) => item.type === searchType.value)
  }
  if (searchStatus.value && activeTab.value === 'approved') {
    list = list.filter((item) => item.syncStatus === searchStatus.value)
  }
  return list
})

function getTypeLabel(type: string) {
  const map: Record<string, string> = { new: '新增', change: '变更', cancel: '注销' }
  return map[type] || type
}

function getTypeTagType(type: string) {
  const map: Record<string, string> = { new: 'primary', change: 'warning', cancel: 'danger' }
  return map[type] || 'info'
}

function getStatusTag(status: string) {
  const map: Record<string, { type: string; label: string }> = {
    pending: { type: 'warning', label: '待审核' },
    approved: { type: 'success', label: '已通过' },
    rejected: { type: 'danger', label: '已驳回' },
  }
  return map[status] || { type: 'info', label: status }
}

function getSyncStatusTag(syncStatus?: string) {
  if (!syncStatus || syncStatus === 'not_synced') return { type: 'info' as const, label: '未同步' }
  return { type: 'success' as const, label: '已同步' }
}

function getPracticeTypeLabel(type: string) {
  return type === 'licensed_veterinarian' ? '执业兽医师' : '执业助理兽医师'
}

function openReview(app: VeterinarianRegistrationApplication) {
  reviewApp.value = app
  reviewRemark.value = ''
  reviewVisible.value = true
}

async function approve() {
  if (!reviewApp.value) return
  await store.reviewVeterinarianRegistration(reviewApp.value.id, true, reviewRemark.value || '材料齐全，审核通过')
  ElMessage.success(`已通过 ${reviewApp.value.name} 的${getTypeLabel(reviewApp.value.type)}备案申请`)
  reviewVisible.value = false
}

async function reject() {
  if (!reviewApp.value) return
  if (!reviewRemark.value) return ElMessage.warning('请填写驳回原因')
  await store.reviewVeterinarianRegistration(reviewApp.value.id, false, reviewRemark.value)
  ElMessage.success(`已驳回 ${reviewApp.value.name} 的${getTypeLabel(reviewApp.value.type)}备案申请`)
  reviewVisible.value = false
}

function openDetail(app: VeterinarianRegistrationApplication) {
  detailApp.value = app
  detailVisible.value = true
}

function handleSelectionChange(rows: VeterinarianRegistrationApplication[]) {
  selectedIds.value = rows.map((r) => r.id)
}

async function batchSync() {
  if (selectedIds.value.length === 0) {
    return ElMessage.warning('请先选择需要同步的备案记录')
  }
  await store.batchSyncVeterinarianRegistrations(selectedIds.value)
  ElMessage.success('备案信息已同步至农业农村部全国兽医队伍信息管理系统及官方兽医人员管理系统')
  selectedIds.value = []
}

function doSearch() {
  // triggers computed reactivity
}

function onTabChange() {
  searchNo.value = ''
  searchType.value = ''
  searchStatus.value = ''
  selectedIds.value = []
}
</script>

<template>
  <div class="review-page">
    <!-- Header -->
    <div class="page-header-card">
      <div class="header-left">
        <h2>执业兽医备案审核</h2>
        <p>审核动物诊疗机构提交的执业兽医备案新增、变更、注销申请，审核通过后自动同步至兽医人员库。</p>
      </div>
      <div class="header-right">
        <el-button @click="store.refresh()">刷新</el-button>
      </div>
    </div>

    <!-- Search Card -->
    <div class="search-card">
      <div class="search-row">
        <el-input
          v-model="searchNo"
          placeholder="搜索申请编号"
          clearable
          class="search-input"
          @keyup.enter="doSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="searchType" placeholder="申请类型" clearable class="search-select" @change="doSearch">
          <el-option label="全部" value="" />
          <el-option label="新增" value="new" />
          <el-option label="变更" value="change" />
          <el-option label="注销" value="cancel" />
        </el-select>
        <el-select v-if="activeTab === 'approved'" v-model="searchStatus" placeholder="同步状态" clearable class="search-select" @change="doSearch">
          <el-option label="全部" value="" />
          <el-option label="已同步" value="synced" />
          <el-option label="未同步" value="not_synced" />
        </el-select>
        <el-button type="primary" @click="doSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tab-card">
      <el-tabs v-model="activeTab" class="review-tabs" @tab-change="onTabChange">
        <el-tab-pane name="pending">
          <template #label>
            <span class="tab-label">
              待审核
              <el-badge :value="pendingList.length" :max="99" class="tab-badge" />
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="approved">
          <template #label>
            <span class="tab-label">
              已通过
              <el-badge :value="approvedList.length" :max="99" class="tab-badge" />
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="rejected">
          <template #label>
            <span class="tab-label">
              已驳回
              <el-badge :value="rejectedList.length" :max="99" class="tab-badge" />
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- Batch Sync Button (only on approved tab) -->
      <div v-if="activeTab === 'approved'" class="batch-actions">
        <el-button type="success" @click="batchSync" :disabled="selectedIds.length === 0">
          批量同步（{{ selectedIds.length }}）
        </el-button>
      </div>

      <!-- Table -->
      <el-table
        :data="currentList"
        stripe
        style="width: 100%"
        empty-text="暂无备案审核数据"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          v-if="activeTab === 'approved'"
          type="selection"
          width="50"
        />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="申请编号" width="200">
          <template #default="{ row }">{{ row.applicationNo }}</template>
        </el-table-column>
        <el-table-column label="申请类型" width="90">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="institutionName" label="所属机构" min-width="160" />
        <el-table-column prop="certificateNo" label="证书编号" min-width="160" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">{{ getStatusTag(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'approved'" label="同步状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getSyncStatusTag(row.syncStatus).type" size="small">{{ getSyncStatusTag(row.syncStatus).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button size="small" type="primary" @click="openReview(row)">审核</el-button>
            </template>
            <template v-else>
              <el-button size="small" link type="primary" @click="openDetail(row)">查看详情</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Review Dialog -->
    <el-dialog
      v-model="reviewVisible"
      title="备案审核"
      width="720px"
      :close-on-click-modal="false"
    >
      <template v-if="reviewApp">
        <div class="review-detail">
          <div class="review-section">
            <h4>基本信息</h4>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="头像">
                <el-avatar v-if="reviewApp.avatarUrl" :size="60" :src="reviewApp.avatarUrl" />
                <el-avatar v-else :size="60" :icon="User" />
              </el-descriptions-item>
              <el-descriptions-item label="申请编号">{{ reviewApp.applicationNo }}</el-descriptions-item>
              <el-descriptions-item label="申请类型">
                <el-tag :type="getTypeTagType(reviewApp.type)" size="small">{{ getTypeLabel(reviewApp.type) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="姓名">{{ reviewApp.name }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ reviewApp.gender || '-' }}</el-descriptions-item>
              <el-descriptions-item label="工作单位">{{ reviewApp.institutionName }}</el-descriptions-item>
              <el-descriptions-item label="身份证号">{{ reviewApp.idCardNo || '-' }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ reviewApp.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="出生日期">{{ reviewApp.birthDate || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="review-section">
            <h4>资质信息</h4>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="执业类型">{{ getPracticeTypeLabel(reviewApp.practiceType) }}</el-descriptions-item>
              <el-descriptions-item label="执业范围">{{ reviewApp.practiceScope || '-' }}</el-descriptions-item>
              <el-descriptions-item label="学历专业">{{ reviewApp.educationMajor || '-' }}</el-descriptions-item>
              <el-descriptions-item label="毕业院校">{{ reviewApp.graduationSchool || '-' }}</el-descriptions-item>
              <el-descriptions-item label="职称">{{ reviewApp.title || '-' }}</el-descriptions-item>
              <el-descriptions-item label="参加工作时间">{{ reviewApp.workStartDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="证书编号">{{ reviewApp.certificateNo || '-' }}</el-descriptions-item>
              <el-descriptions-item label="发证机关">{{ reviewApp.certificateIssuingAuthority || '-' }}</el-descriptions-item>
              <el-descriptions-item label="发证日期" :span="reviewApp.certificateIssuingAuthority ? 2 : 1">{{ reviewApp.certificateIssueDate || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div v-if="reviewApp.changeReason || reviewApp.cancelReason" class="review-section">
            <h4>申请原因</h4>
            <el-alert v-if="reviewApp.changeReason" type="warning" :closable="false" show-icon>
              <template #title>变更原因：{{ reviewApp.changeReason }}</template>
            </el-alert>
            <el-alert v-if="reviewApp.cancelReason" type="danger" :closable="false" show-icon>
              <template #title>注销原因：{{ reviewApp.cancelReason }}</template>
            </el-alert>
          </div>

          <div class="review-section">
            <h4>备案材料</h4>
            <div class="material-list">
              <div v-for="(m, i) in reviewApp.materials" :key="i" class="material-item">
                <el-tag size="small" :type="m.type === 'certificate' ? 'primary' : m.type === 'id_card' ? 'success' : 'warning'">
                  {{ m.name }}
                </el-tag>
                <span v-if="m.url" class="material-uploaded">已上传</span>
                <span v-else class="material-none">未上传</span>
              </div>
              <span v-if="reviewApp.materials.length === 0" class="material-none">暂无材料</span>
            </div>
          </div>

          <div class="review-section">
            <h4>审核意见</h4>
            <el-input
              v-model="reviewRemark"
              type="textarea"
              :rows="3"
              placeholder="请输入审核意见（通过可不填，驳回必填）"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="danger" @click="reject">驳回</el-button>
        <el-button type="success" @click="approve">审核通过</el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog
      v-model="detailVisible"
      title="备案详情"
      width="720px"
    >
      <template v-if="detailApp">
        <div class="review-detail">
          <div class="review-section">
            <h4>基本信息</h4>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="头像">
                <el-avatar v-if="detailApp.avatarUrl" :size="60" :src="detailApp.avatarUrl" />
                <el-avatar v-else :size="60" :icon="User" />
              </el-descriptions-item>
              <el-descriptions-item label="申请编号">{{ detailApp.applicationNo }}</el-descriptions-item>
              <el-descriptions-item label="申请类型">
                <el-tag :type="getTypeTagType(detailApp.type)" size="small">{{ getTypeLabel(detailApp.type) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="姓名">{{ detailApp.name }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ detailApp.gender || '-' }}</el-descriptions-item>
              <el-descriptions-item label="工作单位">{{ detailApp.institutionName }}</el-descriptions-item>
              <el-descriptions-item label="身份证号">{{ detailApp.idCardNo || '-' }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ detailApp.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="出生日期">{{ detailApp.birthDate || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="review-section">
            <h4>资质信息</h4>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="执业类型">{{ getPracticeTypeLabel(detailApp.practiceType) }}</el-descriptions-item>
              <el-descriptions-item label="执业范围">{{ detailApp.practiceScope || '-' }}</el-descriptions-item>
              <el-descriptions-item label="学历专业">{{ detailApp.educationMajor || '-' }}</el-descriptions-item>
              <el-descriptions-item label="毕业院校">{{ detailApp.graduationSchool || '-' }}</el-descriptions-item>
              <el-descriptions-item label="职称">{{ detailApp.title || '-' }}</el-descriptions-item>
              <el-descriptions-item label="参加工作时间">{{ detailApp.workStartDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="证书编号">{{ detailApp.certificateNo || '-' }}</el-descriptions-item>
              <el-descriptions-item label="发证机关">{{ detailApp.certificateIssuingAuthority || '-' }}</el-descriptions-item>
              <el-descriptions-item label="发证日期">{{ detailApp.certificateIssueDate || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="review-section">
            <h4>审核信息</h4>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="审核状态">
                <el-tag :type="getStatusTag(detailApp.status).type" size="small">{{ getStatusTag(detailApp.status).label }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="审核时间">{{ detailApp.reviewedAt ? new Date(detailApp.reviewedAt).toLocaleString('zh-CN') : '-' }}</el-descriptions-item>
              <el-descriptions-item label="审核备注" :span="2">{{ detailApp.reviewRemark || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div v-if="detailApp.changeReason || detailApp.cancelReason" class="review-section">
            <h4>申请原因</h4>
            <p v-if="detailApp.changeReason" class="reason-text">变更原因：{{ detailApp.changeReason }}</p>
            <p v-if="detailApp.cancelReason" class="reason-text">注销原因：{{ detailApp.cancelReason }}</p>
          </div>

          <div class="review-section">
            <h4>备案材料</h4>
            <div class="material-list">
              <div v-for="(m, i) in detailApp.materials" :key="i" class="material-item">
                <el-tag size="small" :type="m.type === 'certificate' ? 'primary' : m.type === 'id_card' ? 'success' : 'warning'">
                  {{ m.name }}
                </el-tag>
                <span v-if="m.url" class="material-uploaded">已上传</span>
                <span v-else class="material-none">未上传</span>
              </div>
              <span v-if="detailApp.materials.length === 0" class="material-none">暂无材料</span>
            </div>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.review-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.page-header-card h2 {
  margin: 0 0 6px;
  font-size: 18px;
  color: #1d2129;
}

.page-header-card p {
  margin: 0;
  font-size: 13px;
  color: #86909c;
}

.header-right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.search-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.search-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 280px;
}

.search-select {
  width: 140px;
}

.tab-card {
  background: #fff;
  border-radius: 8px;
  padding: 4px 16px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.review-tabs {
  margin-bottom: 0;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab-badge {
  margin-left: 4px;
}

.batch-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
  border-bottom: 1px solid #f2f3f5;
  margin-bottom: 12px;
}

.review-detail {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.review-section {
  margin-bottom: 20px;
}

.review-section h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #1d2129;
  border-left: 3px solid #165dff;
  padding-left: 10px;
}

.material-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f7f8fa;
  border-radius: 6px;
}

.material-uploaded {
  font-size: 12px;
  color: #00b42a;
}

.material-none {
  font-size: 12px;
  color: #c9cdd4;
}

.reason-text {
  font-size: 13px;
  color: #4e5969;
  margin: 0;
  padding: 8px 12px;
  background: #f7f8fa;
  border-radius: 6px;
}
</style>