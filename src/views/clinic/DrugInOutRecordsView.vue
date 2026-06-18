<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()

const searchForm = reactive({
  drugName: '',
  type: '',
  operator: '',
  relatedId: '',
})

const types = computed(() => store.data.drugInOutRecords)

const records = computed(() => {
  return types.value.filter((item) => {
    if (searchForm.drugName && !item.drugName.includes(searchForm.drugName)) return false
    if (searchForm.type && item.type !== searchForm.type) return false
    if (searchForm.operator && !item.operator.includes(searchForm.operator)) return false
    if (searchForm.relatedId && !(item.relatedId || '').includes(searchForm.relatedId)) return false
    return true
  })
})

function getTypeTag(type: string) {
  const map: Record<string, { type: string; label: string }> = {
    in: { type: 'success', label: '入库' },
    out: { type: 'danger', label: '出库' },
    reversal: { type: 'warning', label: '冲销' },
  }
  return map[type] || { type: 'info', label: type }
}

function onSearch() { /* computed */ }
function onReset() {
  Object.assign(searchForm, { drugName: '', type: '', operator: '', relatedId: '' })
}
</script>

<template>
  <div class="records-page">
    <div class="page-header-card">
      <div class="header-left">
        <h2>药品出入库记录</h2>
        <p>查看所有药品的入库、出库和冲销记录，支持多条件筛选。</p>
      </div>
      <div class="header-right">
        <el-button @click="store.refresh()" :icon="Refresh">刷新</el-button>
      </div>
    </div>

    <div class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="药品名称">
          <el-input v-model="searchForm.drugName" placeholder="请输入药品名称" clearable />
        </el-form-item>
        <el-form-item label="记录类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 120px">
            <el-option label="入库" value="in" />
            <el-option label="出库" value="out" />
            <el-option label="冲销" value="reversal" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="searchForm.operator" placeholder="请输入操作人" clearable />
        </el-form-item>
        <el-form-item label="关联单据">
          <el-input v-model="searchForm.relatedId" placeholder="处方/领用单编号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table :data="records" stripe style="width: 100%" empty-text="暂无出入库记录">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type).type" size="small">{{ getTypeTag(row.type).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="drugName" label="药品名称" min-width="180" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column label="关联单据" width="160">
          <template #default="{ row }">{{ row.relatedId || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作时间" width="170">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
        </el-table-column>
      </el-table>
      <div class="gov-pagination-bar">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="records.length" :page-size="10" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.records-page { display: flex; flex-direction: column; gap: 16px; }
.page-header-card { display: flex; justify-content: space-between; align-items: flex-start; background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-header-card h2 { margin: 0 0 6px; font-size: 18px; color: #1d2129; }
.page-header-card p { margin: 0; font-size: 13px; color: #86909c; }
.header-right { display: flex; gap: 8px; flex-shrink: 0; }
.search-card { background: #fff; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.table-card { background: #fff; border-radius: 8px; padding: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
</style>