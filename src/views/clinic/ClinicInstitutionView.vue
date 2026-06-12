<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import type { ClinicInstitution } from '../../domain/models'

const store = useAppStore()
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
</script>

<template>
  <div class="page-grid">
    <el-card class="panel-card">
      <div class="card-header-line">
        <div><h2>诊疗机构备案与地图</h2><p>维护诊疗机构备案资料，监管人员可审核备案状态，备案通过后在地图展示。</p></div>
        <div class="action-inline"><el-button @click="store.refresh()">刷新</el-button><el-button type="success" @click="openCreate">新增诊疗机构</el-button></div>
      </div>
      <div class="action-inline"><el-input v-model="keyword" placeholder="按机构名称或许可证号筛选" clearable /><el-button>导出</el-button></div>
    </el-card>

    <div class="page-grid map-layout">
      <el-card class="panel-card">
        <template #header><b>机构列表</b></template>
        <el-table :data="filtered" stripe>
          <el-table-column type="index" label="序号" width="70" />
          <el-table-column prop="name" label="机构名称" min-width="180" />
          <el-table-column prop="licenseNo" label="许可证号" min-width="160" />
          <el-table-column prop="phone" label="联系方式" width="140" />
          <el-table-column label="状态" width="150"><template #default="{ row }"><el-tag :type="!row.active ? 'info' : row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'">{{ !row.active ? '已停用' : row.status === 'approved' ? '已通过' : row.status === 'rejected' ? '已驳回' : '待审核' }}</el-tag></template></el-table-column>
          <el-table-column prop="reviewedAt" label="更新时间" min-width="170" />
          <el-table-column label="操作" width="300" fixed="right"><template #default="{ row }"><el-button size="small" @click="openDetail(row)">查看</el-button><el-button size="small" @click="openEdit(row)">编辑</el-button><el-button v-if="row.status === 'pending'" size="small" type="success" @click="review(row.id, true)">通过</el-button><el-button v-if="row.status === 'pending'" size="small" type="danger" @click="review(row.id, false)">驳回</el-button><el-button size="small" type="warning" @click="disable(row)">停用</el-button></template></el-table-column>
        </el-table>
      </el-card>
      <el-card class="panel-card">
        <template #header><b>诊疗机构地图</b></template>
        <div class="mock-map" style="height: 360px"><div class="map-node start">监管中心</div><div v-for="item in store.data.clinicInstitutions.filter((clinic) => clinic.status === 'approved' && clinic.active)" :key="item.id" class="map-node end">{{ item.name }}</div></div>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" :title="mode === 'create' ? '新增诊疗机构' : '编辑诊疗机构'" width="620px">
      <el-form label-position="top">
        <el-form-item label="机构名称"><el-input v-model="form.name" /></el-form-item><el-form-item label="许可证号"><el-input v-model="form.licenseNo" /></el-form-item><el-form-item label="地址"><el-input v-model="form.address" /></el-form-item><el-form-item label="联系人"><el-input v-model="form.contactPerson" /></el-form-item><el-form-item label="联系方式"><el-input v-model="form.phone" /></el-form-item><el-form-item label="机构类型"><el-input v-model="form.type" /></el-form-item><el-form-item label="地图点位"><el-input v-model="form.mapPoint" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="success" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="detailVisible" title="诊疗机构详情" width="560px"><div v-if="current" class="info-list"><p><span>机构名称</span><b>{{ current.name }}</b></p><p><span>许可证号</span><b>{{ current.licenseNo }}</b></p><p><span>地址</span><b>{{ current.address }}</b></p><p><span>联系人</span><b>{{ current.contactPerson }} {{ current.phone }}</b></p><p><span>地图点位</span><b>{{ current.mapPoint }}</b></p></div></el-dialog>
  </div>
</template>
