export type UserRole = 'farmer' | 'vet' | 'slaughter' | 'regulator' | 'clinic_admin' | 'practicing_vet' | 'pet_owner'

export type BusinessStatus =
  | 'draft'
  | 'submitted'
  | 'origin_reviewing'
  | 'origin_approved'
  | 'certificate_issued'
  | 'transporting'
  | 'landing_pending'
  | 'landing_submitted'
  | 'landing_overdue'
  | 'landing_exception'
  | 'carrier_restricted'
  | 'carrier_released'
  | 'arrived'
  | 'entry_checking'
  | 'entry_passed'
  | 'entry_rejected'
  | 'waiting_slaughter'
  | 'ante_mortem_checked'
  | 'post_mortem_checked'
  | 'slaughter_submitted'
  | 'slaughter_reviewing'
  | 'slaughter_approved'
  | 'product_certificate_issued'
  | 'meat_quality_certificate_issued'
  | 'three_cert_linked'
  | 'harmless_pending'
  | 'harmless_processing'
  | 'harmless_completed'

export type LandingReportStatus = 'pending' | 'submitted' | 'overdue' | 'exception'
export type TransportExceptionType = 'route_deviation' | 'missing_landing_report' | 'wrong_destination'
export type RestrictionStatus = 'restricted' | 'released'
export type SimpleStatus = 'pending' | 'completed'
export type SyncStatus = 'success' | 'failed' | 'pending'
export type HarmlessSource = 'farm_death' | 'slaughter_unqualified' | 'entry_exception'
export type SealAction = 'receive' | 'issue' | 'use' | 'recycle' | 'destroy'
export type FilingStatus = 'pending' | 'approved' | 'rejected'
export type PracticeType = 'licensed_veterinarian' | 'assistant_veterinarian'
export type DrugRecordType = 'in' | 'out'
export type WasteStatus = 'pending' | 'handled'
export type AnnualReportStatus = 'generated' | 'submitted'
export type WasteSourceBusinessType = 'immunization' | 'prescription'

export interface UserSession {
  role: UserRole
  name: string
  homePath: string
}

export interface ValidationResult {
  label: string
  passed: boolean
  message: string
}

export interface FarmBatch {
  id: string
  farmName: string
  animalType: string
  breed: string
  stock: number
  immuneQualified: boolean
  earTagPrefix: string
  earTagStart: number
  earTagEnd: number
  location: string
}

export interface Vehicle {
  id: string
  plateNo: string
  carrier: string
  registered: boolean
  blacklisted: boolean
  channel: string
}

export interface OriginQuarantineApplication {
  id: string
  applicationNo: string
  batchId: string
  animalType: string
  quantity: number
  destination: string
  vehicleId: string
  carrier: string
  status: BusinessStatus
  validationResults: ValidationResult[]
  createdAt: string
  updatedAt: string
}

export interface QuarantineCertificate {
  id: string
  certificateNo: string
  applicationId: string
  validFrom: string
  validTo: string
  issuedBy: string
  animalType: string
  quantity: number
  origin: string
  destination: string
  vehiclePlateNo: string
}

export interface RoutePoint {
  name: string
  time: string
  status: 'done' | 'active' | 'risk' | 'pending'
  description: string
}

export interface TransportTask {
  id: string
  certificateId: string
  plateNo: string
  status: BusinessStatus
  route: RoutePoint[]
  hasDeviation: boolean
  startedAt: string
  arrivedAt?: string
}

export interface LandingReport {
  id: string
  reportNo: string
  transportTaskId: string
  certificateId: string
  plateNo: string
  destination: string
  actualDestination: string
  status: LandingReportStatus
  onDestination: boolean
  overdue: boolean
  exceptionType?: TransportExceptionType
  reporter: string
  plannedArrivedAt: string
  arrivedAt?: string
  createdAt: string
}

export interface CarrierRestriction {
  id: string
  vehicleId: string
  plateNo: string
  carrier: string
  reason: string
  certificateId: string
  transportTaskId: string
  status: RestrictionStatus
  disposalRecords: string[]
  restrictedAt: string
  releasedAt?: string
}

export interface EntryCheckRecord {
  id: string
  certificateId: string
  plateNo: string
  status: BusinessStatus
  checks: ValidationResult[]
  checkedAt: string
}

export type DetectionResult = 'negative' | 'positive'

export interface SlaughterQuarantineApplication {
  id: string
  entryCheckId: string
  applicationNo: string
  quantity: number
  africanSwineFeverResult: DetectionResult
  bannedDrugResult: DetectionResult
  status: BusinessStatus
  createdAt: string
}

export interface WaitingSlaughterBatch {
  id: string
  entryCheckId: string
  certificateId: string
  quantity: number
  animalType: string
  status: BusinessStatus
  createdAt: string
}

export interface SlaughterAnteMortemCheck {
  id: string
  waitingBatchId: string
  checkedBy: string
  passed: boolean
  status: SimpleStatus
  remark: string
  checkedAt: string
}

export interface SlaughterPostMortemCheck {
  id: string
  waitingBatchId: string
  checkedBy: string
  qualifiedQuantity: number
  unqualifiedQuantity: number
  productWeight: number
  status: SimpleStatus
  remark: string
  checkedAt: string
}

export interface ProductCertificate {
  id: string
  certificateNo: string
  slaughterApplicationId?: string
  waitingBatchId?: string
  productName: string
  weight: number
  issuedBy: string
  issuedAt: string
}

export interface MeatQualityCertificate {
  id: string
  certificateNo: string
  waitingBatchId: string
  productName: string
  weight: number
  inspector: string
  issuedAt: string
}

export interface ThreeCertificateLink {
  id: string
  waitingBatchId: string
  animalCertificateId: string
  productCertificateId: string
  meatQualityCertificateId: string
  linkedAt: string
}

export interface HarmlessTreatmentTask {
  id: string
  taskNo: string
  source: HarmlessSource
  sourceId: string
  quantity: number
  weight: number
  reason: string
  status: 'pending' | 'processing' | 'completed'
  method?: string
  processedQuantity?: number
  processedWeight?: number
  photoCount?: number
  operator?: string
  completedAt?: string
  createdAt: string
}

export interface SealManagementRecord {
  id: string
  sealNo: string
  action: SealAction
  quantity: number
  businessNo?: string
  operator: string
  createdAt: string
}

export interface ClinicInstitution {
  id: string
  name: string
  licenseNo: string
  address: string
  contactPerson: string
  phone: string
  type: string
  mapPoint: string
  status: FilingStatus
  reviewRemark?: string
  createdAt: string
  reviewedAt?: string
}

export interface Veterinarian {
  id: string
  name: string
  certificateNo: string
  practiceType: PracticeType
  institutionId: string
  practiceScope: string
  phone: string
  material: string
  status: FilingStatus
  reviewRemark?: string
  createdAt: string
  reviewedAt?: string
}

export interface PetOwner {
  id: string
  name: string
  phone: string
  address: string
  createdAt: string
}

export interface PetProfile {
  id: string
  ownerId: string
  name: string
  species: string
  breed: string
  gender: string
  age: number
  identityNo: string
  createdAt: string
}

export interface ImmunizationLedger {
  id: string
  petId: string
  vaccineName: string
  vaccineBatchNo: string
  immunizedAt: string
  nextImmunizedAt: string
  veterinarianId: string
  institutionId: string
  createdAt: string
}

export interface DrugInventory {
  id: string
  institutionId: string
  drugName: string
  batchNo: string
  manufacturer: string
  approvalNo: string
  validTo: string
  quantity: number
  supplier: string
  traceCode: string
  createdAt: string
}

export interface Prescription {
  id: string
  prescriptionNo: string
  petId: string
  diagnosis: string
  drugId: string
  drugName: string
  dosage: string
  quantity: number
  veterinarianId: string
  institutionId: string
  issuedAt: string
}

export interface DrugInOutRecord {
  id: string
  type: DrugRecordType
  drugId: string
  drugName: string
  institutionId: string
  quantity: number
  relatedId?: string
  operator: string
  createdAt: string
}

export interface MedicalWasteRecord {
  id: string
  wasteNo: string
  type: string
  sourceBusinessType: WasteSourceBusinessType
  sourceBusinessId: string
  weight: number
  generatedAt: string
  storageLocation: string
  disposalCompany: string
  handoverPerson: string
  status: WasteStatus
  handledAt?: string
  voucherNo?: string
  createdAt: string
}

export interface AnnualReport {
  id: string
  institutionId: string
  year: number
  status: AnnualReportStatus
  veterinarianCount: number
  petCount: number
  immunizationCount: number
  prescriptionCount: number
  drugStockInQuantity: number
  drugStockOutQuantity: number
  wasteHandledCount: number
  generatedAt: string
  submittedAt?: string
}

export interface SyncLog {
  id: string
  target: string
  status: SyncStatus
  businessNo: string
  businessType: string
  syncedAt: string
  failureReason?: string
  retryCount: number
}

export interface ClosedLoopNode {
  id: string
  nodeName: string
  dataSource: string
  passed: boolean
  operator: string
  operatedAt: string
  syncStatus: SyncStatus
  relatedId: string
  summary: string
}

export interface OperationLog {
  id: string
  actor: string
  role: UserRole
  action: string
  target: string
  createdAt: string
}

export interface AlertRecord {
  id: string
  level: 'info' | 'warning' | 'danger'
  type: string
  message: string
  relatedId: string
  resolved: boolean
  createdAt: string
}

export interface AppData {
  farmBatches: FarmBatch[]
  vehicles: Vehicle[]
  originApplications: OriginQuarantineApplication[]
  quarantineCertificates: QuarantineCertificate[]
  transportTasks: TransportTask[]
  landingReports: LandingReport[]
  carrierRestrictions: CarrierRestriction[]
  entryChecks: EntryCheckRecord[]
  slaughterApplications: SlaughterQuarantineApplication[]
  waitingSlaughterBatches: WaitingSlaughterBatch[]
  anteMortemChecks: SlaughterAnteMortemCheck[]
  postMortemChecks: SlaughterPostMortemCheck[]
  productCertificates: ProductCertificate[]
  meatQualityCertificates: MeatQualityCertificate[]
  threeCertificateLinks: ThreeCertificateLink[]
  harmlessTasks: HarmlessTreatmentTask[]
  sealRecords: SealManagementRecord[]
  clinicInstitutions: ClinicInstitution[]
  veterinarians: Veterinarian[]
  petOwners: PetOwner[]
  petProfiles: PetProfile[]
  immunizationLedgers: ImmunizationLedger[]
  drugInventories: DrugInventory[]
  prescriptions: Prescription[]
  drugInOutRecords: DrugInOutRecord[]
  medicalWasteRecords: MedicalWasteRecord[]
  annualReports: AnnualReport[]
  syncLogs: SyncLog[]
  closedLoopNodes: ClosedLoopNode[]
  operationLogs: OperationLog[]
  alerts: AlertRecord[]
}

export interface OriginApplicationInput { batchId: string; quantity: number; destination: string; vehicleId: string }
export interface OriginInspectionInput { faceRecognitionPassed: boolean; siteInspectionPassed: boolean; evidencePhotoCount: number; remark: string }
export interface EntryCheckInput { query: string; actualQuantity: number; channel: string; recognizedPlateNo?: string; earTagMatched?: boolean; originRegionMatched?: boolean }
export interface SlaughterApplicationInput { entryCheckId: string; quantity: number; africanSwineFeverResult: DetectionResult; bannedDrugResult: DetectionResult }
export interface SlaughterAuditInput { anteMortemPassed: boolean; postMortemPassed: boolean; productName: string; weight: number; remark: string }
export interface LandingReportInput { transportTaskId: string; actualDestination: string; reporter: string; arrivedAt: string }
export interface TransportExceptionInput { transportTaskId: string; type: TransportExceptionType; message: string }
export interface AnteMortemInput { waitingBatchId: string; checkedBy: string; passed: boolean; remark: string }
export interface PostMortemInput { waitingBatchId: string; checkedBy: string; qualifiedQuantity: number; unqualifiedQuantity: number; productWeight: number; remark: string }
export interface ProductCertificateInput { waitingBatchId: string; productName: string; weight: number; issuedBy: string }
export interface MeatQualityCertificateInput { waitingBatchId: string; productName: string; weight: number; inspector: string }
export interface HarmlessTaskInput { source: HarmlessSource; sourceId: string; quantity: number; weight: number; reason: string }
export interface CompleteHarmlessInput { taskId: string; method: string; processedQuantity: number; processedWeight: number; photoCount: number; operator: string }
export interface ClinicInstitutionInput { name: string; licenseNo: string; address: string; contactPerson: string; phone: string; type: string; mapPoint: string }
export interface VeterinarianInput { name: string; certificateNo: string; practiceType: PracticeType; institutionId: string; practiceScope: string; phone: string; material: string }
export interface PetOwnerInput { name: string; phone: string; address: string }
export interface PetProfileInput { ownerId: string; name: string; species: string; breed: string; gender: string; age: number; identityNo: string }
export interface ImmunizationInput { petId: string; vaccineName: string; vaccineBatchNo: string; immunizedAt: string; nextImmunizedAt: string; veterinarianId: string; institutionId: string }
export interface DrugStockInInput { institutionId: string; drugName: string; batchNo: string; manufacturer: string; approvalNo: string; validTo: string; quantity: number; supplier: string; traceCode: string }
export interface PrescriptionInput { petId: string; diagnosis: string; drugId: string; dosage: string; quantity: number; veterinarianId: string }
export interface MedicalWasteInput { type: string; sourceBusinessType: WasteSourceBusinessType; sourceBusinessId: string; weight: number; generatedAt: string; storageLocation: string; disposalCompany: string; handoverPerson: string }
export interface CompleteMedicalWasteInput { wasteId: string; handledAt: string; voucherNo: string }
