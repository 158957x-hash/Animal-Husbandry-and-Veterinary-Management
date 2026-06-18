<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { ImmunizationLedger } from '../../domain/models'

const store = useAppStore()
const detailVisible = ref(false)
const current = ref<ImmunizationLedger>()
const searchForm = reactive({
  ledgerNo: '',
  ownerName: '',
  petName: '',
  species: '',
  vaccineName: '',
  vaccineBatchNo: '',
  veterinarianName: '',
  outboundStatus: '',
})

function petOf(row: ImmunizationLedger) {
  return store.data.petProfiles.find((pet) => pet.id === row.petId)
}

function ownerOf(row: ImmunizationLedger) {
  const pet = petOf(row)
  return pet ? store.data.petOwners.find((owner) => owner.id === pet.ownerId) : undefined
}

function vetOf(row: ImmunizationLedger) {
  return store.data.veterinarians.find((vet) => vet.id === row.veterinarianId)
}

function outboundStatus(row: ImmunizationLedger) {
  return row.status === 'voided' ? '已冲销' : '已出库'
}

const records = computed(() => store.data.immunizationLedgers.filter((item) => {
  const pet = petOf(item)
  const owner = ownerOf(item)
  const vet = vetOf(item)
  if (searchForm.ledgerNo && !item.id.includes(searchForm.ledgerNo)) return false
  if (searchForm.ownerName && !(owner?.name || '').includes(searchForm.ownerName)) return false
  if (searchForm.petName && !(pet?.name || '').includes(searchForm.petName)) return false
  if (searchForm.species && !(pet?.species || '').includes(searchForm.species)) return false
  if (searchForm.vaccineName && !item.vaccineName.includes(searchForm.vaccineName)) return false
  if (searchForm.vaccineBatchNo && !item.vaccineBatchNo.includes(searchForm.vaccineBatchNo)) return false
  if (searchForm.veterinarianName && !(vet?.name || '').includes(searchForm.veterinarianName)) return false
  if (searchForm.outboundStatus && outboundStatus(item) !== searchForm.outboundStatus) return false
  return true
}))

function showDetail(row: ImmunizationLedger) {
  current.value = row
  detailVisible.value = true
}

function onSearch() {}
function onReset() {
  Object.assign(searchForm, { ledgerNo: '', ownerName: '', petName: '', species: '', vaccineName: '', vaccineBatchNo: '', veterinarianName: '', outboundStatus: '' })
}
</script>

<template>
  <div class="farmer-modern-page page-grid">
    <el-card class="gov-compact-card">
      <div class="card-header-line">
        <div>
          <h2>免疫台账管理</h2>
          <p>按宠物、主人、疫苗、兽医和库存出库状态筛选免疫台账，查看免疫记录详情。</p>
        </div>
        <div class="action-inline">
          <el-button @click="store.refresh()">刷新</el-button>
        </div>
      </div>
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="免疫台账编号"><el-input v-model="searchForm.ledgerNo" placeholder="请输入编号" clearable /></el-form-item>
        <el-form-item label="宠物主人"><el-input v-model="searchForm.ownerName" placeholder="请输入主人" clearable /></el-form-item>
        <el-form-item label="宠物名称"><el-input v-model="searchForm.petName" placeholder="请输入宠物" clearable /></el-form-item>
        <el-form-item label="动物种类"><el-input v-model="searchForm.species" placeholder="请输入种类" clearable /></el-form-item>
        <el-form-item label="疫苗名称"><el-input v-model="searchForm.vaccineName" placeholder="请输入疫苗" clearable /></el-form-item>
        <el-form-item label="疫苗批号"><el-input v-model="searchForm.vaccineBatchNo" placeholder="请输入批号" clearable /></el-form-item>
        <el-form-item label="接种兽医"><el-input v-model="searchForm.veterinarianName" placeholder="请输入兽医" clearable /></el-form-item>
        <el-form-item label="库存出库状态">
          <el-select v-model="searchForm.outboundStatus" placeholder="全部" clearable style="width: 130px">
            <el-option label="已出库" value="已出库" />
            <el-option label="已冲销" value="已冲销" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button>导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="gov-compact-card">
      <template #header><b>宠物免疫台账</b></template>
      <el-table :data="records" stripe>
        <el-table-column prop="id" label="免疫台账编号" min-width="150" />
        <el-table-column label="宠物主人" width="110"><template #default="{ row }">{{ ownerOf(row)?.name || '-' }}</template></el-table-column>
        <el-table-column label="宠物名称" width="110"><template #default="{ row }">{{ petOf(row)?.name || '-' }}</template></el-table-column>
        <el-table-column label="动物种类" width="90"><template #default="{ row }">{{ petOf(row)?.species || '-' }}</template></el-table-column>
        <el-table-column prop="vaccineName" label="疫苗名称" min-width="150" />
        <el-table-column prop="vaccineBatchNo" label="疫苗批号" min-width="130" />
        <el-table-column prop="immunizedAt" label="接种日期" width="110" />
        <el-table-column label="接种兽医" width="110"><template #default="{ row }">{{ vetOf(row)?.name || '-' }}</template></el-table-column>
        <el-table-column prop="nextImmunizedAt" label="下次免疫日期" width="120" />
        <el-table-column label="库存出库状态" width="120"><template #default="{ row }"><el-tag :type="row.status === 'voided' ? 'warning' : 'success'">{{ outboundStatus(row) }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="100" fixed="right"><template #default="{ row }"><el-button size="small" type="primary" link @click="showDetail(row)">查看详情</el-button></template></el-table-column>
      </el-table>
      <div class="gov-pagination-bar">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="records.length" :page-size="10" />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="免疫台账详情" width="640px">
      <el-descriptions v-if="current" :column="2" border size="small">
        <el-descriptions-item label="免疫台账编号">{{ current.id }}</el-descriptions-item>
        <el-descriptions-item label="宠物主人">{{ ownerOf(current)?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="宠物名称">{{ petOf(current)?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="动物种类">{{ petOf(current)?.species || '-' }}</el-descriptions-item>
        <el-descriptions-item label="疫苗名称">{{ current.vaccineName }}</el-descriptions-item>
        <el-descriptions-item label="疫苗批号">{{ current.vaccineBatchNo }}</el-descriptions-item>
        <el-descriptions-item label="接种日期">{{ current.immunizedAt }}</el-descriptions-item>
        <el-descriptions-item label="接种兽医">{{ vetOf(current)?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="下次免疫日期">{{ current.nextImmunizedAt }}</el-descriptions-item>
        <el-descriptions-item label="库存出库状态">{{ outboundStatus(current) }}</el-descriptions-item>
        <el-descriptions-item label="接种机构" :span="2">{{ store.data.clinicInstitutions.find((clinic) => clinic.id === current?.institutionId)?.name || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-grid { display: grid; gap: 16px; }
.panel-card { border-radius: 12px; }
.card-header-line { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
.card-header-line h2 { margin: 0 0 6px; font-size: 18px; color: #1d2129; }
.card-header-line p { margin: 0; font-size: 13px; color: #86909c; }
.action-inline { display: flex; align-items: center; gap: 10px; }
.search-form { display: flex; flex-wrap: wrap; gap: 0; }
</style>
