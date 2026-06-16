<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
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

const meatCert = computed(() =>
  productBatch.value
    ? store.data.meatQualityCertificates.find((c) => (c as any).productBatchId === productBatchId.value || c.id === productBatchId.value) || null
    : null
)

const quarantineCert = computed(() => {
  const certNo = productBatch.value?.quarantineCertificateId || productBatch.value?.sourceAnimalCertificateNo || slaughterApplication.value?.quarantineCertificateId
  if (!certNo) return null
  return store.data.quarantineCertificates.find((c) => c.id === certNo || c.certificateNo === certNo) || null
})

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

const isProductCertIssued = computed(() => productBatch.value?.productCertStatus === 'issued')

const conclusionLabelMap: Record<string, string> = {
  passed: '合格', failed: '不合格', partial_failed: '部分不合格', harmless: '需无害化处理',
}
const postCheckStatusLabelMap: Record<string, string> = {
  not_started: '待检疫', pending: '待检疫', in_progress: '检疫中',
  passed: '合格', failed: '不合格', partial_failed: '部分不合格', harmless_required: '需无害化处理',
}
const postCheckStatusTypeMap: Record<string, string> = {
  not_started: 'info', pending: 'warning', in_progress: 'info',
  passed: 'success', failed: 'danger', partial_failed: 'warning', harmless_required: 'danger',
}

function formatTime(t: string | undefined | null) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN', { hour12: false })
}

const certViewTab = ref('animal')
const certViewDialogVisible = ref(false)
</script>

<template>
  <section v-if="productBatch" class="audit-layout">
    <el-card class="panel-card">
      <div class="card-header-line">
        <div>
          <h2>宰后检疫详情</h2>
          <p class="sub-desc">查看宰后同步检疫结果及产品出证信息。</p>
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
    </el-card>

    <div class="three-col-layout">
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
            <p><span>产品数量</span><b>{{ productBatch.productQuantity }}片</b></p>
            <p><span>产品重量</span><b>{{ productBatch.productWeight }} kg</b></p>
          </div>
        </el-card>
        <el-card class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>上游来源信息</strong></template>
          <div class="info-list compact">
            <p><span>动物检疫合格证明编号</span><b>{{ quarantineCert?.certificateNo || '-' }}</b></p>
            <p><span>宰前检查编号</span><b>{{ anteCheck?.checkNo || '-' }}</b></p>
            <p><span>宰前检查结论</span><b><el-tag :type="anteCheck?.conclusion === 'passed' ? 'success' : 'danger'" size="small">{{ anteCheck?.conclusion === 'passed' ? '通过' : anteCheck?.conclusion || '-' }}</el-tag></b></p>
            <p><span>宰前检查时间</span><b>{{ formatTime(anteCheck?.checkTime) }}</b></p>
            <p><span>官方兽医</span><b>{{ anteCheck?.officialVet || '王敏' }}</b></p>
          </div>
        </el-card>
      </div>

      <div class="col-main">
        <el-card class="panel-card compact-card">
          <template #header><strong>宰后同步检疫结果</strong></template>
          <div class="ante-check-form" v-if="checkDetail?.items?.length">
            <div v-for="(item, idx) in checkDetail.items" :key="idx" class="ante-check-row readonly">
              <div class="ante-check-label">{{ idx + 1 }}. {{ item.label }}</div>
              <el-tag :type="item.result === 'abnormal' ? 'danger' : 'success'" size="small">{{ item.result === 'abnormal' ? '不合格' : '合格' }}</el-tag>
            </div>
          </div>
          <el-empty v-else description="暂无检疫记录" :image-size="40" />
          <el-divider v-if="checkDetail" />
          <div class="info-list compact" v-if="checkDetail">
            <p><span>检疫结论</span><b><el-tag :type="checkDetail.conclusion === 'passed' ? 'success' : 'danger'" size="small">{{ conclusionLabelMap[checkDetail.conclusion] || checkDetail.conclusion }}</el-tag></b></p>
            <p><span>不合格数量</span><b>{{ checkDetail.unqualifiedQuantity || 0 }}</b></p>
            <p><span>无害化处理数量</span><b>{{ checkDetail.harmlessQuantity || 0 }}</b></p>
            <p><span>检疫时间</span><b>{{ formatTime(checkDetail.checkTime) }}</b></p>
            <p><span>官方兽医</span><b>{{ checkDetail.officialVet || '王敏' }}</b></p>
          </div>
        </el-card>

        <el-card v-if="isProductCertIssued" class="panel-card compact-card" style="margin-top:8px">
          <template #header><strong>产品检疫出证</strong></template>
          <el-tag type="success" size="large">动物产品检疫证明已出具</el-tag>
          <div class="info-list compact" style="margin-top:12px">
            <p><span>产品证编号</span><b>{{ store.data.productCertificates.find((c: any) => c.slaughterApplicationId === productBatch.slaughterApplicationId)?.certificateNo || 'DWCP202606160001' }}</b></p>
            <p><span>签发兽医</span><b>王敏</b></p>
            <p><span>签发时间</span><b>{{ formatTime(new Date().toISOString()) }}</b></p>
          </div>
        </el-card>
      </div>

      <div class="col-right">
        <el-card class="panel-card compact-card">
          <template #header><strong>证书查看</strong></template>
          <el-tabs v-model="certViewTab" type="card" size="small">
            <el-tab-pane v-if="isProductCertIssued" label="产品证" name="product">
              <div class="cert-preview-box"><img :src="productCertImg" class="cert-preview-img" /></div>
            </el-tab-pane>
            <el-tab-pane label="动物检疫合格证明" name="animal">
              <div class="cert-preview-box"><img :src="animalCertImg" class="cert-preview-img" /></div>
            </el-tab-pane>
            <el-tab-pane label="肉品品质检验合格证" name="meat">
              <div class="cert-preview-box"><img :src="meatQualityCertImg" class="cert-preview-img" /></div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>
  </section>
  <el-empty v-else description="未找到产品批次" />
</template>

<style scoped>
.audit-layout { display: flex; flex-direction: column; gap: 0; }
.card-header-line { display: flex; justify-content: space-between; align-items: flex-start; }
.card-header-line h2 { margin: 0 0 4px 0; font-size: 18px; }
.sub-desc { color: #909399; font-size: 12px; margin: 0 0 8px 0; }
.batch-badge { font-size: 13px; color: #303133; }
.batch-badge b { color: #409eff; }
.three-col-layout { display: grid; grid-template-columns: 25% 45% 30%; gap: 8px; align-items: start; }
.col-left, .col-main, .col-right { display: flex; flex-direction: column; gap: 0; }
.compact-card :deep(.el-card__header) { padding: 8px 12px; font-size: 13px; }
.compact-card :deep(.el-card__body) { padding: 8px 12px; }
.info-list.compact p { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px solid #f5f5f5; font-size: 12px; line-height: 1.6; }
.info-list.compact p span { color: #909399; flex-shrink: 0; }
.info-list.compact p b { color: #303133; font-weight: 500; text-align: right; }
.ante-check-form { display: flex; flex-direction: column; gap: 6px; }
.ante-check-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #fafafa; border-radius: 4px; gap: 8px; }
.ante-check-label { font-size: 12px; font-weight: 500; color: #303133; white-space: nowrap; }
.cert-preview-box { background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 12px; text-align: center; }
.cert-preview-img { max-width: 100%; max-height: 420px; display: block; margin: 0 auto; }
@media (max-width: 1200px) { .three-col-layout { grid-template-columns: 1fr; } }
</style>