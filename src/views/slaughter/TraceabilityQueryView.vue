<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { MarkType, QuarantineCertificate, ProductCertificate, MeatQualityCertificate, QuarantineMark } from '../../domain/models'

const store = useAppStore()
const searchQuery = ref('')
const loading = ref(false)

const markInfo = ref<QuarantineMark | null>(null)
const originCert = ref<QuarantineCertificate | null>(null)
const productCert = ref<ProductCertificate | null>(null)
const meatCert = ref<MeatQualityCertificate | null>(null)
const hasSearched = ref(false)

const markTypeText: Record<MarkType, string> = {
  card_ring: '卡环式',
  sticker: '粘贴式',
}

async function search() {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入检疫标志编号')
    return
  }
  loading.value = true
  hasSearched.value = true
  try {
    const result = await store.getTraceabilityByMarkNo(searchQuery.value.trim())
    if (result) {
      markInfo.value = result.mark || null
      originCert.value = result.animalCertificate || null
      productCert.value = result.productCertificate || null
      meatCert.value = result.meatQualityCertificate || null
      if (!markInfo.value && !originCert.value && !productCert.value && !meatCert.value) {
        ElMessage.info('未查询到相关溯源信息')
      }
    } else {
      markInfo.value = null
      originCert.value = null
      productCert.value = null
      meatCert.value = null
      ElMessage.info('未查询到相关溯源信息')
    }
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchQuery.value = ''
  markInfo.value = null
  originCert.value = null
  productCert.value = null
  meatCert.value = null
  hasSearched.value = false
}
</script>

<template>
  <div class="page-grid">
    <div class="topbar">
      <h1>三证扫码查询</h1>
    </div>

    <el-card class="panel-card">
      <template #header><b>检疫标志查询</b></template>
      <div class="action-inline" style="margin-bottom: 0">
        <el-input v-model="searchQuery" placeholder="请输入检疫标志编号" clearable size="large" @keyup.enter="search" />
        <el-button type="primary" size="large" :loading="loading" @click="search">查询</el-button>
        <el-button size="large" @click="resetSearch">重置</el-button>
      </div>
    </el-card>

    <template v-if="hasSearched">
      <el-card v-if="markInfo" class="panel-card">
        <template #header><b>标志信息</b></template>
        <div class="info-list">
          <p><span>标志编号</span><b>{{ markInfo.markNo }}</b></p>
          <p><span>标志类型</span><b>{{ markTypeText[markInfo.markType as MarkType] || markInfo.markType }}</b></p>
          <p><span>使用对象</span><b>{{ markInfo.productBatchNo || '-' }}</b></p>
          <p><span>屠宰批次</span><b>{{ markInfo.slaughterBatchId || '-' }}</b></p>
          <p><span>产品批次</span><b>{{ markInfo.productBatchNo || '-' }}</b></p>
          <p><span>使用时间</span><b>{{ formatTime(markInfo.usedAt) }}</b></p>
        </div>
      </el-card>

      <div class="page-grid" style="grid-template-columns: repeat(3, 1fr)">
        <el-card class="panel-card">
          <template #header><b>动物检疫合格证明</b></template>
          <div v-if="originCert" class="info-list">
            <p><span>证明编号</span><b>{{ originCert.certificateNo }}</b></p>
            <p><span>养殖场</span><b>{{ originCert.origin }}</b></p>
            <p><span>动物种类</span><b>{{ originCert.animalType }}</b></p>
            <p><span>数量</span><b>{{ originCert.quantity }}</b></p>
            <p><span>耳标号段</span><b>{{ originCert.earTagRange || '-' }}</b></p>
            <p><span>启运地</span><b>{{ originCert.origin }}</b></p>
            <p><span>目的地</span><b>{{ originCert.destination }}</b></p>
            <p><span>承运车辆</span><b>{{ originCert.vehiclePlateNo }}</b></p>
            <p><span>承运人</span><b>{{ originCert.carrier || '-' }}</b></p>
            <p><span>官方兽医</span><b>{{ originCert.issuedBy }}</b></p>
            <p><span>出证时间</span><b>{{ formatTime(originCert.validFrom) }}</b></p>
          </div>
          <el-empty v-else description="未关联动物检疫合格证明" :image-size="60" />
        </el-card>

        <el-card class="panel-card">
          <template #header><b>动物产品检疫证明</b></template>
          <div v-if="productCert" class="info-list">
            <p><span>证明编号</span><b>{{ productCert.certificateNo }}</b></p>
            <p><span>产品名称</span><b>{{ productCert.productName }}</b></p>
            <p><span>产品批次</span><b>{{ productCert.productBatchNo || '-' }}</b></p>
            <p><span>产品重量(kg)</span><b>{{ productCert.weight }}</b></p>
            <p><span>签发官方兽医</span><b>{{ productCert.issuedBy }}</b></p>
            <p><span>出证时间</span><b>{{ formatTime(productCert.issuedAt) }}</b></p>
          </div>
          <el-empty v-else description="未关联动物产品检疫证明" :image-size="60" />
        </el-card>

        <el-card class="panel-card">
          <template #header><b>肉品品质检验合格证</b></template>
          <div v-if="meatCert" class="info-list">
            <p><span>合格证编号</span><b>{{ meatCert.certificateNo }}</b></p>
            <p><span>检验人员</span><b>{{ meatCert.inspector }}</b></p>
            <p><span>检验时间</span><b>{{ formatTime(meatCert.issuedAt) }}</b></p>
            <p><span>检验结论</span><b>{{ meatCert.conclusion || '-' }}</b></p>
            <p><span>产品重量(kg)</span><b>{{ meatCert.weight }}</b></p>
            <p><span>产品批次</span><b>{{ meatCert.productBatchNo || '-' }}</b></p>
          </div>
          <el-empty v-else description="未关联肉品品质检验合格证" :image-size="60" />
        </el-card>
      </div>

      <el-empty v-if="!markInfo && !originCert && !productCert && !meatCert" description="未查询到相关溯源信息，请确认标志编号是否正确" />
    </template>

    <el-empty v-else description="请输入检疫标志编号进行溯源查询" />
  </div>
</template>
