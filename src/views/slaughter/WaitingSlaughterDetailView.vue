<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { SlaughterBatchStatus } from '../../domain/models'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const batchId = computed(() => String(route.params.id || ''))
const batch = computed(() => store.data.slaughterBatches.find((b) => b.id === batchId.value))
const entry = computed(() => batch.value ? store.data.slaughterEntryRecords.find((e) => e.id === batch.value!.entryRecordId) : undefined)
const certificate = computed(() => batch.value ? store.data.quarantineCertificates.find((c) => c.id === batch.value!.quarantineCertificateId) : undefined)
const slaughterApp = computed(() => batch.value ? store.data.slaughterApplications.find((a) => a.batchId === batch.value!.id || a.id === batch.value!.slaughterApplicationId) : undefined)
const anteMortemCheck = computed(() => batch.value ? store.data.anteMortemChecks.find((c) => c.waitingBatchId === batch.value!.id || c.id === batch.value!.anteMortemCheckId) : undefined)
const attachments = computed(() => batch.value ? store.data.inspectionAttachments.filter((a) => a.applicationNo === batch.value!.batchNo || (entry.value && a.applicationNo === entry.value.entryNo)) : [])
const operationLogs = computed(() => {
  const targets = [batch.value?.batchNo, entry.value?.entryNo, certificate.value?.certificateNo].filter(Boolean) as string[]
  return store.data.operationLogs.filter((l) => targets.some((t) => l.target.includes(t))).slice(0, 15)
})

const statusText: Record<SlaughterBatchStatus, string> = {
  pending_slaughter_apply: '待提交屠宰检疫申报', draft_application: '申报草稿',
  submitted_pending_accept: '已提交待受理', returned_for_correction: '退回补正',
  accepted_pending_ante_mortem: '已受理/待宰前检查', ante_mortem_passed: '宰前检查通过',
  ante_mortem_failed: '宰前检查不通过', emergency_slaughtering: '急宰处理中',
  death_registration: '待宰死亡登记', abnormal: '待宰异常',
  slaughter_applied: '已申报', ante_mortem_checking: '宰前检查中',
  post_mortem_checking: '宰后检疫中', post_mortem_passed: '宰后检疫通过',
  post_mortem_failed: '宰后检疫未通过', pending_product_cert: '待出产品证',
  meat_quality_certificate_issued: '肉品品质证已出', product_cert_issued: '产品证已出',
}
const statusType: Record<SlaughterBatchStatus, 'info' | 'success' | 'warning' | 'danger' | 'primary'> = {
  pending_slaughter_apply: 'warning', draft_application: 'info',
  submitted_pending_accept: 'primary', returned_for_correction: 'danger',
  accepted_pending_ante_mortem: 'primary', ante_mortem_passed: 'success',
  ante_mortem_failed: 'danger', emergency_slaughtering: 'warning',
  death_registration: 'danger', abnormal: 'danger',
  slaughter_applied: 'primary', ante_mortem_checking: 'warning',
  post_mortem_checking: 'warning', post_mortem_passed: 'success',
  post_mortem_failed: 'danger', pending_product_cert: 'warning',
  meat_quality_certificate_issued: 'success', product_cert_issued: 'success',
}

function fileSize(size: number) { return `${(size / 1024).toFixed(1)} KB` }
function previewAttachment(name: string) { ElMessage.info(`预览入口已保留：${name}`) }
function downloadAttachment(name: string) { ElMessage.info(`下载入口已保留：${name}`) }
</script>

<template>
  <section class="gov-page">
    <el-card class="panel-card">
      <div class="page-hero inline-hero">
        <div>
          <h2>待宰批次详情</h2>
          <p>查看待宰批次完整信息、入场查验来源、屠宰检疫申报进度和宰前检查结果。</p>
        </div>
        <el-button @click="router.push('/slaughter/waiting-slaughter')">返回列表</el-button>
      </div>
    </el-card>

    <el-empty v-if="!batch" description="未找到待宰批次" />

    <template v-else>
      <div class="detail-grid">
        <el-card class="panel-card compact-card">
          <template #header><strong>待宰批次信息</strong></template>
          <div class="info-list">
            <p><span>批次编号</span><b>{{ batch.batchNo }}</b></p>
            <p><span>当前状态</span><b><el-tag :type="statusType[batch.status]">{{ statusText[batch.status] }}</el-tag></b></p>
            <p><span>动物种类</span><b>{{ batch.animalType }}</b></p>
            <p><span>实到数量</span><b>{{ batch.entryQuantity }} 头</b></p>
            <p><span>待宰数量</span><b>{{ batch.waitingQuantity }} 头</b></p>
            <p><span>耳标号段</span><b>{{ batch.earTagRange }}</b></p>
            <p><span>待宰圈</span><b>{{ batch.waitingPenNo }}</b></p>
            <p><span>入场时间</span><b>{{ formatTime(batch.entryTime || batch.createdAt) }}</b></p>
          </div>
        </el-card>

        <el-card class="panel-card compact-card">
          <template #header><strong>入场查验信息</strong></template>
          <div v-if="entry" class="info-list">
            <p><span>入场编号</span><b>{{ entry.entryNo }}</b></p>
            <p><span>查验状态</span><b>{{ entry.status === 'entry_passed' ? '已通过' : entry.status === 'entry_rejected' ? '未通过' : '待查验' }}</b></p>
            <p><span>实到数量</span><b>{{ entry.actualQuantity ?? entry.quantity }} 头</b></p>
            <p><span>实际到场车辆</span><b>{{ entry.actualVehiclePlateNo || entry.vehiclePlateNo }}</b></p>
            <p><span>入场经办人</span><b>{{ entry.operator || entry.checkedBy || '-' }}</b></p>
            <p><span>入场时间</span><b>{{ formatTime(entry.entryTime || entry.checkedAt) }}</b></p>
          </div>
          <el-empty v-else description="暂无入场查验信息" :image-size="40" />
        </el-card>

        <el-card class="panel-card compact-card">
          <template #header><strong>动物检疫合格证明</strong></template>
          <div v-if="certificate" class="info-list">
            <p><span>证明编号</span><b>{{ certificate.certificateNo }}</b></p>
            <p><span>签发机关</span><b>{{ certificate.issuedBy }}</b></p>
            <p><span>有效期</span><b>{{ formatTime(certificate.validFrom) }} 至 {{ formatTime(certificate.validTo) }}</b></p>
            <p><span>动物种类</span><b>{{ certificate.animalType }}</b></p>
            <p><span>数量</span><b>{{ certificate.quantity }} 头</b></p>
            <p><span>启运地</span><b>{{ certificate.origin }}</b></p>
            <p><span>目的地</span><b>{{ certificate.destination }}</b></p>
            <p><span>使用状态</span><b>{{ certificate.entryUsageStatus === 'used' ? '已入场使用' : certificate.entryUsageStatus === 'arrived' ? '已到场' : '未到场' }}</b></p>
          </div>
          <el-empty v-else description="暂无证明信息" :image-size="40" />
        </el-card>

        <el-card class="panel-card compact-card">
          <template #header><strong>待宰圈信息</strong></template>
          <div class="info-list">
            <p><span>待宰圈编号</span><b>{{ batch.waitingPenNo }}</b></p>
            <p><span>在圈数量</span><b>{{ batch.waitingQuantity }} 头</b></p>
            <p><span>入场时间</span><b>{{ formatTime(batch.entryTime || batch.createdAt) }}</b></p>
          </div>
        </el-card>

        <el-card class="panel-card compact-card">
          <template #header><strong>屠宰检疫申报</strong></template>
          <div v-if="slaughterApp" class="info-list">
            <p><span>申报编号</span><b>{{ slaughterApp.applicationNo }}</b></p>
            <p><span>申报状态</span><b>{{ slaughterApp.status }}</b></p>
            <p><span>申报数量</span><b>{{ slaughterApp.quantity }} 头</b></p>
            <p><span>非瘟检测结果</span><b>{{ slaughterApp.africanSwineFeverResult === 'negative' ? '阴性' : slaughterApp.africanSwineFeverResult === 'positive' ? '阳性' : '-' }}</b></p>
            <p><span>违禁药物检测结果</span><b>{{ slaughterApp.bannedDrugResult === 'negative' ? '阴性' : slaughterApp.bannedDrugResult === 'positive' ? '阳性' : '-' }}</b></p>
            <p><span>申报时间</span><b>{{ formatTime(slaughterApp.createdAt) }}</b></p>
          </div>
          <el-empty v-else description="暂未提交屠宰检疫申报" :image-size="40" />
        </el-card>

        <el-card v-if="slaughterApp" class="panel-card compact-card">
          <template #header><strong>官方兽医受理记录</strong></template>
          <div v-if="slaughterApp.status !== 'submitted_pending_accept'" class="info-list">
            <p><span>受理状态</span><b>{{ ['accepted_pending_pre_check', 'post_product_generated', 'product_cert_pending', 'product_cert_issued'].includes(slaughterApp.status) ? '已受理' : slaughterApp.status === 'returned' ? '已退回' : '-' }}</b></p>
            <p v-if="slaughterApp.status === 'returned'"><span>退回原因</span><b>{{ batch.returnReason || '-' }}</b></p>
          </div>
          <el-empty v-else description="暂无受理记录" :image-size="40" />
        </el-card>

        <el-card class="panel-card compact-card">
          <template #header><strong>宰前检查结果</strong></template>
          <div v-if="anteMortemCheck" class="info-list">
            <p><span>检查结果</span><b><el-tag :type="anteMortemCheck.passed ? 'success' : 'danger'">{{ anteMortemCheck.passed ? '通过' : '不通过' }}</el-tag></b></p>
            <p><span>检查人</span><b>{{ anteMortemCheck.checkedBy || '-' }}</b></p>
            <p><span>检查时间</span><b>{{ formatTime(anteMortemCheck.checkedAt) }}</b></p>
            <p v-if="anteMortemCheck.remark"><span>备注</span><b>{{ anteMortemCheck.remark }}</b></p>
          </div>
          <el-empty v-else description="暂未进行宰前检查" :image-size="40" />
        </el-card>

        <el-card v-if="batch.status === 'emergency_slaughtering'" class="panel-card compact-card">
          <template #header><strong>急宰申报记录</strong></template>
          <div class="info-list">
            <p><span>急宰编号</span><b>{{ batch.emergencySlaughterId || '-' }}</b></p>
            <p><span>当前状态</span><b>急宰处理中</b></p>
          </div>
        </el-card>

        <el-card v-if="batch.status === 'death_registration'" class="panel-card compact-card">
          <template #header><strong>待宰死亡登记</strong></template>
          <div class="info-list">
            <p><span>死亡登记编号</span><b>{{ batch.deathRecordId || '-' }}</b></p>
            <p><span>当前状态</span><b>待登记死亡信息</b></p>
          </div>
        </el-card>

        <el-card v-if="batch.abnormalReason" class="panel-card compact-card">
          <template #header><strong>待宰异常记录</strong></template>
          <div class="info-list">
            <p><span>异常原因</span><b>{{ batch.abnormalReason }}</b></p>
          </div>
        </el-card>
      </div>

      <el-card class="panel-card">
        <template #header><strong>附件材料</strong></template>
        <el-table :data="attachments" stripe>
          <el-table-column prop="typeName" label="附件类型" min-width="130" />
          <el-table-column prop="fileName" label="文件名称" min-width="180" />
          <el-table-column label="文件大小" width="110"><template #default="scope">{{ fileSize(scope.row.fileSize) }}</template></el-table-column>
          <el-table-column label="上传时间" min-width="160"><template #default="scope">{{ formatTime(scope.row.uploadedAt) }}</template></el-table-column>
          <el-table-column prop="uploadedBy" label="上传人" min-width="130" />
          <el-table-column label="操作" width="130">
            <template #default="scope">
              <el-button link type="primary" @click="previewAttachment(scope.row.fileName)">预览</el-button>
              <el-button link type="primary" @click="downloadAttachment(scope.row.fileName)">下载</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!attachments.length" description="暂无附件材料" />
      </el-card>

      <el-card class="panel-card">
        <template #header><strong>操作日志</strong></template>
        <el-timeline>
          <el-timeline-item v-for="log in operationLogs" :key="log.id" :timestamp="formatTime(log.createdAt)">
            <b>{{ log.action }}</b>
            <p>{{ log.actor }}：{{ log.target }}</p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-if="!operationLogs.length" description="暂无操作日志" />
      </el-card>
    </template>
  </section>
</template>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}
.inline-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.compact-card :deep(.el-card__body) {
  padding: 16px 18px;
}
.info-list {
  display: grid;
  gap: 10px;
}
.info-list p {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin: 0;
  color: var(--text-secondary);
}
.info-list b {
  color: var(--text-primary);
  text-align: right;
}
@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
