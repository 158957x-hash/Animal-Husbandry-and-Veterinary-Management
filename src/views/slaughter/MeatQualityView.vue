<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { SlaughterBatch, MeatQualityCertificate } from '../../domain/models'

const store = useAppStore()
const dialogVisible = ref(false)
const currentBatch = ref<SlaughterBatch | null>(null)

const form = reactive({
  productBatchNo: '',
  productName: '',
  weight: 0,
  inspector: '',
  conclusion: 'qualified' as 'qualified' | 'unqualified',
  qualifiedQuantity: 0,
  unqualifiedQuantity: 0,
})

const eligibleBatches = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'post_mortem_passed' || item.status === 'pending_product_cert'))
const completedBatches = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'meat_quality_certificate_issued'))

function getMeatCert(batchId: string): MeatQualityCertificate | undefined {
  return store.data.meatQualityCertificates.find((item) => item.batchId === batchId)
}

function openDialog(batch: SlaughterBatch) {
  currentBatch.value = batch
  form.productBatchNo = `CP-${Date.now()}`
  form.productName = batch.animalType === '猪' ? '白条肉' : '肉品'
  form.weight = batch.qualifiedCarcassQuantity * 85
  form.inspector = ''
  form.conclusion = 'qualified'
  form.qualifiedQuantity = batch.qualifiedCarcassQuantity
  form.unqualifiedQuantity = batch.unqualifiedQuantity
  dialogVisible.value = true
}

async function submitCertificate() {
  if (!currentBatch.value) return
  if (!form.inspector || !form.productBatchNo) {
    ElMessage.warning('请填写完整的检验信息')
    return
  }
  if (form.conclusion === 'unqualified') {
    ElMessage.warning('检验结论为不合格，该批次禁止产品出证，需进行无害化处理')
    return
  }
  await store.createMeatQualityCertificateExtended({
    batchId: currentBatch.value.id,
    quarantineCertificateId: currentBatch.value.quarantineCertificateId,
    productBatchNo: form.productBatchNo,
    productName: form.productName,
    weight: form.weight,
    inspector: form.inspector,
    conclusion: form.conclusion === 'qualified' ? '合格' : '不合格',
    qualifiedQuantity: form.qualifiedQuantity,
    unqualifiedQuantity: form.unqualifiedQuantity,
  })
  ElMessage.success('肉品品质检验合格证已出证')
  dialogVisible.value = false
}
</script>

<template>
  <div class="page-grid">
    <div class="topbar">
      <h1>肉品品质检验</h1>
    </div>

    <el-card class="panel-card">
      <template #header>
        <div class="card-header-line">
          <b>待检验批次</b>
          <small>对宰后检疫通过的批次进行肉品品质检验，合格后方可出证</small>
        </div>
      </template>
      <el-table :data="eligibleBatches" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="batchNo" label="批次编号" min-width="140" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="qualifiedCarcassQuantity" label="合格胴体数" width="120" />
        <el-table-column prop="unqualifiedQuantity" label="不合格数量" width="110" />
        <el-table-column prop="waitingPenNo" label="待宰圈号" width="100" />
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="row.status === 'post_mortem_passed' ? 'success' : 'warning'" size="small">
              {{ row.status === 'post_mortem_passed' ? '宰后检疫通过' : '待出产品证' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openDialog(row)">填报肉品品质检验</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!eligibleBatches.length" description="暂无待检验批次" />
    </el-card>

    <el-card class="panel-card">
      <template #header><b>已完成检验记录</b></template>
      <el-table :data="completedBatches" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="batchNo" label="批次编号" min-width="140" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column label="产品批次号" min-width="140">
          <template #default="{ row }">{{ getMeatCert(row.id)?.productBatchNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="检验结论" width="110">
          <template #default="{ row }">
            <el-tag :type="getMeatCert(row.id)?.conclusion === '合格' ? 'success' : 'danger'" size="small">
              {{ getMeatCert(row.id)?.conclusion || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="检验人员" width="100">
          <template #default="{ row }">{{ getMeatCert(row.id)?.inspector || '-' }}</template>
        </el-table-column>
        <el-table-column label="产品重量(kg)" width="110">
          <template #default="{ row }">{{ getMeatCert(row.id)?.weight || '-' }}</template>
        </el-table-column>
        <el-table-column label="出证时间" min-width="160">
          <template #default="{ row }">{{ formatTime(getMeatCert(row.id)?.issuedAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!completedBatches.length" description="暂无已完成检验记录" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="填报肉品品质检验" width="580px" destroy-on-close>
      <el-form label-position="top" v-if="currentBatch">
        <el-form-item label="批次编号">
          <el-input :model-value="currentBatch.batchNo" disabled />
        </el-form-item>

        <el-form-item label="产品批次号" required>
          <el-input v-model="form.productBatchNo" placeholder="请输入产品批次号" />
        </el-form-item>

        <el-form-item label="产品名称" required>
          <el-input v-model="form.productName" placeholder="请输入产品名称" />
        </el-form-item>

        <el-form-item label="产品重量(kg)" required>
          <el-input-number v-model="form.weight" :min="0" class="full-width" />
        </el-form-item>

        <el-form-item label="检验人员" required>
          <el-input v-model="form.inspector" placeholder="请输入检验人员姓名" />
        </el-form-item>

        <el-form-item label="检验结论" required>
          <el-radio-group v-model="form.conclusion">
            <el-radio-button label="qualified">合格</el-radio-button>
            <el-radio-button label="unqualified">不合格</el-radio-button>
          </el-radio-group>
          <el-alert v-if="form.conclusion === 'unqualified'" title="检验结论为不合格，该批次禁止产品出证，需进行无害化处理" type="error" :closable="false" show-icon style="margin-top: 8px" />
        </el-form-item>

        <el-form-item label="合格数量">
          <el-input-number v-model="form.qualifiedQuantity" :min="0" class="full-width" />
        </el-form-item>

        <el-form-item label="不合格数量">
          <el-input-number v-model="form.unqualifiedQuantity" :min="0" class="full-width" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="form.conclusion === 'unqualified'" @click="submitCertificate">提交检验结果</el-button>
      </template>
    </el-dialog>
  </div>
</template>
