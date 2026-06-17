<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { DrugRequisition } from '../../domain/models'

const store = useAppStore()

const keyword = ref('')
const activeTab = ref('pending')
const detailVisible = ref(false)
const currentReq = ref<DrugRequisition | null>(null)

const allRequisitions = computed(() => {
  let list = store.data.drugRequisitions
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter((r) =>
      r.requisitionNo.toLowerCase().includes(kw) ||
      r.prescriptionNo.toLowerCase().includes(kw) ||
      r.petName.toLowerCase().includes(kw) ||
      r.veterinarianName.toLowerCase().includes(kw)
    )
  }
  return list
})

const pendingList = computed(() => allRequisitions.value.filter((r) => r.status !== 'outbound'))
const outboundList = computed(() => allRequisitions.value.filter((r) => r.status === 'outbound'))

const currentList = computed(() => activeTab.value === 'pending' ? pendingList.value : outboundList.value)

function getStatusTag(row: DrugRequisition) {
  const map: Record<string, { type: string; label: string }> = {
    pending: { type: 'warning', label: '待确认' },
    confirmed: { type: 'primary', label: '待出库' },
    outbound: { type: 'success', label: '已出库' },
  }
  return map[row.status] || { type: 'info', label: row.status }
}

function openDetail(row: DrugRequisition) {
  currentReq.value = row
  detailVisible.value = true
}

async function confirmOutbound(row: DrugRequisition) {
  await store.processDrugOutbound(row.id)
  ElMessage.success(`领用单 ${row.requisitionNo} 已出库`)
  detailVisible.value = false
}

function onTabChange() {
  keyword.value = ''
}
</script>

<template>
  <div class="outbound-page">
    <div class="page-header-card">
      <div class="header-left">
        <h2>药品出库管理</h2>
        <p>处理执业医师提交的药品领用单，确认出库后自动扣减库存。</p>
      </div>
      <div class="header-right">
        <el-button @click="store.refresh()">刷新</el-button>
      </div>
    </div>

    <div class="search-card">
      <div class="search-row">
        <el-input v-model="keyword" placeholder="搜索领用单号、处方编号、宠物名称或兽医" clearable class="search-input">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary"><el-icon><Search /></el-icon>搜索</el-button>
      </div>
    </div>

    <div class="tab-card">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane name="pending">
          <template #label>
            <span class="tab-label">待出库<el-badge :value="pendingList.length" :max="99" class="tab-badge" /></span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="outbound">
          <template #label>
            <span class="tab-label">已出库<el-badge :value="outboundList.length" :max="99" class="tab-badge" /></span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <el-table :data="currentList" stripe style="width: 100%" empty-text="暂无药品领用单">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="requisitionNo" label="领用单号" width="160" />
        <el-table-column prop="prescriptionNo" label="处方编号" width="160" />
        <el-table-column prop="petName" label="宠物名称" width="100" />
        <el-table-column prop="petOwnerName" label="宠物主人" width="100" />
        <el-table-column prop="veterinarianName" label="开方兽医" width="100" />
        <el-table-column label="药品数量" width="80">
          <template #default="{ row }">{{ row.items.length }}种</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row).type" size="small">{{ getStatusTag(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="openDetail(row)">查看详情</el-button>
            <el-button v-if="row.status === 'confirmed'" size="small" type="success" @click="confirmOutbound(row)">确认出库</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="药品领用单详情" width="900px" destroy-on-close>
      <div v-if="currentReq" class="detail-body">
        <div class="section">
          <h4>处方信息</h4>
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="处方编号">{{ currentReq.prescriptionNo }}</el-descriptions-item>
            <el-descriptions-item label="接诊编号">{{ currentReq.consultationNo }}</el-descriptions-item>
            <el-descriptions-item label="宠物主人">{{ currentReq.petOwnerName }}</el-descriptions-item>
            <el-descriptions-item label="宠物名称">{{ currentReq.petName }}</el-descriptions-item>
            <el-descriptions-item label="开方兽医">{{ currentReq.veterinarianName }}</el-descriptions-item>
            <el-descriptions-item label="领用单号">{{ currentReq.requisitionNo }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTag(currentReq).type" size="small">{{ getStatusTag(currentReq).label }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ new Date(currentReq.createdAt).toLocaleString('zh-CN') }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="section">
          <h4>药品明细</h4>
          <el-table :data="currentReq.items" stripe size="small" style="width: 100%">
            <el-table-column prop="drugName" label="药品名称" width="180" />
            <el-table-column prop="specification" label="规格" width="140" />
            <el-table-column prop="batchNo" label="批号" width="140" />
            <el-table-column prop="currentStock" label="当前库存" width="80" />
            <el-table-column prop="singleDose" label="单次剂量" width="80" />
            <el-table-column prop="frequency" label="用药频次" width="120" />
            <el-table-column prop="days" label="用药天数" width="80" />
            <el-table-column prop="quantity" label="出库数量" width="80" />
            <el-table-column prop="administration" label="用药方式" width="100" />
            <el-table-column prop="notes" label="用药说明" min-width="160" />
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="currentReq && currentReq.status === 'confirmed'" type="primary" @click="confirmOutbound(currentReq)">确认出库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.outbound-page { display: flex; flex-direction: column; gap: 16px; }
.page-header-card { display: flex; justify-content: space-between; align-items: flex-start; background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-header-card h2 { margin: 0 0 6px; font-size: 18px; color: #1d2129; }
.page-header-card p { margin: 0; font-size: 13px; color: #86909c; }
.header-right { display: flex; gap: 8px; flex-shrink: 0; }
.search-card { background: #fff; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.search-row { display: flex; gap: 12px; align-items: center; }
.search-input { flex: 1; max-width: 360px; }
.tab-card { background: #fff; border-radius: 8px; padding: 4px 16px 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.tab-label { display: inline-flex; align-items: center; gap: 6px; }
.tab-badge { margin-left: 4px; }
.detail-body { max-height: 55vh; overflow-y: auto; padding-right: 8px; }
.section { margin-bottom: 20px; }
.section h4 { margin: 0 0 10px; font-size: 14px; color: #1d2129; border-left: 3px solid #165dff; padding-left: 10px; }
</style>