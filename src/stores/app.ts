import { defineStore } from 'pinia'
import { mockApi } from '../api/mockApi'
import type {
  AnteMortemInput,
  AppData,
  ClinicInstitutionInput,
  CompleteHarmlessInput,
  CompleteMedicalWasteInput,
  ConsultationInput,
  ConsultationPrescriptionInput,
  DrugRequisitionItem,
  DrugOutboundSelection,
  DrugStockInInput,
  EntryCheckInput,
  HarmlessTaskInput,
  ImmunizationInput,
  LandingReportInput,
  MeatQualityCertificateInput,
  MedicalWasteInput,
  OriginApplicationInput,
  OriginInspectionInput,
  PetOwnerInput,
  PetProfileInput,
  PostMortemInput,
  PrescriptionInput,
  ProductCertificateInput,
  SlaughterApplicationInput,
  SlaughterAuditInput,
  SlaughterEntryConfirmInput,
  SlaughterEntryExceptionInput,
  SlaughterEntryReturnInput,
  TransportExceptionInput,
  TreatmentRecordInput,
  UserRole,
  UserSession,
  VeterinarianInput,
} from '../domain/models'
import { createSeedData } from '../domain/seed'

export const useAppStore = defineStore('app', {
  state: () => ({
    session: undefined as UserSession | undefined,
    data: createSeedData() as AppData,
    loading: false,
    restoreVersion: 0,
  }),
  getters: {
    currentRole: (state) => state.session?.role,
    latestOriginApplication: (state) => state.data.originApplications[0],
    latestCertificate: (state) => state.data.quarantineCertificates[0],
    latestEntryCheck: (state) => state.data.entryChecks[0],
    pendingOriginApplications: (state) => state.data.originApplications.filter((item) => item.status === 'submitted'),
    pendingSlaughterApplications: (state) => state.data.slaughterApplications.filter((item) => item.status === 'submitted_pending_accept'),
    pendingHarmlessTasks: (state) => state.data.harmlessTasks.filter((item) => item.status !== 'completed'),
  },
  actions: {
    async refresh() {
      this.data = await mockApi.getBootstrapData()
    },
    async bootstrap() {
      this.loading = true
      try {
        this.session = await mockApi.getSession()
        this.data = await mockApi.getBootstrapData()
      } finally {
        this.loading = false
      }
    },
    async login(role: UserRole) {
      this.session = await mockApi.login(role)
      this.data = await mockApi.getBootstrapData()
      return this.session
    },
    async logout() {
      await mockApi.logout()
      this.session = undefined
    },
    async restoreInitialData() {
      this.data = await mockApi.restoreInitialData()
      this.restoreVersion += 1
    },
    async saveOriginDraft(input: OriginApplicationInput) {
      const result = await mockApi.saveOriginDraft(input)
      await this.refresh()
      return result
    },
    async updateOriginDraft(id: string, input: OriginApplicationInput) {
      const result = await mockApi.updateOriginDraft(id, input)
      await this.refresh()
      return result
    },
    async deleteOriginDraft(id: string) {
      await mockApi.deleteOriginDraft(id)
      await this.refresh()
    },
    async submitOriginDraft(id: string) {
      const result = await mockApi.submitOriginDraft(id)
      await this.refresh()
      return result
    },
    async submitOriginApplication(input: OriginApplicationInput) {
      const result = await mockApi.submitOriginApplication(input)
      await this.refresh()
      return result
    },
    async withdrawOriginApplication(id: string, reason: string) {
      const result = await mockApi.withdrawOriginApplication(id, reason)
      await this.refresh()
      return result
    },
    async rejectOriginApplication(id: string, reason: string) {
      const result = await mockApi.rejectOriginApplication(id, reason)
      await this.refresh()
      return result
    },
    async resubmitRejectedOriginApplication(id: string, input: OriginApplicationInput) {
      const result = await mockApi.resubmitRejectedOriginApplication(id, input)
      await this.refresh()
      return result
    },
    async voidOriginApplication(id: string, reason: string) {
      const result = await mockApi.voidOriginApplication(id, reason)
      await this.refresh()
      return result
    },
    async requestVoidOriginApplication(id: string, reason: string) {
      const result = await mockApi.requestVoidOriginApplication(id, reason)
      await this.refresh()
      return result
    },
    async approveOriginApplication(id: string, input: OriginInspectionInput) {
      const result = await mockApi.approveOriginApplication(id, input)
      await this.refresh()
      return result
    },
    async submitLandingReport(input: LandingReportInput) {
      const result = await mockApi.submitLandingReport(input)
      await this.refresh()
      return result
    },
    async markTransportException(input: TransportExceptionInput) {
      const result = await mockApi.markTransportException(input)
      await this.refresh()
      return result
    },
    async performEntryCheck(input: EntryCheckInput) {
      const result = await mockApi.performEntryCheck(input)
      await this.refresh()
      return result
    },
    async createWaitingSlaughterBatch(entryCheckId: string) {
      const result = await mockApi.createWaitingSlaughterBatch(entryCheckId)
      await this.refresh()
      return result
    },
    async submitAnteMortemCheck(input: AnteMortemInput) {
      const result = await mockApi.submitAnteMortemCheck(input)
      await this.refresh()
      return result
    },
    async submitPostMortemCheck(input: PostMortemInput) {
      const result = await mockApi.submitPostMortemCheck(input)
      await this.refresh()
      return result
    },
    async issueProductCertificate(input: ProductCertificateInput) {
      const result = await mockApi.issueProductCertificate(input)
      await this.refresh()
      return result
    },
    async issueMeatQualityCertificate(input: MeatQualityCertificateInput) {
      const result = await mockApi.issueMeatQualityCertificate(input)
      await this.refresh()
      return result
    },
    async linkThreeCertificates(waitingBatchId: string) {
      const result = await mockApi.linkThreeCertificates(waitingBatchId)
      await this.refresh()
      return result
    },
    async submitSlaughterApplication(input: SlaughterApplicationInput) {
      const result = await mockApi.submitSlaughterApplication(input)
      await this.refresh()
      return result
    },
    async approveSlaughterApplication(id: string, input: SlaughterAuditInput) {
      const result = await mockApi.approveSlaughterApplication(id, input)
      await this.refresh()
      return result
    },
    async createHarmlessTreatmentTask(input: HarmlessTaskInput) {
      const result = await mockApi.createHarmlessTreatmentTask(input)
      await this.refresh()
      return result
    },
    async completeHarmlessTreatment(input: CompleteHarmlessInput) {
      const result = await mockApi.completeHarmlessTreatment(input)
      await this.refresh()
      return result
    },
    async releaseCarrierRestriction(id: string, remark: string) {
      const result = await mockApi.releaseCarrierRestriction(id, remark)
      await this.refresh()
      return result
    },
    async submitClinicInstitution(input: ClinicInstitutionInput) {
      const result = await mockApi.submitClinicInstitution(input)
      await this.refresh()
      return result
    },
    async reviewClinicInstitution(id: string, approved: boolean, remark: string) {
      const result = await mockApi.reviewClinicInstitution(id, approved, remark)
      await this.refresh()
      return result
    },
    async submitVeterinarian(input: VeterinarianInput) {
      const result = await mockApi.submitVeterinarian(input)
      await this.refresh()
      return result
    },
    async reviewVeterinarian(id: string, approved: boolean, remark: string) {
      const result = await mockApi.reviewVeterinarian(id, approved, remark)
      await this.refresh()
      return result
    },
    async createPetOwner(input: PetOwnerInput) {
      const result = await mockApi.createPetOwner(input)
      await this.refresh()
      return result
    },
    async createPetProfile(input: PetProfileInput) {
      const result = await mockApi.createPetProfile(input)
      await this.refresh()
      return result
    },
    async createImmunizationRecord(input: ImmunizationInput) {
      const result = await mockApi.createImmunizationRecord(input)
      await this.refresh()
      return result
    },
    async stockInDrug(input: DrugStockInInput) {
      const result = await mockApi.stockInDrug(input)
      await this.refresh()
      return result
    },
    async issuePrescription(input: PrescriptionInput) {
      const result = await mockApi.issuePrescription(input)
      await this.refresh()
      return result
    },
    async createMedicalWaste(input: MedicalWasteInput) {
      const result = await mockApi.createMedicalWaste(input)
      await this.refresh()
      return result
    },
    async completeMedicalWaste(input: CompleteMedicalWasteInput) {
      const result = await mockApi.completeMedicalWaste(input)
      await this.refresh()
      return result
    },
    async generateAnnualReport(institutionId: string, year: number) {
      const result = await mockApi.generateAnnualReport(institutionId, year)
      await this.refresh()
      return result
    },
    async submitAnnualReport(id: string) {
      const result = await mockApi.submitAnnualReport(id)
      await this.refresh()
      return result
    },
    async saveAnnualReport(id: string) {
      const result = await mockApi.saveAnnualReport(id)
      await this.refresh()
      return result
    },
    async archiveAnnualReport(id: string, remark: string) {
      const result = await mockApi.archiveAnnualReport(id, remark)
      await this.refresh()
      return result
    },
    async generateVetAnnualReport(vetId: string, year: number) {
      const result = await mockApi.generateVetAnnualReport(vetId, year)
      await this.refresh()
      return result
    },
    async submitVetAnnualReportToClinic(id: string) {
      const result = await mockApi.submitVetAnnualReportToClinic(id)
      await this.refresh()
      return result
    },
    async clinicReviewVetAnnualReport(id: string, approved: boolean, remark: string) {
      const result = await mockApi.clinicReviewVetAnnualReport(id, approved, remark)
      await this.refresh()
      return result
    },
    async submitVetAnnualReportToRegulator(id: string) {
      const result = await mockApi.submitVetAnnualReportToRegulator(id)
      await this.refresh()
      return result
    },
    async archiveVetAnnualReport(id: string, remark: string) {
      const result = await mockApi.archiveVetAnnualReport(id, remark)
      await this.refresh()
      return result
    },
    async reviewVetAnnualReport(id: string, approved: boolean, remark: string) {
      const result = await mockApi.reviewVetAnnualReport(id, approved, remark)
      await this.refresh()
      return result
    },
    async reviewAnnualReport(id: string, approved: boolean, remark: string) {
      const result = await mockApi.reviewAnnualReport(id, approved, remark)
      await this.refresh()
      return result
    },
    async withdrawVetAnnualReport(id: string, reason: string) {
      const result = await mockApi.withdrawVetAnnualReport(id, reason)
      await this.refresh()
      return result
    },
    async updatePetProfile(id: string, input: Parameters<typeof mockApi.updatePetProfile>[1]) {
      const result = await mockApi.updatePetProfile(id, input)
      await this.refresh()
      return result
    },
    async deletePetProfile(id: string) {
      await mockApi.deletePetProfile(id)
      await this.refresh()
    },
    async disablePetProfile(id: string) {
      const result = await mockApi.disablePetProfile(id)
      await this.refresh()
      return result
    },
    async updateClinicInstitution(id: string, input: Parameters<typeof mockApi.updateClinicInstitution>[1]) {
      const result = await mockApi.updateClinicInstitution(id, input)
      await this.refresh()
      return result
    },
    async disableClinicInstitution(id: string) {
      const result = await mockApi.disableClinicInstitution(id)
      await this.refresh()
      return result
    },
    async updateVeterinarian(id: string, input: Parameters<typeof mockApi.updateVeterinarian>[1]) {
      const result = await mockApi.updateVeterinarian(id, input)
      await this.refresh()
      return result
    },
    async disableVeterinarian(id: string) {
      const result = await mockApi.disableVeterinarian(id)
      await this.refresh()
      return result
    },
    async submitVeterinarianRegistration(input: Parameters<typeof mockApi.submitVeterinarianRegistration>[0]) {
      const result = await mockApi.submitVeterinarianRegistration(input)
      await this.refresh()
      return result
    },
    async reviewVeterinarianRegistration(id: string, approved: boolean, remark: string) {
      const result = await mockApi.reviewVeterinarianRegistration(id, approved, remark)
      await this.refresh()
      return result
    },
    async batchSyncVeterinarianRegistrations(ids: string[]) {
      await mockApi.batchSyncVeterinarianRegistrations(ids)
      await this.refresh()
    },
    async voidPrescription(id: string, reason: string) {
      const result = await mockApi.voidPrescription(id, reason)
      await this.refresh()
      return result
    },
    async withdrawAnnualReport(id: string, reason: string) {
      const result = await mockApi.withdrawAnnualReport(id, reason)
      await this.refresh()
      return result
    },
    async updatePetOwner(id: string, input: Parameters<typeof mockApi.updatePetOwner>[1]) {
      const result = await mockApi.updatePetOwner(id, input)
      await this.refresh()
      return result
    },
    async deletePetOwner(id: string) {
      await mockApi.deletePetOwner(id)
      await this.refresh()
    },
    async updateDrugInventory(id: string, input: Parameters<typeof mockApi.updateDrugInventory>[1]) {
      const result = await mockApi.updateDrugInventory(id, input)
      await this.refresh()
      return result
    },
    async disableDrugInventory(id: string) {
      const result = await mockApi.disableDrugInventory(id)
      await this.refresh()
      return result
    },
    async voidImmunizationRecord(id: string, reason: string) {
      const result = await mockApi.voidImmunizationRecord(id, reason)
      await this.refresh()
      return result
    },
    async updateMedicalWaste(id: string, input: Parameters<typeof mockApi.updateMedicalWaste>[1]) {
      const result = await mockApi.updateMedicalWaste(id, input)
      await this.refresh()
      return result
    },
    async voidMedicalWaste(id: string, reason: string) {
      const result = await mockApi.voidMedicalWaste(id, reason)
      await this.refresh()
      return result
    },
    async retrySyncLog(id: string) {
      const result = await mockApi.retrySyncLog(id)
      await this.refresh()
      return result
    },
    async performSlaughterEntryCheck(input: EntryCheckInput) {
      const result = await mockApi.performSlaughterEntryCheck(input)
      await this.refresh()
      return result
    },
    async confirmSlaughterEntry(id: string, input: SlaughterEntryConfirmInput) {
      const result = await mockApi.confirmSlaughterEntry(id, input)
      await this.refresh()
      return result
    },
    async registerSlaughterEntryException(id: string, input: SlaughterEntryExceptionInput) {
      const result = await mockApi.registerSlaughterEntryException(id, input)
      await this.refresh()
      return result
    },
    async returnSlaughterEntry(id: string, input: SlaughterEntryReturnInput) {
      const result = await mockApi.returnSlaughterEntry(id, input)
      await this.refresh()
      return result
    },
    async getOriginCertificate(query: string) {
      return await mockApi.getOriginCertificate(query)
    },
    async submitSelfInspection(input: import('../domain/models').SlaughterSelfInspectionInput) {
      const result = await mockApi.submitSelfInspection(input)
      await this.refresh()
      return result
    },
    async submitSlaughterQuarantineApplication(input: import('../domain/models').SlaughterQuarantineApplicationInput) {
      const result = await mockApi.submitSlaughterQuarantineApplication(input)
      await this.refresh()
      return result
    },
    async acceptSlaughterApplication(id: string) {
      const result = await mockApi.acceptSlaughterApplication(id)
      await this.refresh()
      return result
    },
    async submitPreSlaughterCheck(applicationId: string, input: { checks: Record<string, boolean>; remark: string }) {
      const result = await mockApi.submitPreSlaughterCheck(applicationId, input)
      await this.refresh()
      return result
    },
    async submitPostSlaughterCheck(applicationId: string, input: { qualifiedQuantity: number; unqualifiedQuantity: number; productWeight: number; checks: Record<string, boolean>; remark: string }) {
      const result = await mockApi.submitPostSlaughterCheck(applicationId, input)
      await this.refresh()
      return result
    },
    async createMeatQualityCertificateExtended(input: import('../domain/models').MeatQualityCertificateInputExtended) {
      const result = await mockApi.createMeatQualityCertificateExtended(input)
      await this.refresh()
      return result
    },
    async issueProductQuarantineCertificate(applicationId: string, input: { productName: string; productBatchNo: string; weight: number; markType: import('../domain/models').MarkType; useObject: string }) {
      const result = await mockApi.issueProductQuarantineCertificate(applicationId, input)
      await this.refresh()
      return result
    },
    async applyQuarantineMarks(input: import('../domain/models').QuarantineMarkApplicationInput) {
      const result = await mockApi.applyQuarantineMarks(input)
      await this.refresh()
      return result
    },
    async applyQuarantineMarkReturn(input: import('../domain/models').QuarantineMarkReturnApplicationInput) {
      const result = await mockApi.applyQuarantineMarkReturn(input)
      await this.refresh()
      return result
    },
    async approveQuarantineMarkApplication(id: string) {
      const result = await mockApi.approveQuarantineMarkApplication(id)
      await this.refresh()
      return result
    },
    async rejectQuarantineMarkApplication(id: string, reason: string) {
      const result = await mockApi.rejectQuarantineMarkApplication(id, reason)
      await this.refresh()
      return result
    },
    async issueQuarantineMarks(id: string, markNos?: string[]) {
      const result = await mockApi.issueQuarantineMarks(id, markNos)
      await this.refresh()
      return result
    },
    async completeQuarantineMarkReturn(id: string) {
      const result = await mockApi.completeQuarantineMarkReturn(id)
      await this.refresh()
      return result
    },
    async getQuarantineMarkInventory() {
      return await mockApi.getQuarantineMarkInventory()
    },
    async getQuarantineMarkUsageRecords() {
      return await mockApi.getQuarantineMarkUsageRecords()
    },
    async getTraceabilityByMarkNo(markNo: string) {
      return await mockApi.getTraceabilityByMarkNo(markNo)
    },
    async getThreeCertificatesByProductCertificate(productCertificateId: string) {
      return await mockApi.getThreeCertificatesByProductCertificate(productCertificateId)
    },
    async submitAnteMortemCheckDetail(input: import('../domain/models').AnteMortemSubmitInput) {
      const result = await mockApi.submitAnteMortemCheckDetail(input)
      await this.refresh()
      return result
    },
    async submitMeatQualityCheckDetail(input: import('../domain/models').MeatQualitySubmitInput) {
      const result = await mockApi.submitMeatQualityCheckDetail(input)
      await this.refresh()
      return result
    },
    async submitPostMortemCheckDetail(input: import('../domain/models').PostMortemSubmitInput) {
      const result = await mockApi.submitPostMortemCheckDetail(input)
      await this.refresh()
      return result
    },
    async issueProductCertificateForBatch(input: import('../domain/models').ProductCertIssueInput) {
      const result = await mockApi.issueProductCertificateForBatch(input)
      await this.refresh()
      return result
    },
    async submitMarkUsage(input: import('../domain/models').MarkUsageSubmitInput) {
      const result = await mockApi.submitMarkUsage(input)
      await this.refresh()
      return result
    },
    async getTraceabilityByProductBatch(productBatchNo: string) {
      return await mockApi.getTraceabilityByProductBatch(productBatchNo)
    },
    // ---- 诊疗接诊管理 ----
    async createConsultation(input: ConsultationInput) {
      const result = await mockApi.createConsultation(input)
      await this.refresh()
      return result
    },
    async confirmConsultation(id: string) {
      const result = await mockApi.confirmConsultation(id)
      await this.refresh()
      return result
    },
    async saveTreatmentRecord(id: string, input: TreatmentRecordInput) {
      const result = await mockApi.saveTreatmentRecord(id, input)
      await this.refresh()
      return result
    },
    async createConsultationPrescription(input: ConsultationPrescriptionInput) {
      const result = await mockApi.createConsultationPrescription(input)
      await this.refresh()
      return result
    },
    async getPetHistoryConsultations(petId: string) {
      return await mockApi.getPetHistoryConsultations(petId)
    },
    async getDrugRequisitions() {
      return await mockApi.getDrugRequisitions()
    },
    async confirmDrugRequisition(requisitionId: string, items: DrugRequisitionItem[]) {
      const result = await mockApi.confirmDrugRequisition(requisitionId, items)
      await this.refresh()
      return result
    },
    async submitDrugRequisition(requisitionId: string) {
      const result = await mockApi.submitDrugRequisition(requisitionId)
      await this.refresh()
      return result
    },
    async processDrugOutbound(requisitionId: string, selections: DrugOutboundSelection[]) {
      const result = await mockApi.processDrugOutbound(requisitionId, selections)
      await this.refresh()
      return result
    },
  },
})
