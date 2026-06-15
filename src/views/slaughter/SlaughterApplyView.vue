<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { SlaughterApplicationStatus, DetectionResult } from '../../domain/models'

const store = useAppStore()

/* ---- 可申报批次（自检通过，待提交屠宰检疫申报） ---- */
const applicableBatches = computed(() =>
  store.data.slaughterBatches.filter((b) => b.status === 'pending_slaughter_apply'),
)

/* ---- 选中批次 ---- */
const selectedBatchId = ref('')

const selectedBatch = computed(() =>
  store.data.slaughterBatches.find((b) => b.id === selectedBatchId.value),
)

const entryRecord = computed(() =>
  selectedBatch.value
    ? store.data.slaughterEntryRecords.find((r) => r.id === selectedBatch.value!.entryRecordId)
    : undefined,
)

const quarantineCert = computed(() =>
  selectedBatch.value
    ? store.data.quarantineCertificates.find((c) => c.id === selectedBatch.value!.quarantineCertificateId)
    : undefined,
)

const selfInspection = computed(() =>
  selectedBatch.value
    ? store.data.slaughterSelfInspections.find((s) => s.batchId === selectedBatch.value!.id)
    : undefined,
)

/* ---- 申报表单 ---- */
const form = reactive({
  purpose: '屠宰',
  plannedSlaughterTime: '',
  contactPerson: '',
  contactPhone: '',
  remark: '',
})

const submitting = ref(false)

async function submit() {
  if (!selectedBatch.value) return
  if (!form.plannedSlaughterTime) {
    ElMessage.warning('请选择计划屠宰时间')
    return
  }
  if (!form.contactPerson.trim()) {
    ElMessage.warning('请填写联系人')
    return
  }
  if (!form.contactPhone.trim()) {
    ElMessage.warning('请填写联系电话')
    return
  }
  submitting.value = true
  try {
    await store.submitSlaughterQuarantineApplication({
      batchId: selectedBatch.value.id,
      entryRecordId: selectedBatch.value.entryRecordId,
      quarantineCertificateId: selectedBatch.value.quarantineCertificateId,
      quantity: selectedBatch.value.waitingQuantity,
      purpose: form.purpose,
      plannedSlaughterTime: form.plannedSlaughterTime,
      contactPerson: form.contactPerson,
      contactPhone: form.contactPhone,
      remark: form.remark,
    })
    ElMessage.success('屠宰检疫申报已提交至官方兽医')
    selectedBatchId.value = ''
    form.purpose = '屠宰'
    form.plannedSlaughterTime = ''
    form.contactPerson = ''
    form.contactPhone = ''
    form.remark = ''
  } finally {
    submitting.value = false
  }
}

/* ---- 已有申报列表 ---- */
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

const statusTagType: Record<SlaughterApplicationStatus, 'info' | 'success' | 'warning' | 'danger' | 'primary'> = {
  pending_accept: 'warning',
  accepted: 'primary',
  ante_mortem_checking: 'warning',
  post_mortem_checking: 'warning',
  pending_product_cert: 'info',
  product_cert_issued: 'success',
  returned: 'danger',
  abnormal: 'danger',
}

const detectionLabel = (v?: DetectionResult) => (v === 'negative' ? '阴性' : v === 'positive' ? '阳性' : '-')
</script>

<template>
  <div class="page-grid">
    <!-- 标题栏 -->
    <div class="topbar">
      <h1>屠宰检疫申报</h1>
      <p>对自检通过的待宰批次提交屠宰检疫申报，由官方兽医受理审核</p>
    </div>

    <!-- 申报区域 -->
    <el-card v-if="applicableBatches.length" class="panel-card">
      <template #header><strong>新建屠宰检疫申报</strong></template>
      <el-form label-position="left" label-width="160px">
        <!-- 批次选择 -->
        <el-form-item label="选择待宰批次">
          <el-select v-model="selectedBatchId" class="full-width" placeholder="请选择自检通过的待宰批次" filterable>
            <el-option
              v-for="batch in applicableBatches"
              :key="batch.id"
              :label="`${batch.batchNo} — ${batch.animalType} ${batch.waitingQuantity}头`"
              :value="batch.id"
            />
          </el-select>
        </el-form-item>

        <template v-if="selectedBatch">
          <!-- 自动填充信息 -->
          <el-divider content-position="left">批次关联信息（自动填充）</el-divider>

          <el-form-item label="入场登记编号">
            <el-input :model-value="entryRecord?.entryNo ?? '-'" disabled />
          </el-form-item>
          <el-form-item label="待宰批次编号">
            <el-input :model-value="selectedBatch.batchNo" disabled />
          </el-form-item>
          <el-form-item label="动物检疫合格证明编号">
            <el-input :model-value="quarantineCert?.certificateNo ?? '-'" disabled />
          </el-form-item>
          <el-form-item label="动物种类">
            <el-input :model-value="selectedBatch.animalType" disabled />
          </el-form-item>
          <el-form-item label="入场数量">
            <el-input :model-value="`${selectedBatch.entryQuantity} 头`" disabled />
          </el-form-item>
          <el-form-item label="待宰数量">
            <el-input :model-value="`${selectedBatch.waitingQuantity} 头`" disabled />
          </el-form-item>
          <el-form-item label="养殖场">
            <el-input :model-value="entryRecord?.originFarm ?? '-'" disabled />
          </el-form-item>
          <el-form-item label="耳标号段">
            <el-input :model-value="selectedBatch.earTagRange || '-'" disabled />
          </el-form-item>
          <el-form-item label="非洲猪瘟检测结果">
            <el-tag :type="selfInspection?.africanSwineFeverResult === 'negative' ? 'success' : 'danger'">
              {{ detectionLabel(selfInspection?.africanSwineFeverResult) }}
            </el-tag>
          </el-form-item>
          <el-form-item label="违禁药物自检结果">
            <el-tag :type="selfInspection?.bannedDrugResult === 'negative' ? 'success' : 'danger'">
              {{ detectionLabel(selfInspection?.bannedDrugResult) }}
            </el-tag>
          </el-form-item>

          <!-- 用户填写 -->
          <el-divider content-position="left">申报信息</el-divider>

          <el-form-item label="申报用途" required>
            <el-select v-model="form.purpose" class="full-width">
              <el-option label="屠宰" value="屠宰" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="计划屠宰时间" required>
            <el-date-picker
              v-model="form.plannedSlaughterTime"
              type="datetime"
              placeholder="请选择计划屠宰时间"
              class="full-width"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="联系人" required>
            <el-input v-model="form.contactPerson" placeholder="请填写联系人姓名" />
          </el-form-item>
          <el-form-item label="联系电话" required>
            <el-input v-model="form.contactPhone" placeholder="请填写联系电话" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="如有需要请填写备注" />
          </el-form-item>

          <el-button
            type="success"
            size="large"
            class="full-width"
            :loading="submitting"
            @click="submit"
          >
            提交屠宰检疫申报
          </el-button>
        </template>
      </el-form>
    </el-card>

    <el-card v-else class="panel-card">
      <el-empty description="暂无自检通过可申报的待宰批次，请先完成企业自检" />
    </el-card>

    <!-- 已有申报列表 -->
    <el-card class="panel-card">
      <template #header><strong>屠宰检疫申报记录</strong></template>
      <el-table :data="store.data.slaughterApplications" stripe border style="width: 100%">
        <el-table-column prop="applicationNo" label="申报编号" min-width="140" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="quantity" label="数量(头)" width="90" align="center" />
        <el-table-column label="非洲猪瘟检测" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.africanSwineFeverResult === 'negative' ? 'success' : 'danger'" size="small">
              {{ detectionLabel(row.africanSwineFeverResult) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="违禁药物自检" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.bannedDrugResult === 'negative' ? 'success' : 'danger'" size="small">
              {{ detectionLabel(row.bannedDrugResult) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="申报用途" width="90" />
        <el-table-column label="计划屠宰时间" width="170">
          <template #default="{ row }">{{ formatTime(row.plannedSlaughterTime) }}</template>
        </el-table-column>
        <el-table-column prop="contactPerson" label="联系人" width="90" />
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType[row.status as SlaughterApplicationStatus]" size="small">
              {{ statusLabelMap[row.status as SlaughterApplicationStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">{{ formatTime(row.submittedAt || row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
