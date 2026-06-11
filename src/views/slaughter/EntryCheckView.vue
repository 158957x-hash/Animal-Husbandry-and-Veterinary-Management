<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const recognitionText = ref('等待识别')
const form = reactive({
  query: '',
  actualQuantity: 60,
  channel: '东门动物运输专用通道',
  recognizedPlateNo: '',
  earTagMatched: true,
  originRegionMatched: true,
})
const lastEntryId = ref('')
const lastEntry = computed(() => store.data.entryChecks.find((item) => item.id === lastEntryId.value) ?? store.latestEntryCheck)
const certificateOptions = computed(() => store.data.quarantineCertificates.map((item) => ({ label: `${item.certificateNo} / ${item.vehiclePlateNo}`, value: item.certificateNo, plateNo: item.vehiclePlateNo })))

function recognizePlate() {
  const cert = store.data.quarantineCertificates.find((item) => item.certificateNo === form.query || item.vehiclePlateNo === form.query)
  form.recognizedPlateNo = cert?.vehiclePlateNo ?? '皖K·UNKNOWN'
  recognitionText.value = `车牌识别结果：${form.recognizedPlateNo}`
}

async function check() {
  const entry = await store.performEntryCheck(form)
  lastEntryId.value = entry.id
  if (entry.status === 'entry_passed') ElMessage.success('入场查验通过，可进入待宰管理')
  else ElMessage.error('入场被阻断，已生成预警或无害化任务')
}
</script>

<template>
  <section class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><strong>入场查验增强核验</strong></template>
      <el-form label-position="top">
        <el-form-item label="车牌或检疫证明编号">
          <el-select v-model="form.query" filterable allow-create class="full-width" placeholder="输入车牌或选择证明">
            <el-option v-for="item in certificateOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="车牌识别">
          <div class="action-inline full-width"><el-input v-model="form.recognizedPlateNo" placeholder="点击识别自动填充" /><el-button @click="recognizePlate">识别车牌</el-button></div>
          <small>{{ recognitionText }}</small>
        </el-form-item>
        <el-form-item label="实际入场数量"><el-input-number v-model="form.actualQuantity" :min="1" class="full-width" /></el-form-item>
        <el-form-item label="入场通道">
          <el-select v-model="form.channel" class="full-width">
            <el-option label="东门动物运输专用通道" value="东门动物运输专用通道" />
            <el-option label="北门临检通道" value="北门临检通道" />
          </el-select>
        </el-form-item>
        <el-form-item label="耳标一致性"><el-switch v-model="form.earTagMatched" active-text="一致" inactive-text="不一致" /></el-form-item>
        <el-form-item label="启运地与耳标区划"><el-switch v-model="form.originRegionMatched" active-text="一致" inactive-text="不一致" /></el-form-item>
        <el-button type="success" size="large" class="full-width" @click="check">自动核验入场</el-button>
      </el-form>
    </el-card>
    <el-card class="panel-card">
      <template #header><strong>核验结果</strong></template>
      <div v-if="lastEntry" class="check-list">
        <div v-for="item in lastEntry.checks" :key="item.label" class="check-row">
          <el-tag :type="item.passed ? 'success' : 'danger'">{{ item.passed ? '通过' : '阻断/预警' }}</el-tag>
          <div><b>{{ item.label }}</b><p>{{ item.message }}</p></div>
        </div>
      </div>
      <el-empty v-else description="等待入场核验" />
    </el-card>
  </section>
</template>
