<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const assistantVisible = ref(false)

const roleText = computed(() => {
  const map = {
    farmer: '养殖场户',
    vet: '官方兽医',
    slaughter: '屠宰企业',
    regulator: '监管人员',
    clinic_admin: '诊疗机构管理员',
    practicing_vet: '执业兽医',
    pet_owner: '宠物主人',
  }
  return store.session ? map[store.session.role] : '未登录'
})

const menus = computed(() => {
  const config = {
    farmer: [
      { label: '养殖场户工作台', path: '/farmer/dashboard' },
      { label: '我的产地检疫申报', path: '/farmer/origin-applications' },
      { label: '新增产地检疫申报', path: '/farmer/origin-apply' },
    ],
    vet: [
      { label: '产地检疫待办', path: '/vet/origin-todos' },
      { label: '屠宰检疫待办', path: '/vet/slaughter-todos' },
      { label: '屠宰检疫审核', path: '/vet/slaughter-audit' },
    ],
    slaughter: [
      { label: '屠宰企业工作台', path: '/slaughter/dashboard' },
      { label: '入场查验', path: '/slaughter/entry-check' },
      { label: '待宰管理', path: '/slaughter/waiting-slaughter' },
      { label: '非瘟/违禁药物自检', path: '/slaughter/self-check' },
      { label: '屠宰检疫申报', path: '/slaughter/slaughter-apply' },
      { label: '肉品品质检验', path: '/slaughter/meat-quality' },
      { label: '检疫验讫标志', path: '/slaughter/mark-management' },
      { label: '三证扫码查询', path: '/slaughter/traceability-query' },
    ],
    regulator: [
      { label: '检疫监管', path: '/regulator/dashboard' },
      { label: '诊疗监管', path: '/regulator/clinic-supervision' },
      { label: '调运监管一张图', path: '/regulator/transport-map' },
      { label: '产地证明抽查', path: '/regulator/certificate-spot-check' },
      { label: '落地报告抽查', path: '/regulator/landing-report-spot-check' },
      { label: '产地统计分析', path: '/regulator/origin-statistics' },
      { label: '承运限制管理', path: '/regulator/carrier-restrictions' },
      { label: '无害化处理', path: '/regulator/harmless-treatment' },
      { label: '证章管理', path: '/regulator/seal-management' },
      { label: '屠宰统计分析', path: '/regulator/slaughter-statistics' },
      { label: '接口同步日志', path: '/regulator/sync-logs' },
      { label: '闭环校验总览', path: '/regulator/closed-loop' },
      { label: '诊疗机构审核', path: '/regulator/clinic-institutions' },
      { label: '执业兽医审核', path: '/regulator/clinic-veterinarians' },
      { label: '年度报告查看', path: '/regulator/clinic-reports' },
      { label: '药品处方监管', path: '/regulator/clinic-drug-supervision' },
      { label: '废弃物监管', path: '/regulator/clinic-waste-supervision' },
    ],
    clinic_admin: [
      { label: '动物诊疗工作台', path: '/clinic/admin/dashboard' },
      { label: '诊疗机构备案', path: '/clinic/admin/institutions' },
      { label: '执业兽医备案', path: '/clinic/admin/veterinarians' },
      { label: '药品库存与处方', path: '/clinic/admin/drugs' },
      { label: '废弃物处理', path: '/clinic/admin/waste' },
      { label: '年度报告管理', path: '/clinic/admin/reports' },
    ],
    practicing_vet: [
      { label: '宠物主人与档案', path: '/clinic/veterinarian/pets' },
      { label: '免疫台账管理', path: '/clinic/veterinarian/immunization' },
      { label: '药品库存与处方', path: '/clinic/veterinarian/prescriptions' },
    ],
    pet_owner: [
      { label: '宠物档案记录', path: '/clinic/owner/records' },
    ],
  }

  return store.currentRole ? (config[store.currentRole as keyof typeof config] ?? []) : []
})

async function logout() {
  await store.logout()
  router.push('/login')
}

async function reset() {
  await store.restoreInitialData()
  ElMessage.success('业务数据已恢复到初始状态')
}

async function refreshData() {
  await store.refresh()
  ElMessage.success('业务数据已刷新')
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">牧</span>
        <div>
          <strong>畜牧兽医管理</strong>
          <small>检疫屠宰闭环监管</small>
        </div>
      </div>
      <nav class="nav-list">
        <button
          v-for="menu in menus"
          :key="menu.path"
          class="nav-item"
          :class="{ active: route.path === menu.path || route.path.startsWith(`${menu.path}/`) }"
          @click="router.push(menu.path)"
        >
          {{ menu.label }}
        </button>
      </nav>
      <div class="sidebar-footer">
        <el-button class="full-btn" @click="logout">返回角色选择</el-button>
      </div>
    </aside>
    <main class="main-panel">
      <header class="topbar">
        <div>
          <p class="eyebrow">{{ roleText }}工作台</p>
          <h1>{{ store.session?.name }}</h1>
        </div>
        <div class="topbar-stats">
          <span>申报 {{ store.data.originApplications.length }}</span>
          <span>证明 {{ store.data.quarantineCertificates.length + store.data.productCertificates.length }}</span>
          <span>预警 {{ store.data.alerts.length }}</span>
        </div>
      </header>
      <router-view />
    </main>

    <div class="assistant-float">
      <button class="assistant-trigger" @click="assistantVisible = !assistantVisible">AI助手</button>
      <div v-if="assistantVisible" class="assistant-panel">
        <div class="assistant-header">
          <strong>AI助手</strong>
          <button @click="assistantVisible = false">×</button>
        </div>
        <p>常用业务工具</p>
        <el-button type="success" class="full-width" @click="refreshData">刷新业务数据</el-button>
        <el-button plain class="full-width" @click="reset">恢复初始数据</el-button>
        <el-button class="full-width" @click="router.push('/regulator/closed-loop')">查看闭环校验</el-button>
      </div>
    </div>
  </div>
</template>
