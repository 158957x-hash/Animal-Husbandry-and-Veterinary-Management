<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { ClinicInstitution } from '../../domain/models'

const store = useAppStore()
const isRegulator = computed(() => store.currentRole === 'regulator')

const keyword = ref('')
const dialogVisible = ref(false)
const detailVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const current = ref<ClinicInstitution>()
const form = reactive({ name: '', licenseNo: '', address: '', contactPerson: '', phone: '', type: '', mapPoint: '' })
const filtered = computed(() => store.data.clinicInstitutions.filter((item) => !keyword.value || item.name.includes(keyword.value) || item.licenseNo.includes(keyword.value)))

function resetForm() {
  Object.assign(form, { name: '安心动物诊疗中心', licenseNo: `皖动诊许第${Date.now().toString().slice(-6)}号`, address: '安徽省合肥市包河区徽州大道 188 号', contactPerson: '周院长', phone: '0551-66889900', type: '动物诊所', mapPoint: '117.29,31.82' })
}

function openCreate() { mode.value = 'create'; current.value = undefined; resetForm(); dialogVisible.value = true }
function openEdit(row: ClinicInstitution) { mode.value = 'edit'; current.value = row; Object.assign(form, row); dialogVisible.value = true }
function openDetail(row: ClinicInstitution) { current.value = row; detailVisible.value = true }

async function save() {
  if (!form.name || !form.licenseNo || !form.address || !form.phone) return ElMessage.warning('请填写机构名称、许可证号、地址和联系方式')
  if (mode.value === 'create') await store.submitClinicInstitution({ ...form })
  else if (current.value) await store.updateClinicInstitution(current.value.id, { ...form })
  dialogVisible.value = false
  ElMessage.success(mode.value === 'create' ? '诊疗机构备案已提交' : '诊疗机构信息已保存')
}

async function review(id: string, approved: boolean) {
  await store.reviewClinicInstitution(id, approved, approved ? '材料齐全，准予备案' : '材料不完整，退回补正')
  ElMessage.success(approved ? '备案审核通过' : '备案已驳回')
}

async function disable(row: ClinicInstitution) {
  await ElMessageBox.confirm(`确认停用 ${row.name}？`, '停用确认')
  await store.disableClinicInstitution(row.id)
  ElMessage.success('诊疗机构已停用')
}

function getStatusTag(row: ClinicInstitution) {
  if (!row.active) return { type: 'info' as const, label: '已停用' }
  if (row.status === 'approved') return { type: 'success' as const, label: '已通过' }
  if (row.status === 'rejected') return { type: 'danger' as const, label: '已驳回' }
  return { type: 'warning' as const, label: '待审核' }
}
</script>

<template>
  <div class="clinic-inst-page">
    <div class="page-header-card">
      <div class="header-left">
        <h2>诊疗机构备案管理</h2>
        <p>维护诊疗机构备案资料，监管人员可审核备案状态，备案通过后在地图展示。</p>
      </div>
      <div class="header-right">
        <el-button @click="store.refresh()">刷新</el-button>
        <el-button v-if="!isRegulator" type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>
          新增诊疗机构
        </el-button>
      </div>
    </div>

    <div class="search-card">
      <div class="search-row">
        <el-input
          v-model="keyword"
          placeholder="搜索机构名称或许可证号"
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <div class="content-grid">
      <div class="table-card">
        <el-table :data="filtered" stripe style="width: 100%" empty-text="暂无诊疗机构备案数据">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="name" label="机构名称" min-width="180" />
          <el-table-column prop="licenseNo" label="许可证号" min-width="160" />
          <el-table-column prop="type" label="机构类型" width="120" />
          <el-table-column prop="phone" label="联系方式" width="140" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row).type" size="small">{{ getStatusTag(row).label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reviewedAt" label="更新时间" width="170">
            <template #default="{ row }">{{ row.reviewedAt ? new Date(row.reviewedAt).toLocaleDateString('zh-CN') : '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" :width="isRegulator ? 220 : 280" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openDetail(row)">查看</el-button>
              <template v-if="!isRegulator">
                <el-button size="small" link type="warning" @click="openEdit(row)">编辑</el-button>
                <el-button size="small" link type="danger" @click="disable(row)">停用</el-button>
              </template>
              <template v-if="isRegulator && row.status === 'pending'">
                <el-button size="small" type="success" @click="review(row.id, true)">通过</el-button>
                <el-button size="small" type="danger" @click="review(row.id, false)">驳回</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="map-card">
        <div class="map-header">诊疗机构分布地图</div>
        <div class="mock-map">
          <div class="map-node start">监管中心</div>
          <div
            v-for="item in store.data.clinicInstitutions.filter((clinic) => clinic.status === 'approved' && clinic.active)"
            :key="item.id"
            class="map-node end"
          >{{ item.name }}</div>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="mode === 'create' ? '新增诊疗机构' : '编辑诊疗机构'" width="620px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="机构名称" required><el-input v-model="form.name" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="许可证号" required><el-input v-model="form.licenseNo" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系人"><el-input v-model="form.contactPerson" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式"><el-input v-model="form.phone" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="机构类型"><el-input v-model="form.type" placeholder="如：动物医院、动物诊所" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地图点位"><el-input v-model="form.mapPoint" placeholder="经度,纬度" /></el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="诊疗机构详情" width="560px">
      <div v-if="current" class="detail-content">
        <div class="detail-item"><span>机构名称</span><b>{{ current.name }}</b></div>
        <div class="detail-item"><span>许可证号</span><b>{{ current.licenseNo }}</b></div>
        <div class="detail-item"><span>机构类型</span><b>{{ current.type }}</b></div>
        <div class="detail-item"><span>地址</span><b>{{ current.address }}</b></div>
        <div class="detail-item"><span>联系人</span><b>{{ current.contactPerson }} {{ current.phone }}</b></div>
        <div class="detail-item"><span>地图点位</span><b>{{ current.mapPoint }}</b></div>
        <div class="detail-item"><span>备案状态</span><b><el-tag :type="getStatusTag(current).type" size="small">{{ getStatusTag(current).label }}</el-tag></b></div>
        <div class="detail-item" v-if="current.reviewRemark"><span>审核备注</span><b>{{ current.reviewRemark }}</b></div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.clinic-inst-page {
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

.content-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.map-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.map-header {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 12px;
}

.mock-map {
  height: 360px;
  background: #f7f8fa;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.map-node {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.map-node.start {
  background: #165dff;
}

.map-node.end {
  background: #00b42a;
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

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>