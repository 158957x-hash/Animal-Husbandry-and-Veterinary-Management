<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const application = computed(() => store.data.originApplications.find((item) => item.id === route.params.id))
const form = reactive({
  faceRecognitionPassed: true,
  siteInspectionPassed: true,
  evidencePhotoCount: 3,
  remark: '人证一致，临床检查健康，运输工具消毒合格',
})

async function approve() {
  if (!application.value) return
  await store.approveOriginApplication(application.value.id, form)
  ElMessage.success('动物检疫合格证明已生成，运输任务已同步监管端')
  router.push('/vet/origin-todos')
}
</script>

<template>
  <section v-if="application" class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><strong>现场查验与无纸化出证</strong></template>
      <div class="inspection-steps">
        <div class="step-box done"><b>人脸识别</b><span>官方兽医身份核验通过</span></div>
        <div class="step-box done"><b>现场查验</b><span>动物精神状态、耳标、数量核验</span></div>
        <div class="step-box done"><b>拍照取证</b><span>上传车辆、耳标、装载照片</span></div>
      </div>
      <el-form label-position="top">
        <el-form-item label="人脸识别">
          <el-switch v-model="form.faceRecognitionPassed" active-text="通过" inactive-text="不通过" />
        </el-form-item>
        <el-form-item label="现场查验">
          <el-switch v-model="form.siteInspectionPassed" active-text="合格" inactive-text="不合格" />
        </el-form-item>
        <el-form-item label="取证照片数量">
          <el-input-number v-model="form.evidencePhotoCount" :min="0" :max="9" />
        </el-form-item>
        <el-form-item label="查验意见">
          <el-input v-model="form.remark" type="textarea" :rows="4" />
        </el-form-item>
        <el-button type="success" size="large" class="full-width" @click="approve">审核通过并出证</el-button>
      </el-form>
    </el-card>
    <el-card class="panel-card">
      <template #header><strong>申报核验结果</strong></template>
      <div class="info-list">
        <p><span>申报编号</span><b>{{ application.applicationNo }}</b></p>
        <p><span>动物种类</span><b>{{ application.animalType }}</b></p>
        <p><span>申报数量</span><b>{{ application.quantity }}</b></p>
        <p><span>目的地</span><b>{{ application.destination }}</b></p>
      </div>
      <el-divider />
      <div class="evidence-grid">
        <div>车辆照片</div>
        <div>耳标照片</div>
        <div>装载照片</div>
      </div>
    </el-card>
  </section>
  <el-empty v-else description="未找到申报" />
</template>
