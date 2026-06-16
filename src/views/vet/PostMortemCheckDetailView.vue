<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import type { SlaughterEntryRecord, WaitingSlaughterBatch } from '@/domain/models'
import animalCertImg from '../../../image/动物检疫证书.png'
import meatQualityCertImg from '../../../image/肉品品质检验合格证.png'
import productCertImg from '../../../image/产品证.png'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const productBatchId = computed(() => route.params.productBatchId as string)

const productBatch = computed(() =>
  store.data.postProductBatches.find((p) => p.id === productBatchId.value) || null
)

const slaughterApplication = computed(() =>
  productBatch.value
    ? store.data.slaughterApplications.find((a) => a.id === productBatch.value!.slaughterApplicationId) || null
    : null
)

const slaughterRecord = computed(() =>
  productBatch.value
    ? store.data.slaughterRecords.find((r) => r.id === productBatch.value!.slaughterRecordId) || null
    : null
)

const anteCheck = computed(() =>
  slaughterApplication.value
    ? store.data.anteMortemCheckDetails.find((c) => c.slaughterApplicationId === slaughterApplication.value!.id) || null
    : null
)

const meatQualityCheck = computed(() =>
  store.data.meatQualityCheckDetails.find((c) => c.productBatchId === productBatchId.value) || null
)

const quarantineCert = computed(() => {
  const certNo = productBatch.value?.quarantineCertificateId || productBatch.value?.sourceAnimalCertificateNo || slaughterApplication.value?.quarantineCertificateId
  if (!certNo) return null
  return store.data.quarantineCertificates.find((c) => c.id === certNo || c.certificateNo === certNo) || null
})

const meatCert = computed(() =>
  productBatch.value
    ? store.data.meatQualityCertificates.find((c) => (c as any).productBatchId === productBatchId.value || c.id === productBatchId.value) || null
    : null
)

const entryRecord = computed(() => {
  const entryId = slaughterApplication.value?.entryRecordId || slaughterApplication.value?.entryCheckId
  if (!entryId) return null
  return store.data.slaughterEntryRecords.find((e: SlaughterEntryRecord) => e.id === entryId) || null
})

const waitingBatch = computed(() => {
  const batchId = slaughterApplication.value?.batchId || slaughterRecord.value?.waitingBatchId
  if (!batchId) return null
  return store.data.waitingSlaughterBatches.find((b: WaitingSlaughterBatch) => b.id === batchId) || null
})

const checkDetail = computed(() =>
  store.data.postMortemCheckDetails.find((c) => c.productBatchId === productBatchId.value) || null
)

const isEditable = computed(() => {
  const status = checkDetail.value?.status || productBatch.value?.postCheckStatus
  return !status || status === 'not_started' || status === 'pending'
})

const isInProgress = computed(() => {
  const status = checkDetail.value?.status || productBatch.value?.postCheckStatus
  return status === 'in_progress'
})

const isCompleted = computed(() => {
  const status = checkDetail.value?.status || productBatch.value?.postCheckStatus
  return status === 'passed' || status === 'failed' || status === 'partial_failed' || status === 'harmless_required'
})

const isPostCheckPassed = computed(() => {
  const status = checkDetail.value?.status || productBatch.value?.postCheckStatus
  return status === 'passed'
})

const canIssueCert = computed(() => {
  if (!productBatch.value) return false
  if (!isPostCheckPassed.value) return false
  if (meatQualityCheck.value?.conclusion !== 'qualified' && meatCert.value?.conclusion !== '合格') return false
  if (!quarantineCert.value) return false
  if (!productBatch.value.productQuantity || !productBatch.value.productWeight) return false
  return true
})

const isProductCertIssued = computed(() => {
  return productBatch.value?.productCertStatus === 'issued'
})

// ============ 宰后检疫项目 ============
interface CheckItem {
  label: string
  result: 'normal' | 'abnormal' | ''
  remark: string
}
function initCheckItems(): CheckItem[] {
  if (checkDetail.value?.items?.length) {
    return checkDetail.value.items.map((item) => ({
      label: item.label,
      result: (item.result || '') as 'normal' | 'abnormal' | '',
      remark: item.remark || '',
    }))
  }
  return [
    { label: '头部检疫', result: '', remark: '' },
    { label: '体表检疫', result: '', remark: '' },
    { label: '胴体检疫', result: '', remark: '' },
    { label: '内脏检疫', result: '', remark: '' },
    { label: '淋巴结检查', result: '', remark: '' },
    { label: '病变组织检查', result: '', remark: '' },
    { label: '寄生虫检查', result: '', remark: '' },
    { label: '异常病变记录', result: '', remark: '' },
    { label: '不合格产品数量', result: '', remark: '' },
    { label: '无害化处理数量', result: '', remark: '' },
  ]
}
const checkItems = ref<CheckItem[]>(initCheckItems())
const checkConclusion = ref(checkDetail.value?.conclusion || '')
const unqualifiedQuantity = ref(checkDetail.value?.unqualifiedQuantity || 0)
const harmlessQuantity = ref(checkDetail.value?.harmlessQuantity || 0)
const checkRemark = ref(checkDetail.value?.conclusionReason || '')

function quickFillNormal() {
  checkItems.value.forEach((item) => {
    item.result = 'normal'
  })
}

function addCheckItem() {
  checkItems.value.push({ label: '', result: '', remark: '' })
}

function removeCheckItem(idx: number) {
  checkItems.value.splice(idx, 1)
}

async function handleSave() {
  if (!productBatch.value) return
  await store.submitPostMortemCheckDetail({
    productBatchId: productBatch.value.id,
    items: checkItems.value.map((item) => ({
      label: item.label,
      result: (item.result || 'normal') as 'normal' | 'abnormal',
      remark: item.remark,
      attachment: '',
    })),
    conclusion: checkConclusion.value ? (checkConclusion.value as 'passed' | 'failed' | 'partial_failed' | 'harmless') : 'passed',
    conclusionReason: checkRemark.value,
    unqualifiedQuantity: unqualifiedQuantity.value,
    harmlessQuantity: harmlessQuantity.value,
  })
  ElMessage.success('宰后检疫记录已保存')
}

async function handlePass() {
  if (!productBatch.value) return
  if (checkItems.value.some((item) => !item.result)) {
    return ElMessage.warning('请完成所有检疫项目')
  }
  if (checkItems.value.some((item) => item.result === 'abnormal')) {
    return ElMessage.warning('存在异常项目，不能直接判定合格')
  }
  await store.submitPostMortemCheckDetail({
    productBatchId: productBatch.value.id,
    items: checkItems.value.map((item) => ({
      label: item.label,
      result: item.result as 'normal' | 'abnormal',
      remark: item.remark,
      attachment: '',
    })),
    conclusion: 'passed',
    conclusionReason: checkRemark.value,
    unqualifiedQuantity: 0,
    harmlessQuantity: 0,
  })
  ElMessage.success('宰后检疫合格')
}

async function handleFail() {
  if (!productBatch.value) return
  if (checkItems.value.some((item) => !item.result)) {
    return ElMessage.warning('请完成所有检疫项目')
  }
  if (checkConclusion.value !== 'failed' && checkConclusion.value !== 'partial_failed') {
    return ElMessage.warning('请选择结论为"不合格"或"部分不合格"')
  }
  await store.submitPostMortemCheckDetail({
    productBatchId: productBatch.value.id,
    items: checkItems.value.map((item) => ({
      label: item.label,
      result: item.result as 'normal' | 'abnormal',
      remark: item.remark,
      attachment: '',
    })),
    conclusion: checkConclusion.value as 'failed' | 'partial_failed',
    conclusionReason: checkRemark.value,
    unqualifiedQuantity: unqualifiedQuantity.value,
    harmlessQuantity: harmlessQuantity.value,
  })
  ElMessage.success('不合格登记已保存')
}

async function handleHarmless() {
  if (!productBatch.value) return
  if (checkItems.value.some((item) => !item.result)) {
    return ElMessage.warning('请完成所有检疫项目')
  }
  await store.submitPostMortemCheckDetail({
    productBatchId: productBatch.value.id,
    items: checkItems.value.map((item) => ({
      label: item.label,
      result: item.result as 'normal' | 'abnormal',
      remark: item.remark,
      attachment: '',
    })),
    conclusion: 'harmless',
    conclusionReason: checkRemark.value,
    unqualifiedQuantity: unqualifiedQuantity.value,
    harmlessQuantity: harmlessQuantity.value,
  })
  ElMessage.success('已转无害化处理')
  router.push('/vet/post-mortem-check')
}

// ============ 产品出证 ============
const issueDialogVisible = ref(false)
const issueForm = ref({
  destination: '',
  vehiclePlateNo: '',
})

function openIssueDialog() {
  issueDialogVisible.value = true
}

async function handleIssueCert() {
  if (!productBatch.value) return
  try {
    await store.issueProductCertificateForBatch({
      productBatchId: productBatch.value.id,
      productName: productBatch.value.productName,
      productQuantity: productBatch.value.productQuantity,
      productWeight: productBatch.value.productWeight,
      slaughterhouseName: productBatch.value.slaughterhouseName,
      destination: issueForm.value.destination || '本地市场',
      vehiclePlateNo: issueForm.value.vehiclePlateNo || '皖A·12345',
    })
    ElMessage.success('动物产品检疫证明已出具')
    issueDialogVisible.value = false
    router.push(`/vet/post-mortem-check/${productBatch.value.id}/detail`)
  } catch (e: any) {
    ElMessage.error(e?.message || '出证失败，请检查出证条件是否满足')
  }
}

// ============ 证书查看 ============
const certViewTab = ref('animal')
const certViewDialogVisible = ref(false)

function viewAnimalCert() {
  certViewTab.value = 'animal'
  certViewDialogVisible.value = true
}
function viewMeatCert() {
  certViewTab.value = 'meat'
  certViewDialogVisible.value = true
}
function viewProductCert() {
  certViewTab.value = 'product'
  certViewDialogVisible.value = true
}

// ============ 工具函数 ============
function formatTime(t: string | undefined | null) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN', { hour12: false })
}

const conclusionLabelMap: Record<string, string> = {
  passed: '合格',
  failed: '不合格',
  partial_failed: '部分不合格',
  harmless: '需无害化处理',
}

const postCheckStatusLabelMap: Record<string, string> = {
  not_started: '待检疫',
  pending: '待检疫',
  in_progress: '检疫中',
  passed: '合格',
  failed: '不合格',
  partial_failed: '部分不合格',
  harmless_required: '需无害化处理',
}

const postCheckStatusTypeMap: Record<string, string> = {
  not_started: 'info',
  pending: 'warning',
  in_progress: 'info',
  passed: 'success',
  failed: 'danger',
  partial_failed: 'warning',
  harmless_required: 'danger',
}
</script>

<template>
  <section v-if="productBatch" class="audit-layout">
    <!-- ========== 顶部标题栏 ========== -->
    <el-card class="panel-card">
      <div class="card-header-line">
        <div>
          <h2>宰后同步检疫与产品出证</h2>
          <p class="sub-desc">核验产品批次、动物检疫合格证明和肉品品质检验合格证，完成宰后同步检疫后出具动物产品检疫证明。</p>
          <div class="batch-badge">
            <span>产品批次编号：</span><b>{{ productBatch.productBatchNo }}</b>
            <el-tag :type="isProductCertIssued ? 'success' : postCheckStatusTypeMap[checkDetail?.status || productBatch.postCheckStatus || 'pending']" size="small" style="margin-left:12px">
              {{ isProductCertIssued ? '动物产品检疫证明已出具' : postCheckStatusLabelMap[checkDetail?.status || productBatch.postCheckStatus || 'pending'] }}
            </el-tag>
          </div>
        </div>
        <div class="action-inline">
          <el-button @click="router.push('/vet/post-mortem-check')">返回列表</el-button>
        </div>
      </div>
      <!-- 流程状态条 -->
      <div class="status-bar">
        <div class="status-step" :class="{ active: true }">
          <span class="step-dot"></span>产品批次已生成
        </div>
        <div class="status-step" :class="{ active: meatQualityCheck?.conclusion === 'qualified' || !!meatCert }">
          <span class="step-dot"></span>肉品品质合格证已生成
        </div>
        <div class="status-step" :class="{ active: isPostCheckPassed || isCompleted }">
          <span class="step-dot"></span>宰后检疫办理中
        </div>
        <div class="status-step" :class="{ active: isProductCertIssued }">
          <span class="step-dot"></span>{{ isProductCertIssued ? '已出具' : '产品证待出具' }}
        </div>
      </div>
    </el-card>

    <!-- ========== 三栏布局 ========== -->
    <div class="three-col-layout">
      <!-- ========== 左栏：产品批次与来源信息 ========== -->
      <div class="col-left">
        <el-card class="panel-card compact-card">
          <template #header><strong>产品批次信息</strong></template>
          <div class="info-list compact">
            <p><span>产品批次编号</span><b>{{ productBatch.productBatchNo }}</b></p>
            <p><span>屠宰批次编号</span><b>{{ productBatch.slaughterBatchNo }}</b></p>
            <p><span>待宰批次编号</span><b>{{ waitingBatch?.batchNo || '-' }}</b></p>
            <p><span>屠宰检疫申报编号</span><b>{{ slaughterApplication?.applicationNo || '-' }}</b></p>
            <p><span>屠宰企业</span><b>{{ productBatch.slaughterhouseName }}</b></p>
            <p><span>来源养殖场</span><b>{{ entryRecord?.originFarm || quarantineCert?.origin || '-' }}</b></p>
            <p><span>动物种类</span><b>{{ productBatch.animalType }}</b></p>
            <p><span>产品名称</span><b>{{ productBatch.productName }}</b></p>
            <p><span>产品类型</span><b>{{ productBatch.productType || '胴体' }}</b></p>
            <p><span>产品数量</span><b>{{ productBatch.productQuantity }}片</b></p>
            <p><span>产品重量</span><b>{{ productBatch.productWeight }} kg</b></p>
            <p><span>屠宰完成时间</span><b>{{ formatTime(slaughterRecord?.slaughterCompletedTime) }}</b></p>
            <p><span>当前状态</span><b>
              <el-tag :type="isProductCertIssued ? 'success' : postCheckStatusTypeMap[checkDetail?.status || productBatch.postCheckStatus || 'pending']" size="small">
                {{ isProductCertIssued ? '已出产品证' : postCheckStatusLabelMap[checkDetail?.status || productBatch.postCheckStatus || 'pending'] || '待宰后检疫' }}
              </el-tag>
            </b></p>
          </div>
        </el-card>

        <el-card class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>上游来源信息</strong></template>
          <div class="info-list compact">
            <p><span>动物检疫合格证明编号</span><b>{{ quarantineCert?.certificateNo || '-' }}</b></p>
            <p><span>产地检疫申报编号</span><b>{{ quarantineCert?.applicationNo || '-' }}</b></p>
            <p><span>入场登记编号</span><b>{{ entryRecord?.entryNo || '-' }}</b></p>
            <p><span>宰前检查编号</span><b>{{ anteCheck?.checkNo || '-' }}</b></p>
            <p><span>宰前检查结论</span><b>
              <el-tag :type="anteCheck?.conclusion === 'passed' ? 'success' : 'danger'" size="small">{{ anteCheck?.conclusion === 'passed' ? '通过' : anteCheck?.conclusion || '-' }}</el-tag>
            </b></p>
            <p><span>宰前检查时间</span><b>{{ formatTime(anteCheck?.checkTime) }}</b></p>
            <p><span>官方兽医</span><b>{{ anteCheck?.officialVet || '王敏' }}</b></p>
          </div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            <el-button size="small" @click="ElMessage.info('宰前检查记录详情')">查看宰前检查记录</el-button>
            <el-button size="small" @click="ElMessage.info('入场记录详情')">查看入场记录</el-button>
          </div>
        </el-card>
      </div>

      <!-- ========== 中栏：宰后同步检疫办理 + 产品检疫出证 ========== -->
      <div class="col-main">
        <!-- 宰后检疫表单（始终可编辑） -->
        <el-card class="panel-card compact-card">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong>宰后同步检疫</strong>
              <el-tag v-if="isCompleted" :type="checkDetail?.conclusion === 'passed' ? 'success' : 'danger'" size="small" style="margin-right:8px">{{ conclusionLabelMap[checkDetail?.conclusion || ''] || '已完成' }}</el-tag>
              <el-button size="small" type="primary" link @click="quickFillNormal">快速填充合格项</el-button>
            </div>
          </template>
          <div class="info-list compact" style="margin-bottom:12px">
            <p><span>宰后检疫编号</span><b>{{ checkDetail?.checkNo || 'ZHYJ' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '00' + (productBatch?.id?.slice(-3) || '001') }}</b></p>
            <p><span>产品批次编号</span><b>{{ productBatch.productBatchNo }}</b></p>
            <p><span>官方兽医</span><b>王敏</b></p>
            <p><span>检疫时间</span><b>{{ formatTime(checkDetail?.checkTime) || new Date().toLocaleString('zh-CN', { hour12: false }) }}</b></p>
          </div>
          <el-divider content-position="left">检疫项目</el-divider>
          <div class="ante-check-form">
            <div v-for="(item, idx) in checkItems" :key="idx" class="ante-check-row">
              <div class="ante-check-label">{{ idx + 1 }}.</div>
              <div class="ante-check-controls">
                <el-input v-model="item.label" placeholder="检疫项目名称" size="small" style="width:140px" />
                <el-radio-group v-model="item.result" size="small">
                  <el-radio value="normal">合格</el-radio>
                  <el-radio value="abnormal">不合格</el-radio>
                </el-radio-group>
                <el-input v-model="item.remark" placeholder="备注" size="small" style="width:140px" />
                <el-button link type="danger" size="small" @click="removeCheckItem(idx)">删除</el-button>
              </div>
            </div>
          </div>
          <el-button size="small" type="primary" link style="margin-top:4px" @click="addCheckItem">+ 添加检疫项目</el-button>
          <el-divider />
          <div class="ante-check-conclusion">
            <span style="font-weight:600;margin-right:12px">检疫结论：</span>
            <el-radio-group v-model="checkConclusion" size="small">
              <el-radio value="passed">合格</el-radio>
              <el-radio value="failed">不合格</el-radio>
              <el-radio value="partial_failed">部分不合格</el-radio>
              <el-radio value="harmless">需无害化处理</el-radio>
            </el-radio-group>
          </div>
          <div style="margin-top:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <span style="font-size:12px;color:#606266">不合格数量：</span>
            <el-input-number v-model="unqualifiedQuantity" :min="0" size="small" style="width:120px" />
            <span style="font-size:12px;color:#606266">无害化处理数量：</span>
            <el-input-number v-model="harmlessQuantity" :min="0" size="small" style="width:120px" />
          </div>
          <div style="margin-top:8px">
            <span style="font-size:12px;color:#606266;margin-right:8px">检疫意见：</span>
            <el-input v-model="checkRemark" type="textarea" :rows="2" placeholder="填写检疫意见" size="small" />
          </div>
          <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
            <el-button type="primary" @click="handleSave">保存检疫记录</el-button>
            <el-button type="warning" @click="handleHarmless">转无害化处理</el-button>
            <el-button v-if="isPostCheckPassed && !isProductCertIssued" type="success" @click="openIssueDialog">确认出具产品证</el-button>
          </div>
        </el-card>
      </div>

      <!-- ========== 右栏：出证依据 + 证书查看 ========== -->
      <div class="col-right">
        <!-- 出证依据 -->
        <el-card class="panel-card compact-card">
          <template #header><strong>出证依据</strong></template>
          <div class="cert-basis-list">
            <!-- 动物检疫合格证明 -->
            <div class="cert-basis-item">
              <div class="basis-info">
                <span class="basis-label">动物检疫合格证明</span>
                <el-tag type="success" size="small">已出证</el-tag>
              </div>
              <div class="basis-detail" v-if="quarantineCert">
                <span>证号：{{ quarantineCert.certificateNo }}</span>
                <span>动物种类：{{ quarantineCert.animalType || '生猪' }}</span>
                <span>数量：{{ quarantineCert.quantity || productBatch.sourceAnimalQuantity }}头</span>
              </div>
              <div class="basis-detail" v-else>
                <span style="color:#f56c6c">暂未关联</span>
              </div>
            </div>
            <el-divider style="margin:8px 0" />
            <!-- 肉品品质检验合格证 -->
            <div class="cert-basis-item">
              <div class="basis-info">
                <span class="basis-label">肉品品质检验合格证</span>
                <el-tag :type="meatCert || meatQualityCheck?.conclusion === 'qualified' ? 'success' : 'info'" size="small">{{ meatCert || meatQualityCheck?.conclusion === 'qualified' ? '已生成' : '未生成' }}</el-tag>
              </div>
              <div class="basis-detail" v-if="meatCert || meatQualityCheck">
                <span>合格证编号：{{ meatCert?.certificateNo || meatQualityCheck?.checkNo || '-' }}</span>
                <span>产品名称：{{ meatCert?.productName || productBatch.productName }}</span>
                <span>产品重量：{{ meatCert?.weight || productBatch.productWeight }}kg</span>
                <span>检验结论：{{ meatCert?.conclusion || meatQualityCheck?.conclusion || '-' }}</span>
              </div>
              <div class="basis-detail" v-else>
                <span style="color:#f56c6c">暂未生成</span>
              </div>
            </div>
            <el-divider style="margin:8px 0" />
            <!-- 宰后同步检疫 -->
            <div class="cert-basis-item">
              <div class="basis-info">
                <span class="basis-label">宰后同步检疫</span>
                <el-tag :type="isPostCheckPassed ? 'success' : 'warning'" size="small">{{ isPostCheckPassed ? '已合格' : isCompleted ? '不合格' : '待填写' }}</el-tag>
              </div>
              <div class="basis-detail" v-if="checkDetail">
                <span>宰后检疫编号：{{ checkDetail.checkNo }}</span>
                <span>检疫结论：{{ conclusionLabelMap[checkDetail.conclusion] || checkDetail.conclusion }}</span>
              </div>
              <div class="basis-detail" v-else>
                <span style="color:#e6a23c">待填写</span>
              </div>
            </div>
            <el-divider style="margin:8px 0" />
            <!-- 出证依据结论 -->
            <div class="basis-conclusion">
              <span>出证依据结论：</span>
              <el-tag :type="canIssueCert ? 'success' : 'warning'" size="small">{{ canIssueCert ? '条件满足，可出具产品证' : isProductCertIssued ? '产品证已出具' : '条件未满足，暂不可出证' }}</el-tag>
            </div>
          </div>
        </el-card>

        <!-- 证书查看区 -->
        <el-card class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>证书查看</strong></template>
          <el-tabs v-model="certViewTab" type="card" size="small">
            <el-tab-pane v-if="isProductCertIssued" label="产品证" name="product">
              <div class="cert-preview-box">
                <img :src="productCertImg" alt="动物产品检疫证明" class="cert-preview-img" />
              </div>
            </el-tab-pane>
            <el-tab-pane label="动物检疫合格证明" name="animal">
              <div class="cert-preview-box">
                <img :src="animalCertImg" alt="动物检疫合格证明" class="cert-preview-img" />
              </div>
            </el-tab-pane>
            <el-tab-pane label="肉品品质检验合格证" name="meat">
              <div class="cert-preview-box">
                <img :src="meatQualityCertImg" alt="肉品品质检验合格证" class="cert-preview-img" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>

    <!-- ========== 确认出具产品证弹窗 ========== -->
    <el-dialog v-model="issueDialogVisible" title="确认出具动物产品检疫证明" width="900px" top="5vh">
      <div class="issue-dialog-body">
        <div class="issue-dialog-left">
          <div class="cert-preview-box">
            <img :src="productCertImg" alt="动物产品检疫证明" class="cert-preview-img" />
          </div>
        </div>
        <div class="issue-dialog-right">
          <div class="info-list compact">
            <p><span>产品批次编号</span><b>{{ productBatch.productBatchNo }}</b></p>
            <p><span>产品名称</span><b>{{ productBatch.productName }}</b></p>
            <p><span>产品数量</span><b>{{ productBatch.productQuantity }}片</b></p>
            <p><span>产品重量</span><b>{{ productBatch.productWeight }} kg</b></p>
            <p><span>动物检疫合格证明编号</span><b>{{ quarantineCert?.certificateNo || '-' }}</b></p>
            <p><span>肉品品质检验合格证编号</span><b>{{ meatCert?.certificateNo || '-' }}</b></p>
            <p><span>宰后检疫结论</span><b><el-tag type="success" size="small">合格</el-tag></b></p>
            <p><span>签发兽医</span><b>王敏</b></p>
            <p><span>签发单位</span><b>皖北标准化屠宰中心</b></p>
            <p><span>签发时间</span><b>{{ new Date().toLocaleString('zh-CN', { hour12: false }) }}</b></p>
          </div>
          <el-divider />
          <div class="issue-conditions">
            <div class="cond-row"><span>动物检疫合格证明</span><el-tag type="success" size="small">已存在</el-tag></div>
            <div class="cond-row"><span>肉品品质检验合格证</span><el-tag type="success" size="small">已生成</el-tag></div>
            <div class="cond-row"><span>宰后同步检疫</span><el-tag type="success" size="small">合格</el-tag></div>
            <div class="cond-row"><span>产品批次信息</span><el-tag type="success" size="small">完整</el-tag></div>
          </div>
          <div style="margin-top:12px">
            <span style="font-size:12px;color:#606266;margin-right:8px">去向单位：</span>
            <el-input v-model="issueForm.destination" placeholder="请输入去向单位" size="small" style="width:200px" />
            <span style="font-size:12px;color:#606266;margin-left:12px;margin-right:8px">承运车辆：</span>
            <el-input v-model="issueForm.vehiclePlateNo" placeholder="请输入车牌号" size="small" style="width:160px" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="issueDialogVisible = false">取消</el-button>
        <el-button @click="issueDialogVisible = false">返回修改</el-button>
        <el-button type="primary" @click="handleIssueCert">确认出证</el-button>
      </template>
    </el-dialog>

    <!-- ========== 证书查看弹窗 ========== -->
    <el-dialog v-model="certViewDialogVisible" :title="certViewTab === 'product' ? '动物产品检疫证明' : certViewTab === 'animal' ? '动物检疫合格证明' : '肉品品质检验合格证'" width="700px" top="5vh">
      <div class="cert-preview-box">
        <img :src="certViewTab === 'product' ? productCertImg : certViewTab === 'animal' ? animalCertImg : meatQualityCertImg" alt="证书" class="cert-preview-img" />
      </div>
      <template #footer>
        <el-button type="primary" @click="certViewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </section>
  <el-empty v-else description="未找到产品批次" />
</template>

<style scoped>
.audit-layout {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.card-header-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.card-header-line h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
}
.sub-desc {
  color: #909399;
  font-size: 12px;
  margin: 0 0 8px 0;
}
.batch-badge {
  font-size: 13px;
  color: #303133;
}
.batch-badge b {
  color: #409eff;
}

/* 流程状态条 */
.status-bar {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  flex-wrap: wrap;
}
.status-step {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #c0c4cc;
  padding: 0 12px;
  position: relative;
}
.status-step::after {
  content: '→';
  margin-left: 12px;
  color: #c0c4cc;
}
.status-step:last-child::after {
  content: '';
}
.status-step.active {
  color: #303133;
  font-weight: 500;
}
.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c0c4cc;
  flex-shrink: 0;
}
.status-step.active .step-dot {
  background: #409eff;
}

/* 三栏布局 */
.three-col-layout {
  display: grid;
  grid-template-columns: 25% 45% 30%;
  gap: 8px;
  align-items: start;
}

.col-left,
.col-main,
.col-right {
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
.info-list.compact p span {
  color: #909399;
  flex-shrink: 0;
}
.info-list.compact p b {
  color: #303133;
  font-weight: 500;
  text-align: right;
}

/* 宰后检疫表单 */
.ante-check-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ante-check-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: #fafafa;
  border-radius: 4px;
  gap: 8px;
}
.ante-check-label {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
}
.ante-check-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ante-check-conclusion {
  display: flex;
  align-items: center;
  font-size: 13px;
}

/* 出证依据 */
.cert-basis-list {
  display: flex;
  flex-direction: column;
}
.cert-basis-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.basis-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.basis-label {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
}
.basis-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #606266;
}
.basis-conclusion {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
}

/* 出证条件 */
.issue-conditions {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

/* 证书预览 */
.cert-preview-box {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}
.cert-preview-img {
  max-width: 100%;
  max-height: 420px;
  display: block;
  margin: 0 auto;
}

/* 出证弹窗 */
.issue-dialog-body {
  display: flex;
  gap: 16px;
}
.issue-dialog-left {
  flex: 0 0 440px;
}
.issue-dialog-right {
  flex: 1;
  min-width: 0;
}

/* 响应式 */
@media (max-width: 1200px) {
  .three-col-layout {
    grid-template-columns: 1fr;
  }
}
</style>