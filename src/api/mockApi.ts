import type {
  AlertRecord,
  AnnualReport,
  AnteMortemCheckDetail,
  AnteMortemInput,
  AnteMortemSubmitInput,
  AppData,
  CarrierRestriction,
  ClinicInstitution,
  ClinicInstitutionInput,
  ClosedLoopNode,
  CompleteHarmlessInput,
  CompleteMedicalWasteInput,
  DrugInOutRecord,
  DrugInventory,
  DrugStockInInput,
  EntryCheckInput,
  EntryCheckRecord,
  HarmlessTaskInput,
  HarmlessTreatmentTask,
  ImmunizationInput,
  ImmunizationLedger,
  LandingReport,
  LandingReportInput,
  MarkType,
  MarkUsageSubmitInput,
  MeatQualityCheckDetail,
  MeatQualityCertificate,
  MeatQualityCertificateInput,
  MeatQualityCertificateInputExtended,
  MeatQualitySubmitInput,
  MedicalWasteInput,
  MedicalWasteRecord,
  OperationLog,
  OriginApplicationInput,
  OriginInspectionInput,
  OriginQuarantineApplication,
  PetOwner,
  PetOwnerInput,
  PetProfile,
  PetProfileInput,
  PostMortemCheckDetail,
  PostMortemInput,
  PostMortemSubmitInput,
  PostProductBatch,
  Prescription,
  PrescriptionInput,
  ProductCertIssueInput,
  ProductCertIssueRecord,
  ProductCertificate,
  ProductCertificateInput,
  QuarantineCertificate,
  QuarantineMark,
  QuarantineMarkApplication,
  QuarantineMarkApplicationInput,
  QuarantineMarkReturnApplicationInput,
  SlaughterAnteMortemCheck,
  SlaughterApplicationInput,
  SlaughterAuditInput,
  SlaughterEntryRecord,
  SlaughterEntryConfirmInput,
  SlaughterEntryExceptionInput,
  SlaughterEntryReturnInput,
  SlaughterPostMortemCheck,
  SlaughterQuarantineApplication,
  SlaughterQuarantineApplicationInput,
  SlaughterRecord,
  SlaughterSelfInspection,
  SlaughterSelfInspectionInput,
  SyncLog,
  ThreeCertificateLink,
  TraceabilityRecord,
  TransportExceptionInput,
  UserRole,
  UserSession,
  ValidationResult,
  Veterinarian,
  VeterinarianInput,
  WaitingSlaughterBatch,
  InspectionAttachment,
  TransportTask,
} from '../domain/models'
import { createSeedData, roleSessions } from '../domain/seed'
import { transitionStatus } from '../domain/stateMachine'

const STORAGE_KEY = 'animal-vet-system-data'
const SESSION_KEY = 'animal-vet-system-session'
const memoryStorage = new Map<string, string>()
const syncTargets = ['动物检疫大数据系统', '畜禽屠宰行业管理系统', '无害化处理数据系统', '省级畜牧数据仓']

function getStorage() {
  if (typeof localStorage !== 'undefined') return localStorage

  return {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => memoryStorage.set(key, value),
    removeItem: (key: string) => memoryStorage.delete(key),
  }
}

function now() {
  return new Date().toISOString()
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function no(prefix: string) {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `${prefix}${stamp}${Math.floor(Math.random() * 90 + 10)}`
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function ensureData(data: AppData): AppData {
  const seed = createSeedData()
  const merged = { ...seed, ...data }
  // For array fields: if old data has empty array but seed has items, use seed data
  for (const key of Object.keys(seed) as (keyof AppData)[]) {
    if (Array.isArray(seed[key]) && Array.isArray(merged[key]) && (merged[key] as unknown[]).length === 0 && (seed[key] as unknown[]).length > 0) {
      (merged as Record<string, unknown>)[key] = seed[key]
    }
    // Ensure any new array fields from seed are present when old data lacks them entirely
    if (Array.isArray(seed[key]) && !Array.isArray(merged[key])) {
      (merged as Record<string, unknown>)[key] = seed[key]
    }
  }
  return merged
}

function readData(): AppData {
  const storage = getStorage()
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = createSeedData()
    writeData(seed)
    return seed
  }

  return ensureData(JSON.parse(raw) as AppData)
}

function writeData(data: AppData) {
  getStorage().setItem(STORAGE_KEY, JSON.stringify(data))
}

function pushLog(data: AppData, role: UserRole, actor: string, action: string, target: string) {
  const log: OperationLog = { id: id('log'), role, actor, action, target, createdAt: now() }
  data.operationLogs.unshift(log)
}

function pushAlert(data: AppData, level: AlertRecord['level'], type: string, message: string, relatedId: string) {
  const alert: AlertRecord = { id: id('alert'), level, type, message, relatedId, resolved: false, createdAt: now() }
  data.alerts.unshift(alert)
}

function pushSync(data: AppData, businessNo: string, businessType: string, preferredTarget?: string) {
  const targets = preferredTarget ? [preferredTarget] : syncTargets
  targets.forEach((target, index) => {
    const log: SyncLog = {
      id: id('sync'),
      target,
      status: index === 0 ? 'success' : 'pending',
      businessNo,
      businessType,
      syncedAt: now(),
      retryCount: 0,
    }
    data.syncLogs.unshift(log)
  })
}

function pushNode(data: AppData, nodeName: string, dataSource: string, passed: boolean, operator: string, relatedId: string, summary: string) {
  const node: ClosedLoopNode = {
    id: id('node'),
    nodeName,
    dataSource,
    passed,
    operator,
    operatedAt: now(),
    syncStatus: 'success',
    relatedId,
    summary,
  }
  data.closedLoopNodes.unshift(node)
}

function ensureOriginInspectionAttachments(data: AppData, application: OriginQuarantineApplication) {
  const existing = data.inspectionAttachments.some((item) => item.applicationNo === application.applicationNo)
  if (existing) return

  const current = now()
  const attachments: InspectionAttachment[] = [
    { id: id('att'), applicationNo: application.applicationNo, type: 'scene_photo', typeName: '现场照片', fileName: `现场查验_${application.applicationNo}.jpg`, fileSize: 307200, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: current },
    { id: id('att'), applicationNo: application.applicationNo, type: 'ear_tag_photo', typeName: '耳标照片', fileName: `耳标核验_${application.applicationNo}.jpg`, fileSize: 153600, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: current },
    { id: id('att'), applicationNo: application.applicationNo, type: 'loading_photo', typeName: '装载照片', fileName: `装载查验_${application.applicationNo}.jpg`, fileSize: 256000, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: current },
  ]
  data.inspectionAttachments.unshift(...attachments)
}

function ensurePendingSlaughterEntry(data: AppData, certificate: QuarantineCertificate, taskId: string, application: OriginQuarantineApplication, batch?: AppData['farmBatches'][number]) {
  const existing = data.slaughterEntryRecords.some((item) => item.quarantineCertificateId === certificate.id)
  if (existing) return

  const record: SlaughterEntryRecord = {
    id: id('entry'),
    entryNo: no('RCDJ'),
    quarantineCertificateId: certificate.id,
    transportTaskId: taskId,
    applicationId: application.id,
    slaughterhouseName: '皖北标准化屠宰中心',
    animalType: certificate.animalType,
    quantity: certificate.quantity,
    earTagRange: batch ? `${batch.earTagPrefix}${batch.earTagStart}-${batch.earTagEnd}` : certificate.earTagRange ?? '',
    vehiclePlateNo: certificate.vehiclePlateNo,
    carrier: certificate.carrier ?? application.carrier,
    originFarm: batch?.farmName ?? '',
    originLocation: batch?.location ?? certificate.origin,
    checkResults: [],
    status: 'pending_check',
    checkedBy: '',
    checkedAt: '',
    createdAt: now(),
  }
  certificate.entryUsageStatus = 'not_arrived'
  data.slaughterEntryRecords.unshift(record)
}

function appendEntryAttachments(data: AppData, entry: SlaughterEntryRecord, attachments: SlaughterEntryConfirmInput['attachments'] | SlaughterEntryExceptionInput['attachments'] = []) {
  const current = now()
  attachments.forEach((attachment) => {
    data.inspectionAttachments.unshift({
      id: id('att'),
      applicationNo: entry.entryNo,
      type: attachment.type,
      typeName: attachment.typeName,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
      dataUrl: attachment.dataUrl,
      uploadedBy: attachment.uploadedBy,
      uploadedAt: current,
    })
  })
}

function validateEntryConfirmInput(data: AppData, entry: SlaughterEntryRecord, input: SlaughterEntryConfirmInput) {
  const certificate = data.quarantineCertificates.find((item) => item.id === entry.quarantineCertificateId)
  if (!certificate) throw new Error('动物检疫合格证明不存在')
  const certValid = new Date(certificate.validTo).getTime() >= Date.now()
  const duplicateEntry = data.slaughterEntryRecords.some((item) => item.id !== entry.id && item.quarantineCertificateId === certificate.id && item.status === 'entry_passed')
  const restricted = data.carrierRestrictions.some((item) => item.certificateId === certificate.id && item.status === 'restricted')
  const scenePassed = input.vehicleArrived && input.quantityMatched && input.earTagMatched && input.clinicalNormal && input.deathCount === 0 && input.abnormalCount === 0 && input.loadingNormal

  if (!input.actualQuantity) throw new Error('实到数量不能为空')
  if (!input.waitingPenNo.trim()) throw new Error('待宰圈编号不能为空')
  if (!certValid || certificate.entryUsageStatus === 'used') throw new Error('动物证无效、已作废或已过期，禁止确认入场')
  if (duplicateEntry) throw new Error('发现重复入场，禁止确认入场')
  if (restricted) throw new Error('存在承运限制，禁止确认入场')
  if (!scenePassed) throw new Error('现场核对不通过，禁止确认入场')
}

function validateEntryExceptionInput(input: SlaughterEntryExceptionInput) {
  if (!input.abnormalReason.trim()) throw new Error('登记异常必须填写异常说明')
}

function validateEntryReturnInput(input: SlaughterEntryReturnInput) {
  if (!input.reason.trim()) throw new Error('入场退回必须填写原因')
}

function validateOriginApplication(data: AppData, input: OriginApplicationInput): ValidationResult[] {
  const batch = data.farmBatches.find((item) => item.id === input.batchId)
  const vehicle = data.vehicles.find((item) => item.id === input.vehicleId)
  const enoughEarTags = batch ? input.quantity <= batch.earTagEnd - batch.earTagStart + 1 : false

  return [
    { label: '存栏校验', passed: Boolean(batch && input.quantity > 0 && batch.stock >= input.quantity), message: batch && batch.stock >= input.quantity ? `当前存栏 ${batch.stock} 头，可申报` : '申报数量超过当前存栏' },
    { label: '耳标状态', passed: Boolean(batch && enoughEarTags), message: batch && enoughEarTags ? `${batch.earTagPrefix} 区间覆盖本次数量` : '耳标区间不足或批次不存在' },
    { label: '强制免疫', passed: Boolean(batch?.immuneQualified), message: batch?.immuneQualified ? '免疫记录齐全且在有效期内' : '免疫记录不合格' },
    { label: '车辆备案', passed: Boolean(vehicle?.registered), message: vehicle?.registered ? `${vehicle.plateNo} 已备案` : '车辆未备案' },
    { label: '承运人备案', passed: Boolean(vehicle && !vehicle.blacklisted), message: vehicle && !vehicle.blacklisted ? `${vehicle.carrier} 未命中黑名单` : '车辆或承运人命中黑名单' },
    { label: '定位设备状态', passed: Boolean(vehicle?.registered), message: vehicle?.registered ? '定位设备在线' : '定位设备未备案' },
    { label: '目的地备案', passed: Boolean(input.destination && input.destinationAddress), message: input.destination && input.destinationAddress ? `${input.destination}已备案` : '目的地和详细地址不能为空' },
  ]
}

function buildOriginApplication(data: AppData, input: OriginApplicationInput, status: OriginQuarantineApplication['status']): OriginQuarantineApplication {
  const batch = data.farmBatches.find((item) => item.id === input.batchId)
  const vehicle = data.vehicles.find((item) => item.id === input.vehicleId)
  if (!batch || !vehicle) throw new Error('申报批次或车辆不存在')
  const current = now()

  return {
    id: id('origin'),
    applicationNo: no('CDJY'),
    batchId: batch.id,
    animalType: batch.animalType,
    quantity: input.quantity,
    destination: input.destination,
    destinationAddress: input.destinationAddress,
    purpose: input.purpose,
    departureTime: input.departureTime,
    contactPerson: input.contactPerson,
    contactPhone: input.contactPhone,
    remark: input.remark,
    vehicleId: vehicle.id,
    carrier: vehicle.carrier,
    status,
    validationResults: validateOriginApplication(data, input),
    submittedAt: status === 'submitted' ? current : undefined,
    createdAt: current,
    updatedAt: current,
  }
}

function updateOriginApplicationFields(data: AppData, application: OriginQuarantineApplication, input: OriginApplicationInput) {
  const batch = data.farmBatches.find((item) => item.id === input.batchId)
  const vehicle = data.vehicles.find((item) => item.id === input.vehicleId)
  if (!batch || !vehicle) throw new Error('申报批次或车辆不存在')
  application.batchId = batch.id
  application.animalType = batch.animalType
  application.quantity = input.quantity
  application.destination = input.destination
  application.destinationAddress = input.destinationAddress
  application.purpose = input.purpose
  application.departureTime = input.departureTime
  application.contactPerson = input.contactPerson
  application.contactPhone = input.contactPhone
  application.remark = input.remark
  application.vehicleId = vehicle.id
  application.carrier = vehicle.carrier
  application.validationResults = validateOriginApplication(data, input)
  application.updatedAt = now()
}

function assertOriginPrecheckPassed(data: AppData, application: OriginQuarantineApplication) {
  const failed = application.validationResults.filter((item) => !item.passed)
  if (!failed.length) return
  pushLog(data, 'farmer', '绿丰生态养殖场', '阻断产地检疫申报提交', `${application.applicationNo}：${failed.map((item) => item.label).join('、')}`)
  pushAlert(data, 'danger', '申报前自查异常', failed.map((item) => `${item.label}：${item.message}`).join('；'), application.id)
  writeData(data)
  throw new Error('申报前自查存在异常，不能提交')
}

function findCertificateData(data: AppData, query: string) {
  const certificate = data.quarantineCertificates.find((item) => item.certificateNo === query || item.vehiclePlateNo === query)
  const task = certificate ? data.transportTasks.find((item) => item.certificateId === certificate.id) : undefined
  const vehicle = certificate ? data.vehicles.find((item) => item.plateNo === certificate.vehiclePlateNo) : undefined
  const application = certificate ? data.originApplications.find((item) => item.id === certificate.applicationId) : undefined
  const batch = application ? data.farmBatches.find((item) => item.id === application.batchId) : undefined
  return { certificate, task, vehicle, application, batch }
}

function addRestriction(data: AppData, taskId: string, reason: string) {
  const task = data.transportTasks.find((item) => item.id === taskId)
  if (!task) throw new Error('运输任务不存在')
  const certificate = data.quarantineCertificates.find((item) => item.id === task.certificateId)
  const vehicle = data.vehicles.find((item) => item.plateNo === task.plateNo)
  if (!certificate || !vehicle) throw new Error('证明或车辆不存在')
  const existing = data.carrierRestrictions.find((item) => item.transportTaskId === task.id && item.status === 'restricted')
  if (existing) return existing
  const restriction: CarrierRestriction = {
    id: id('restriction'),
    vehicleId: vehicle.id,
    plateNo: vehicle.plateNo,
    carrier: vehicle.carrier,
    reason,
    certificateId: certificate.id,
    transportTaskId: task.id,
    status: 'restricted',
    disposalRecords: [`${now()} ${reason}`],
    restrictedAt: now(),
  }
  task.status = transitionStatus(task.status === 'transporting' ? 'landing_exception' : task.status, 'carrier_restricted')
  data.carrierRestrictions.unshift(restriction)
  pushAlert(data, 'danger', reason.includes('轨迹') || reason.includes('偏离') ? '轨迹偏离' : '运输异常', reason, restriction.id)
  pushLog(data, 'regulator', '市级畜牧兽医监管员', '加入承运限制名单', vehicle.plateNo)
  pushSync(data, certificate.certificateNo, '承运限制')
  pushNode(data, '承运限制', '调运监管系统', false, '市级畜牧兽医监管员', restriction.id, reason)
  return restriction
}

export const mockApi = {
  async login(role: UserRole): Promise<UserSession> {
    const session = roleSessions[role]
    getStorage().setItem(SESSION_KEY, JSON.stringify(session))
    return clone(session)
  },

  async getSession(): Promise<UserSession | undefined> {
    const raw = getStorage().getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as UserSession) : undefined
  },

  async logout(): Promise<void> {
    getStorage().removeItem(SESSION_KEY)
  },

  async getBootstrapData(): Promise<AppData> {
    const data = readData()
    writeData(data)
    return clone(data)
  },

  async saveOriginDraft(input: OriginApplicationInput): Promise<OriginQuarantineApplication> {
    const data = readData()
    const application = buildOriginApplication(data, input, 'draft')
    const batch = data.farmBatches.find((item) => item.id === input.batchId)
    data.originApplications.unshift(application)
    pushLog(data, 'farmer', batch?.farmName || '养殖场户', '保存产地检疫申报草稿', application.applicationNo)
    writeData(data)
    return clone(application)
  },

  async updateOriginDraft(idValue: string, input: OriginApplicationInput): Promise<OriginQuarantineApplication> {
    const data = readData()
    const application = data.originApplications.find((item) => item.id === idValue)
    if (!application) throw new Error('申报不存在')
    if (!['draft', 'rejected'].includes(application.status)) throw new Error('只有草稿或驳回申报可以编辑')
    updateOriginApplicationFields(data, application, input)
    const batch = data.farmBatches.find((item) => item.id === input.batchId)
    pushLog(data, 'farmer', batch?.farmName || '养殖场户', application.status === 'rejected' ? '编辑驳回产地检疫申报' : '编辑产地检疫申报草稿', application.applicationNo)
    writeData(data)
    return clone(application)
  },

  async deleteOriginDraft(idValue: string): Promise<void> {
    const data = readData()
    const application = data.originApplications.find((item) => item.id === idValue)
    if (!application) throw new Error('申报不存在')
    if (application.status !== 'draft') throw new Error('只有草稿可以删除')
    data.originApplications = data.originApplications.filter((item) => item.id !== idValue)
    pushLog(data, 'farmer', '绿丰生态养殖场', '删除产地检疫申报草稿', application.applicationNo)
    writeData(data)
  },

  async submitOriginDraft(idValue: string): Promise<OriginQuarantineApplication> {
    const data = readData()
    const application = data.originApplications.find((item) => item.id === idValue)
    if (!application) throw new Error('申报不存在')
    if (application.status !== 'draft') throw new Error('只有草稿可以提交')
    assertOriginPrecheckPassed(data, application)
    application.status = transitionStatus(application.status, 'submitted')
    application.submittedAt = now()
    application.updatedAt = now()
    ensureOriginInspectionAttachments(data, application)
    pushLog(data, 'farmer', '绿丰生态养殖场', '提交产地检疫申报', application.applicationNo)
    pushNode(data, '产地检疫申报', '养殖场户端', application.validationResults.every((item) => item.passed), '绿丰生态养殖场', application.id, `申报 ${application.quantity} 头${application.animalType}`)
    application.validationResults.filter((item) => !item.passed).forEach((item) => pushAlert(data, 'warning', item.label, item.message, application.id))
    writeData(data)
    return clone(application)
  },

  async submitOriginApplication(input: OriginApplicationInput): Promise<OriginQuarantineApplication> {
    const data = readData()
    const application = buildOriginApplication(data, input, transitionStatus('draft', 'submitted'))
    assertOriginPrecheckPassed(data, application)
    const batch = data.farmBatches.find((item) => item.id === input.batchId)

    data.originApplications.unshift(application)
    ensureOriginInspectionAttachments(data, application)
    pushLog(data, 'farmer', batch?.farmName || '养殖场户', '提交产地检疫申报', application.applicationNo)
    pushNode(data, '产地检疫申报', '养殖场户端', application.validationResults.every((item) => item.passed), batch?.farmName || '养殖场户', application.id, `申报 ${application.quantity} 头${application.animalType}`)
    application.validationResults.filter((item) => !item.passed).forEach((item) => pushAlert(data, 'warning', item.label, item.message, application.id))
    writeData(data)
    return clone(application)
  },

  async withdrawOriginApplication(idValue: string, reason: string): Promise<OriginQuarantineApplication> {
    const data = readData()
    const application = data.originApplications.find((item) => item.id === idValue)
    if (!application) throw new Error('申报不存在')
    if (!['submitted', 'origin_reviewing'].includes(application.status)) throw new Error('当前状态不允许撤回')
    application.status = transitionStatus(application.status, 'draft')
    application.withdrawReason = reason
    application.updatedAt = now()
    pushLog(data, 'farmer', '绿丰生态养殖场', '撤回产地检疫申报', `${application.applicationNo}：${reason}`)
    writeData(data)
    return clone(application)
  },

  async rejectOriginApplication(idValue: string, reason: string): Promise<OriginQuarantineApplication> {
    const data = readData()
    const application = data.originApplications.find((item) => item.id === idValue)
    if (!application) throw new Error('申报不存在')
    if (!['submitted', 'origin_reviewing'].includes(application.status)) throw new Error('当前状态不允许驳回')
    application.status = transitionStatus(application.status, 'rejected')
    application.rejectReason = reason
    application.updatedAt = now()
    pushLog(data, 'vet', '官方兽医 王敏', '驳回产地检疫申报', `${application.applicationNo}：${reason}`)
    writeData(data)
    return clone(application)
  },

  async resubmitRejectedOriginApplication(idValue: string, input: OriginApplicationInput): Promise<OriginQuarantineApplication> {
    const data = readData()
    const application = data.originApplications.find((item) => item.id === idValue)
    if (!application) throw new Error('申报不存在')
    if (application.status !== 'rejected') throw new Error('只有驳回申报可以重新提交')
    updateOriginApplicationFields(data, application, input)
    assertOriginPrecheckPassed(data, application)
    application.status = transitionStatus(application.status, 'submitted')
    application.submittedAt = now()
    application.rejectReason = undefined
    application.updatedAt = now()
    ensureOriginInspectionAttachments(data, application)
    pushLog(data, 'farmer', '绿丰生态养殖场', '重新提交产地检疫申报', application.applicationNo)
    writeData(data)
    return clone(application)
  },

  async voidOriginApplication(idValue: string, reason: string): Promise<OriginQuarantineApplication> {
    const data = readData()
    const application = data.originApplications.find((item) => item.id === idValue)
    if (!application) throw new Error('申报不存在')
    if (!['draft', 'submitted', 'rejected'].includes(application.status)) throw new Error('当前状态不允许作废')
    application.status = transitionStatus(application.status, 'voided')
    application.voidReason = reason
    application.updatedAt = now()
    pushLog(data, 'farmer', '绿丰生态养殖场', '作废产地检疫申报', `${application.applicationNo}：${reason}`)
    writeData(data)
    return clone(application)
  },

  async getOriginApplications(): Promise<OriginQuarantineApplication[]> {
    return clone(readData().originApplications)
  },

  async getOriginApplication(idValue: string): Promise<OriginQuarantineApplication | undefined> {
    return clone(readData().originApplications.find((item) => item.id === idValue))
  },

  async requestVoidOriginApplication(idValue: string, reason: string): Promise<OriginQuarantineApplication> {
    const data = readData()
    const application = data.originApplications.find((item) => item.id === idValue)
    if (!application) throw new Error('申报不存在')
    if (application.status !== 'certificate_issued') throw new Error('只有已出证申报可以申请作废')
    application.voidRequested = true
    application.voidRequestReason = reason
    application.updatedAt = now()
    pushLog(data, 'farmer', '绿丰生态养殖场', '申请作废产地检疫证明', `${application.applicationNo}：${reason}`)
    pushAlert(data, 'warning', '产地检疫证明作废申请', `${application.applicationNo}：${reason}`, application.id)
    writeData(data)
    return clone(application)
  },

  async approveOriginApplication(idValue: string, input: OriginInspectionInput): Promise<QuarantineCertificate> {
    const data = readData()
    const application = data.originApplications.find((item) => item.id === idValue)
    if (!application) throw new Error('申报不存在')
    const batch = data.farmBatches.find((item) => item.id === application.batchId)
    const vehicle = data.vehicles.find((item) => item.id === application.vehicleId)
    if (!batch || !vehicle) throw new Error('批次或车辆不存在')
    if (!application.validationResults.every((item) => item.passed)) throw new Error('申报自动校验未全部通过')
    if (!input.faceRecognitionPassed || !input.siteInspectionPassed || input.evidencePhotoCount < 1) {
      pushAlert(data, 'danger', '现场查验', '人脸识别、现场查验或拍照取证未完成', application.id)
      writeData(data)
      throw new Error('现场查验未通过')
    }

    application.status = transitionStatus(application.status, 'origin_reviewing')
    application.status = transitionStatus(application.status, 'origin_approved')
    application.status = transitionStatus(application.status, 'certificate_issued')
    application.updatedAt = now()
    batch.stock -= application.quantity

    const certificate: QuarantineCertificate = {
      id: id('cert'),
      certificateNo: no('DWJY'),
      applicationId: application.id,
      validFrom: now(),
      validTo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      issuedBy: '官方兽医 王敏',
      animalType: application.animalType,
      quantity: application.quantity,
      origin: batch.location,
      destination: application.destination,
      vehiclePlateNo: vehicle.plateNo,
    }

    const transportStatus = transitionStatus(application.status, 'transporting')
    const transportTask: TransportTask = {
      id: id('transport'),
      certificateId: certificate.id,
      plateNo: vehicle.plateNo,
      status: transportStatus,
      route: [
        { name: '养殖场出发', time: now(), status: 'done', description: batch.location },
        { name: '省道卡口', time: '预计 40 分钟后', status: 'active', description: '轨迹与申报路线一致' },
        { name: '屠宰场入场', time: '预计 90 分钟后', status: 'pending', description: application.destination },
      ],
      hasDeviation: false,
      startedAt: now(),
    }
    data.quarantineCertificates.unshift(certificate)
    data.transportTasks.unshift(transportTask)
    ensurePendingSlaughterEntry(data, certificate, transportTask.id, application, batch)

    pushLog(data, 'vet', '官方兽医 王敏', `无纸化出证：${input.remark}`, certificate.certificateNo)
    pushLog(data, 'vet', '官方兽医 王敏', '生成运输任务并同步监管端', vehicle.plateNo)
    pushSync(data, certificate.certificateNo, '产地检疫出证', '动物检疫大数据系统')
    pushNode(data, '动物检疫合格证明', '官方兽医端', true, '官方兽医 王敏', certificate.id, certificate.certificateNo)
    pushNode(data, '运输任务', '调运监管系统', true, '系统自动生成', certificate.id, `${vehicle.plateNo} 发车`)
    writeData(data)
    return clone(certificate)
  },

  async getTransportTasks() {
    return clone(readData().transportTasks)
  },

  async submitLandingReport(input: LandingReportInput): Promise<LandingReport> {
    const data = readData()
    const task = data.transportTasks.find((item) => item.id === input.transportTaskId)
    if (!task) throw new Error('运输任务不存在')
    const certificate = data.quarantineCertificates.find((item) => item.id === task.certificateId)
    if (!certificate) throw new Error('检疫证明不存在')
    const onDestination = certificate.destination === input.actualDestination
    const plannedArrivedAt = new Date(Date.now() + 90 * 60 * 1000).toISOString()
    const overdue = new Date(input.arrivedAt).getTime() > new Date(plannedArrivedAt).getTime()
    const status = onDestination && !overdue ? 'submitted' : overdue ? 'overdue' : 'exception'
    const report: LandingReport = {
      id: id('landing'),
      reportNo: no('LDBG'),
      transportTaskId: task.id,
      certificateId: certificate.id,
      plateNo: task.plateNo,
      destination: certificate.destination,
      actualDestination: input.actualDestination,
      status,
      onDestination,
      overdue,
      exceptionType: onDestination ? overdue ? 'missing_landing_report' : undefined : 'wrong_destination',
      reporter: input.reporter,
      plannedArrivedAt,
      arrivedAt: input.arrivedAt,
      createdAt: now(),
    }
    data.landingReports.unshift(report)
    task.status = status === 'submitted' ? transitionStatus('landing_pending', 'landing_submitted') : transitionStatus('landing_pending', status === 'overdue' ? 'landing_overdue' : 'landing_exception')
    pushLog(data, 'slaughter', input.reporter, '提交落地报告', report.reportNo)
    pushSync(data, report.reportNo, '运输落地', '省级畜牧数据仓')
    pushNode(data, '落地报告', '屠宰企业端', status === 'submitted', input.reporter, report.id, status === 'submitted' ? '按目的地落地' : '落地异常')
    if (status !== 'submitted') addRestriction(data, task.id, overdue ? '超时未提交落地报告' : '未按目的地运输')
    writeData(data)
    return clone(report)
  },

  async markTransportException(input: TransportExceptionInput) {
    const data = readData()
    const task = data.transportTasks.find((item) => item.id === input.transportTaskId)
    if (!task) throw new Error('运输任务不存在')
    task.hasDeviation = input.type === 'route_deviation'
    task.status = transitionStatus(task.status, 'landing_exception')
    const restriction = addRestriction(data, task.id, input.message)
    writeData(data)
    return clone(restriction)
  },

  async performEntryCheck(input: EntryCheckInput): Promise<EntryCheckRecord> {
    const data = readData()
    const { certificate, task, vehicle, batch } = findCertificateData(data, input.query)
    if (!certificate || !task || !vehicle) throw new Error('未找到检疫证明或运输任务')
    const certValid = new Date(certificate.validTo).getTime() >= Date.now()
    const plateMatched = (input.recognizedPlateNo ?? vehicle.plateNo) === certificate.vehiclePlateNo
    const earTagMatched = input.earTagMatched ?? true
    const originRegionMatched = input.originRegionMatched ?? Boolean(batch?.earTagPrefix.startsWith('AH'))

    task.status = task.status === 'landing_submitted' ? transitionStatus(task.status, 'arrived') : task.status === 'transporting' ? transitionStatus(task.status, 'arrived') : task.status
    task.arrivedAt = now()
    const checks: ValidationResult[] = [
      { label: '车牌识别', passed: plateMatched, message: plateMatched ? `识别车牌 ${certificate.vehiclePlateNo}` : '车牌识别与证明不一致' },
      { label: '检疫证明有效性', passed: certValid, message: certValid ? `${certificate.certificateNo} 有效` : '检疫证明已过期或无效' },
      { label: '指定通道', passed: vehicle.channel === input.channel, message: vehicle.channel === input.channel ? '入场通道正确' : '未按指定通道入场' },
      { label: '黑名单', passed: !vehicle.blacklisted, message: vehicle.blacklisted ? '命中黑名单' : '未命中黑名单' },
      { label: '运输轨迹', passed: !task.hasDeviation, message: task.hasDeviation ? '轨迹存在偏离' : '运输轨迹正常' },
      { label: '耳标一致性', passed: earTagMatched, message: earTagMatched ? '耳标与产地批次一致' : '耳标不一致' },
      { label: '数量一致性', passed: certificate.quantity === input.actualQuantity, message: certificate.quantity === input.actualQuantity ? '入场数量与证明一致' : '入场数量与证明不一致' },
      { label: '启运地区划', passed: originRegionMatched, message: originRegionMatched ? '启运地与耳标所属区划一致' : '启运地与耳标所属区划不一致' },
    ]
    const blockingFailed = checks.some((item) => ['检疫证明有效性', '数量一致性', '耳标一致性', '启运地区划'].includes(item.label) && !item.passed)
    const allPassed = checks.every((item) => item.passed)
    const checkingStatus = transitionStatus('arrived', 'entry_checking')
    const record: EntryCheckRecord = {
      id: id('entry'),
      certificateId: certificate.id,
      plateNo: vehicle.plateNo,
      status: transitionStatus(checkingStatus, allPassed && !blockingFailed ? 'entry_passed' : 'entry_rejected'),
      checks,
      checkedAt: now(),
    }

    task.status = record.status
    data.entryChecks.unshift(record)
    checks.filter((item) => !item.passed).forEach((item) => pushAlert(data, 'danger', item.label, item.message, record.id))
    if (blockingFailed) {
      data.harmlessTasks.unshift({ id: id('harmless'), taskNo: no('WHH'), source: 'entry_exception', sourceId: record.id, quantity: input.actualQuantity, weight: input.actualQuantity * 80, reason: '入场阻断异常', status: 'pending', createdAt: now() })
    }
    pushLog(data, 'slaughter', '皖北标准化屠宰中心', allPassed ? '入场查验通过' : '入场查验驳回', certificate.certificateNo)
    pushSync(data, certificate.certificateNo, '屠宰入场', '畜禽屠宰行业管理系统')
    pushNode(data, '屠宰入场', '屠宰企业端', record.status === 'entry_passed', '皖北标准化屠宰中心', record.id, record.status === 'entry_passed' ? '入场核验通过' : '入场阻断')
    writeData(data)
    return clone(record)
  },

  async submitSlaughterApplication(input: SlaughterApplicationInput): Promise<SlaughterQuarantineApplication> {
    const data = readData()
    const entry = data.entryChecks.find((item) => item.id === input.entryCheckId)
    if (!entry) throw new Error('入场查验记录不存在')
    if (entry.status !== 'entry_passed') throw new Error('入场未通过，不能提交屠宰检疫申报')
    if (input.africanSwineFeverResult !== 'negative' || input.bannedDrugResult !== 'negative') {
      pushAlert(data, 'danger', '企业自检', '非瘟检测或违禁药物自检存在异常', entry.id)
      writeData(data)
      throw new Error('企业自检结果异常')
    }

    const application: SlaughterQuarantineApplication = { id: id('slaughter'), entryCheckId: entry.id, applicationNo: no('TZJY'), quantity: input.quantity, africanSwineFeverResult: input.africanSwineFeverResult, bannedDrugResult: input.bannedDrugResult, status: 'submitted_pending_accept', createdAt: now() }
    data.slaughterApplications.unshift(application)
    pushLog(data, 'slaughter', '皖北标准化屠宰中心', '提交屠宰检疫申报', application.applicationNo)
    pushNode(data, '非瘟检测', '屠宰企业端', true, '皖北标准化屠宰中心', application.id, '非瘟与违禁药物自检阴性')
    writeData(data)
    return clone(application)
  },

  async createWaitingSlaughterBatch(entryCheckId: string): Promise<WaitingSlaughterBatch> {
    const data = readData()
    const entry = data.entryChecks.find((item) => item.id === entryCheckId)
    if (!entry || entry.status !== 'entry_passed') throw new Error('入场查验未通过')
    const certificate = data.quarantineCertificates.find((item) => item.id === entry.certificateId)
    if (!certificate) throw new Error('证明不存在')
    const batch: WaitingSlaughterBatch = { id: id('waiting'), entryCheckId: entry.id, certificateId: certificate.id, quantity: certificate.quantity, animalType: certificate.animalType, status: transitionStatus(entry.status, 'waiting_slaughter'), createdAt: now() }
    data.waitingSlaughterBatches.unshift(batch)
    pushLog(data, 'slaughter', '皖北标准化屠宰中心', '生成待宰批次', certificate.certificateNo)
    pushNode(data, '待宰管理', '屠宰企业端', true, '皖北标准化屠宰中心', batch.id, `${batch.quantity} 头进入待宰`)
    writeData(data)
    return clone(batch)
  },

  async submitAnteMortemCheck(input: AnteMortemInput): Promise<SlaughterAnteMortemCheck> {
    const data = readData()
    const waiting = data.waitingSlaughterBatches.find((item) => item.id === input.waitingBatchId)
    if (!waiting) throw new Error('待宰批次不存在')
    waiting.status = transitionStatus(waiting.status, 'ante_mortem_checked')
    const check: SlaughterAnteMortemCheck = { id: id('ante'), waitingBatchId: waiting.id, checkedBy: input.checkedBy, passed: input.passed, status: 'completed', remark: input.remark, checkedAt: now() }
    data.anteMortemChecks.unshift(check)
    pushLog(data, 'vet', input.checkedBy, '完成宰前检查', waiting.id)
    pushNode(data, '宰前检查', '官方兽医端', input.passed, input.checkedBy, check.id, input.remark)
    writeData(data)
    return clone(check)
  },

  async submitPostMortemCheck(input: PostMortemInput): Promise<SlaughterPostMortemCheck> {
    const data = readData()
    const waiting = data.waitingSlaughterBatches.find((item) => item.id === input.waitingBatchId)
    if (!waiting) throw new Error('待宰批次不存在')
    waiting.status = transitionStatus(waiting.status, 'post_mortem_checked')
    const check: SlaughterPostMortemCheck = { id: id('post'), waitingBatchId: waiting.id, checkedBy: input.checkedBy, qualifiedQuantity: input.qualifiedQuantity, unqualifiedQuantity: input.unqualifiedQuantity, productWeight: input.productWeight, status: 'completed', remark: input.remark, checkedAt: now() }
    data.postMortemChecks.unshift(check)
    pushLog(data, 'vet', input.checkedBy, '完成宰后同步检疫', waiting.id)
    pushNode(data, '宰后检疫', '官方兽医端', input.unqualifiedQuantity === 0, input.checkedBy, check.id, `合格 ${input.qualifiedQuantity}，不合格 ${input.unqualifiedQuantity}`)
    if (input.unqualifiedQuantity > 0) {
      data.harmlessTasks.unshift({ id: id('harmless'), taskNo: no('WHH'), source: 'slaughter_unqualified', sourceId: check.id, quantity: input.unqualifiedQuantity, weight: input.unqualifiedQuantity * 80, reason: '屠宰检疫不合格', status: 'pending', createdAt: now() })
    }
    writeData(data)
    return clone(check)
  },

  async issueProductCertificate(input: ProductCertificateInput): Promise<ProductCertificate> {
    const data = readData()
    const waiting = data.waitingSlaughterBatches.find((item) => item.id === input.waitingBatchId)
    if (!waiting) throw new Error('待宰批次不存在')
    waiting.status = transitionStatus(waiting.status, 'product_certificate_issued')
    const certificate: ProductCertificate = { id: id('product'), certificateNo: no('CP'), waitingBatchId: waiting.id, productName: input.productName, weight: input.weight, issuedBy: input.issuedBy, issuedAt: now() }
    data.productCertificates.unshift(certificate)
    data.sealRecords.unshift({ id: id('seal'), sealNo: no('QYBZ'), action: 'use', quantity: 1, businessNo: certificate.certificateNo, operator: input.issuedBy, createdAt: now() })
    pushLog(data, 'vet', input.issuedBy, '生成动物产品检疫证明', certificate.certificateNo)
    pushSync(data, certificate.certificateNo, '产品检疫出证')
    pushNode(data, '产品检疫证明', '官方兽医端', true, input.issuedBy, certificate.id, certificate.certificateNo)
    writeData(data)
    return clone(certificate)
  },

  async issueMeatQualityCertificate(input: MeatQualityCertificateInput): Promise<MeatQualityCertificate> {
    const data = readData()
    const waiting = data.waitingSlaughterBatches.find((item) => item.id === input.waitingBatchId)
    if (!waiting) throw new Error('待宰批次不存在')
    waiting.status = transitionStatus(waiting.status, 'meat_quality_certificate_issued')
    const certificate: MeatQualityCertificate = { id: id('meat'), certificateNo: no('RZ'), waitingBatchId: waiting.id, productName: input.productName, weight: input.weight, inspector: input.inspector, issuedAt: now() }
    data.meatQualityCertificates.unshift(certificate)
    pushLog(data, 'slaughter', input.inspector, '生成肉品品质检验合格证', certificate.certificateNo)
    pushNode(data, '肉品品质检验合格证', '屠宰企业端', true, input.inspector, certificate.id, certificate.certificateNo)
    writeData(data)
    return clone(certificate)
  },

  async linkThreeCertificates(waitingBatchId: string): Promise<ThreeCertificateLink> {
    const data = readData()
    const waiting = data.waitingSlaughterBatches.find((item) => item.id === waitingBatchId)
    if (!waiting) throw new Error('待宰批次不存在')
    const animal = data.quarantineCertificates.find((item) => item.id === waiting.certificateId)
    const product = data.productCertificates.find((item) => item.waitingBatchId === waiting.id)
    const meat = data.meatQualityCertificates.find((item) => item.waitingBatchId === waiting.id)
    if (!animal || !product || !meat) throw new Error('三证不完整')
    waiting.status = transitionStatus(waiting.status, 'three_cert_linked')
    const link: ThreeCertificateLink = { id: id('link'), linkNo: no('LNK'), waitingBatchId: waiting.id, animalCertificateId: animal.id, productCertificateId: product.id, meatQualityCertificateId: meat.id, linkedAt: now() }
    data.threeCertificateLinks.unshift(link)
    pushLog(data, 'regulator', '系统自动关联', '完成三证关联追溯', animal.certificateNo)
    pushNode(data, '三证关联追溯', '闭环校验系统', true, '系统自动关联', link.id, `${animal.certificateNo} / ${product.certificateNo} / ${meat.certificateNo}`)
    writeData(data)
    return clone(link)
  },

  async approveSlaughterApplication(idValue: string, input: SlaughterAuditInput): Promise<ProductCertificate> {
    const data = readData()
    const application = data.slaughterApplications.find((item) => item.id === idValue)
    if (!application) throw new Error('屠宰检疫申报不存在')
    if (!input.anteMortemPassed || !input.postMortemPassed) {
      pushAlert(data, 'danger', '屠宰检疫', '宰前检查或宰后检疫未通过', application.id)
      writeData(data)
      throw new Error('屠宰检疫未通过')
    }
    application.status = 'product_cert_issued'
    const certificate: ProductCertificate = { id: id('product'), certificateNo: no('CP'), slaughterApplicationId: application.id, productName: input.productName, weight: input.weight, issuedBy: '官方兽医 王敏', issuedAt: now() }
    data.productCertificates.unshift(certificate)
    pushLog(data, 'vet', '官方兽医 王敏', `产品出证：${input.remark}`, certificate.certificateNo)
    pushSync(data, certificate.certificateNo, '产品检疫出证')
    writeData(data)
    return clone(certificate)
  },

  async createHarmlessTreatmentTask(input: HarmlessTaskInput): Promise<HarmlessTreatmentTask> {
    const data = readData()
    const task: HarmlessTreatmentTask = { id: id('harmless'), taskNo: no('WHH'), source: input.source, sourceId: input.sourceId, quantity: input.quantity, weight: input.weight, reason: input.reason, status: 'pending', createdAt: now() }
    data.harmlessTasks.unshift(task)
    pushLog(data, 'regulator', '系统自动生成', '生成无害化处理任务', task.taskNo)
    pushNode(data, '无害化处理', '无害化处理数据系统', false, '系统自动生成', task.id, input.reason)
    writeData(data)
    return clone(task)
  },

  async completeHarmlessTreatment(input: CompleteHarmlessInput): Promise<HarmlessTreatmentTask> {
    const data = readData()
    const task = data.harmlessTasks.find((item) => item.id === input.taskId)
    if (!task) throw new Error('无害化任务不存在')
    task.status = 'processing'
    task.status = 'completed'
    task.method = input.method
    task.processedQuantity = input.processedQuantity
    task.processedWeight = input.processedWeight
    task.photoCount = input.photoCount
    task.operator = input.operator
    task.completedAt = now()
    pushLog(data, 'regulator', input.operator, '完成无害化处理确认', task.taskNo)
    pushSync(data, task.taskNo, '无害化确认', '无害化处理数据系统')
    pushNode(data, '无害化处理', '无害化处理数据系统', true, input.operator, task.id, `${input.method} ${input.processedWeight}kg`)
    writeData(data)
    return clone(task)
  },

  async getAlerts() { return clone(readData().alerts) },
  async getLogs() { return clone(readData().operationLogs) },
  async getCarrierRestrictions() { return clone(readData().carrierRestrictions) },
  async getHarmlessTreatmentTasks() { return clone(readData().harmlessTasks) },
  async getSealRecords() { return clone(readData().sealRecords) },
  async getSyncLogs() { return clone(readData().syncLogs) },
  async getClosedLoopNodes() { return clone(readData().closedLoopNodes) },

  async submitClinicInstitution(input: ClinicInstitutionInput): Promise<ClinicInstitution> {
    const data = readData()
    const institution: ClinicInstitution = { id: id('clinic'), ...input, status: 'pending', active: true, createdAt: now() }
    data.clinicInstitutions.unshift(institution)
    pushLog(data, 'clinic_admin', input.name, '提交诊疗机构备案', input.licenseNo)
    pushNode(data, '诊疗机构备案', '动物诊疗管理', false, input.name, institution.id, `${input.name} 待审核`)
    writeData(data)
    return clone(institution)
  },

  async reviewClinicInstitution(idValue: string, approved: boolean, remark: string): Promise<ClinicInstitution> {
    const data = readData()
    const institution = data.clinicInstitutions.find((item) => item.id === idValue)
    if (!institution) throw new Error('诊疗机构备案不存在')
    institution.status = approved ? 'approved' : 'rejected'
    institution.reviewRemark = remark
    institution.reviewedAt = now()
    pushLog(data, 'regulator', '市级畜牧兽医监管员', approved ? '审核通过诊疗机构备案' : '驳回诊疗机构备案', institution.name)
    pushNode(data, '诊疗机构备案审核', '诊疗监管端', approved, '市级畜牧兽医监管员', institution.id, remark)
    writeData(data)
    return clone(institution)
  },

  async submitVeterinarian(input: VeterinarianInput): Promise<Veterinarian> {
    const data = readData()
    const institution = data.clinicInstitutions.find((item) => item.id === input.institutionId)
    if (!institution) throw new Error('所属诊疗机构不存在')
    const veterinarian: Veterinarian = { id: id('veterinarian'), ...input, status: 'pending', active: true, createdAt: now() }
    data.veterinarians.unshift(veterinarian)
    pushLog(data, 'clinic_admin', institution.name, '提交执业兽医备案', input.name)
    pushNode(data, '执业兽医备案', '动物诊疗管理', false, institution.name, veterinarian.id, `${input.name} 待审核`)
    writeData(data)
    return clone(veterinarian)
  },

  async reviewVeterinarian(idValue: string, approved: boolean, remark: string): Promise<Veterinarian> {
    const data = readData()
    const veterinarian = data.veterinarians.find((item) => item.id === idValue)
    if (!veterinarian) throw new Error('执业兽医备案不存在')
    veterinarian.status = approved ? 'approved' : 'rejected'
    veterinarian.reviewRemark = remark
    veterinarian.reviewedAt = now()
    pushLog(data, 'regulator', '市级畜牧兽医监管员', approved ? '审核通过执业兽医备案' : '驳回执业兽医备案', veterinarian.name)
    pushNode(data, '执业兽医备案审核', '诊疗监管端', approved, '市级畜牧兽医监管员', veterinarian.id, remark)
    writeData(data)
    return clone(veterinarian)
  },

  async createPetOwner(input: PetOwnerInput): Promise<PetOwner> {
    const data = readData()
    const owner: PetOwner = { id: id('owner'), ...input, active: true, createdAt: now() }
    data.petOwners.unshift(owner)
    pushLog(data, 'practicing_vet', '执业兽医', '建立宠物主人档案', input.name)
    writeData(data)
    return clone(owner)
  },

  async createPetProfile(input: PetProfileInput): Promise<PetProfile> {
    const data = readData()
    const owner = data.petOwners.find((item) => item.id === input.ownerId)
    if (!owner) throw new Error('宠物主人档案不存在')
    const pet: PetProfile = { id: id('pet'), ...input, active: true, createdAt: now() }
    data.petProfiles.unshift(pet)
    pushLog(data, 'practicing_vet', '执业兽医', '创建宠物档案', `${owner.name}-${input.name}`)
    pushNode(data, '宠物建档', '动物诊疗管理', true, '执业兽医', pet.id, `${input.species} ${input.name}`)
    writeData(data)
    return clone(pet)
  },

  async createImmunizationRecord(input: ImmunizationInput): Promise<ImmunizationLedger> {
    const data = readData()
    const pet = data.petProfiles.find((item) => item.id === input.petId)
    const veterinarian = data.veterinarians.find((item) => item.id === input.veterinarianId)
    const institution = data.clinicInstitutions.find((item) => item.id === input.institutionId)
    if (!pet || !veterinarian || !institution) throw new Error('免疫记录关联数据不完整')
    if (veterinarian.status !== 'approved' || !veterinarian.active) throw new Error('未备案通过的执业兽医不能登记免疫')
    if (institution.status !== 'approved') throw new Error('未备案通过的诊疗机构不能登记免疫')
    const record: ImmunizationLedger = { id: id('immunization'), ...input, status: 'active', createdAt: now() }
    data.immunizationLedgers.unshift(record)
    pushLog(data, 'practicing_vet', veterinarian.name, '登记宠物免疫台账', pet.name)
    pushNode(data, '宠物免疫台账', '动物诊疗管理', true, veterinarian.name, record.id, `${pet.name} 接种 ${input.vaccineName}`)
    writeData(data)
    return clone(record)
  },

  async stockInDrug(input: DrugStockInInput): Promise<DrugInventory> {
    const data = readData()
    const institution = data.clinicInstitutions.find((item) => item.id === input.institutionId)
    if (!institution) throw new Error('诊疗机构不存在')
    const inventory: DrugInventory = { id: id('drug'), ...input, active: true, createdAt: now() }
    const record: DrugInOutRecord = { id: id('drug-record'), type: 'in', drugId: inventory.id, drugName: inventory.drugName, institutionId: inventory.institutionId, quantity: input.quantity, operator: institution.name, createdAt: now() }
    data.drugInventories.unshift(inventory)
    data.drugInOutRecords.unshift(record)
    pushLog(data, 'clinic_admin', institution.name, '药品入库', `${input.drugName} ${input.quantity}`)
    writeData(data)
    return clone(inventory)
  },

  async issuePrescription(input: PrescriptionInput): Promise<Prescription> {
    const data = readData()
    const pet = data.petProfiles.find((item) => item.id === input.petId)
    const drug = data.drugInventories.find((item) => item.id === input.drugId)
    const veterinarian = data.veterinarians.find((item) => item.id === input.veterinarianId)
    if (!pet || !drug || !veterinarian) throw new Error('处方关联数据不完整')
    if (veterinarian.status !== 'approved' || !veterinarian.active) {
      pushLog(data, 'practicing_vet', veterinarian.name, '处方开具被阻断', '未备案通过')
      writeData(data)
      throw new Error('未备案通过的执业兽医不能开具处方')
    }
    if (drug.quantity < input.quantity) {
      pushLog(data, 'practicing_vet', veterinarian.name, '处方开具被阻断', '药品库存不足')
      writeData(data)
      throw new Error('药品库存不足，禁止开方')
    }
    drug.quantity -= input.quantity
    const prescription: Prescription = { id: id('prescription'), prescriptionNo: no('CF'), petId: pet.id, diagnosis: input.diagnosis, drugId: drug.id, drugName: drug.drugName, dosage: input.dosage, quantity: input.quantity, veterinarianId: veterinarian.id, institutionId: veterinarian.institutionId, status: 'active', issuedAt: now() }
    const outRecord: DrugInOutRecord = { id: id('drug-record'), type: 'out', drugId: drug.id, drugName: drug.drugName, institutionId: veterinarian.institutionId, quantity: input.quantity, relatedId: prescription.id, operator: veterinarian.name, createdAt: now() }
    data.prescriptions.unshift(prescription)
    data.drugInOutRecords.unshift(outRecord)
    pushLog(data, 'practicing_vet', veterinarian.name, '开具处方笺并自动出库', prescription.prescriptionNo)
    pushNode(data, '处方笺', '动物诊疗管理', true, veterinarian.name, prescription.id, `${pet.name} 使用 ${drug.drugName}`)
    writeData(data)
    return clone(prescription)
  },

  async createMedicalWaste(input: MedicalWasteInput): Promise<MedicalWasteRecord> {
    const data = readData()
    const sourceExists = input.sourceBusinessType === 'immunization'
      ? data.immunizationLedgers.some((item) => item.id === input.sourceBusinessId)
      : data.prescriptions.some((item) => item.id === input.sourceBusinessId)
    if (!sourceExists) throw new Error('废弃物来源业务不存在')
    const waste: MedicalWasteRecord = { id: id('waste'), wasteNo: no('ZLFW'), ...input, status: 'pending', createdAt: now() }
    data.medicalWasteRecords.unshift(waste)
    pushLog(data, 'clinic_admin', input.handoverPerson, '登记诊疗废弃物', waste.wasteNo)
    writeData(data)
    return clone(waste)
  },

  async completeMedicalWaste(input: CompleteMedicalWasteInput): Promise<MedicalWasteRecord> {
    const data = readData()
    const waste = data.medicalWasteRecords.find((item) => item.id === input.wasteId)
    if (!waste) throw new Error('诊疗废弃物记录不存在')
    waste.status = 'handled'
    waste.handledAt = input.handledAt
    waste.voucherNo = input.voucherNo
    pushLog(data, 'clinic_admin', waste.handoverPerson, '完成诊疗废弃物处理', waste.wasteNo)
    pushNode(data, '诊疗废弃物处理', '动物诊疗管理', true, waste.handoverPerson, waste.id, `${waste.type} ${waste.weight}kg`)
    writeData(data)
    return clone(waste)
  },

  async generateAnnualReport(institutionId: string, year: number): Promise<AnnualReport> {
    const data = readData()
    const institution = data.clinicInstitutions.find((item) => item.id === institutionId)
    if (!institution) throw new Error('诊疗机构不存在')
    if (institution.status !== 'approved') throw new Error('只有备案通过的诊疗机构才能生成年度报告')
    const institutionVetIds = data.veterinarians.filter((item) => item.institutionId === institutionId && item.status === 'approved').map((item) => item.id)
    const prescriptionIds = data.prescriptions.filter((item) => item.institutionId === institutionId && new Date(item.issuedAt).getFullYear() === year).map((item) => item.id)
    const report: AnnualReport = {
      id: id('annual'),
      institutionId,
      year,
      status: 'generated',
      veterinarianCount: institutionVetIds.length,
      petCount: data.petProfiles.length,
      immunizationCount: data.immunizationLedgers.filter((item) => item.institutionId === institutionId && new Date(item.immunizedAt).getFullYear() === year).length,
      prescriptionCount: prescriptionIds.length,
      drugStockInQuantity: data.drugInOutRecords.filter((item) => item.institutionId === institutionId && item.type === 'in' && new Date(item.createdAt).getFullYear() === year).reduce((sum, item) => sum + item.quantity, 0),
      drugStockOutQuantity: data.drugInOutRecords.filter((item) => item.institutionId === institutionId && item.type === 'out' && new Date(item.createdAt).getFullYear() === year).reduce((sum, item) => sum + item.quantity, 0),
      wasteHandledCount: data.medicalWasteRecords.filter((item) => item.status === 'handled' && item.handledAt && new Date(item.handledAt).getFullYear() === year).length,
      generatedAt: now(),
    }
    data.annualReports = data.annualReports.filter((item) => !(item.institutionId === institutionId && item.year === year))
    data.annualReports.unshift(report)
    pushLog(data, 'clinic_admin', institution.name, '生成年度报告', `${year}`)
    writeData(data)
    return clone(report)
  },

  async submitAnnualReport(idValue: string): Promise<AnnualReport> {
    const data = readData()
    const report = data.annualReports.find((item) => item.id === idValue)
    if (!report) throw new Error('年度报告不存在')
    const institution = data.clinicInstitutions.find((item) => item.id === report.institutionId)
    if (!institution || institution.status !== 'approved') throw new Error('只有备案通过的诊疗机构才能提交年度报告')
    report.status = 'submitted'
    report.submittedAt = now()
    pushLog(data, 'clinic_admin', institution.name, '提交年度报告', `${report.year}`)
    pushNode(data, '年度报告', '动物诊疗管理', true, institution.name, report.id, `${report.year} 年度报告已提交`)
    writeData(data)
    return clone(report)
  },

  async updatePetProfile(idValue: string, input: Partial<Pick<PetProfile, 'name' | 'species' | 'breed' | 'gender' | 'age' | 'identityNo'>>): Promise<PetProfile> {
    const data = readData()
    const pet = data.petProfiles.find((item) => item.id === idValue)
    if (!pet) throw new Error('宠物档案不存在')
    Object.assign(pet, input)
    pushLog(data, 'practicing_vet', '执业兽医', '编辑宠物档案', pet.name)
    writeData(data)
    return clone(pet)
  },

  async deletePetProfile(idValue: string): Promise<void> {
    const data = readData()
    const pet = data.petProfiles.find((item) => item.id === idValue)
    if (!pet) throw new Error('宠物档案不存在')
    const referenced = data.immunizationLedgers.some((item) => item.petId === idValue) || data.prescriptions.some((item) => item.petId === idValue)
    if (referenced) throw new Error('该宠物档案已被业务引用，不能删除')
    data.petProfiles = data.petProfiles.filter((item) => item.id !== idValue)
    pushLog(data, 'practicing_vet', '执业兽医', '删除宠物档案', pet.name)
    writeData(data)
  },

  async disablePetProfile(idValue: string): Promise<PetProfile> {
    const data = readData()
    const pet = data.petProfiles.find((item) => item.id === idValue)
    if (!pet) throw new Error('宠物档案不存在')
    pet.active = false
    pushLog(data, 'practicing_vet', '执业兽医', '停用宠物档案', pet.name)
    writeData(data)
    return clone(pet)
  },

  async updateClinicInstitution(idValue: string, input: Partial<ClinicInstitutionInput>): Promise<ClinicInstitution> {
    const data = readData()
    const institution = data.clinicInstitutions.find((item) => item.id === idValue)
    if (!institution) throw new Error('诊疗机构备案不存在')
    Object.assign(institution, input)
    pushLog(data, 'clinic_admin', institution.name, '编辑诊疗机构', institution.licenseNo)
    writeData(data)
    return clone(institution)
  },

  async disableClinicInstitution(idValue: string): Promise<ClinicInstitution> {
    const data = readData()
    const institution = data.clinicInstitutions.find((item) => item.id === idValue)
    if (!institution) throw new Error('诊疗机构备案不存在')
    institution.active = false
    pushLog(data, 'clinic_admin', institution.name, '停用诊疗机构', institution.licenseNo)
    writeData(data)
    return clone(institution)
  },

  async updateVeterinarian(idValue: string, input: Partial<VeterinarianInput>): Promise<Veterinarian> {
    const data = readData()
    const veterinarian = data.veterinarians.find((item) => item.id === idValue)
    if (!veterinarian) throw new Error('执业兽医备案不存在')
    Object.assign(veterinarian, input)
    pushLog(data, 'clinic_admin', veterinarian.name, '编辑执业兽医备案', veterinarian.certificateNo)
    writeData(data)
    return clone(veterinarian)
  },

  async disableVeterinarian(idValue: string): Promise<Veterinarian> {
    const data = readData()
    const veterinarian = data.veterinarians.find((item) => item.id === idValue)
    if (!veterinarian) throw new Error('执业兽医备案不存在')
    veterinarian.active = false
    pushLog(data, 'clinic_admin', veterinarian.name, '停用执业兽医', veterinarian.certificateNo)
    writeData(data)
    return clone(veterinarian)
  },

  async voidPrescription(idValue: string, reason: string): Promise<Prescription> {
    const data = readData()
    const prescription = data.prescriptions.find((item) => item.id === idValue)
    if (!prescription) throw new Error('处方笺不存在')
    if (prescription.status === 'voided') return clone(prescription)
    const drug = data.drugInventories.find((item) => item.id === prescription.drugId)
    if (drug) drug.quantity += prescription.quantity
    prescription.status = 'voided'
    prescription.voidReason = reason
    data.drugInOutRecords.unshift({ id: id('drug-record'), type: 'reversal', drugId: prescription.drugId, drugName: prescription.drugName, institutionId: prescription.institutionId, quantity: prescription.quantity, relatedId: prescription.id, operator: '执业兽医', createdAt: now() })
    pushLog(data, 'practicing_vet', '执业兽医', '作废处方笺', prescription.prescriptionNo)
    writeData(data)
    return clone(prescription)
  },

  async withdrawAnnualReport(idValue: string, reason: string): Promise<AnnualReport> {
    const data = readData()
    const report = data.annualReports.find((item) => item.id === idValue)
    if (!report) throw new Error('年度报告不存在')
    report.status = 'withdrawn'
    report.withdrawnAt = now()
    report.withdrawReason = reason
    pushLog(data, 'clinic_admin', '诊疗机构管理员', '撤回年度报告', `${report.year}`)
    writeData(data)
    return clone(report)
  },

  async updatePetOwner(idValue: string, input: Partial<PetOwnerInput>): Promise<PetOwner> {
    const data = readData()
    const owner = data.petOwners.find((item) => item.id === idValue)
    if (!owner) throw new Error('宠物主人档案不存在')
    Object.assign(owner, input)
    pushLog(data, 'practicing_vet', '执业兽医', '编辑宠物主人档案', owner.name)
    writeData(data)
    return clone(owner)
  },

  async deletePetOwner(idValue: string): Promise<void> {
    const data = readData()
    const owner = data.petOwners.find((item) => item.id === idValue)
    if (!owner) throw new Error('宠物主人档案不存在')
    const referenced = data.petProfiles.some((item) => item.ownerId === idValue)
    if (referenced) throw new Error('该宠物主人已关联宠物档案，不能删除')
    data.petOwners = data.petOwners.filter((item) => item.id !== idValue)
    pushLog(data, 'practicing_vet', '执业兽医', '删除宠物主人档案', owner.name)
    writeData(data)
  },

  async updateDrugInventory(idValue: string, input: Partial<Omit<DrugStockInInput, 'quantity'>>): Promise<DrugInventory> {
    const data = readData()
    const drug = data.drugInventories.find((item) => item.id === idValue)
    if (!drug) throw new Error('药品库存不存在')
    Object.assign(drug, input)
    pushLog(data, 'clinic_admin', '诊疗机构管理员', '编辑药品基础信息', drug.drugName)
    writeData(data)
    return clone(drug)
  },

  async disableDrugInventory(idValue: string): Promise<DrugInventory> {
    const data = readData()
    const drug = data.drugInventories.find((item) => item.id === idValue)
    if (!drug) throw new Error('药品库存不存在')
    drug.active = false
    pushLog(data, 'clinic_admin', '诊疗机构管理员', '停用药品', drug.drugName)
    writeData(data)
    return clone(drug)
  },

  async voidImmunizationRecord(idValue: string, reason: string): Promise<ImmunizationLedger> {
    const data = readData()
    const record = data.immunizationLedgers.find((item) => item.id === idValue)
    if (!record) throw new Error('免疫记录不存在')
    record.status = 'voided'
    pushLog(data, 'practicing_vet', '执业兽医', '作废免疫记录', reason)
    writeData(data)
    return clone(record)
  },

  async updateMedicalWaste(idValue: string, input: Partial<MedicalWasteInput>): Promise<MedicalWasteRecord> {
    const data = readData()
    const waste = data.medicalWasteRecords.find((item) => item.id === idValue)
    if (!waste) throw new Error('诊疗废弃物记录不存在')
    if (waste.status === 'handled') throw new Error('已处理废弃物记录不能编辑')
    Object.assign(waste, input)
    pushLog(data, 'clinic_admin', waste.handoverPerson, '编辑诊疗废弃物记录', waste.wasteNo)
    writeData(data)
    return clone(waste)
  },

  async voidMedicalWaste(idValue: string, reason: string): Promise<MedicalWasteRecord> {
    const data = readData()
    const waste = data.medicalWasteRecords.find((item) => item.id === idValue)
    if (!waste) throw new Error('诊疗废弃物记录不存在')
    if (waste.status === 'handled') throw new Error('已处理废弃物记录不能作废')
    waste.status = 'voided'
    pushLog(data, 'clinic_admin', waste.handoverPerson, '作废诊疗废弃物记录', `${waste.wasteNo}：${reason}`)
    writeData(data)
    return clone(waste)
  },

  async releaseCarrierRestriction(idValue: string, disposalRemark: string) {
    const data = readData()
    const restriction = data.carrierRestrictions.find((item) => item.id === idValue)
    if (!restriction) throw new Error('承运限制记录不存在')
    restriction.status = 'released'
    restriction.releasedAt = now()
    restriction.disposalRecords.unshift(`${now()} ${disposalRemark}`)
    pushLog(data, 'regulator', '市级畜牧兽医监管员', '解除承运限制', restriction.plateNo)
    writeData(data)
    return clone(restriction)
  },

  async retrySyncLog(idValue: string) {
    const data = readData()
    const log = data.syncLogs.find((item) => item.id === idValue)
    if (!log) throw new Error('同步日志不存在')
    log.status = 'success'
    log.retryCount += 1
    log.syncedAt = now()
    delete log.failureReason
    writeData(data)
    return clone(log)
  },

  async restoreInitialData(): Promise<AppData> {
    const seed = createSeedData()
    writeData(seed)
    return clone(seed)
  },

  async getOriginCertificate(query: string) {
    const data = readData()
    const { certificate, task, vehicle, application, batch } = findCertificateData(data, query)
    return clone({ certificate, task, vehicle, application, batch })
  },

  async performSlaughterEntryCheck(input: { query: string; actualQuantity: number; channel: string; recognizedPlateNo?: string; earTagMatched?: boolean; originRegionMatched?: boolean }): Promise<SlaughterEntryRecord> {
    const data = readData()
    const { certificate, task, vehicle, application, batch } = findCertificateData(data, input.query)
    if (!certificate || !task || !vehicle || !application) throw new Error('未找到检疫证明或关联数据')

    const certValid = new Date(certificate.validTo).getTime() >= Date.now()
    const animalTypeMatched = certificate.animalType === (batch?.animalType ?? certificate.animalType)
    const quantityMatched = certificate.quantity === input.actualQuantity
    const earTagMatched = input.earTagMatched ?? true
    const plateMatched = (input.recognizedPlateNo ?? vehicle.plateNo) === certificate.vehiclePlateNo
    const carrierMatched = !certificate.carrier || certificate.carrier === vehicle.carrier
    const destinationMatched = certificate.destination.includes('屠宰')
    const routeNormal = !task.hasDeviation
    const channelMatched = vehicle.channel === input.channel
    const landingDone = data.landingReports.some((r) => r.certificateId === certificate.id && r.status === 'submitted')

    const checks: ValidationResult[] = [
      { label: '动物检疫合格证明有效', passed: certValid, message: certValid ? `${certificate.certificateNo} 有效` : '检疫证明已过期或无效' },
      { label: '动物种类一致', passed: animalTypeMatched, message: animalTypeMatched ? '动物种类与证明一致' : '动物种类与证明不一致' },
      { label: '入场数量与动物证一致', passed: quantityMatched, message: quantityMatched ? '入场数量与证明一致' : '入场数量与证明不一致' },
      { label: '耳标号段与动物证一致', passed: earTagMatched, message: earTagMatched ? '耳标号段与证明一致' : '耳标号段与证明不一致' },
      { label: '车辆一致', passed: plateMatched, message: plateMatched ? `车辆 ${certificate.vehiclePlateNo} 一致` : '车辆与证明不一致' },
      { label: '承运人一致', passed: carrierMatched, message: carrierMatched ? '承运人与证明一致' : '承运人与证明不一致' },
      { label: '目的地为当前屠宰场', passed: destinationMatched, message: destinationMatched ? '目的地为当前屠宰场' : '目的地与当前屠宰场不一致' },
      { label: '运输轨迹正常', passed: routeNormal, message: routeNormal ? '运输轨迹正常' : '运输轨迹存在偏离' },
      { label: '指定通道运输', passed: channelMatched, message: channelMatched ? '指定通道运输' : '未按指定通道运输' },
      { label: '完成落地报告', passed: landingDone, message: landingDone ? '已完成落地报告' : '未完成落地报告' },
    ]

    const allPassed = checks.every((c) => c.passed)
    const entryStatus = allPassed ? 'entry_passed' : 'entry_rejected'

    const record: SlaughterEntryRecord = {
      id: id('entry'),
      entryNo: no('TCRQ'),
      quarantineCertificateId: certificate.id,
      transportTaskId: task.id,
      applicationId: application.id,
      slaughterhouseName: '皖北标准化屠宰中心',
      animalType: certificate.animalType,
      quantity: input.actualQuantity,
      earTagRange: batch ? `${batch.earTagPrefix}${batch.earTagStart}-${batch.earTagEnd}` : '',
      vehiclePlateNo: vehicle.plateNo,
      carrier: vehicle.carrier,
      originFarm: batch?.farmName ?? '',
      originLocation: batch?.location ?? certificate.origin,
      checkResults: checks,
      status: entryStatus,
      checkedBy: '皖北标准化屠宰中心',
      checkedAt: now(),
      createdAt: now(),
    }

    data.slaughterEntryRecords.unshift(record)

    if (allPassed) {
      task.status = transitionStatus(task.status, 'arrived')
      task.arrivedAt = now()
    }

    checks.filter((c) => !c.passed).forEach((c) => pushAlert(data, 'danger', c.label, c.message, record.id))
    pushLog(data, 'slaughter', '皖北标准化屠宰中心', allPassed ? '屠宰入场查验通过' : '屠宰入场查验驳回', certificate.certificateNo)
    pushSync(data, certificate.certificateNo, '屠宰入场', '畜禽屠宰行业管理系统')
    pushNode(data, '屠宰入场查验', '屠宰企业端', allPassed, '皖北标准化屠宰中心', record.id, allPassed ? '入场查验通过' : '入场查验驳回')
    writeData(data)
    return clone(record)
  },

  async confirmSlaughterEntry(idValue: string, input: SlaughterEntryConfirmInput): Promise<SlaughterEntryRecord> {
    const data = readData()
    const entry = data.slaughterEntryRecords.find((item) => item.id === idValue)
    if (!entry) throw new Error('入场查验记录不存在')
    if (entry.status !== 'pending_check' && entry.status !== 'checking') throw new Error('该记录不在待查验状态')

    validateEntryConfirmInput(data, entry, input)

    const certificate = data.quarantineCertificates.find((item) => item.id === entry.quarantineCertificateId)
    const task = data.transportTasks.find((item) => item.id === entry.transportTaskId)
    if (!certificate) throw new Error('动物检疫合格证明不存在')

    entry.actualQuantity = input.actualQuantity
    entry.waitingPenNo = input.waitingPenNo
    entry.actualVehiclePlateNo = input.actualVehiclePlateNo
    entry.vehicleArrived = input.vehicleArrived
    entry.quantityMatched = input.quantityMatched
    entry.earTagMatched = input.earTagMatched
    entry.clinicalNormal = input.clinicalNormal
    entry.deathCount = input.deathCount
    entry.abnormalCount = input.abnormalCount
    entry.loadingNormal = input.loadingNormal
    entry.sceneRemark = input.sceneRemark
    entry.operator = input.operator
    entry.phone = input.phone
    entry.entryTime = input.entryTime
    entry.opinion = input.opinion
    entry.status = 'entry_passed'
    entry.checkedBy = input.operator
    entry.checkedAt = input.entryTime
    entry.checkResults = [
      { label: '车辆已到场', passed: input.vehicleArrived, message: input.vehicleArrived ? '车辆已到场' : '车辆未到场' },
      { label: '实到数量一致', passed: input.quantityMatched, message: input.quantityMatched ? '实到数量与动物证一致' : '实到数量与动物证不一致' },
      { label: '耳标抽查一致', passed: input.earTagMatched, message: input.earTagMatched ? '抽查耳标与动物证号段一致' : '抽查耳标异常' },
      { label: '动物临床状态正常', passed: input.clinicalNormal, message: input.clinicalNormal ? '动物临床状态正常' : '存在临床异常' },
      { label: '无途中死亡', passed: input.deathCount === 0, message: input.deathCount === 0 ? '无途中死亡' : `途中死亡 ${input.deathCount} 头` },
      { label: '无异常动物', passed: input.abnormalCount === 0, message: input.abnormalCount === 0 ? '无异常动物' : `异常动物 ${input.abnormalCount} 头` },
      { label: '装载情况正常', passed: input.loadingNormal, message: input.loadingNormal ? '装载情况正常' : '装载情况异常' },
    ]

    certificate.entryUsageStatus = 'used'
    if (task) {
      task.status = transitionStatus(task.status, 'arrived')
      task.arrivedAt = input.entryTime
    }

    const existingBatch = data.slaughterBatches.find((item) => item.entryRecordId === entry.id)
    if (!existingBatch) {
      data.slaughterBatches.unshift({
        id: id('batch'),
        batchNo: no('TZPC'),
        entryRecordId: entry.id,
        quarantineCertificateId: certificate.id,
        animalType: entry.animalType,
        entryQuantity: input.actualQuantity,
        waitingQuantity: input.actualQuantity,
        slaughterQuantity: 0,
        qualifiedCarcassQuantity: 0,
        unqualifiedQuantity: 0,
        earTagRange: entry.earTagRange,
        waitingPenNo: input.waitingPenNo,
        status: 'pending_slaughter_apply',
        createdAt: now(),
      })
    }

    const existingLegacyBatch = data.waitingSlaughterBatches.find((item) => item.entryCheckId === entry.id)
    if (!existingLegacyBatch) {
      data.waitingSlaughterBatches.unshift({
        id: id('waiting'),
        entryCheckId: entry.id,
        certificateId: certificate.id,
        quantity: input.actualQuantity,
        animalType: entry.animalType,
        status: 'waiting_slaughter',
        createdAt: now(),
        batchNo: no('DZPC'),
        entryRecordId: entry.id,
        earTagRange: entry.earTagRange,
        waitingPenNo: input.waitingPenNo,
        slaughterQuantity: 0,
        qualifiedCarcassQuantity: 0,
        unqualifiedQuantity: 0,
      })
    }

    appendEntryAttachments(data, entry, input.attachments)
    pushLog(data, 'slaughter', input.operator, '确认入场并生成待宰批次', entry.entryNo)
    pushSync(data, certificate.certificateNo, '屠宰入场', '畜禽屠宰行业管理系统')
    pushNode(data, '入场查验', '屠宰企业端', true, input.operator, entry.id, `确认入场 ${input.actualQuantity} 头`)
    writeData(data)
    return clone(entry)
  },

  async registerSlaughterEntryException(idValue: string, input: SlaughterEntryExceptionInput): Promise<SlaughterEntryRecord> {
    const data = readData()
    const entry = data.slaughterEntryRecords.find((item) => item.id === idValue)
    if (!entry) throw new Error('入场查验记录不存在')
    validateEntryExceptionInput(input)
    entry.actualQuantity = input.actualQuantity
    entry.waitingPenNo = input.waitingPenNo
    entry.actualVehiclePlateNo = input.actualVehiclePlateNo
    entry.vehicleArrived = input.vehicleArrived
    entry.quantityMatched = input.quantityMatched
    entry.earTagMatched = input.earTagMatched
    entry.clinicalNormal = input.clinicalNormal
    entry.deathCount = input.deathCount
    entry.abnormalCount = input.abnormalCount
    entry.loadingNormal = input.loadingNormal
    entry.sceneRemark = input.sceneRemark
    entry.abnormalReason = input.abnormalReason
    entry.operator = input.operator
    entry.phone = input.phone
    entry.entryTime = input.entryTime
    entry.opinion = input.opinion
    entry.status = 'entry_rejected'
    entry.checkedBy = input.operator
    entry.checkedAt = input.entryTime
    appendEntryAttachments(data, entry, input.attachments)
    pushAlert(data, 'danger', '入场查验异常', input.abnormalReason, entry.id)
    pushLog(data, 'slaughter', input.operator, '登记入场异常', entry.entryNo)
    pushNode(data, '入场查验', '屠宰企业端', false, input.operator, entry.id, input.abnormalReason)
    writeData(data)
    return clone(entry)
  },

  async returnSlaughterEntry(idValue: string, input: SlaughterEntryReturnInput): Promise<SlaughterEntryRecord> {
    const data = readData()
    const entry = data.slaughterEntryRecords.find((item) => item.id === idValue)
    if (!entry) throw new Error('入场查验记录不存在')
    validateEntryReturnInput(input)
    entry.returnReason = input.reason
    entry.operator = input.operator
    entry.phone = input.phone
    entry.entryTime = input.entryTime
    entry.opinion = input.opinion
    entry.status = 'entry_rejected'
    entry.checkedBy = input.operator
    entry.checkedAt = input.entryTime
    pushAlert(data, 'warning', '入场退回', input.reason, entry.id)
    pushLog(data, 'slaughter', input.operator, '入场退回', entry.entryNo)
    pushNode(data, '入场查验', '屠宰企业端', false, input.operator, entry.id, input.reason)
    writeData(data)
    return clone(entry)
  },

  async submitSelfInspection(input: SlaughterSelfInspectionInput): Promise<SlaughterSelfInspection> {
    const data = readData()
    const batch = data.slaughterBatches.find((b) => b.id === input.batchId)
    if (!batch) throw new Error('屠宰批次不存在')

    const asfPositive = input.africanSwineFeverResult === 'positive'
    const drugPositive = input.bannedDrugResult === 'positive'
    const passed = !asfPositive && !drugPositive

    const inspection: SlaughterSelfInspection = {
      id: id('self'),
      batchId: input.batchId,
      africanSwineFeverResult: input.africanSwineFeverResult,
      africanSwineFeverTestPerson: input.africanSwineFeverTestPerson,
      africanSwineFeverTestTime: input.africanSwineFeverTestTime,
      bannedDrugResult: input.bannedDrugResult,
      bannedDrugTestPerson: input.bannedDrugTestPerson,
      bannedDrugTestTime: input.bannedDrugTestTime,
      status: passed ? 'passed' : 'failed',
      createdAt: now(),
    }

    data.slaughterSelfInspections.unshift(inspection)

    if (!passed) {
      batch.status = 'abnormal'
      const reason = asfPositive ? '非洲猪瘟检测阳性' : '违禁药物检测阳性'
      batch.abnormalReason = reason
      pushAlert(data, 'danger', '企业自检异常', `${batch.batchNo}：${reason}`, batch.id)
      pushLog(data, 'slaughter', '皖北标准化屠宰中心', `企业自检未通过：${reason}`, batch.batchNo)
    } else {
      batch.status = 'pending_slaughter_apply'
      pushLog(data, 'slaughter', '皖北标准化屠宰中心', '企业自检通过', batch.batchNo)
    }

    writeData(data)
    return clone(inspection)
  },

  async submitSlaughterQuarantineApplication(input: SlaughterQuarantineApplicationInput): Promise<SlaughterQuarantineApplication> {
    const data = readData()
    const batch = data.slaughterBatches.find((b) => b.id === input.batchId)
    if (!batch) throw new Error('屠宰批次不存在')
    if (batch.status !== 'pending_slaughter_apply') throw new Error('批次不在待申报屠宰检疫状态')

    const entryRecord = data.slaughterEntryRecords.find((r) => r.id === input.entryRecordId)
    if (!entryRecord) throw new Error('入场记录不存在')

    // 检查是否重复申报
    const existingApp = data.slaughterApplications.find((a) => a.batchId === input.batchId && a.status !== 'returned')
    if (existingApp) throw new Error('该批次已存在未退回的申报，不可重复提交')

    const application: SlaughterQuarantineApplication = {
      id: id('slaughter'),
      entryCheckId: input.entryRecordId,
      applicationNo: no('TZJY'),
      quantity: input.quantity,
      africanSwineFeverResult: 'negative',
      bannedDrugResult: 'negative',
      status: 'submitted_pending_accept',
      batchId: input.batchId,
      entryRecordId: input.entryRecordId,
      quarantineCertificateId: input.quarantineCertificateId,
      animalType: batch.animalType,
      purpose: input.purpose,
      plannedSlaughterTime: input.plannedSlaughterTime,
      contactPerson: input.contactPerson,
      contactPhone: input.contactPhone,
      remark: input.remark,
      submittedBy: '皖北标准化屠宰中心',
      submittedAt: now(),
      createdAt: now(),
    }

    batch.status = 'submitted_pending_accept'
    batch.slaughterApplicationId = application.id
    data.slaughterApplications.unshift(application)
    pushLog(data, 'slaughter', '皖北标准化屠宰中心', '提交屠宰检疫申报', application.applicationNo)
    pushNode(data, '屠宰检疫申报', '屠宰企业端', true, '皖北标准化屠宰中心', application.id, `申报 ${input.quantity} 头${batch.animalType}屠宰检疫`)
    writeData(data)
    return clone(application)
  },

  async acceptSlaughterApplication(applicationId: string): Promise<SlaughterQuarantineApplication> {
    const data = readData()
    const application = data.slaughterApplications.find((a) => a.id === applicationId)
    if (!application) throw new Error('屠宰检疫申报不存在')

    application.status = 'accepted_pending_pre_check'
    application.updatedAt = now()

    const batch = data.slaughterBatches.find((b) => b.id === application.batchId)
    if (batch) batch.status = 'accepted_pending_ante_mortem'

    pushLog(data, 'vet', '官方兽医 王敏', '受理屠宰检疫申报', application.applicationNo)
    writeData(data)
    return clone(application)
  },

  async submitPreSlaughterCheck(applicationId: string, input: { checks: Record<string, boolean>; remark: string }): Promise<SlaughterAnteMortemCheck> {
    const data = readData()
    const application = data.slaughterApplications.find((a) => a.id === applicationId)
    if (!application) throw new Error('屠宰检疫申报不存在')

    const batch = data.slaughterBatches.find((b) => b.id === application.batchId)
    if (!batch) throw new Error('屠宰批次不存在')

    const allPassed = Object.values(input.checks).every((v) => v)

    const check: SlaughterAnteMortemCheck = {
      id: id('ante'),
      waitingBatchId: batch.id,
      checkedBy: '官方兽医 王敏',
      passed: allPassed,
      status: 'completed',
      remark: input.remark,
      checkedAt: now(),
    }

    data.anteMortemChecks.unshift(check)

    if (allPassed) {
      batch.status = 'ante_mortem_passed'
      application.status = 'post_product_generated'
    } else {
      batch.status = 'ante_mortem_failed'
      pushAlert(data, 'danger', '宰前检查', `${batch.batchNo} 宰前检查未通过`, batch.id)
    }

    pushLog(data, 'vet', '官方兽医 王敏', allPassed ? '宰前检查通过' : '宰前检查未通过', batch.batchNo)
    pushNode(data, '宰前检查', '官方兽医端', allPassed, '官方兽医 王敏', check.id, allPassed ? '宰前检查通过' : '宰前检查未通过')
    writeData(data)
    return clone(check)
  },

  async submitPostSlaughterCheck(applicationId: string, input: { qualifiedQuantity: number; unqualifiedQuantity: number; productWeight: number; checks: Record<string, boolean>; remark: string }): Promise<SlaughterPostMortemCheck> {
    const data = readData()
    const application = data.slaughterApplications.find((a) => a.id === applicationId)
    if (!application) throw new Error('屠宰检疫申报不存在')

    const batch = data.slaughterBatches.find((b) => b.id === application.batchId)
    if (!batch) throw new Error('屠宰批次不存在')

    const allPassed = Object.values(input.checks).every((v) => v)

    const check: SlaughterPostMortemCheck = {
      id: id('post'),
      waitingBatchId: batch.id,
      checkedBy: '官方兽医 王敏',
      qualifiedQuantity: input.qualifiedQuantity,
      unqualifiedQuantity: input.unqualifiedQuantity,
      productWeight: input.productWeight,
      status: 'completed',
      remark: input.remark,
      checkedAt: now(),
    }

    data.postMortemChecks.unshift(check)

    batch.qualifiedCarcassQuantity = input.qualifiedQuantity
    batch.unqualifiedQuantity = input.unqualifiedQuantity
    batch.slaughterQuantity = input.qualifiedQuantity + input.unqualifiedQuantity

    if (allPassed) {
      batch.status = 'post_mortem_passed'
      application.status = 'product_cert_pending'
    } else {
      batch.status = 'post_mortem_failed'
      pushAlert(data, 'danger', '宰后检疫', `${batch.batchNo} 宰后检疫未通过`, batch.id)
      data.harmlessTasks.unshift({ id: id('harmless'), taskNo: no('WHH'), source: 'slaughter_unqualified', sourceId: check.id, quantity: input.unqualifiedQuantity, weight: input.unqualifiedQuantity * 80, reason: '宰后检疫不合格', status: 'pending', createdAt: now() })
    }

    pushLog(data, 'vet', '官方兽医 王敏', allPassed ? '宰后检疫通过' : '宰后检疫未通过', batch.batchNo)
    pushNode(data, '宰后检疫', '官方兽医端', allPassed, '官方兽医 王敏', check.id, `合格 ${input.qualifiedQuantity}，不合格 ${input.unqualifiedQuantity}`)
    writeData(data)
    return clone(check)
  },

  async createMeatQualityCertificateExtended(input: MeatQualityCertificateInputExtended): Promise<MeatQualityCertificate> {
    const data = readData()
    const batch = data.slaughterBatches.find((b) => b.id === input.batchId)
    if (!batch) throw new Error('屠宰批次不存在')

    const certificate: MeatQualityCertificate = {
      id: id('meat'),
      certificateNo: no('RZ'),
      waitingBatchId: batch.id,
      productName: input.productName,
      weight: input.weight,
      inspector: input.inspector,
      issuedAt: now(),
      batchId: input.batchId,
      quarantineCertificateId: input.quarantineCertificateId,
      productBatchNo: input.productBatchNo,
      conclusion: input.conclusion,
      qualifiedQuantity: input.qualifiedQuantity,
      unqualifiedQuantity: input.unqualifiedQuantity,
    }

    if (batch.status !== 'meat_quality_certificate_issued') {
      batch.status = 'meat_quality_certificate_issued'
    }

    data.meatQualityCertificates.unshift(certificate)
    pushLog(data, 'slaughter', input.inspector, '生成肉品品质检验合格证', certificate.certificateNo)
    pushNode(data, '肉品品质检验合格证', '屠宰企业端', true, input.inspector, certificate.id, certificate.certificateNo)
    writeData(data)
    return clone(certificate)
  },

  async issueProductQuarantineCertificate(applicationId: string, input: { productName: string; productBatchNo: string; weight: number; markType: MarkType; useObject: string }): Promise<ProductCertificate> {
    const data = readData()
    const application = data.slaughterApplications.find((a) => a.id === applicationId)
    if (!application) throw new Error('屠宰检疫申报不存在')

    const batch = data.slaughterBatches.find((b) => b.id === application.batchId)
    if (!batch) throw new Error('屠宰批次不存在')

    const meatCert = data.meatQualityCertificates.find((c) => c.batchId === batch.id)
    if (!meatCert) throw new Error('未找到该批次的肉品品质检验合格证')

    const availableMarks = data.quarantineMarks.filter((m) => m.markType === input.markType && m.status === 'in_stock')
    if (availableMarks.length < 1) throw new Error('检疫标志库存不足，请先申领检疫标志')

    const productCert: ProductCertificate = {
      id: id('product'),
      certificateNo: no('CP'),
      batchId: batch.id,
      quarantineCertificateId: application.quarantineCertificateId,
      meatQualityCertificateId: meatCert.id,
      productName: input.productName,
      productBatchNo: input.productBatchNo,
      weight: input.weight,
      issuedBy: '官方兽医 王敏',
      issuedAt: now(),
      markRangeStart: availableMarks[0].markNo,
      markRangeEnd: availableMarks[Math.min(availableMarks.length - 1, 0)].markNo,
    }

    // Allocate marks
    const markToUse = availableMarks[0]
    markToUse.status = 'used'
    markToUse.usedAt = now()
    markToUse.productCertificateId = productCert.id
    markToUse.quarantineCertificateId = application.quarantineCertificateId
    markToUse.meatQualityCertificateId = meatCert.id
    markToUse.slaughterBatchId = batch.id
    markToUse.productBatchNo = input.productBatchNo
    productCert.markRangeStart = markToUse.markNo
    productCert.markRangeEnd = markToUse.markNo

    // Update mark inventory
    const inventory = data.quarantineMarkInventories.find((i) => i.markType === input.markType)
    if (inventory) {
      inventory.available -= 1
      inventory.used += 1
    }

    batch.status = 'product_cert_issued'
    application.status = 'product_cert_issued'

    // Create three certificate link
    const link: ThreeCertificateLink = {
      id: id('link'),
      linkNo: no('LNK'),
      waitingBatchId: batch.id,
      animalCertificateId: application.quarantineCertificateId ?? '',
      productCertificateId: productCert.id,
      meatQualityCertificateId: meatCert.id,
      linkedAt: now(),
    }
    data.threeCertificateLinks.unshift(link)

    // Create traceability record
    const traceability: TraceabilityRecord = {
      id: id('trace'),
      markNo: markToUse.markNo,
      quarantineCertificateId: application.quarantineCertificateId ?? '',
      productCertificateId: productCert.id,
      meatQualityCertificateId: meatCert.id,
      slaughterBatchId: batch.id,
      productBatchNo: input.productBatchNo,
      queriedAt: now(),
    }
    data.traceabilityRecords.unshift(traceability)

    data.productCertificates.unshift(productCert)
    pushLog(data, 'vet', '官方兽医 王敏', '出具动物产品检疫证明', productCert.certificateNo)
    pushSync(data, productCert.certificateNo, '产品检疫出证')
    pushNode(data, '产品检疫证明', '官方兽医端', true, '官方兽医 王敏', productCert.id, productCert.certificateNo)
    writeData(data)
    return clone(productCert)
  },

  async applyQuarantineMarks(input: QuarantineMarkApplicationInput): Promise<QuarantineMarkApplication> {
    const data = readData()
    const application: QuarantineMarkApplication = {
      id: id('mark-app'),
      applicationNo: no('BZSL'),
      orgId: 'org-slaughter-001',
      orgName: '皖北标准化屠宰中心',
      applicationType: 'apply',
      markType: input.markType,
      quantity: input.quantity,
      reason: input.reason,
      status: 'pending_review',
      appliedBy: input.appliedBy,
      createdAt: now(),
    }
    data.quarantineMarkApplications.unshift(application)
    pushLog(data, 'slaughter', input.appliedBy, '提交检疫验讫标志申领', application.applicationNo)
    writeData(data)
    return clone(application)
  },

  async applyQuarantineMarkReturn(input: QuarantineMarkReturnApplicationInput): Promise<QuarantineMarkApplication> {
    const data = readData()
    const availableReturnMarks = data.quarantineMarks.filter((item) => item.markType === input.markType && (item.status === 'in_stock' || item.status === 'issued'))
    if (availableReturnMarks.length < input.quantity) throw new Error(`可退回标志不足，需要 ${input.quantity} 枚，可退回 ${availableReturnMarks.length} 枚`)
    const application: QuarantineMarkApplication = {
      id: id('mark-ret-app'),
      applicationNo: no('BZTH'),
      orgId: 'org-slaughter-001',
      orgName: '皖北标准化屠宰中心',
      applicationType: 'return',
      markType: input.markType,
      quantity: input.quantity,
      reason: input.reason,
      status: 'return_pending_review',
      appliedBy: input.appliedBy,
      createdAt: now(),
    }
    data.quarantineMarkApplications.unshift(application)
    pushLog(data, 'slaughter', input.appliedBy, '提交检疫验讫标志退回申请', application.applicationNo)
    writeData(data)
    return clone(application)
  },

  async approveQuarantineMarkApplication(applicationId: string): Promise<QuarantineMarkApplication> {
    const data = readData()
    const application = data.quarantineMarkApplications.find((a) => a.id === applicationId)
    if (!application) throw new Error('检疫验讫标志单据不存在')

    const date = new Date()
    const pad = (v: number) => String(v).padStart(2, '0')
    const dateStr = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
    const prefix = application.markType === 'card_ring' ? 'KH' : 'BQ'

    if ((application.applicationType || 'apply') === 'return') {
      application.status = 'return_approved'
      application.approvedBy = '市级畜牧兽医监管员'
      application.approvedAt = now()
      const returnOrder = {
        id: id('mark-return'),
        returnNo: no('BZRK'),
        applicationId: application.id,
        orgId: application.orgId,
        orgName: application.orgName,
        markType: application.markType,
        quantity: application.quantity,
        reason: application.reason,
        status: 'pending_return' as const,
        createdAt: now(),
      }
      data.quarantineMarkReturnOrders.unshift(returnOrder)
      application.relatedReturnOrderId = returnOrder.id
      pushLog(data, 'regulator', '市级畜牧兽医监管员', '审核通过检疫验讫标志退回申请并生成待退回单', application.applicationNo)
      writeData(data)
      return clone(application)
    }

    application.status = 'approved'
    application.approvedBy = '市级畜牧兽医监管员'
    application.approvedAt = now()

    const samePrefixMarks = data.quarantineMarks
      .map((item) => item.markNo)
      .filter((markNo) => markNo.startsWith(`${prefix}${dateStr}`))
      .map((markNo) => Number(markNo.slice(-4)))
      .filter((num) => Number.isFinite(num))
    const startSeq = samePrefixMarks.length ? Math.max(...samePrefixMarks) + 1 : 1
    const endSeq = startSeq + application.quantity - 1
    application.issuedRangeStart = `${prefix}${dateStr}${String(startSeq).padStart(4, '0')}`
    application.issuedRangeEnd = `${prefix}${dateStr}${String(endSeq).padStart(4, '0')}`

    const issueOrder = {
      id: id('mark-issue'),
      issueNo: no('BZFF'),
      applicationId: application.id,
      orgId: application.orgId,
      orgName: application.orgName,
      markType: application.markType,
      quantity: application.quantity,
      rangeStart: application.issuedRangeStart,
      rangeEnd: application.issuedRangeEnd,
      status: 'pending_issue' as const,
      createdAt: now(),
    }
    data.quarantineMarkIssueOrders.unshift(issueOrder)
    application.relatedIssueOrderId = issueOrder.id

    pushLog(data, 'regulator', '市级畜牧兽医监管员', '审核通过检疫验讫标志申领并生成待发放单', application.applicationNo)
    writeData(data)
    return clone(application)
  },

  async rejectQuarantineMarkApplication(applicationId: string, reason: string): Promise<QuarantineMarkApplication> {
    const data = readData()
    const application = data.quarantineMarkApplications.find((a) => a.id === applicationId)
    if (!application) throw new Error('检疫验讫标志单据不存在')
    if (application.status !== 'pending_review' && application.status !== 'return_pending_review') throw new Error('只有待审核单据可以驳回')

    application.status = (application.applicationType || 'apply') === 'return' ? 'return_rejected' : 'rejected'
    application.approvedBy = '市级畜牧兽医监管员'
    application.approvedAt = now()
    application.rejectReason = reason

    const action = (application.applicationType || 'apply') === 'return' ? '驳回检疫验讫标志退回申请' : '驳回检疫验讫标志申领'
    pushLog(data, 'regulator', '市级畜牧兽医监管员', action, `${application.applicationNo} ${reason}`)
    writeData(data)
    return clone(application)
  },

  async issueQuarantineMarks(issueOrderId: string): Promise<QuarantineMarkApplication> {
    const data = readData()
    const issueOrder = data.quarantineMarkIssueOrders.find((order) => order.id === issueOrderId || order.applicationId === issueOrderId)
    if (!issueOrder) throw new Error('待发放单不存在')
    if (issueOrder.status === 'issued') throw new Error('该发放单已完成发放')
    const application = data.quarantineMarkApplications.find((a) => a.id === issueOrder.applicationId)
    if (!application) throw new Error('检疫验讫标志申领记录不存在')

    application.status = 'issued'
    application.issuedRangeStart = issueOrder.rangeStart
    application.issuedRangeEnd = issueOrder.rangeEnd
    issueOrder.status = 'issued'
    issueOrder.issuedBy = '市级畜牧兽医监管员'
    issueOrder.issuedAt = now()

    const startMatch = issueOrder.rangeStart.match(/^([A-Z]{2}\d{8})(\d{4})$/)
    const endMatch = issueOrder.rangeEnd.match(/^([A-Z]{2}\d{8})(\d{4})$/)
    if (!startMatch || !endMatch) throw new Error('标志编号格式异常')

    const prefix = startMatch[1]
    const startNum = parseInt(startMatch[2], 10)
    const endNum = parseInt(endMatch[2], 10)

    for (let i = startNum; i <= endNum; i++) {
      const markNo = `${prefix}${String(i).padStart(4, '0')}`
      const exists = data.quarantineMarks.some((item) => item.markNo === markNo)
      if (exists) continue
      const mark: QuarantineMark = {
        id: id('mark'),
        markNo,
        markType: application.markType,
        ownerOrg: application.orgName,
        status: 'in_stock',
        qrCode: `https://trace.animal-vet.gov.cn/mark/${markNo}`,
        issuedAt: now(),
      }
      data.quarantineMarks.unshift(mark)
    }

    let inventory = data.quarantineMarkInventories.find((inv) => inv.markType === application.markType && inv.orgId === application.orgId)
    if (!inventory) {
      inventory = {
        id: id('inv'),
        orgId: application.orgId,
        markType: application.markType,
        total: 0,
        available: 0,
        used: 0,
        returned: 0,
        voided: 0,
      }
      data.quarantineMarkInventories.unshift(inventory)
    }
    inventory.total += application.quantity
    inventory.available += application.quantity

    pushLog(data, 'regulator', '市级畜牧兽医监管员', '发放检疫验讫标志并生成发放记录', `${issueOrder.issueNo} ${issueOrder.rangeStart}~${issueOrder.rangeEnd}`)
    writeData(data)
    return clone(application)
  },

  async completeQuarantineMarkReturn(returnOrderId: string): Promise<QuarantineMarkApplication> {
    const data = readData()
    const returnOrder = data.quarantineMarkReturnOrders.find((order) => order.id === returnOrderId || order.applicationId === returnOrderId)
    if (!returnOrder) throw new Error('待退回单不存在')
    if (returnOrder.status === 'returned') throw new Error('该退回单已完成入库')
    const application = data.quarantineMarkApplications.find((a) => a.id === returnOrder.applicationId)
    if (!application) throw new Error('检疫验讫标志退回申请不存在')

    const returnableMarks = data.quarantineMarks.filter((item) => item.markType === returnOrder.markType && (item.status === 'in_stock' || item.status === 'issued')).slice(0, returnOrder.quantity)
    if (returnableMarks.length < returnOrder.quantity) throw new Error(`可退回标志不足，需要 ${returnOrder.quantity} 枚，可退回 ${returnableMarks.length} 枚`)
    returnableMarks.forEach((mark) => {
      mark.status = 'returned'
      mark.ownerOrg = '监管端库存'
    })
    returnOrder.status = 'returned'
    returnOrder.returnedBy = '市级畜牧兽医监管员'
    returnOrder.returnedAt = now()
    returnOrder.markNos = returnableMarks.map((mark) => mark.markNo)
    application.status = 'returned'

    const slaughterInventory = data.quarantineMarkInventories.find((inv) => inv.markType === returnOrder.markType && inv.orgId === application.orgId)
    if (slaughterInventory) {
      slaughterInventory.available = Math.max(0, slaughterInventory.available - returnableMarks.length)
      slaughterInventory.returned += returnableMarks.length
    }
    let regulatorInventory = data.quarantineMarkInventories.find((inv) => inv.markType === returnOrder.markType && inv.orgId === 'org-regulator-001')
    if (!regulatorInventory) {
      regulatorInventory = { id: id('inv'), orgId: 'org-regulator-001', markType: returnOrder.markType, total: 0, available: 0, used: 0, returned: 0, voided: 0 }
      data.quarantineMarkInventories.unshift(regulatorInventory)
    }
    regulatorInventory.total += returnableMarks.length
    regulatorInventory.available += returnableMarks.length
    regulatorInventory.returned += returnableMarks.length

    pushLog(data, 'regulator', '市级畜牧兽医监管员', '检疫验讫标志退回入库', `${returnOrder.returnNo} ${returnableMarks.length}枚`)
    writeData(data)
    return clone(application)
  },

  async getQuarantineMarkInventory() {
    return clone(readData().quarantineMarkInventories)
  },

  async getQuarantineMarkUsageRecords() {
    return clone(readData().quarantineMarks.filter(m => m.status === 'used'))
  },

  async getTraceabilityByMarkNo(markNo: string) {
    const data = readData()
    const mark = data.quarantineMarks.find((m) => m.markNo === markNo)
    if (!mark) return null

    const traceability = data.traceabilityRecords.find((t) => t.markNo === markNo)
    if (!traceability) return null

    const animalCert = data.quarantineCertificates.find((c) => c.id === traceability.quarantineCertificateId)
    const productCert = data.productCertificates.find((c) => c.id === traceability.productCertificateId)
    const meatCert = data.meatQualityCertificates.find((c) => c.id === traceability.meatQualityCertificateId)

    return clone({
      mark,
      animalCertificate: animalCert,
      productCertificate: productCert,
      meatQualityCertificate: meatCert,
    })
  },

  async getThreeCertificatesByProductCertificate(productCertificateId: string) {
    const data = readData()
    const productCert = data.productCertificates.find((c) => c.id === productCertificateId)
    if (!productCert) throw new Error('产品检疫证明不存在')

    const link = data.threeCertificateLinks.find((l) => l.productCertificateId === productCertificateId)
    if (!link) throw new Error('三证关联记录不存在')

    const animalCert = data.quarantineCertificates.find((c) => c.id === link.animalCertificateId)
    const meatCert = data.meatQualityCertificates.find((c) => c.id === link.meatQualityCertificateId)

    return clone({
      animalCertificate: animalCert,
      productCertificate: productCert,
      meatQualityCertificate: meatCert,
    })
  },

  async submitAnteMortemCheckDetail(input: AnteMortemSubmitInput): Promise<AnteMortemCheckDetail> {
    const data = readData()
    const application = data.slaughterApplications.find((a) => a.id === input.slaughterApplicationId)
    if (!application) throw new Error('屠宰检疫申报不存在')

    const batch = data.slaughterBatches.find((b) => b.id === application.batchId)
    const waitingBatch = data.waitingSlaughterBatches.find((w) => w.entryCheckId === application.entryCheckId || w.entryRecordId === application.entryRecordId)
    const waitingBatchId = batch?.id ?? waitingBatch?.id ?? application.batchId ?? application.id

    const detail: AnteMortemCheckDetail = {
      id: id('sl-'),
      checkNo: no('ZQJC'),
      slaughterApplicationId: application.id,
      waitingBatchId,
      slaughterhouseName: '皖北标准化屠宰中心',
      animalType: application.animalType ?? batch?.animalType ?? '生猪',
      applicationQuantity: application.quantity,
      waitingPenNo: batch?.waitingPenNo ?? 'DZQ-001',
      plannedSlaughterTime: application.plannedSlaughterTime ?? now(),
      officialVet: '官方兽医 王敏',
      checkTime: now(),
      items: input.items,
      conclusion: input.conclusion,
      conclusionReason: input.conclusionReason,
      status: 'completed',
      createdAt: now(),
    }

    data.anteMortemCheckDetails.unshift(detail)

    if (input.conclusion === 'passed') {
      application.status = 'pre_check_passed'
      application.status = 'auto_slaughter_completed'
      application.status = 'post_product_generated'
      application.updatedAt = now()

      if (batch) {
        batch.status = 'ante_mortem_passed'
        batch.anteMortemCheckId = detail.id
      }

      // 自动生成屠宰记录
      const quarantineCert = data.quarantineCertificates.find((c) => c.id === application.quarantineCertificateId)
      const record: SlaughterRecord = {
        id: id('sl-'),
        recordNo: no('TZJL'),
        slaughterBatchNo: batch?.batchNo ?? no('TZPC'),
        waitingBatchId,
        slaughterApplicationId: application.id,
        quarantineCertificateId: application.quarantineCertificateId ?? '',
        slaughterhouseName: '皖北标准化屠宰中心',
        animalType: application.animalType ?? batch?.animalType ?? '生猪',
        preCheckConclusion: 'passed',
        actualSlaughterQuantity: application.quantity,
        slaughterCompletedTime: now(),
        generationMethod: 'auto',
        status: 'auto_generated',
        createdAt: now(),
      }
      data.slaughterRecords.unshift(record)

      // 自动生成宰后产品批次
      const postBatch: PostProductBatch = {
        id: id('sl-'),
        productBatchNo: no('CPPC'),
        slaughterBatchNo: batch?.batchNo ?? record.slaughterBatchNo,
        slaughterRecordId: record.id,
        slaughterApplicationId: application.id,
        animalType: application.animalType ?? '生猪',
        productName: '猪白条肉',
        productType: '冷却肉',
        productQuantity: application.quantity,
        productWeight: application.quantity * 80,
        sourceAnimalQuantity: application.quantity,
        sourceAnimalCertificateNo: quarantineCert?.certificateNo ?? '',
        slaughterhouseName: '皖北标准化屠宰中心',
        productCertStatus: 'not_ready',
        meatQualityStatus: 'not_started',
        postCheckStatus: 'not_started',
        waitingBatchId,
        quarantineCertificateId: application.quarantineCertificateId,
        createdAt: now(),
      }
      data.postProductBatches.unshift(postBatch)

      pushLog(data, 'vet', '官方兽医 王敏', '宰前检查通过并自动生成屠宰记录与产品批次', detail.checkNo)
    } else {
      application.status = 'pre_check_failed'
      application.updatedAt = now()
      if (batch) {
        batch.status = 'ante_mortem_failed'
        batch.anteMortemCheckId = detail.id
      }
      pushAlert(data, 'danger', '宰前检查', `${detail.checkNo} 宰前检查未通过：${input.conclusionReason}`, detail.id)
    }

    pushLog(data, 'vet', '官方兽医 王敏', input.conclusion === 'passed' ? '宰前检查通过' : '宰前检查未通过', detail.checkNo)
    pushNode(data, '宰前检查', '官方兽医端', input.conclusion === 'passed', '官方兽医 王敏', detail.id, input.conclusion === 'passed' ? '宰前检查通过' : `宰前检查未通过：${input.conclusionReason}`)
    writeData(data)
    return clone(detail)
  },

  async submitMeatQualityCheckDetail(input: MeatQualitySubmitInput) {
    const data = readData()
    const postProductBatch = data.postProductBatches.find((b) => b.id === input.productBatchId)
    if (!postProductBatch) throw new Error('宰后产品批次不存在')

    const slaughterRecord = data.slaughterRecords.find((r) => r.id === postProductBatch.slaughterRecordId)

    const detail: MeatQualityCheckDetail = {
      id: id('sl-'),
      checkNo: no('RPJY'),
      productBatchId: postProductBatch.id,
      slaughterBatchNo: postProductBatch.slaughterBatchNo,
      slaughterhouseName: postProductBatch.slaughterhouseName,
      animalType: postProductBatch.animalType,
      productName: input.productName,
      productType: input.productType,
      productQuantity: postProductBatch.productQuantity,
      productWeight: postProductBatch.productWeight,
      slaughterCompletedTime: slaughterRecord?.slaughterCompletedTime ?? now(),
      inspector: input.inspector,
      checkTime: now(),
      items: input.items,
      conclusion: input.conclusion,
      unqualifiedQuantity: input.unqualifiedQuantity,
      unqualifiedReason: input.unqualifiedReason,
      disposalMethod: input.disposalMethod,
      remark: input.remark,
      status: input.conclusion === 'qualified' ? 'passed' : 'failed',
      createdAt: now(),
    }

    data.meatQualityCheckDetails.unshift(detail)

    // 更新 PostProductBatch 的 meatQualityStatus
    postProductBatch.meatQualityStatus = input.conclusion === 'qualified' ? 'cert_generated' : 'failed'

    let certificate: MeatQualityCertificate | undefined

    if (input.conclusion === 'qualified') {
      // 生成肉品品质检验合格证
      certificate = {
        id: id('sl-'),
        certificateNo: no('RZ'),
        waitingBatchId: postProductBatch.waitingBatchId ?? '',
        productName: input.productName,
        weight: postProductBatch.productWeight,
        inspector: input.inspector,
        issuedAt: now(),
        batchId: postProductBatch.slaughterBatchNo,
        quarantineCertificateId: postProductBatch.quarantineCertificateId,
        productBatchNo: postProductBatch.productBatchNo,
        conclusion: 'qualified',
        qualifiedQuantity: postProductBatch.productQuantity - input.unqualifiedQuantity,
        unqualifiedQuantity: input.unqualifiedQuantity,
      }
      data.meatQualityCertificates.unshift(certificate)

      // 如果 postCheckStatus 也是 'passed'，设 postProductBatch 状态为 'ready_for_product_cert'
      if (postProductBatch.postCheckStatus === 'passed') {
        postProductBatch.productCertStatus = 'ready_for_product_cert'
      }

      // 更新屠宰申报状态
      const application = data.slaughterApplications.find((a) => a.id === postProductBatch.slaughterApplicationId)
      if (application) {
        application.status = 'quality_cert_generated'
        application.updatedAt = now()
      }

      pushLog(data, 'slaughter', input.inspector, '肉品品质检验通过并生成合格证', certificate.certificateNo)
      pushNode(data, '肉品品质检验合格证', '屠宰企业端', true, input.inspector, certificate.id, certificate.certificateNo)
    } else {
      pushAlert(data, 'danger', '肉品品质检验', `${detail.checkNo} 检验不合格：${input.unqualifiedReason}`, detail.id)
      pushLog(data, 'slaughter', input.inspector, '肉品品质检验不合格', detail.checkNo)
    }

    writeData(data)
    return clone({ detail, certificate, postProductBatch })
  },

  async submitPostMortemCheckDetail(input: PostMortemSubmitInput) {
    const data = readData()
    const postProductBatch = data.postProductBatches.find((b) => b.id === input.productBatchId)
    if (!postProductBatch) throw new Error('宰后产品批次不存在')

    const slaughterRecord = data.slaughterRecords.find((r) => r.id === postProductBatch.slaughterRecordId)

    const detail: PostMortemCheckDetail = {
      id: id('sl-'),
      checkNo: no('ZHJY'),
      productBatchId: postProductBatch.id,
      slaughterBatchNo: postProductBatch.slaughterBatchNo,
      slaughterApplicationId: postProductBatch.slaughterApplicationId,
      slaughterhouseName: postProductBatch.slaughterhouseName,
      animalType: postProductBatch.animalType,
      actualSlaughterQuantity: slaughterRecord?.actualSlaughterQuantity ?? postProductBatch.sourceAnimalQuantity,
      productName: postProductBatch.productName,
      productWeight: postProductBatch.productWeight,
      slaughterCompletedTime: slaughterRecord?.slaughterCompletedTime ?? now(),
      officialVet: '官方兽医 王敏',
      checkTime: now(),
      items: input.items,
      conclusion: input.conclusion,
      conclusionReason: input.conclusionReason,
      unqualifiedQuantity: input.unqualifiedQuantity,
      harmlessQuantity: input.harmlessQuantity,
      status: input.conclusion === 'passed' ? 'passed' : input.conclusion === 'failed' ? 'failed' : input.conclusion === 'partial_failed' ? 'partial_failed' : 'harmless_required',
      createdAt: now(),
    }

    data.postMortemCheckDetails.unshift(detail)

    // 更新 PostProductBatch 的 postCheckStatus
    postProductBatch.postCheckStatus = input.conclusion === 'passed' ? 'passed' : input.conclusion === 'failed' ? 'failed' : 'partial_failed'

    if (input.conclusion === 'passed') {
      // 如果 meatQualityStatus 是 'cert_generated'，更新状态为 'ready_for_product_cert'
      if (postProductBatch.meatQualityStatus === 'cert_generated') {
        postProductBatch.productCertStatus = 'ready_for_product_cert'
      }

      // 更新屠宰申报状态
      const application = data.slaughterApplications.find((a) => a.id === postProductBatch.slaughterApplicationId)
      if (application) {
        application.status = 'post_check_passed'
        application.updatedAt = now()
      }

      pushLog(data, 'vet', '官方兽医 王敏', '宰后同步检疫通过', detail.checkNo)
      pushNode(data, '宰后检疫', '官方兽医端', true, '官方兽医 王敏', detail.id, `宰后检疫通过`)
    } else {
      pushAlert(data, 'danger', '宰后检疫', `${detail.checkNo} 宰后检疫异常：${input.conclusionReason}`, detail.id)
      pushLog(data, 'vet', '官方兽医 王敏', '宰后检疫异常', detail.checkNo)
      pushNode(data, '宰后检疫', '官方兽医端', false, '官方兽医 王敏', detail.id, input.conclusionReason)

      if (input.harmlessQuantity > 0) {
        data.harmlessTasks.unshift({
          id: id('harmless'),
          taskNo: no('WHH'),
          source: 'slaughter_unqualified',
          sourceId: detail.id,
          quantity: input.harmlessQuantity,
          weight: input.harmlessQuantity * 80,
          reason: '宰后检疫不合格需无害化处理',
          status: 'pending',
          createdAt: now(),
        })
      }
    }

    writeData(data)
    return clone({ detail, postProductBatch })
  },

  async issueProductCertificateForBatch(input: ProductCertIssueInput) {
    const data = readData()
    const postProductBatch = data.postProductBatches.find((b) => b.id === input.productBatchId)
    if (!postProductBatch) throw new Error('宰后产品批次不存在')

    // 自动补齐前置条件，不拦截出证
    if (postProductBatch.postCheckStatus !== 'passed') {
      postProductBatch.postCheckStatus = 'passed'
    }
    if (postProductBatch.meatQualityStatus !== 'cert_generated') {
      postProductBatch.meatQualityStatus = 'cert_generated'
    }

    const application = data.slaughterApplications.find((a) => a.id === postProductBatch.slaughterApplicationId)
    if (!application) throw new Error('屠宰检疫申报不存在')

    const animalCert = data.quarantineCertificates.find((c) => c.id === application.quarantineCertificateId)
    const meatCert = data.meatQualityCertificates.find((c) => c.productBatchNo === postProductBatch.productBatchNo)

    // 创建 ProductCertificate
    const certificate: ProductCertificate = {
      id: id('sl-'),
      certificateNo: no('CP'),
      slaughterApplicationId: application.id,
      productName: input.productName,
      weight: input.productWeight,
      issuedBy: '官方兽医 王敏',
      issuedAt: now(),
      quarantineCertificateId: application.quarantineCertificateId,
      meatQualityCertificateId: meatCert?.id,
      productBatchNo: postProductBatch.productBatchNo,
      batchId: application.batchId,
    }
    data.productCertificates.unshift(certificate)

    // 创建 ProductCertIssueRecord
    const issueRecord: ProductCertIssueRecord = {
      id: id('sl-'),
      productBatchId: postProductBatch.id,
      slaughterApplicationId: application.id,
      productName: input.productName,
      productQuantity: input.productQuantity,
      productWeight: input.productWeight,
      slaughterhouseName: input.slaughterhouseName,
      destination: input.destination,
      vehiclePlateNo: input.vehiclePlateNo,
      issuedBy: '官方兽医 王敏',
      issuedAt: now(),
      status: 'issued',
      animalCertificateNo: animalCert?.certificateNo,
      meatQualityCertificateNo: meatCert?.certificateNo,
      productCertificateNo: certificate.certificateNo,
      createdAt: now(),
    }
    data.productCertIssueRecords.unshift(issueRecord)

    // 更新状态
    postProductBatch.productCertStatus = 'issued'
    application.status = 'product_cert_issued'
    application.updatedAt = now()

    const batch = data.slaughterBatches.find((b) => b.id === application.batchId)
    if (batch) {
      batch.status = 'product_cert_issued'
    }

    pushLog(data, 'vet', '官方兽医 王敏', '出具动物产品检疫证明', certificate.certificateNo)
    pushSync(data, certificate.certificateNo, '产品检疫出证')
    pushNode(data, '产品检疫证明', '官方兽医端', true, '官方兽医 王敏', certificate.id, certificate.certificateNo)
    writeData(data)
    return clone({ certificate, issueRecord, postProductBatch })
  },

  async submitMarkUsage(input: MarkUsageSubmitInput): Promise<ThreeCertificateLink> {
    const data = readData()
    const application = data.slaughterApplications.find((a) => a.id === input.slaughterApplicationId)
    if (!application) throw new Error('屠宰检疫申报不存在')

    // 创建三证关联
    const link: ThreeCertificateLink = {
      id: id('sl-'),
      linkNo: no('LNK'),
      animalCertificateId: input.quarantineCertificateId,
      productCertificateId: input.productCertificateId,
      meatQualityCertificateId: input.meatQualityCertificateId,
      slaughterApplicationId: input.slaughterApplicationId,
      productBatchId: input.productBatchId,
      linkedAt: now(),
    }
    data.threeCertificateLinks.unshift(link)

    // 更新检疫标志为 'used'
    const availableMarks = data.quarantineMarks.filter((m) => m.markType === input.markType && m.status === 'in_stock')
    const marksToUse = availableMarks.slice(0, input.quantity)
    if (marksToUse.length < input.quantity) throw new Error(`检疫标志库存不足，需要 ${input.quantity} 个，可用 ${marksToUse.length} 个`)

    const markNos: string[] = []
    marksToUse.forEach((mark) => {
      mark.status = 'used'
      mark.usedAt = now()
      mark.productCertificateId = input.productCertificateId
      mark.quarantineCertificateId = input.quarantineCertificateId
      mark.meatQualityCertificateId = input.meatQualityCertificateId
      mark.slaughterBatchId = application.batchId
      mark.productBatchNo = input.productBatchId
      markNos.push(mark.markNo)
    })

    link.markRangeStart = markNos[0]
    link.markRangeEnd = markNos[markNos.length - 1]

    // 更新库存
    const inventory = data.quarantineMarkInventories.find((i) => i.markType === input.markType)
    if (inventory) {
      inventory.available -= input.quantity
      inventory.used += input.quantity
    }

    // 更新屠宰申报状态
    application.status = 'mark_used'
    application.status = 'completed'
    application.updatedAt = now()

    const batch = data.slaughterBatches.find((b) => b.id === application.batchId)
    if (batch) {
      batch.status = 'product_cert_issued'
    }

    // 创建溯源记录
    const traceability: TraceabilityRecord = {
      id: id('sl-'),
      markNo: markNos[0] ?? '',
      quarantineCertificateId: input.quarantineCertificateId,
      productCertificateId: input.productCertificateId,
      meatQualityCertificateId: input.meatQualityCertificateId,
      slaughterBatchId: application.batchId ?? '',
      productBatchNo: input.productBatchId,
      queriedAt: now(),
    }
    data.traceabilityRecords.unshift(traceability)

    pushLog(data, 'slaughter', input.operator, '使用检疫验讫标志并完成三证关联', link.linkNo)
    pushNode(data, '三证关联追溯', '闭环校验系统', true, input.operator, link.id, `${link.linkNo} 标志 ${markNos[0]}~${markNos[markNos.length - 1]}`)
    writeData(data)
    return clone(link)
  },

  async getTraceabilityByProductBatch(productBatchNo: string) {
    const data = readData()
    const link = data.threeCertificateLinks.find((l) => l.productBatchId === productBatchNo)
    if (!link) return null

    const animalCert = data.quarantineCertificates.find((c) => c.id === link.animalCertificateId)
    const productCert = data.productCertificates.find((c) => c.id === link.productCertificateId)
    const meatCert = data.meatQualityCertificates.find((c) => c.id === link.meatQualityCertificateId)
    const postProductBatch = data.postProductBatches.find((b) => b.productBatchNo === productBatchNo)
    const slaughterRecord = postProductBatch ? data.slaughterRecords.find((r) => r.id === postProductBatch.slaughterRecordId) : undefined

    return clone({
      link,
      animalCertificate: animalCert,
      productCertificate: productCert,
      meatQualityCertificate: meatCert,
      postProductBatch,
      slaughterRecord,
    })
  },
}

