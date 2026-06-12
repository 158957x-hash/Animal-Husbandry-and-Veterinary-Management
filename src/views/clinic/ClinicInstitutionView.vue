<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const form = reactive({
  name: '安心动物诊疗中心',
  licenseNo: '皖动诊许第2026001号',
  address: '安徽省合肥市包河区徽州大道 188 号',
  contactPerson: '周院长',
  phone: '0551-66889900',
  type: '动物诊所',
  mapPoint: '117.29,31.82',
})

async function submit() {
  await store.submitClinicInstitution({ ...form })
  ElMessage.success('诊疗机构备案已提交')
}

async function review(id: string, approved: boolean) {
  await store.reviewClinicInstitution(id, approved, approved ? '材料齐全，准予备案' : '材料不完整，退回补正')
  ElMessage.success(approved ? '备案审核通过' : '备案已驳回')
}
</script>

<template>
  <div class="page-grid two-col">
    <el-card class="panel-card">
      <template #header><b>诊疗机构备案</b></template>
      <el-form label-position="top">
        <el-form-item label="机构名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="许可证号"><el-input v-model="form.licenseNo" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="form.contactPerson" /></el-form-item>
        <el-form-item label="联系方式"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="机构类型"><el-input v-model="form.type" /></el-form-item>
        <el-form-item label="地图点位"><el-input v-model="form.mapPoint" /></el-form-item>
        <el-button type="success" class="full-width" @click="submit">提交备案</el-button>
      </el-form>
    </el-card>

    <div class="stack">
      <el-card class="panel-card">
        <template #header><b>备案审核与地图</b></template>
        <div class="mock-map" style="height: 260px">
          <div class="map-node start">市区监管中心</div>
          <div v-for="item in store.data.clinicInstitutions.filter((clinic) => clinic.status === 'approved')" :key="item.id" class="map-node end">{{ item.name }}</div>
        </div>
      </el-card>
      <el-card v-for="item in store.data.clinicInstitutions" :key="item.id" class="panel-card">
        <div class="task-item large">
          <div>
            <b>{{ item.name }}</b>
            <p>{{ item.licenseNo }}｜{{ item.address }}</p>
            <p>{{ item.contactPerson }} {{ item.phone }}｜{{ item.mapPoint }}</p>
          </div>
          <div class="action-inline">
            <el-tag :type="item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'">{{ item.status === 'approved' ? '已通过' : item.status === 'rejected' ? '已驳回' : '待审核' }}</el-tag>
            <el-button v-if="item.status === 'pending'" size="small" type="success" @click="review(item.id, true)">通过</el-button>
            <el-button v-if="item.status === 'pending'" size="small" type="danger" @click="review(item.id, false)">驳回</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>
