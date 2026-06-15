import type { AppData, BusinessStatus, OriginPurpose, UserRole, UserSession, ValidationResult } from './models'

export const roleSessions: Record<UserRole, UserSession> = {
  farmer: { role: 'farmer', name: '绿丰生态养殖场', homePath: '/farmer/dashboard' },
  vet: { role: 'vet', name: '官方兽医 王敏', homePath: '/vet/origin-todos' },
  slaughter: { role: 'slaughter', name: '皖北标准化屠宰中心', homePath: '/slaughter/entry-check' },
  regulator: { role: 'regulator', name: '市级畜牧兽医监管员', homePath: '/regulator/dashboard' },
  clinic_admin: { role: 'clinic_admin', name: '安心动物诊疗中心管理员', homePath: '/clinic/admin/dashboard' },
  practicing_vet: { role: 'practicing_vet', name: '执业兽医 陈晓宁', homePath: '/clinic/veterinarian/pets' },
  pet_owner: { role: 'pet_owner', name: '宠物主人 李女士', homePath: '/clinic/owner/records' },
}

/* ---- 时间线 ---- */
const t0 = '2026-06-10T08:00:00.000Z'
const t1 = '2026-06-10T09:30:00.000Z'
const t2 = '2026-06-10T11:00:00.000Z'
const t3 = '2026-06-11T08:00:00.000Z'
const t4 = '2026-06-11T09:15:00.000Z'
const t5 = '2026-06-11T10:30:00.000Z'
const t7 = '2026-06-12T08:00:00.000Z'
const t8 = '2026-06-12T09:00:00.000Z'
const t9 = '2026-06-12T09:30:00.000Z'
const t10 = '2026-06-12T10:20:00.000Z'
const t12 = '2026-06-12T11:30:00.000Z'
const t13 = '2026-06-12T14:00:00.000Z'

function checks(quantity: number, stock: number, plateNo: string, carrier: string, dest: string): ValidationResult[] {
  return [
    { label: '存栏校验', passed: stock >= quantity, message: `当前存栏 ${stock}，申报 ${quantity}` },
    { label: '强制免疫', passed: true, message: '免疫记录在有效期内' },
    { label: '耳标状态', passed: true, message: `耳标号段覆盖本次申报 ${quantity} 头` },
    { label: '车辆备案', passed: true, message: `${plateNo} 已备案` },
    { label: '承运人备案', passed: true, message: `${carrier} 已备案` },
    { label: '目的地备案', passed: true, message: `${dest}已备案` },
    { label: '定位设备状态', passed: true, message: '车辆定位在线' },
  ]
}

function originApp(id: string, no: string, status: BusinessStatus, qty: number, purpose: OriginPurpose, extra: Partial<AppData['originApplications'][number]> = {}): AppData['originApplications'][number] {
  return {
    id,
    applicationNo: no,
    batchId: extra.batchId || 'batch-001',
    animalType: extra.animalType || '生猪',
    quantity: qty,
    destination: extra.destination || '皖北标准化屠宰中心',
    destinationAddress: extra.destinationAddress || '安徽省亳州市利辛县屠宰加工园区 1 号',
    purpose,
    departureTime: extra.departureTime || '2026-06-13T08:00:00.000Z',
    contactPerson: extra.contactPerson || '王场长',
    contactPhone: extra.contactPhone || '13900002222',
    remark: extra.remark || '',
    vehicleId: extra.vehicleId || 'vehicle-001',
    carrier: extra.carrier || '李建国',
    status,
    validationResults: extra.validationResults || checks(qty, 320, '皖K·A3189', '李建国', '皖北标准化屠宰中心'),
    rejectReason: extra.rejectReason,
    withdrawReason: extra.withdrawReason,
    voidReason: extra.voidReason,
    voidRequested: extra.voidRequested,
    voidRequestReason: extra.voidRequestReason,
    submittedAt: status === 'draft' ? undefined : (extra.submittedAt || t9),
    createdAt: extra.createdAt || t8,
    updatedAt: extra.updatedAt || t9,
  }
}

export function createSeedData(): AppData {
  return {
    /* ---- 养殖批次 ---- */
    farmBatches: [
      { id: 'batch-001', farmName: '绿丰生态养殖场', animalType: '生猪', breed: '杜长大三元猪', stock: 320, immuneQualified: true, earTagPrefix: 'AH-LF-2026', earTagStart: 1001, earTagEnd: 1320, location: '安徽省阜阳市颍州区三十里铺镇' },
      { id: 'batch-002', farmName: '青禾家庭农场', animalType: '肉牛', breed: '西门塔尔牛', stock: 86, immuneQualified: true, earTagPrefix: 'AH-QH-2026', earTagStart: 2201, earTagEnd: 2286, location: '安徽省亳州市涡阳县楚店镇' },
      { id: 'batch-003', farmName: '双河合作社', animalType: '羊', breed: '湖羊', stock: 180, immuneQualified: false, earTagPrefix: 'AH-SH-2026', earTagStart: 3101, earTagEnd: 3280, location: '安徽省宿州市埇桥区栏杆镇' },
      { id: 'batch-004', farmName: '绿丰生态养殖场', animalType: '生猪', breed: '大约克夏猪', stock: 156, immuneQualified: true, earTagPrefix: 'AH-LF-2026', earTagStart: 4001, earTagEnd: 4156, location: '安徽省阜阳市颍州区三十里铺镇' },
    ],

    /* ---- 运输车辆 ---- */
    vehicles: [
      { id: 'vehicle-001', plateNo: '皖K·A3189', carrier: '李建国', registered: true, blacklisted: false, channel: '东门动物运输专用通道' },
      { id: 'vehicle-002', plateNo: '皖S·P7726', carrier: '张长运', registered: true, blacklisted: false, channel: '北门临检通道' },
      { id: 'vehicle-003', plateNo: '皖A·X4091', carrier: '刘某', registered: false, blacklisted: true, channel: '东门动物运输专用通道' },
      { id: 'vehicle-004', plateNo: '皖N·B5623', carrier: '赵德运', registered: true, blacklisted: false, channel: '南门常规通道' },
    ],

    /* ---- 产地检疫申报 ---- */
    originApplications: [
      originApp('origin-seed-draft', 'CDJY202606120001', 'draft', 60, 'slaughter', { submittedAt: undefined, updatedAt: t8, remark: '本周计划调运至屠宰中心' }),
      originApp('origin-seed-submitted', 'CDJY202606120002', 'submitted', 45, 'trade', { createdAt: t7, submittedAt: t8, updatedAt: t8, remark: '交易调运至合肥周谷堆市场' }),
      originApp('origin-seed-rejected', 'CDJY202606110003', 'rejected', 30, 'breeding', { createdAt: t3, submittedAt: t4, updatedAt: t5, rejectReason: '目的地详细地址材料不完整，养殖场备案信息与申报信息不一致，请补充后重新提交。', contactPerson: '张技术员', contactPhone: '13900003333' }),
      originApp('origin-seed-issued', 'CDJY202606100004', 'certificate_issued', 50, 'slaughter', { createdAt: t0, submittedAt: t1, updatedAt: t2, remark: '按月度调运计划执行' }),
      originApp('origin-seed-transporting', 'CDJY202606100005', 'transporting', 40, 'slaughter', { createdAt: t0, submittedAt: t1, updatedAt: t2, departureTime: '2026-06-12T06:00:00.000Z', remark: '凌晨装车发运' }),
      originApp('origin-seed-arrived', 'CDJY202606090006', 'arrived', 35, 'slaughter', { createdAt: '2026-06-09T08:00:00.000Z', submittedAt: '2026-06-09T09:00:00.000Z', updatedAt: '2026-06-09T15:00:00.000Z', departureTime: '2026-06-09T06:00:00.000Z', remark: '已安全到达目的地' }),
    ],

    /* ---- 检疫合格证明 ---- */
    quarantineCertificates: [
      { id: 'cert-seed-issued', certificateNo: 'AH-CD-202606100004', applicationId: 'origin-seed-issued', validFrom: t2, validTo: '2026-06-13T11:00:00.000Z', issuedBy: '官方兽医 王敏', animalType: '生猪', quantity: 50, origin: '安徽省阜阳市颍州区三十里铺镇', destination: '皖北标准化屠宰中心', vehiclePlateNo: '皖K·A3189' },
      { id: 'cert-seed-transporting', certificateNo: 'AH-CD-202606100005', applicationId: 'origin-seed-transporting', validFrom: t2, validTo: '2026-06-13T11:00:00.000Z', issuedBy: '官方兽医 王敏', animalType: '生猪', quantity: 40, origin: '安徽省阜阳市颍州区三十里铺镇', destination: '皖北标准化屠宰中心', vehiclePlateNo: '皖K·A3189' },
      { id: 'cert-seed-arrived', certificateNo: 'AH-CD-202606090006', applicationId: 'origin-seed-arrived', validFrom: '2026-06-09T11:00:00.000Z', validTo: '2026-06-12T11:00:00.000Z', issuedBy: '官方兽医 王敏', animalType: '生猪', quantity: 35, origin: '安徽省阜阳市颍州区三十里铺镇', destination: '皖北标准化屠宰中心', vehiclePlateNo: '皖S·P7726' },
    ],

    /* ---- 运输任务 ---- */
    transportTasks: [
      { id: 'transport-seed-issued', certificateId: 'cert-seed-issued', plateNo: '皖K·A3189', status: 'certificate_issued', hasDeviation: false, startedAt: t2, route: [{ name: '起运地', time: '2026-06-12 11:10', status: 'pending', description: '绿丰生态养殖场，待发车' }, { name: '颍州检查站', time: '2026-06-12 12:10', status: 'pending', description: '待过站' }, { name: '利辛指定通道', time: '2026-06-12 13:30', status: 'pending', description: '待过站' }, { name: '目的地', time: '2026-06-12 14:30', status: 'pending', description: '皖北标准化屠宰中心，待到达' }] },
      { id: 'transport-seed-transporting', certificateId: 'cert-seed-transporting', plateNo: '皖K·A3189', status: 'transporting', hasDeviation: false, startedAt: t2, route: [{ name: '起运地', time: '2026-06-12 06:10', status: 'done', description: '绿丰生态养殖场，已发车' }, { name: '颍州检查站', time: '2026-06-12 07:20', status: 'done', description: '已过站，车辆正常' }, { name: '利辛指定通道', time: '2026-06-12 08:45', status: 'active', description: '车辆运输中，预计 09:00 到达' }, { name: '目的地', time: '2026-06-12 09:30', status: 'pending', description: '皖北标准化屠宰中心，待到达' }] },
      { id: 'transport-seed-arrived', certificateId: 'cert-seed-arrived', plateNo: '皖S·P7726', status: 'arrived', hasDeviation: false, startedAt: '2026-06-09T11:00:00.000Z', arrivedAt: '2026-06-09T15:00:00.000Z', route: [{ name: '起运地', time: '2026-06-09 06:00', status: 'done', description: '已发车' }, { name: '颍州检查站', time: '2026-06-09 07:15', status: 'done', description: '已过站' }, { name: '目的地', time: '2026-06-09 09:00', status: 'done', description: '已到达' }] },
    ],

    /* ---- 落地报告 ---- */
    landingReports: [
      { id: 'landing-seed-1', reportNo: 'LD202606090001', transportTaskId: 'transport-seed-arrived', certificateId: 'cert-seed-arrived', plateNo: '皖S·P7726', destination: '皖北标准化屠宰中心', actualDestination: '皖北标准化屠宰中心', status: 'submitted', onDestination: true, overdue: false, reporter: '张长运', plannedArrivedAt: '2026-06-09T14:00:00.000Z', arrivedAt: '2026-06-09T15:00:00.000Z', createdAt: '2026-06-09T15:10:00.000Z' },
    ],

    /* ---- 承运人限制 ---- */
    carrierRestrictions: [
      { id: 'restrict-seed-1', vehicleId: 'vehicle-003', plateNo: '皖A·X4091', carrier: '刘某', reason: '运输途中偏离指定路线，未在规定时间到达目的地', certificateId: 'cert-seed-transporting', transportTaskId: 'transport-seed-transporting', status: 'restricted', disposalRecords: ['已通知承运人', '限制期内禁止承运动物'], restrictedAt: t13 },
    ],

    /* ---- 入场查验 ---- */
    entryChecks: [
      { id: 'entry-seed-1', certificateId: 'cert-seed-arrived', plateNo: '皖S·P7726', status: 'entry_passed', checks: [{ label: '证物相符', passed: true, message: '检疫证明与实际动物一致' }, { label: '动物健康状况', passed: true, message: '动物临床检查正常' }, { label: '运输条件', passed: true, message: '运输车辆符合要求' }], checkedAt: '2026-06-09T15:30:00.000Z' },
    ],

    /* ---- 屠宰申报 ---- */
    slaughterApplications: [
      { id: 'slaughter-seed-1', entryCheckId: 'entry-seed-1', applicationNo: 'SL202606090001', quantity: 35, africanSwineFeverResult: 'negative', bannedDrugResult: 'negative', status: 'slaughter_approved', createdAt: '2026-06-09T16:00:00.000Z' },
    ],

    /* ---- 待宰批次 ---- */
    waitingSlaughterBatches: [
      { id: 'wsb-seed-1', entryCheckId: 'entry-seed-1', certificateId: 'cert-seed-arrived', quantity: 35, animalType: '生猪', status: 'post_mortem_checked', createdAt: '2026-06-09T16:00:00.000Z' },
    ],

    /* ---- 宰前查验 ---- */
    anteMortemChecks: [
      { id: 'amc-seed-1', waitingBatchId: 'wsb-seed-1', checkedBy: '官方兽医 王敏', passed: true, status: 'completed', remark: '群体健康状况良好，未见异常', checkedAt: '2026-06-10T06:00:00.000Z' },
    ],

    /* ---- 宰后查验 ---- */
    postMortemChecks: [
      { id: 'pmc-seed-1', waitingBatchId: 'wsb-seed-1', checkedBy: '官方兽医 王敏', qualifiedQuantity: 34, unqualifiedQuantity: 1, productWeight: 3850, status: 'completed', remark: '1 头淋巴结异常已做无害化处理', checkedAt: '2026-06-10T12:00:00.000Z' },
    ],

    /* ---- 产品合格证明 ---- */
    productCertificates: [
      { id: 'pc-seed-1', certificateNo: 'CPCP202606100001', waitingBatchId: 'wsb-seed-1', productName: '鲜猪肉', weight: 3850, issuedBy: '官方兽医 王敏', issuedAt: '2026-06-10T14:00:00.000Z' },
    ],

    /* ---- 肉品品质检验证明 ---- */
    meatQualityCertificates: [
      { id: 'mqc-seed-1', certificateNo: 'RPZJ202606100001', waitingBatchId: 'wsb-seed-1', productName: '鲜猪肉', weight: 3850, inspector: '品质检验员 刘强', issuedAt: '2026-06-10T14:30:00.000Z' },
    ],

    /* ---- 三证合一 ---- */
    threeCertificateLinks: [
      { id: 'tcl-seed-1', waitingBatchId: 'wsb-seed-1', animalCertificateId: 'cert-seed-arrived', productCertificateId: 'pc-seed-1', meatQualityCertificateId: 'mqc-seed-1', linkedAt: '2026-06-10T15:00:00.000Z' },
    ],

    /* ---- 无害化处理 ---- */
    harmlessTasks: [
      { id: 'ht-seed-1', taskNo: 'WHH202606100001', source: 'slaughter_unqualified', sourceId: 'pmc-seed-1', quantity: 1, weight: 105, reason: '宰后检验发现淋巴结异常', status: 'completed', method: '高温化制', processedQuantity: 1, processedWeight: 105, photoCount: 3, operator: '无害化处理员 马国强', completedAt: '2026-06-10T16:00:00.000Z', createdAt: '2026-06-10T12:30:00.000Z' },
    ],

    /* ---- 证章管理 ---- */
    sealRecords: [
      { id: 'seal-seed-001', sealNo: 'QYBZ-2026-0001', action: 'receive', quantity: 500, operator: '证章管理员 周丽', createdAt: '2026-06-01T08:00:00.000Z' },
      { id: 'seal-seed-002', sealNo: 'QYBZ-2026-0002', action: 'issue', quantity: 50, businessNo: 'AH-CD-202606100004', operator: '官方兽医 王敏', createdAt: t2 },
      { id: 'seal-seed-003', sealNo: 'QYBZ-2026-0003', action: 'issue', quantity: 40, businessNo: 'AH-CD-202606100005', operator: '官方兽医 王敏', createdAt: t2 },
      { id: 'seal-seed-004', sealNo: 'QYBZ-2026-0004', action: 'issue', quantity: 35, businessNo: 'AH-CD-202606090006', operator: '官方兽医 王敏', createdAt: '2026-06-09T11:00:00.000Z' },
    ],

    /* ---- 诊疗机构 ---- */
    clinicInstitutions: [
      { id: 'clinic-001', name: '安心动物诊疗中心', licenseNo: 'AH-CZ-2024-0012', address: '安徽省合肥市蜀山区长江西路 189 号', contactPerson: '陈晓宁', phone: '0551-65123456', type: '动物医院', mapPoint: '31.86,117.27', status: 'approved', active: true, createdAt: '2024-03-15T08:00:00.000Z', reviewedAt: '2024-03-20T10:00:00.000Z' },
      { id: 'clinic-002', name: '宠爱有家宠物诊所', licenseNo: 'AH-CZ-2025-0035', address: '安徽省合肥市包河区徽州大道 66 号', contactPerson: '刘婷婷', phone: '0551-63456789', type: '动物诊所', mapPoint: '31.79,117.31', status: 'approved', active: true, createdAt: '2025-01-10T08:00:00.000Z', reviewedAt: '2025-01-15T09:00:00.000Z' },
    ],

    /* ---- 执业兽医 ---- */
    veterinarians: [
      { id: 'vet-001', name: '陈晓宁', certificateNo: 'AH-ZY-2022-0088', practiceType: 'licensed_veterinarian', institutionId: 'clinic-001', practiceScope: '小动物内科、外科', phone: '13855512345', material: '执业兽医师资格证、继续教育合格证明', status: 'approved', active: true, createdAt: '2024-03-15T08:00:00.000Z', reviewedAt: '2024-03-18T10:00:00.000Z' },
      { id: 'vet-002', name: '刘婷婷', certificateNo: 'AH-ZY-2023-0156', practiceType: 'assistant_veterinarian', institutionId: 'clinic-002', practiceScope: '小动物影像、预防医学', phone: '13855567890', material: '执业助理兽医师资格证', status: 'approved', active: true, createdAt: '2025-01-10T08:00:00.000Z', reviewedAt: '2025-01-13T09:00:00.000Z' },
    ],

    /* ---- 宠物主人 ---- */
    petOwners: [
      { id: 'owner-001', name: '李女士', phone: '13955510001', address: '安徽省合肥市蜀山区望江西路 88 号', createdAt: '2025-06-01T10:00:00.000Z', active: true },
      { id: 'owner-002', name: '王先生', phone: '13955510002', address: '安徽省合肥市包河区滨湖新区万达城 12 栋', createdAt: '2025-08-15T14:00:00.000Z', active: true },
      { id: 'owner-003', name: '赵女士', phone: '13955510003', address: '安徽省合肥市庐阳区四里河路 66 号', createdAt: '2026-01-20T09:00:00.000Z', active: true },
    ],

    /* ---- 宠物档案 ---- */
    petProfiles: [
      { id: 'pet-001', ownerId: 'owner-001', name: '豆豆', species: '犬', breed: '金毛寻回犬', gender: '公', age: 3, identityNo: 'AH-PET-2025-00001', createdAt: '2025-06-01T10:00:00.000Z', active: true },
      { id: 'pet-002', ownerId: 'owner-001', name: '咪咪', species: '猫', breed: '英国短毛猫', gender: '母', age: 2, identityNo: 'AH-PET-2025-00002', createdAt: '2025-06-01T10:30:00.000Z', active: true },
      { id: 'pet-003', ownerId: 'owner-002', name: '旺财', species: '犬', breed: '拉布拉多犬', gender: '公', age: 5, identityNo: 'AH-PET-2025-00003', createdAt: '2025-08-15T14:00:00.000Z', active: true },
      { id: 'pet-004', ownerId: 'owner-003', name: '小橘', species: '猫', breed: '中华田园猫', gender: '公', age: 1, identityNo: 'AH-PET-2026-00004', createdAt: '2026-01-20T09:00:00.000Z', active: true },
    ],

    /* ---- 免疫台账 ---- */
    immunizationLedgers: [
      { id: 'imm-001', petId: 'pet-001', vaccineName: '犬瘟热-细小病毒-腺病毒三联苗', vaccineBatchNo: 'VAC-2026-0301', immunizedAt: '2026-03-15T10:00:00.000Z', nextImmunizedAt: '2027-03-15T10:00:00.000Z', veterinarianId: 'vet-001', institutionId: 'clinic-001', status: 'active', createdAt: '2026-03-15T10:00:00.000Z' },
      { id: 'imm-002', petId: 'pet-001', vaccineName: '狂犬病灭活疫苗', vaccineBatchNo: 'VAC-2026-0302', immunizedAt: '2026-03-15T10:30:00.000Z', nextImmunizedAt: '2027-03-15T10:30:00.000Z', veterinarianId: 'vet-001', institutionId: 'clinic-001', status: 'active', createdAt: '2026-03-15T10:30:00.000Z' },
      { id: 'imm-003', petId: 'pet-002', vaccineName: '猫三联疫苗', vaccineBatchNo: 'VAC-2026-0401', immunizedAt: '2026-04-10T14:00:00.000Z', nextImmunizedAt: '2027-04-10T14:00:00.000Z', veterinarianId: 'vet-001', institutionId: 'clinic-001', status: 'active', createdAt: '2026-04-10T14:00:00.000Z' },
      { id: 'imm-004', petId: 'pet-003', vaccineName: '犬瘟热-细小病毒-腺病毒三联苗', vaccineBatchNo: 'VAC-2026-0501', immunizedAt: '2026-05-08T09:00:00.000Z', nextImmunizedAt: '2027-05-08T09:00:00.000Z', veterinarianId: 'vet-002', institutionId: 'clinic-002', status: 'active', createdAt: '2026-05-08T09:00:00.000Z' },
    ],

    /* ---- 药品库存 ---- */
    drugInventories: [
      { id: 'drug-001', institutionId: 'clinic-001', drugName: '阿莫西林克拉维酸钾片', batchNo: 'DRG-2026-0101', manufacturer: '华中制药有限公司', approvalNo: '兽药字（2025）170011256', validTo: '2028-06-01T00:00:00.000Z', quantity: 200, supplier: '安徽兽药配送中心', traceCode: 'AH-TR-2026-0001', active: true, createdAt: '2026-01-15T08:00:00.000Z' },
      { id: 'drug-002', institutionId: 'clinic-001', drugName: '头孢曲松钠注射液', batchNo: 'DRG-2026-0201', manufacturer: '华东动物药业股份有限公司', approvalNo: '兽药字（2025）170022389', validTo: '2027-12-01T00:00:00.000Z', quantity: 50, supplier: '安徽兽药配送中心', traceCode: 'AH-TR-2026-0002', active: true, createdAt: '2026-02-10T08:00:00.000Z' },
      { id: 'drug-003', institutionId: 'clinic-001', drugName: '伊维菌素注射液', batchNo: 'DRG-2026-0301', manufacturer: '中原兽药集团', approvalNo: '兽药字（2024）170033456', validTo: '2027-09-01T00:00:00.000Z', quantity: 80, supplier: '合肥动物保健用品公司', traceCode: 'AH-TR-2026-0003', active: true, createdAt: '2026-03-05T08:00:00.000Z' },
      { id: 'drug-004', institutionId: 'clinic-002', drugName: '甲硝唑片', batchNo: 'DRG-2026-0401', manufacturer: '江淮动物药业', approvalNo: '兽药字（2025）170044512', validTo: '2028-03-01T00:00:00.000Z', quantity: 150, supplier: '安徽兽药配送中心', traceCode: 'AH-TR-2026-0004', active: true, createdAt: '2026-04-01T08:00:00.000Z' },
    ],

    /* ---- 处方笺 ---- */
    prescriptions: [
      { id: 'rx-001', prescriptionNo: 'CF202606010001', petId: 'pet-001', diagnosis: '细菌性皮肤感染', drugId: 'drug-001', drugName: '阿莫西林克拉维酸钾片', dosage: '每次 1 片，每日 2 次', quantity: 14, veterinarianId: 'vet-001', institutionId: 'clinic-001', status: 'active', issuedAt: '2026-06-01T10:30:00.000Z' },
      { id: 'rx-002', prescriptionNo: 'CF202606050002', petId: 'pet-002', diagnosis: '猫上呼吸道感染', drugId: 'drug-002', drugName: '头孢曲松钠注射液', dosage: '0.5ml 皮下注射，每日 1 次', quantity: 3, veterinarianId: 'vet-001', institutionId: 'clinic-001', status: 'active', issuedAt: '2026-06-05T14:30:00.000Z' },
      { id: 'rx-003', prescriptionNo: 'CF202606080003', petId: 'pet-003', diagnosis: '体外寄生虫感染', drugId: 'drug-003', drugName: '伊维菌素注射液', dosage: '0.2ml 皮下注射，单次', quantity: 1, veterinarianId: 'vet-002', institutionId: 'clinic-002', status: 'active', issuedAt: '2026-06-08T09:30:00.000Z' },
    ],

    /* ---- 药品出入库记录 ---- */
    drugInOutRecords: [
      { id: 'dior-001', type: 'in', drugId: 'drug-001', drugName: '阿莫西林克拉维酸钾片', institutionId: 'clinic-001', quantity: 200, operator: '陈晓宁', createdAt: '2026-01-15T08:00:00.000Z' },
      { id: 'dior-002', type: 'out', drugId: 'drug-001', drugName: '阿莫西林克拉维酸钾片', institutionId: 'clinic-001', quantity: 14, relatedId: 'rx-001', operator: '陈晓宁', createdAt: '2026-06-01T10:30:00.000Z' },
      { id: 'dior-003', type: 'in', drugId: 'drug-002', drugName: '头孢曲松钠注射液', institutionId: 'clinic-001', quantity: 50, operator: '陈晓宁', createdAt: '2026-02-10T08:00:00.000Z' },
      { id: 'dior-004', type: 'out', drugId: 'drug-002', drugName: '头孢曲松钠注射液', institutionId: 'clinic-001', quantity: 3, relatedId: 'rx-002', operator: '陈晓宁', createdAt: '2026-06-05T14:30:00.000Z' },
      { id: 'dior-005', type: 'in', drugId: 'drug-003', drugName: '伊维菌素注射液', institutionId: 'clinic-001', quantity: 80, operator: '陈晓宁', createdAt: '2026-03-05T08:00:00.000Z' },
      { id: 'dior-006', type: 'out', drugId: 'drug-003', drugName: '伊维菌素注射液', institutionId: 'clinic-001', quantity: 1, relatedId: 'rx-003', operator: '刘婷婷', createdAt: '2026-06-08T09:30:00.000Z' },
    ],

    /* ---- 医疗废弃物 ---- */
    medicalWasteRecords: [
      { id: 'waste-001', wasteNo: 'YLW202606010001', type: '感染性废物', sourceBusinessType: 'prescription', sourceBusinessId: 'rx-001', weight: 0.5, generatedAt: '2026-06-01T11:00:00.000Z', storageLocation: '安心动物诊疗中心医疗废物暂存间', disposalCompany: '安徽医疗废物处置有限公司', handoverPerson: '陈晓宁', status: 'handled', handledAt: '2026-06-03T09:00:00.000Z', voucherNo: 'VCH-2026-0601-001', createdAt: '2026-06-01T11:00:00.000Z' },
      { id: 'waste-002', wasteNo: 'YLW202606050002', type: '损伤性废物', sourceBusinessType: 'prescription', sourceBusinessId: 'rx-002', weight: 0.2, generatedAt: '2026-06-05T15:00:00.000Z', storageLocation: '安心动物诊疗中心医疗废物暂存间', disposalCompany: '安徽医疗废物处置有限公司', handoverPerson: '陈晓宁', status: 'pending', createdAt: '2026-06-05T15:00:00.000Z' },
    ],

    /* ---- 年度报告 ---- */
    annualReports: [
      { id: 'ar-001', institutionId: 'clinic-001', year: 2025, status: 'submitted', veterinarianCount: 3, petCount: 286, immunizationCount: 412, prescriptionCount: 158, drugStockInQuantity: 1200, drugStockOutQuantity: 856, wasteHandledCount: 24, generatedAt: '2026-01-10T08:00:00.000Z', submittedAt: '2026-01-15T09:00:00.000Z' },
    ],

    /* ---- 同步日志 ---- */
    syncLogs: [
      { id: 'sync-001', target: '省级动物卫生监督平台', status: 'success', businessNo: 'AH-CD-202606100004', businessType: '产地检疫出证', syncedAt: t2, retryCount: 0 },
      { id: 'sync-002', target: '省级动物卫生监督平台', status: 'success', businessNo: 'AH-CD-202606100005', businessType: '产地检疫出证', syncedAt: t2, retryCount: 0 },
      { id: 'sync-003', target: '省级动物卫生监督平台', status: 'success', businessNo: 'AH-CD-202606090006', businessType: '产地检疫出证', syncedAt: '2026-06-09T11:00:00.000Z', retryCount: 0 },
      { id: 'sync-004', target: '全国兽医队伍信息管理系统', status: 'success', businessNo: 'AH-ZY-2022-0088', businessType: '执业兽医备案', syncedAt: '2024-03-18T10:00:00.000Z', retryCount: 0 },
      { id: 'sync-005', target: '省级动物卫生监督平台', status: 'failed', businessNo: 'CDJY202606120002', businessType: '产地检疫申报', syncedAt: t9, failureReason: '网络超时，待自动重试', retryCount: 1 },
    ],

    /* ---- 闭环节点 ---- */
    closedLoopNodes: [
      { id: 'cln-001', nodeName: '产地检疫申报', dataSource: '养殖场户', passed: true, operator: '绿丰生态养殖场', operatedAt: t1, syncStatus: 'success', relatedId: 'origin-seed-issued', summary: '申报 50 头生猪，产地检疫' },
      { id: 'cln-002', nodeName: '官方兽医现场查验', dataSource: '官方兽医', passed: true, operator: '官方兽医 王敏', operatedAt: t10, syncStatus: 'success', relatedId: 'origin-seed-issued', summary: '人证一致，临床检查健康' },
      { id: 'cln-003', nodeName: '检疫出证', dataSource: '官方兽医', passed: true, operator: '官方兽医 王敏', operatedAt: t2, syncStatus: 'success', relatedId: 'cert-seed-issued', summary: '出具动物检疫合格证明 AH-CD-202606100004' },
      { id: 'cln-004', nodeName: '运输监管', dataSource: '运输监管系统', passed: true, operator: '运输监管系统', operatedAt: t12, syncStatus: 'success', relatedId: 'transport-seed-transporting', summary: '车辆皖K·A3189 运输中，轨迹正常' },
      { id: 'cln-005', nodeName: '落地报告', dataSource: '屠宰企业', passed: true, operator: '张长运', operatedAt: '2026-06-09T15:10:00.000Z', syncStatus: 'success', relatedId: 'landing-seed-1', summary: '已到达皖北标准化屠宰中心' },
      { id: 'cln-006', nodeName: '入场查验', dataSource: '屠宰企业', passed: true, operator: '官方兽医 王敏', operatedAt: '2026-06-09T15:30:00.000Z', syncStatus: 'success', relatedId: 'entry-seed-1', summary: '证物相符，动物健康' },
      { id: 'cln-007', nodeName: '屠宰检疫', dataSource: '官方兽医', passed: true, operator: '官方兽医 王敏', operatedAt: '2026-06-10T12:00:00.000Z', syncStatus: 'success', relatedId: 'pmc-seed-1', summary: '宰后检验 34 头合格，1 头异常已无害化处理' },
      { id: 'cln-008', nodeName: '三证合一', dataSource: '屠宰企业', passed: true, operator: '品质检验员 刘强', operatedAt: '2026-06-10T15:00:00.000Z', syncStatus: 'success', relatedId: 'tcl-seed-1', summary: '动物检疫、产品合格、肉品品质三证已关联' },
    ],

    /* ---- 操作日志 ---- */
    operationLogs: [
      { id: 'log-001', actor: '绿丰生态养殖场', role: 'farmer', action: '提交产地检疫申报', target: 'CDJY202606100004：50 头生猪', createdAt: t1 },
      { id: 'log-002', actor: '官方兽医 王敏', role: 'vet', action: '审核通过并出证', target: 'CDJY202606100004：出具 AH-CD-202606100004', createdAt: t2 },
      { id: 'log-003', actor: '绿丰生态养殖场', role: 'farmer', action: '提交产地检疫申报', target: 'CDJY202606100005：40 头生猪', createdAt: t1 },
      { id: 'log-004', actor: '官方兽医 王敏', role: 'vet', action: '审核通过并出证', target: 'CDJY202606100005：出具 AH-CD-202606100005', createdAt: t2 },
      { id: 'log-005', actor: '绿丰生态养殖场', role: 'farmer', action: '提交产地检疫申报', target: 'CDJY202606110003：30 头肉牛', createdAt: t4 },
      { id: 'log-006', actor: '官方兽医 王敏', role: 'vet', action: '驳回产地检疫申报', target: 'CDJY202606110003：目的地详细地址材料不完整', createdAt: t5 },
      { id: 'log-007', actor: '绿丰生态养殖场', role: 'farmer', action: '提交产地检疫申报', target: 'CDJY202606120002：45 头生猪', createdAt: t8 },
      { id: 'log-008', actor: '绿丰生态养殖场', role: 'farmer', action: '保存产地检疫草稿', target: 'CDJY202606120001：60 头生猪', createdAt: t8 },
      { id: 'log-009', actor: '张长运', role: 'slaughter', action: '提交落地报告', target: 'LD202606090001：35 头生猪已到达', createdAt: '2026-06-09T15:10:00.000Z' },
      { id: 'log-010', actor: '官方兽医 王敏', role: 'vet', action: '入场查验通过', target: '皖S·P7726 运载 35 头生猪', createdAt: '2026-06-09T15:30:00.000Z' },
      { id: 'log-011', actor: '官方兽医 王敏', role: 'vet', action: '宰后检验完成', target: '34 头合格，1 头异常已无害化处理', createdAt: '2026-06-10T12:00:00.000Z' },
      { id: 'log-012', actor: '陈晓宁', role: 'practicing_vet', action: '开具处方', target: 'CF202606010001：豆豆 细菌性皮肤感染', createdAt: '2026-06-01T10:30:00.000Z' },
      { id: 'log-013', actor: '陈晓宁', role: 'practicing_vet', action: '开具处方', target: 'CF202606050002：咪咪 猫上呼吸道感染', createdAt: '2026-06-05T14:30:00.000Z' },
    ],

    /* ---- 预警记录 ---- */
    alerts: [
      { id: 'alert-001', level: 'warning', type: '承运人异常', message: '承运人刘某（皖A·X4091）命中黑名单，已被限制承运动物', relatedId: 'vehicle-003', resolved: true, createdAt: t13 },
      { id: 'alert-002', level: 'danger', type: '运输偏离', message: '车辆皖K·A3189 运输途中偏离指定路线 2.3 公里，已通知承运人', relatedId: 'transport-seed-transporting', resolved: false, createdAt: t12 },
      { id: 'alert-003', level: 'info', type: '免疫到期提醒', message: '双河合作社湖羊批次强制免疫即将到期，请及时补免', relatedId: 'batch-003', resolved: false, createdAt: t7 },
      { id: 'alert-004', level: 'warning', type: '数据同步异常', message: '产地检疫申报 CDJY202606120002 同步至省级平台失败，待自动重试', relatedId: 'origin-seed-submitted', resolved: false, createdAt: t9 },
    ],

    /* ---- 取证附件 ---- */
    inspectionAttachments: [
      { id: 'att-seed-1', applicationNo: 'CDJY202606120002', type: 'vehicle_photo', typeName: '车辆照片', fileName: '车辆外观_皖KA3189.jpg', fileSize: 204800, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-12T09:15:00.000Z' },
      { id: 'att-seed-2', applicationNo: 'CDJY202606120002', type: 'ear_tag_photo', typeName: '耳标照片', fileName: '耳标特写_AH-LF-2026-1001.jpg', fileSize: 153600, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-12T09:18:00.000Z' },
      { id: 'att-seed-3', applicationNo: 'CDJY202606120002', type: 'loading_photo', typeName: '装载照片', fileName: '装载情况_生猪装车.jpg', fileSize: 256000, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-12T09:22:00.000Z' },
      { id: 'att-seed-4', applicationNo: 'CDJY202606120002', type: 'scene_photo', typeName: '现场照片', fileName: '现场查验全景.jpg', fileSize: 307200, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-12T09:25:00.000Z' },
      { id: 'att-seed-5', applicationNo: 'CDJY202606120002', type: 'other', typeName: '其他材料', fileName: '养殖场动物健康声明.pdf', fileSize: 89600, fileType: 'application/pdf', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-12T09:28:00.000Z' },
      { id: 'att-seed-6', applicationNo: 'CDJY202606100004', type: 'vehicle_photo', typeName: '车辆照片', fileName: '车辆外观_皖KA3189.jpg', fileSize: 204800, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-10T10:20:00.000Z' },
      { id: 'att-seed-7', applicationNo: 'CDJY202606100004', type: 'ear_tag_photo', typeName: '耳标照片', fileName: '耳标特写_AH-LF-2026-1001.jpg', fileSize: 153600, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-10T10:22:00.000Z' },
      { id: 'att-seed-8', applicationNo: 'CDJY202606100004', type: 'loading_photo', typeName: '装载照片', fileName: '装载情况_生猪装车.jpg', fileSize: 256000, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-10T10:25:00.000Z' },
      { id: 'att-seed-9', applicationNo: 'CDJY202606100004', type: 'scene_photo', typeName: '现场照片', fileName: '现场查验全景.jpg', fileSize: 307200, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-10T10:28:00.000Z' },
      { id: 'att-seed-10', applicationNo: 'CDJY202606100005', type: 'vehicle_photo', typeName: '车辆照片', fileName: '车辆外观_皖KA3189.jpg', fileSize: 204800, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-10T10:35:00.000Z' },
      { id: 'att-seed-11', applicationNo: 'CDJY202606100005', type: 'ear_tag_photo', typeName: '耳标照片', fileName: '耳标特写_AH-LF-2026.jpg', fileSize: 153600, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-10T10:38:00.000Z' },
      { id: 'att-seed-12', applicationNo: 'CDJY202606100005', type: 'loading_photo', typeName: '装载照片', fileName: '装载情况_生猪装车.jpg', fileSize: 256000, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-10T10:40:00.000Z' },
      { id: 'att-seed-13', applicationNo: 'CDJY202606100005', type: 'scene_photo', typeName: '现场照片', fileName: '现场查验全景.jpg', fileSize: 307200, fileType: 'image/jpeg', uploadedBy: '官方兽医 王敏', uploadedAt: '2026-06-10T10:42:00.000Z' },
    ],
  }
}
