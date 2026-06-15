<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'

const store = useAppStore()

const filterMarkType = ref<'' | 'card_ring' | 'sticker'>('')
const filterStatus = ref<'' | string>('')

const cardRingInventory = computed(() => store.data.quarantineMarkInventories.find((i) => i.markType === 'card_ring'))
const stickerInventory = computed(() => store.data.quarantineMarkInventories.find((i) => i.markType === 'sticker'))

const filteredMarks = computed(() => {
  let list = store.data.quarantineMarks
  if (filterMarkType.value) {
    list = list.filter((m) => m.markType === filterMarkType.value)
  }
  if (filterStatus.value) {
    list = list.filter((m) => m.status === filterStatus.value)
  }
  return list
})

const markStatusText: Record<string, string> = {
  pending_review: '待审核',
  issued: '已发放',
  in_stock: '在库',
  used: '已使用',
  returned: '已回收',
  voided: '已作废',
}
</script>

<template>
  <section class="stack">
    <div class="page-header">
      <h2>检疫标志使用记录</h2>
      <p>管理检疫标志的领用、发放、使用和回收全流程记录</p>
    </div>

    <div class="kpi-grid" style="grid-template-columns: repeat(2, 1fr);">
      <article class="kpi-card">
        <span>卡环式标志</span>
        <b>{{ cardRingInventory?.available ?? 0 }} / {{ cardRingInventory?.total ?? 0 }}</b>
        <small>库存 / 总量，已用 {{ cardRingInventory?.used ?? 0 }}</small>
      </article>
      <article class="kpi-card">
        <span>粘贴式标志</span>
        <b>{{ stickerInventory?.available ?? 0 }} / {{ stickerInventory?.total ?? 0 }}</b>
        <small>库存 / 总量，已用 {{ stickerInventory?.used ?? 0 }}</small>
      </article>
    </div>

    <el-card class="panel-card">
      <template #header>
        <div class="card-header-line">
          <strong>检疫标志记录</strong>
          <div style="display: flex; gap: 12px;">
            <el-select v-model="filterMarkType" placeholder="标志类型" clearable style="width: 140px;">
              <el-option label="卡环式" value="card_ring" />
              <el-option label="粘贴式" value="sticker" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 140px;">
              <el-option label="待审核" value="pending_review" />
              <el-option label="已发放" value="issued" />
              <el-option label="在库" value="in_stock" />
              <el-option label="已使用" value="used" />
              <el-option label="已回收" value="returned" />
              <el-option label="已作废" value="voided" />
            </el-select>
          </div>
        </div>
      </template>
      <el-table :data="filteredMarks" stripe>
        <el-table-column prop="markNo" label="标志编号" min-width="160" />
        <el-table-column label="标志类型" width="100">
          <template #default="scope">{{ scope.row.markType === 'card_ring' ? '卡环式' : '粘贴式' }}</template>
        </el-table-column>
        <el-table-column prop="ownerOrg" label="所属单位" min-width="140" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 'used' ? 'success' : scope.row.status === 'in_stock' ? 'info' : scope.row.status === 'voided' ? 'danger' : 'warning'"
              size="small"
            >
              {{ markStatusText[scope.row.status] ?? scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联产品证" min-width="160">
          <template #default="scope">
            {{ store.data.productCertificates.find((c) => c.id === scope.row.productCertificateId)?.certificateNo ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="关联动物证" min-width="160">
          <template #default="scope">
            {{ store.data.quarantineCertificates.find((c) => c.id === scope.row.quarantineCertificateId)?.certificateNo ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="关联肉品证" min-width="160">
          <template #default="scope">
            {{ store.data.meatQualityCertificates.find((c) => c.id === scope.row.meatQualityCertificateId)?.certificateNo ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="使用时间" width="180">
          <template #default="scope">{{ formatTime(scope.row.usedAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!filteredMarks.length" description="暂无检疫标志记录" />
    </el-card>
  </section>
</template>
