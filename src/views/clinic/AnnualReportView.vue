<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import type { AnnualReport } from '../../domain/models'

const store = useAppStore()
const keyword = ref('')
const year = ref(new Date().getFullYear())
const detailVisible = ref(false)
const current = ref<AnnualReport>()
const approvedInstitutions = computed(() => store.data.clinicInstitutions.filter((item) => item.status === 'approved' && item.active))
const reports = computed(() => store.data.annualReports.filter((item) => !keyword.value || String(item.year).includes(keyword.value) || (store.data.clinicInstitutions.find((clinic) => clinic.id === item.institutionId)?.name || '').includes(keyword.value)))

function showDetail(row: AnnualReport) {
  current.value = row
  detailVisible.value = true
}

async function generate(institutionId?: string) {
  const target = institutionId || approvedInstitutions.value[0]?.id
  if (!target) return ElMessage.warning('请先完成诊疗机构备案审核')
  await store.generateAnnualReport(target, year.value)
  ElMessage.success('年度报告已自动汇总')
}

async function submit(id: string) {
  await store.submitAnnualReport(id)
  ElMessage.success('年度报告已提交')
}

async function withdraw(row: AnnualReport) {
  const { value } = await ElMessageBox.prompt('请输入撤回原因', `${row.year} 年度报告撤回`)
  await store.withdrawAnnualReport(row.id, value || '年度报告撤回补正')
  ElMessage.success('年度报告已撤回')
}
</script>

<template>
  <div class="page-grid">
    <el-card class="panel-card">
      <div class="card-header-line">
        <div>
          <h2>年度报告管理</h2>
          <p>默认展示年度报告列表，报告由日常业务数据自动汇总；已提交报告不能删除，只能撤回后重新生成或提交。</p>
        </div>
        <div class="action-inline">
          <el-button @click="store.refresh()">刷新</el-button>
          <el-button type="success" @click="generate()">生成年度报告</el-button>
        </div>
      </div>
      <div class="action-inline">
        <el-input v-model="keyword" placeholder="按机构或年度筛选" clearable />
        <el-input-number v-model="year" :min="2020" :max="2035" />
        <el-button>导出</el-button>
      </div>
    </el-card>

    <el-card class="panel-card">
      <template #header><b>年度报告列表</b></template>
      <el-table :data="reports" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="诊疗机构" min-width="180"><template #default="{ row }">{{ store.data.clinicInstitutions.find((clinic) => clinic.id === row.institutionId)?.name }}</template></el-table-column>
        <el-table-column prop="year" label="年度" width="90" />
        <el-table-column prop="veterinarianCount" label="兽医数" width="90" />
        <el-table-column prop="petCount" label="宠物数" width="90" />
        <el-table-column prop="immunizationCount" label="免疫数" width="90" />
        <el-table-column prop="prescriptionCount" label="处方数" width="90" />
        <el-table-column prop="wasteHandledCount" label="废弃物处理" width="110" />
        <el-table-column label="状态" width="110"><template #default="{ row }"><el-tag :type="row.status === 'submitted' ? 'success' : row.status === 'withdrawn' ? 'warning' : 'info'">{{ row.status === 'submitted' ? '已提交' : row.status === 'withdrawn' ? '已撤回' : '已生成' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="240"><template #default="{ row }"><el-button size="small" @click="showDetail(row)">查看</el-button><el-button v-if="row.status !== 'submitted'" size="small" type="success" @click="submit(row.id)">提交</el-button><el-button v-if="row.status === 'submitted'" size="small" type="warning" @click="withdraw(row)">撤回</el-button><el-button v-if="row.status === 'withdrawn'" size="small" @click="generate(row.institutionId)">重新汇总</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="年度报告详情" width="620px">
      <div v-if="current" class="info-list">
        <p><span>机构</span><b>{{ store.data.clinicInstitutions.find((clinic) => clinic.id === current?.institutionId)?.name }}</b></p>
        <p><span>年度</span><b>{{ current.year }}</b></p>
        <p><span>人员与宠物</span><b>兽医 {{ current.veterinarianCount }}｜宠物 {{ current.petCount }}</b></p>
        <p><span>诊疗业务</span><b>免疫 {{ current.immunizationCount }}｜处方 {{ current.prescriptionCount }}</b></p>
        <p><span>药品流转</span><b>入库 {{ current.drugStockInQuantity }}｜出库 {{ current.drugStockOutQuantity }}</b></p>
        <p><span>废弃物处理</span><b>{{ current.wasteHandledCount }}</b></p>
        <p><span>撤回原因</span><b>{{ current.withdrawReason || '无' }}</b></p>
      </div>
    </el-dialog>
  </div>
</template>
