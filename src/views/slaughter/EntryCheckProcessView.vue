<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { InspectionAttachmentType, SlaughterEntryAttachmentInput } from '../../domain/models'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const entryId = computed(() => String(route.params.id || ''))
const entry = computed(() => store.data.slaughterEntryRecords.find((item) => item.id === entryId.value))
const certificate = computed(() => entry.value ? store.data.quarantineCertificates.find((item) => item.id === entry.value!.quarantineCertificateId) : undefined)
const application = computed(() => entry.value ? store.data.originApplications.find((item) => item.id === entry.value!.applicationId) : undefined)
const transportTask = computed(() => entry.value ? store.data.transportTasks.find((item) => item.id === entry.value!.transportTaskId) : undefined)
const carrierRestricted = computed(() => certificate.value ? store.data.carrierRestrictions.some((item) => item.certificateId === certificate.value!.id && item.status === 'restricted') : false)
const repeatedEntry = computed(() => entry.value ? store.data.slaughterEntryRecords.some((item) => item.id !== entry.value!.id && item.quarantineCertificateId === entry.value!.quarantineCertificateId && item.status === 'entry_passed') : false)
const landingReport = computed(() => certificate.value ? store.data.landingReports.find((item) => item.certificateId === certificate.value!.id) : undefined)
const savedAttachments = computed(() => entry.value ? store.data.inspectionAttachments.filter((item) => item.applicationNo === entry.value!.entryNo) : [])
const operationLogs = computed(() => entry.value ? store.data.operationLogs.filter((item) => item.target.includes(entry.value!.entryNo) || item.target.includes(certificate.value?.certificateNo ?? '')).slice(0, 8) : [])

const form = reactive({
  actualQuantity: entry.value?.quantity ?? 0,
  waitingPenNo: '',
  actualVehiclePlateNo: entry.value?.vehiclePlateNo ?? '',
  vehicleArrived: true,
  quantityMatched: true,
  earTagMatched: true,
  clinicalNormal: true,
  deathCount: 0,
  abnormalCount: 0,
  loadingNormal: true,
  sceneRemark: '',
  operator: '屠宰经办人 李强',
  phone: '13900008888',
  entryTime: new Date().toISOString(),
  opinion: '',
  abnormalReason: '',
  returnReason: '',
})

const localAttachments = ref<SlaughterEntryAttachmentInput[]>([])
const attachmentType = ref<InspectionAttachmentType>('vehicle_photo')

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
    taskNo: transportTask.value?.id || `YSRW-${entry.value?.entryNo ?? '待生成'}`,
    status: transportTask.value?.status || 'transporting',
    origin: certificate.value?.origin || entry.value?.originLocation || '-',
    destination: certificate.value?.destination || entry.value?.slaughterhouseName || '-',
    vehicle: entry.value?.vehiclePlateNo || certificate.value?.vehiclePlateNo || '-',
    carrier: entry.value?.carrier || certificate.value?.carrier || '-',
    startedAt: start,
    plannedArrivedAt: start ? new Date(new Date(start).getTime() + 90 * 60 * 1000).toISOString() : '',
    arrivedAt: transportTask.value?.arrivedAt || form.entryTime,
    hasDeviation: transportTask.value?.hasDeviation ?? false,
  }
})

const riskItems = computed(() => {
  const valid = certificate.value ? new Date(certificate.value.validTo).getTime() >= Date.now() : false
  const used = certificate.value?.entryUsageStatus === 'used'
  return [
    { label: '动物证状态', value: valid && !used ? '有效' : used ? '已入场使用' : '已过期', ok: valid && !used },
    { label: '是否重复入场', value: repeatedEntry.value ? '已入场' : '未入场', ok: !repeatedEntry.value },
    { label: '承运限制', value: carrierRestricted.value ? '有' : '无', ok: !carrierRestricted.value },
    { label: '预警记录', value: store.data.alerts.some((item) => item.relatedId === entry.value?.id && !item.resolved) ? '有' : '无', ok: !store.data.alerts.some((item) => item.relatedId === entry.value?.id && !item.resolved) },
    { label: '运输轨迹异常', value: transportInfo.value.hasDeviation ? '有' : '无', ok: !transportInfo.value.hasDeviation },
    { label: '落地报告状态', value: landingReport.value?.status === 'submitted' ? '已提交' : landingReport.value?.status === 'overdue' ? '超时' : '待提交', ok: landingReport.value?.status !== 'overdue' },
  ]
})

const scenePassed = computed(() => form.vehicleArrived && form.quantityMatched && form.earTagMatched && form.clinicalNormal && form.deathCount === 0 && form.abnormalCount === 0 && form.loadingNormal)
const riskPassed = computed(() => riskItems.value.slice(0, 4).every((item) => item.ok))
const canConfirm = computed(() => Boolean(entry.value && form.actualQuantity && form.waitingPenNo.trim() && riskPassed.value && scenePassed.value))

function addAttachment(file: File) {
  localAttachments.value.push({
    type: attachmentType.value,
    typeName: attachmentTypeName[attachmentType.value],
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/octet-stream',
    uploadedBy: form.operator,
  })
}

function handleFileChange(file: { raw?: File }) {
  if (file.raw) addAttachment(file.raw)
}

function removeAttachment(index: number) {
  localAttachments.value.splice(index, 1)
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

async function confirmEntry() {
  if (!entry.value) return
  if (!canConfirm.value) {
    ElMessage.warning('请确认风险拦截、现场核对、实到数量和待宰圈编号均满足要求')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认入场 ${form.actualQuantity} 头至待宰圈 ${form.waitingPenNo}？确认后将生成待宰批次，动物证状态将变更为已入场使用。`,
      '确认入场',
      { confirmButtonText: '确认入场', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  await store.confirmSlaughterEntry(entry.value.id, {
    actualQuantity: Number(form.actualQuantity),
    waitingPenNo: form.waitingPenNo,
    actualVehiclePlateNo: form.actualVehiclePlateNo,
    vehicleArrived: form.vehicleArrived,
    quantityMatched: form.quantityMatched,
    earTagMatched: form.earTagMatched,
    clinicalNormal: form.clinicalNormal,
    deathCount: Number(form.deathCount),
    abnormalCount: Number(form.abnormalCount),
    loadingNormal: form.loadingNormal,
    sceneRemark: form.sceneRemark,
    operator: form.operator,
    phone: form.phone,
    entryTime: form.entryTime,
    opinion: form.opinion || '准予入场',
    attachments: localAttachments.value,
  })
  ElMessage.success('确认入场成功，已生成待宰批次')
  router.push(`/slaughter/entry-check/${entry.value.id}/detail`)
}

async function registerException() {
  if (!entry.value) return
  if (!form.abnormalReason.trim()) {
    ElMessage.warning('登记异常必须填写异常说明')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认登记入场异常？异常说明：${form.abnormalReason}`,
      '登记异常',
      { confirmButtonText: '确认登记', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  await store.registerSlaughterEntryException(entry.value.id, {
    actualQuantity: form.actualQuantity ? Number(form.actualQuantity) : undefined,
    waitingPenNo: form.waitingPenNo,
    actualVehiclePlateNo: form.actualVehiclePlateNo,
    vehicleArrived: form.vehicleArrived,
    quantityMatched: form.quantityMatched,
    earTagMatched: form.earTagMatched,
    clinicalNormal: form.clinicalNormal,
    deathCount: Number(form.deathCount),
    abnormalCount: Number(form.abnormalCount),
    loadingNormal: form.loadingNormal,
    sceneRemark: form.sceneRemark,
    abnormalReason: form.abnormalReason,
    operator: form.operator,
    phone: form.phone,
    entryTime: form.entryTime,
    opinion: form.opinion || '登记异常',
    attachments: localAttachments.value,
  })
  ElMessage.success('已登记入场异常')
  router.push(`/slaughter/entry-check/${entry.value.id}/detail`)
}

async function returnEntry() {
  if (!entry.value) return
  if (!form.returnReason.trim()) {
    ElMessage.warning('入场退回必须填写原因')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认退回该入场批次？退回原因：${form.returnReason}`,
      '入场退回',
      { confirmButtonText: '确认退回', cancelButtonText: '取消', type: 'error' },
    )
  } catch {
    return
  }
  await store.returnSlaughterEntry(entry.value.id, {
    reason: form.returnReason,
    operator: form.operator,
    phone: form.phone,
    entryTime: form.entryTime,
    opinion: form.opinion || '入场退回',
  })
  ElMessage.success('已退回该入场批次')
  router.push(`/slaughter/entry-check/${entry.value.id}/detail`)
}

function saveRecord() {
  ElMessage.success('记录已暂存于当前页面')
}

function fileSize(size: number) {
  return `${(size / 1024).toFixed(1)} KB`
}

function riskTag(ok: boolean) {
  return ok ? 'success' : 'danger'
}
</script>

<template>
  <section class="gov-page entry-process-page">
    <el-card class="panel-card">
      <div class="page-hero inline-hero">
        <div>
          <h2>入场查验办理</h2>
          <p>依据产地检疫出证结果办理入场，运输任务信息由系统生成并用于现场核对。</p>
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
            <div class="card-actions">
              <el-button size="small">查看动物证</el-button>
              <el-button size="small">查看耳标明细</el-button>
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
            <div class="card-actions">
              <el-button size="small">查看运输任务</el-button>
              <el-button size="small" type="primary" @click="viewTrack">查看轨迹</el-button>
            </div>
          </el-card>
        </div>

        <div class="entry-middle">
          <el-card class="panel-card compact-card">
            <template #header><strong>系统风险提示</strong></template>
            <div class="risk-grid">
              <div v-for="item in riskItems" :key="item.label" class="risk-item">
                <span>{{ item.label }}</span>
                <el-tag :type="riskTag(item.ok)">{{ item.value }}</el-tag>
              </div>
            </div>
          </el-card>

          <el-card class="panel-card compact-card">
            <template #header><strong>现场人工核对</strong></template>
            <el-form label-position="top" class="entry-form-grid">
              <el-form-item label="实到数量">
                <el-input-number v-model="form.actualQuantity" :min="0" class="full-width" />
              </el-form-item>
              <el-form-item label="待宰圈编号">
                <el-input v-model="form.waitingPenNo" placeholder="请输入待宰圈编号" />
              </el-form-item>
              <el-form-item label="实际到场车辆">
                <el-input v-model="form.actualVehiclePlateNo" />
              </el-form-item>
              <el-form-item label="途中死亡数量">
                <el-input-number v-model="form.deathCount" :min="0" class="full-width" />
              </el-form-item>
              <el-form-item label="异常动物数量">
                <el-input-number v-model="form.abnormalCount" :min="0" class="full-width" />
              </el-form-item>
              <div class="manual-checks full-line">
                <el-checkbox v-model="form.vehicleArrived">车辆已到场</el-checkbox>
                <el-checkbox v-model="form.quantityMatched">实到数量与动物证一致</el-checkbox>
                <el-checkbox v-model="form.earTagMatched">抽查耳标与动物证一致</el-checkbox>
                <el-checkbox v-model="form.clinicalNormal">动物临床状态正常</el-checkbox>
                <el-checkbox :model-value="form.deathCount === 0" @change="form.deathCount = $event ? 0 : form.deathCount || 1">无途中死亡</el-checkbox>
                <el-checkbox :model-value="form.abnormalCount === 0" @change="form.abnormalCount = $event ? 0 : form.abnormalCount || 1">无异常动物</el-checkbox>
                <el-checkbox v-model="form.loadingNormal">装载情况正常</el-checkbox>
              </div>
              <el-form-item class="full-line" label="现场备注">
                <el-input v-model="form.sceneRemark" type="textarea" :rows="3" />
              </el-form-item>
              <el-form-item v-if="!scenePassed" class="full-line" label="异常说明">
                <el-input v-model="form.abnormalReason" type="textarea" :rows="3" placeholder="现场核对不通过时必须填写" />
              </el-form-item>
            </el-form>
          </el-card>
        </div>

        <div class="entry-right">
          <el-card class="panel-card compact-card sticky-card">
            <template #header><strong>入场处理</strong></template>
            <el-form label-position="top">
              <el-form-item label="入场经办人"><el-input v-model="form.operator" /></el-form-item>
              <el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item>
              <el-form-item label="入场时间"><el-date-picker v-model="form.entryTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]" class="full-width" /></el-form-item>
              <el-form-item label="处理意见"><el-input v-model="form.opinion" type="textarea" :rows="3" /></el-form-item>
              <el-form-item label="入场退回原因"><el-input v-model="form.returnReason" type="textarea" :rows="2" /></el-form-item>
            </el-form>
            <div class="process-actions">
              <el-button type="success" :disabled="!canConfirm" @click="confirmEntry">确认入场</el-button>
              <el-button type="danger" plain @click="returnEntry">入场退回</el-button>
              <el-button type="warning" plain @click="registerException">登记异常</el-button>
              <el-button @click="saveRecord">保存记录</el-button>
            </div>
            <el-alert v-if="!canConfirm" type="warning" show-icon :closable="false" title="动物证有效、未重复入场、无承运限制、现场核对通过，且实到数量和待宰圈编号完整后，才能确认入场。" />
          </el-card>
        </div>
      </div>

      <el-card class="panel-card">
        <template #header><strong>入场取证附件</strong></template>
        <div class="attachment-toolbar">
          <el-select v-model="attachmentType" class="filter-short">
            <el-option v-for="(label, value) in attachmentTypeName" :key="value" :label="label" :value="value" />
          </el-select>
          <el-upload :auto-upload="false" :show-file-list="false" :on-change="handleFileChange">
            <el-button type="primary">选择文件</el-button>
          </el-upload>
        </div>
        <el-table :data="[...savedAttachments, ...localAttachments]" stripe>
          <el-table-column prop="typeName" label="附件类型" min-width="130" />
          <el-table-column prop="fileName" label="文件名称" min-width="180" />
          <el-table-column label="文件大小" width="110"><template #default="scope">{{ fileSize(scope.row.fileSize) }}</template></el-table-column>
          <el-table-column label="上传时间" min-width="160"><template #default="scope">{{ scope.row.uploadedAt ? formatTime(scope.row.uploadedAt) : '待保存' }}</template></el-table-column>
          <el-table-column prop="uploadedBy" label="上传人" min-width="130" />
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <el-button link type="primary" @click="previewAttachment(scope.row.fileName)">预览</el-button>
              <el-button link type="primary" @click="downloadAttachment(scope.row.fileName)">下载</el-button>
              <el-button v-if="!scope.row.uploadedAt" link type="danger" @click="removeAttachment(scope.$index - savedAttachments.length)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
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
.card-actions,
.attachment-toolbar {
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
.entry-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
}
.full-line {
  grid-column: 1 / -1;
}
.full-width {
  width: 100%;
}
.manual-checks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  padding: 12px;
  border-radius: 10px;
  background: #f6faf7;
}
.sticky-card {
  position: sticky;
  top: 16px;
}
.process-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.process-actions .el-button {
  margin-left: 0;
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
