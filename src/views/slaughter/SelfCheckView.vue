<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { formatTime } from '../../lib/format'
import type { DetectionResult, SlaughterBatch, SlaughterSelfInspection } from '../../domain/models'

const store = useAppStore()
const dialogVisible = ref(false)
const currentBatch = ref<SlaughterBatch | null>(null)

const form = reactive({
  africanSwineFeverResult: 'negative' as DetectionResult,
  africanSwineFeverTestPerson: '',
  africanSwineFeverTestTime: '',
  bannedDrugResult: 'negative' as DetectionResult,
  bannedDrugTestPerson: '',
  bannedDrugTestTime: '',
})

const pendingBatches = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'pending_self_check'))
const completedInspections = computed(() => store.data.slaughterBatches.filter((item) => item.status === 'self_check_passed' || item.status === 'self_check_failed'))

function getInspection(batchId: string): SlaughterSelfInspection | undefined {
  return store.data.slaughterSelfInspections.find((item) => item.batchId === batchId)
}

function openDialog(batch: SlaughterBatch) {
  currentBatch.value = batch
  form.africanSwineFeverResult = 'negative'
  form.africanSwineFeverTestPerson = ''
  form.africanSwineFeverTestTime = ''
  form.bannedDrugResult = 'negative'
  form.bannedDrugTestPerson = ''
  form.bannedDrugTestTime = ''
  dialogVisible.value = true
}

async function submitInspection() {
  if (!currentBatch.value) return
  if (!form.africanSwineFeverTestPerson || !form.bannedDrugTestPerson) {
    ElMessage.warning('请填写检测人员和自检人员')
    return
  }
  await store.submitSelfInspection({
    batchId: currentBatch.value.id,
    ...form,
  })
  ElMessage.success('自检结果已提交')
  dialogVisible.value = false
}
</script>

<template>
  <div class="page-grid">
    <div class="topbar">
      <h1>非瘟/违禁药物自检</h1>
    </div>

    <el-card class="panel-card">
      <template #header>
        <div class="card-header-line">
          <b>待宰批次自检</b>
          <small>对入场待宰批次进行非洲猪瘟检测和违禁药物自检，阴性结果方可进入屠宰流程</small>
        </div>
      </template>
      <el-table :data="pendingBatches" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="batchNo" label="批次编号" min-width="140" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column prop="entryQuantity" label="入场数量" width="100" />
        <el-table-column prop="waitingPenNo" label="待宰圈号" width="100" />
        <el-table-column prop="earTagRange" label="耳标号段" min-width="160" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag type="warning" size="small">待自检</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openDialog(row)">填报自检</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!pendingBatches.length" description="暂无待自检批次" />
    </el-card>

    <el-card class="panel-card">
      <template #header><b>已完成自检记录</b></template>
      <el-table :data="completedInspections" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="batchNo" label="批次编号" min-width="140" />
        <el-table-column prop="animalType" label="动物种类" width="100" />
        <el-table-column label="非瘟检测结果" width="130">
          <template #default="{ row }">
            <el-tag :type="getInspection(row.id)?.africanSwineFeverResult === 'negative' ? 'success' : 'danger'" size="small">
              {{ getInspection(row.id)?.africanSwineFeverResult === 'negative' ? '阴性' : '阳性' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="违禁药物检测结果" width="140">
          <template #default="{ row }">
            <el-tag :type="getInspection(row.id)?.bannedDrugResult === 'negative' ? 'success' : 'danger'" size="small">
              {{ getInspection(row.id)?.bannedDrugResult === 'negative' ? '阴性' : '阳性' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="检测人员" width="100">
          <template #default="{ row }">{{ getInspection(row.id)?.africanSwineFeverTestPerson || '-' }}</template>
        </el-table-column>
        <el-table-column label="自检状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'self_check_passed' ? 'success' : 'danger'" size="small">
              {{ row.status === 'self_check_passed' ? '自检通过' : '自检未通过' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="检测时间" min-width="160">
          <template #default="{ row }">{{ formatTime(getInspection(row.id)?.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!completedInspections.length" description="暂无已完成自检记录" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="填报自检结果" width="560px" destroy-on-close>
      <el-form label-position="top" v-if="currentBatch">
        <el-form-item label="批次编号">
          <el-input :model-value="currentBatch.batchNo" disabled />
        </el-form-item>

        <el-form-item label="非洲猪瘟检测结果">
          <el-radio-group v-model="form.africanSwineFeverResult">
            <el-radio-button label="negative">阴性</el-radio-button>
            <el-radio-button label="positive">阳性</el-radio-button>
          </el-radio-group>
          <el-alert v-if="form.africanSwineFeverResult === 'positive'" title="阳性结果！该批次将禁止进入屠宰流程，需上报官方兽医并启动无害化处理" type="error" :closable="false" show-icon style="margin-top: 8px" />
        </el-form-item>

        <el-form-item label="检测人员" required>
          <el-input v-model="form.africanSwineFeverTestPerson" placeholder="请输入检测人员姓名" />
        </el-form-item>

        <el-form-item label="检测时间" required>
          <el-input v-model="form.africanSwineFeverTestTime" type="datetime-local" />
        </el-form-item>

        <el-form-item label="违禁药物自检结果">
          <el-radio-group v-model="form.bannedDrugResult">
            <el-radio-button label="negative">阴性</el-radio-button>
            <el-radio-button label="positive">阳性</el-radio-button>
          </el-radio-group>
          <el-alert v-if="form.bannedDrugResult === 'positive'" title="阳性结果！该批次将禁止进入屠宰流程，需上报官方兽医并启动无害化处理" type="error" :closable="false" show-icon style="margin-top: 8px" />
        </el-form-item>

        <el-form-item label="自检人员" required>
          <el-input v-model="form.bannedDrugTestPerson" placeholder="请输入自检人员姓名" />
        </el-form-item>

        <el-form-item label="自检时间" required>
          <el-input v-model="form.bannedDrugTestTime" type="datetime-local" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInspection">提交自检结果</el-button>
      </template>
    </el-dialog>
  </div>
</template>
