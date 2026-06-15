export type UserRole = 'farmer' | 'vet' | 'slaughter' | 'regulator' | 'clinic_admin' | 'practicing_vet' | 'pet_owner'

export type OriginPurpose = 'slaughter' | 'breeding' | 'trade' | 'exhibition'
export type BusinessStatus =
  | 'draft'
  | 'submitted'
  | 'origin_reviewing'
  | 'origin_approved'
  | 'rejected'
  | 'voided'
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
export type DrugRecordType = 'in' | 'out' | 'reversal'
export type WasteStatus = 'draft' | 'pending' | 'handled' | 'voided'
export type AnnualReportStatus = 'generated' | 'submitted' | 'withdrawn'
export type WasteSourceBusinessType = 'immunization' | 'prescription'
export type InspectionAttachmentType = 'vehicle_photo' | 'ear_tag_photo' | 'loading_photo' | 'scene_photo' | 'other'

export type SlaughterEntryStatus = 'pending_check' | 'checking' | 'entry_passed' | 'entry_rejected'
export type SlaughterBatchStatus = 'pending_self_check' | 'self_check_passed' | 'self_check_failed' | 'pending_slaughter_apply' | 'slaughter_applied' | 'ante_mortem_checking' | 'ante_mortem_passed' | 'ante_mortem_failed' | 'post_mortem_checking' | 'post_mortem_passed' | 'post_mortem_failed' | 'pending_product_cert' | 'meat_quality_certificate_issued' | 'product_cert_issued' | 'abnormal'
export type SelfCheckStatus = 'pending' | 'passed' | 'failed'
export type SlaughterApplicationStatus = 'pending_accept' | 'accepted' | 'ante_mortem_checking' | 'post_mortem_checking' | 'pending_product_cert' | 'product_cert_issued' | 'returned' | 'abnormal'
export type MarkType = 'card_ring' | 'sticker'
export type MarkStatus = 'pending_review' | 'issued' | 'in_stock' | 'used' | 'returned' | 'voided'
export type MarkApplicationStatus = 'pending_review' | 'approved' | 'rejected' | 'issued'

export interface InspectionAttachment {
  id: string
  applicationNo: string
  type: InspectionAttachmentType
  typeName: string
  fileName: string
  fileSize: number
  fileType: string
  dataUrl?: string
  uploadedBy: string
  uploadedAt: string
}

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
  destinationAddress: string
  purpose: OriginPurpose
  departureTime: string
  contactPerson: string
  contactPhone: string
  remark?: string
  vehicleId: string
  carrier: string
  status: BusinessStatus
  validationResults: ValidationResult[]
  rejectReason?: string
  withdrawReason?: string
  voidReason?: string
  voidRequested?: boolean
  voidRequestReason?: string
  submittedAt?: string
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
  carrier?: string
  earTagRange?: string
  applicationNo?: string
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
  status: SlaughterApplicationStatus
  createdAt: string
  batchId?: string
  entryRecordId?: string
  quarantineCertificateId?: string
  animalType?: string
  purpose?: string
  plannedSlaughterTime?: string
  contactPerson?: string
  contactPhone?: string
  remark?: string
  africanSwineFeverTestPerson?: string
  africanSwineFeverTestTime?: string
  bannedDrugTestPerson?: string
  bannedDrugTestTime?: string
  submittedBy?: string
  submittedAt?: string
  updatedAt?: string
}

export interface WaitingSlaughterBatch {
  id: string
  entryCheckId: string
  certificateId: string
  quantity: number
  animalType: string
  status: BusinessStatus
  createdAt: string
  batchNo?: string
  entryRecordId?: string
  earTagRange?: string
  waitingPenNo?: string
  slaughterQuantity?: number
  qualifiedCarcassQuantity?: number
  unqualifiedQuantity?: number
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
  quarantineCertificateId?: string
  meatQualityCertificateId?: string
  productBatchNo?: string
  batchId?: string
  markRangeStart?: string
  markRangeEnd?: string
}

export interface MeatQualityCertificate {
  id: string
  certificateNo: string
  waitingBatchId: string
  productName: string
  weight: number
  inspector: string
  issuedAt: string
  batchId?: string
  quarantineCertificateId?: string
  productBatchNo?: string
  conclusion?: string
  qualifiedQuantity?: number
  unqualifiedQuantity?: number
  attachments?: string
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
  active: boolean
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
  active: boolean
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
  active: boolean
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
  active: boolean
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
  status: 'draft' | 'active' | 'voided'
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
  active: boolean
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
  status: 'active' | 'voided'
  voidReason?: string
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
  withdrawnAt?: string
  withdrawReason?: string
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

// Slaughter entry record (replaces simple EntryCheckRecord for detailed flow)
export interface SlaughterEntryRecord {
  id: string
  entryNo: string
  quarantineCertificateId: string
  transportTaskId: string
  applicationId: string
  slaughterhouseName: string
  animalType: string
  quantity: number
  earTagRange: string
  vehiclePlateNo: string
  carrier: string
  originFarm: string
  originLocation: string
  checkResults: ValidationResult[]
  status: SlaughterEntryStatus
  checkedBy: string
  checkedAt: string
  createdAt: string
}

// Slaughter batch (replaces simple WaitingSlaughterBatch)
export interface SlaughterBatch {
  id: string
  batchNo: string
  entryRecordId: string
  quarantineCertificateId: string
  animalType: string
  entryQuantity: number
  waitingQuantity: number
  slaughterQuantity: number
  qualifiedCarcassQuantity: number
  unqualifiedQuantity: number
  earTagRange: string
  waitingPenNo: string
  status: SlaughterBatchStatus
  createdAt: string
}

// Self inspection (ASF + banned drugs)
export interface SlaughterSelfInspection {
  id: string
  batchId: string
  africanSwineFeverResult: DetectionResult
  africanSwineFeverTestPerson: string
  africanSwineFeverTestTime: string
  bannedDrugResult: DetectionResult
  bannedDrugTestPerson: string
  bannedDrugTestTime: string
  status: SelfCheckStatus
  createdAt: string
}

// Quarantine mark
export interface QuarantineMark {
  id: string
  markNo: string
  markType: MarkType
  ownerOrg: string
  status: MarkStatus
  qrCode: string
  issuedAt: string
  usedAt?: string
  productCertificateId?: string
  quarantineCertificateId?: string
  meatQualityCertificateId?: string
  slaughterBatchId?: string
  productBatchNo?: string
}

// Mark inventory
export interface QuarantineMarkInventory {
  id: string
  orgId: string
  markType: MarkType
  total: number
  available: number
  used: number
  returned: number
  voided: number
}

// Mark application
export interface QuarantineMarkApplication {
  id: string
  applicationNo: string
  orgId: string
  orgName: string
  markType: MarkType
  quantity: number
  reason: string
  status: MarkApplicationStatus
  appliedBy: string
  approvedBy?: string
  issuedRangeStart?: string
  issuedRangeEnd?: string
  createdAt: string
}

// Traceability record
export interface TraceabilityRecord {
  id: string
  markNo: string
  quarantineCertificateId: string
  productCertificateId: string
  meatQualityCertificateId: string
  slaughterBatchId: string
  productBatchNo: string
  queriedAt: string
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
  inspectionAttachments: InspectionAttachment[]
  slaughterEntryRecords: SlaughterEntryRecord[]
  slaughterBatches: SlaughterBatch[]
  slaughterSelfInspections: SlaughterSelfInspection[]
  quarantineMarks: QuarantineMark[]
  quarantineMarkInventories: QuarantineMarkInventory[]
  quarantineMarkApplications: QuarantineMarkApplication[]
  traceabilityRecords: TraceabilityRecord[]
}

export interface OriginApplicationInput {
  batchId: string
  quantity: number
  destination: string
  destinationAddress: string
  purpose: OriginPurpose
  departureTime: string
  contactPerson: string
  contactPhone: string
  remark?: string
  vehicleId: string
}
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

export interface SlaughterSelfInspectionInput {
  batchId: string
  africanSwineFeverResult: DetectionResult
  africanSwineFeverTestPerson: string
  africanSwineFeverTestTime: string
  bannedDrugResult: DetectionResult
  bannedDrugTestPerson: string
  bannedDrugTestTime: string
}
export interface SlaughterQuarantineApplicationInput {
  batchId: string
  entryRecordId: string
  quarantineCertificateId: string
  quantity: number
  purpose: string
  plannedSlaughterTime: string
  contactPerson: string
  contactPhone: string
  remark: string
}
export interface MeatQualityCertificateInputExtended {
  batchId: string
  quarantineCertificateId: string
  productBatchNo: string
  productName: string
  weight: number
  inspector: string
  conclusion: string
  qualifiedQuantity: number
  unqualifiedQuantity: number
}
export interface QuarantineMarkApplicationInput {
  markType: MarkType
  quantity: number
  reason: string
  appliedBy: string
}
export interface UseQuarantineMarksInput {
  batchId: string
  productCertificateId: string
  quarantineCertificateId: string
  meatQualityCertificateId: string
  markType: MarkType
  quantity: number
  useObject: string
}

