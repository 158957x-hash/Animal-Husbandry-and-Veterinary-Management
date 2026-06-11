<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'

const store = useAppStore()
const activeNode = ref('')
const selected = computed(() => store.data.closedLoopNodes.find((item) => item.id === activeNode.value))
async function report() {
  await ElMessageBox.alert(`闭环节点 ${store.data.closedLoopNodes.length} 个；同步日志 ${store.data.syncLogs.length} 条；预警 ${store.data.alerts.length} 条；无害化任务 ${store.data.harmlessTasks.length} 个。`, '闭环校验报告', { confirmButtonText: '知道了' })
}
</script>

<template>
  <section class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><div class="card-header-line"><strong>检疫屠宰闭环校验总览</strong><el-button type="success" @click="report">生成闭环校验报告</el-button></div></template>
      <el-timeline>
        <el-timeline-item v-for="node in store.data.closedLoopNodes" :key="node.id" :timestamp="formatTime(node.operatedAt)" :type="node.passed ? 'success' : 'danger'">
          <button class="node-button" @click="activeNode = node.id">
            <b>{{ node.nodeName }}</b>
            <span>{{ node.summary }}</span>
            <em>{{ node.dataSource }} · {{ node.operator }} · {{ node.syncStatus }}</em>
          </button>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="!store.data.closedLoopNodes.length" description="完成业务流转后生成闭环节点" />
    </el-card>
    <el-card class="panel-card">
      <template #header><strong>节点详情</strong></template>
      <div v-if="selected" class="info-list">
        <p><span>节点</span><b>{{ selected.nodeName }}</b></p>
        <p><span>数据来源</span><b>{{ selected.dataSource }}</b></p>
        <p><span>校验结果</span><b>{{ selected.passed ? '通过' : '异常' }}</b></p>
        <p><span>操作人</span><b>{{ selected.operator }}</b></p>
        <p><span>操作时间</span><b>{{ formatTime(selected.operatedAt) }}</b></p>
        <p><span>同步状态</span><b>{{ selected.syncStatus }}</b></p>
        <p><span>详情</span><b>{{ selected.summary }}</b></p>
      </div>
      <el-empty v-else description="点击时间轴节点查看详情" />
    </el-card>
  </section>
</template>
