<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import type { ImmunizationLedger } from '../../domain/models'

const store = useAppStore()
const keyword = ref('')
const dialogVisible = ref(false)
const detailVisible = ref(false)
const current = ref<ImmunizationLedger>()
const approvedVets = computed(() => store.data.veterinarians.filter((item) => item.status === 'approved' && item.active))
const approvedInstitutions = computed(() => store.data.clinicInstitutions.filter((item) => item.status === 'approved' && item.active))
const records = computed(() => store.data.immunizationLedgers.filter((item) => !keyword.value || item.vaccineName.includes(keyword.value) || item.vaccineBatchNo.includes(keyword.value) || (store.data.petProfiles.find((pet) => pet.id === item.petId)?.name || '').includes(keyword.value)))
const form = reactive({ petId: '', vaccineName: '犬六联疫苗', vaccineBatchNo: 'VAC202606', immunizedAt: '2026-06-12', nextImmunizedAt: '2027-06-12', veterinarianId: '', institutionId: '' })

function openCreate() {
  Object.assign(form, { petId: store.data.petProfiles.find((item) => item.active)?.id || '', vaccineName: '犬六联疫苗', vaccineBatchNo: `VAC${Date.now().toString().slice(-6)}`, immunizedAt: '2026-06-12', nextImmunizedAt: '2027-06-12', veterinarianId: approvedVets.value[0]?.id || '', institutionId: approvedInstitutions.value[0]?.id || '' })
  dialogVisible.value = true
}

function showDetail(row: ImmunizationLedger) {
  current.value = row
  detailVisible.value = true
}

async function submit() {
  if (!form.petId || !form.vaccineName || !form.vaccineBatchNo || !form.veterinarianId || !form.institutionId) return ElMessage.warning('请填写宠物、疫苗批号、接种兽医和接种机构')
  await store.createImmunizationRecord({ ...form })
  dialogVisible.value = false
  ElMessage.success('免疫台账已登记')
}

async function voidRecord(row: ImmunizationLedger) {
  const { value } = await ElMessageBox.prompt('请输入作废原因', `作废免疫记录 ${row.vaccineName}`)
  await store.voidImmunizationRecord(row.id, value || '免疫记录作废')
  ElMessage.success('免疫记录已作废')
}
</script>

<template>
  <div class="page-grid">
    <el-card class="panel-card">
      <div class="card-header-line">
        <div>
          <h2>免疫台账管理</h2>
          <p>默认展示免疫记录列表，新增登记通过按钮打开；已生效记录只能作废，不能直接删除。</p>
        </div>
        <div class="action-inline">
          <el-button @click="store.refresh()">刷新</el-button>
          <el-button type="success" @click="openCreate">登记免疫记录</el-button>
        </div>
      </div>
      <div class="action-inline">
        <el-input v-model="keyword" placeholder="按宠物、疫苗名称或批号筛选" clearable />
        <el-button>导出</el-button>
      </div>
    </el-card>

    <el-card class="panel-card">
      <template #header><b>宠物免疫台账</b></template>
      <el-table :data="records" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="宠物" min-width="120"><template #default="{ row }">{{ store.data.petProfiles.find((pet) => pet.id === row.petId)?.name }}</template></el-table-column>
        <el-table-column prop="vaccineName" label="疫苗名称" min-width="150" />
        <el-table-column prop="vaccineBatchNo" label="疫苗批号" min-width="140" />
        <el-table-column prop="immunizedAt" label="免疫日期" />
        <el-table-column prop="nextImmunizedAt" label="下次免疫" />
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'voided' ? 'info' : 'success'">{{ row.status === 'voided' ? '已作废' : '已生效' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="170"><template #default="{ row }"><el-button size="small" @click="showDetail(row)">查看</el-button><el-button v-if="row.status !== 'voided'" size="small" type="warning" @click="voidRecord(row)">作废</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="登记免疫记录" width="620px">
      <el-form label-position="top">
        <el-form-item label="宠物"><el-select v-model="form.petId" class="full-width"><el-option v-for="item in store.data.petProfiles.filter((pet) => pet.active)" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="疫苗名称"><el-input v-model="form.vaccineName" /></el-form-item>
        <el-form-item label="疫苗批号"><el-input v-model="form.vaccineBatchNo" /></el-form-item>
        <el-form-item label="免疫日期"><el-input v-model="form.immunizedAt" /></el-form-item>
        <el-form-item label="下次免疫日期"><el-input v-model="form.nextImmunizedAt" /></el-form-item>
        <el-form-item label="接种兽医"><el-select v-model="form.veterinarianId" class="full-width"><el-option v-for="item in approvedVets" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="接种机构"><el-select v-model="form.institutionId" class="full-width"><el-option v-for="item in approvedInstitutions" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="success" @click="submit">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="免疫记录详情" width="540px">
      <div v-if="current" class="info-list">
        <p><span>宠物</span><b>{{ store.data.petProfiles.find((pet) => pet.id === current?.petId)?.name }}</b></p>
        <p><span>疫苗</span><b>{{ current.vaccineName }}｜{{ current.vaccineBatchNo }}</b></p>
        <p><span>接种兽医</span><b>{{ store.data.veterinarians.find((vet) => vet.id === current?.veterinarianId)?.name }}</b></p>
        <p><span>接种机构</span><b>{{ store.data.clinicInstitutions.find((clinic) => clinic.id === current?.institutionId)?.name }}</b></p>
        <p><span>状态</span><b>{{ current.status === 'voided' ? '已作废' : '已生效' }}</b></p>
      </div>
    </el-dialog>
  </div>
</template>
