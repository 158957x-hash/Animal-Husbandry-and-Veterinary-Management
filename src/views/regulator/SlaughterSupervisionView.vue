<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'

const store = useAppStore()

const kpis = computed(() => [
  { label: '今日入场批次', value: store.data.slaughterEntryRecords.length },
  { label: '待宰批次', value: store.data.slaughterBatches.filter((b) => b.status === 'pending_slaughter_apply').length },
  { label: '待审核申报', value: store.data.slaughterApplications.filter((a) => a.status === 'submitted_pending_accept').length },
  { label: '已出产品证', value: store.data.productCertificates.length },
  { label: '异常预警数', value: store.data.alerts.filter((a) => a.type === 'slaughter' || a.type === 'entry' || a.type === 'quarantine').length },
])

const entryStatusText: Record<string, string> = {
  pending_check: '待查验',
  checking: '查验中',
  entry_passed: '入场通过',
  entry_rejected: '入场驳回',
}

const applicationStatusText: Record<string, string> = {
  submitted_pending_accept: '待受理',
  accepted_pending_pre_check: '已受理',
  post_product_generated: '产品批次已生成',
  product_cert_pending: '待出产品证',
  product_cert_issued: '已出产品证',
  returned: '退回',
  abnormal: '异常',
}

const alertLevelText: Record<string, string> = {
  info: '提示',
  warning: '警告',
  danger: '严重',
}

const alertTypeText: Record<string, string> = {
  slaughter: '屠宰',
  entry: '入场',
  quarantine: '检疫',
  transport: '运输',
  origin: '产地',
}

const slaughterAlerts = computed(() =>
  store.data.alerts.filter((a) => a.type === 'slaughter' || a.type === 'entry' || a.type === 'quarantine'),
)
</script>

<template>
  <section class="stack">
    <div class="page-header">
      <h2>屠宰检疫监管</h2>
      <p>对屠宰场入场查验、屠宰检疫申报、异常预警进行全程监管</p>
    </div>

    <div class="kpi-grid">
      <article v-for="item in kpis" :key="item.label" class="kpi-card">
        <span>{{ item.label }}</span>
        <b>{{ item.value }}</b>
      </article>
    </div>

    <el-card class="panel-card">
      <template #header><strong>入场记录</strong></template>
      <el-table :data="store.data.slaughterEntryRecords" stripe>
        <el-table-column prop="entryNo" label="入场编号" min-width="160" />
        <el-table-column label="动物证编号" min-width="160">
          <template #default="scope">
            {{ store.data.quarantineCertificates.find((c) => c.id === scope.row.quarantineCertificateId)?.certificateNo ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="originFarm" label="养殖场" min-width="140" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="核验结果" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'entry_passed' ? 'success' : scope.row.status === 'entry_rejected' ? 'danger' : 'warning'" size="small">
              {{ scope.row.checkResults.length ? (scope.row.checkResults.every((r) => r.passed) ? '通过' : '异常') : '待查验' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag size="small">{{ entryStatusText[scope.row.status] ?? scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="入场时间" width="180">
          <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="panel-card">
      <template #header><strong>屠宰检疫申报</strong></template>
      <el-table :data="store.data.slaughterApplications" stripe>
        <el-table-column prop="applicationNo" label="申报编号" min-width="160" />
        <el-table-column label="屠宰企业" min-width="140">
          <template #default="scope">
            {{ store.data.slaughterEntryRecords.find((r) => r.id === scope.row.entryRecordId)?.slaughterhouseName ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="非瘟结果" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.africanSwineFeverResult === 'negative' ? 'success' : 'danger'" size="small">
              {{ scope.row.africanSwineFeverResult === 'negative' ? '阴性' : '阳性' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="违禁药物结果" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.bannedDrugResult === 'negative' ? 'success' : 'danger'" size="small">
              {{ scope.row.bannedDrugResult === 'negative' ? '阴性' : '阳性' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'submitted_pending_accept' ? 'warning' : scope.row.status === 'product_cert_issued' ? 'success' : scope.row.status === 'abnormal' ? 'danger' : 'info'" size="small">
              {{ applicationStatusText[scope.row.status] ?? scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="180">
          <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="panel-card">
      <template #header><strong>异常预警</strong></template>
      <el-table :data="slaughterAlerts" stripe>
        <el-table-column label="级别" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.level === 'danger' ? 'danger' : scope.row.level === 'warning' ? 'warning' : 'info'" size="small">
              {{ alertLevelText[scope.row.level] ?? scope.row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="90">
          <template #default="scope">{{ alertTypeText[scope.row.type] ?? scope.row.type }}</template>
        </el-table-column>
        <el-table-column prop="message" label="内容" min-width="240" />
        <el-table-column prop="relatedId" label="关联编号" min-width="160" />
        <el-table-column label="时间" width="180">
          <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.resolved ? 'success' : 'danger'" size="small">
              {{ scope.row.resolved ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!slaughterAlerts.length" description="暂无屠宰相关预警" />
    </el-card>
  </section>
</template>
