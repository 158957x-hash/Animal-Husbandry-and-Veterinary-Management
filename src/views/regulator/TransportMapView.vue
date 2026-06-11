<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { statusText, statusType } from '../../domain/stateMachine'

const store = useAppStore()
function vehicleClass(taskId: string) {
  const restricted = store.data.carrierRestrictions.some((item) => item.transportTaskId === taskId && item.status === 'restricted')
  if (restricted) return 'restricted'
  const task = store.data.transportTasks.find((item) => item.id === taskId)
  if (task?.hasDeviation || task?.status === 'landing_exception' || task?.status === 'entry_rejected') return 'abnormal'
  return 'normal'
}
async function landing(taskId: string) {
  await store.submitLandingReport({ transportTaskId: taskId, actualDestination: '皖北标准化屠宰中心', reporter: '屠宰企业门岗', arrivedAt: new Date().toISOString() })
  ElMessage.success('落地报告已提交')
}
async function exception(taskId: string) {
  await store.markTransportException({ transportTaskId: taskId, type: 'route_deviation', message: '监管模拟：车辆轨迹偏离申报路线' })
  ElMessage.error('已生成轨迹偏离预警和承运限制')
}
</script>

<template>
  <section class="page-grid map-layout">
    <el-card class="panel-card map-card">
      <template #header><strong>调运监管一张图</strong></template>
      <div class="map-legend"><span class="normal">正常车辆</span><span class="abnormal">异常车辆</span><span class="restricted">限制车辆</span></div>
      <div class="mock-map">
        <div class="map-line"></div>
        <div class="map-node start">养殖场</div>
        <div class="map-node middle">省道卡口</div>
        <div class="map-node end">屠宰场</div>
        <div v-for="task in store.data.transportTasks" :key="task.id" class="vehicle-dot" :class="vehicleClass(task.id)">{{ task.plateNo }}</div>
      </div>
    </el-card>
    <div class="stack">
      <el-card class="panel-card">
        <template #header><strong>运输任务</strong></template>
        <div v-for="task in store.data.transportTasks" :key="task.id" class="task-item large">
          <div><b>{{ task.plateNo }}</b><p>{{ task.route[0]?.description }} → {{ task.route[2]?.description }}</p></div>
          <div class="action-inline"><el-tag :type="statusType[task.status]">{{ statusText[task.status] }}</el-tag><el-button size="small" @click="landing(task.id)">提交落地</el-button><el-button size="small" type="danger" @click="exception(task.id)">模拟异常</el-button></div>
        </div>
        <el-empty v-if="!store.data.transportTasks.length" description="暂无运输任务" />
      </el-card>
      <el-card class="panel-card">
        <template #header><strong>异常预警</strong></template>
        <div v-for="alert in store.data.alerts" :key="alert.id" class="alert-item" :class="alert.level"><b>{{ alert.type }}</b><p>{{ alert.message }}</p></div>
        <el-empty v-if="!store.data.alerts.length" description="暂无异常预警" />
      </el-card>
    </div>
  </section>
</template>
