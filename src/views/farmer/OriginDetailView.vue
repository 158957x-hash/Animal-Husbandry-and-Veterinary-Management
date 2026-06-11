<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { statusText, statusType } from '../../domain/stateMachine'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const route = useRoute()
const application = computed(() => {
  const id = route.params.id as string | undefined
  return id ? store.data.originApplications.find((item) => item.id === id) : store.latestOriginApplication
})
const certificate = computed(() => store.data.quarantineCertificates.find((item) => item.applicationId === application.value?.id))
const transport = computed(() => store.data.transportTasks.find((item) => item.certificateId === certificate.value?.id))
</script>

<template>
  <section v-if="application" class="page-grid two-col">
    <el-card class="panel-card certificate-card">
      <template #header>
        <div class="card-header-line">
          <strong>申报详情</strong>
          <el-tag :type="statusType[application.status]">{{ statusText[application.status] }}</el-tag>
        </div>
      </template>
      <div class="info-list">
        <p><span>申报编号</span><b>{{ application.applicationNo }}</b></p>
        <p><span>动物种类</span><b>{{ application.animalType }}</b></p>
        <p><span>数量</span><b>{{ application.quantity }}</b></p>
        <p><span>目的地</span><b>{{ application.destination }}</b></p>
        <p><span>承运人</span><b>{{ application.carrier }}</b></p>
        <p><span>提交时间</span><b>{{ formatTime(application.createdAt) }}</b></p>
      </div>
      <el-divider />
      <div class="check-list">
        <div v-for="check in application.validationResults" :key="check.label" class="check-row">
          <el-tag :type="check.passed ? 'success' : 'danger'">{{ check.passed ? '通过' : '异常' }}</el-tag>
          <div><b>{{ check.label }}</b><p>{{ check.message }}</p></div>
        </div>
      </div>
    </el-card>

    <div class="stack">
      <el-card class="panel-card certificate-paper">
        <template #header><strong>电子检疫证明</strong></template>
        <template v-if="certificate">
          <div class="qr-box">{{ certificate.certificateNo.slice(-6) }}</div>
          <div class="info-list">
            <p><span>证明编号</span><b>{{ certificate.certificateNo }}</b></p>
            <p><span>签发兽医</span><b>{{ certificate.issuedBy }}</b></p>
            <p><span>有效期</span><b>{{ formatTime(certificate.validFrom) }} 至 {{ formatTime(certificate.validTo) }}</b></p>
            <p><span>车辆</span><b>{{ certificate.vehiclePlateNo }}</b></p>
          </div>
        </template>
        <el-empty v-else description="官方兽医出证后展示电子证明" />
      </el-card>
      <el-card class="panel-card">
        <template #header><strong>运输任务</strong></template>
        <el-timeline v-if="transport">
          <el-timeline-item v-for="point in transport.route" :key="point.name" :timestamp="point.time" :type="point.status === 'risk' ? 'danger' : point.status === 'done' ? 'success' : 'primary'">
            <b>{{ point.name }}</b>
            <p>{{ point.description }}</p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="出证后自动生成运输任务" />
      </el-card>
    </div>
  </section>
  <el-empty v-else description="暂无申报记录" />
</template>
