<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { Document, CircleCheck, CircleClose, Warning } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { InspectionAttachment, InspectionAttachmentType } from '../../domain/models'
import certImage from '../../../image/动物检疫证书.png'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const application = computed(() => store.data.originApplications.find((item) => item.id === route.params.id))
const batch = computed(() => application.value ? store.data.farmBatches.find((item) => item.id === application.value!.batchId) : undefined)
const vehicle = computed(() => application.value ? store.data.vehicles.find((item) => item.id === application.value!.vehicleId) : undefined)
const certificate = computed(() => application.value ? store.data.quarantineCertificates.find((item) => item.applicationId === application.value!.id) : undefined)

const purposeMap: Record<string, string> = { slaughter: '屠宰', breeding: '继续饲养', trade: '交易', exhibition: '展示' }
const purposeText = computed(() => purposeMap[application.value?.purpose || ''] || '-')

/* ---- 状态判断 ---- */
const isSubmitted = computed(() => application.value?.status === 'submitted')
const isRejected = computed(() => application.value?.status === 'rejected')
const isIssued = computed(() => application.value ? ['certificate_issued', 'transporting', 'arrived'].includes(application.value.status) : false)

/* ---- 身份核验 ---- */
const identityVerified = ref(false)
const identitySerial = ref('AH-VET-VERIFY-202606130915')
const identityTime = ref('2026-06-13T09:15:00.000Z')
const faceDialogVisible = ref(false)
const faceVideoRef = ref<HTMLVideoElement | null>(null)
let faceStream: MediaStream | null = null

async function startFaceRecognition() {
  faceDialogVisible.value = true
  try {
    faceStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    if (faceVideoRef.value) {
      faceVideoRef.value.srcObject = faceStream
    }
    setTimeout(() => {
      stopFaceRecognition()
      identityVerified.value = true
      identityTime.value = new Date().toISOString()
      identitySerial.value = `AH-VET-FACE-${Date.now()}`
      ElMessage.success('人脸识别通过，身份核验已更新')
    }, 2000)
  } catch {
    faceDialogVisible.value = false
    ElMessage.error('无法访问摄像头，请检查权限设置')
  }
}

function stopFaceRecognition() {
  if (faceStream) {
    faceStream.getTracks().forEach((t) => t.stop())
    faceStream = null
  }
  faceDialogVisible.value = false
}

/* ---- 现场查验 ---- */
const siteChecks = ref({
  clinicalNormal: false, earTagMatch: false, quantityMatch: false, vehicleQualified: false,
  carrierMatch: false, loadingQualified: false, noAbnormalDeath: false, noQuarantineRestriction: false,
})
const siteCheckPassed = computed(() => Object.values(siteChecks.value).every(Boolean))
const inspectionRemark = ref('')

/* ---- 取证附件 ---- */
const persistedAttachments = computed(() => application.value ? store.data.inspectionAttachments.filter((a) => a.applicationNo === application.value!.applicationNo) : [])
const uploadedMockAttachments = ref<InspectionAttachment[]>([])
const attachments = computed(() => [...persistedAttachments.value, ...uploadedMockAttachments.value])
const attachmentCount = computed(() => attachments.value.length)
const previewVisible = ref(false)
const previewAttachment = ref<InspectionAttachment | null>(null)
const uploadDialogVisible = ref(false)
const uploadType = ref<InspectionAttachmentType>('vehicle_photo')
const attachmentTypeOptions: { type: InspectionAttachmentType; typeName: string }[] = [
  { type: 'vehicle_photo', typeName: '车辆照片' },
  { type: 'certificate_photo', typeName: '证明照片' },
  { type: 'ear_tag_photo', typeName: '耳标照片' },
  { type: 'loading_photo', typeName: '装载照片' },
  { type: 'scene_photo', typeName: '现场照片' },
  { type: 'other', typeName: '其他' },
]
const selectedAttachmentType = computed(() => attachmentTypeOptions.find((item) => item.type === uploadType.value) || attachmentTypeOptions[0])

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
function showPreview(att: InspectionAttachment) { previewAttachment.value = att; previewVisible.value = true }
function downloadAttachment(att: InspectionAttachment) {
  if (att.dataUrl) { const l = document.createElement('a'); l.href = att.dataUrl; l.download = att.fileName; l.click() }
  else { const b = new Blob([`${att.typeName} - ${att.fileName}`], { type: 'text/plain' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = att.fileName; l.click(); URL.revokeObjectURL(u) }
}
function handleAttachmentFileChange(file: UploadFile) {
  if (!application.value || !file.raw) return
  const typeOption = selectedAttachmentType.value
  const reader = new FileReader()
  reader.onload = () => {
    uploadedMockAttachments.value.push({
      id: `mock-${Date.now()}`,
      applicationNo: application.value!.applicationNo,
      type: typeOption.type,
      typeName: typeOption.typeName,
      fileName: file.name,
      fileSize: file.size || file.raw!.size,
      fileType: file.raw!.type || 'application/octet-stream',
      dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
      uploadedBy: store.session?.name || '官方兽医',
      uploadedAt: new Date().toISOString(),
    })
    uploadDialogVisible.value = false
    ElMessage.success('上传成功，附件已加入取证材料')
  }
  reader.readAsDataURL(file.raw)
}

/* ---- 自动校验 ---- */
const autoCheckPassed = computed(() => application.value?.validationResults.every((item) => item.passed) ?? false)
const allPassed = computed(() => identityVerified.value && siteCheckPassed.value && attachmentCount.value >= 1 && autoCheckPassed.value)

/* ---- 弹窗 ---- */
const earTagDialog = ref(false)
const immuneDialog = ref(false)
const archiveDialog = ref(false)
const rejectDialog = ref(false)
const autoCheckDialog = ref(false)
const rejectReason = ref('')
const activeArchiveTab = ref('farm')

/* ---- 出证确认弹窗 ---- */
const certDialog = ref(false)
function openCertDialog() {
  if (!allPassed.value) return ElMessage.error('身份核验、现场查验、取证附件和自动校验须全部通过')
  certDialog.value = true
}

/* ---- 已出证查看证书弹窗 ---- */
const viewCertDialog = ref(false)
function openViewCertDialog() {
  viewCertDialog.value = true
}

/* ---- 耳标明细 ---- */
const earTagList = computed(() => {
  if (!batch.value || !application.value) return []
  const start = batch.value.earTagStart
  const count = Math.min(application.value.quantity, batch.value.earTagEnd - start + 1)
  return Array.from({ length: count }, (_, i) => ({ no: `${batch.value!.earTagPrefix}-${start + i}`, status: '正常', immune: '已免疫', abnormal: false }))
})

/* ---- 免疫记录 ---- */
const immuneRecords = computed(() => [
  { name: '口蹄疫', status: '已免疫', date: '2026-05-10' },
  { name: '猪瘟', status: '已免疫', date: '2026-05-10' },
  { name: '蓝耳病', status: '已免疫', date: '2026-05-12' },
])

const previewCertNo = computed(() => certificate.value?.certificateNo || application.value?.applicationNo?.replace('CDJY', 'DWJY') || '-')

/* ---- 操作 ---- */
async function confirmApprove() {
  if (!application.value) return
  await store.approveOriginApplication(application.value.id, { faceRecognitionPassed: identityVerified.value, siteInspectionPassed: siteCheckPassed.value, evidencePhotoCount: attachmentCount.value, remark: inspectionRemark.value || '人证一致，临床检查健康，运输工具消毒合格' })
  certDialog.value = false
  ElMessage.success('动物检疫合格证明已生成，运输任务已同步监管端')
  router.push('/vet/origin-todos')
}
async function reject() {
  if (!application.value) return
  if (!rejectReason.value.trim()) return ElMessage.warning('请填写驳回原因')
  await store.rejectOriginApplication(application.value.id, rejectReason.value.trim())
  ElMessage.success('申报已驳回')
  rejectDialog.value = false
  router.push('/vet/origin-todos')
}
</script>

<template>
  <section v-if="application" class="insp-page">
    <!-- ==================== 已驳回 ==================== -->
    <template v-if="isRejected">
      <div class="page-header">
        <div class="page-header-left">
          <h1>申报详情</h1>
          <span class="page-header-sub">{{ application.applicationNo }}</span>
        </div>
        <el-button @click="router.push('/vet/origin-todos')">返回列表</el-button>
      </div>
      <div class="page-body two-col-layout">
        <div class="col-stack">
          <div class="sec-card">
            <div class="sec-title">申报信息</div>
            <div class="field-list">
              <div class="field-row"><span>申报编号</span><b>{{ application.applicationNo }}</b></div>
              <div class="field-row"><span>动物种类</span><b>{{ application.animalType }}</b></div>
              <div class="field-row"><span>申报数量</span><b>{{ application.quantity }}头</b></div>
              <div class="field-row"><span>检疫用途</span><b>{{ purposeText }}</b></div>
              <div class="field-row"><span>目的地</span><b>{{ application.destination }}</b></div>
              <div class="field-row"><span>承运人</span><b>{{ application.carrier }}</b></div>
              <div class="field-row"><span>提交时间</span><b>{{ formatTime(application.submittedAt) }}</b></div>
            </div>
          </div>
          <div class="sec-card">
            <div class="sec-title">自动校验结果</div>
            <div class="check-list">
              <div v-for="c in application.validationResults" :key="c.label" class="check-row">
                <el-tag :type="c.passed ? 'success' : 'danger'" size="small" class="check-tag">{{ c.passed ? '通过' : '异常' }}</el-tag>
                <div class="check-body"><b>{{ c.label }}</b><span>{{ c.message }}</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-stack">
          <div class="sec-card sec-card--danger">
            <div class="sec-title sec-title--danger">驳回信息</div>
            <div class="reject-block">
              <el-icon :size="36" color="var(--color-danger)"><CircleClose /></el-icon>
              <h3>申报已驳回</h3>
              <div class="field-list">
                <div class="field-row"><span>驳回原因</span><b style="color:var(--color-danger)">{{ application.rejectReason || '未填写' }}</b></div>
                <div class="field-row"><span>驳回时间</span><b>{{ formatTime(application.updatedAt) }}</b></div>
                <div class="field-row"><span>驳回人</span><b>官方兽医 王敏</b></div>
              </div>
            </div>
          </div>
          <div class="sec-card">
            <div class="sec-title">养殖场信息</div>
            <div class="field-list">
              <div class="field-row"><span>养殖场名称</span><b>{{ batch?.farmName || '-' }}</b></div>
              <div class="field-row"><span>养殖品种</span><b>{{ batch?.animalType }} / {{ batch?.breed }}</b></div>
              <div class="field-row"><span>所在地</span><b>{{ batch?.location }}</b></div>
              <div class="field-row"><span>当前存栏</span><b>{{ batch?.stock ?? '-' }}头</b></div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== 已出证 ==================== -->
    <template v-else-if="isIssued">
      <div class="page-header">
        <div class="page-header-left">
          <h1>申报详情</h1>
          <span class="page-header-sub">{{ application.applicationNo }}</span>
        </div>
        <div class="page-header-right">
          <el-button type="primary" @click="openViewCertDialog">查看检疫证明</el-button>
          <el-button @click="router.push('/vet/origin-todos')">返回列表</el-button>
        </div>
      </div>
      <div class="page-body two-col-layout">
        <div class="col-stack">
          <div class="sec-card">
            <div class="sec-title">申报信息</div>
            <div class="field-list">
              <div class="field-row"><span>申报编号</span><b>{{ application.applicationNo }}</b></div>
              <div class="field-row"><span>动物种类</span><b>{{ application.animalType }}</b></div>
              <div class="field-row"><span>申报数量</span><b>{{ application.quantity }}头</b></div>
              <div class="field-row"><span>检疫用途</span><b>{{ purposeText }}</b></div>
              <div class="field-row"><span>启运时间</span><b>{{ application.departureTime }}</b></div>
              <div class="field-row"><span>目的地</span><b>{{ application.destination }}</b></div>
              <div class="field-row"><span>承运人</span><b>{{ application.carrier }}</b></div>
              <div class="field-row"><span>提交时间</span><b>{{ formatTime(application.submittedAt) }}</b></div>
            </div>
          </div>
          <div class="sec-card">
            <div class="sec-title">自动校验结果</div>
            <div class="check-list">
              <div v-for="c in application.validationResults" :key="c.label" class="check-row">
                <el-tag :type="c.passed ? 'success' : 'danger'" size="small" class="check-tag">{{ c.passed ? '通过' : '异常' }}</el-tag>
                <div class="check-body"><b>{{ c.label }}</b><span>{{ c.message }}</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-stack">
          <div class="sec-card sec-card--success">
            <div class="sec-title sec-title--success">出证信息</div>
            <div class="cert-block">
              <el-icon :size="36" color="var(--color-primary-light)"><CircleCheck /></el-icon>
              <h3>已出具检疫证明</h3>
              <div class="field-list">
                <div class="field-row"><span>证明编号</span><b>{{ certificate?.certificateNo || '-' }}</b></div>
                <div class="field-row"><span>出证时间</span><b>{{ formatTime(certificate?.validFrom) }}</b></div>
                <div class="field-row"><span>有效期至</span><b>{{ formatTime(certificate?.validTo) }}</b></div>
                <div class="field-row"><span>签发兽医</span><b>{{ certificate?.issuedBy || '-' }}</b></div>
                <div class="field-row"><span>动物种类</span><b>{{ certificate?.animalType || '-' }}</b></div>
                <div class="field-row"><span>数量</span><b>{{ certificate?.quantity || '-' }}头</b></div>
                <div class="field-row"><span>启运地</span><b>{{ certificate?.origin || '-' }}</b></div>
                <div class="field-row"><span>目的地</span><b>{{ certificate?.destination || '-' }}</b></div>
                <div class="field-row"><span>运输车辆</span><b>{{ certificate?.vehiclePlateNo || '-' }}</b></div>
              </div>
              <div style="padding:0 20px 16px">
                <el-button type="primary" style="width:100%" @click="openViewCertDialog">查看检疫证明原件</el-button>
              </div>
            </div>
          </div>
          <div class="sec-card">
            <div class="sec-title">
              <span>取证附件 <span class="sec-title-count">{{ attachmentCount }} 个</span></span>
              <el-button size="small" type="primary" plain @click="uploadDialogVisible = true">上传附件</el-button>
            </div>
            <div class="table-wrap">
              <el-table v-if="attachments.length" :data="attachments" stripe size="small">
                <el-table-column prop="typeName" label="类型" width="100" />
                <el-table-column prop="fileName" label="文件名称" min-width="180" show-overflow-tooltip />
                <el-table-column label="大小" width="80"><template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template></el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button size="small" link type="primary" @click="showPreview(row)">预览</el-button>
                    <el-button size="small" link type="primary" @click="downloadAttachment(row)">下载</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="暂无取证附件" :image-size="60" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== 待审核：三栏布局 ==================== -->
    <template v-else-if="isSubmitted">
      <div class="page-header">
        <div class="page-header-left">
          <h1>产地检疫查验</h1>
          <span class="page-header-sub">{{ application.applicationNo }}</span>
        </div>
        <el-button @click="router.push('/vet/origin-todos')">返回列表</el-button>
      </div>

      <div class="page-body three-col-layout">
        <!-- 左栏：申报资料 -->
        <div class="col-left">
          <div class="sec-card">
            <div class="sec-title">申报详情</div>
            <div class="field-list">
              <div class="field-row"><span>申报编号</span><b>{{ application.applicationNo }}</b></div>
              <div class="field-row"><span>动物种类</span><b>{{ application.animalType }}</b></div>
              <div class="field-row"><span>申报数量</span><b>{{ application.quantity }}头</b></div>
              <div class="field-row"><span>检疫用途</span><b>{{ purposeText }}</b></div>
              <div class="field-row"><span>启运时间</span><b>{{ application.departureTime }}</b></div>
              <div class="field-row"><span>联系人</span><b>{{ application.contactPerson }}</b></div>
              <div class="field-row"><span>联系电话</span><b>{{ application.contactPhone }}</b></div>
              <div class="field-row"><span>目的地</span><b>{{ application.destination }}</b></div>
              <div class="field-row"><span>承运人</span><b>{{ application.carrier }}</b></div>
              <div class="field-row"><span>耳标关联</span><b>{{ application.quantity }}个 <el-button size="small" link type="primary" @click="earTagDialog = true">查看明细</el-button></b></div>
              <div class="field-row"><span>免疫记录</span><b>全部完成 <el-button size="small" link type="primary" @click="immuneDialog = true">查看详情</el-button></b></div>
            </div>
            <div style="padding:0 20px 16px">
              <el-button size="small" type="primary" plain style="width:100%" @click="archiveDialog = true">查看关联档案</el-button>
            </div>
          </div>
        </div>

        <!-- 中栏：审核工作区 -->
        <div class="col-center">
          <div class="sec-card">
            <div class="sec-title">
              <span>身份核验 <el-tag :type="identityVerified ? 'success' : 'warning'" size="small" class="sec-tag">{{ identityVerified ? '已通过' : '未核验' }}</el-tag></span>
              <el-button size="small" type="primary" plain @click="startFaceRecognition">人脸识别</el-button>
            </div>
            <div class="identity-row">
              <span>王敏 / AH-VET-0001 / 利辛县动物卫生监督所</span>
              <span>皖政通核验 / {{ formatTime(identityTime) }}</span>
              <span>流水号：{{ identitySerial }}</span>
            </div>
          </div>

          <div class="sec-card">
            <div class="sec-title">
              现场查验
              <el-tag v-if="siteCheckPassed" type="success" size="small" class="sec-tag">合格</el-tag>
              <el-tag v-else type="warning" size="small" class="sec-tag">未完成</el-tag>
            </div>
            <div class="site-check-grid">
              <el-checkbox v-model="siteChecks.clinicalNormal">动物临床检查正常</el-checkbox>
              <el-checkbox v-model="siteChecks.earTagMatch">耳标与申报一致</el-checkbox>
              <el-checkbox v-model="siteChecks.quantityMatch">数量与申报一致</el-checkbox>
              <el-checkbox v-model="siteChecks.vehicleQualified">运输车辆符合要求</el-checkbox>
              <el-checkbox v-model="siteChecks.carrierMatch">承运人信息一致</el-checkbox>
              <el-checkbox v-model="siteChecks.loadingQualified">装载情况符合要求</el-checkbox>
              <el-checkbox v-model="siteChecks.noAbnormalDeath">无异常死亡情况</el-checkbox>
              <el-checkbox v-model="siteChecks.noQuarantineRestriction">无检疫限制情况</el-checkbox>
            </div>
            <div style="padding:0 20px 16px">
              <el-input v-model="inspectionRemark" placeholder="查验意见（选填）" size="small" />
            </div>
          </div>

          <div class="sec-card">
            <div class="sec-title">
              <span>取证附件 <span class="sec-title-count">{{ attachmentCount }} 个</span></span>
              <el-button size="small" type="primary" plain @click="uploadDialogVisible = true">上传附件</el-button>
            </div>
            <div class="table-wrap">
              <el-table :data="attachments" stripe size="small">
                <el-table-column prop="typeName" label="类型" width="100" />
                <el-table-column prop="fileName" label="文件名称" min-width="180" show-overflow-tooltip />
                <el-table-column label="大小" width="80"><template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template></el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button size="small" link type="primary" @click="showPreview(row)">预览</el-button>
                    <el-button size="small" link type="primary" @click="downloadAttachment(row)">下载</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>

        <!-- 右栏：审核处理 + 证明预览 -->
        <div class="col-right">
          <div class="sec-card sec-card--sticky">
            <div class="sec-title">审核处理</div>
            <div class="action-block">
              <div class="action-status">
                <span>自动校验</span>
                <el-tag v-if="autoCheckPassed" type="success" size="small">全部通过</el-tag>
                <el-tag v-else type="danger" size="small">存在异常</el-tag>
                <el-button size="small" link type="primary" @click="autoCheckDialog = true">查看详情</el-button>
              </div>
              <div class="action-buttons">
                <el-button type="success" :disabled="!allPassed" @click="openCertDialog">审核通过并出证</el-button>
                <el-button type="danger" plain @click="rejectDialog = true">驳回申请</el-button>
              </div>
              <div v-if="!allPassed" class="action-hint">
                <el-icon><Warning /></el-icon>
                身份核验、现场查验、取证附件和自动校验须全部通过方可出证
              </div>
            </div>
          </div>

          <div class="sec-card">
            <div class="sec-title">证明预览</div>
            <div class="cert-preview">
              <div class="cert-preview-label">拟出具动物检疫合格证明</div>
              <div class="cert-preview-row"><span>证号</span><b>审核通过后生成</b></div>
              <div class="cert-preview-row"><span>二维码</span><b>审核通过后生成</b></div>
              <div class="cert-preview-row"><span>动物种类</span><b>{{ application.animalType }}</b></div>
              <div class="cert-preview-row"><span>数量</span><b>{{ application.quantity }}头</b></div>
              <div class="cert-preview-row"><span>启运地</span><b>{{ batch?.location || '-' }}</b></div>
              <div class="cert-preview-row"><span>目的地</span><b>{{ application.destination }}</b></div>
              <div class="cert-preview-row"><span>承运车辆</span><b>{{ vehicle?.plateNo || '-' }}</b></div>
              <div class="cert-preview-row"><span>承运人</span><b>{{ application.carrier }}</b></div>
              <div class="cert-preview-row"><span>签发兽医</span><b>官方兽医 王敏</b></div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== 其他状态 ==================== -->
    <template v-else>
      <div class="page-header">
        <div class="page-header-left"><h1>申报详情</h1><span class="page-header-sub">{{ application.applicationNo }}</span></div>
        <el-button @click="router.push('/vet/origin-todos')">返回列表</el-button>
      </div>
      <div class="sec-card">
        <div class="sec-title">申报信息</div>
        <div class="field-list">
          <div class="field-row"><span>申报编号</span><b>{{ application.applicationNo }}</b></div>
          <div class="field-row"><span>动物种类</span><b>{{ application.animalType }}</b></div>
          <div class="field-row"><span>申报数量</span><b>{{ application.quantity }}头</b></div>
          <div class="field-row"><span>目的地</span><b>{{ application.destination }}</b></div>
        </div>
      </div>
    </template>

    <!-- ========== 弹窗：出证确认 ========== -->
    <el-dialog v-model="certDialog" class="cert-issue-dialog" width="1280px" :show-close="false" :close-on-click-modal="false">
      <template #header>
        <div class="cert-dialog-header">
          <div class="cert-dialog-title">
            <strong>确认出证</strong>
            <span>请核对证照信息后确认签发</span>
          </div>
          <el-button text class="cert-dialog-close" @click="certDialog = false">×</el-button>
        </div>
      </template>

      <div class="cert-issue-layout">
        <div class="cert-preview-panel">
          <div class="cert-panel-title">电子证书预览</div>
          <div class="cert-paper-frame">
            <img :src="certImage" alt="动物检疫合格证明" />
          </div>
          <div class="cert-preview-actions">
            <el-button text @click="ElMessage.info('预览原图入口已保留')">预览原图</el-button>
            <el-divider direction="vertical" />
            <el-button text @click="ElMessage.info('放大查看入口已保留')">放大查看</el-button>
          </div>
        </div>

        <div class="cert-confirm-panel">
          <div class="cert-confirm-top">
            <div class="cert-pass-card">
              <el-tag type="warning" effect="light">审核通过待签发</el-tag>
              <div class="cert-pass-message">
                <el-icon><CircleCheck /></el-icon>
                <span>经系统校验与审核，所有信息及材料均符合要求，可签发电子证照。</span>
              </div>
            </div>
            <div class="cert-check-card">
              <strong>审核与校验结果</strong>
              <p><span>自动校验</span><b><el-icon><CircleCheck /></el-icon> 已通过</b></p>
              <p><span>身份核验</span><b><el-icon><CircleCheck /></el-icon> 已完成</b></p>
              <p><span>现场查验</span><b><el-icon><CircleCheck /></el-icon> 已完成</b></p>
              <p><span>附件材料</span><b><el-icon><CircleCheck /></el-icon> 齐全</b></p>
            </div>
          </div>

          <div class="cert-info-card">
            <strong>证照信息</strong>
            <div class="cert-info-list">
              <p><span>证号</span><b>{{ previewCertNo }}</b></p>
              <p><span>动物种类</span><b>{{ application.animalType }}</b></p>
              <p><span>数量</span><b>{{ application.quantity }}头</b></p>
              <p><span>启运地</span><b>{{ batch?.location || '-' }}</b></p>
              <p><span>目的地</span><b>{{ application.destination }}</b></p>
              <p><span>运输车辆</span><b>{{ vehicle?.plateNo || '-' }}</b></p>
              <p><span>承运人</span><b>{{ application.carrier }}</b></p>
              <p><span>签发兽医</span><b>官方兽医 王敏</b></p>
              <p><span>签发日期</span><b>{{ formatTime(new Date().toISOString()) }}</b></p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="cert-dialog-footer">
          <div class="cert-footer-tip">确认签发后将生成正式电子证书并写入出证记录</div>
          <div class="cert-footer-actions">
            <el-button @click="certDialog = false">取消</el-button>
            <el-button @click="certDialog = false">返回修改</el-button>
            <el-button type="success" @click="confirmApprove">确认出证</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ========== 弹窗：查看已出证证书 ========== -->
    <el-dialog v-model="viewCertDialog" title="动物检疫合格证明" width="580px">
      <div class="cert-image-box">
        <img :src="certImage" alt="动物检疫合格证明" />
      </div>
      <div class="cert-image-info">
        <p><span>证号</span><b>{{ certificate?.certificateNo || '-' }}</b></p>
        <p><span>动物种类</span><b>{{ certificate?.animalType || '-' }}</b></p>
        <p><span>数量</span><b>{{ certificate?.quantity || '-' }}头</b></p>
        <p><span>启运地</span><b>{{ certificate?.origin || '-' }}</b></p>
        <p><span>目的地</span><b>{{ certificate?.destination || '-' }}</b></p>
        <p><span>承运车辆</span><b>{{ certificate?.vehiclePlateNo || '-' }}</b></p>
        <p><span>签发兽医</span><b>{{ certificate?.issuedBy || '-' }}</b></p>
        <p><span>签发日期</span><b>{{ formatTime(certificate?.validFrom) }}</b></p>
        <p><span>有效期至</span><b>{{ formatTime(certificate?.validTo) }}</b></p>
      </div>
      <template #footer><el-button type="primary" @click="viewCertDialog = false">关闭</el-button></template>
    </el-dialog>

    <!-- ========== 其他弹窗 ========== -->
    <el-dialog v-model="autoCheckDialog" title="自动校验详情" width="640px">
      <div class="check-list">
        <div v-for="c in application.validationResults" :key="c.label" class="check-row">
          <el-tag :type="c.passed ? 'success' : 'danger'" size="small" class="check-tag">{{ c.passed ? '通过' : '异常' }}</el-tag>
          <div class="check-body"><b>{{ c.label }}</b><span>{{ c.message }}</span></div>
        </div>
      </div>
      <div style="margin-top:16px;text-align:center">
        <el-tag v-if="autoCheckPassed" type="success" size="large">结论：允许检疫</el-tag>
        <el-tag v-else type="danger" size="large">结论：禁止出证</el-tag>
      </div>
    </el-dialog>
    <el-dialog v-model="earTagDialog" title="耳标明细" width="640px">
      <el-table :data="earTagList" stripe max-height="400">
        <el-table-column prop="no" label="耳标号" min-width="180" />
        <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag :type="row.abnormal ? 'danger' : 'success'" size="small">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column prop="immune" label="免疫" width="120"><template #default="{ row }"><el-tag type="success" size="small">{{ row.immune }}</el-tag></template></el-table-column>
      </el-table>
    </el-dialog>
    <el-dialog v-model="immuneDialog" title="免疫记录" width="520px">
      <el-table :data="immuneRecords" stripe><el-table-column prop="name" label="疫苗名称" /><el-table-column prop="status" label="状态" width="120" /><el-table-column prop="date" label="日期" width="140" /></el-table>
    </el-dialog>
    <el-dialog v-model="archiveDialog" title="关联档案" width="700px">
      <el-tabs v-model="activeArchiveTab">
        <el-tab-pane label="养殖场档案" name="farm"><div class="field-list"><div class="field-row"><span>养殖场名称</span><b>{{ batch?.farmName || '-' }}</b></div><div class="field-row"><span>养殖品种</span><b>{{ batch?.animalType }} / {{ batch?.breed }}</b></div><div class="field-row"><span>所在地</span><b>{{ batch?.location }}</b></div></div></el-tab-pane>
        <el-tab-pane label="存栏信息" name="stock"><div class="field-list"><div class="field-row"><span>当前存栏</span><b>{{ batch?.stock ?? '-' }}头</b></div><div class="field-row"><span>免疫合格</span><b>{{ batch?.immuneQualified ? '是' : '否' }}</b></div><div class="field-row"><span>耳标号段</span><b>{{ batch?.earTagPrefix }} {{ batch?.earTagStart }}-{{ batch?.earTagEnd }}</b></div></div></el-tab-pane>
        <el-tab-pane label="免疫记录" name="immune"><el-table :data="immuneRecords" stripe><el-table-column prop="name" label="疫苗" /><el-table-column prop="status" label="状态" /><el-table-column prop="date" label="日期" /></el-table></el-tab-pane>
        <el-tab-pane label="耳标记录" name="earTag"><el-table :data="earTagList" stripe max-height="300"><el-table-column prop="no" label="耳标号" /><el-table-column prop="status" label="状态" /><el-table-column prop="immune" label="免疫" /></el-table></el-tab-pane>
      </el-tabs>
    </el-dialog>
    <el-dialog v-model="rejectDialog" title="驳回申请" width="520px">
      <el-form label-position="top"><el-form-item label="驳回原因"><el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请填写驳回原因" /></el-form-item></el-form>
      <template #footer><el-button @click="rejectDialog = false">取消</el-button><el-button type="danger" :disabled="!rejectReason.trim()" @click="reject">确认驳回</el-button></template>
    </el-dialog>
    <el-dialog v-model="uploadDialogVisible" title="上传取证附件" width="520px">
      <el-form label-position="top">
        <el-form-item label="附件类型">
          <el-select v-model="uploadType" class="full-width" placeholder="请选择附件类型">
            <el-option v-for="item in attachmentTypeOptions" :key="item.type" :label="item.typeName" :value="item.type" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传附件">
          <el-upload drag :auto-upload="false" :show-file-list="false" :on-change="handleAttachmentFileChange">
            <el-icon size="42"><Document /></el-icon>
            <div class="upload-text">点击或拖拽文件到此处，打开文件夹选择附件</div>
            <div class="upload-tip">选择文件后将模拟上传成功并加入附件表格</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="uploadDialogVisible = false">关闭</el-button></template>
    </el-dialog>
    <el-dialog v-model="previewVisible" title="附件预览" width="600px">
      <div v-if="previewAttachment" style="text-align:center">
        <img v-if="previewAttachment.dataUrl" :src="previewAttachment.dataUrl" style="max-width:100%;max-height:400px;border-radius:6px" />
        <div v-else style="padding:32px;color:var(--text-secondary)"><el-icon size="48"><Document /></el-icon><p><b>{{ previewAttachment.fileName }}</b></p><p>类型：{{ previewAttachment.typeName }}｜大小：{{ formatFileSize(previewAttachment.fileSize) }}</p></div>
      </div>
    </el-dialog>
    <el-dialog v-model="faceDialogVisible" title="人脸识别" width="480px" :close-on-click-modal="false" @close="stopFaceRecognition">
      <div class="face-camera-wrap">
        <video ref="faceVideoRef" autoplay playsinline class="face-camera-video" />
        <div class="face-scan-overlay">
          <div class="face-scan-frame" />
          <p class="face-scan-text">正在识别中，请保持面部在框内...</p>
        </div>
      </div>
    </el-dialog>
  </section>
  <el-empty v-else description="未找到申报" />
</template>

<style scoped>
/* ========== 页面结构 ========== */
.insp-page { display: flex; flex-direction: column; gap: 0; }

.page-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 24px; margin-bottom: 16px;
  background: var(--color-primary); color: #fff; border-radius: var(--radius-page);
}
.page-header h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 1px; }
.page-header-sub { margin-left: 12px; font-size: 14px; opacity: 0.8; }
.page-header-left { display: flex; align-items: baseline; }
.page-header-right { display: flex; gap: 8px; }

.page-body { display: grid; gap: 16px; }
.two-col-layout { grid-template-columns: 1fr 1fr; }
.three-col-layout { grid-template-columns: 22% 1fr 26%; }
.col-stack { display: flex; flex-direction: column; gap: 16px; }
.col-left, .col-center, .col-right { display: flex; flex-direction: column; gap: 16px; }

/* ========== 区块卡片 ========== */
.sec-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-card); box-shadow: var(--shadow-card);
  overflow: hidden;
}
.sec-card--danger { border-top: 3px solid var(--color-danger); }
.sec-card--success { border-top: 3px solid var(--color-primary-light); }
.sec-card--sticky { position: sticky; top: 0; z-index: 10; }

.sec-title {
  padding: 0 20px; height: 46px; line-height: 46px;
  font-size: 15px; font-weight: 600; color: var(--text-primary);
  border-bottom: 1px solid var(--color-divider);
  display: flex; justify-content: space-between; align-items: center;
}
.sec-title--danger { color: var(--color-danger); }
.sec-title--success { color: var(--color-primary-light); }
.sec-title-count { font-size: 12px; color: var(--text-placeholder); font-weight: 400; }
.sec-tag { margin-left: 8px; }

/* ========== 字段列表 ========== */
.field-list { padding: 8px 20px 16px; }
.field-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid var(--color-divider);
  font-size: 14px; line-height: 1.6;
}
.field-row:last-child { border-bottom: none; }
.field-row span { color: var(--text-secondary); font-size: 13px; flex-shrink: 0; margin-right: 16px; }
.field-row b { color: var(--text-primary); font-weight: 500; text-align: right; word-break: break-all; }

/* ========== 自动校验 ========== */
.check-list { padding: 12px 20px; display: grid; gap: 8px; }
.check-row { display: flex; gap: 8px; align-items: flex-start; padding: 8px 10px; border-radius: 6px; background: var(--color-bg); }
.check-tag { flex-shrink: 0; margin-top: 2px; }
.check-body b { font-size: 13px; color: var(--text-primary); display: block; }
.check-body span { font-size: 12px; color: var(--text-secondary); display: block; margin-top: 2px; }

.check-grid { padding: 12px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
.check-item { display: flex; align-items: center; gap: 6px; padding: 4px 0; }
.check-label { font-size: 13px; color: var(--text-primary); }
.check-msg { font-size: 12px; color: var(--text-secondary); margin-left: auto; }

/* ========== 身份核验 ========== */
.identity-row { padding: 12px 20px; display: flex; gap: 20px; font-size: 13px; color: var(--text-secondary); flex-wrap: wrap; }

/* ========== 现场查验 ========== */
.site-check-grid { padding: 12px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
.site-check-grid .el-checkbox { margin-right: 0; font-size: 13px; }

/* ========== 卡片内表格包裹 ========== */
.sec-card :deep(.el-table) { margin: 0; }
.table-wrap { padding: 0 20px 16px; }
.upload-text { margin-top: 8px; color: var(--text-primary); font-size: 14px; }
.upload-tip { margin-top: 4px; color: var(--text-secondary); font-size: 12px; }

/* ========== 审核处理 ========== */
.action-block { padding: 20px; }
.action-status {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-radius: 6px; background: var(--color-bg);
  font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;
}
.action-buttons {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px;
}
.action-buttons .el-button { width: 100%; margin-left: 0 !important; }
.action-buttons :deep(.el-button + .el-button) { margin-left: 0 !important; }
.action-hint {
  margin-top: 12px; padding: 10px 12px; border-radius: 6px;
  background: var(--color-warning-bg); color: var(--color-warning);
  font-size: 12px; display: flex; align-items: flex-start; gap: 6px; line-height: 1.5;
}

/* ========== 证明预览 ========== */
.cert-preview { padding: 16px 20px; }
.cert-preview-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; }
.cert-preview-row {
  display: flex; justify-content: space-between; padding: 6px 0;
  border-bottom: 1px solid var(--color-divider); font-size: 13px;
}
.cert-preview-row span { color: var(--text-secondary); }
.cert-preview-row b { color: var(--text-primary); font-weight: 500; }

/* ========== 驳回/出证信息 ========== */
.reject-block, .cert-block { text-align: center; padding: 24px 20px; }
.reject-block h3, .cert-block h3 { margin: 12px 0; font-size: 16px; }
.reject-block h3 { color: var(--color-danger); }
.cert-block h3 { color: var(--color-primary-light); }
.reject-block .field-list, .cert-block .field-list { text-align: left; margin-top: 16px; }

.text-success { color: var(--color-primary-light) !important; }

/* ========== 证件样式 ========== */
.cert-document {
  background: linear-gradient(135deg, #fefcf3 0%, #fdf6e3 100%);
  border: 3px solid #c9a84c; border-radius: 8px; padding: 24px 28px;
  box-shadow: inset 0 0 0 1px #e6d9b1, 0 2px 12px rgba(0,0,0,0.08);
}
.cert-header { text-align: center; border-bottom: 2px solid #c9a84c; padding-bottom: 12px; margin-bottom: 16px; }
.cert-emblem { font-size: 28px; color: #c9a84c; margin-bottom: 4px; }
.cert-header h2 { margin: 0; font-size: 20px; color: #8b0000; letter-spacing: 6px; }
.cert-subtitle { margin: 4px 0 0; font-size: 11px; color: #999; letter-spacing: 1px; }
.cert-no-row { text-align: right; font-size: 13px; color: #666; margin-bottom: 12px; }
.cert-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cert-table td { border: 1px solid #d4c5a0; padding: 6px 10px; color: #303133; }
.cert-table td.label { background: #f5eed9; color: #666; font-weight: 500; width: 80px; text-align: center; }
.cert-footer { display: flex; justify-content: flex-start; align-items: flex-end; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #d4c5a0; }
.cert-qr img { width: 96px; height: 96px; object-fit: contain; border: 1px solid #d4c5a0; border-radius: 4px; }

/* ========== 出证确认弹窗 ========== */
:deep(.cert-issue-dialog) {
  border-radius: 10px;
  overflow: hidden;
}
:deep(.cert-issue-dialog .el-dialog__header) {
  padding: 18px 26px 12px;
  margin: 0;
  border-bottom: 1px solid #eef0f3;
}
:deep(.cert-issue-dialog .el-dialog__body) {
  padding: 14px 26px 18px;
}
:deep(.cert-issue-dialog .el-dialog__footer) {
  padding: 0;
  border-top: 1px solid #eef0f3;
}
.cert-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cert-dialog-title {
  display: flex;
  align-items: baseline;
  gap: 18px;
}
.cert-dialog-title strong {
  color: #151a24;
  font-size: 21px;
  font-weight: 700;
}
.cert-dialog-title span {
  color: #8a93a3;
  font-size: 14px;
}
.cert-dialog-close {
  color: #a0a7b3;
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
}
.cert-issue-layout {
  display: grid;
  grid-template-columns: 410px minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
}
.cert-preview-panel,
.cert-confirm-panel,
.cert-info-card,
.cert-check-card {
  border: 1px solid #edf0f4;
  border-radius: 8px;
  background: #fff;
}
.cert-preview-panel {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
}
.cert-panel-title,
.cert-info-card > strong,
.cert-check-card > strong {
  display: block;
  margin-bottom: 10px;
  color: #252b36;
  font-size: 15px;
  font-weight: 700;
}
.cert-paper-frame {
  padding: 7px;
  border: 1px solid #e8e1d5;
  border-radius: 6px;
  background: #fffdf7;
  box-shadow: 0 8px 20px rgba(111, 91, 55, 0.08);
}
.cert-paper-frame img {
  display: block;
  width: 100%;
  max-height: 360px;
  object-fit: contain;
}
.cert-preview-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  padding-top: 10px;
}
.cert-preview-actions .el-button {
  color: #6b7280;
  font-weight: 600;
}
.cert-confirm-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}
.cert-confirm-top {
  display: grid;
  grid-template-columns: minmax(360px, 1fr) 270px;
  gap: 18px;
}
.cert-pass-card {
  padding: 12px 14px;
  border-radius: 8px;
  background: linear-gradient(180deg, #fffdf6 0%, #ffffff 52%);
}
.cert-pass-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid #bfe8cf;
  border-radius: 6px;
  background: #effaf3;
  color: #4f8b63;
  font-size: 13px;
  line-height: 1.6;
}
.cert-pass-message .el-icon,
.cert-check-card .el-icon {
  color: #49b765;
}
.cert-check-card {
  padding: 12px 14px;
  background: #fbfcfe;
}
.cert-check-card p {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 9px 0 0;
  color: #697386;
  font-size: 13px;
}
.cert-check-card b {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #69b86d;
  font-weight: 600;
}
.cert-info-card {
  flex: 1;
  padding: 16px 18px;
}
.cert-info-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 28px;
  row-gap: 0;
}
.cert-info-list p {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  margin: 0;
  padding: 9px 0;
  border-bottom: 1px solid #eff1f4;
}
.cert-info-list p:last-child {
  border-bottom: none;
}
.cert-info-list span {
  color: #8a93a3;
  font-size: 14px;
}
.cert-info-list b {
  color: #1f2633;
  text-align: right;
  font-size: 15px;
  font-weight: 700;
  word-break: break-all;
}
.cert-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 26px;
  background: #fbfcfe;
}
.cert-footer-tip {
  color: #8a93a3;
  font-size: 13px;
}
.cert-footer-tip::before {
  content: 'ⓘ';
  margin-right: 8px;
  color: #a7afbd;
}
.cert-footer-actions {
  display: flex;
  gap: 14px;
}
.cert-footer-actions .el-button {
  min-width: 110px;
  height: 40px;
  margin-left: 0 !important;
}
.cert-footer-actions .el-button--success {
  background: #58c83a;
  border-color: #58c83a;
  font-weight: 700;
}

@media (max-width: 1200px) {
  .three-col-layout { grid-template-columns: 1fr; }
  .two-col-layout { grid-template-columns: 1fr; }
}

/* ========== 人脸识别摄像头弹窗 ========== */
.face-camera-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}
.face-camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* 镜像翻转更符合用户习惯 */
}
.face-scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.face-scan-frame {
  width: 200px;
  height: 260px;
  border: 2px solid rgba(73, 183, 101, 0.8);
  border-radius: 12px;
  box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.5);
  animation: scan-pulse 2s ease-in-out infinite;
}
@keyframes scan-pulse {
  0%, 100% { box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(73, 183, 101, 0.3); }
  50% { box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.5), 0 0 35px rgba(73, 183, 101, 0.6); }
}
.face-scan-text {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  margin: 0;
  text-align: center;
  color: #fff;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  opacity: 0.9;
}
</style>
