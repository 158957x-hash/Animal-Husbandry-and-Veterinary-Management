import { createRouter, createWebHistory } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import LoginView from '../views/LoginView.vue'
import FarmerDashboardView from '../views/farmer/FarmerDashboardView.vue'
import OriginApplicationListView from '../views/farmer/OriginApplicationListView.vue'
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
import ClinicDashboardView from '../views/clinic/ClinicDashboardView.vue'
import ClinicInstitutionView from '../views/clinic/ClinicInstitutionView.vue'
import ClinicVeterinarianView from '../views/clinic/ClinicVeterinarianView.vue'
import PetProfileView from '../views/clinic/PetProfileView.vue'
import ImmunizationLedgerView from '../views/clinic/ImmunizationLedgerView.vue'
import DrugPrescriptionView from '../views/clinic/DrugPrescriptionView.vue'
import MedicalWasteView from '../views/clinic/MedicalWasteView.vue'
import AnnualReportView from '../views/clinic/AnnualReportView.vue'
import PetOwnerRecordsView from '../views/clinic/PetOwnerRecordsView.vue'
import ClinicSupervisionView from '../views/clinic/ClinicSupervisionView.vue'
import { useAppStore } from '../stores/app'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView },
    {
      path: '/',
      component: AppShell,
      children: [
        { path: 'farmer/dashboard', component: FarmerDashboardView, meta: { role: 'farmer' } },
        { path: 'farmer/origin-applications', component: OriginApplicationListView, meta: { role: 'farmer' } },
        { path: 'farmer/origin-apply', component: OriginApplyView, meta: { role: 'farmer' } },
        { path: 'farmer/origin-apply/:id', component: OriginApplyView, meta: { role: 'farmer' } },
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
        { path: 'regulator/clinic-supervision', component: ClinicSupervisionView, meta: { role: 'regulator' } },
        { path: 'regulator/clinic-institutions', component: ClinicInstitutionView, meta: { role: 'regulator' } },
        { path: 'regulator/clinic-veterinarians', component: ClinicVeterinarianView, meta: { role: 'regulator' } },
        { path: 'regulator/clinic-reports', component: AnnualReportView, meta: { role: 'regulator' } },
        { path: 'regulator/clinic-drug-supervision', component: DrugPrescriptionView, meta: { role: 'regulator' } },
        { path: 'regulator/clinic-waste-supervision', component: MedicalWasteView, meta: { role: 'regulator' } },
        { path: 'clinic/admin/dashboard', component: ClinicDashboardView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/institutions', component: ClinicInstitutionView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/veterinarians', component: ClinicVeterinarianView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/drugs', component: DrugPrescriptionView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/waste', component: MedicalWasteView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/reports', component: AnnualReportView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/veterinarian/pets', component: PetProfileView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/veterinarian/immunization', component: ImmunizationLedgerView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/veterinarian/prescriptions', component: DrugPrescriptionView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/owner/records', component: PetOwnerRecordsView, meta: { role: 'pet_owner' } },
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
