<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const searchQuery = ref('')

const searchResult = computed(() => {
  const q = searchQuery.value.trim()
  if (!q) return null

  // 在三证关联中查找
  const link = store.data.threeCertificateLinks.find((l) => {
    const animalCert = store.data.quarantineCertificates.find((c) => c.id === l.animalCertificateId)
    const productCert = store.data.productCertificates.find((c) => c.id === l.productCertificateId)
    const meatCert = store.data.meatQualityCertificates.find((c) => c.id === l.meatQualityCertificateId)
    return (
      animalCert?.certificateNo === q ||
      productCert?.certificateNo === q ||
      meatCert?.certificateNo === q ||
      l.animalCertificateId === q ||
      l.productCertificateId === q ||
      l.meatQualityCertificateId === q
    )
  })

  if (!link) return null

  const animalCert = store.data.quarantineCertificates.find((c) => c.id === link.animalCertificateId)
  const productCert = store.data.productCertificates.find((c) => c.id === link.productCertificateId)
  const meatCert = store.data.meatQualityCertificates.find((c) => c.id === link.meatQualityCertificateId)

  return { link, animalCert, productCert, meatCert }
})

const relatedMarks = computed(() => {
  if (!searchResult.value) return []
  const productCertId = searchResult.value.productCert?.id
  if (!productCertId) return []
  return store.data.quarantineMarks.filter((m) => m.productCertificateId === productCertId)
})
</script>

<template>
  <section class="stack">
    <div class="page-header">
      <h2>三证关联追溯</h2>
      <p>通过动物证编号、产品证编号或肉品品质证编号查询三证关联信息</p>
    </div>

    <el-card class="panel-card">
      <template #header><strong>证照查询</strong></template>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input
          v-model="searchQuery"
          placeholder="输入动物证编号 / 产品证编号 / 肉品品质证编号"
          clearable
          style="max-width: 480px;"
        />
      </div>
    </el-card>

    <template v-if="searchResult">
      <div class="page-grid" style="grid-template-columns: repeat(3, 1fr);">
        <el-card class="panel-card">
          <template #header><strong>动物检疫合格证明</strong></template>
          <div v-if="searchResult.animalCert" class="info-list">
            <p><span>证书编号</span><b>{{ searchResult.animalCert.certificateNo }}</b></p>
            <p><span>动物种类</span><b>{{ searchResult.animalCert.animalType }}</b></p>
            <p><span>数量</span><b>{{ searchResult.animalCert.quantity }}</b></p>
            <p><span>产地</span><b>{{ searchResult.animalCert.origin }}</b></p>
            <p><span>目的地</span><b>{{ searchResult.animalCert.destination }}</b></p>
            <p><span>车牌号</span><b>{{ searchResult.animalCert.vehiclePlateNo }}</b></p>
            <p><span>签发人</span><b>{{ searchResult.animalCert.issuedBy }}</b></p>
            <p><span>有效期起</span><b>{{ formatTime(searchResult.animalCert.validFrom) }}</b></p>
            <p><span>有效期止</span><b>{{ formatTime(searchResult.animalCert.validTo) }}</b></p>
          </div>
          <el-empty v-else description="未找到动物检疫合格证明" />
        </el-card>

        <el-card class="panel-card">
          <template #header><strong>动物产品检疫证明</strong></template>
          <div v-if="searchResult.productCert" class="info-list">
            <p><span>证书编号</span><b>{{ searchResult.productCert.certificateNo }}</b></p>
            <p><span>产品名称</span><b>{{ searchResult.productCert.productName }}</b></p>
            <p><span>重量 kg</span><b>{{ searchResult.productCert.weight }}</b></p>
            <p><span>签发人</span><b>{{ searchResult.productCert.issuedBy }}</b></p>
            <p><span>签发时间</span><b>{{ formatTime(searchResult.productCert.issuedAt) }}</b></p>
            <p v-if="searchResult.productCert.markRangeStart"><span>标志起号</span><b>{{ searchResult.productCert.markRangeStart }}</b></p>
            <p v-if="searchResult.productCert.markRangeEnd"><span>标志止号</span><b>{{ searchResult.productCert.markRangeEnd }}</b></p>
          </div>
          <el-empty v-else description="未找到动物产品检疫证明" />
        </el-card>

        <el-card class="panel-card">
          <template #header><strong>肉品品质检验合格证</strong></template>
          <div v-if="searchResult.meatCert" class="info-list">
            <p><span>证书编号</span><b>{{ searchResult.meatCert.certificateNo }}</b></p>
            <p><span>产品名称</span><b>{{ searchResult.meatCert.productName }}</b></p>
            <p><span>重量 kg</span><b>{{ searchResult.meatCert.weight }}</b></p>
            <p><span>检验人</span><b>{{ searchResult.meatCert.inspector }}</b></p>
            <p><span>签发时间</span><b>{{ formatTime(searchResult.meatCert.issuedAt) }}</b></p>
            <p v-if="searchResult.meatCert.conclusion"><span>检验结论</span><b>{{ searchResult.meatCert.conclusion }}</b></p>
            <p v-if="searchResult.meatCert.qualifiedQuantity != null"><span>合格数量</span><b>{{ searchResult.meatCert.qualifiedQuantity }}</b></p>
            <p v-if="searchResult.meatCert.unqualifiedQuantity != null"><span>不合格数量</span><b>{{ searchResult.meatCert.unqualifiedQuantity }}</b></p>
          </div>
          <el-empty v-else description="未找到肉品品质检验合格证" />
        </el-card>
      </div>

      <el-card class="panel-card">
        <template #header><strong>关联检疫标志使用记录</strong></template>
        <el-table :data="relatedMarks" stripe>
          <el-table-column prop="markNo" label="标志编号" min-width="160" />
          <el-table-column label="标志类型" width="100">
            <template #default="scope">{{ scope.row.markType === 'card_ring' ? '卡环式' : '粘贴式' }}</template>
          </el-table-column>
          <el-table-column prop="ownerOrg" label="所属单位" min-width="140" />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'used' ? 'success' : scope.row.status === 'in_stock' ? 'info' : 'warning'" size="small">
                {{ scope.row.status === 'used' ? '已使用' : scope.row.status === 'in_stock' ? '在库' : scope.row.status === 'voided' ? '已作废' : scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="使用时间" width="180">
            <template #default="scope">{{ formatTime(scope.row.usedAt) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!relatedMarks.length" description="暂无关联检疫标志记录" />
      </el-card>
    </template>

    <el-card v-else-if="searchQuery.trim()" class="panel-card">
      <el-empty description="未找到匹配的三证关联记录，请检查编号是否正确" />
    </el-card>
  </section>
</template>
