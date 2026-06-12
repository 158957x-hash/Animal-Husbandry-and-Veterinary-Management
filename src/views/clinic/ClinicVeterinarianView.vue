<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const approvedInstitutions = computed(() => store.data.clinicInstitutions.filter((item) => item.status === 'approved'))
const form = reactive({
  name: '陈晓宁',
  certificateNo: 'VET-AH-2026-001',
  practiceType: 'licensed_veterinarian' as const,
  institutionId: '',
  practiceScope: '犬猫诊疗、免疫接种、处方开具',
  phone: '13900001111',
  material: '执业兽医资格证、劳动合同、身份证明',
})

async function submit() {
  const institutionId = form.institutionId || approvedInstitutions.value[0]?.id
  if (!institutionId) return ElMessage.warning('请先完成诊疗机构备案审核')
  await store.submitVeterinarian({ ...form, institutionId })
  ElMessage.success('执业兽医备案已提交')
}

async function review(id: string, approved: boolean) {
  await store.reviewVeterinarian(id, approved, approved ? '人员资质有效' : '人员材料需补正')
  ElMessage.success(approved ? '兽医备案审核通过' : '兽医备案已驳回')
}
</script>

<template>
  <div class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><b>执业兽医备案</b></template>
      <el-form label-position="top">
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="证书编号"><el-input v-model="form.certificateNo" /></el-form-item>
        <el-form-item label="执业类型">
          <el-select v-model="form.practiceType" class="full-width">
            <el-option label="执业兽医师" value="licensed_veterinarian" />
            <el-option label="执业助理兽医师" value="assistant_veterinarian" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属诊疗机构">
          <el-select v-model="form.institutionId" class="full-width" placeholder="选择已备案机构">
            <el-option v-for="item in approvedInstitutions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="执业范围"><el-input v-model="form.practiceScope" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="备案材料"><el-input v-model="form.material" type="textarea" /></el-form-item>
        <el-button type="success" class="full-width" @click="submit">提交备案</el-button>
      </el-form>
    </el-card>

    <el-card class="panel-card">
      <template #header><b>备案记录</b></template>
      <div v-for="item in store.data.veterinarians" :key="item.id" class="task-item large">
        <div>
          <b>{{ item.name }}</b>
          <p>{{ item.certificateNo }}｜{{ item.practiceType === 'licensed_veterinarian' ? '执业兽医师' : '执业助理兽医师' }}</p>
          <p>{{ item.practiceScope }}</p>
        </div>
        <div class="action-inline">
          <el-tag :type="item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'">{{ item.status === 'approved' ? '已通过' : item.status === 'rejected' ? '已驳回' : '待审核' }}</el-tag>
          <el-button v-if="item.status === 'pending'" size="small" type="success" @click="review(item.id, true)">通过</el-button>
          <el-button v-if="item.status === 'pending'" size="small" type="danger" @click="review(item.id, false)">驳回</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>
