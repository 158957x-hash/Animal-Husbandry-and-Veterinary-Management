<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import QRCode from 'qrcode'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { MarkType, SlaughterApplicationStatus } from '../../domain/models'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

/* ---- 基础数据 ---- */
const application = computed(() => store.data.slaughterApplications.find((item) => item.id === route.params.id))
const entryRecord = computed(() => application.value ? store.data.slaughterEntryRecords.find((e) => e.id === application.value!.entryRecordId) : undefined)
const batch = computed(() => application.value ? store.data.slaughterBatches.find((b) => b.id === application.value!.batchId) : undefined)
const relatedCert = computed(() => application.value ? store.data.quarantineCertificates.find((c) => c.id === application.value!.quarantineCertificateId) : undefined)
const productCert = computed(() => application.value ? store.data.productCertificates.find((c) => c.slaughterApplicationId === application.value!.id) : undefined)
const meatCert = computed(() => application.value ? store.data.meatQualityCertificates.find((c) => c.waitingBatchId === application.value!.batchId) : undefined)
const threeCertLink = computed(() => application.value ? store.data.threeCertificateLinks.find((l) => l.waitingBatchId === application.value!.batchId) : undefined)

/* ---- 状态判断 ---- */
const statusLabelMap: Record<SlaughterApplicationStatus, string> = {
  pending_accept: '待受理',
  accepted: '已受理',
  ante_mortem_checking: '宰前检查中',
  post_mortem_checking: '宰后检疫中',
  pending_product_cert: '待产品出证',
  product_cert_issued: '已出证',
  returned: '已退回',
  abnormal: '异常',
}

const isPendingAccept = computed(() => application.value?.status === 'pending_accept')
const isAnteMortemChecking = computed(() => application.value?.status === 'ante_mortem_checking')
const isPostMortemChecking = computed(() => application.value?.status === 'post_mortem_checking')
const isPendingProductCert = computed(() => application.value?.status === 'pending_product_cert')
const isProductCertIssued = computed(() => application.value?.status === 'product_cert_issued')

/* ---- 身份核验（默认已通过） ---- */
const identitySerial = ref('AH-VET-VERIFY-202606130915')
const identityTime = ref('2026-06-13T09:15:00.000Z')

/* ---- 受理条件自动校验 ---- */
const acceptChecks = computed(() => {
  if (!application.value) return []
  const checks = [
    { label: '入场核验已通过', passed: entryRecord.value?.status === 'entry_passed' },
    { label: '非瘟检测阴性', passed: application.value.africanSwineFeverResult === 'negative' },
    { label: '违禁药物检测阴性', passed: application.value.bannedDrugResult === 'negative' },
    { label: '关联动物证有效', passed: !!relatedCert.value },
    { label: '申报信息完整', passed: !!(application.value.animalType && application.value.quantity > 0 && application.value.contactPerson) },
  ]
  return checks
})
const acceptChecksAllPassed = computed(() => acceptChecks.value.every((c) => c.passed))

/* ---- 宰前检查清单 ---- */
const anteChecks = reactive({
  clinicalNormal: false,
  bodyTempNormal: false,
  breathingNormal: false,
  spiritNormal: false,
  skinNormal: false,
  excrementNormal: false,
  earTagMatch: false,
  noEpidemicSign: false,
})
const anteCheckPassed = computed(() => Object.values(anteChecks).every(Boolean))
const anteRemark = ref('')

/* ---- 宰后检疫表单 ---- */
const postForm = reactive({
  qualifiedQuantity: 0,
  unqualifiedQuantity: 0,
  productWeight: 0,
})
const postChecks = reactive({
  carcassInspection: false,
  visceralInspection: false,
  lymphNodeInspection: false,
  parasiticInspection: false,
  trichinellaInspection: false,
  overallJudgment: false,
})
const postCheckPassed = computed(() => Object.values(postChecks).every(Boolean))
const postRemark = ref('')

/* ---- 产品出证表单 ---- */
const certForm = reactive({
  productName: '白条猪肉',
  productBatchNo: '',
  weight: 0,
  markType: 'card_ring' as MarkType,
  useObject: '胴体',
})

/* ---- 出证确认弹窗 ---- */
const certDialog = ref(false)
const certQrDataUrl = ref('')

function openCertDialog() {
  if (!certForm.productName || !certForm.weight || !certForm.productBatchNo) {
    return ElMessage.warning('请填写完整的产品出证信息')
  }
  certDialog.value = true
  const certNo = `CPJY${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
  QRCode.toDataURL(certNo, { width: 140, margin: 2, color: { dark: '#1a1a1a' } }).then((url) => { certQrDataUrl.value = url }).catch(() => {})
}

/* ---- 已出证查看证书弹窗 ---- */
const viewCertDialog = ref(false)
const viewCertQrDataUrl = ref('')

function openViewCertDialog() {
  viewCertDialog.value = true
  const certNo = productCert.value?.certificateNo || '-'
  QRCode.toDataURL(certNo, { width: 140, margin: 2, color: { dark: '#1a1a1a' } }).then((url) => { viewCertQrDataUrl.value = url }).catch(() => {})
}

/* ---- 三证查看弹窗 ---- */
const threeCertDialog = ref(false)

/* ---- 退回弹窗 ---- */
const returnDialog = ref(false)
const returnReason = ref('')

/* ---- 操作 ---- */
async function handleAccept() {
  if (!application.value) return
  if (!acceptChecksAllPassed.value) return ElMessage.error('受理条件未全部通过，无法受理')
  await store.acceptSlaughterApplication(application.value.id)
  ElMessage.success('申报已受理，进入宰前检查阶段')
}

async function handleReturn() {
  if (!application.value) return
  if (!returnReason.value.trim()) return ElMessage.warning('请填写退回原因')
  await store.rejectOriginApplication(application.value.id, returnReason.value.trim())
  ElMessage.success('申报已退回补正')
  returnDialog.value = false
  router.push('/vet/slaughter-todos')
}

async function submitAnteCheck() {
  if (!application.value) return
  if (!anteCheckPassed.value) return ElMessage.warning('请完成所有宰前检查项')
  await store.submitPreSlaughterCheck(application.value.id, {
    checks: { ...anteChecks },
    remark: anteRemark.value || '宰前检查合格',
  })
  ElMessage.success('宰前检查已提交，进入宰后检疫阶段')
  router.push('/vet/slaughter-todos')
}

async function submitPostCheck() {
  if (!application.value) return
  if (!postCheckPassed.value) return ElMessage.warning('请完成所有宰后检疫项')
  if (!postForm.qualifiedQuantity && !postForm.unqualifiedQuantity) return ElMessage.warning('请填写实际屠宰数量')
  await store.submitPostSlaughterCheck(application.value.id, {
    qualifiedQuantity: postForm.qualifiedQuantity,
    unqualifiedQuantity: postForm.unqualifiedQuantity,
    productWeight: postForm.productWeight,
    checks: { ...postChecks },
    remark: postRemark.value || '宰后检疫合格',
  })
  ElMessage.success('宰后检疫已提交，进入产品出证阶段')
  router.push('/vet/slaughter-todos')
}

async function issueProductCert() {
  if (!application.value) return
  certDialog.value = false
  await store.issueProductQuarantineCertificate(application.value.id, {
    productName: certForm.productName,
    productBatchNo: certForm.productBatchNo,
    weight: certForm.weight,
    markType: certForm.markType,
    useObject: certForm.useObject,
  })
  ElMessage.success('产品检疫证明已出具')
  router.push('/vet/slaughter-todos')
}

async function handleReturnModify() {
  if (!application.value) return
  const { value } = await ElMessageBox.prompt('请输入退回修改意见', `退回申报 ${application.value.applicationNo}`)
  await store.rejectOriginApplication(application.value.id, value || '请补充完善申报材料')
  ElMessage.success('申报已退回，屠宰企业可修改后重新提交')
  router.push('/vet/slaughter-todos')
}

/* ---- 预出证编号 ---- */
const previewCertNo = computed(() => productCert.value?.certificateNo || `CPJY${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}0001`)

/* ---- 检疫标志使用情况 ---- */
const markUsage = computed(() => {
  if (!productCert.value) return null
  const marks = store.data.quarantineMarks.filter((m) => m.productCertificateId === productCert.value!.id)
  return {
    total: marks.length,
    used: marks.filter((m) => m.status === 'used').length,
    inStock: marks.filter((m) => m.status === 'in_stock').length,
  }
})
</script>

<template>
  <section v-if="application" class="audit-layout">
    <!-- 顶部标题栏 -->
    <el-card class="panel-card">
      <div class="card-header-line">
        <div>
          <h2>屠宰检疫审核 - {{ application.applicationNo }}</h2>
          <p>当前状态：<el-tag size="small">{{ statusLabelMap[application.status] }}</el-tag></p>
        </div>
        <div class="action-inline">
          <el-button @click="router.push('/vet/slaughter-todos')">返回列表</el-button>
        </div>
      </div>
    </el-card>

    <!-- 三栏布局 -->
    <div class="three-col-layout">
      <!-- ========== 左栏：来源与入场信息 ========== -->
      <div class="col-side">
        <!-- 入场登记信息 -->
        <el-card class="panel-card compact-card">
          <template #header><strong>入场登记信息</strong></template>
          <div class="info-list compact">
            <p><span>入场编号</span><b>{{ entryRecord?.entryNo || '-' }}</b></p>
            <p><span>动物证编号</span><b>{{ relatedCert?.certificateNo || '-' }}</b></p>
            <p><span>养殖场</span><b>{{ entryRecord?.originFarm || '-' }}</b></p>
            <p><span>动物种类</span><b>{{ entryRecord?.animalType || application.animalType || '-' }}</b></p>
            <p><span>数量</span><b>{{ entryRecord?.quantity || application.quantity }}头</b></p>
            <p><span>耳标号段</span><b>{{ entryRecord?.earTagRange || batch?.earTagRange || '-' }}</b></p>
            <p><span>运输车辆</span><b>{{ entryRecord?.vehiclePlateNo || '-' }}</b></p>
            <p><span>承运人</span><b>{{ entryRecord?.carrier || '-' }}</b></p>
          </div>
        </el-card>

        <!-- 入场核验结果 -->
        <el-card class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>入场核验结果</strong><el-tag v-if="entryRecord?.status === 'entry_passed'" type="success" size="small" style="float:right">已通过</el-tag><el-tag v-else type="danger" size="small" style="float:right">未通过</el-tag></template>
          <div v-if="entryRecord?.checkResults?.length" class="check-list-compact">
            <div v-for="check in entryRecord.checkResults" :key="check.label" class="check-row-compact">
              <el-tag :type="check.passed ? 'success' : 'danger'" size="small">{{ check.passed ? '通过' : '异常' }}</el-tag>
              <span>{{ check.label }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无核验结果" :image-size="40" />
        </el-card>

        <!-- 非瘟检测结果 -->
        <el-card class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>非瘟检测结果</strong></template>
          <div class="info-list compact">
            <p><span>检测结果</span><b><el-tag :type="application.africanSwineFeverResult === 'negative' ? 'success' : 'danger'" size="small">{{ application.africanSwineFeverResult === 'negative' ? '阴性' : '阳性' }}</el-tag></b></p>
            <p><span>检测人</span><b>{{ application.africanSwineFeverTestPerson || '-' }}</b></p>
            <p><span>检测时间</span><b>{{ formatTime(application.africanSwineFeverTestTime) }}</b></p>
          </div>
        </el-card>

        <!-- 违禁药物自检结果 -->
        <el-card class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>违禁药物自检结果</strong></template>
          <div class="info-list compact">
            <p><span>检测结果</span><b><el-tag :type="application.bannedDrugResult === 'negative' ? 'success' : 'danger'" size="small">{{ application.bannedDrugResult === 'negative' ? '阴性' : '阳性' }}</el-tag></b></p>
            <p><span>检测人</span><b>{{ application.bannedDrugTestPerson || '-' }}</b></p>
            <p><span>检测时间</span><b>{{ formatTime(application.bannedDrugTestTime) }}</b></p>
          </div>
        </el-card>
      </div>

      <!-- ========== 中栏：官方兽医审核工作区 ========== -->
      <div class="col-main">
        <!-- 身份核验 -->
        <el-card class="panel-card compact-card">
          <template #header><strong>身份核验</strong><el-tag type="success" size="small" style="float:right">已通过</el-tag></template>
          <div class="identity-row">
            <span>王敏 / AH-VET-0001 / 利辛县动物卫生监督所</span>
            <span>皖政通核验 / {{ formatTime(identityTime) }}</span>
            <span>流水号：{{ identitySerial }}</span>
          </div>
        </el-card>

        <!-- 受理条件核验 -->
        <el-card class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>受理条件核验</strong><el-tag v-if="acceptChecksAllPassed" type="success" size="small" style="float:right">允许受理</el-tag><el-tag v-else type="danger" size="small" style="float:right">条件未满足</el-tag></template>
          <div class="check-grid">
            <div v-for="check in acceptChecks" :key="check.label" class="check-item">
              <el-tag :type="check.passed ? 'success' : 'danger'" size="small">{{ check.passed ? '通过' : '异常' }}</el-tag>
              <span>{{ check.label }}</span>
            </div>
          </div>
        </el-card>

        <!-- 根据状态显示不同操作区 -->
        <!-- 待受理 -->
        <el-card v-if="isPendingAccept" class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>受理操作</strong></template>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <el-button type="success" :disabled="!acceptChecksAllPassed" @click="handleAccept">受理申报</el-button>
            <el-button @click="handleReturnModify">退回补正</el-button>
            <span v-if="!acceptChecksAllPassed" style="color:#E6A23C;font-size:12px">受理条件未全部通过，无法受理</span>
          </div>
        </el-card>

        <!-- 宰前检查中 -->
        <el-card v-if="isAnteMortemChecking" class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>宰前检查</strong><el-tag v-if="anteCheckPassed" type="success" size="small" style="float:right">合格</el-tag><el-tag v-else type="warning" size="small" style="float:right">未完成</el-tag></template>
          <div class="site-check-list">
            <el-checkbox v-model="anteChecks.clinicalNormal">临床检查正常</el-checkbox>
            <el-checkbox v-model="anteChecks.bodyTempNormal">体温正常</el-checkbox>
            <el-checkbox v-model="anteChecks.breathingNormal">呼吸正常</el-checkbox>
            <el-checkbox v-model="anteChecks.spiritNormal">精神状态正常</el-checkbox>
            <el-checkbox v-model="anteChecks.skinNormal">皮肤外观正常</el-checkbox>
            <el-checkbox v-model="anteChecks.excrementNormal">排泄物正常</el-checkbox>
            <el-checkbox v-model="anteChecks.earTagMatch">耳标与申报一致</el-checkbox>
            <el-checkbox v-model="anteChecks.noEpidemicSign">无疫病征兆</el-checkbox>
          </div>
          <div style="margin-top:10px">
            <el-input v-model="anteRemark" placeholder="查验意见（选填）" size="small" />
          </div>
          <div style="margin-top:12px">
            <el-button type="success" :disabled="!anteCheckPassed" @click="submitAnteCheck">提交宰前检查</el-button>
          </div>
        </el-card>

        <!-- 宰后检疫中 -->
        <el-card v-if="isPostMortemChecking" class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>宰后检疫</strong><el-tag v-if="postCheckPassed" type="success" size="small" style="float:right">合格</el-tag><el-tag v-else type="warning" size="small" style="float:right">未完成</el-tag></template>
          <el-form label-position="left" label-width="120px" size="small" style="margin-bottom:12px">
            <el-form-item label="实际屠宰数量"><el-input-number v-model="postForm.qualifiedQuantity" :min="0" /> 头</el-form-item>
            <el-form-item label="合格胴体数量"><el-input-number v-model="postForm.qualifiedQuantity" :min="0" disabled /> 头</el-form-item>
            <el-form-item label="不合格数量"><el-input-number v-model="postForm.unqualifiedQuantity" :min="0" /> 头</el-form-item>
            <el-form-item label="产品重量"><el-input-number v-model="postForm.productWeight" :min="0" /> kg</el-form-item>
          </el-form>
          <el-divider content-position="left">检疫检查清单</el-divider>
          <div class="site-check-list">
            <el-checkbox v-model="postChecks.carcassInspection">胴体检查合格</el-checkbox>
            <el-checkbox v-model="postChecks.visceralInspection">内脏检查合格</el-checkbox>
            <el-checkbox v-model="postChecks.lymphNodeInspection">淋巴结检查合格</el-checkbox>
            <el-checkbox v-model="postChecks.parasiticInspection">寄生虫检查合格</el-checkbox>
            <el-checkbox v-model="postChecks.trichinellaInspection">旋毛虫检查合格</el-checkbox>
            <el-checkbox v-model="postChecks.overallJudgment">综合判定合格</el-checkbox>
          </div>
          <div style="margin-top:10px">
            <el-input v-model="postRemark" placeholder="检疫意见（选填）" size="small" />
          </div>
          <div style="margin-top:12px">
            <el-button type="success" :disabled="!postCheckPassed" @click="submitPostCheck">提交宰后检疫</el-button>
          </div>
        </el-card>

        <!-- 待产品出证 -->
        <el-card v-if="isPendingProductCert" class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>产品出证</strong></template>
          <el-form label-position="left" label-width="120px" size="small">
            <el-form-item label="产品名称"><el-input v-model="certForm.productName" /></el-form-item>
            <el-form-item label="产品批次号"><el-input v-model="certForm.productBatchNo" placeholder="请输入产品批次号" /></el-form-item>
            <el-form-item label="产品重量"><el-input-number v-model="certForm.weight" :min="0" /> kg</el-form-item>
            <el-form-item label="标志类型">
              <el-radio-group v-model="certForm.markType">
                <el-radio value="card_ring">卡环标志</el-radio>
                <el-radio value="sticker">标签标志</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="使用对象"><el-input v-model="certForm.useObject" /></el-form-item>
          </el-form>
          <div style="margin-top:12px">
            <el-button type="success" @click="openCertDialog">确认出证</el-button>
          </div>
        </el-card>

        <!-- 已出证 -->
        <el-card v-if="isProductCertIssued" class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>出证信息</strong></template>
          <div class="cert-summary">
            <div class="cert-summary-icon">
              <el-icon size="48" color="#67c23a"><Document /></el-icon>
            </div>
            <h3>产品检疫证明已出具</h3>
            <div class="info-list compact" style="text-align:left;margin-top:12px">
              <p><span>证明编号</span><b>{{ productCert?.certificateNo || '-' }}</b></p>
              <p><span>产品名称</span><b>{{ productCert?.productName || '-' }}</b></p>
              <p><span>产品重量</span><b>{{ productCert?.weight || '-' }} kg</b></p>
              <p><span>签发兽医</span><b>{{ productCert?.issuedBy || '-' }}</b></p>
              <p><span>签发日期</span><b>{{ formatTime(productCert?.issuedAt) }}</b></p>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px">
              <el-button type="success" style="flex:1" @click="openViewCertDialog">查看产品证</el-button>
              <el-button type="primary" style="flex:1" @click="threeCertDialog = true">查看三证关联</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- ========== 右栏：产品出证与三证关联 ========== -->
      <div class="col-side">
        <!-- 肉品品质检验合格证摘要 -->
        <el-card class="panel-card compact-card">
          <template #header><strong>肉品品质检验合格证</strong></template>
          <template v-if="meatCert">
            <div class="info-list compact">
              <p><span>证明编号</span><b>{{ meatCert.certificateNo }}</b></p>
              <p><span>产品名称</span><b>{{ meatCert.productName }}</b></p>
              <p><span>重量</span><b>{{ meatCert.weight }} kg</b></p>
              <p><span>检验员</span><b>{{ meatCert.inspector }}</b></p>
              <p><span>检验结论</span><b><el-tag :type="meatCert.conclusion === '合格' ? 'success' : 'danger'" size="small">{{ meatCert.conclusion || '-' }}</el-tag></b></p>
              <p><span>签发日期</span><b>{{ formatTime(meatCert.issuedAt) }}</b></p>
            </div>
          </template>
          <el-empty v-else description="暂未出具" :image-size="40" />
        </el-card>

        <!-- 动物产品检疫证明预览 -->
        <el-card class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>动物产品检疫证明</strong></template>
          <template v-if="productCert">
            <div class="info-list compact">
              <p><span>证明编号</span><b>{{ productCert.certificateNo }}</b></p>
              <p><span>产品名称</span><b>{{ productCert.productName }}</b></p>
              <p><span>重量</span><b>{{ productCert.weight }} kg</b></p>
              <p><span>签发兽医</span><b>{{ productCert.issuedBy }}</b></p>
              <p><span>签发日期</span><b>{{ formatTime(productCert.issuedAt) }}</b></p>
            </div>
          </template>
          <el-empty v-else description="暂未出具" :image-size="40" />
        </el-card>

        <!-- 检疫验讫标志使用情况 -->
        <el-card class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>检疫验讫标志</strong></template>
          <template v-if="productCert?.markRangeStart">
            <div class="info-list compact">
              <p><span>标志类型</span><b>{{ certForm.markType === 'card_ring' ? '卡环标志' : '标签标志' }}</b></p>
              <p><span>标志编号段</span><b>{{ productCert.markRangeStart }}~{{ productCert.markRangeEnd }}</b></p>
              <p><span>使用数量</span><b>{{ markUsage?.used || '-' }}</b></p>
              <p><span>库存数量</span><b>{{ markUsage?.inStock || '-' }}</b></p>
            </div>
          </template>
          <el-empty v-else description="暂未使用" :image-size="40" />
        </el-card>

        <!-- 三证关联状态 -->
        <el-card class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>三证关联状态</strong></template>
          <template v-if="threeCertLink">
            <div class="info-list compact">
              <p><span>关联状态</span><b><el-tag type="success" size="small">已关联</el-tag></b></p>
              <p><span>动物检疫证</span><b>{{ relatedCert?.certificateNo || '-' }}</b></p>
              <p><span>产品检疫证</span><b>{{ productCert?.certificateNo || '-' }}</b></p>
              <p><span>肉品品质证</span><b>{{ meatCert?.certificateNo || '-' }}</b></p>
              <p><span>关联时间</span><b>{{ formatTime(threeCertLink.linkedAt) }}</b></p>
            </div>
          </template>
          <el-empty v-else description="暂未关联" :image-size="40" />
        </el-card>
      </div>
    </div>

    <!-- ========== 弹窗：出证确认 ========== -->
    <el-dialog v-model="certDialog" title="确认出证" width="580px" :close-on-click-modal="false">
      <div class="cert-document">
        <div class="cert-header">
          <div class="cert-emblem">&#9733;</div>
          <h2>动物产品检疫合格证明</h2>
          <p class="cert-subtitle">Animal Product Quarantine Certificate</p>
        </div>
        <div class="cert-body">
          <div class="cert-no-row">
            <span>证号：{{ previewCertNo }}</span>
          </div>
          <table class="cert-table">
            <tr><td class="label">产品名称</td><td>{{ certForm.productName }}</td><td class="label">产品重量</td><td>{{ certForm.weight }} kg</td></tr>
            <tr><td class="label">产品批次号</td><td>{{ certForm.productBatchNo || '-' }}</td><td class="label">标志类型</td><td>{{ certForm.markType === 'card_ring' ? '卡环标志' : '标签标志' }}</td></tr>
            <tr><td class="label">屠宰企业</td><td colspan="3">{{ entryRecord?.slaughterhouseName || '-' }}</td></tr>
            <tr><td class="label">签发兽医</td><td>官方兽医 王敏</td><td class="label">签发日期</td><td>{{ formatTime(new Date().toISOString()) }}</td></tr>
            <tr><td class="label">关联动物证编号</td><td colspan="3">{{ relatedCert?.certificateNo || '-' }}</td></tr>
            <tr><td class="label">关联肉品品质证</td><td colspan="3">{{ meatCert?.certificateNo || '-' }}</td></tr>
            <tr><td class="label">标志编号段</td><td colspan="3">{{ productCert?.markRangeStart || '-' }}~{{ productCert?.markRangeEnd || '-' }}</td></tr>
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
        <el-button type="success" @click="issueProductCert">确认出证</el-button>
      </template>
    </el-dialog>

    <!-- ========== 弹窗：查看已出证证书 ========== -->
    <el-dialog v-model="viewCertDialog" title="动物产品检疫合格证明" width="580px">
      <div class="cert-document">
        <div class="cert-header">
          <div class="cert-emblem">&#9733;</div>
          <h2>动物产品检疫合格证明</h2>
          <p class="cert-subtitle">Animal Product Quarantine Certificate</p>
        </div>
        <div class="cert-body">
          <div class="cert-no-row">
            <span>证号：{{ productCert?.certificateNo || '-' }}</span>
          </div>
          <table class="cert-table">
            <tr><td class="label">产品名称</td><td>{{ productCert?.productName || '-' }}</td><td class="label">产品重量</td><td>{{ productCert?.weight || '-' }} kg</td></tr>
            <tr><td class="label">产品批次号</td><td>{{ productCert?.productBatchNo || '-' }}</td><td class="label">标志类型</td><td>{{ certForm.markType === 'card_ring' ? '卡环标志' : '标签标志' }}</td></tr>
            <tr><td class="label">屠宰企业</td><td colspan="3">{{ entryRecord?.slaughterhouseName || '-' }}</td></tr>
            <tr><td class="label">签发兽医</td><td>{{ productCert?.issuedBy || '-' }}</td><td class="label">签发日期</td><td>{{ formatTime(productCert?.issuedAt) }}</td></tr>
            <tr><td class="label">关联动物证编号</td><td colspan="3">{{ relatedCert?.certificateNo || '-' }}</td></tr>
            <tr><td class="label">关联肉品品质证</td><td colspan="3">{{ meatCert?.certificateNo || '-' }}</td></tr>
            <tr><td class="label">标志编号段</td><td colspan="3">{{ productCert?.markRangeStart || '-' }}~{{ productCert?.markRangeEnd || '-' }}</td></tr>
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

    <!-- ========== 弹窗：三证查看 ========== -->
    <el-dialog v-model="threeCertDialog" title="三证关联信息" width="700px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="动物检疫合格证明">
          <template v-if="relatedCert">
            <div>{{ relatedCert.certificateNo }} | {{ relatedCert.animalType }} | {{ relatedCert.quantity }}头 | {{ relatedCert.origin }} → {{ relatedCert.destination }}</div>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="动物产品检疫合格证明">
          <template v-if="productCert">
            <div>{{ productCert.certificateNo }} | {{ productCert.productName }} | {{ productCert.weight }}kg | {{ productCert.issuedBy }}</div>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="肉品品质检验合格证">
          <template v-if="meatCert">
            <div>{{ meatCert.certificateNo }} | {{ meatCert.productName }} | {{ meatCert.weight }}kg | {{ meatCert.inspector }}</div>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="关联时间">{{ threeCertLink ? formatTime(threeCertLink.linkedAt) : '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="threeCertDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ========== 弹窗：退回补正 ========== -->
    <el-dialog v-model="returnDialog" title="退回补正" width="520px">
      <el-form label-position="top">
        <el-form-item label="退回原因">
          <el-input v-model="returnReason" type="textarea" :rows="4" placeholder="请填写退回原因，屠宰企业将看到此内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialog = false">取消</el-button>
        <el-button type="danger" :disabled="!returnReason.trim()" @click="handleReturn">确认退回</el-button>
      </template>
    </el-dialog>
  </section>
  <el-empty v-else description="未找到申报" />
</template>

<style scoped>
.audit-layout {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 三栏布局 */
.three-col-layout {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 8px;
  align-items: start;
}

.col-side,
.col-main {
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

/* 核验结果列表 */
.check-list-compact {
  display: grid;
  gap: 4px;
}
.check-row-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 0;
}

/* 现场查验 */
.site-check-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.site-check-list .el-checkbox { margin-right: 0; font-size: 13px; }

/* 出证信息 */
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
  width: 110px;
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

@media (max-width: 1100px) {
  .three-col-layout {
    grid-template-columns: 1fr;
  }
}
</style>
