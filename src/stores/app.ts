import { defineStore } from 'pinia'
import { mockApi } from '../api/mockApi'
import type {
  AnteMortemInput,
  AppData,
  CompleteHarmlessInput,
  EntryCheckInput,
  HarmlessTaskInput,
  LandingReportInput,
  MeatQualityCertificateInput,
  OriginApplicationInput,
  OriginInspectionInput,
  PostMortemInput,
  ProductCertificateInput,
  SlaughterApplicationInput,
  SlaughterAuditInput,
  TransportExceptionInput,
  UserRole,
  UserSession,
} from '../domain/models'
import { createSeedData } from '../domain/seed'

export const useAppStore = defineStore('app', {
  state: () => ({
    session: undefined as UserSession | undefined,
    data: createSeedData() as AppData,
    loading: false,
  }),
  getters: {
    currentRole: (state) => state.session?.role,
    latestOriginApplication: (state) => state.data.originApplications[0],
    latestCertificate: (state) => state.data.quarantineCertificates[0],
    latestEntryCheck: (state) => state.data.entryChecks[0],
    pendingOriginApplications: (state) => state.data.originApplications.filter((item) => item.status === 'submitted'),
    pendingSlaughterApplications: (state) => state.data.slaughterApplications.filter((item) => item.status === 'slaughter_submitted'),
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
    async resetDemoData() {
      this.data = await mockApi.resetDemoData()
    },
    async submitOriginApplication(input: OriginApplicationInput) {
      const result = await mockApi.submitOriginApplication(input)
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
    async retrySyncLog(id: string) {
      const result = await mockApi.retrySyncLog(id)
      await this.refresh()
      return result
    },
  },
})
