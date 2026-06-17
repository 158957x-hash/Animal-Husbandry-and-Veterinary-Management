<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const assistantVisible = ref(false)
const openMenuGroups = ref<Record<string, boolean>>({})
const traceQrCode = ref('')
const traceBaseUrl = ref('')

onMounted(() => {
  traceBaseUrl.value = getDefaultTraceBaseUrl()
  generateTraceQrCode()
})

async function generateTraceQrCode() {
  traceQrCode.value = await QRCode.toDataURL(getTraceUrl(), { width: 180, margin: 1 })
}

function getDefaultTraceBaseUrl() {
  const base = import.meta.env.BASE_URL || '/'
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:${window.location.port}${base}`
  }
  return `${window.location.origin}${base}`
}

function normalizeTraceBaseUrl(value: string) {
  return value.endsWith('/') ? value : `${value}/`
}

function getTraceUrl() {
  return `${normalizeTraceBaseUrl(traceBaseUrl.value || getDefaultTraceBaseUrl())}#/public/mark-trace`
}

function onTraceBaseUrlChange() {
  traceBaseUrl.value = normalizeTraceBaseUrl(traceBaseUrl.value)
  generateTraceQrCode()
}

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
      { label: '宰前检疫', path: '/vet/slaughter-todos' },
      { label: '宰后检疫', path: '/vet/post-mortem-check' },
    ],
    slaughter: [
      { label: '屠宰企业工作台', path: '/slaughter/dashboard' },
      { label: '入场查验', path: '/slaughter/entry-check' },
      { label: '待宰管理', path: '/slaughter/waiting-slaughter' },
      // { label: '屠宰检疫申报', path: '/slaughter/slaughter-apply' },
      { label: '宰后管理', path: '/slaughter/slaughter-records' },
      { label: '肉品品质检验', path: '/slaughter/meat-quality' },
      { label: '检疫验讫标志管理', path: '/slaughter/mark-management' },
      { label: '检疫验讫标志使用', path: '/slaughter/mark-usage' },
      { label: '三证扫码查询', path: '/slaughter/traceability-query' },
    ],
    regulator: [
      {
        label: '监管总览',
        children: [
          { label: '检疫监管', path: '/regulator/dashboard' },
          { label: '闭环校验总览', path: '/regulator/closed-loop' },
        ],
      },
      {
        label: '检疫调运监管',
        children: [
          { label: '调运监管一张图', path: '/regulator/transport-map' },
          { label: '产地证明抽查', path: '/regulator/certificate-spot-check' },
          { label: '落地报告抽查', path: '/regulator/landing-report-spot-check' },
          { label: '产地统计分析', path: '/regulator/origin-statistics' },
          { label: '承运限制管理', path: '/regulator/carrier-restrictions' },
        ],
      },
      {
        label: '屠宰闭环监管',
        children: [
          { label: '无害化处理', path: '/regulator/harmless-treatment' },
          { label: '证章管理', path: '/regulator/seal-management' },
          { label: '屠宰统计分析', path: '/regulator/slaughter-statistics' },
        ],
      },
      {
        label: '检疫验讫标志管理',
        children: [
          { label: '申领/退回审核', path: '/regulator/quarantine-mark/review' },
          { label: '标志发放', path: '/regulator/quarantine-mark/issue' },
          { label: '标志库存', path: '/regulator/quarantine-mark/inventory' },
          { label: '标志退回', path: '/regulator/quarantine-mark/return' },
        ],
      },
      {
        label: '诊疗机构监管',
        children: [
          { label: '诊疗监管', path: '/regulator/clinic-supervision' },
          { label: '诊疗机构审核', path: '/regulator/clinic-institutions' },
          { label: '执业兽医备案审核', path: '/regulator/clinic-veterinarians' },
          { label: '年度报告审核', path: '/regulator/clinic-reports' },
          { label: '执业兽医报告管理', path: '/regulator/veterinarian-reports' },
          { label: '药品处方监管', path: '/regulator/clinic-drug-supervision' },
          { label: '废弃物监管', path: '/regulator/clinic-waste-supervision' },
        ],
      },
      {
        label: '系统支撑',
        children: [
          { label: '接口同步日志', path: '/regulator/sync-logs' },
        ],
      },
    ],
    clinic_admin: [
      { label: '动物诊疗工作台', path: '/clinic/admin/dashboard' },
      { label: '诊疗机构备案', path: '/clinic/admin/institutions' },
      { label: '执业兽医备案', path: '/clinic/admin/veterinarians' },
      { label: '药品库存管理', path: '/clinic/admin/drugs' },
      { label: '药品出库管理', path: '/clinic/admin/drug-outbound' },
      { label: '出入库记录', path: '/clinic/admin/drug-records' },
      { label: '废弃物处理', path: '/clinic/admin/waste' },
      { label: '年度报告', path: '/clinic/admin/reports' },
      { label: '执业兽医年度报告审核', path: '/clinic/admin/veterinarian-reports' },
    ],
    practicing_vet: [
      { label: '宠物档案管理', path: '/clinic/veterinarian/pets' },
      { label: '免疫台账管理', path: '/clinic/veterinarian/immunization' },
      { label: '接诊管理', path: '/clinic/veterinarian/consultations' },
      { label: '年度报告', path: '/clinic/veterinarian/reports' },
    ],
    pet_owner: [
      { label: '宠物档案记录', path: '/clinic/owner/records' },
    ],
  }

  return store.currentRole ? (config[store.currentRole as keyof typeof config] ?? []) : []
})

function isPathActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function isGroupActive(menu: any) {
  return Array.isArray(menu.children) && menu.children.some((child: any) => isPathActive(child.path))
}

function isGroupOpen(menu: any) {
  return openMenuGroups.value[menu.label] ?? isGroupActive(menu)
}

function toggleGroup(menu: any) {
  openMenuGroups.value[menu.label] = !isGroupOpen(menu)
}

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
        <template v-for="menu in menus" :key="menu.label">
          <div v-if="'children' in menu" class="nav-group" :class="{ active: isGroupActive(menu) }">
            <button class="nav-group-title" type="button" @click="toggleGroup(menu)">
              <span>{{ menu.label }}</span>
              <span class="nav-group-arrow" :class="{ open: isGroupOpen(menu) }">⌄</span>
            </button>
            <div v-if="isGroupOpen(menu)" class="nav-group-children">
              <button
                v-for="child in menu.children"
                :key="child.path"
                class="nav-item nav-sub-item"
                :class="{ active: isPathActive(child.path) }"
                @click="router.push(child.path)"
              >
                {{ child.label }}
              </button>
            </div>
          </div>
          <button
            v-else
            :key="menu.path"
            class="nav-item"
            :class="{ active: isPathActive(menu.path) }"
            @click="router.push(menu.path)"
          >
            {{ menu.label }}
          </button>
        </template>
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
        <div class="assistant-trace-card">
          <strong>扫码查验二维码</strong>
          <img v-if="traceQrCode" :src="traceQrCode" alt="扫码查验二维码" />
          <el-input v-model="traceBaseUrl" size="small" placeholder="扫码基础地址" @change="onTraceBaseUrlChange" />
          <small>{{ getTraceUrl() }}</small>
        </div>
      </div>
    </div>
  </div>
</template>
