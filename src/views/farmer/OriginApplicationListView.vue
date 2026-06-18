<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { statusText, statusType } from '../../domain/stateMachine'
import { formatTime } from '../../lib/format'
import type { OriginQuarantineApplication } from '../../domain/models'

const store = useAppStore()
const router = useRouter()
const keywordInput = ref('')
const statusFilterInput = ref('')
const appliedKeyword = ref('')
const appliedStatus = ref('')
const applications = computed(() => store.data.originApplications.filter((item) => {
  const matchedKeyword = !appliedKeyword.value || item.applicationNo.includes(appliedKeyword.value) || item.animalType.includes(appliedKeyword.value) || item.destination.includes(appliedKeyword.value) || plateNo(item).includes(appliedKeyword.value)
  const matchedStatus = !appliedStatus.value || item.status === appliedStatus.value
  return matchedKeyword && matchedStatus
}))

function searchApplications() {
  appliedKeyword.value = keywordInput.value.trim()
  appliedStatus.value = statusFilterInput.value
}

async function refreshApplications() {
  await store.refresh()
  searchApplications()
}

function plateNo(row: OriginQuarantineApplication) {
  return store.data.vehicles.find((item) => item.id === row.vehicleId)?.plateNo || '-'
}

async function submitDraft(row: OriginQuarantineApplication) {
  await store.submitOriginDraft(row.id)
  ElMessage.success('申报已提交，官方兽医待办已同步')
}

async function deleteDraft(row: OriginQuarantineApplication) {
  await ElMessageBox.confirm(`确认删除草稿 ${row.applicationNo}？`, '删除确认')
  await store.deleteOriginDraft(row.id)
  ElMessage.success('草稿已删除')
}

async function withdraw(row: OriginQuarantineApplication) {
  const { value } = await ElMessageBox.prompt('请输入撤回原因', `撤回申报 ${row.applicationNo}`)
  await store.withdrawOriginApplication(row.id, value || '养殖场户撤回补充材料')
  ElMessage.success('申报已撤回为草稿')
}

async function requestVoid(row: OriginQuarantineApplication) {
  const { value } = await ElMessageBox.prompt('请输入申请作废原因', `申请作废 ${row.applicationNo}`)
  await store.requestVoidOriginApplication(row.id, value || '养殖场户申请作废证明')
  ElMessage.success('作废申请已提交，等待官方兽医或监管人员处理')
}

function view(row: OriginQuarantineApplication) {
  router.push(`/farmer/origin-detail/${row.id}`)
}

function edit(row: OriginQuarantineApplication) {
  router.push(`/farmer/origin-apply/${row.id}`)
}
</script>

<template>
  <div class="farmer-modern-page">
    <section class="gov-page-header">
      <div>
        <h2>我的产地检疫申报</h2>
        <p>集中查看申报进度，并根据当前状态办理提交、撤回、查看证明和运输任务等事项。</p>
      </div>
      <div class="gov-page-header__actions">
        <el-button type="primary" @click="router.push('/farmer/origin-apply')">新增申报</el-button>
      </div>
    </section>

    <section class="gov-toolbar-card gov-compact-card">
      <div class="gov-filter-grid">
        <el-input v-model="keywordInput" placeholder="按编号、动物、目的地、车牌筛选" clearable @keyup.enter="searchApplications" />
        <el-select v-model="statusFilterInput" placeholder="状态筛选" clearable>
          <el-option label="草稿" value="draft" />
          <el-option label="已提交" value="submitted" />
          <el-option label="待官方兽医审核" value="origin_reviewing" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="已出证" value="certificate_issued" />
          <el-option label="运输中" value="transporting" />
          <el-option label="已到达" value="arrived" />
          <el-option label="已作废" value="voided" />
        </el-select>
        <div class="gov-card-title__actions">
          <el-button type="primary" @click="searchApplications">搜索</el-button>
          <el-button @click="refreshApplications">刷新</el-button>
          <el-button>导出</el-button>
        </div>
      </div>
    </section>

    <section class="gov-table-card gov-compact-card">
      <div class="gov-table-card__header"><div><strong>申报列表</strong><small>按申报状态办理对应事项</small></div></div>
      <el-table :data="applications" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="applicationNo" label="申报编号" min-width="160" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="quantity" label="申报数量" width="100" />
        <el-table-column prop="destination" label="目的地" min-width="170" />
        <el-table-column label="运输车辆" width="120"><template #default="{ row }">{{ plateNo(row) }}</template></el-table-column>
        <el-table-column label="提交时间" min-width="160"><template #default="{ row }">{{ row.submittedAt ? formatTime(row.submittedAt) : '未提交' }}</template></el-table-column>
        <el-table-column label="当前状态" width="140"><template #default="{ row }"><el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" @click="view(row)">查看</el-button>
              <template v-if="row.status === 'draft'">
                <el-button size="small" @click="edit(row)">编辑</el-button>
                <el-button size="small" type="success" @click="submitDraft(row)">提交</el-button>
                <el-button size="small" type="danger" @click="deleteDraft(row)">删除</el-button>
              </template>
              <template v-else-if="['submitted', 'origin_reviewing'].includes(row.status)">
                <el-button v-if="row.status === 'submitted'" size="small" type="warning" @click="withdraw(row)">撤回</el-button>
              </template>
              <template v-else-if="row.status === 'rejected'">
                <el-button size="small" type="warning" @click="view(row)">查看原因</el-button>
                <el-button size="small" type="success" @click="edit(row)">编辑重提</el-button>
              </template>
              <template v-else-if="row.status === 'certificate_issued'">
                <el-button size="small" type="success" @click="view(row)">查看证明</el-button>
                <el-button size="small" @click="view(row)">运输任务</el-button>
                <el-button size="small" type="warning" :disabled="row.voidRequested" @click="requestVoid(row)">{{ row.voidRequested ? '已申请作废' : '申请作废' }}</el-button>
              </template>
              <template v-else-if="row.status === 'transporting'">
                <el-button size="small" @click="view(row)">查看轨迹</el-button>
                <el-button size="small" @click="view(row)">落地状态</el-button>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="gov-pagination-bar">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="applications.length" :page-size="10" />
      </div>
      <el-empty v-if="!applications.length" description="暂无申报记录" />
    </section>
  </div>
</template>
