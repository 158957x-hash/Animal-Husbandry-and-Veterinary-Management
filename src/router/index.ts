import { createRouter, createWebHistory } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import LoginView from '../views/LoginView.vue'
import OriginApplyView from '../views/farmer/OriginApplyView.vue'
import OriginDetailView from '../views/farmer/OriginDetailView.vue'
import OriginTodoView from '../views/vet/OriginTodoView.vue'
import OriginInspectionView from '../views/vet/OriginInspectionView.vue'
import SlaughterAuditView from '../views/vet/SlaughterAuditView.vue'
import EntryCheckView from '../views/slaughter/EntryCheckView.vue'
import SlaughterApplyView from '../views/slaughter/SlaughterApplyView.vue'
import WaitingSlaughterView from '../views/slaughter/WaitingSlaughterView.vue'
import DashboardView from '../views/regulator/DashboardView.vue'
import TransportMapView from '../views/regulator/TransportMapView.vue'
import CertificateSpotCheckView from '../views/regulator/CertificateSpotCheckView.vue'
import LandingReportSpotCheckView from '../views/regulator/LandingReportSpotCheckView.vue'
import OriginStatisticsView from '../views/regulator/OriginStatisticsView.vue'
import CarrierRestrictionView from '../views/regulator/CarrierRestrictionView.vue'
import HarmlessTreatmentView from '../views/regulator/HarmlessTreatmentView.vue'
import SealManagementView from '../views/regulator/SealManagementView.vue'
import SlaughterStatisticsView from '../views/regulator/SlaughterStatisticsView.vue'
import SyncLogView from '../views/regulator/SyncLogView.vue'
import ClosedLoopOverviewView from '../views/regulator/ClosedLoopOverviewView.vue'
import { useAppStore } from '../stores/app'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView },
    {
      path: '/',
      component: AppShell,
      children: [
        { path: 'farmer/origin-apply', component: OriginApplyView, meta: { role: 'farmer' } },
        { path: 'farmer/origin-detail/:id?', component: OriginDetailView, meta: { role: 'farmer' } },
        { path: 'vet/origin-todos', component: OriginTodoView, meta: { role: 'vet' } },
        { path: 'vet/origin-inspection/:id', component: OriginInspectionView, meta: { role: 'vet' } },
        { path: 'vet/slaughter-audit', component: SlaughterAuditView, meta: { role: 'vet' } },
        { path: 'slaughter/entry-check', component: EntryCheckView, meta: { role: 'slaughter' } },
        { path: 'slaughter/waiting-slaughter', component: WaitingSlaughterView, meta: { role: 'slaughter' } },
        { path: 'slaughter/slaughter-apply', component: SlaughterApplyView, meta: { role: 'slaughter' } },
        { path: 'regulator/dashboard', component: DashboardView, meta: { role: 'regulator' } },
        { path: 'regulator/transport-map', component: TransportMapView, meta: { role: 'regulator' } },
        { path: 'regulator/certificate-spot-check', component: CertificateSpotCheckView, meta: { role: 'regulator' } },
        { path: 'regulator/landing-report-spot-check', component: LandingReportSpotCheckView, meta: { role: 'regulator' } },
        { path: 'regulator/origin-statistics', component: OriginStatisticsView, meta: { role: 'regulator' } },
        { path: 'regulator/carrier-restrictions', component: CarrierRestrictionView, meta: { role: 'regulator' } },
        { path: 'regulator/harmless-treatment', component: HarmlessTreatmentView, meta: { role: 'regulator' } },
        { path: 'regulator/seal-management', component: SealManagementView, meta: { role: 'regulator' } },
        { path: 'regulator/slaughter-statistics', component: SlaughterStatisticsView, meta: { role: 'regulator' } },
        { path: 'regulator/sync-logs', component: SyncLogView, meta: { role: 'regulator' } },
        { path: 'regulator/closed-loop', component: ClosedLoopOverviewView, meta: { role: 'regulator' } },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const store = useAppStore()
  if (!store.session) await store.bootstrap()
  if (to.path === '/login') return true
  if (!store.session) return '/login'
  if (to.meta.role && to.meta.role !== store.currentRole) return store.session.homePath
  return true
})

export default router
