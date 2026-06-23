<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Bell,
  SwitchButton,
  Odometer,
  Reading,
  Document,
  Box,
  MagicStick,
  DataAnalysis,
  Monitor,
  FirstAidKit,
  Connection,
  Key,
  Histogram,
  Tickets,
  Promotion,
  Position,
  Compass,
  MapLocation,
  TakeawayBox,
  Search,
  List,
  EditPen,
  User,
  UserFilled,
  House,
  Calendar,
  Memo,
  Goods,
  SetUp,
  Lock,
} from '@element-plus/icons-vue'
import QRCode from 'qrcode'
import { useAppStore } from '../stores/app'

const logoUrl = `${import.meta.env.BASE_URL}1.png`

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

type MenuLeaf = { label: string; path: string; icon: any }
type MenuGroup = { label: string; icon: any; children: MenuLeaf[] }
type MenuItem = MenuLeaf | MenuGroup

const vetBaseMenu: Array<{ label: string; path: string }> = [
  { label: '宠物档案管理', path: '/clinic/veterinarian/pets' },
  { label: '宠物检疫管理', path: '' },
  { label: '宠物免疫管理', path: '' },
  { label: '免疫台账管理', path: '/clinic/veterinarian/immunization' },
  { label: '接诊管理', path: '/clinic/veterinarian/consultations' },
  { label: '年度报告', path: '/clinic/veterinarian/reports' },
]

const vetIconMap: Record<string, any> = {
  '宠物档案管理': UserFilled,
  '宠物检疫管理': Tickets,
  '宠物免疫管理': MagicStick,
  '免疫台账管理': Memo,
  '接诊管理': FirstAidKit,
  '年度报告': Calendar,
}

const menus = computed<MenuItem[]>(() => {
  const config: Record<string, MenuItem[]> = {
    farmer: [
      { label: '养殖场户工作台', path: '/farmer/dashboard', icon: Odometer },
      { label: '我的产地检疫申报', path: '/farmer/origin-applications', icon: Document },
    ],
    vet: [
      { label: '产地检疫待办', path: '/vet/origin-todos', icon: Tickets },
      { label: '宰前检疫', path: '/vet/slaughter-todos', icon: Reading },
      { label: '宰后检疫', path: '/vet/post-mortem-check', icon: MagicStick },
    ],
    slaughter: [
      { label: '屠宰企业工作台', path: '/slaughter/dashboard', icon: Odometer },
      { label: '入场查验', path: '/slaughter/entry-check', icon: Search },
      { label: '待宰管理', path: '/slaughter/waiting-slaughter', icon: List },
      { label: '屠宰管理', path: '/slaughter/slaughter-records', icon: EditPen },
      { label: '宰后管理', path: '/slaughter/slaughter-records', icon: Memo },
      { label: '肉品品质检验', path: '/slaughter/meat-quality', icon: TakeawayBox },
      { label: '检疫验讫标志管理', path: '/slaughter/mark-management', icon: Box },
      { label: '检疫验讫标志使用', path: '/slaughter/mark-usage', icon: Promotion },
      { label: '三证扫码查询', path: '/slaughter/traceability-query', icon: Position },
    ],
    regulator: [
      {
        label: '监管总览',
        icon: Monitor,
        children: [
          { label: '检疫监管', path: '/regulator/dashboard', icon: Odometer },
          { label: '闭环校验总览', path: '/regulator/closed-loop', icon: Connection },
        ],
      },
      {
        label: '检疫调运监管',
        icon: Promotion,
        children: [
          { label: '调运监管一张图', path: '/regulator/transport-map', icon: MapLocation },
          { label: '产地证明抽查', path: '/regulator/certificate-spot-check', icon: Search },
          { label: '落地报告抽查', path: '/regulator/landing-report-spot-check', icon: Document },
          { label: '产地统计分析', path: '/regulator/origin-statistics', icon: DataAnalysis },
          { label: '承运限制管理', path: '/regulator/carrier-restrictions', icon: Lock },
        ],
      },
      {
        label: '屠宰闭环监管',
        icon: Compass,
        children: [
          { label: '无害化处理', path: '/regulator/harmless-treatment', icon: MagicStick },
          { label: '证章管理', path: '/regulator/seal-management', icon: Key },
          { label: '屠宰统计分析', path: '/regulator/slaughter-statistics', icon: Histogram },
        ],
      },
      {
        label: '检疫验讫标志管理',
        icon: Box,
        children: [
          { label: '申领/退回审核', path: '/regulator/quarantine-mark/review', icon: Document },
          { label: '标志发放', path: '/regulator/quarantine-mark/issue', icon: Promotion },
          { label: '标志库存', path: '/regulator/quarantine-mark/inventory', icon: Goods },
          { label: '标志退回', path: '/regulator/quarantine-mark/return', icon: TakeawayBox },
        ],
      },
      {
        label: '诊疗机构监管',
        icon: FirstAidKit,
        children: [
          { label: '诊疗监管', path: '/regulator/clinic-supervision', icon: Monitor },
          { label: '诊疗机构审核', path: '/regulator/clinic-institutions', icon: House },
          { label: '执业兽医备案审核', path: '/regulator/clinic-veterinarians', icon: User },
          { label: '年度报告审核', path: '/regulator/clinic-reports', icon: Memo },
          { label: '执业兽医报告管理', path: '/regulator/veterinarian-reports', icon: Calendar },
          { label: '药品处方监管', path: '/regulator/clinic-drug-supervision', icon: FirstAidKit },
          { label: '废弃物监管', path: '/regulator/clinic-waste-supervision', icon: TakeawayBox },
        ],
      },
      {
        label: '系统支撑',
        icon: SetUp,
        children: [
          { label: '接口同步日志', path: '/regulator/sync-logs', icon: Connection },
        ],
      },
    ],
    clinic_admin: [
      { label: '动物诊疗工作台', path: '/clinic/admin/dashboard', icon: Odometer },
      { label: '诊疗机构备案', path: '/clinic/admin/institutions', icon: House },
      { label: '执业兽医备案', path: '/clinic/admin/veterinarians', icon: User },
      { label: '药品库存管理', path: '/clinic/admin/drugs', icon: Box },
      { label: '药品出库管理', path: '/clinic/admin/drug-outbound', icon: Promotion },
      { label: '出入库记录', path: '/clinic/admin/drug-records', icon: Memo },
      { label: '废弃物处理', path: '/clinic/admin/waste', icon: TakeawayBox },
      { label: '年度报告', path: '/clinic/admin/reports', icon: Calendar },
      { label: '执业兽医年度报告审核', path: '/clinic/admin/veterinarian-reports', icon: Document },
    ],
    practicing_vet: vetBaseMenu.map((m) => ({ ...m, icon: vetIconMap[m.label] })),
    pet_owner: [
      { label: '宠物档案记录', path: '/clinic/owner/records', icon: UserFilled },
    ],
  }

  return store.currentRole ? (config[store.currentRole] ?? []) : []
})

function isPathActive(path: string) {
  return path && (route.path === path || route.path.startsWith(`${path}/`))
}

function isGroupActive(menu: MenuGroup) {
  return Array.isArray(menu.children) && menu.children.some((child) => isPathActive(child.path))
}

function isGroupOpen(menu: MenuGroup) {
  return openMenuGroups.value[menu.label] ?? isGroupActive(menu)
}

function toggleGroup(menu: MenuGroup) {
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
    <header class="topbar app-header">
      <div class="topbar-brand">
        <div class="brand-mark">
          <img :src="logoUrl" alt="logo" />
        </div>
        <h1 class="brand-title">畜牧兽医管理分系统&quot;五位一体&quot;建设服务平台</h1>
      </div>
      <div class="user-section">
        <el-badge :value="store.data.alerts.length" :hidden="!store.data.alerts.length">
          <el-button class="header-icon-btn" text title="消息提醒" aria-label="消息提醒">
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>
        <div class="user-profile">
          <div class="user-avatar">{{ (store.session?.name || 'U')[0] }}</div>
          <div class="user-info">
            <span class="user-name">{{ store.session?.name }}</span>
            <span class="user-role">{{ roleText }}</span>
          </div>
        </div>
        <el-button class="header-icon-btn logout-btn" text title="退出登录" aria-label="退出登录" @click="logout">
          <el-icon><SwitchButton /></el-icon>
        </el-button>
      </div>
    </header>
    <aside class="sidebar">
      <nav class="nav-list">
        <template v-for="menu in menus" :key="menu.label">
          <div v-if="'children' in menu" class="nav-group" :class="{ active: isGroupActive(menu) }">
            <button
              class="nav-group-title"
              :class="{ active: isGroupActive(menu) }"
              type="button"
              @click="toggleGroup(menu)"
            >
              <el-icon class="nav-icon"><component :is="menu.icon" /></el-icon>
              <span class="nav-label">{{ menu.label }}</span>
              <span class="nav-group-arrow" :class="{ open: isGroupOpen(menu) }">⌄</span>
            </button>
            <div v-if="isGroupOpen(menu)" class="nav-group-children">
              <button
                v-for="child in menu.children"
                :key="child.path"
                class="nav-item nav-sub-item"
                :class="{ active: isPathActive(child.path) }"
                @click="child.path && router.push(child.path)"
              >
                <el-icon class="nav-icon"><component :is="child.icon" /></el-icon>
                <span class="nav-label">{{ child.label }}</span>
                <span v-if="isPathActive(child.path)" class="nav-active-dot"></span>
              </button>
            </div>
          </div>
          <button
            v-else
            :key="menu.path"
            class="nav-item"
            :class="{ active: isPathActive(menu.path) }"
            @click="menu.path && router.push(menu.path)"
          >
            <el-icon class="nav-icon"><component :is="(menu as any).icon" /></el-icon>
            <span class="nav-label">{{ menu.label }}</span>
            <span v-if="isPathActive(menu.path)" class="nav-active-dot"></span>
          </button>
        </template>
      </nav>
    </aside>
    <main class="main-panel">
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

<style scoped>
/* ============== 整体布局 ============== */
.shell {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: 64px 1fr;
  grid-template-areas:
    'topbar topbar'
    'sidebar main';
  min-height: 100vh;
  background: #f3f4f6;
}

/* ============== 顶部栏（横跨整个屏幕顶部，放品牌区+用户区） ============== */
.topbar {
  grid-area: topbar;
  height: 64px;
  padding: 0 24px;
  background: #104826;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 20;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
  padding-left: 0;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.brand-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.5px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  flex: 0 1 auto;
  min-width: 0;
}

/* ============== 侧边栏（与顶部栏连成一片深绿） ============== */
.sidebar {
  grid-area: sidebar;
  background: #104826;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.04);
  overflow: hidden;
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  align-self: start;
}

/* ============== 导航列表 ============== */
.nav-list {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px 24px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-list::-webkit-scrollbar {
  width: 4px;
}
.nav-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 2px;
}
.nav-list::-webkit-scrollbar-track {
  background: transparent;
}

/* ============== 菜单项通用 ============== */
.nav-item,
.nav-group-title {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  font-size: 16px;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  position: relative;
  transition: background-color 0.18s ease, color 0.18s ease;
  white-space: nowrap;
  overflow: hidden;
  height: 44px;
  box-sizing: border-box;
}

.nav-item:hover,
.nav-group-title:hover {
  background-color: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.nav-icon {
  font-size: 16px;
  color: #6cb97a;
  flex-shrink: 0;
  transition: color 0.18s ease;
}

.nav-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============== 激活态 ============== */
.nav-item.active,
.nav-group-title.active {
  background: #3a8a4a;
  color: #ffffff;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-item.active .nav-icon,
.nav-group-title.active .nav-icon {
  color: #ffffff;
}

/* 激活态右侧橙色小圆点 */
.nav-active-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f5a623;
  box-shadow: 0 0 0 2px rgba(245, 166, 35, 0.25);
  flex-shrink: 0;
  margin-left: auto;
}

/* ============== 分组 ============== */
.nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-group-title .nav-group-arrow {
  font-size: 14px;
  transition: transform 0.2s ease;
  color: rgba(255, 255, 255, 0.5);
}

.nav-group-title .nav-group-arrow.open {
  transform: rotate(180deg);
}

.nav-group-children {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
  padding-left: 16px;
}

.nav-sub-item {
  font-size: 15px;
  height: 42px;
  padding: 8px 14px;
  color: rgba(255, 255, 255, 0.72);
}

.nav-sub-item .nav-icon {
  font-size: 14px;
}

.nav-sub-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.nav-sub-item.active {
  background: #3a8a4a;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-sub-item.active .nav-icon {
  color: #ffffff;
}

/* ============== 主面板 ============== */
.main-panel {
  grid-area: main;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f3f4f6;
  overflow-x: hidden;
}

/* ============== 用户区域 ============== */
.user-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px;
  background: transparent;
  border-radius: 999px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a8ce0 0%, #2f6fd0 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0;
  line-height: 1.2;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
}

.user-role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
}

.header-icon-btn {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.header-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.logout-btn {
  color: rgba(255, 255, 255, 0.85);
}

.logout-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

/* ============== AI 助手浮窗 ============== */
.assistant-float {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
}

.assistant-trigger {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #3a8a4a;
  color: #fff;
  border: none;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(58, 138, 74, 0.32);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.assistant-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(58, 138, 74, 0.4);
}

.assistant-panel {
  position: absolute;
  right: 0;
  bottom: 70px;
  width: 280px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.18);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.assistant-header button {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #5a6b4e;
  width: 24px;
  height: 24px;
  line-height: 1;
}

.full-width {
  width: 100%;
  margin: 0;
}

.assistant-trace-card {
  border-top: 1px solid #eee;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.assistant-trace-card img {
  width: 160px;
  height: 160px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.assistant-trace-card small {
  word-break: break-all;
  color: #5a6b4e;
  font-size: 11px;
  text-align: center;
}

@media (max-width: 768px) {
  .shell {
    grid-template-columns: 200px 1fr;
  }
  .topbar {
    padding: 0 16px;
  }
  .brand-title {
    font-size: 13px;
  }
  .user-info {
    display: none;
  }
}
</style>
