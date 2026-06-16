<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { DetectionResult } from '../../domain/models'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const batchId = computed(() => String(route.params.batchId || ''))
const batch = computed(() => store.data.slaughterBatches.find((b) => b.id === batchId.value))
const entry = computed(() => batch.value ? store.data.slaughterEntryRecords.find((e) => e.id === batch.value!.entryRecordId) : undefined)
const certificate = computed(() => batch.value ? store.data.quarantineCertificates.find((c) => c.id === batch.value!.quarantineCertificateId) : undefined)
const transportTask = computed(() => certificate.value ? store.data.transportTasks.find((t) => t.certificateId === certificate.value!.id) : undefined)
const existingApplication = computed(() => batch.value ? store.data.slaughterApplications.find((a) => a.batchId === batch.value!.id) : undefined)
const entryAttachments = computed(() => entry.value ? store.data.inspectionAttachments.filter((a) => a.applicationNo === entry.value!.entryNo) : [])

/* ---- 申报条件校验 ---- */
const entryCheckPassed = computed(() => entry.value?.status === 'entry_passed')
const batchStatusReady = computed(() => batch.value?.status === 'pending_slaughter_apply')
const certValid = computed(() => {
  if (!certificate.value) return false
  const now = Date.now()
  const validTo = new Date(certificate.value.validTo).getTime()
  return validTo > now
})
const duplicateApplication = computed(() => !!existingApplication.value)
const hasAbnormal = computed(() => batch.value?.status === 'abnormal' || !!batch.value?.abnormalReason)
const abnormalReason = computed(() => batch.value?.abnormalReason || '')

const canSubmit = computed(() => {
  if (!entryCheckPassed.value) return false
  if (!batchStatusReady.value) return false
  if (!certValid.value) return false
  if (duplicateApplication.value) return false
  if (hasAbnormal.value) return false
  if (form.asfResult !== 'negative' && form.asfResult !== 'positive') return false
  if (form.drugResult !== 'negative' && form.drugResult !== 'positive') return false
  if (!form.asfReportUploaded) return false
  if (!form.drugReportUploaded) return false
  if (form.asfResult === 'positive') return false
  if (form.drugResult === 'positive') return false
  if (!form.plannedSlaughterTime) return false
  if (!form.contactPerson.trim()) return false
  if (!form.contactPhone.trim()) return false
  return true
})

/* ---- 自检与申报表单 ---- */
const form = reactive({
  asfResult: '' as '' | DetectionResult,
  asfTestTime: '',
  asfTestPerson: '',
  asfReportUploaded: false,
  drugResult: '' as '' | DetectionResult,
  drugTestTime: '',
  drugTestPerson: '',
  drugReportUploaded: false,
  applyType: 'normal' as 'normal' | 'emergency',
  quantity: 0,
  plannedSlaughterTime: '',
  slaughterLine: '',
  waitingPenNo: '',
  contactPerson: '',
  contactPhone: '',
  remark: '',
  emergencyReason: '',
  emergencyDescription: '',
})

const submitting = ref(false)

function initForm() {
  if (batch.value) {
    form.quantity = batch.value.waitingQuantity
    form.waitingPenNo = batch.value.waitingPenNo
  }
}
initForm()

/* ---- 附件 ---- */
interface LocalAttachment {
  id: string
  type: string
  typeName: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedBy: string
  uploadedAt: string
}

const asfAttachments = ref<LocalAttachment[]>([])
const drugAttachments = ref<LocalAttachment[]>([])
const otherAttachments = ref<LocalAttachment[]>([])

const asfFileName = ref('')
const drugFileName = ref('')

let attachCounter = 0

function handleFileSelect(e: Event, type: 'asf' | 'drug') {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (type === 'asf') {
    asfFileName.value = file.name
    form.asfReportUploaded = true
  } else {
    drugFileName.value = file.name
    form.drugReportUploaded = true
  }
}

function handleUpload(list: LocalAttachment[], type: string, typeName: string) {
  const fakeFile: LocalAttachment = {
    id: `local-att-${++attachCounter}`,
    type,
    typeName,
    fileName: `${typeName}_${new Date().toISOString().slice(0, 10)}.pdf`,
    fileSize: Math.floor(Math.random() * 500 + 100) * 1024,
    fileType: 'application/pdf',
    uploadedBy: '皖北标准化屠宰中心',
    uploadedAt: new Date().toISOString(),
  }
  list.push(fakeFile)
  ElMessage.success(`${typeName}已上传`)
}

function removeAttachment(list: LocalAttachment[], item: LocalAttachment) {
  const idx = list.findIndex((a) => a.id === item.id)
  if (idx >= 0) list.splice(idx, 1)
  if (item.type === 'asf_report' && list.length === 0) form.asfReportUploaded = false
  if (item.type === 'drug_report' && list.length === 0) form.drugReportUploaded = false
}

/* ---- 提交 ---- */
async function saveDraft() {
  ElMessage.success('草稿已保存')
}

async function submitApplication() {
  if (!batch.value) return
  if (form.asfResult === 'positive') {
    ElMessage.error('非洲猪瘟检测阳性，无法提交申报，已生成异常预警')
    return
  }
  if (form.drugResult === 'positive') {
    ElMessage.error('违禁药物检测阳性，无法提交申报，已生成异常预警')
    return
  }
  if (!canSubmit.value) {
    ElMessage.warning('申报条件不满足或自检资料不完整，请检查后重试')
    return
  }
  await ElMessageBox.confirm(
    `确认提交批次 ${batch.value.batchNo} 的屠宰检疫申报？提交后将由官方兽医受理审核。`,
    '提交确认',
    { confirmButtonText: '确认提交', cancelButtonText: '取消', type: 'warning' },
  )
  submitting.value = true
  try {
    await store.submitSlaughterQuarantineApplication({
      batchId: batch.value.id,
      entryRecordId: batch.value.entryRecordId,
      quarantineCertificateId: batch.value.quarantineCertificateId,
      quantity: form.quantity,
      purpose: form.applyType === 'emergency' ? '急宰' : '屠宰',
      plannedSlaughterTime: form.plannedSlaughterTime,
      contactPerson: form.contactPerson,
      contactPhone: form.contactPhone,
      remark: form.remark,
    })
    ElMessage.success('屠宰检疫申报已提交至官方兽医')
    router.push('/slaughter/waiting-slaughter')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/slaughter/waiting-slaughter')
}

/* ---- 辅助 ---- */
const statusText: Record<string, string> = {
  pending_slaughter_apply: '待提交屠宰检疫申报',
  submitted_pending_accept: '已提交待受理',
  abnormal: '待宰异常',
}
function fileSize(size: number) { return `${(size / 1024).toFixed(1)} KB` }
</script>

<template>
  <section class="gov-page">
    <el-card class="panel-card">
      <div class="page-hero inline-hero">
        <div>
          <h2>提交屠宰检疫申报</h2>
          <p>将待宰批次、自检资料和计划屠宰信息提交给官方兽医，申请屠宰检疫受理和宰前检查。</p>
        </div>
        <el-button @click="goBack">返回待宰管理</el-button>
      </div>
    </el-card>

    <el-empty v-if="!batch" description="未找到待宰批次" />

    <template v-else>
      <!-- 一、关联待宰批次 -->
      <el-card class="panel-card">
        <template #header><strong>关联待宰批次</strong></template>
        <div class="info-grid">
          <div class="info-item"><span>待宰批次编号</span><b>{{ batch.batchNo }}</b></div>
          <div class="info-item"><span>入场登记编号</span><b>{{ entry?.entryNo ?? '-' }}</b></div>
          <div class="info-item"><span>动物检疫合格证明编号</span><b>{{ certificate?.certificateNo ?? '-' }}</b></div>
          <div class="info-item"><span>来源养殖场</span><b>{{ entry?.originFarm ?? '-' }}</b></div>
          <div class="info-item"><span>动物种类</span><b>{{ batch.animalType }}</b></div>
          <div class="info-item"><span>实到数量</span><b>{{ batch.entryQuantity }} 头</b></div>
          <div class="info-item"><span>耳标号段</span><b>{{ batch.earTagRange || '-' }}</b></div>
          <div class="info-item"><span>待宰圈编号</span><b>{{ batch.waitingPenNo }}</b></div>
          <div class="info-item"><span>入场时间</span><b>{{ formatTime(batch.entryTime || batch.createdAt) }}</b></div>
          <div class="info-item"><span>入场经办人</span><b>{{ entry?.operator || entry?.checkedBy || '-' }}</b></div>
          <div class="info-item"><span>当前状态</span><b><el-tag :type="batchStatusReady ? 'warning' : 'danger'" size="small">{{ statusText[batch.status] || batch.status }}</el-tag></b></div>
        </div>
        <div class="card-actions">
          <el-button size="small" @click="ElMessage.info('查看入场查验记录入口已保留')">查看入场查验记录</el-button>
        </div>
      </el-card>

      <!-- 二、动物证与入场信息 -->
      <el-card class="panel-card">
        <template #header><strong>动物证与入场信息</strong></template>
        <div v-if="certificate" class="info-grid">
          <div class="info-item"><span>动物检疫合格证明编号</span><b>{{ certificate.certificateNo }}</b></div>
          <div class="info-item"><span>启运地</span><b>{{ certificate.origin }}</b></div>
          <div class="info-item"><span>目的地</span><b>{{ certificate.destination }}</b></div>
          <div class="info-item"><span>承运车辆</span><b>{{ certificate.vehiclePlateNo }}</b></div>
          <div class="info-item"><span>承运人</span><b>{{ certificate.carrier || '-' }}</b></div>
          <div class="info-item"><span>出证官方兽医</span><b>{{ certificate.issuedBy }}</b></div>
          <div class="info-item"><span>出证时间</span><b>{{ formatTime(certificate.validFrom) }}</b></div>
          <div class="info-item"><span>有效期至</span><b>{{ formatTime(certificate.validTo) }}</b></div>
          <div class="info-item"><span>运输任务编号</span><b>{{ transportTask?.id ?? '-' }}</b></div>
          <div class="info-item"><span>运输状态</span><b>{{ transportTask ? (transportTask.status === 'transporting' ? '运输中' : transportTask.status === 'arrived' ? '已到达' : '待发车') : '-' }}</b></div>
        </div>
        <el-empty v-else description="暂无动物证信息" :image-size="40" />
        <div v-if="certificate" class="card-actions">
          <el-button size="small" @click="ElMessage.info('查看动物证入口已保留')">查看动物证</el-button>
          <el-button size="small" @click="ElMessage.info('查看运输任务入口已保留')">查看运输任务</el-button>
          <el-button size="small" @click="ElMessage.info('查看耳标明细入口已保留')">查看耳标明细</el-button>
        </div>
      </el-card>

      <!-- 三、申报条件与自检资料 -->
      <el-card class="panel-card">
        <template #header><strong>申报条件</strong></template>
        <div class="condition-list">
          <div class="condition-item">
            <span>入场查验状态</span>
            <el-tag :type="entryCheckPassed ? 'success' : 'danger'" size="small">{{ entryCheckPassed ? '已通过' : '未通过' }}</el-tag>
          </div>
          <div class="condition-item">
            <span>待宰批次状态</span>
            <el-tag :type="batchStatusReady ? 'success' : 'danger'" size="small">{{ batchStatusReady ? '待提交申报' : '状态不符' }}</el-tag>
          </div>
          <div class="condition-item">
            <span>动物证状态</span>
            <el-tag :type="certValid ? 'success' : 'danger'" size="small">{{ certificate ? (certValid ? '有效' : '过期') : '未关联' }}</el-tag>
          </div>
          <div class="condition-item">
            <span>是否重复申报</span>
            <el-tag :type="duplicateApplication ? 'danger' : 'success'" size="small">{{ duplicateApplication ? '是' : '否' }}</el-tag>
          </div>
          <div class="condition-item">
            <span>是否存在待宰异常</span>
            <el-tag :type="hasAbnormal ? 'danger' : 'success'" size="small">{{ hasAbnormal ? '有' : '无' }}</el-tag>
          </div>
          <div v-if="hasAbnormal" class="condition-warning">
            <el-alert type="error" :closable="false" :title="`存在异常：${abnormalReason}，禁止提交申报`" />
          </div>
        </div>
      </el-card>

      <!-- 自检资料和屠宰申报信息 - 左右分栏 -->
      <div class="two-column-row">
        <div class="two-column-col">
          <el-card class="panel-card">
            <template #header><strong>自检资料</strong></template>
            <el-form label-position="left" label-width="180px">
              <el-divider content-position="left">非洲猪瘟检测</el-divider>
              <el-form-item label="非洲猪瘟检测结果" required>
                <el-radio-group v-model="form.asfResult">
                  <el-radio value="negative">阴性（合格）</el-radio>
                  <el-radio value="positive">阳性（不合格）</el-radio>
                </el-radio-group>
                <el-tag v-if="form.asfResult === 'positive'" type="danger" class="result-warning">阳性结果将禁止提交并生成异常预警</el-tag>
              </el-form-item>
              <el-form-item label="非洲猪瘟检测时间" required>
                <el-date-picker v-model="form.asfTestTime" type="datetime" placeholder="请选择检测时间" value-format="YYYY-MM-DDTHH:mm:ss" class="full-width" />
              </el-form-item>
              <el-form-item label="非洲猪瘟检测人员" required>
                <el-input v-model="form.asfTestPerson" placeholder="请填写检测人员姓名" />
              </el-form-item>
              <el-form-item label="非洲猪瘟检测报告" required>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" @change="(e) => handleFileSelect(e, 'asf')" />
                <span v-if="asfFileName" class="upload-status success">{{ asfFileName }}</span>
                <span v-else class="upload-status warning">未选择文件</span>
              </el-form-item>

              <el-divider content-position="left">违禁药物自检</el-divider>
              <el-form-item label="违禁药物自检结果" required>
                <el-radio-group v-model="form.drugResult">
                  <el-radio value="negative">阴性（合格）</el-radio>
                  <el-radio value="positive">阳性（不合格）</el-radio>
                </el-radio-group>
                <el-tag v-if="form.drugResult === 'positive'" type="danger" class="result-warning">阳性结果将禁止提交并生成异常预警</el-tag>
              </el-form-item>
              <el-form-item label="违禁药物自检时间" required>
                <el-date-picker v-model="form.drugTestTime" type="datetime" placeholder="请选择检测时间" value-format="YYYY-MM-DDTHH:mm:ss" class="full-width" />
              </el-form-item>
              <el-form-item label="违禁药物自检人员" required>
                <el-input v-model="form.drugTestPerson" placeholder="请填写检测人员姓名" />
              </el-form-item>
              <el-form-item label="违禁药物自检报告" required>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" @change="(e) => handleFileSelect(e, 'drug')" />
                <span v-if="drugFileName" class="upload-status success">{{ drugFileName }}</span>
                <span v-else class="upload-status warning">未选择文件</span>
              </el-form-item>
            </el-form>
          </el-card>
        </div>

        <div class="two-column-col">
          <!-- 四、屠宰检疫申报信息 -->
          <el-card class="panel-card">
            <template #header><strong>屠宰检疫申报信息</strong></template>
            <el-form label-position="left" label-width="160px">
              <el-form-item label="申报类型">
                <el-radio-group v-model="form.applyType">
                  <el-radio value="normal">正常屠宰检疫</el-radio>
                  <el-radio value="emergency">急宰申报</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="申报数量" required>
                <el-input-number v-model="form.quantity" :min="1" :max="batch.waitingQuantity" />
                <span class="form-hint">待宰数量上限 {{ batch.waitingQuantity }} 头</span>
              </el-form-item>
              <el-form-item label="计划屠宰时间" required>
                <el-date-picker v-model="form.plannedSlaughterTime" type="datetime" placeholder="请选择计划屠宰时间" value-format="YYYY-MM-DDTHH:mm:ss" class="full-width" />
              </el-form-item>
              <el-form-item label="屠宰线">
                <el-select v-model="form.slaughterLine" placeholder="请选择屠宰线" clearable class="full-width">
                  <el-option label="A线" value="A" />
                  <el-option label="B线" value="B" />
                  <el-option label="C线" value="C" />
                </el-select>
              </el-form-item>
              <el-form-item label="待宰圈编号">
                <el-input v-model="form.waitingPenNo" />
              </el-form-item>
              <el-form-item label="联系人" required>
                <el-input v-model="form.contactPerson" placeholder="请填写联系人姓名" />
              </el-form-item>
              <el-form-item label="联系电话" required>
                <el-input v-model="form.contactPhone" placeholder="请填写联系电话" />
              </el-form-item>
              <el-form-item label="申报说明">
                <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="如有需要请填写申报说明" />
              </el-form-item>

              <template v-if="form.applyType === 'emergency'">
                <el-divider content-position="left">急宰申报补充信息</el-divider>
                <el-form-item label="急宰原因" required>
                  <el-input v-model="form.emergencyReason" type="textarea" :rows="2" placeholder="请填写急宰原因" />
                </el-form-item>
                <el-form-item label="现场情况说明" required>
                  <el-input v-model="form.emergencyDescription" type="textarea" :rows="3" placeholder="请描述现场情况" />
                </el-form-item>
                <el-form-item label="急宰附件">
                  <el-button size="small" type="primary" @click="handleUpload(otherAttachments, 'emergency_attach', '急宰附件')">上传附件</el-button>
                </el-form-item>
              </template>
            </el-form>
          </el-card>
        </div>
      </div>

      <!-- 五、附件材料 - 隐藏 -->
      <!-- <el-card class="panel-card">
        <template #header><strong>附件材料</strong></template>
        <el-table :data="[...asfAttachments, ...drugAttachments, ...entryAttachments.map((a) => ({ ...a, type: 'entry_attach', typeName: '入场查验附件' })), ...otherAttachments]" stripe>
          <el-table-column prop="typeName" label="附件类型" min-width="150" />
          <el-table-column prop="fileName" label="文件名称" min-width="200" />
          <el-table-column label="文件大小" width="110">
            <template #default="scope">{{ fileSize(scope.row.fileSize) }}</template>
          </el-table-column>
          <el-table-column label="上传时间" min-width="160">
            <template #default="scope">{{ formatTime(scope.row.uploadedAt) }}</template>
          </el-table-column>
          <el-table-column prop="uploadedBy" label="上传人" min-width="130" />
          <el-table-column label="操作" width="130">
            <template #default="scope">
              <el-button link type="primary" @click="ElMessage.info('预览入口已保留')">预览</el-button>
              <el-button v-if="scope.row.id.startsWith('local-')" link type="danger" @click="removeAttachment(asfAttachments.includes(scope.row) ? asfAttachments : drugAttachments.includes(scope.row) ? drugAttachments : otherAttachments, scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="![...asfAttachments, ...drugAttachments, ...entryAttachments, ...otherAttachments].length" description="暂无附件材料" />
      </el-card> -->

      <!-- 六、提交操作 -->
      <el-card class="panel-card sticky-actions">
        <div class="action-bar">
          <el-button @click="saveDraft">保存草稿</el-button>
          <el-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="submitApplication">提交屠宰检疫申报</el-button>
          <el-button @click="goBack">返回待宰管理</el-button>
        </div>
        <div v-if="!canSubmit && batchStatusReady" class="action-hint">
          <span v-if="!entryCheckPassed">入场查验未通过，</span>
          <span v-if="!certValid">动物证已过期或未关联，</span>
          <span v-if="duplicateApplication">已存在重复申报，</span>
          <span v-if="hasAbnormal">存在待宰异常，</span>
          <span v-if="!form.asfResult">未填写非洲猪瘟检测结果，</span>
          <span v-if="!form.drugResult">未填写违禁药物自检结果，</span>
          <span v-if="form.asfResult && !form.asfReportUploaded">未上传非洲猪瘟检测报告，</span>
          <span v-if="form.drugResult && !form.drugReportUploaded">未上传违禁药物自检报告，</span>
          <span v-if="form.asfResult === 'positive'">非洲猪瘟检测阳性，</span>
          <span v-if="form.drugResult === 'positive'">违禁药物检测阳性，</span>
          <span v-if="!form.plannedSlaughterTime">未选择计划屠宰时间，</span>
          <span v-if="!form.contactPerson.trim()">未填写联系人，</span>
          <span v-if="!form.contactPhone.trim()">未填写联系电话，</span>
          请补充完整后提交。
        </div>
      </el-card>
    </template>
  </section>
</template>

<style scoped>
.inline-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
}
.info-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.info-item span {
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}
.info-item b {
  color: var(--text-primary);
  text-align: right;
  word-break: break-all;
}
.card-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.condition-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
}
.condition-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.condition-item span {
  color: var(--text-secondary);
}
.condition-warning {
  grid-column: 1 / -1;
}
.result-warning {
  margin-left: 12px;
}
.upload-status {
  margin-left: 8px;
  font-size: 12px;
}
.upload-status.success {
  color: var(--el-color-success);
}
.upload-status.warning {
  color: var(--el-color-warning);
}
.form-hint {
  margin-left: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}
.full-width {
  width: 100%;
}
.sticky-actions {
  position: sticky;
  bottom: 0;
  z-index: 10;
}
.action-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}
.action-hint {
  margin-top: 8px;
  color: var(--el-color-warning);
  font-size: 13px;
}
.two-column-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.two-column-col {
  flex: 1 1 50%;
  min-width: 0;
}
@media (max-width: 900px) {
  .info-grid,
  .condition-list {
    grid-template-columns: 1fr;
  }
  .two-column-row {
    flex-direction: column;
  }
}
</style>
