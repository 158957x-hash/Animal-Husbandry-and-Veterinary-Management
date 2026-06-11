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
  }
  return store.session ? map[store.session.role] : '未登录'
})

const menus = computed(() => {
  if (store.currentRole === 'farmer') {
    return [
      { path: '/farmer/origin-apply', label: '产地检疫申报' },
      { path: '/farmer/origin-detail', label: '申报详情与证明' },
    ]
  }
  if (store.currentRole === 'vet') {
    return [
      { path: '/vet/origin-todos', label: '产地检疫待办' },
      { path: '/vet/slaughter-audit', label: '屠宰检疫审核' },
    ]
  }
  if (store.currentRole === 'slaughter') {
    return [
      { path: '/slaughter/entry-check', label: '入场查验' },
      { path: '/slaughter/waiting-slaughter', label: '待宰管理' },
      { path: '/slaughter/slaughter-apply', label: '屠宰检疫申报' },
    ]
  }
  if (store.currentRole === 'regulator') {
    return [
      { path: '/regulator/dashboard', label: '监管看板' },
      { path: '/regulator/transport-map', label: '调运监管一张图' },
      { path: '/regulator/certificate-spot-check', label: '证明抽查' },
      { path: '/regulator/landing-report-spot-check', label: '落地报告抽查' },
      { path: '/regulator/origin-statistics', label: '产地检疫统计' },
      { path: '/regulator/carrier-restrictions', label: '承运限制管理' },
      { path: '/regulator/harmless-treatment', label: '无害化处理' },
      { path: '/regulator/seal-management', label: '检疫证章管理' },
      { path: '/regulator/slaughter-statistics', label: '屠宰统计分析' },
      { path: '/regulator/sync-logs', label: '接口同步日志' },
      { path: '/regulator/closed-loop', label: '闭环校验总览' },
    ]
  }
  return []
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
        <p>系统辅助工具</p>
        <el-button type="success" class="full-width" @click="refreshData">刷新业务数据</el-button>
        <el-button plain class="full-width" @click="reset">恢复初始数据</el-button>
        <el-button class="full-width" @click="router.push('/regulator/closed-loop')">查看闭环校验</el-button>
      </div>
    </div>
  </div>
</template>
