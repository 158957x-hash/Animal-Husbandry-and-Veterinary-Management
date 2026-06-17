import { createRouter, createWebHashHistory } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import LoginView from '../views/LoginView.vue'
import FarmerDashboardView from '../views/farmer/FarmerDashboardView.vue'
import OriginApplicationListView from '../views/farmer/OriginApplicationListView.vue'
import OriginApplyView from '../views/farmer/OriginApplyView.vue'
import OriginDetailView from '../views/farmer/OriginDetailView.vue'
import OriginTodoView from '../views/vet/OriginTodoView.vue'
import OriginInspectionView from '../views/vet/OriginInspectionView.vue'
import EntryCheckView from '../views/slaughter/EntryCheckView.vue'
import EntryCheckProcessView from '../views/slaughter/EntryCheckProcessView.vue'
import EntryCheckDetailView from '../views/slaughter/EntryCheckDetailView.vue'
import SlaughterApplyView from '../views/slaughter/SlaughterApplyView.vue'
import SlaughterQuarantineApplyView from '../views/slaughter/SlaughterQuarantineApplyView.vue'
import WaitingSlaughterView from '../views/slaughter/WaitingSlaughterView.vue'
import WaitingSlaughterDetailView from '../views/slaughter/WaitingSlaughterDetailView.vue'
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
import SlaughterDashboardView from '../views/slaughter/SlaughterDashboardView.vue'
import MeatQualityView from '../views/slaughter/MeatQualityView.vue'
import MarkManagementView from '../views/slaughter/MarkManagementView.vue'
import SlaughterMarkUsageView from '../views/slaughter/MarkUsageView.vue'
import TraceabilityQueryView from '../views/slaughter/TraceabilityQueryView.vue'
import SlaughterTodoView from '../views/vet/SlaughterTodoView.vue'
import SlaughterAuditDetailView from '../views/vet/SlaughterAuditDetailView.vue'
import PostMortemCheckListView from '../views/vet/PostMortemCheckListView.vue'
import PostMortemCheckDetailView from '../views/vet/PostMortemCheckDetailView.vue'
import PostMortemCheckResultView from '../views/vet/PostMortemCheckResultView.vue'
import SlaughterRecordListView from '../views/slaughter/SlaughterRecordListView.vue'
import SlaughterSupervisionView from '../views/regulator/SlaughterSupervisionView.vue'
import TraceabilityTrackView from '../views/regulator/TraceabilityTrackView.vue'
import MarkUsageView from '../views/regulator/MarkUsageView.vue'
import QuarantineMarkManagementView from '../views/regulator/QuarantineMarkManagementView.vue'
import MarkTraceView from '../views/public/MarkTraceView.vue'
import VeterinarianRegistrationReviewView from '../views/regulator/VeterinarianRegistrationReviewView.vue'
import VeterinarianAnnualReportView from '../views/clinic/VeterinarianAnnualReportView.vue'
import VetAnnualReportReviewView from '../views/clinic/VetAnnualReportReviewView.vue'
import ConsultationListView from '../views/clinic/ConsultationListView.vue'
import ConsultationRegisterView from '../views/clinic/ConsultationRegisterView.vue'
import TreatmentRecordView from '../views/clinic/TreatmentRecordView.vue'
import PrescriptionWriteView from '../views/clinic/PrescriptionWriteView.vue'
import ConsultationDetailView from '../views/clinic/ConsultationDetailView.vue'
import DrugRequisitionConfirmView from '../views/clinic/DrugRequisitionConfirmView.vue'
import DrugOutboundView from '../views/clinic/DrugOutboundView.vue'
import DrugInOutRecordsView from '../views/clinic/DrugInOutRecordsView.vue'
import { useAppStore } from '../stores/app'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView },
    { path: '/public/mark-trace', component: MarkTraceView },
    { path: '/public/mark-trace/:markCode', component: MarkTraceView },
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
        { path: 'vet/slaughter-todos', component: SlaughterTodoView, meta: { role: 'vet' } },
        { path: 'vet/slaughter-audit/:id', component: SlaughterAuditDetailView, meta: { role: 'vet' } },
        { path: 'vet/post-mortem-check', component: PostMortemCheckListView, meta: { role: 'vet' } },
        { path: 'vet/post-mortem-check/:productBatchId', component: PostMortemCheckDetailView, meta: { role: 'vet' } },
        { path: 'vet/post-mortem-check/:productBatchId/detail', component: PostMortemCheckResultView, meta: { role: 'vet' } },
        { path: 'slaughter/entry-check', component: EntryCheckView, meta: { role: 'slaughter' } },
        { path: 'slaughter/entry-check/:id/process', component: EntryCheckProcessView, meta: { role: 'slaughter' } },
        { path: 'slaughter/entry-check/:id/detail', component: EntryCheckDetailView, meta: { role: 'slaughter' } },
        { path: 'slaughter/waiting-slaughter', component: WaitingSlaughterView, meta: { role: 'slaughter' } },
        { path: 'slaughter/waiting-slaughter/:id/detail', component: WaitingSlaughterDetailView, meta: { role: 'slaughter' } },
        { path: 'slaughter/slaughter-apply', component: SlaughterApplyView, meta: { role: 'slaughter' } },
        { path: 'slaughter/quarantine-apply/:batchId', component: SlaughterQuarantineApplyView, meta: { role: 'slaughter' } },
        { path: 'slaughter/dashboard', component: SlaughterDashboardView, meta: { role: 'slaughter' } },
        { path: 'slaughter/meat-quality', component: MeatQualityView, meta: { role: 'slaughter' } },
        { path: 'slaughter/mark-management', component: MarkManagementView, meta: { role: 'slaughter' } },
        { path: 'slaughter/mark-usage', component: SlaughterMarkUsageView, meta: { role: 'slaughter' } },
        { path: 'slaughter/traceability-query', component: TraceabilityQueryView, meta: { role: 'slaughter' } },
        { path: 'slaughter/slaughter-records', component: SlaughterRecordListView, meta: { role: 'slaughter' } },
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
        { path: 'regulator/slaughter-supervision', component: SlaughterSupervisionView, meta: { role: 'regulator' } },
        { path: 'regulator/traceability-track', component: TraceabilityTrackView, meta: { role: 'regulator' } },
        { path: 'regulator/mark-usage', component: MarkUsageView, meta: { role: 'regulator' } },
        { path: 'regulator/quarantine-mark/review', component: QuarantineMarkManagementView, meta: { role: 'regulator' } },
        { path: 'regulator/quarantine-mark/issue', component: QuarantineMarkManagementView, meta: { role: 'regulator' } },
        { path: 'regulator/quarantine-mark/inventory', component: QuarantineMarkManagementView, meta: { role: 'regulator' } },
        { path: 'regulator/quarantine-mark/return', component: QuarantineMarkManagementView, meta: { role: 'regulator' } },
        { path: 'regulator/clinic-supervision', component: ClinicSupervisionView, meta: { role: 'regulator' } },
        { path: 'regulator/clinic-institutions', component: ClinicInstitutionView, meta: { role: 'regulator' } },
        { path: 'regulator/clinic-veterinarians', component: VeterinarianRegistrationReviewView, meta: { role: 'regulator' } },
        { path: 'regulator/clinic-reports', component: AnnualReportView, meta: { role: 'regulator' } },
        { path: 'regulator/veterinarian-reports', component: VetAnnualReportReviewView, meta: { role: 'regulator' } },
        { path: 'regulator/clinic-drug-supervision', component: DrugPrescriptionView, meta: { role: 'regulator' } },
        { path: 'regulator/clinic-waste-supervision', component: MedicalWasteView, meta: { role: 'regulator' } },
        { path: 'clinic/admin/dashboard', component: ClinicDashboardView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/institutions', component: ClinicInstitutionView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/veterinarians', component: ClinicVeterinarianView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/drugs', component: DrugPrescriptionView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/drug-outbound', component: DrugOutboundView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/drug-records', component: DrugInOutRecordsView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/waste', component: MedicalWasteView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/reports', component: AnnualReportView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/admin/veterinarian-reports', component: VetAnnualReportReviewView, meta: { role: 'clinic_admin' } },
        { path: 'clinic/veterinarian/pets', component: PetProfileView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/veterinarian/immunization', component: ImmunizationLedgerView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/veterinarian/consultations', component: ConsultationListView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/veterinarian/consultation/register', component: ConsultationRegisterView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/veterinarian/consultation/:id/treatment', component: TreatmentRecordView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/veterinarian/consultation/:id/prescription', component: PrescriptionWriteView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/veterinarian/consultation/:id/detail', component: ConsultationDetailView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/veterinarian/consultation/:id/requisition', component: DrugRequisitionConfirmView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/veterinarian/reports', component: VeterinarianAnnualReportView, meta: { role: 'practicing_vet' } },
        { path: 'clinic/owner/records', component: PetOwnerRecordsView, meta: { role: 'pet_owner' } },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.path.startsWith('/public/')) return true
  const store = useAppStore()
  if (!store.session) await store.bootstrap()
  if (to.path === '/login') return true
  if (!store.session) return '/login'
  if (to.meta.role && to.meta.role !== store.currentRole) return store.session.homePath
  return true
})

export default router
