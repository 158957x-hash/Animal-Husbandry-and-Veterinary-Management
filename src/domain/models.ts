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
export type VeterinarianApplicationType = 'new' | 'change' | 'cancel'
export type VeterinarianApplicationStatus = 'pending' | 'approved' | 'rejected'
export type DrugRecordType = 'in' | 'out' | 'reversal'
export type WasteStatus = 'draft' | 'pending' | 'handled' | 'voided'
export type AnnualReportStatus = 'draft' | 'generated' | 'submitted' | 'pending' | 'approved' | 'rejected' | 'archived' | 'withdrawn'
export type VetAnnualReportStatus = 'generated' | 'submitted_to_clinic' | 'clinic_approved' | 'clinic_rejected' | 'submitted_to_regulator' | 'approved' | 'rejected' | 'archived' | 'withdrawn'
export type WasteSourceBusinessType = 'immunization' | 'prescription'
export type ConsultationStatus = 'pending' | 'filling_record' | 'pending_prescription' | 'completed'
export type DispensingStatus = 'no_dispensing' | 'pending_dispensing' | 'dispensed'
export type InspectionAttachmentType = 'vehicle_photo' | 'certificate_photo' | 'ear_tag_photo' | 'loading_photo' | 'scene_photo' | 'other'
export type CertificateEntryUsageStatus = 'not_arrived' | 'arrived' | 'used'

export type SlaughterEntryStatus = 'pending_check' | 'checking' | 'entry_passed' | 'entry_rejected'
export type SlaughterBatchStatus =
  | 'pending_slaughter_apply'
  | 'draft_application'
  | 'submitted_pending_accept'
  | 'returned_for_correction'
  | 'accepted_pending_ante_mortem'
  | 'ante_mortem_passed'
  | 'ante_mortem_failed'
  | 'emergency_slaughtering'
  | 'death_registration'
  | 'abnormal'
  | 'slaughter_applied'
  | 'ante_mortem_checking'
  | 'post_mortem_checking'
  | 'post_mortem_passed'
  | 'post_mortem_failed'
  | 'pending_product_cert'
  | 'meat_quality_certificate_issued'
  | 'product_cert_issued'
export type SelfCheckStatus = 'pending' | 'passed' | 'failed'
export type SlaughterApplicationStatus =
  | 'draft'
  | 'submitted_pending_accept'
  | 'returned'
  | 'accepted_pending_pre_check'
  | 'pre_check_passed'
  | 'pre_check_failed'
  | 'auto_slaughter_completed'
  | 'post_product_generated'
  | 'post_check_passed'
  | 'post_check_failed'
  | 'quality_cert_generated'
  | 'product_cert_pending'
  | 'product_cert_issued'
  | 'mark_used'
  | 'completed'
  | 'abnormal'
export type MarkType = 'card_ring' | 'sticker'
export type MarkStatus = 'pending_review' | 'issued' | 'in_stock' | 'used' | 'returned' | 'voided'
export type MarkApplicationType = 'apply' | 'return'
export type MarkApplicationStatus = 'pending_review' | 'approved' | 'rejected' | 'issued' | 'return_pending_review' | 'return_approved' | 'return_rejected' | 'returned'
export type MarkIssueStatus = 'pending_issue' | 'issued'
export type MarkReturnStatus = 'pending_return' | 'returned'
export type SlaughterRecordStatus = 'not_generated' | 'auto_generated' | 'completed' | 'abnormal'
export type PostProductBatchStatus = 'not_generated' | 'generated' | 'waiting_quality_check' | 'waiting_post_check' | 'ready_for_product_cert' | 'product_cert_issued' | 'completed' | 'abnormal'
export type MeatQualityCheckStatus = 'not_started' | 'draft' | 'submitted' | 'passed' | 'failed' | 'cert_generated'
export type PostMortemCheckStatus2 = 'not_started' | 'pending' | 'in_progress' | 'passed' | 'failed' | 'partial_failed' | 'harmless_required'
export type ProductCertStatus = 'not_ready' | 'pending' | 'ready_for_product_cert' | 'issued' | 'rejected' | 'voided'
export type QuarantineMarkUsageStatus = 'not_used' | 'allocated' | 'used' | 'returned' | 'voided'

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
  entryUsageStatus?: CertificateEntryUsageStatus
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
  linkNo: string
  animalCertificateId: string
  productCertificateId: string
  meatQualityCertificateId: string
  slaughterApplicationId?: string
  waitingBatchId?: string
  slaughterBatchId?: string
  productBatchId?: string
  markRangeStart?: string
  markRangeEnd?: string
  qrCode?: string
  linkedAt: string
}

// 屠宰记录
export interface SlaughterRecord {
  id: string
  recordNo: string
  slaughterBatchNo: string
  waitingBatchId: string
  slaughterApplicationId: string
  quarantineCertificateId: string
  slaughterhouseName: string
  animalType: string
  preCheckConclusion: string
  actualSlaughterQuantity: number
  slaughterCompletedTime: string
  generationMethod: string
  status: SlaughterRecordStatus
  createdAt: string
}

// 宰后产品批次
export interface PostProductBatch {
  id: string
  productBatchNo: string
  slaughterBatchNo: string
  slaughterRecordId: string
  slaughterApplicationId: string
  animalType: string
  productName: string
  productType: string
  productQuantity: number
  productWeight: number
  sourceAnimalQuantity: number
  sourceAnimalCertificateNo: string
  slaughterhouseName: string
  productCertStatus: ProductCertStatus
  meatQualityStatus: MeatQualityCheckStatus
  postCheckStatus: PostMortemCheckStatus2
  waitingBatchId?: string
  quarantineCertificateId?: string
  createdAt: string
}

// 宰前检查详情
export interface AnteMortemCheckDetail {
  id: string
  checkNo: string
  slaughterApplicationId: string
  waitingBatchId: string
  slaughterhouseName: string
  animalType: string
  applicationQuantity: number
  waitingPenNo: string
  plannedSlaughterTime: string
  officialVet: string
  checkTime: string
  items: AnteMortemCheckItem[]
  conclusion: 'passed' | 'failed' | 'partial_exception' | 'harmless' | ''
  conclusionReason?: string
  status: 'pending' | 'completed'
  createdAt: string
}

export interface AnteMortemCheckItem {
  label: string
  result: 'normal' | 'abnormal'
  remark: string
  attachment: string
}

// 宰后检疫详情
export interface PostMortemCheckDetail {
  id: string
  checkNo: string
  productBatchId: string
  slaughterBatchNo: string
  slaughterApplicationId: string
  slaughterhouseName: string
  animalType: string
  actualSlaughterQuantity: number
  productName: string
  productWeight: number
  slaughterCompletedTime: string
  officialVet: string
  checkTime: string
  items: PostMortemCheckItem[]
  conclusion: 'passed' | 'failed' | 'partial_failed' | 'harmless' | ''
  conclusionReason?: string
  unqualifiedQuantity: number
  harmlessQuantity: number
  status: PostMortemCheckStatus2
  createdAt: string
}

export interface PostMortemCheckItem {
  label: string
  result: 'normal' | 'abnormal'
  remark: string
  attachment: string
}

// 肉品品质检验详情
export interface MeatQualityCheckDetail {
  id: string
  checkNo: string
  productBatchId: string
  slaughterBatchNo: string
  slaughterhouseName: string
  animalType: string
  productName: string
  productType: string
  productQuantity: number
  productWeight: number
  slaughterCompletedTime: string
  inspector: string
  checkTime: string
  items: MeatQualityCheckItem[]
  conclusion: 'qualified' | 'unqualified' | ''
  unqualifiedQuantity: number
  unqualifiedReason: string
  disposalMethod: string
  remark: string
  status: MeatQualityCheckStatus
  createdAt: string
}

export interface MeatQualityCheckItem {
  label: string
  result: 'normal' | 'abnormal'
  remark: string
}

// 产品出证记录
export interface ProductCertIssueRecord {
  id: string
  productBatchId: string
  slaughterApplicationId: string
  productName: string
  productQuantity: number
  productWeight: number
  slaughterhouseName: string
  destination: string
  vehiclePlateNo: string
  issuedBy: string
  issuedAt: string
  status: ProductCertStatus
  animalCertificateNo?: string
  meatQualityCertificateNo?: string
  productCertificateNo?: string
  createdAt: string
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

export interface VetRegistrationMaterial {
  type: 'certificate' | 'id_card' | 'labor_proof'
  name: string
  url: string
}

export interface VeterinarianRegistrationApplication {
  id: string
  applicationNo: string
  type: VeterinarianApplicationType
  institutionId: string
  institutionName: string
  veterinarianId?: string
  name: string
  gender: string
  birthDate: string
  idCardNo: string
  educationMajor: string
  graduationSchool: string
  title: string
  workStartDate: string
  phone: string
  practiceType: PracticeType
  practiceScope: string
  certificateNo: string
  certificateIssuingAuthority: string
  certificateIssueDate: string
  avatarUrl: string
  materials: VetRegistrationMaterial[]
  status: VeterinarianApplicationStatus
  reviewRemark?: string
  reviewedAt?: string
  createdAt: string
  syncStatus?: 'synced' | 'not_synced'
  changeReason?: string
  cancelReason?: string
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
  weight: number
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
  specification: string
  batchNo: string
  unit: string
  manufacturer: string
  approvalNo: string
  validTo: string
  quantity: number
  storageLocation: string
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
  handlingMethod?: string
  voucherNo?: string
  barcodeUrl?: string
  createdAt: string
}

export interface TreatmentRecordData {
  temperature: number
  weight: number
  mentalState: string
  appetite: string
  clinicalSymptoms: string
  checkItems: string
  checkResult: string
  preliminaryDiagnosis: string
  finalDiagnosis: string
  treatmentOpinion: string
  needFollowUp: boolean
  followUpTime: string
  medicalAdvice: string
  filledAt: string
}

export interface PrescriptionItem {
  drugId: string
  drugName: string
  specification: string
  batchNo: string
  unit: string
  currentStock: number
  singleDose: string
  frequency: string
  days: number
  quantity: number
  administration: string
  notes: string
}

export interface ConsultationPrescription {
  id: string
  prescriptionNo: string
  consultationId: string
  consultationNo: string
  petOwnerName: string
  petName: string
  species: string
  weight: number
  diagnosis: string
  veterinarianId: string
  veterinarianName: string
  institutionId: string
  items: PrescriptionItem[]
  needDispensing: boolean
  createdAt: string
}

export interface ConsultationRecord {
  id: string
  consultationNo: string
  petOwnerId: string
  petOwnerName: string
  petOwnerPhone: string
  petId: string
  petName: string
  species: string
  breed: string
  gender: string
  age: number
  weight: number
  chiefComplaint: string
  initialSymptoms: string
  consultationTime: string
  veterinarianId: string
  veterinarianName: string
  institutionId: string
  status: ConsultationStatus
  dispensingStatus: DispensingStatus
  treatmentRecord?: TreatmentRecordData
  prescriptionId?: string
  createdAt: string
  updatedAt: string
}

export interface AnnualReportSection {
  title: string
  html: string
}

export interface AnnualReport {
  id: string
  institutionId: string
  institutionName: string
  year: number
  status: AnnualReportStatus
  sections: AnnualReportSection[]
  currentPage: number
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
  regulatorRemark?: string
  regulatorReviewedAt?: string
  archiveStatus?: 'archived' | 'not_archived'
}

export interface VeterinarianAnnualReport {
  id: string
  veterinarianId: string
  veterinarianName: string
  institutionId: string
  institutionName: string
  year: number
  status: VetAnnualReportStatus
  sections: AnnualReportSection[]
  currentPage: number
  generatedAt: string
  submittedToClinicAt?: string
  clinicReviewedAt?: string
  clinicReviewRemark?: string
  submittedToRegulatorAt?: string
  regulatorReviewedAt?: string
  regulatorRemark?: string
  archiveStatus?: 'archived' | 'not_archived'
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
  actualQuantity?: number
  waitingPenNo?: string
  actualVehiclePlateNo?: string
  vehicleArrived?: boolean
  quantityMatched?: boolean
  earTagMatched?: boolean
  clinicalNormal?: boolean
  deathCount?: number
  abnormalCount?: number
  loadingNormal?: boolean
  sceneRemark?: string
  operator?: string
  phone?: string
  entryTime?: string
  opinion?: string
  abnormalReason?: string
  returnReason?: string
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
  entryTime?: string
  slaughterApplicationId?: string
  anteMortemCheckId?: string
  emergencySlaughterId?: string
  deathRecordId?: string
  abnormalReason?: string
  returnReason?: string
  operator?: string
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
  applicationType?: MarkApplicationType
  markType: MarkType
  quantity: number
  reason: string
  status: MarkApplicationStatus
  appliedBy: string
  approvedBy?: string
  approvedAt?: string
  rejectReason?: string
  issuedRangeStart?: string
  issuedRangeEnd?: string
  relatedIssueOrderId?: string
  relatedReturnOrderId?: string
  createdAt: string
}

export interface QuarantineMarkIssueOrder {
  id: string
  issueNo: string
  applicationId: string
  orgId: string
  orgName: string
  markType: MarkType
  quantity: number
  rangeStart: string
  rangeEnd: string
  status: MarkIssueStatus
  createdAt: string
  issuedBy?: string
  issuedAt?: string
}

export interface QuarantineMarkReturnOrder {
  id: string
  returnNo: string
  applicationId: string
  orgId: string
  orgName: string
  markType: MarkType
  quantity: number
  reason: string
  status: MarkReturnStatus
  createdAt: string
  returnedBy?: string
  returnedAt?: string
  markNos?: string[]
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
  anteMortemCheckDetails: AnteMortemCheckDetail[]
  postMortemChecks: SlaughterPostMortemCheck[]
  postMortemCheckDetails: PostMortemCheckDetail[]
  productCertificates: ProductCertificate[]
  meatQualityCertificates: MeatQualityCertificate[]
  meatQualityCheckDetails: MeatQualityCheckDetail[]
  threeCertificateLinks: ThreeCertificateLink[]
  slaughterRecords: SlaughterRecord[]
  postProductBatches: PostProductBatch[]
  productCertIssueRecords: ProductCertIssueRecord[]
  harmlessTasks: HarmlessTreatmentTask[]
  sealRecords: SealManagementRecord[]
  clinicInstitutions: ClinicInstitution[]
  veterinarians: Veterinarian[]
  veterinarianRegistrationApplications: VeterinarianRegistrationApplication[]
  petOwners: PetOwner[]
  petProfiles: PetProfile[]
  immunizationLedgers: ImmunizationLedger[]
  drugInventories: DrugInventory[]
  prescriptions: Prescription[]
  drugInOutRecords: DrugInOutRecord[]
  medicalWasteRecords: MedicalWasteRecord[]
  annualReports: AnnualReport[]
  veterinarianAnnualReports: VeterinarianAnnualReport[]
  consultations: ConsultationRecord[]
  consultationPrescriptions: ConsultationPrescription[]
  drugRequisitions: DrugRequisition[]
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
  quarantineMarkIssueOrders: QuarantineMarkIssueOrder[]
  quarantineMarkReturnOrders: QuarantineMarkReturnOrder[]
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
export interface SlaughterEntryAttachmentInput { type: InspectionAttachmentType; typeName: string; fileName: string; fileSize: number; fileType: string; dataUrl?: string; uploadedBy: string }
export interface SlaughterEntryConfirmInput {
  actualQuantity: number
  waitingPenNo: string
  actualVehiclePlateNo: string
  vehicleArrived: boolean
  quantityMatched: boolean
  earTagMatched: boolean
  clinicalNormal: boolean
  deathCount: number
  abnormalCount: number
  loadingNormal: boolean
  sceneRemark: string
  operator: string
  phone: string
  entryTime: string
  opinion: string
  attachments?: SlaughterEntryAttachmentInput[]
}
export interface SlaughterEntryExceptionInput {
  actualQuantity?: number
  waitingPenNo?: string
  actualVehiclePlateNo?: string
  vehicleArrived: boolean
  quantityMatched: boolean
  earTagMatched: boolean
  clinicalNormal: boolean
  deathCount: number
  abnormalCount: number
  loadingNormal: boolean
  sceneRemark: string
  abnormalReason: string
  operator: string
  phone: string
  entryTime: string
  opinion: string
  attachments?: SlaughterEntryAttachmentInput[]
}
export interface SlaughterEntryReturnInput { reason: string; operator: string; phone: string; entryTime: string; opinion: string }
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
export interface PetProfileInput { ownerId: string; name: string; species: string; breed: string; gender: string; age: number; weight: number; identityNo: string }
export interface ImmunizationInput { petId: string; vaccineName: string; vaccineBatchNo: string; immunizedAt: string; nextImmunizedAt: string; veterinarianId: string; institutionId: string }
export interface DrugStockInInput { institutionId: string; drugName: string; specification: string; batchNo: string; unit: string; manufacturer: string; approvalNo: string; validTo: string; quantity: number; storageLocation: string; supplier: string; traceCode: string }
export interface PrescriptionInput { petId: string; diagnosis: string; drugId: string; dosage: string; quantity: number; veterinarianId: string }
export interface MedicalWasteInput { type: string; sourceBusinessType: WasteSourceBusinessType; sourceBusinessId: string; weight: number; generatedAt: string; storageLocation: string; disposalCompany: string; handoverPerson: string }
export interface CompleteMedicalWasteInput { wasteId: string; handledAt: string; handlingMethod: string; voucherNo: string }

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
export interface QuarantineMarkReturnApplicationInput {
  markType: MarkType
  quantity: number
  reason: string
  appliedBy: string
  markNos?: string[]
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
export interface AnteMortemSubmitInput {
  slaughterApplicationId: string
  items: { label: string; result: 'normal' | 'abnormal'; remark: string; attachment: string }[]
  conclusion: 'passed' | 'failed' | 'partial_exception' | 'harmless'
  conclusionReason: string
}
export interface MeatQualitySubmitInput {
  productBatchId: string
  productName: string
  productType: string
  inspector: string
  items: { label: string; result: 'normal' | 'abnormal'; remark: string }[]
  conclusion: 'qualified' | 'unqualified'
  unqualifiedQuantity: number
  unqualifiedReason: string
  disposalMethod: string
  remark: string
}
export interface PostMortemSubmitInput {
  productBatchId: string
  items: { label: string; result: 'normal' | 'abnormal'; remark: string; attachment: string }[]
  conclusion: 'passed' | 'failed' | 'partial_failed' | 'harmless'
  conclusionReason: string
  unqualifiedQuantity: number
  harmlessQuantity: number
}
export interface ProductCertIssueInput {
  productBatchId: string
  productName: string
  productQuantity: number
  productWeight: number
  slaughterhouseName: string
  destination: string
  vehiclePlateNo: string
}
export interface MarkUsageSubmitInput {
  productBatchId: string
  productCertificateId: string
  quarantineCertificateId: string
  meatQualityCertificateId: string
  slaughterApplicationId: string
  markType: MarkType
  quantity: number
  useObject: string
  operator: string
}

export interface ConsultationInput {
  petId: string
  chiefComplaint: string
  initialSymptoms: string
  weight: number
}

export interface TreatmentRecordInput {
  temperature: number
  weight: number
  mentalState: string
  appetite: string
  clinicalSymptoms: string
  checkItems: string
  checkResult: string
  preliminaryDiagnosis: string
  finalDiagnosis: string
  treatmentOpinion: string
  needFollowUp: boolean
  followUpTime: string
  medicalAdvice: string
}

export interface ConsultationPrescriptionInput {
  consultationId: string
  diagnosis: string
  items: PrescriptionItem[]
  needDispensing: boolean
}

export interface DrugRequisitionItem {
  drugId: string
  drugName: string
  specification: string
  batchNo: string
  unit: string
  currentStock: number
  singleDose: string
  frequency: string
  days: number
  quantity: number
  administration: string
  notes: string
}

export interface DrugOutboundSelection {
  requisitionItemKey: string
  drugInventoryId: string
  quantity: number
}

export interface DrugRequisition {
  id: string
  requisitionNo: string
  prescriptionId: string
  prescriptionNo: string
  consultationId: string
  consultationNo: string
  petName: string
  petOwnerName: string
  veterinarianName: string
  institutionId: string
  items: DrugRequisitionItem[]
  outboundSelections: DrugOutboundSelection[]
  status: 'pending_outbound' | 'outbound'
  createdAt: string
  updatedAt: string
}

