<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { statusText, statusType } from '../../domain/stateMachine'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const application = computed(() => {
  const id = route.params.id as string | undefined
  return id ? store.data.originApplications.find((item) => item.id === id) : store.latestOriginApplication
})
const certificate = computed(() => store.data.quarantineCertificates.find((item) => item.applicationId === application.value?.id))
const transport = computed(() => store.data.transportTasks.find((item) => item.certificateId === certificate.value?.id))
const landingReport = computed(() => store.data.landingReports.find((item) => item.transportTaskId === transport.value?.id))
const logs = computed(() => store.data.operationLogs.filter((item) => application.value && item.target.includes(application.value.applicationNo)).slice(0, 8))
const timeline = computed(() => {
  if (!application.value) return []
  const base = [{ title: '创建申报', time: application.value.createdAt, description: '养殖场户创建产地检疫申报' }]
  if (application.value.submittedAt) base.push({ title: '提交申报', time: application.value.submittedAt, description: '申报进入官方兽医待办' })
  if (application.value.rejectReason) base.push({ title: '申报驳回', time: application.value.updatedAt, description: application.value.rejectReason })
  if (certificate.value) base.push({ title: '电子出证', time: certificate.value.validFrom, description: certificate.value.certificateNo })
  if (transport.value) base.push({ title: '生成运输任务', time: transport.value.startedAt, description: transport.value.plateNo })
  if (landingReport.value?.arrivedAt) base.push({ title: '落地报告', time: landingReport.value.arrivedAt, description: landingReport.value.reportNo })
  return base
})

const statusDescription = computed(() => {
  const status = application.value?.status
  if (status === 'draft') return '当前申报尚未提交，可返回列表编辑、提交或删除草稿。'
  if (['submitted', 'origin_reviewing'].includes(status || '')) return '申报已提交，正在等待官方兽医审核和现场查验。'
  if (status === 'rejected') return `申报已驳回：${application.value?.rejectReason || '请补正材料后重新提交。'}`
  if (status === 'certificate_issued') return '官方兽医已完成无纸化出证，可查看电子检疫证明和运输任务。'
  if (status === 'transporting') return '车辆正在运输途中，可查看轨迹和落地报告状态。'
  if (status === 'arrived') return '运输任务已到达，可查看落地报告状态。'
  if (status === 'voided') return `申报已作废：${application.value?.voidReason || '仅支持查看。'}`
  return '暂无状态说明。'
})
</script>

<template>
  <section v-if="application" class="page-grid two-col">
    <el-card class="panel-card certificate-card">
      <template #header><div class="card-header-line"><strong>申报详情</strong><el-tag :type="statusType[application.status]">{{ statusText[application.status] }}</el-tag></div></template>
      <div class="info-list">
        <p><span>申报编号</span><b>{{ application.applicationNo }}</b></p>
        <p><span>动物种类</span><b>{{ application.animalType }}</b></p>
        <p><span>数量</span><b>{{ application.quantity }}</b></p>
        <p><span>目的地</span><b>{{ application.destination }}</b></p>
        <p><span>承运人</span><b>{{ application.carrier }}</b></p>
        <p><span>提交时间</span><b>{{ application.submittedAt ? formatTime(application.submittedAt) : '未提交' }}</b></p>
      </div>
      <el-divider />
      <h3>自动校验结果</h3>
      <div class="check-list">
        <div v-for="check in application.validationResults" :key="check.label" class="check-row">
          <el-tag :type="check.passed ? 'success' : 'danger'">{{ check.passed ? '通过' : '异常' }}</el-tag>
          <div><b>{{ check.label }}</b><p>{{ check.message }}</p></div>
        </div>
      </div>
      <el-divider />
      <h3>流程时间线</h3>
      <el-timeline>
        <el-timeline-item v-for="item in timeline" :key="item.title" :timestamp="formatTime(item.time)"><b>{{ item.title }}</b><p>{{ item.description }}</p></el-timeline-item>
      </el-timeline>
      <el-divider />
      <h3>操作日志</h3>
      <div class="info-list"><p v-for="log in logs" :key="log.id"><span>{{ formatTime(log.createdAt) }}</span><b>{{ log.actor }}｜{{ log.action }}</b></p><p v-if="!logs.length"><span>暂无</span><b>当前申报暂无独立操作日志</b></p></div>
    </el-card>

    <div class="stack">
      <el-card class="panel-card">
        <template #header><strong>当前状态说明</strong></template>
        <el-alert :type="application.status === 'rejected' ? 'error' : application.status === 'draft' ? 'info' : 'success'" :closable="false" :title="statusDescription" />
        <div v-if="application.status === 'rejected'" class="action-inline" style="margin-top: 16px"><el-button type="success" @click="router.push(`/farmer/origin-apply/${application.id}`)">编辑后重新提交</el-button></div>
        <div v-if="application.status === 'draft'" class="action-inline" style="margin-top: 16px"><el-button @click="router.push(`/farmer/origin-apply/${application.id}`)">继续编辑</el-button><el-button type="success" @click="router.push('/farmer/origin-applications')">返回列表提交</el-button></div>
      </el-card>

      <el-card v-if="certificate" class="panel-card certificate-paper">
        <template #header><strong>电子检疫证明</strong></template>
        <div class="qr-box">{{ certificate.certificateNo.slice(-6) }}</div>
        <div class="info-list">
          <p><span>证明编号</span><b>{{ certificate.certificateNo }}</b></p>
          <p><span>签发兽医</span><b>{{ certificate.issuedBy }}</b></p>
          <p><span>出证时间</span><b>{{ formatTime(certificate.validFrom) }}</b></p>
          <p><span>有效期</span><b>{{ formatTime(certificate.validFrom) }} 至 {{ formatTime(certificate.validTo) }}</b></p>
          <p><span>动物数量</span><b>{{ certificate.animalType }} {{ certificate.quantity }}</b></p>
          <p><span>启运目的地</span><b>{{ certificate.origin }} → {{ certificate.destination }}</b></p>
          <p><span>车辆</span><b>{{ certificate.vehiclePlateNo }}</b></p>
          <p><span>承运人</span><b>{{ application.carrier }}</b></p>
        </div>
      </el-card>

      <el-card v-if="transport" class="panel-card">
        <template #header><strong>运输任务</strong></template>
        <div class="info-list">
          <p><span>运输状态</span><b>{{ statusText[transport.status] }}</b></p>
          <p><span>落地报告</span><b>{{ landingReport ? landingReport.status : '待提交' }}</b></p>
        </div>
        <el-timeline>
          <el-timeline-item v-for="point in transport.route" :key="point.name" :timestamp="point.time" :type="point.status === 'risk' ? 'danger' : point.status === 'done' ? 'success' : 'primary'"><b>{{ point.name }}</b><p>{{ point.description }}</p></el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </section>
  <el-empty v-else description="暂无申报记录" />
</template>
