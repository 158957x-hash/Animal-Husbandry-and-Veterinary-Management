<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Upload, User } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { PracticeType, Veterinarian, VeterinarianApplicationType } from '../../domain/models'

const store = useAppStore()

const keyword = ref('')
const statusFilter = ref('')
const dialogVisible = ref(false)
const detailVisible = ref(false)
const appType = ref<VeterinarianApplicationType>('new')
const currentVet = ref<Veterinarian>()
const changeReason = ref('')
const cancelReason = ref('')

const currentInstitution = computed(() => {
  const approved = store.data.clinicInstitutions.filter((item) => item.status === 'approved' && item.active)
  return approved[0] || null
})

const filteredVets = computed(() => {
  let list = store.data.veterinarians
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter((item) => item.name.includes(kw) || item.certificateNo.includes(kw) || item.phone.includes(kw))
  }
  if (statusFilter.value) {
    if (statusFilter.value === 'active') list = list.filter((item) => item.active)
    else if (statusFilter.value === 'inactive') list = list.filter((item) => !item.active)
    else if (statusFilter.value === 'approved') list = list.filter((item) => item.status === 'approved')
    else if (statusFilter.value === 'pending') list = list.filter((item) => item.status === 'pending')
    else if (statusFilter.value === 'rejected') list = list.filter((item) => item.status === 'rejected')
  }
  return list
})

const form = reactive({
  avatarUrl: '',
  name: '',
  gender: '',
  birthDate: '',
  idCardNo: '',
  educationMajor: '',
  graduationSchool: '',
  title: '',
  workStartDate: '',
  phone: '',
  practiceType: 'licensed_veterinarian' as PracticeType,
  practiceScope: '',
  certificateNo: '',
  certificateIssuingAuthority: '',
  certificateIssueDate: '',
  certificateUrl: '',
  idCardUrl: '',
  laborProofUrl: '',
})

function resetForm() {
  const inst = currentInstitution.value
  Object.assign(form, {
    avatarUrl: '',
    name: '',
    gender: '男',
    birthDate: '',
    idCardNo: '',
    educationMajor: '',
    graduationSchool: '',
    title: '',
    workStartDate: '',
    phone: '',
    practiceType: 'licensed_veterinarian',
    practiceScope: '',
    certificateNo: `AH-ZY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    certificateIssuingAuthority: '安徽省农业农村厅',
    certificateIssueDate: '',
    certificateUrl: '',
    idCardUrl: '',
    laborProofUrl: '',
  })
  changeReason.value = ''
  cancelReason.value = ''
}

function openNew() {
  appType.value = 'new'
  currentVet.value = undefined
  resetForm()
  dialogVisible.value = true
}

function openChange(row: Veterinarian) {
  appType.value = 'change'
  currentVet.value = row
  changeReason.value = ''
  form.avatarUrl = ''
  form.name = row.name
  form.gender = ''
  form.birthDate = ''
  form.idCardNo = ''
  form.educationMajor = ''
  form.graduationSchool = ''
  form.title = ''
  form.workStartDate = ''
  form.phone = row.phone
  form.practiceType = row.practiceType
  form.practiceScope = row.practiceScope
  form.certificateNo = row.certificateNo
  form.certificateIssuingAuthority = ''
  form.certificateIssueDate = ''
  form.certificateUrl = ''
  form.idCardUrl = ''
  form.laborProofUrl = ''
  dialogVisible.value = true
}

function openCancel(row: Veterinarian) {
  appType.value = 'cancel'
  currentVet.value = row
  cancelReason.value = ''
  dialogVisible.value = true
}

function openDetail(row: Veterinarian) {
  currentVet.value = row
  detailVisible.value = true
}

function handleAvatarUpload(file: any) {
  const reader = new FileReader()
  reader.onload = (e) => { form.avatarUrl = e.target?.result as string }
  reader.readAsDataURL(file.raw)
  return false
}

function handleMaterialUpload(type: 'certificate' | 'id_card' | 'labor_proof') {
  return (file: any) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      if (type === 'certificate') form.certificateUrl = url
      else if (type === 'id_card') form.idCardUrl = url
      else form.laborProofUrl = url
    }
    reader.readAsDataURL(file.raw)
    return false
  }
}

async function submitRegistration() {
  if (!form.name) return ElMessage.warning('请填写姓名')
  if (!form.idCardNo) return ElMessage.warning('请填写身份证号')
  const inst = currentInstitution.value
  if (!inst) return ElMessage.warning('未找到已备案的诊疗机构')

  if (appType.value === 'cancel') {
    if (!cancelReason.value) return ElMessage.warning('请填写注销原因')
    await store.submitVeterinarianRegistration({
      type: 'cancel',
      institutionId: inst.id,
      institutionName: inst.name,
      veterinarianId: currentVet.value?.id,
      name: currentVet.value?.name || '',
      gender: '',
      birthDate: '',
      idCardNo: '',
      educationMajor: '',
      graduationSchool: '',
      title: '',
      workStartDate: '',
      phone: currentVet.value?.phone || '',
      practiceType: currentVet.value?.practiceType || 'licensed_veterinarian',
      practiceScope: currentVet.value?.practiceScope || '',
      certificateNo: currentVet.value?.certificateNo || '',
      certificateIssuingAuthority: '',
      certificateIssueDate: '',
      avatarUrl: '',
      materials: [{ type: 'labor_proof', name: '注销申请', url: '' }],
      cancelReason: cancelReason.value,
    })
    ElMessage.success('注销申请已提交，等待监管端审核')
  } else {
    const materials = []
    if (form.certificateUrl) materials.push({ type: 'certificate' as const, name: '执业兽医资格证书', url: form.certificateUrl })
    if (form.idCardUrl) materials.push({ type: 'id_card' as const, name: '身份证', url: form.idCardUrl })
    if (form.laborProofUrl) materials.push({ type: 'labor_proof' as const, name: '劳动证明', url: form.laborProofUrl })

    await store.submitVeterinarianRegistration({
      type: appType.value,
      institutionId: inst.id,
      institutionName: inst.name,
      veterinarianId: currentVet.value?.id,
      name: form.name,
      gender: form.gender,
      birthDate: form.birthDate,
      idCardNo: form.idCardNo,
      educationMajor: form.educationMajor,
      graduationSchool: form.graduationSchool,
      title: form.title,
      workStartDate: form.workStartDate,
      phone: form.phone,
      practiceType: form.practiceType,
      practiceScope: form.practiceScope,
      certificateNo: form.certificateNo,
      certificateIssuingAuthority: form.certificateIssuingAuthority,
      certificateIssueDate: form.certificateIssueDate,
      avatarUrl: form.avatarUrl,
      materials,
      changeReason: appType.value === 'change' ? changeReason.value : undefined,
    })
    const typeLabel = appType.value === 'new' ? '新增' : '变更'
    ElMessage.success(`${typeLabel}备案申请已提交，等待监管端审核`)
  }
  dialogVisible.value = false
}

function getTypeLabel(type: string) {
  return type === 'licensed_veterinarian' ? '执业兽医师' : '执业助理兽医师'
}

function getStatusTag(row: Veterinarian) {
  if (!row.active) return { type: 'info' as const, label: '已停用' }
  if (row.status === 'approved') return { type: 'success' as const, label: '已通过' }
  if (row.status === 'rejected') return { type: 'danger' as const, label: '已驳回' }
  return { type: 'warning' as const, label: '待审核' }
}

function doSearch() {
  // triggers computed reactivity
}
</script>

<template>
  <div class="clinic-vet-page">
    <!-- Header Card -->
    <div class="page-header-card">
      <div class="header-left">
        <h2>执业兽医备案管理</h2>
        <p>维护执业兽医师、执业助理兽医师备案资料，支持新增、变更、注销操作，备案需经监管端审核通过后生效。</p>
      </div>
      <div class="header-right">
        <el-button @click="store.refresh()">刷新</el-button>
        <el-button type="primary" @click="openNew">
          <el-icon><Plus /></el-icon>
          新增执业兽医
        </el-button>
      </div>
    </div>

    <!-- Search Card -->
    <div class="search-card">
      <div class="search-row">
        <el-input
          v-model="keyword"
          placeholder="搜索姓名、证书编号、联系电话"
          clearable
          class="search-input"
          @keyup.enter="doSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="备案状态" clearable class="search-select" @change="doSearch">
          <el-option label="全部" value="" />
          <el-option label="已通过" value="approved" />
          <el-option label="待审核" value="pending" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="启用中" value="active" />
          <el-option label="已停用" value="inactive" />
        </el-select>
        <el-button type="primary" @click="doSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <el-table :data="filteredVets" stripe style="width: 100%" empty-text="暂无执业兽医备案数据">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="头像" width="70">
          <template #default="{ row }">
            <el-avatar :size="40" :icon="User" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="certificateNo" label="证书编号" min-width="160" />
        <el-table-column label="执业类型" width="120">
          <template #default="{ row }">{{ getTypeLabel(row.practiceType) }}</template>
        </el-table-column>
        <el-table-column label="所属机构" min-width="180">
          <template #default="{ row }">
            {{ store.data.clinicInstitutions.find((item) => item.id === row.institutionId)?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row).type" size="small">{{ getStatusTag(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewedAt" label="更新时间" width="170">
          <template #default="{ row }">{{ row.reviewedAt ? new Date(row.reviewedAt).toLocaleDateString('zh-CN') : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button v-if="row.active" size="small" link type="warning" @click="openChange(row)">变更</el-button>
            <el-button v-if="row.active" size="small" link type="danger" @click="openCancel(row)">注销</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="gov-pagination-bar">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="filteredVets.length" :page-size="10" />
      </div>
    </div>

    <!-- Registration Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="appType === 'new' ? '新增执业兽医备案' : appType === 'change' ? '变更执业兽医备案' : '注销执业兽医备案'"
      width="720px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template v-if="appType === 'cancel'">
        <div class="cancel-section">
          <el-alert type="warning" :closable="false" show-icon>
            <template #title>
              确认注销 <b>{{ currentVet?.name }}</b>（{{ currentVet?.certificateNo }}）的执业兽医备案？
            </template>
          </el-alert>
          <el-form label-position="top" class="cancel-form">
            <el-form-item label="注销原因" required>
              <el-input
                v-model="cancelReason"
                type="textarea"
                :rows="3"
                placeholder="请详细说明注销原因"
              />
            </el-form-item>
          </el-form>
        </div>
      </template>
      <template v-else>
        <el-form label-position="top" class="registration-form">
          <!-- Avatar -->
          <el-form-item label="头像">
            <div class="avatar-upload">
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                :before-upload="handleAvatarUpload"
                accept="image/*"
              >
                <el-avatar v-if="form.avatarUrl" :size="80" :src="form.avatarUrl" />
                <el-avatar v-else :size="80" :icon="User" />
                <span class="avatar-tip">点击上传头像</span>
              </el-upload>
            </div>
          </el-form-item>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="姓名" required>
                <el-input v-model="form.name" placeholder="请输入姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别">
                <el-select v-model="form.gender" class="full-width">
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="工作单位">
                <el-input :model-value="currentInstitution?.name || ''" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证号" required>
                <el-input v-model="form.idCardNo" placeholder="请输入身份证号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="出生日期">
                <el-date-picker
                  v-model="form.birthDate"
                  type="date"
                  placeholder="选择出生日期"
                  class="full-width"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系电话">
                <el-input v-model="form.phone" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="学历专业">
                <el-input v-model="form.educationMajor" placeholder="如：动物医学" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="毕业院校">
                <el-input v-model="form.graduationSchool" placeholder="请输入毕业院校" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="职称">
                <el-input v-model="form.title" placeholder="如：中级兽医师" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="参加工作时间">
                <el-date-picker
                  v-model="form.workStartDate"
                  type="date"
                  placeholder="选择参加工作时间"
                  class="full-width"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="执业类型">
                <el-select v-model="form.practiceType" class="full-width">
                  <el-option label="执业兽医师" value="licensed_veterinarian" />
                  <el-option label="执业助理兽医师" value="assistant_veterinarian" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="证书编号">
                <el-input v-model="form.certificateNo" placeholder="资格证书编号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="发证机关">
                <el-input v-model="form.certificateIssuingAuthority" placeholder="资格证书发证机关" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="发证日期">
                <el-date-picker
                  v-model="form.certificateIssueDate"
                  type="date"
                  placeholder="选择发证日期"
                  class="full-width"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="执业范围">
            <el-input v-model="form.practiceScope" placeholder="如：小动物内科、外科、免疫接种" />
          </el-form-item>

          <template v-if="appType === 'change'">
            <el-form-item label="变更原因" required>
              <el-input
                v-model="changeReason"
                type="textarea"
                :rows="2"
                placeholder="请说明变更原因"
              />
            </el-form-item>
          </template>

          <!-- Materials Upload -->
          <el-divider content-position="left">备案材料上传</el-divider>
          <el-row :gutter="16">
            <el-col :span="8">
              <div class="upload-item">
                <div class="upload-label">执业兽医资格证书</div>
                <el-upload
                  :auto-upload="false"
                  :show-file-list="false"
                  :before-upload="handleMaterialUpload('certificate')"
                  accept="image/*"
                  drag
                >
                  <div v-if="form.certificateUrl" class="upload-preview">
                    <img :src="form.certificateUrl" alt="证书" />
                  </div>
                  <div v-else class="upload-placeholder">
                    <el-icon :size="32"><Upload /></el-icon>
                    <span>点击或拖拽上传</span>
                  </div>
                </el-upload>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="upload-item">
                <div class="upload-label">身份证</div>
                <el-upload
                  :auto-upload="false"
                  :show-file-list="false"
                  :before-upload="handleMaterialUpload('id_card')"
                  accept="image/*"
                  drag
                >
                  <div v-if="form.idCardUrl" class="upload-preview">
                    <img :src="form.idCardUrl" alt="身份证" />
                  </div>
                  <div v-else class="upload-placeholder">
                    <el-icon :size="32"><Upload /></el-icon>
                    <span>点击或拖拽上传</span>
                  </div>
                </el-upload>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="upload-item">
                <div class="upload-label">劳动/聘用证明</div>
                <el-upload
                  :auto-upload="false"
                  :show-file-list="false"
                  :before-upload="handleMaterialUpload('labor_proof')"
                  accept="image/*"
                  drag
                >
                  <div v-if="form.laborProofUrl" class="upload-preview">
                    <img :src="form.laborProofUrl" alt="劳动证明" />
                  </div>
                  <div v-else class="upload-placeholder">
                    <el-icon :size="32"><Upload /></el-icon>
                    <span>点击或拖拽上传</span>
                  </div>
                </el-upload>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRegistration">
          {{ appType === 'new' ? '新增并提交备案' : appType === 'change' ? '提交变更备案' : '提交注销备案' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="执业兽医详情" width="560px">
      <div v-if="currentVet" class="detail-content">
        <div class="detail-item"><span>姓名</span><b>{{ currentVet.name }}</b></div>
        <div class="detail-item"><span>证书编号</span><b>{{ currentVet.certificateNo }}</b></div>
        <div class="detail-item"><span>执业类型</span><b>{{ getTypeLabel(currentVet.practiceType) }}</b></div>
        <div class="detail-item"><span>执业范围</span><b>{{ currentVet.practiceScope }}</b></div>
        <div class="detail-item"><span>联系电话</span><b>{{ currentVet.phone }}</b></div>
        <div class="detail-item"><span>备案材料</span><b>{{ currentVet.material }}</b></div>
        <div class="detail-item"><span>备案状态</span><b><el-tag :type="getStatusTag(currentVet).type" size="small">{{ getStatusTag(currentVet).label }}</el-tag></b></div>
        <div class="detail-item"><span>创建时间</span><b>{{ new Date(currentVet.createdAt).toLocaleString('zh-CN') }}</b></div>
        <div class="detail-item" v-if="currentVet.reviewedAt"><span>审核时间</span><b>{{ new Date(currentVet.reviewedAt).toLocaleString('zh-CN') }}</b></div>
        <div class="detail-item" v-if="currentVet.reviewRemark"><span>审核备注</span><b>{{ currentVet.reviewRemark }}</b></div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.clinic-vet-page {
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
  max-width: 360px;
}

.search-select {
  width: 140px;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.registration-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.full-width {
  width: 100%;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.avatar-upload :deep(.el-upload) {
  cursor: pointer;
}

.avatar-tip {
  font-size: 12px;
  color: #86909c;
}

.upload-item {
  text-align: center;
}

.upload-label {
  font-size: 13px;
  color: #4e5969;
  margin-bottom: 8px;
  font-weight: 500;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #86909c;
}

.upload-preview img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.cancel-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cancel-form {
  margin-top: 8px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f2f3f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item span {
  font-size: 13px;
  color: #86909c;
  min-width: 80px;
  flex-shrink: 0;
}

.detail-item b {
  font-size: 14px;
  color: #1d2129;
  font-weight: 500;
}
</style>