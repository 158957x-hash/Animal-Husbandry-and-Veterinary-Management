<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { MarkType } from '../../domain/models'
import certImage from '../../../image/动物检疫证书.png'

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
const statusLabelMap: Record<string, string> = {
  submitted_pending_accept: '已提交待受理',
  accepted_pending_pre_check: '已受理/待宰前检查',
  pre_check_passed: '宰前检查通过',
  pre_check_failed: '宰前检查不通过',
  auto_slaughter_completed: '已自动生成屠宰完成记录',
  post_product_generated: '已生成宰后产品批次',
  post_check_passed: '宰后检疫合格',
  post_check_failed: '宰后检疫不合格',
  quality_cert_generated: '肉品品质检验合格证已生成',
  product_cert_pending: '待产品出证',
  product_cert_issued: '已出产品证',
  mark_used: '已使用检疫验讫标志',
  completed: '已完成',
  returned: '已退回',
  abnormal: '异常',
}

const isPendingAccept = computed(() => application.value?.status === 'submitted_pending_accept')
const isAcceptedPendingPreCheck = computed(() => application.value?.status === 'accepted_pending_pre_check')
const isPreCheckPassed = computed(() => application.value?.status === 'pre_check_passed')
const isPostProductGenerated = computed(() => application.value?.status === 'post_product_generated')
const isPostCheckPassed = computed(() => application.value?.status === 'post_check_passed')
const isQualityCertGenerated = computed(() => application.value?.status === 'quality_cert_generated')
const isProductCertPending = computed(() => application.value?.status === 'product_cert_pending')
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

/* ---- 宰前检查表单 ---- */
interface AnteCheckItem {
  label: string
  result: 'normal' | 'abnormal' | ''
  remark: string
}
const anteCheckItems = ref<AnteCheckItem[]>([
  { label: '动物精神状态是否正常', result: '', remark: '' },
  { label: '临床表现是否正常', result: '', remark: '' },
  { label: '是否存在疑似疫病症状', result: '', remark: '' },
  { label: '是否存在异常死亡', result: '', remark: '' },
  { label: '是否存在急宰动物', result: '', remark: '' },
  { label: '数量是否与申报一致', result: '', remark: '' },
  { label: '耳标抽查是否一致', result: '', remark: '' },
  { label: '待宰圈卫生是否符合要求', result: '', remark: '' },
  { label: '装卸及待宰情况是否符合要求', result: '', remark: '' },
])
const anteCheckConclusion = ref('')
const anteCheckConclusionReason = ref('')

/* ---- 宰后产品批次 ---- */
const postProductBatches = computed(() => {
  if (!application.value) return []
  return store.data.postProductBatches?.filter((b: any) => b.slaughterApplicationId === application.value!.id) || []
})

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

function openCertDialog() {
  if (!certForm.productName || !certForm.weight || !certForm.productBatchNo) {
    return ElMessage.warning('请填写完整的产品出证信息')
  }
  certDialog.value = true
}

/* ---- 已出证查看证书弹窗 ---- */
const viewCertDialog = ref(false)

function openViewCertDialog() {
  viewCertDialog.value = true
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

async function handleAnteCheckPass() {
  if (!application.value) return
  if (anteCheckItems.value.some((item) => !item.result)) return ElMessage.warning('请完成所有宰前检查项')
  await store.submitAnteMortemCheckDetail({
    slaughterApplicationId: application.value.id,
    items: anteCheckItems.value.map((item) => ({
      label: item.label,
      result: (item.result || 'normal') as 'normal' | 'abnormal',
      remark: item.remark,
      attachment: '',
    })),
    conclusion: 'passed',
    conclusionReason: anteCheckConclusionReason.value,
  })
  ElMessage.success('宰前检查已通过')
  router.push('/vet/slaughter-todos')
}

async function handleAnteCheckFail() {
  if (!application.value) return
  if (anteCheckItems.value.some((item) => !item.result)) return ElMessage.warning('请完成所有宰前检查项')
  if (!anteCheckConclusion.value) return ElMessage.warning('请选择检查结论')
  if (!anteCheckConclusionReason.value) return ElMessage.warning('不通过时请填写结论原因')
  await store.submitAnteMortemCheckDetail({
    slaughterApplicationId: application.value.id,
    items: anteCheckItems.value.map((item) => ({
      label: item.label,
      result: (item.result || 'normal') as 'normal' | 'abnormal',
      remark: item.remark,
      attachment: '',
    })),
    conclusion: 'failed',
    conclusionReason: anteCheckConclusionReason.value,
  })
  ElMessage.success('宰前检查不通过，已记录')
  router.push('/vet/slaughter-todos')
}

async function handleSaveAnteCheck() {
  if (!application.value) return
  if (!anteCheckConclusion.value) return ElMessage.warning('请选择宰前检查结论')
  await store.submitAnteMortemCheckDetail({
    slaughterApplicationId: application.value.id,
    items: anteCheckItems.value.map((item) => ({
      label: item.label,
      result: (item.result || 'normal') as 'normal' | 'abnormal',
      remark: item.remark,
      attachment: '',
    })),
    conclusion: (anteCheckConclusion.value || 'failed') as 'passed' | 'failed' | 'partial_exception' | 'harmless',
    conclusionReason: anteCheckConclusionReason.value,
  })
  ElMessage.success('检查记录已保存')
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
    <el-card class="gov-compact-card">
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
      <!-- ========== 左栏：申报内容（与屠宰端一致） ========== -->
      <div class="col-side">
        <!-- 一、关联待宰批次 -->
        <el-card class="gov-compact-card compact-card">
          <template #header><strong>关联待宰批次</strong></template>
          <div class="info-list compact">
            <p><span>待宰批次编号</span><b>{{ batch?.batchNo || '-' }}</b></p>
            <p><span>入场登记编号</span><b>{{ entryRecord?.entryNo || '-' }}</b></p>
            <p><span>动物检疫合格证明编号</span><b>{{ relatedCert?.certificateNo || '-' }}</b></p>
            <p><span>来源养殖场</span><b>{{ entryRecord?.originFarm || '-' }}</b></p>
            <p><span>动物种类</span><b>{{ batch?.animalType || application.animalType || '-' }}</b></p>
            <p><span>实到数量</span><b>{{ batch?.entryQuantity || application.quantity }} 头</b></p>
            <p><span>耳标号段</span><b>{{ batch?.earTagRange || entryRecord?.earTagRange || '-' }}</b></p>
            <p><span>待宰圈编号</span><b>{{ batch?.waitingPenNo || '-' }}</b></p>
            <p><span>入场时间</span><b>{{ formatTime(batch?.entryTime || batch?.createdAt) }}</b></p>
            <p><span>入场经办人</span><b>{{ entryRecord?.operator || entryRecord?.checkedBy || '-' }}</b></p>
            <p><span>当前状态</span><b><el-tag type="warning" size="small">已提交待受理</el-tag></b></p>
          </div>
        </el-card>

        <!-- 二、动物证与入场信息 -->
        <el-card class="gov-compact-card compact-card" style="margin-top:8px">
          <template #header><strong>动物证与入场信息</strong></template>
          <div v-if="relatedCert" class="info-list compact">
            <p><span>动物检疫合格证明编号</span><b>{{ relatedCert.certificateNo }}</b></p>
            <p><span>启运地</span><b>{{ relatedCert.origin }}</b></p>
            <p><span>目的地</span><b>{{ relatedCert.destination }}</b></p>
            <p><span>承运车辆</span><b>{{ relatedCert.vehiclePlateNo || '-' }}</b></p>
            <p><span>承运人</span><b>{{ relatedCert.carrier || '-' }}</b></p>
            <p><span>出证官方兽医</span><b>{{ relatedCert.issuedBy || '-' }}</b></p>
            <p><span>出证时间</span><b>{{ formatTime(relatedCert.validFrom) }}</b></p>
            <p><span>有效期至</span><b>{{ formatTime(relatedCert.validTo) }}</b></p>
          </div>
          <el-empty v-else description="暂无动物证信息" :image-size="40" />
        </el-card>

        <!-- 三、申报条件 -->
        <el-card class="gov-compact-card compact-card" style="margin-top:8px">
          <template #header><strong>申报条件</strong></template>
          <div class="condition-grid">
            <div class="cond-row"><span>入场查验状态</span><el-tag :type="entryRecord?.status === 'entry_passed' ? 'success' : 'danger'" size="small">{{ entryRecord?.status === 'entry_passed' ? '已通过' : '未通过' }}</el-tag></div>
            <div class="cond-row"><span>动物证状态</span><el-tag :type="!!relatedCert && new Date(relatedCert!.validTo).getTime() > Date.now() ? 'success' : 'danger'" size="small">{{ !!relatedCert && new Date(relatedCert!.validTo).getTime() > Date.now() ? '有效' : '过期' }}</el-tag></div>
            <div class="cond-row"><span>非瘟检测</span><el-tag :type="application.africanSwineFeverResult === 'negative' ? 'success' : 'danger'" size="small">{{ application.africanSwineFeverResult === 'negative' ? '阴性' : '阳性' }}</el-tag></div>
            <div class="cond-row"><span>违禁药物检测</span><el-tag :type="application.bannedDrugResult === 'negative' ? 'success' : 'danger'" size="small">{{ application.bannedDrugResult === 'negative' ? '阴性' : '阳性' }}</el-tag></div>
          </div>
        </el-card>

        <!-- 四、自检资料 -->
        <el-card class="gov-compact-card compact-card" style="margin-top:8px">
          <template #header><strong>自检资料</strong></template>
          <div class="self-check-section">
            <div class="section-title">非洲猪瘟检测</div>
            <div class="info-list compact">
              <p><span>检测结果</span><b><el-tag :type="application.africanSwineFeverResult === 'negative' ? 'success' : 'danger'" size="small">{{ application.africanSwineFeverResult === 'negative' ? '阴性（合格）' : '阳性（不合格）' }}</el-tag></b></p>
              <p><span>检测时间</span><b>{{ formatTime(application.africanSwineFeverTestTime) }}</b></p>
              <p><span>检测人员</span><b>{{ application.africanSwineFeverTestPerson || '-' }}</b></p>
              <p><span>检测报告</span><b><el-tag type="success" size="small">已上传</el-tag></b></p>
            </div>
            <div class="section-title" style="margin-top:10px">违禁药物自检</div>
            <div class="info-list compact">
              <p><span>检测结果</span><b><el-tag :type="application.bannedDrugResult === 'negative' ? 'success' : 'danger'" size="small">{{ application.bannedDrugResult === 'negative' ? '阴性（合格）' : '阳性（不合格）' }}</el-tag></b></p>
              <p><span>检测时间</span><b>{{ formatTime(application.bannedDrugTestTime) }}</b></p>
              <p><span>检测人员</span><b>{{ application.bannedDrugTestPerson || '-' }}</b></p>
              <p><span>自检报告</span><b><el-tag type="success" size="small">已上传</el-tag></b></p>
            </div>
          </div>
        </el-card>

        <!-- 五、屠宰检疫申报信息 -->
        <el-card class="gov-compact-card compact-card" style="margin-top:8px">
          <template #header><strong>屠宰检疫申报信息</strong></template>
          <div class="info-list compact">
            <p><span>申报类型</span><b>{{ application.purpose === '急宰' ? '急宰申报' : '正常屠宰检疫' }}</b></p>
            <p><span>申报数量</span><b>{{ application.quantity }} 头</b></p>
            <p><span>计划屠宰时间</span><b>{{ formatTime(application.plannedSlaughterTime) }}</b></p>
            <p><span>联系人</span><b>{{ application.contactPerson || '-' }}</b></p>
            <p><span>联系电话</span><b>{{ application.contactPhone || '-' }}</b></p>
            <p v-if="application.remark"><span>申报说明</span><b>{{ application.remark }}</b></p>
          </div>
        </el-card>
      </div>

      <!-- ========== 中栏：官方兽医审核工作区 ========== -->
      <div class="col-main">
        <!-- 身份核验 -->
        <el-card class="gov-compact-card compact-card">
          <template #header><strong>身份核验</strong><el-tag type="success" size="small" style="float:right">已通过</el-tag></template>
          <div class="identity-row">
            <span>王敏 / AH-VET-0001 / 利辛县动物卫生监督所</span>
            <span>皖政通核验 / {{ formatTime(identityTime) }}</span>
            <span>流水号：{{ identitySerial }}</span>
          </div>
        </el-card>

        <!-- 受理条件核验 -->
        <el-card class="gov-compact-card compact-card" style="margin-top:8px">
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
        <el-card v-if="isPendingAccept" class="gov-compact-card compact-card" style="margin-top:8px">
          <template #header><strong>受理操作</strong></template>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <el-button type="success" :disabled="!acceptChecksAllPassed" @click="handleAccept">受理申报</el-button>
            <el-button @click="handleReturnModify">退回补正</el-button>
            <span v-if="!acceptChecksAllPassed" style="color:#E6A23C;font-size:12px">受理条件未全部通过，无法受理</span>
          </div>
        </el-card>

        <!-- 宰前检查 -->
        <el-card v-if="isAcceptedPendingPreCheck" class="gov-compact-card compact-card" style="margin-top:8px">
          <template #header><strong>宰前检查</strong></template>
          <div class="ante-check-form">
            <div v-for="(item, idx) in anteCheckItems" :key="idx" class="ante-check-row">
              <div class="ante-check-label">{{ idx + 1 }}. {{ item.label }}</div>
              <div class="ante-check-controls">
                <el-radio-group v-model="item.result" size="small">
                  <el-radio value="normal">正常</el-radio>
                  <el-radio value="abnormal">异常</el-radio>
                </el-radio-group>
                <el-input v-model="item.remark" placeholder="备注（选填）" size="small" style="width:160px" />
              </div>
            </div>
          </div>
          <el-divider />
          <div class="ante-check-conclusion">
            <span style="font-weight:600;margin-right:12px">宰前检查结论：</span>
            <el-radio-group v-model="anteCheckConclusion" size="small">
              <el-radio value="passed_allow">通过允许屠宰</el-radio>
              <el-radio value="failed_forbid">不通过禁止屠宰</el-radio>
              <el-radio value="partial_abnormal">部分异常</el-radio>
              <el-radio value="harmless_treatment">转无害化处理</el-radio>
            </el-radio-group>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
            <el-button type="success" @click="handleAnteCheckPass">宰前检查通过</el-button>
            <el-button type="danger" @click="handleAnteCheckFail">宰前检查不通过</el-button>
            <el-button @click="handleSaveAnteCheck">保存检查记录</el-button>
          </div>
        </el-card>

        <!-- 宰后产品批次 -->
        <el-card v-if="isPostProductGenerated" class="gov-compact-card compact-card" style="margin-top:8px">
          <template #header><strong>宰后产品批次</strong></template>
          <template v-if="postProductBatches.length > 0">
            <div v-for="(pb, pidx) in postProductBatches" :key="pb.id || pidx" class="batch-item" style="border:1px solid #ebeef5;border-radius:4px;padding:8px;margin-bottom:8px">
              <div class="info-list compact">
                <p><span>产品批次号</span><b>{{ pb.productBatchNo || '-' }}</b></p>
                <p><span>产品名称</span><b>{{ pb.productName || '-' }}</b></p>
                <p><span>数量</span><b>{{ pb.productQuantity || '-' }}</b></p>
                <p><span>重量</span><b>{{ pb.productWeight ? pb.productWeight + ' kg' : '-' }}</b></p>
                <p><span>生成时间</span><b>{{ formatTime(pb.createdAt) }}</b></p>
              </div>
            </div>
          </template>
          <el-empty v-else description="暂无产品批次数据" :image-size="40" />
        </el-card>

        <!-- 待产品出证 -->
        <el-card v-if="isProductCertPending" class="gov-compact-card compact-card" style="margin-top:8px">
          <template #header><strong>产品出证</strong></template>
          <template v-if="postProductBatches.length > 0">
            <div v-for="(pb, pidx) in postProductBatches" :key="pb.id || pidx" class="batch-item" style="border:1px solid #ebeef5;border-radius:4px;padding:8px;margin-bottom:8px">
              <div class="info-list compact">
                <p><span>产品批次号</span><b>{{ pb.productBatchNo || '-' }}</b></p>
                <p><span>产品名称</span><b>{{ pb.productName || '-' }}</b></p>
                <p><span>重量</span><b>{{ pb.productWeight ? pb.productWeight + ' kg' : '-' }}</b></p>
              </div>
            </div>
          </template>
          <el-empty v-else description="暂无产品批次数据" :image-size="40" />
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
        <el-card v-if="isProductCertIssued" class="gov-compact-card compact-card" style="margin-top:8px">
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

      <!-- ========== 右栏：产地检疫证书 ========== -->
      <div class="col-side">
        <el-card class="gov-compact-card compact-card">
          <template #header><strong>产地检疫证书</strong></template>
          <div v-if="relatedCert" style="text-align:center;padding:16px;background:#fff;border:1px solid #e0e0e0;border-radius:4px">
            <img :src="certImage" alt="动物检疫合格证明" style="width:100%;max-width:260px;display:block;margin:0 auto" />
            <div class="info-list compact" style="margin-top:12px;text-align:left">
              <p><span>证号</span><b>{{ relatedCert.certificateNo }}</b></p>
              <p><span>启运地</span><b>{{ relatedCert.origin }}</b></p>
              <p><span>目的地</span><b>{{ relatedCert.destination }}</b></p>
              <p><span>有效期至</span><b>{{ formatTime(relatedCert.validTo) }}</b></p>
            </div>
          </div>
          <el-empty v-else description="暂无产地检疫证书" :image-size="40" />
        </el-card>
      </div>
    </div>

    <!-- ========== 弹窗：出证确认 ========== -->
    <el-dialog v-model="certDialog" title="确认出证" width="580px" :close-on-click-modal="false">
      <div class="cert-image-box">
        <img :src="certImage" alt="动物产品检疫合格证明" />
      </div>
      <div class="cert-image-info">
        <p><span>证号</span><b>{{ previewCertNo }}</b></p>
        <p><span>产品名称</span><b>{{ certForm.productName }}</b></p>
        <p><span>产品重量</span><b>{{ certForm.weight }} kg</b></p>
        <p><span>产品批次号</span><b>{{ certForm.productBatchNo || '-' }}</b></p>
        <p><span>标志类型</span><b>{{ certForm.markType === 'card_ring' ? '卡环标志' : '标签标志' }}</b></p>
        <p><span>屠宰企业</span><b>{{ entryRecord?.slaughterhouseName || '-' }}</b></p>
        <p><span>签发兽医</span><b>官方兽医 王敏</b></p>
        <p><span>签发日期</span><b>{{ formatTime(new Date().toISOString()) }}</b></p>
        <p><span>关联动物证编号</span><b>{{ relatedCert?.certificateNo || '-' }}</b></p>
        <p><span>关联肉品品质证</span><b>{{ meatCert?.certificateNo || '-' }}</b></p>
        <p><span>标志编号段</span><b>{{ productCert?.markRangeStart || '-' }}~{{ productCert?.markRangeEnd || '-' }}</b></p>
      </div>
      <template #footer>
        <el-button @click="certDialog = false">取消</el-button>
        <el-button type="success" @click="issueProductCert">确认出证</el-button>
      </template>
    </el-dialog>

    <!-- ========== 弹窗：查看已出证证书 ========== -->
    <el-dialog v-model="viewCertDialog" title="动物产品检疫合格证明" width="580px">
      <div class="cert-image-box">
        <img :src="certImage" alt="动物产品检疫合格证明" />
      </div>
      <div class="cert-image-info">
        <p><span>证号</span><b>{{ productCert?.certificateNo || '-' }}</b></p>
        <p><span>产品名称</span><b>{{ productCert?.productName || '-' }}</b></p>
        <p><span>产品重量</span><b>{{ productCert?.weight || '-' }} kg</b></p>
        <p><span>产品批次号</span><b>{{ productCert?.productBatchNo || '-' }}</b></p>
        <p><span>屠宰企业</span><b>{{ entryRecord?.slaughterhouseName || '-' }}</b></p>
        <p><span>签发兽医</span><b>{{ productCert?.issuedBy || '-' }}</b></p>
        <p><span>签发日期</span><b>{{ formatTime(productCert?.issuedAt) }}</b></p>
        <p><span>关联动物证编号</span><b>{{ relatedCert?.certificateNo || '-' }}</b></p>
        <p><span>关联肉品品质证</span><b>{{ meatCert?.certificateNo || '-' }}</b></p>
        <p><span>标志编号段</span><b>{{ productCert?.markRangeStart || '-' }}~{{ productCert?.markRangeEnd || '-' }}</b></p>
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
  grid-template-columns: 320px 1fr 280px;
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

/* 宰前检查表单 */
.ante-check-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ante-check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f5f5f5;
}
.ante-check-label {
  font-size: 12px;
  color: #303133;
  min-width: 170px;
}
.ante-check-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.ante-check-conclusion {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  padding: 4px 0;
}

/* 申报条件网格 */
.condition-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
}
.cond-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 2px 0;
}
.cond-row span {
  color: #909399;
}

/* 自检资料分区 */
.self-check-section {
  font-size: 12px;
}
.section-title {
  font-weight: 600;
  color: #303133;
  font-size: 12px;
  padding-bottom: 4px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
}

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
  justify-content: flex-start;
  align-items: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #d4c5a0;
}
.cert-qr img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  border: 1px solid #d4c5a0;
  border-radius: 4px;
}

@media (max-width: 1100px) {
  .three-col-layout {
    grid-template-columns: 1fr;
  }
}
</style>
