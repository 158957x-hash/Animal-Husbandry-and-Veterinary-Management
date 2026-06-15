<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import QRCode from 'qrcode'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { InspectionAttachment } from '../../domain/models'

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

/* ---- 身份核验（默认已通过） ---- */
const identityVerified = ref(true)
const identitySerial = ref('AH-VET-VERIFY-202606130915')
const identityTime = ref('2026-06-13T09:15:00.000Z')

/* ---- 现场查验 ---- */
const siteChecks = ref({
  clinicalNormal: false,
  earTagMatch: false,
  quantityMatch: false,
  vehicleQualified: false,
  carrierMatch: false,
  loadingQualified: false,
  noAbnormalDeath: false,
  noQuarantineRestriction: false,
})
const siteCheckPassed = computed(() => Object.values(siteChecks.value).every(Boolean))
const inspectionRemark = ref('')

/* ---- 取证附件 ---- */
const attachments = computed(() => application.value ? store.data.inspectionAttachments.filter((a) => a.applicationNo === application.value!.applicationNo) : [])
const attachmentCount = computed(() => attachments.value.length)
const previewVisible = ref(false)
const previewAttachment = ref<InspectionAttachment | null>(null)

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function showPreview(att: InspectionAttachment) {
  previewAttachment.value = att
  previewVisible.value = true
}

function downloadAttachment(att: InspectionAttachment) {
  if (att.dataUrl) {
    const link = document.createElement('a')
    link.href = att.dataUrl
    link.download = att.fileName
    link.click()
  } else {
    const blob = new Blob([`${att.typeName} - ${att.fileName}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = att.fileName
    link.click()
    URL.revokeObjectURL(url)
  }
}

/* ---- 自动校验 ---- */
const autoCheckPassed = computed(() => application.value?.validationResults.every((item) => item.passed) ?? false)

/* ---- 全部条件 ---- */
const allPassed = computed(() => identityVerified.value && siteCheckPassed.value && attachmentCount.value >= 1 && autoCheckPassed.value)

/* ---- 弹窗 ---- */
const earTagDialog = ref(false)
const immuneDialog = ref(false)
const archiveDialog = ref(false)
const rejectDialog = ref(false)
const rejectReason = ref('')
const activeArchiveTab = ref('farm')

/* ---- 出证确认弹窗 ---- */
const certDialog = ref(false)
const certQrDataUrl = ref('')

function openCertDialog() {
  if (!allPassed.value) return ElMessage.error('身份核验、现场查验、取证附件和自动校验须全部通过')
  certDialog.value = true
  const certNo = certificate.value?.certificateNo || application.value?.applicationNo?.replace('CDJY', 'DWJY') || '-'
  QRCode.toDataURL(certNo, { width: 140, margin: 2, color: { dark: '#1a1a1a' } }).then((url) => { certQrDataUrl.value = url }).catch(() => {})
}

/* ---- 已出证查看证书弹窗 ---- */
const viewCertDialog = ref(false)
const viewCertQrDataUrl = ref('')

function openViewCertDialog() {
  viewCertDialog.value = true
  const certNo = certificate.value?.certificateNo || '-'
  QRCode.toDataURL(certNo, { width: 140, margin: 2, color: { dark: '#1a1a1a' } }).then((url) => { viewCertQrDataUrl.value = url }).catch(() => {})
}

/* ---- 耳标明细 ---- */
const earTagList = computed(() => {
  if (!batch.value || !application.value) return []
  const start = batch.value.earTagStart
  const count = Math.min(application.value.quantity, batch.value.earTagEnd - start + 1)
  return Array.from({ length: count }, (_, i) => ({
    no: `${batch.value!.earTagPrefix}-${start + i}`,
    status: '正常',
    immune: '已免疫',
    abnormal: false,
  }))
})

/* ---- 免疫记录 ---- */
const immuneRecords = computed(() => [
  { name: '口蹄疫', status: '已免疫', date: '2026-05-10' },
  { name: '猪瘟', status: '已免疫', date: '2026-05-10' },
  { name: '蓝耳病', status: '已免疫', date: '2026-05-12' },
])

/* ---- 证明编号 ---- */
const previewCertNo = computed(() => certificate.value?.certificateNo || application.value?.applicationNo?.replace('CDJY', 'DWJY') || '-')

/* ---- 操作 ---- */
async function confirmApprove() {
  if (!application.value) return
  await store.approveOriginApplication(application.value.id, {
    faceRecognitionPassed: identityVerified.value,
    siteInspectionPassed: siteCheckPassed.value,
    evidencePhotoCount: attachmentCount.value,
    remark: inspectionRemark.value || '人证一致，临床检查健康，运输工具消毒合格',
  })
  certDialog.value = false
  ElMessage.success('动物检疫合格证明已生成，运输任务已同步监管端')
  router.push('/vet/origin-todos')
}

async function reject() {
  if (!application.value) return
  if (!rejectReason.value.trim()) return ElMessage.warning('请填写驳回原因')
  await store.rejectOriginApplication(application.value.id, rejectReason.value.trim())
  ElMessage.success('申报已驳回，养殖场户可查看原因并重新提交')
  rejectDialog.value = false
  router.push('/vet/origin-todos')
}

async function returnModify() {
  if (!application.value) return
  const { value } = await ElMessageBox.prompt('请输入退回修改意见', `退回申报 ${application.value.applicationNo}`)
  await store.rejectOriginApplication(application.value.id, value || '请补充完善申报材料')
  ElMessage.success('申报已退回，养殖场户可修改后重新提交')
  router.push('/vet/origin-todos')
}
</script>

<template>
  <section v-if="application" class="inspection-layout">

    <!-- ========== 已驳回：展示驳回信息 ========== -->
    <template v-if="isRejected">
      <el-card class="panel-card">
        <div class="card-header-line">
          <div>
            <h2>申报详情 - {{ application.applicationNo }}</h2>
            <p>该申报已被驳回，养殖场户可查看原因并修改后重新提交。</p>
          </div>
          <el-button @click="router.push('/vet/origin-todos')">返回列表</el-button>
        </div>
      </el-card>

      <div class="page-grid two-col">
        <div class="stack">
          <el-card class="panel-card">
            <template #header><strong>申报信息</strong></template>
            <div class="info-list">
              <p><span>申报编号</span><b>{{ application.applicationNo }}</b></p>
              <p><span>动物种类</span><b>{{ application.animalType }}</b></p>
              <p><span>申报数量</span><b>{{ application.quantity }}头</b></p>
              <p><span>检疫用途</span><b>{{ purposeText }}</b></p>
              <p><span>目的地</span><b>{{ application.destination }}</b></p>
              <p><span>承运人</span><b>{{ application.carrier }}</b></p>
              <p><span>提交时间</span><b>{{ formatTime(application.submittedAt) }}</b></p>
            </div>
          </el-card>

          <el-card class="panel-card">
            <template #header><strong>自动校验结果</strong></template>
            <div class="check-list">
              <div v-for="check in application.validationResults" :key="check.label" class="check-row">
                <el-tag :type="check.passed ? 'success' : 'danger'" size="small">{{ check.passed ? '通过' : '异常' }}</el-tag>
                <div><b>{{ check.label }}</b><p>{{ check.message }}</p></div>
              </div>
            </div>
          </el-card>
        </div>

        <div class="stack">
          <el-card class="panel-card reject-card">
            <template #header><strong>驳回信息</strong></template>
            <div class="reject-info">
              <div class="reject-icon">
                <el-icon size="48" color="#f56c6c"><Document /></el-icon>
              </div>
              <h3>申报已驳回</h3>
              <div class="info-list">
                <p><span>驳回原因</span><b style="color:#f56c6c">{{ application.rejectReason || '未填写' }}</b></p>
                <p><span>驳回时间</span><b>{{ formatTime(application.updatedAt) }}</b></p>
                <p><span>驳回人</span><b>官方兽医 王敏</b></p>
              </div>
            </div>
          </el-card>

          <el-card class="panel-card">
            <template #header><strong>养殖场信息</strong></template>
            <div class="info-list">
              <p><span>养殖场名称</span><b>{{ batch?.farmName || '-' }}</b></p>
              <p><span>养殖品种</span><b>{{ batch?.animalType }} / {{ batch?.breed }}</b></p>
              <p><span>所在地</span><b>{{ batch?.location }}</b></p>
              <p><span>当前存栏</span><b>{{ batch?.stock ?? '-' }}头</b></p>
            </div>
          </el-card>
        </div>
      </div>
    </template>

    <!-- ========== 已出证：展示出证信息 ========== -->
    <template v-else-if="isIssued">
      <el-card class="panel-card">
        <div class="card-header-line">
          <div>
            <h2>申报详情 - {{ application.applicationNo }}</h2>
            <p>该申报已出具动物检疫合格证明。</p>
          </div>
          <div class="action-inline">
            <el-button type="success" @click="openViewCertDialog">查看检疫证明</el-button>
            <el-button @click="router.push('/vet/origin-todos')">返回列表</el-button>
          </div>
        </div>
      </el-card>

      <div class="page-grid two-col">
        <div class="stack">
          <el-card class="panel-card">
            <template #header><strong>申报信息</strong></template>
            <div class="info-list">
              <p><span>申报编号</span><b>{{ application.applicationNo }}</b></p>
              <p><span>动物种类</span><b>{{ application.animalType }}</b></p>
              <p><span>申报数量</span><b>{{ application.quantity }}头</b></p>
              <p><span>检疫用途</span><b>{{ purposeText }}</b></p>
              <p><span>启运时间</span><b>{{ application.departureTime }}</b></p>
              <p><span>目的地</span><b>{{ application.destination }}</b></p>
              <p><span>承运人</span><b>{{ application.carrier }}</b></p>
              <p><span>提交时间</span><b>{{ formatTime(application.submittedAt) }}</b></p>
            </div>
          </el-card>

          <el-card class="panel-card">
            <template #header><strong>自动校验结果</strong></template>
            <div class="check-list">
              <div v-for="check in application.validationResults" :key="check.label" class="check-row">
                <el-tag :type="check.passed ? 'success' : 'danger'" size="small">{{ check.passed ? '通过' : '异常' }}</el-tag>
                <div><b>{{ check.label }}</b><p>{{ check.message }}</p></div>
              </div>
            </div>
          </el-card>
        </div>

        <div class="stack">
          <el-card class="panel-card cert-card">
            <template #header><strong>出证信息</strong></template>
            <div class="cert-summary">
              <div class="cert-summary-icon">
                <el-icon size="48" color="#67c23a"><Document /></el-icon>
              </div>
              <h3>已出具检疫证明</h3>
              <div class="info-list">
                <p><span>证明编号</span><b>{{ certificate?.certificateNo || '-' }}</b></p>
                <p><span>出证时间</span><b>{{ formatTime(certificate?.validFrom) }}</b></p>
                <p><span>有效期至</span><b>{{ formatTime(certificate?.validTo) }}</b></p>
                <p><span>签发兽医</span><b>{{ certificate?.issuedBy || '-' }}</b></p>
                <p><span>动物种类</span><b>{{ certificate?.animalType || '-' }}</b></p>
                <p><span>数量</span><b>{{ certificate?.quantity || '-' }}头</b></p>
                <p><span>启运地</span><b>{{ certificate?.origin || '-' }}</b></p>
                <p><span>目的地</span><b>{{ certificate?.destination || '-' }}</b></p>
                <p><span>运输车辆</span><b>{{ certificate?.vehiclePlateNo || '-' }}</b></p>
              </div>
              <el-button type="success" style="margin-top:12px;width:100%" @click="openViewCertDialog">查看检疫证明原件</el-button>
            </div>
          </el-card>

          <el-card class="panel-card">
            <template #header><strong>取证附件</strong><span style="float:right;color:#909399;font-size:12px">共 {{ attachmentCount }} 个</span></template>
            <el-table v-if="attachments.length" :data="attachments" stripe size="small">
              <el-table-column prop="typeName" label="类型" width="100" />
              <el-table-column prop="fileName" label="文件名称" min-width="180" show-overflow-tooltip />
              <el-table-column label="大小" width="80"><template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template></el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button size="small" link type="primary" @click="showPreview(row)">预览</el-button>
                  <el-button size="small" link type="success" @click="downloadAttachment(row)">下载</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无取证附件" :image-size="60" />
          </el-card>
        </div>
      </div>
    </template>

    <!-- ========== 待审核：完整查验页面 ========== -->
    <template v-else-if="isSubmitted">
      <div class="main-cols">
        <!-- 左栏：申报详情 + 耳标 + 免疫 -->
        <div class="col-left">
          <el-card class="panel-card compact-card">
            <template #header><strong>申报详情</strong></template>
            <div class="info-list compact">
              <p><span>申报编号</span><b>{{ application.applicationNo }}</b></p>
              <p><span>动物种类</span><b>{{ application.animalType }}</b></p>
              <p><span>申报数量</span><b>{{ application.quantity }}头</b></p>
              <p><span>检疫用途</span><b>{{ purposeText }}</b></p>
              <p><span>启运时间</span><b>{{ application.departureTime }}</b></p>
              <p><span>联系人</span><b>{{ application.contactPerson }}</b></p>
              <p><span>联系电话</span><b>{{ application.contactPhone }}</b></p>
              <p><span>目的地</span><b>{{ application.destination }}</b></p>
              <p><span>详细地址</span><b>{{ application.destinationAddress }}</b></p>
              <p><span>承运人</span><b>{{ application.carrier }}</b></p>
              <p><span>备注</span><b>{{ application.remark || '无' }}</b></p>
            </div>
          </el-card>

          <el-card class="panel-card compact-card" style="margin-top:8px">
            <template #header><strong>耳标关联</strong><el-button size="small" link type="primary" style="float:right" @click="earTagDialog = true">明细</el-button></template>
            <div class="info-list compact">
              <p><span>已关联</span><b>{{ application.quantity }}个</b></p>
              <p><span>号段</span><b>{{ batch?.earTagPrefix }}-{{ batch?.earTagStart }}~{{ batch?.earTagStart! + application.quantity - 1 }}</b></p>
            </div>
          </el-card>

          <el-card class="panel-card compact-card" style="margin-top:8px">
            <template #header><strong>免疫记录</strong><el-button size="small" link type="primary" style="float:right" @click="immuneDialog = true">详情</el-button></template>
            <div class="info-list compact">
              <p v-for="r in immuneRecords" :key="r.name"><span>{{ r.name }}</span><b style="color:#67c23a">{{ r.status }}</b></p>
              <p><span>完成率</span><b>100%</b></p>
            </div>
            <el-button size="small" type="primary" plain style="margin-top:6px;width:100%" @click="archiveDialog = true">查看关联档案</el-button>
          </el-card>
        </div>

        <!-- 右栏（主工作区）：自动校验 + 身份核验 + 现场查验 + 取证附件 -->
        <div class="col-main">
          <el-card class="panel-card compact-card">
            <template #header><strong>自动校验</strong><el-tag v-if="autoCheckPassed" type="success" size="small" style="float:right">允许检疫</el-tag><el-tag v-else type="danger" size="small" style="float:right">禁止出证</el-tag></template>
            <div class="check-grid">
              <div v-for="check in application.validationResults" :key="check.label" class="check-item">
                <el-tag :type="check.passed ? 'success' : 'danger'" size="small">{{ check.passed ? '通过' : '异常' }}</el-tag>
                <span>{{ check.label }}</span>
              </div>
            </div>
          </el-card>

          <el-card class="panel-card compact-card" style="margin-top:8px">
            <template #header><strong>身份核验</strong><el-tag type="success" size="small" style="float:right">已通过</el-tag></template>
            <div class="identity-row">
              <span>王敏 / AH-VET-0001 / 利辛县动物卫生监督所</span>
              <span>皖政通核验 / {{ formatTime(identityTime) }}</span>
              <span>流水号：{{ identitySerial }}</span>
            </div>
          </el-card>

          <el-card class="panel-card compact-card" style="margin-top:8px">
            <template #header><strong>现场查验</strong><el-tag v-if="siteCheckPassed" type="success" size="small" style="float:right">合格</el-tag><el-tag v-else type="warning" size="small" style="float:right">未完成</el-tag></template>
            <div class="site-check-list">
              <el-checkbox v-model="siteChecks.clinicalNormal">动物临床检查正常</el-checkbox>
              <el-checkbox v-model="siteChecks.earTagMatch">耳标与申报一致</el-checkbox>
              <el-checkbox v-model="siteChecks.quantityMatch">数量与申报一致</el-checkbox>
              <el-checkbox v-model="siteChecks.vehicleQualified">运输车辆符合要求</el-checkbox>
              <el-checkbox v-model="siteChecks.carrierMatch">承运人信息一致</el-checkbox>
              <el-checkbox v-model="siteChecks.loadingQualified">装载情况符合要求</el-checkbox>
              <el-checkbox v-model="siteChecks.noAbnormalDeath">无异常死亡情况</el-checkbox>
              <el-checkbox v-model="siteChecks.noQuarantineRestriction">无检疫限制情况</el-checkbox>
            </div>
            <div style="margin-top:10px">
              <el-input v-model="inspectionRemark" placeholder="查验意见（选填）" size="small" />
            </div>
          </el-card>

          <el-card class="panel-card compact-card" style="margin-top:8px">
            <template #header><strong>取证附件</strong><span style="float:right;color:#909399;font-size:12px">共 {{ attachmentCount }} 个</span></template>
            <el-table :data="attachments" stripe size="small">
              <el-table-column prop="typeName" label="类型" width="100" />
              <el-table-column prop="fileName" label="文件名称" min-width="200" show-overflow-tooltip />
              <el-table-column label="大小" width="80"><template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template></el-table-column>
              <el-table-column label="上传时间" width="160"><template #default="{ row }">{{ formatTime(row.uploadedAt) }}</template></el-table-column>
              <el-table-column prop="uploadedBy" label="上传人" width="120" />
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" link type="primary" @click="showPreview(row)">预览</el-button>
                  <el-button size="small" link type="success" @click="downloadAttachment(row)">下载</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </div>

      <!-- 底部审核操作栏 -->
      <div class="bottom-actions">
        <div class="action-bar">
          <span class="action-label">审核处理</span>
          <el-button type="success" :disabled="!allPassed" @click="openCertDialog">审核通过并出证</el-button>
          <el-button @click="returnModify">退回修改</el-button>
          <el-button type="danger" plain @click="rejectDialog = true">驳回申请</el-button>
          <span v-if="!allPassed" class="action-hint">身份核验、现场查验、取证附件和自动校验须全部通过方可出证</span>
        </div>
      </div>
    </template>

    <!-- ========== 其他状态 ========== -->
    <template v-else>
      <el-card class="panel-card">
        <div class="card-header-line">
          <div>
            <h2>申报详情 - {{ application.applicationNo }}</h2>
          </div>
          <el-button @click="router.push('/vet/origin-todos')">返回列表</el-button>
        </div>
      </el-card>
      <el-card class="panel-card">
        <template #header><strong>申报信息</strong></template>
        <div class="info-list">
          <p><span>申报编号</span><b>{{ application.applicationNo }}</b></p>
          <p><span>动物种类</span><b>{{ application.animalType }}</b></p>
          <p><span>申报数量</span><b>{{ application.quantity }}头</b></p>
          <p><span>当前状态</span><b>{{ statusText[application.status] }}</b></p>
          <p><span>目的地</span><b>{{ application.destination }}</b></p>
        </div>
      </el-card>
    </template>

    <!-- ========== 弹窗：出证确认 ========== -->
    <el-dialog v-model="certDialog" title="确认出证" width="580px" :close-on-click-modal="false">
      <div class="cert-document">
        <div class="cert-header">
          <div class="cert-emblem">&#9733;</div>
          <h2>动物检疫合格证明</h2>
          <p class="cert-subtitle">Animal Quarantine Certificate</p>
        </div>
        <div class="cert-body">
          <div class="cert-no-row">
            <span>证号：{{ previewCertNo }}</span>
          </div>
          <table class="cert-table">
            <tr><td class="label">动物种类</td><td>{{ application.animalType }}</td><td class="label">数量</td><td>{{ application.quantity }}头</td></tr>
            <tr><td class="label">启运地</td><td colspan="3">{{ batch?.location || '-' }}</td></tr>
            <tr><td class="label">目的地</td><td colspan="3">{{ application.destination }}</td></tr>
            <tr><td class="label">承运车辆</td><td>{{ vehicle?.plateNo || '-' }}</td><td class="label">承运人</td><td>{{ application.carrier }}</td></tr>
            <tr><td class="label">签发兽医</td><td>官方兽医 王敏</td><td class="label">签发日期</td><td>{{ formatTime(new Date().toISOString()) }}</td></tr>
          </table>
        </div>
        <div class="cert-footer">
          <div class="cert-qr">
            <img v-if="certQrDataUrl" :src="certQrDataUrl" alt="二维码" style="width:100px;height:100px" />
          </div>
          <div class="cert-stamp">
            <div class="stamp-circle">
              <span>利辛县</span>
              <span>动物卫生</span>
              <span>监督所</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="certDialog = false">取消</el-button>
        <el-button type="success" @click="confirmApprove">确认出证</el-button>
      </template>
    </el-dialog>

    <!-- ========== 弹窗：查看已出证证书 ========== -->
    <el-dialog v-model="viewCertDialog" title="动物检疫合格证明" width="580px">
      <div class="cert-document">
        <div class="cert-header">
          <div class="cert-emblem">&#9733;</div>
          <h2>动物检疫合格证明</h2>
          <p class="cert-subtitle">Animal Quarantine Certificate</p>
        </div>
        <div class="cert-body">
          <div class="cert-no-row">
            <span>证号：{{ certificate?.certificateNo || '-' }}</span>
          </div>
          <table class="cert-table">
            <tr><td class="label">动物种类</td><td>{{ certificate?.animalType || '-' }}</td><td class="label">数量</td><td>{{ certificate?.quantity || '-' }}头</td></tr>
            <tr><td class="label">启运地</td><td colspan="3">{{ certificate?.origin || '-' }}</td></tr>
            <tr><td class="label">目的地</td><td colspan="3">{{ certificate?.destination || '-' }}</td></tr>
            <tr><td class="label">承运车辆</td><td>{{ certificate?.vehiclePlateNo || '-' }}</td><td class="label">签发兽医</td><td>{{ certificate?.issuedBy || '-' }}</td></tr>
            <tr><td class="label">签发日期</td><td>{{ formatTime(certificate?.validFrom) }}</td><td class="label">有效期至</td><td>{{ formatTime(certificate?.validTo) }}</td></tr>
          </table>
        </div>
        <div class="cert-footer">
          <div class="cert-qr">
            <img v-if="viewCertQrDataUrl" :src="viewCertQrDataUrl" alt="二维码" style="width:100px;height:100px" />
          </div>
          <div class="cert-stamp">
            <div class="stamp-circle">
              <span>利辛县</span>
              <span>动物卫生</span>
              <span>监督所</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="viewCertDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ========== 弹窗 ========== -->
    <el-dialog v-model="earTagDialog" title="耳标明细" width="640px">
      <el-table :data="earTagList" stripe max-height="400">
        <el-table-column prop="no" label="耳标号" min-width="180" />
        <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag :type="row.abnormal ? 'danger' : 'success'" size="small">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column prop="immune" label="免疫" width="120"><template #default="{ row }"><el-tag type="success" size="small">{{ row.immune }}</el-tag></template></el-table-column>
        <el-table-column label="异常" width="100"><template #default="{ row }"><el-tag :type="row.abnormal ? 'danger' : 'success'" size="small">{{ row.abnormal ? '异常' : '正常' }}</el-tag></template></el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="immuneDialog" title="免疫记录" width="520px">
      <el-table :data="immuneRecords" stripe>
        <el-table-column prop="name" label="疫苗名称" />
        <el-table-column prop="status" label="状态" width="120"><template #default="{ row }"><el-tag type="success" size="small">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column prop="date" label="日期" width="140" />
      </el-table>
    </el-dialog>

    <el-dialog v-model="archiveDialog" title="关联档案" width="700px">
      <el-tabs v-model="activeArchiveTab">
        <el-tab-pane label="养殖场档案" name="farm">
          <div class="info-list compact">
            <p><span>养殖场名称</span><b>{{ batch?.farmName || '-' }}</b></p>
            <p><span>养殖品种</span><b>{{ batch?.animalType }} / {{ batch?.breed }}</b></p>
            <p><span>所在地</span><b>{{ batch?.location }}</b></p>
          </div>
        </el-tab-pane>
        <el-tab-pane label="存栏信息" name="stock">
          <div class="info-list compact">
            <p><span>当前存栏</span><b>{{ batch?.stock ?? '-' }}头</b></p>
            <p><span>免疫合格</span><b>{{ batch?.immuneQualified ? '是' : '否' }}</b></p>
            <p><span>耳标号段</span><b>{{ batch?.earTagPrefix }} {{ batch?.earTagStart }}-{{ batch?.earTagEnd }}</b></p>
          </div>
        </el-tab-pane>
        <el-tab-pane label="免疫记录" name="immune">
          <el-table :data="immuneRecords" stripe><el-table-column prop="name" label="疫苗" /><el-table-column prop="status" label="状态" /><el-table-column prop="date" label="日期" /></el-table>
        </el-tab-pane>
        <el-tab-pane label="耳标记录" name="earTag">
          <el-table :data="earTagList" stripe max-height="300"><el-table-column prop="no" label="耳标号" /><el-table-column prop="status" label="状态" /><el-table-column prop="immune" label="免疫" /></el-table>
        </el-tab-pane>
        <el-tab-pane label="历史检疫" name="history">
          <el-table :data="store.data.originApplications.filter((a) => a.batchId === application.batchId && a.id !== application.id).slice(0, 5)" stripe>
            <el-table-column prop="applicationNo" label="申报编号" /><el-table-column prop="quantity" label="数量" width="80" /><el-table-column prop="status" label="状态" width="100" />
          </el-table>
          <el-empty v-if="!store.data.originApplications.filter((a) => a.batchId === application.batchId && a.id !== application.id).length" description="暂无历史检疫记录" />
        </el-tab-pane>
        <el-tab-pane label="历史出证" name="certHistory">
          <el-table :data="store.data.quarantineCertificates.filter((c) => c.applicationId !== application.id).slice(0, 5)" stripe>
            <el-table-column prop="certificateNo" label="证明编号" /><el-table-column prop="animalType" label="动物" width="80" /><el-table-column prop="quantity" label="数量" width="80" />
          </el-table>
          <el-empty v-if="!store.data.quarantineCertificates.filter((c) => c.applicationId !== application.id).length" description="暂无历史出证记录" />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog v-model="rejectDialog" title="驳回申请" width="520px">
      <el-form label-position="top">
        <el-form-item label="驳回原因">
          <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请填写驳回原因，养殖场户将看到此内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialog = false">取消</el-button>
        <el-button type="danger" :disabled="!rejectReason.trim()" @click="reject">确认驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" title="附件预览" width="600px">
      <div v-if="previewAttachment" style="text-align:center">
        <img v-if="previewAttachment.dataUrl" :src="previewAttachment.dataUrl" style="max-width:100%;max-height:400px;border-radius:6px" />
        <div v-else class="file-preview-fallback">
          <el-icon size="48"><Document /></el-icon>
          <p><b>{{ previewAttachment.fileName }}</b></p>
          <p>类型：{{ previewAttachment.typeName }}｜大小：{{ formatFileSize(previewAttachment.fileSize) }}</p>
        </div>
      </div>
    </el-dialog>
  </section>
  <el-empty v-else description="未找到申报" />
</template>

<script lang="ts">
import { statusText } from '../../domain/stateMachine'
</script>

<style scoped>
.inspection-layout {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: 0;
}
.inspection-layout:has(.bottom-actions) {
  padding-bottom: 60px;
}
.main-cols {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 8px;
  align-items: start;
}
.col-left, .col-main {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 紧凑卡片 */
.compact-card :deep(.el-card__header) {
  padding: 8px 12px;
  font-size: 13px;
}
.compact-card :deep(.el-card__body) {
  padding: 8px 12px;
}

/* 信息列表 */
.info-list.compact p {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 12px;
  line-height: 1.6;
}
.info-list.compact p span { color: #909399; }
.info-list.compact p b { color: #303133; font-weight: 500; }

/* 自动校验两列 */
.check-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
}
.check-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 0;
}

/* 身份核验单行 */
.identity-row {
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #606266;
  flex-wrap: wrap;
}

/* 现场查验 */
.site-check-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.site-check-list .el-checkbox { margin-right: 0; font-size: 13px; }

/* 底部审核操作栏 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 280px;
  right: 0;
  background: #fff;
  border-top: 1px solid #e4e7ed;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
  z-index: 100;
  padding: 10px 24px;
}
.action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}
.action-label {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-right: 8px;
}
.action-hint {
  color: #E6A23C;
  font-size: 12px;
  margin-left: 12px;
}

/* 驳回信息卡片 */
.reject-card {
  border-top: 3px solid #f56c6c;
}
.reject-info {
  text-align: center;
  padding: 12px 0;
}
.reject-info h3 {
  margin: 12px 0;
  color: #f56c6c;
  font-size: 16px;
}
.reject-info .info-list {
  text-align: left;
  margin-top: 16px;
}
.reject-info .info-list p b {
  word-break: break-all;
}

/* 出证信息卡片 */
.cert-card {
  border-top: 3px solid #67c23a;
}
.cert-summary {
  text-align: center;
  padding: 12px 0;
}
.cert-summary h3 {
  margin: 12px 0;
  color: #67c23a;
  font-size: 16px;
}
.cert-summary .info-list {
  text-align: left;
  margin-top: 16px;
}

/* ========== 证件样式 ========== */
.cert-document {
  background: linear-gradient(135deg, #fefcf3 0%, #fdf6e3 100%);
  border: 3px solid #c9a84c;
  border-radius: 8px;
  padding: 24px 28px;
  position: relative;
  box-shadow: inset 0 0 0 1px #e6d9b1, 0 2px 12px rgba(0,0,0,0.08);
}
.cert-header {
  text-align: center;
  border-bottom: 2px solid #c9a84c;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.cert-emblem {
  font-size: 28px;
  color: #c9a84c;
  margin-bottom: 4px;
}
.cert-header h2 {
  margin: 0;
  font-size: 20px;
  color: #8b0000;
  letter-spacing: 6px;
}
.cert-subtitle {
  margin: 4px 0 0;
  font-size: 11px;
  color: #999;
  letter-spacing: 1px;
}
.cert-no-row {
  text-align: right;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}
.cert-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.cert-table td {
  border: 1px solid #d4c5a0;
  padding: 6px 10px;
  color: #303133;
}
.cert-table td.label {
  background: #f5eed9;
  color: #666;
  font-weight: 500;
  width: 80px;
  text-align: center;
}
.cert-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #d4c5a0;
}
.cert-qr img {
  border: 1px solid #d4c5a0;
  border-radius: 4px;
}
.cert-stamp {
  position: relative;
}
.stamp-circle {
  width: 90px;
  height: 90px;
  border: 3px solid #8b0000;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8b0000;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  opacity: 0.7;
  transform: rotate(-15deg);
}

.file-preview-fallback {
  padding: 32px;
  color: #909399;
}
.file-preview-fallback p { margin-top: 8px; font-size: 14px; }

@media (max-width: 900px) {
  .main-cols {
    grid-template-columns: 1fr;
  }
}
</style>
