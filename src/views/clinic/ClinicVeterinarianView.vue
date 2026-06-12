<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import type { PracticeType, Veterinarian } from '../../domain/models'

const store = useAppStore()
const keyword = ref('')
const dialogVisible = ref(false)
const detailVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const current = ref<Veterinarian>()
const approvedInstitutions = computed(() => store.data.clinicInstitutions.filter((item) => item.status === 'approved' && item.active))
const filtered = computed(() => store.data.veterinarians.filter((item) => !keyword.value || item.name.includes(keyword.value) || item.certificateNo.includes(keyword.value)))
const form = reactive({ name: '', certificateNo: '', practiceType: 'licensed_veterinarian' as PracticeType, institutionId: '', practiceScope: '', phone: '', material: '' })

function resetForm() {
  Object.assign(form, { name: '陈晓宁', certificateNo: `VET-AH-${Date.now().toString().slice(-6)}`, practiceType: 'licensed_veterinarian', institutionId: approvedInstitutions.value[0]?.id || '', practiceScope: '犬猫诊疗、免疫接种、处方开具', phone: '13900001111', material: '执业兽医资格证、劳动合同、身份证明' })
}
function openCreate() { mode.value = 'create'; current.value = undefined; resetForm(); dialogVisible.value = true }
function openEdit(row: Veterinarian) { mode.value = 'edit'; current.value = row; Object.assign(form, row); dialogVisible.value = true }
function openDetail(row: Veterinarian) { current.value = row; detailVisible.value = true }

async function save() {
  if (!form.name || !form.certificateNo || !form.institutionId || !form.phone) return ElMessage.warning('请填写姓名、证书编号、所属机构和联系电话')
  if (mode.value === 'create') await store.submitVeterinarian({ ...form })
  else if (current.value) await store.updateVeterinarian(current.value.id, { ...form })
  dialogVisible.value = false
  ElMessage.success(mode.value === 'create' ? '执业兽医备案已提交' : '执业兽医备案已保存')
}
async function review(id: string, approved: boolean) {
  await store.reviewVeterinarian(id, approved, approved ? '人员资质有效' : '人员材料需补正')
  ElMessage.success(approved ? '兽医备案审核通过' : '兽医备案已驳回')
}
async function disable(row: Veterinarian) {
  await ElMessageBox.confirm(`确认停用 ${row.name}？停用后不能开具处方。`, '停用确认')
  await store.disableVeterinarian(row.id)
  ElMessage.success('执业兽医已停用')
}
</script>

<template>
  <div class="page-grid">
    <el-card class="panel-card">
      <div class="card-header-line">
        <div><h2>执业兽医备案</h2><p>维护执业兽医师、执业助理兽医师备案资料，备案通过且未停用后方可开具处方。</p></div>
        <div class="action-inline"><el-button @click="store.refresh()">刷新</el-button><el-button type="success" @click="openCreate">新增执业兽医</el-button></div>
      </div>
      <div class="action-inline"><el-input v-model="keyword" placeholder="按姓名或证书编号筛选" clearable /><el-button>导出</el-button></div>
    </el-card>

    <el-card class="panel-card">
      <template #header><b>兽医人员列表</b></template>
      <el-table :data="filtered" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="certificateNo" label="证书编号" min-width="160" />
        <el-table-column label="执业类型" width="150"><template #default="{ row }">{{ row.practiceType === 'licensed_veterinarian' ? '执业兽医师' : '执业助理兽医师' }}</template></el-table-column>
        <el-table-column label="所属机构" min-width="180"><template #default="{ row }">{{ store.data.clinicInstitutions.find((item) => item.id === row.institutionId)?.name }}</template></el-table-column>
        <el-table-column label="状态" width="150"><template #default="{ row }"><el-tag :type="!row.active ? 'info' : row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'">{{ !row.active ? '已停用' : row.status === 'approved' ? '已通过' : row.status === 'rejected' ? '已驳回' : '待审核' }}</el-tag></template></el-table-column>
        <el-table-column prop="reviewedAt" label="更新时间" min-width="170" />
        <el-table-column label="操作" width="300" fixed="right"><template #default="{ row }"><el-button size="small" @click="openDetail(row)">查看</el-button><el-button size="small" @click="openEdit(row)">编辑</el-button><el-button v-if="row.status === 'pending'" size="small" type="success" @click="review(row.id, true)">通过</el-button><el-button v-if="row.status === 'pending'" size="small" type="danger" @click="review(row.id, false)">驳回</el-button><el-button size="small" type="warning" @click="disable(row)">停用</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="mode === 'create' ? '新增执业兽医' : '编辑执业兽医'" width="620px">
      <el-form label-position="top">
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item><el-form-item label="证书编号"><el-input v-model="form.certificateNo" /></el-form-item>
        <el-form-item label="执业类型"><el-select v-model="form.practiceType" class="full-width"><el-option label="执业兽医师" value="licensed_veterinarian" /><el-option label="执业助理兽医师" value="assistant_veterinarian" /></el-select></el-form-item>
        <el-form-item label="所属诊疗机构"><el-select v-model="form.institutionId" class="full-width"><el-option v-for="item in approvedInstitutions" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="执业范围"><el-input v-model="form.practiceScope" /></el-form-item><el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item><el-form-item label="备案材料"><el-input v-model="form.material" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="success" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="detailVisible" title="执业兽医详情" width="560px"><div v-if="current" class="info-list"><p><span>姓名</span><b>{{ current.name }}</b></p><p><span>证书编号</span><b>{{ current.certificateNo }}</b></p><p><span>执业范围</span><b>{{ current.practiceScope }}</b></p><p><span>联系电话</span><b>{{ current.phone }}</b></p><p><span>备案材料</span><b>{{ current.material }}</b></p></div></el-dialog>
  </div>
</template>
