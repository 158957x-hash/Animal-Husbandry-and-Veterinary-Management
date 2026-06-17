<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import QRCode from 'qrcode'
import productCertImg from '../../../image/产品证.png'
import meatQualityCertImg from '../../../image/肉品品质检验合格证.png'
import animalCertImg from '../../../image/动物检疫证书.png'

type ProductRelationStatus = 'UNLINKED' | 'LINKED'
type MarkUseStatus = 'AVAILABLE' | 'USED'
type ProductType = '胴体' | '副产品' | '包装箱' | '分割产品'
type MarkType = 'card_ring' | 'sticker'

interface ProductItem {
  productItemId: string
  productBatchId: string
  productName: string
  productType: ProductType
  quantity: string
  productWeight: number
  productCertNo: string
  meatQualityCertNo: string
  animalCertNo: string
  animalQuantity: number
  sourceFarm: string
  ownerEnterprise: string
  markCode: string
  relationStatus: ProductRelationStatus
  linkedAt: string
  linkedBy: string
}

interface UsableMark {
  markCode: string
  markType: MarkType
  applicableObject: ProductType
  ownerEnterprise: string
  status: MarkUseStatus
  usedAt: string
  usedProductItemId: string
}

interface ScanRecord {
  index: number
  markCode: string
  productItemId: string
  linkedAt: string
  result: string
}

const store = useAppStore()
const scanDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const certificateDialogVisible = ref(false)
const certificateTitle = ref('')
const certificateImage = ref('')
const scanCode = ref('')
const scanInputRef = ref()
const selectedProduct = ref<ProductItem | null>(null)
const scanRecords = ref<ScanRecord[]>([])
const traceQrCode = ref('')
const traceBaseUrl = ref('')

const operatorName = '皖北标准化屠宰中心经办人'
const currentProductCertNo = 'CPJY202606160001'
const currentProductBatchNo = 'CPPC202606160001'
const currentAnimalCertNo = 'AH-CD-202606100004'
const currentMeatQualityCertNo = 'RP202606160001'

const productItems = reactive<ProductItem[]>(createProductItems())
const usableMarks = reactive<UsableMark[]>(createUsableMarks())

watch(
  () => store.restoreVersion,
  () => resetRelationData(),
)

async function generateTraceQrCode() {
  const baseUrl = traceBaseUrl.value || getDefaultTraceUrl()
  const url = `${baseUrl}public/mark-trace`
  traceQrCode.value = await QRCode.toDataURL(url, { width: 200, margin: 1 })
}

function getDefaultTraceUrl() {
  const base = import.meta.env.BASE_URL || '/'
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:${window.location.port}${base}`
  }
  return `${window.location.origin}${base}`
}

function getTraceUrl() {
  const baseUrl = traceBaseUrl.value || getDefaultTraceUrl()
  return `${baseUrl}public/mark-trace`
}

function onTraceUrlChange() {
  generateTraceQrCode()
}

onMounted(() => {
  traceBaseUrl.value = getDefaultTraceUrl()
  generateTraceQrCode()
})

const totalCount = computed(() => productItems.length)
const linkedCount = computed(() => productItems.filter((item) => item.relationStatus === 'LINKED').length)
const unlinkedCount = computed(() => totalCount.value - linkedCount.value)
const currentPendingIndex = computed(() => {
  const index = productItems.findIndex((item) => item.relationStatus === 'UNLINKED')
  return index >= 0 ? index + 1 : '-'
})
const currentProduct = computed(() => productItems.find((item) => item.relationStatus === 'UNLINKED') || null)
const latestScanRecords = computed(() => scanRecords.value.slice(0, 10))

function createProductItems() {
  const issuedBatch = store.data.postProductBatches.find((item) => item.productCertStatus === 'issued')
  const productCert = store.data.productCertificates.find((item) => item.productBatchNo === issuedBatch?.productBatchNo)
  const meatCert = store.data.meatQualityCertificates.find((item) => item.productBatchNo === issuedBatch?.productBatchNo)
  const animalCert = store.data.quarantineCertificates.find((item) => item.id === issuedBatch?.quarantineCertificateId)
  const count = 60
  const baseWeight = 76
  return Array.from({ length: count }, (_, index) => {
    const itemIndex = index + 1
    return {
      productItemId: `${currentProductBatchNo}-${String(itemIndex).padStart(3, '0')}`,
      productBatchId: currentProductBatchNo,
      productName: '猪胴体',
      productType: '胴体' as ProductType,
      quantity: '1片',
      productWeight: baseWeight + (index % 5),
      productCertNo: productCert?.certificateNo?.replace('20260613', '20260616') || currentProductCertNo,
      meatQualityCertNo: meatCert?.certificateNo?.replace('20260613', '20260616') || currentMeatQualityCertNo,
      animalCertNo: animalCert?.certificateNo || currentAnimalCertNo,
      animalQuantity: issuedBatch?.sourceAnimalQuantity || count,
      sourceFarm: '绿丰生态养殖场',
      ownerEnterprise: issuedBatch?.slaughterhouseName || '皖北标准化屠宰中心',
      markCode: '',
      relationStatus: 'UNLINKED' as ProductRelationStatus,
      linkedAt: '',
      linkedBy: '',
    }
  })
}

function createUsableMarks() {
  return Array.from({ length: 80 }, (_, index) => {
    const itemIndex = index + 1
    return {
      markCode: `KH20260616${String(itemIndex).padStart(4, '0')}`,
      markType: 'card_ring' as MarkType,
      applicableObject: '胴体' as ProductType,
      ownerEnterprise: '皖北标准化屠宰中心',
      status: 'AVAILABLE' as MarkUseStatus,
      usedAt: '',
      usedProductItemId: '',
    }
  })
}

function resetRelationData() {
  const initialProductItems = createProductItems()
  productItems.splice(0, productItems.length, ...initialProductItems)
  const initialUsableMarks = createUsableMarks()
  usableMarks.splice(0, usableMarks.length, ...initialUsableMarks)
  scanRecords.value = []
  scanCode.value = ''
  selectedProduct.value = null
  scanDialogVisible.value = false
  detailDialogVisible.value = false
}

function relationStatusText(row: ProductItem) {
  return row.markCode ? '已关联' : '未关联'
}

function recommendedMarkType(productType: ProductType) {
  return productType === '胴体' ? 'card_ring' : 'sticker'
}

function recommendedMarkTypeText(productType: ProductType) {
  return productType === '胴体' ? '卡环式标志' : '粘贴式标志'
}

function openScanDialog() {
  scanDialogVisible.value = true
  nextTick(() => scanInputRef.value?.focus?.())
}

function pauseScan() {
  scanDialogVisible.value = false
}

function finishScan() {
  if (unlinkedCount.value === 0) ElMessage.success('本批次产品已全部完成标志关联。')
  scanDialogVisible.value = false
}

function submitScan() {
  const markCode = scanCode.value.trim()
  if (!markCode) {
    ElMessage.warning('标志编号不能为空')
    focusScanInput()
    return
  }

  const product = currentProduct.value
  if (!product) {
    ElMessage.success('本批次产品已全部完成标志关联。')
    scanCode.value = ''
    focusScanInput()
    return
  }

  if (product.markCode || product.relationStatus === 'LINKED') {
    ElMessage.warning('已关联产品不能再次绑定标志')
    focusScanInput()
    return
  }

  if (productItems.some((item) => item.markCode === markCode)) {
    ElMessage.error('该标志编号已被使用，请重新扫码。')
    focusScanInput()
    return
  }

  const mark = usableMarks.find((item) => item.markCode === markCode)
  if (!mark) {
    ElMessage.error('未查询到该标志编号，请核对后重试。')
    focusScanInput()
    return
  }

  if (mark.ownerEnterprise !== product.ownerEnterprise || mark.status !== 'AVAILABLE') {
    ElMessage.error('未查询到该标志编号，请核对后重试。')
    focusScanInput()
    return
  }

  if (mark.markType !== recommendedMarkType(product.productType)) {
    ElMessage.error(`当前产品推荐使用${recommendedMarkTypeText(product.productType)}。`)
    focusScanInput()
    return
  }

  const linkedAt = new Date().toISOString()
  product.markCode = markCode
  product.relationStatus = 'LINKED'
  product.linkedAt = linkedAt
  product.linkedBy = operatorName
  mark.status = 'USED'
  mark.usedAt = linkedAt
  mark.usedProductItemId = product.productItemId
  scanRecords.value.unshift({
    index: scanRecords.value.length + 1,
    markCode,
    productItemId: product.productItemId,
    linkedAt,
    result: '关联成功',
  })
  ElMessage.success(`标志 ${markCode} 已关联到产品 ${product.productItemId}。`)
  scanCode.value = ''
  if (unlinkedCount.value === 0) ElMessage.success('本批次产品已全部完成标志关联。')
  focusScanInput()
}

function focusScanInput() {
  nextTick(() => scanInputRef.value?.focus?.())
}

function openDetail(row: ProductItem) {
  selectedProduct.value = row
  detailDialogVisible.value = true
}

function openCertificate(title: string, image: string) {
  certificateTitle.value = title
  certificateImage.value = image
  certificateDialogVisible.value = true
}
</script>

<template>
  <section class="gov-page mark-usage-page">
    <el-card class="panel-card usage-hero-card">
      <div class="page-hero usage-hero">
        <div>
          <h2>检疫验讫标志使用</h2>
          <p>对已出具动物产品检疫证明的产品，使用扫码枪连续完成检疫验讫标志关联。</p>
        </div>
        <el-button type="primary" size="large" class="scan-primary-button" @click="openScanDialog">扫码关联</el-button>
      </div>
    </el-card>

    <div class="usage-stat-grid">
      <el-card class="usage-stat-card"><span>产品总数</span><b>{{ totalCount }}</b></el-card>
      <el-card class="usage-stat-card success"><span>已关联</span><b>{{ linkedCount }}</b></el-card>
      <el-card class="usage-stat-card warning"><span>未关联</span><b>{{ unlinkedCount }}</b></el-card>
      <el-card class="usage-stat-card"><span>当前待关联序号</span><b>{{ currentPendingIndex }}</b></el-card>
      <el-card class="usage-stat-card cert"><span>产品证编号</span><b>{{ currentProductCertNo }}</b></el-card>
    </div>

    <div v-if="linkedCount > 0" class="qr-code-section">
      <el-card class="panel-card">
        <template #header><strong>扫码查验二维码</strong></template>
        <div class="qr-code-body">
          <img v-if="traceQrCode" :src="traceQrCode" alt="扫码查验二维码" class="qr-code-image" />
          <div class="qr-code-url-row">
            <span class="qr-code-url-label">扫码地址</span>
            <el-input v-model="traceBaseUrl" size="small" class="qr-code-url-input" placeholder="例如 http://192.168.1.100:5173/Animal-Husbandry-and-Veterinary-Management/" @change="onTraceUrlChange" />
          </div>
          <p class="qr-code-hint">将上方地址改为电脑的局域网 IP 后，用手机扫码即可打开查验页面</p>
          <p class="qr-code-current"><el-tag size="small" type="info">当前二维码指向：{{ getTraceUrl() }}</el-tag></p>
        </div>
      </el-card>
    </div>

    <el-card class="panel-card product-list-card">
      <template #header><strong>产品列表</strong></template>
      <el-table :data="productItems" stripe class="full-table product-table" height="620">
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="productItemId" label="产品明细编号" min-width="190" />
        <el-table-column prop="productBatchId" label="产品批次编号" min-width="170" />
        <el-table-column prop="productName" label="产品名称" width="110" />
        <el-table-column prop="productType" label="产品类型" width="100" />
        <el-table-column prop="quantity" label="产品数量" width="100" />
        <el-table-column label="产品重量" width="100"><template #default="{ row }">{{ row.productWeight }}kg</template></el-table-column>
        <el-table-column prop="productCertNo" label="动物产品检疫证明编号" min-width="180" />
        <el-table-column prop="meatQualityCertNo" label="肉品品质检验合格证编号" min-width="190" />
        <el-table-column prop="animalCertNo" label="动物检疫合格证明编号" min-width="180" />
        <el-table-column label="标志编号" min-width="160"><template #default="{ row }">{{ row.markCode || '-' }}</template></el-table-column>
        <el-table-column label="关联状态" width="100">
          <template #default="{ row }"><el-tag :type="row.markCode ? 'success' : 'warning'" size="small">{{ relationStatusText(row) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="关联时间" min-width="170"><template #default="{ row }">{{ formatTime(row.linkedAt) }}</template></el-table-column>
        <el-table-column label="操作" width="130" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openDetail(row)">查看检疫详情</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="scanDialogVisible" title="扫码关联检疫验讫标志" width="1180px" top="5vh" destroy-on-close @opened="focusScanInput">
      <p class="scan-dialog-tip">请使用扫码枪扫描检疫验讫标志二维码，系统将按产品列表顺序自动完成关联。</p>
      <div class="scan-dialog-layout">
        <section class="scan-panel current-product-panel">
          <h3>当前待关联产品</h3>
          <template v-if="currentProduct">
            <div class="current-index">第 {{ currentPendingIndex }} 条</div>
            <p><span>产品明细编号</span><b>{{ currentProduct.productItemId }}</b></p>
            <p><span>产品名称</span><b>{{ currentProduct.productName }}</b></p>
            <p><span>产品类型</span><b>{{ currentProduct.productType }}</b></p>
            <p><span>产品重量</span><b>{{ currentProduct.productWeight }}kg</b></p>
            <p><span>产品证编号</span><b>{{ currentProduct.productCertNo }}</b></p>
          </template>
          <el-empty v-else description="本批次产品已全部完成标志关联" :image-size="80" />
        </section>

        <section class="scan-panel scan-input-panel">
          <h3>扫码输入</h3>
          <el-input ref="scanInputRef" v-model="scanCode" size="large" placeholder="请扫描或输入标志编号" clearable @keyup.enter="submitScan" />
          <p class="input-help">扫码后按回车自动关联</p>
          <div class="progress-box">
            <span>当前进度</span>
            <b>已关联 {{ linkedCount }} / 总数 {{ totalCount }}</b>
            <el-progress :percentage="Math.round((linkedCount / totalCount) * 100)" :stroke-width="12" />
          </div>
          <el-button type="primary" size="large" class="scan-submit-button" @click="submitScan">确认关联</el-button>
        </section>

        <section class="scan-panel scan-record-panel">
          <h3>已扫码记录</h3>
          <el-table :data="latestScanRecords" size="small" height="300" class="full-table">
            <el-table-column prop="index" label="序号" width="60" />
            <el-table-column prop="markCode" label="标志编号" min-width="130" />
            <el-table-column prop="productItemId" label="产品明细编号" min-width="160" />
            <el-table-column label="关联时间" min-width="140"><template #default="{ row }">{{ formatTime(row.linkedAt) }}</template></el-table-column>
            <el-table-column prop="result" label="结果" width="90" />
          </el-table>
          <el-empty v-if="!latestScanRecords.length" description="暂无扫码记录" :image-size="70" />
        </section>
      </div>
      <template #footer>
        <el-button @click="pauseScan">暂停关联</el-button>
        <el-button type="primary" @click="finishScan">完成并关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="检疫详情" width="920px" top="5vh">
      <div v-if="selectedProduct" class="detail-grid">
        <section class="detail-section">
          <h3>产品信息</h3>
          <p><span>产品明细编号</span><b>{{ selectedProduct.productItemId }}</b></p>
          <p><span>产品批次编号</span><b>{{ selectedProduct.productBatchId }}</b></p>
          <p><span>产品名称</span><b>{{ selectedProduct.productName }}</b></p>
          <p><span>产品类型</span><b>{{ selectedProduct.productType }}</b></p>
          <p><span>产品重量</span><b>{{ selectedProduct.productWeight }}kg</b></p>
          <p><span>所属屠宰企业</span><b>{{ selectedProduct.ownerEnterprise }}</b></p>
        </section>

        <section class="detail-section">
          <h3>动物产品检疫证明</h3>
          <p><span>证号</span><b>{{ selectedProduct.productCertNo }}</b></p>
          <p><span>签发兽医</span><b>官方兽医 王敏</b></p>
          <p><span>签发时间</span><b>2026/6/16 14:00:00</b></p>
          <el-button link type="primary" @click="openCertificate('动物产品检疫证明', productCertImg)">查看证书</el-button>
        </section>

        <section class="detail-section">
          <h3>肉品品质检验合格证</h3>
          <p><span>合格证编号</span><b>{{ selectedProduct.meatQualityCertNo }}</b></p>
          <p><span>检验结论</span><b>合格</b></p>
          <p><span>检验时间</span><b>2026/6/16 13:30:00</b></p>
          <el-button link type="primary" @click="openCertificate('肉品品质检验合格证', meatQualityCertImg)">查看证书</el-button>
        </section>

        <section class="detail-section">
          <h3>动物检疫合格证明</h3>
          <p><span>证号</span><b>{{ selectedProduct.animalCertNo }}</b></p>
          <p><span>来源养殖场</span><b>{{ selectedProduct.sourceFarm }}</b></p>
          <p><span>动物数量</span><b>{{ selectedProduct.animalQuantity }}</b></p>
          <el-button link type="primary" @click="openCertificate('动物检疫合格证明', animalCertImg)">查看证书</el-button>
        </section>

        <section class="detail-section wide">
          <h3>标志关联信息</h3>
          <p><span>标志编号</span><b>{{ selectedProduct.markCode || '-' }}</b></p>
          <p><span>关联状态</span><b>{{ relationStatusText(selectedProduct) }}</b></p>
          <p><span>关联时间</span><b>{{ formatTime(selectedProduct.linkedAt) }}</b></p>
          <p><span>经办人</span><b>{{ selectedProduct.linkedBy || '-' }}</b></p>
        </section>
      </div>
    </el-dialog>

    <el-dialog v-model="certificateDialogVisible" :title="certificateTitle" width="760px" top="4vh">
      <div class="certificate-preview"><img :src="certificateImage" :alt="certificateTitle" /></div>
    </el-dialog>
  </section>
</template>

<style scoped>
.mark-usage-page {
  position: relative;
}

.usage-hero-card {
  overflow: hidden;
}

.usage-hero {
  align-items: center;
}

.scan-primary-button {
  min-width: 150px;
  height: 44px;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(22, 119, 255, 0.24);
}

.usage-stat-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.usage-stat-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 86px;
}

.usage-stat-card span {
  color: #6b7280;
  font-size: 13px;
}

.usage-stat-card b {
  color: #111827;
  font-size: 26px;
  line-height: 1;
}

.usage-stat-card.success b {
  color: #16a34a;
}

.usage-stat-card.warning b {
  color: #d97706;
}

.usage-stat-card.cert b {
  font-size: 18px;
}

.qr-code-section {
  margin-top: 0;
}

.qr-code-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px 0 4px;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  border: 1px solid #e4efe8;
  border-radius: 12px;
  padding: 8px;
  background: #fff;
}

.qr-code-url-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 520px;
}

.qr-code-url-label {
  flex-shrink: 0;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
}

.qr-code-url-input {
  flex: 1;
}

.qr-code-hint {
  color: #f59e0b;
  font-size: 13px;
  margin: 0;
  text-align: center;
  max-width: 400px;
  line-height: 1.5;
}

.qr-code-current {
  margin: 0;
}

.full-table {
  width: 100%;
}

.product-list-card :deep(.el-card__body) {
  padding-top: 8px;
}

.scan-dialog-tip {
  margin: -8px 0 16px;
  color: #64748b;
}

.scan-dialog-layout {
  display: grid;
  grid-template-columns: 0.9fr 1fr 1.35fr;
  gap: 14px;
}

.scan-panel {
  min-height: 360px;
  padding: 16px;
  border: 1px solid #e5edf0;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbf9, #ffffff);
}

.scan-panel h3,
.detail-section h3 {
  margin: 0 0 14px;
  color: #12372a;
  font-size: 16px;
}

.current-index {
  display: inline-flex;
  padding: 7px 12px;
  margin-bottom: 12px;
  color: #047857;
  font-weight: 700;
  background: #dff7ea;
  border-radius: 999px;
}

.scan-panel p,
.detail-section p {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin: 0 0 12px;
  color: #64748b;
}

.scan-panel p b,
.detail-section p b {
  color: #1f2937;
  text-align: right;
}

.input-help {
  margin: 10px 0 18px;
  color: #64748b;
  font-size: 13px;
}

.progress-box {
  display: grid;
  gap: 10px;
  padding: 14px;
  margin-bottom: 18px;
  background: #f1f8f4;
  border-radius: 12px;
}

.progress-box span {
  color: #64748b;
}

.progress-box b {
  color: #12372a;
  font-size: 18px;
}

.scan-submit-button {
  width: 100%;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-section {
  padding: 16px;
  background: #f8fbf9;
  border: 1px solid #e4efe8;
  border-radius: 14px;
}

.detail-section.wide {
  grid-column: 1 / -1;
}

.certificate-preview {
  display: flex;
  justify-content: center;
  max-height: 76vh;
  overflow: auto;
  background: #f8fafc;
  border-radius: 12px;
}

.certificate-preview img {
  width: 100%;
  max-width: 680px;
  object-fit: contain;
}

:deep(.product-table .el-table__row) {
  height: 54px;
}

@media (max-width: 1280px) {
  .usage-stat-grid,
  .scan-dialog-layout,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
