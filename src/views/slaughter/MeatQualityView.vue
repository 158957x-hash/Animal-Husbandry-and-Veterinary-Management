<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { PostProductBatch } from '../../domain/models'

const store = useAppStore()
const dialogVisible = ref(false)
const currentBatch = ref<PostProductBatch | null>(null)

const checkItems = [
  '胴体外观',
  '肉品色泽',
  '卫生状况',
  '病害肉识别',
  '淋巴结检查',
  '内脏检查',
  '瘦肉精自检结果',
  '其他品质项目',
]

const form = reactive({
  productBatchNo: '',
  slaughterBatchNo: '',
  productName: '猪胴体',
  productType: '胴体',
  inspector: '',
  items: checkItems.map((label) => ({ label, result: 'normal' as 'normal' | 'abnormal', remark: '' })),
  conclusion: 'qualified' as 'qualified' | 'unqualified',
  unqualifiedQuantity: 0,
  unqualifiedReason: '',
  disposalMethod: '',
  remark: '',
})

const eligibleBatches = computed(() =>
  store.data.postProductBatches.filter((item) =>
    ['not_started', 'draft', 'submitted'].includes(item.meatQualityStatus),
  ),
)

const completedBatches = computed(() =>
  store.data.postProductBatches.filter((item) =>
    ['cert_generated', 'passed'].includes(item.meatQualityStatus),
  ),
)

const meatQualityStatusText: Record<string, string> = {
  not_started: '未开始',
  draft: '草稿',
  submitted: '已提交',
  passed: '已通过',
  failed: '未通过',
  cert_generated: '已出证',
}

function openDialog(batch: PostProductBatch) {
  currentBatch.value = batch
  form.productBatchNo = batch.productBatchNo
  form.slaughterBatchNo = batch.slaughterBatchNo
  form.productName = batch.productName || '猪胴体'
  form.productType = batch.productType || '胴体'
  form.inspector = ''
  form.items = checkItems.map((label) => ({ label, result: 'normal' as 'normal' | 'abnormal', remark: '' }))
  form.conclusion = 'qualified'
  form.unqualifiedQuantity = 0
  form.unqualifiedReason = ''
  form.disposalMethod = ''
  form.remark = ''
  dialogVisible.value = true
}

async function saveDraft() {
  if (!currentBatch.value) return
  await store.submitMeatQualityCheckDetail({
    productBatchId: currentBatch.value.id,
    productName: form.productName,
    productType: form.productType,
    inspector: form.inspector || '品质检验员',
    items: form.items,
    conclusion: form.conclusion,
    unqualifiedQuantity: form.conclusion === 'unqualified' ? form.unqualifiedQuantity : 0,
    unqualifiedReason: form.conclusion === 'unqualified' ? form.unqualifiedReason : '',
    disposalMethod: form.conclusion === 'unqualified' ? form.disposalMethod : '',
    remark: form.remark,
  })
  ElMessage.success('草稿已保存')
  dialogVisible.value = false
}

async function submitCheckResult() {
  if (!currentBatch.value) return
  if (!form.inspector) {
    ElMessage.warning('请填写检验人员')
    return
  }
  await store.submitMeatQualityCheckDetail({
    productBatchId: currentBatch.value.id,
    productName: form.productName,
    productType: form.productType,
    inspector: form.inspector,
    items: form.items,
    conclusion: form.conclusion,
    unqualifiedQuantity: form.conclusion === 'unqualified' ? form.unqualifiedQuantity : 0,
    unqualifiedReason: form.conclusion === 'unqualified' ? form.unqualifiedReason : '',
    disposalMethod: form.conclusion === 'unqualified' ? form.disposalMethod : '',
    remark: form.remark,
  })
  ElMessage.success('检验结果已提交')
  dialogVisible.value = false
}

async function generateCert() {
  if (!currentBatch.value) return
  if (!form.inspector) {
    ElMessage.warning('请填写检验人员')
    return
  }
  await store.submitMeatQualityCheckDetail({
    productBatchId: currentBatch.value.id,
    productName: form.productName,
    productType: form.productType,
    inspector: form.inspector,
    items: form.items,
    conclusion: form.conclusion,
    unqualifiedQuantity: form.conclusion === 'unqualified' ? form.unqualifiedQuantity : 0,
    unqualifiedReason: form.conclusion === 'unqualified' ? form.unqualifiedReason : '',
    disposalMethod: form.conclusion === 'unqualified' ? form.disposalMethod : '',
    remark: form.remark,
  })
  ElMessage.success('肉品品质检验合格证已生成')
  dialogVisible.value = false
}
</script>

<template>
  <div class="gov-page">
    <el-card class="panel-card">
      <div class="page-hero">
        <div>
          <h2>肉品品质检验</h2>
          <p>对宰后检疫通过的批次进行肉品品质检验，合格后方可进入产品出证。</p>
        </div>
      </div>
    </el-card>

    <el-card class="panel-card">
      <template #header>
        <div class="card-header-line">
          <b>待检验批次</b>
          <small>对宰后产品批次进行肉品品质检验，合格后方可出证</small>
        </div>
      </template>
      <el-table :data="eligibleBatches" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="productBatchNo" label="产品批次编号" min-width="160" />
        <el-table-column prop="slaughterBatchNo" label="屠宰批次编号" min-width="160" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="productName" label="产品名称" min-width="140" />
        <el-table-column prop="productWeight" label="产品重量(kg)" width="120" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.meatQualityStatus === 'submitted' ? 'warning' : 'info'" size="small">
              {{ meatQualityStatusText[row.meatQualityStatus] || row.meatQualityStatus }}
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
      <template #header><div class="card-title"><b>已完成检验记录</b><small>查看肉品品质检验合格证签发记录</small></div></template>
      <el-table :data="completedBatches" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="productBatchNo" label="产品批次编号" min-width="160" />
        <el-table-column prop="slaughterBatchNo" label="屠宰批次编号" min-width="160" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="productName" label="产品名称" min-width="140" />
        <el-table-column prop="productWeight" label="产品重量(kg)" width="120" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.meatQualityStatus === 'cert_generated' ? 'success' : 'info'" size="small">
              {{ meatQualityStatusText[row.meatQualityStatus] || row.meatQualityStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!completedBatches.length" description="暂无已完成检验记录" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="填报肉品品质检验" width="680px" destroy-on-close>
      <el-form v-if="currentBatch" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="产品批次编号">
              <el-input :model-value="form.productBatchNo" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="屠宰批次编号">
              <el-input :model-value="form.slaughterBatchNo" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="产品名称" required>
              <el-input v-model="form.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品类型" required>
              <el-select v-model="form.productType" class="full-width">
                <el-option label="胴体" value="胴体" />
                <el-option label="分割肉" value="分割肉" />
                <el-option label="副产品" value="副产品" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="检验人员" required>
          <el-input v-model="form.inspector" placeholder="请输入检验人员姓名" />
        </el-form-item>

        <el-form-item label="检验项目" required>
          <div class="check-items-grid">
            <div v-for="(item, idx) in form.items" :key="item.label" class="check-item-row">
              <span class="check-item-label">{{ item.label }}</span>
              <el-radio-group v-model="item.result" size="small">
                <el-radio-button label="normal">正常</el-radio-button>
                <el-radio-button label="abnormal">异常</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="检验结论" required>
          <el-radio-group v-model="form.conclusion">
            <el-radio-button label="qualified">合格</el-radio-button>
            <el-radio-button label="unqualified">不合格</el-radio-button>
          </el-radio-group>
          <el-alert v-if="form.conclusion === 'unqualified'" title="检验结论为不合格，该批次禁止产品出证，需进行无害化处理" type="error" :closable="false" show-icon class="section-alert" />
        </el-form-item>

        <template v-if="form.conclusion === 'unqualified'">
          <el-form-item label="不合格数量">
            <el-input-number v-model="form.unqualifiedQuantity" :min="0" class="full-width" />
          </el-form-item>
          <el-form-item label="不合格原因">
            <el-input v-model="form.unqualifiedReason" placeholder="请输入不合格原因" />
          </el-form-item>
          <el-form-item label="处理方式">
            <el-input v-model="form.disposalMethod" placeholder="请输入处理方式" />
          </el-form-item>
        </template>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="saveDraft">保存草稿</el-button>
        <el-button type="primary" @click="submitCheckResult">提交检验结果</el-button>
        <el-button type="success" @click="generateCert">生成肉品品质检验合格证</el-button>
      </template>
    </el-dialog>
  </div>
</template>