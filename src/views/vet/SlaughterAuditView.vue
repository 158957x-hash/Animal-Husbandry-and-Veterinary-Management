<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'
import { statusText, statusType } from '../../domain/stateMachine'

const store = useAppStore()
const selectedWaitingId = ref('')
const selectedWaiting = computed(() => store.data.waitingSlaughterBatches.find((item) => item.id === selectedWaitingId.value) ?? store.data.waitingSlaughterBatches[0])
const anteForm = reactive({ checkedBy: '官方兽医 王敏', passed: true, remark: '宰前检查合格' })
const postForm = reactive({ checkedBy: '官方兽医 王敏', qualifiedQuantity: 48, unqualifiedQuantity: 0, productWeight: 3900, remark: '宰后同步检疫合格' })
const certForm = reactive({ productName: '白条猪肉', weight: 3900, issuedBy: '官方兽医 王敏', inspector: '品质检验员 周宁' })

async function ante() {
  if (!selectedWaiting.value) return
  await store.submitAnteMortemCheck({ waitingBatchId: selectedWaiting.value.id, ...anteForm })
  ElMessage.success('宰前检查已完成')
}

async function post() {
  if (!selectedWaiting.value) return
  await store.submitPostMortemCheck({ waitingBatchId: selectedWaiting.value.id, ...postForm })
  ElMessage.success(postForm.unqualifiedQuantity > 0 ? '宰后检疫完成，已生成无害化任务' : '宰后检疫完成')
}

async function issue() {
  if (!selectedWaiting.value) return
  await store.issueProductCertificate({ waitingBatchId: selectedWaiting.value.id, productName: certForm.productName, weight: certForm.weight, issuedBy: certForm.issuedBy })
  await store.issueMeatQualityCertificate({ waitingBatchId: selectedWaiting.value.id, productName: certForm.productName, weight: certForm.weight, inspector: certForm.inspector })
  await store.linkThreeCertificates(selectedWaiting.value.id)
  ElMessage.success('产品证、肉品品质证和三证关联已完成')
}
</script>

<template>
  <section class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><strong>屠宰检疫全过程审核</strong></template>
      <el-form label-position="top">
        <el-form-item label="待宰批次">
          <el-select v-model="selectedWaitingId" class="full-width" placeholder="选择待宰批次">
            <el-option v-for="batch in store.data.waitingSlaughterBatches" :key="batch.id" :label="`${batch.animalType} / ${batch.quantity}头 / ${statusText[batch.status]}`" :value="batch.id" />
          </el-select>
        </el-form-item>
        <el-divider>宰前检查</el-divider>
        <el-form-item label="宰前检查"><el-switch v-model="anteForm.passed" active-text="合格" inactive-text="不合格" /></el-form-item>
        <el-form-item label="宰前意见"><el-input v-model="anteForm.remark" /></el-form-item>
        <el-button type="success" :disabled="!selectedWaiting" @click="ante">完成宰前检查</el-button>
        <el-divider>宰后同步检疫</el-divider>
        <el-form-item label="合格数量"><el-input-number v-model="postForm.qualifiedQuantity" :min="0" class="full-width" /></el-form-item>
        <el-form-item label="不合格数量"><el-input-number v-model="postForm.unqualifiedQuantity" :min="0" class="full-width" /></el-form-item>
        <el-form-item label="产品重量 kg"><el-input-number v-model="postForm.productWeight" :min="0" class="full-width" /></el-form-item>
        <el-button type="warning" :disabled="!selectedWaiting" @click="post">完成宰后检疫</el-button>
        <el-divider>产品出证与三证关联</el-divider>
        <el-form-item label="产品名称"><el-input v-model="certForm.productName" /></el-form-item>
        <el-form-item label="出证重量 kg"><el-input-number v-model="certForm.weight" :min="0" class="full-width" /></el-form-item>
        <el-button type="success" :disabled="!selectedWaiting" @click="issue">生成双证并关联三证</el-button>
      </el-form>
    </el-card>
    <el-card class="panel-card">
      <template #header><strong>待宰与证书状态</strong></template>
      <div v-for="batch in store.data.waitingSlaughterBatches" :key="batch.id" class="task-item large" @click="selectedWaitingId = batch.id">
        <div><b>{{ batch.animalType }} {{ batch.quantity }} 头</b><p>产品证 {{ store.data.productCertificates.filter((item) => item.waitingBatchId === batch.id).length }} · 肉品证 {{ store.data.meatQualityCertificates.filter((item) => item.waitingBatchId === batch.id).length }}</p></div>
        <el-tag :type="statusType[batch.status]">{{ statusText[batch.status] }}</el-tag>
      </div>
    </el-card>
  </section>
</template>
