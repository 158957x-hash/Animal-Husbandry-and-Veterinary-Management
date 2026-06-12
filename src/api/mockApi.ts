import type {
  AlertRecord,
  AnnualReport,
  AnteMortemInput,
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
  MedicalWasteInput,
  MedicalWasteRecord,
  MeatQualityCertificate,
  MeatQualityCertificateInput,
  OperationLog,
  OriginApplicationInput,
  OriginInspectionInput,
  OriginQuarantineApplication,
  PetOwner,
  PetOwnerInput,
  PetProfile,
  PetProfileInput,
  PostMortemInput,
  Prescription,
  PrescriptionInput,
  ProductCertificate,
  ProductCertificateInput,
  QuarantineCertificate,
  SlaughterAnteMortemCheck,
  SlaughterApplicationInput,
  SlaughterAuditInput,
  SlaughterPostMortemCheck,
  SlaughterQuarantineApplication,
  SyncLog,
  ThreeCertificateLink,
  TransportExceptionInput,
  UserRole,
  UserSession,
  ValidationResult,
  Veterinarian,
  VeterinarianInput,
  WaitingSlaughterBatch,
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
  return { ...seed, ...data }
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

function validateOriginApplication(data: AppData, input: OriginApplicationInput): ValidationResult[] {
  const batch = data.farmBatches.find((item) => item.id === input.batchId)
  const vehicle = data.vehicles.find((item) => item.id === input.vehicleId)
  const enoughEarTags = batch ? input.quantity <= batch.earTagEnd - batch.earTagStart + 1 : false

  return [
    { label: '存栏数量', passed: Boolean(batch && input.quantity > 0 && batch.stock >= input.quantity), message: batch && batch.stock >= input.quantity ? `当前存栏 ${batch.stock} 头，可申报` : '申报数量超过当前存栏' },
    { label: '耳标区间', passed: Boolean(batch && enoughEarTags), message: batch && enoughEarTags ? `${batch.earTagPrefix} 区间覆盖本次数量` : '耳标区间不足或批次不存在' },
    { label: '免疫状态', passed: Boolean(batch?.immuneQualified), message: batch?.immuneQualified ? '免疫记录齐全且在有效期内' : '免疫记录不合格' },
    { label: '车辆备案', passed: Boolean(vehicle?.registered), message: vehicle?.registered ? `${vehicle.plateNo} 已备案` : '车辆未备案' },
    { label: '承运人状态', passed: Boolean(vehicle && !vehicle.blacklisted), message: vehicle && !vehicle.blacklisted ? `${vehicle.carrier} 未命中黑名单` : '车辆或承运人命中黑名单' },
    { label: '定位设备', passed: Boolean(vehicle?.registered), message: vehicle?.registered ? '定位设备在线' : '定位设备未备案' },
    { label: '目的地信息', passed: Boolean(input.destination), message: input.destination ? `目的地：${input.destination}` : '目的地不能为空' },
  ]
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

  async submitOriginApplication(input: OriginApplicationInput): Promise<OriginQuarantineApplication> {
    const data = readData()
    const batch = data.farmBatches.find((item) => item.id === input.batchId)
    const vehicle = data.vehicles.find((item) => item.id === input.vehicleId)
    if (!batch || !vehicle) throw new Error('申报批次或车辆不存在')

    const validationResults = validateOriginApplication(data, input)
    const application: OriginQuarantineApplication = {
      id: id('origin'),
      applicationNo: no('CDJY'),
      batchId: batch.id,
      animalType: batch.animalType,
      quantity: input.quantity,
      destination: input.destination,
      vehicleId: vehicle.id,
      carrier: vehicle.carrier,
      status: transitionStatus('draft', 'submitted'),
      validationResults,
      createdAt: now(),
      updatedAt: now(),
    }

    data.originApplications.unshift(application)
    pushLog(data, 'farmer', batch.farmName, '提交产地检疫申报', application.applicationNo)
    pushNode(data, '产地检疫申报', '养殖场户端', validationResults.every((item) => item.passed), batch.farmName, application.id, `申报 ${application.quantity} 头${application.animalType}`)
    validationResults.filter((item) => !item.passed).forEach((item) => pushAlert(data, 'warning', item.label, item.message, application.id))
    writeData(data)
    return clone(application)
  },

  async getOriginApplications(): Promise<OriginQuarantineApplication[]> {
    return clone(readData().originApplications)
  },

  async getOriginApplication(idValue: string): Promise<OriginQuarantineApplication | undefined> {
    return clone(readData().originApplications.find((item) => item.id === idValue))
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
    data.quarantineCertificates.unshift(certificate)
    data.transportTasks.unshift({
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
    })

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

    const application: SlaughterQuarantineApplication = { id: id('slaughter'), entryCheckId: entry.id, applicationNo: no('TZJY'), quantity: input.quantity, africanSwineFeverResult: input.africanSwineFeverResult, bannedDrugResult: input.bannedDrugResult, status: transitionStatus(entry.status, 'slaughter_submitted'), createdAt: now() }
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
    const link: ThreeCertificateLink = { id: id('link'), waitingBatchId: waiting.id, animalCertificateId: animal.id, productCertificateId: product.id, meatQualityCertificateId: meat.id, linkedAt: now() }
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
    application.status = transitionStatus(application.status, 'slaughter_reviewing')
    application.status = transitionStatus(application.status, 'slaughter_approved')
    application.status = transitionStatus(application.status, 'product_certificate_issued')
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
}

