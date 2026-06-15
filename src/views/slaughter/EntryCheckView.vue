<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { QuarantineCertificate, TransportTask, Vehicle, FarmBatch, SlaughterEntryRecord } from '../../domain/models'

const store = useAppStore()

const query = ref('')
const searching = ref(false)
const certData = ref<{ certificate: QuarantineCertificate; task: TransportTask; vehicle: Vehicle; batch: FarmBatch | undefined } | null>(null)
const searchError = ref('')
const entryResult = ref<SlaughterEntryRecord | null>(null)
const confirming = ref(false)

const form = reactive({
  actualQuantity: 0,
  channel: '东门动物运输专用通道',
})

async function search() {
  if (!query.value.trim()) return
  searching.value = true
  searchError.value = ''
  certData.value = null
  entryResult.value = null
  try {
    const result = await store.getOriginCertificate(query.value.trim())
    if (!result.certificate) {
      searchError.value = '未找到匹配的检疫证明或关联数据'
    } else {
      certData.value = result as { certificate: QuarantineCertificate; task: TransportTask; vehicle: Vehicle; batch: FarmBatch | undefined }
      form.actualQuantity = result.certificate.quantity
    }
  } catch {
    searchError.value = '查询失败，请检查输入'
  } finally {
    searching.value = false
  }
}

const allChecksPassed = computed(() => entryResult.value?.status === 'entry_passed')
const failedChecks = computed(() => entryResult.value?.checkResults.filter((c) => !c.passed) ?? [])

async function confirmEntry() {
  if (!query.value.trim()) return
  confirming.value = true
  try {
    const result = await store.performSlaughterEntryCheck({
      query: query.value.trim(),
      actualQuantity: form.actualQuantity,
      channel: form.channel,
    })
    entryResult.value = result
    if (result.status === 'entry_passed') {
      ElMessage.success('入场查验通过，可进入待宰管理')
    } else {
      ElMessage.error('入场被阻断，已生成预警或无害化任务')
    }
  } catch {
    ElMessage.error('入场查验失败')
  } finally {
    confirming.value = false
  }
}

const recentEntries = computed(() => store.data.slaughterEntryRecords.slice(0, 10))

const entryStatusText: Record<string, string> = {
  pending_check: '待查验',
  checking: '查验中',
  entry_passed: '入场通过',
  entry_rejected: '入场驳回',
}
const entryStatusType: Record<string, 'info' | 'success' | 'danger' | 'warning'> = {
  pending_check: 'info',
  checking: 'warning',
  entry_passed: 'success',
  entry_rejected: 'danger',
}
</script>

<template>
  <section class="stack">
    <div class="page-header">
      <h2>入场查验</h2>
      <p>通过动物检疫合格证明编号、运输任务编号或车牌号查询入场信息，自动核验后确认入场</p>
    </div>

    <el-card class="panel-card">
      <template #header><strong>查询入场信息</strong></template>
      <div class="action-inline full-width">
        <el-input v-model="query" placeholder="输入动物证编号、运输任务编号或车牌号" clearable @keyup.enter="search" />
        <el-button type="primary" :loading="searching" @click="search">查询</el-button>
      </div>
      <el-alert v-if="searchError" :title="searchError" type="warning" show-icon :closable="false" style="margin-top: 12px" />
    </el-card>

    <template v-if="certData?.certificate">
      <el-card class="panel-card">
        <template #header><strong>检疫证明信息</strong></template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="动物证编号">{{ certData.certificate.certificateNo }}</el-descriptions-item>
          <el-descriptions-item label="养殖场">{{ certData.batch?.farmName ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="动物种类">{{ certData.certificate.animalType }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ certData.certificate.quantity }} 头</el-descriptions-item>
          <el-descriptions-item label="耳标号段">{{ certData.batch ? `${certData.batch.earTagPrefix}${certData.batch.earTagStart}-${certData.batch.earTagEnd}` : (certData.certificate.earTagRange ?? '-') }}</el-descriptions-item>
          <el-descriptions-item label="运输车辆">{{ certData.certificate.vehiclePlateNo }}</el-descriptions-item>
          <el-descriptions-item label="承运人">{{ certData.certificate.carrier ?? certData.vehicle?.carrier ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="启运地">{{ certData.certificate.origin }}</el-descriptions-item>
          <el-descriptions-item label="目的地">{{ certData.certificate.destination }}</el-descriptions-item>
          <el-descriptions-item label="运输任务">{{ certData.task ? `${certData.task.plateNo}（${certData.task.status === 'transporting' ? '运输中' : '已到场'}）` : '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="panel-card">
        <template #header><strong>入场核验</strong></template>
        <el-form label-position="top" style="margin-bottom: 16px">
          <div style="display: flex; gap: 16px">
            <el-form-item label="实际入场数量" style="flex: 1">
              <el-input-number v-model="form.actualQuantity" :min="1" class="full-width" />
            </el-form-item>
            <el-form-item label="入场通道" style="flex: 1">
              <el-select v-model="form.channel" class="full-width">
                <el-option label="东门动物运输专用通道" value="东门动物运输专用通道" />
                <el-option label="北门临检通道" value="北门临检通道" />
              </el-select>
            </el-form-item>
          </div>
        </el-form>

        <div v-if="entryResult" class="check-list">
          <div v-for="item in entryResult.checkResults" :key="item.label" class="check-row">
            <el-tag :type="item.passed ? 'success' : 'danger'">{{ item.passed ? '通过' : '未通过' }}</el-tag>
            <div><b>{{ item.label }}</b><p>{{ item.message }}</p></div>
          </div>
        </div>

        <div v-if="entryResult" style="margin-top: 16px">
          <el-button v-if="allChecksPassed" type="success" size="large" :loading="confirming" @click="confirmEntry">确认入场</el-button>
          <el-alert v-else type="error" show-icon :closable="false">
            <template #title>入场异常</template>
            <template #default>
              <span>以下核验项未通过：</span>
              <ul style="margin: 4px 0 0 16px; padding: 0">
                <li v-for="c in failedChecks" :key="c.label">{{ c.label }}：{{ c.message }}</li>
              </ul>
            </template>
          </el-alert>
        </div>

        <div v-if="!entryResult" style="margin-top: 12px">
          <el-button type="primary" size="large" :loading="confirming" @click="confirmEntry">执行入场核验</el-button>
        </div>
      </el-card>
    </template>

    <el-card class="panel-card">
      <template #header><strong>近期入场记录</strong></template>
      <el-table :data="recentEntries" stripe>
        <el-table-column prop="entryNo" label="入场编号" min-width="160" />
        <el-table-column label="动物证编号" min-width="160">
          <template #default="scope">
            {{ store.data.quarantineCertificates.find((c) => c.id === scope.row.quarantineCertificateId)?.certificateNo ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="originFarm" label="养殖场" min-width="140" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="vehiclePlateNo" label="运输车辆" min-width="120" />
        <el-table-column label="核验结果" width="100">
          <template #default="scope">
            <el-tag :type="entryStatusType[scope.row.status] ?? 'info'">{{ entryStatusText[scope.row.status] ?? scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="入场时间" min-width="160">
          <template #default="scope">{{ formatTime(scope.row.checkedAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!recentEntries.length" description="暂无入场记录" />
    </el-card>
  </section>
</template>
