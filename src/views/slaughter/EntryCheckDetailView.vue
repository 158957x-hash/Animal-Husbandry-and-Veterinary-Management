<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { InspectionAttachmentType, SlaughterEntryStatus } from '../../domain/models'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const entryId = computed(() => String(route.params.id || ''))
const entry = computed(() => store.data.slaughterEntryRecords.find((item) => item.id === entryId.value))
const certificate = computed(() => entry.value ? store.data.quarantineCertificates.find((item) => item.id === entry.value!.quarantineCertificateId) : undefined)
const application = computed(() => entry.value ? store.data.originApplications.find((item) => item.id === entry.value!.applicationId) : undefined)
const transportTask = computed(() => entry.value ? store.data.transportTasks.find((item) => item.id === entry.value!.transportTaskId) : undefined)
const landingReport = computed(() => certificate.value ? store.data.landingReports.find((item) => item.certificateId === certificate.value!.id) : undefined)
const waitingBatch = computed(() => entry.value ? store.data.slaughterBatches.find((item) => item.entryRecordId === entry.value!.id) : undefined)
const attachments = computed(() => entry.value ? store.data.inspectionAttachments.filter((item) => item.applicationNo === entry.value!.entryNo) : [])
const operationLogs = computed(() => entry.value ? store.data.operationLogs.filter((item) => item.target.includes(entry.value!.entryNo) || item.target.includes(certificate.value?.certificateNo ?? '')).slice(0, 10) : [])

const statusText: Record<SlaughterEntryStatus, string> = {
  pending_check: '待查验',
  checking: '待查验',
  entry_passed: '已通过',
  entry_rejected: '未通过',
}
const statusType: Record<SlaughterEntryStatus, 'warning' | 'success' | 'danger'> = {
  pending_check: 'warning',
  checking: 'warning',
  entry_passed: 'success',
  entry_rejected: 'danger',
}
const attachmentTypeName: Record<InspectionAttachmentType, string> = {
  vehicle_photo: '车辆入场照片',
  loading_photo: '动物装载照片',
  certificate_photo: '动物证照片',
  ear_tag_photo: '耳标抽查照片',
  scene_photo: '现场照片',
  other: '其他材料',
}

const transportInfo = computed(() => {
  const start = application.value?.departureTime || transportTask.value?.startedAt || certificate.value?.validFrom || ''
  return {
    taskNo: transportTask.value?.id || `YSRW-${entry.value?.entryNo ?? '-'}`,
    status: transportTask.value?.status || 'transporting',
    origin: certificate.value?.origin || entry.value?.originLocation || '-',
    destination: certificate.value?.destination || entry.value?.slaughterhouseName || '-',
    vehicle: entry.value?.vehiclePlateNo || certificate.value?.vehiclePlateNo || '-',
    carrier: entry.value?.carrier || certificate.value?.carrier || '-',
    startedAt: start,
    plannedArrivedAt: start ? new Date(new Date(start).getTime() + 90 * 60 * 1000).toISOString() : '',
    arrivedAt: transportTask.value?.arrivedAt || entry.value?.entryTime || entry.value?.checkedAt || '',
    hasDeviation: transportTask.value?.hasDeviation ?? false,
  }
})

const riskItems = computed(() => {
  const valid = certificate.value ? new Date(certificate.value.validTo).getTime() >= Date.now() : false
  return [
    { label: '动物证状态', value: valid ? certificate.value?.entryUsageStatus === 'used' ? '已入场使用' : '有效' : '已过期', ok: valid },
    { label: '是否重复入场', value: entry.value?.status === 'entry_passed' ? '已入场' : '未入场', ok: true },
    { label: '承运限制', value: store.data.carrierRestrictions.some((item) => item.certificateId === certificate.value?.id && item.status === 'restricted') ? '有' : '无', ok: !store.data.carrierRestrictions.some((item) => item.certificateId === certificate.value?.id && item.status === 'restricted') },
    { label: '预警记录', value: store.data.alerts.some((item) => item.relatedId === entry.value?.id && !item.resolved) ? '有' : '无', ok: !store.data.alerts.some((item) => item.relatedId === entry.value?.id && !item.resolved) },
    { label: '运输轨迹异常', value: transportInfo.value.hasDeviation ? '有' : '无', ok: !transportInfo.value.hasDeviation },
    { label: '落地报告状态', value: landingReport.value?.status === 'submitted' ? '已提交' : landingReport.value?.status === 'overdue' ? '超时' : '待提交', ok: landingReport.value?.status !== 'overdue' },
  ]
})

function fileSize(size: number) {
  return `${(size / 1024).toFixed(1)} KB`
}

function previewAttachment(fileName: string) {
  ElMessage.info(`预览入口已保留：${fileName}`)
}

function downloadAttachment(fileName: string) {
  ElMessage.info(`下载入口已保留：${fileName}`)
}

function viewTrack() {
  ElMessage.info('运输轨迹查看入口已保留')
}
</script>

<template>
  <section class="gov-page entry-process-page">
    <el-card class="panel-card">
      <div class="page-hero inline-hero">
        <div>
          <h2>入场查验详情</h2>
          <p>查看入场查验办理结果、产地检疫来源、运输任务信息与后续批次联动。</p>
        </div>
        <el-button @click="router.push('/slaughter/entry-check')">返回列表</el-button>
      </div>
    </el-card>

    <el-empty v-if="!entry" description="未找到入场查验记录" />

    <template v-else>
      <div class="entry-workbench">
        <div class="entry-left">
          <el-card class="panel-card compact-card">
            <template #header><strong>动物证与产地检疫信息</strong></template>
            <div class="info-list">
              <p><span>动物检疫合格证明编号</span><b>{{ certificate?.certificateNo ?? '-' }}</b></p>
              <p><span>产地检疫申报编号</span><b>{{ application?.applicationNo ?? certificate?.applicationNo ?? '-' }}</b></p>
              <p><span>养殖场</span><b>{{ entry.originFarm }}</b></p>
              <p><span>动物种类</span><b>{{ entry.animalType }}</b></p>
              <p><span>动物数量</span><b>{{ certificate?.quantity ?? entry.quantity }} 头</b></p>
              <p><span>耳标号段</span><b>{{ entry.earTagRange || '-' }}</b></p>
              <p><span>启运地</span><b>{{ transportInfo.origin }}</b></p>
              <p><span>目的地</span><b>{{ transportInfo.destination }}</b></p>
            </div>
          </el-card>

          <el-card class="panel-card compact-card">
            <template #header><strong>运输任务信息</strong></template>
            <div class="info-list">
              <p><span>运输任务编号</span><b>{{ transportInfo.taskNo }}</b></p>
              <p><span>运输车辆</span><b>{{ transportInfo.vehicle }}</b></p>
              <p><span>承运人</span><b>{{ transportInfo.carrier }}</b></p>
              <p><span>启运时间</span><b>{{ formatTime(transportInfo.startedAt) }}</b></p>
              <p><span>预计到达时间</span><b>{{ formatTime(transportInfo.plannedArrivedAt) }}</b></p>
              <p><span>实际到达时间</span><b>{{ formatTime(transportInfo.arrivedAt) }}</b></p>
              <p><span>当前运输状态</span><b>{{ transportInfo.status }}</b></p>
            </div>
            <div class="card-actions"><el-button size="small" type="primary" @click="viewTrack">查看轨迹</el-button></div>
          </el-card>
        </div>

        <div class="entry-middle">
          <el-card class="panel-card compact-card">
            <template #header><strong>系统风险提示</strong></template>
            <div class="risk-grid">
              <div v-for="item in riskItems" :key="item.label" class="risk-item">
                <span>{{ item.label }}</span>
                <el-tag :type="item.ok ? 'success' : 'danger'">{{ item.value }}</el-tag>
              </div>
            </div>
          </el-card>

          <el-card class="panel-card compact-card">
            <template #header><strong>现场人工核对</strong></template>
            <div class="info-list two-col-info">
              <p><span>实到数量</span><b>{{ entry.actualQuantity ?? '-' }} 头</b></p>
              <p><span>待宰圈编号</span><b>{{ entry.waitingPenNo ?? '-' }}</b></p>
              <p><span>实际到场车辆</span><b>{{ entry.actualVehiclePlateNo ?? '-' }}</b></p>
              <p><span>车辆已到场</span><b>{{ entry.vehicleArrived ? '是' : '否' }}</b></p>
              <p><span>实到数量一致</span><b>{{ entry.quantityMatched ? '是' : '否' }}</b></p>
              <p><span>抽查耳标一致</span><b>{{ entry.earTagMatched ? '是' : '否' }}</b></p>
              <p><span>动物临床状态正常</span><b>{{ entry.clinicalNormal ? '是' : '否' }}</b></p>
              <p><span>途中死亡数量</span><b>{{ entry.deathCount ?? 0 }} 头</b></p>
              <p><span>异常动物数量</span><b>{{ entry.abnormalCount ?? 0 }} 头</b></p>
              <p><span>装载情况正常</span><b>{{ entry.loadingNormal ? '是' : '否' }}</b></p>
              <p class="full-row"><span>现场备注</span><b>{{ entry.sceneRemark || '-' }}</b></p>
              <p v-if="entry.abnormalReason" class="full-row"><span>异常说明</span><b>{{ entry.abnormalReason }}</b></p>
              <p v-if="entry.returnReason" class="full-row"><span>退回原因</span><b>{{ entry.returnReason }}</b></p>
            </div>
          </el-card>
        </div>

        <div class="entry-right">
          <el-card class="panel-card compact-card sticky-card">
            <template #header><strong>入场处理结果</strong></template>
            <div class="result-status">
              <el-tag :type="statusType[entry.status]">{{ statusText[entry.status] }}</el-tag>
            </div>
            <div class="info-list">
              <p><span>入场经办人</span><b>{{ entry.operator || entry.checkedBy || '-' }}</b></p>
              <p><span>联系电话</span><b>{{ entry.phone || '-' }}</b></p>
              <p><span>入场时间</span><b>{{ formatTime(entry.entryTime || entry.checkedAt) }}</b></p>
              <p><span>处理意见</span><b>{{ entry.opinion || '-' }}</b></p>
              <p><span>待宰批次</span><b>{{ waitingBatch?.batchNo ?? '-' }}</b></p>
              <p><span>待宰圈编号</span><b>{{ waitingBatch?.waitingPenNo ?? entry.waitingPenNo ?? '-' }}</b></p>
              <p><span>屠宰检疫申报</span><b>{{ waitingBatch?.status === 'pending_slaughter_apply' ? '待提交屠宰检疫申报' : '-' }}</b></p>
            </div>
          </el-card>
        </div>
      </div>

      <el-card class="panel-card">
        <template #header><strong>入场取证附件</strong></template>
        <el-table :data="attachments" stripe>
          <el-table-column label="附件类型" min-width="130"><template #default="scope">{{ scope.row.typeName || attachmentTypeName[scope.row.type] }}</template></el-table-column>
          <el-table-column prop="fileName" label="文件名称" min-width="180" />
          <el-table-column label="文件大小" width="110"><template #default="scope">{{ fileSize(scope.row.fileSize) }}</template></el-table-column>
          <el-table-column label="上传时间" min-width="160"><template #default="scope">{{ formatTime(scope.row.uploadedAt) }}</template></el-table-column>
          <el-table-column prop="uploadedBy" label="上传人" min-width="130" />
          <el-table-column label="操作" width="130">
            <template #default="scope">
              <el-button link type="primary" @click="previewAttachment(scope.row.fileName)">预览</el-button>
              <el-button link type="primary" @click="downloadAttachment(scope.row.fileName)">下载</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!attachments.length" description="暂无取证附件" />
      </el-card>

      <el-card class="panel-card">
        <template #header><strong>操作日志</strong></template>
        <el-timeline>
          <el-timeline-item v-for="log in operationLogs" :key="log.id" :timestamp="formatTime(log.createdAt)">
            <b>{{ log.action }}</b>
            <p>{{ log.actor }}：{{ log.target }}</p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-if="!operationLogs.length" description="暂无操作日志" />
      </el-card>
    </template>
  </section>
</template>

<style scoped>
.entry-workbench {
  display: grid;
  grid-template-columns: 1.05fr 1.45fr 0.9fr;
  gap: 16px;
  align-items: start;
}
.entry-left,
.entry-middle,
.entry-right {
  display: grid;
  gap: 16px;
}
.inline-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.compact-card :deep(.el-card__body) {
  padding: 16px 18px;
}
.info-list {
  display: grid;
  gap: 10px;
}
.info-list p {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin: 0;
  color: var(--text-secondary);
}
.info-list b {
  color: var(--text-primary);
  text-align: right;
}
.two-col-info {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.full-row {
  grid-column: 1 / -1;
}
.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.risk-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.risk-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 10px;
  background: #f6faf7;
}
.sticky-card {
  position: sticky;
  top: 16px;
}
.result-status {
  margin-bottom: 16px;
}
@media (max-width: 1280px) {
  .entry-workbench {
    grid-template-columns: 1fr;
  }
  .sticky-card {
    position: static;
  }
}
</style>
