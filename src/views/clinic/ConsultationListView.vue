<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { ConsultationRecord } from '../../domain/models'

const store = useAppStore()
const router = useRouter()

const keyword = ref('')

const consultations = computed(() => {
  let list = store.data.consultations
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter((item) =>
      item.consultationNo.toLowerCase().includes(kw) ||
      item.petName.toLowerCase().includes(kw) ||
      item.petOwnerName.toLowerCase().includes(kw) ||
      item.veterinarianName.toLowerCase().includes(kw)
    )
  }
  return list
})

function getStatusTag(row: ConsultationRecord) {
  const map: Record<string, { type: string; label: string }> = {
    pending: { type: 'warning', label: '待接诊' },
    filling_record: { type: 'primary', label: '待填写诊疗记录' },
    pending_prescription: { type: 'primary', label: '待开方' },
    completed: { type: 'success', label: '已完成' },
  }
  return map[row.status] || { type: 'info', label: row.status }
}

function getDispensingTag(row: ConsultationRecord) {
  const map: Record<string, { type: string; label: string }> = {
    no_dispensing: { type: 'info', label: '无需出药' },
    pending_dispensing: { type: 'warning', label: '待出药' },
    dispensed: { type: 'success', label: '已出药' },
  }
  return map[row.dispensingStatus] || { type: 'info', label: row.dispensingStatus }
}

function goRegister() {
  router.push('/clinic/veterinarian/consultation/register')
}

async function confirmConsultation(row: ConsultationRecord) {
  try {
    await ElMessageBox.confirm(`确认接诊「${row.petName}」？确认后接诊时间将被记录。`, '确认接诊', { type: 'info' })
    await store.confirmConsultation(row.id)
    ElMessage.success('接诊确认成功')
  } catch { /* cancelled */ }
}

function goTreatmentRecord(row: ConsultationRecord) {
  router.push(`/clinic/veterinarian/consultation/${row.id}/treatment`)
}

function goPrescription(row: ConsultationRecord) {
  router.push(`/clinic/veterinarian/consultation/${row.id}/prescription`)
}

function goDetail(row: ConsultationRecord) {
  router.push(`/clinic/veterinarian/consultation/${row.id}/detail`)
}
</script>

<template>
  <div class="farmer-modern-page consultation-page">
    <section class="gov-page-header">
      <div>
        <h2>接诊管理</h2>
        <p>管理宠物接诊记录，包括接诊登记、诊疗记录填写、处方开具等全流程</p>
      </div>
      <div class="gov-page-header__actions">
        <el-button @click="store.refresh()">刷新</el-button>
        <el-button type="primary" @click="goRegister">接诊登记</el-button>
      </div>
    </section>

    <section class="gov-toolbar-card gov-compact-card">
      <div class="search-row">
        <el-input v-model="keyword" placeholder="搜索接诊编号、宠物名称、主人姓名或兽医" clearable class="search-input">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary"><el-icon><Search /></el-icon>搜索</el-button>
      </div>
    </section>

    <section class="gov-table-card gov-compact-card">
      <div class="gov-table-card__header"><div><strong>接诊记录</strong><small>按状态办理接诊、诊疗记录和处方开具</small></div></div>
      <el-table :data="consultations" stripe style="width: 100%" empty-text="暂无接诊记录">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="consultationNo" label="接诊编号" width="160" />
        <el-table-column prop="petOwnerName" label="宠物主人" width="100" />
        <el-table-column prop="petOwnerPhone" label="联系电话" width="130" />
        <el-table-column prop="petName" label="宠物名称" width="100" />
        <el-table-column prop="species" label="动物种类" width="80" />
        <el-table-column prop="breed" label="品种" min-width="120" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="age" label="年龄" width="60">
          <template #default="{ row }">{{ row.age }}岁</template>
        </el-table-column>
        <el-table-column label="接诊状态" width="140">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row).type" size="small">{{ getStatusTag(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="出药状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getDispensingTag(row).type" size="small">{{ getDispensingTag(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="接诊时间" width="170">
          <template #default="{ row }">
            {{ row.consultationTime ? new Date(row.consultationTime).toLocaleString('zh-CN') : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="veterinarianName" label="接诊兽医" width="100" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="goDetail(row)">查看详情</el-button>
            <el-button v-if="row.status === 'pending'" size="small" link type="success" @click="confirmConsultation(row)">确认接诊</el-button>
            <el-button v-if="row.status === 'filling_record'" size="small" link type="primary" @click="goTreatmentRecord(row)">填写诊疗记录</el-button>
            <el-button v-if="row.status === 'pending_prescription'" size="small" link type="warning" @click="goPrescription(row)">开具处方笺</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="gov-pagination-bar">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="consultations.length" :page-size="10" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.consultation-page { display: flex; flex-direction: column; gap: 16px; }
.page-header-card { display: flex; justify-content: space-between; align-items: flex-start; background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-header-card h2 { margin: 0 0 6px; font-size: 18px; color: #1d2129; }
.page-header-card p { margin: 0; font-size: 13px; color: #86909c; }
.header-right { display: flex; gap: 8px; flex-shrink: 0; }
.search-card { background: #fff; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.search-row { display: flex; gap: 12px; align-items: center; }
.search-input { flex: 1; max-width: 360px; }
.table-card { background: #fff; border-radius: 8px; padding: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
</style>