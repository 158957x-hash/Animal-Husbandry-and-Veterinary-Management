<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const passedEntries = computed(() => store.data.entryChecks.filter((item) => item.status === 'entry_passed'))
const form = reactive({
  entryCheckId: passedEntries.value[0]?.id ?? '',
  quantity: 60,
  africanSwineFeverResult: 'negative' as const,
  bannedDrugResult: 'negative' as const,
})
const selectedEntry = computed(() => store.data.entryChecks.find((item) => item.id === form.entryCheckId))

async function submit() {
  await store.submitSlaughterApplication(form)
  ElMessage.success('屠宰检疫申报已提交至官方兽医')
}
</script>

<template>
  <section class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><strong>屠宰检疫申报</strong></template>
      <el-form label-position="top">
        <el-form-item label="入场批次">
          <el-select v-model="form.entryCheckId" class="full-width" placeholder="请选择已通过入场查验的批次">
            <el-option v-for="entry in passedEntries" :key="entry.id" :label="`${entry.plateNo} / ${entry.checkedAt}`" :value="entry.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="待宰数量">
          <el-input-number v-model="form.quantity" :min="1" class="full-width" />
        </el-form-item>
        <el-form-item label="非洲猪瘟检测结果">
          <el-radio-group v-model="form.africanSwineFeverResult">
            <el-radio-button label="negative">阴性</el-radio-button>
            <el-radio-button label="positive">阳性</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="违禁药物自检结果">
          <el-radio-group v-model="form.bannedDrugResult">
            <el-radio-button label="negative">阴性</el-radio-button>
            <el-radio-button label="positive">阳性</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-button type="success" size="large" class="full-width" :disabled="!form.entryCheckId" @click="submit">提交屠宰检疫申报</el-button>
      </el-form>
    </el-card>
    <el-card class="panel-card">
      <template #header><strong>入场查验关联信息</strong></template>
      <div v-if="selectedEntry" class="check-list">
        <div v-for="item in selectedEntry.checks" :key="item.label" class="check-row">
          <el-tag :type="item.passed ? 'success' : 'danger'">{{ item.passed ? '通过' : '异常' }}</el-tag>
          <div><b>{{ item.label }}</b><p>{{ item.message }}</p></div>
        </div>
      </div>
      <el-empty v-else description="请先完成入场查验" />
    </el-card>
  </section>
</template>
