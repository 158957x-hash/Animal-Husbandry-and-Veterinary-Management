import { beforeEach, describe, expect, it } from 'vitest'
import { mockApi } from '../api/mockApi'

async function setupClinicFlow() {
  await mockApi.restoreInitialData()
  const clinic = await mockApi.submitClinicInstitution({
    name: '安心动物诊疗中心',
    licenseNo: '皖动诊许第2026001号',
    address: '安徽省合肥市包河区徽州大道 188 号',
    contactPerson: '周院长',
    phone: '0551-66889900',
    type: '动物诊所',
    mapPoint: '117.29,31.82',
  })
  const approvedClinic = await mockApi.reviewClinicInstitution(clinic.id, true, '材料齐全，准予备案')
  const veterinarian = await mockApi.submitVeterinarian({
    name: '陈晓宁',
    certificateNo: 'VET-AH-2026-001',
    practiceType: 'licensed_veterinarian',
    institutionId: approvedClinic.id,
    practiceScope: '犬猫诊疗、免疫接种、处方开具',
    phone: '13900001111',
    material: '执业兽医资格证、劳动合同、身份证明',
  })
  const approvedVet = await mockApi.reviewVeterinarian(veterinarian.id, true, '人员资质有效')
  const owner = await mockApi.createPetOwner({ name: '李女士', phone: '13800000001', address: '合肥市蜀山区望江西路' })
  const pet = await mockApi.createPetProfile({ ownerId: owner.id, name: '豆包', species: '犬', breed: '柯基', gender: '雄性', age: 2, weight: 5, identityNo: 'IMM-AH-0001' })
  const drug = await mockApi.stockInDrug({ institutionId: approvedClinic.id, drugName: '阿莫西林克拉维酸钾片', specification: '250mg×24片', batchNo: 'DRUG202606', unit: '盒', manufacturer: '安徽动物药业有限公司', approvalNo: '兽药字120102001', validTo: '2028-06-30', quantity: 80, storageLocation: '门诊药房A柜', supplier: '省级兽药配送中心', traceCode: 'TRACE-AH-DRUG-001' })
  return { clinic: approvedClinic, veterinarian: approvedVet, owner, pet, drug }
}

describe('页面交互规范化 CRUD 业务规则', () => {
  beforeEach(async () => {
    await mockApi.restoreInitialData()
  })

  it('支持基础资料编辑并阻断已引用宠物物理删除', async () => {
    const { pet, veterinarian, clinic } = await setupClinicFlow()
    const updatedPet = await mockApi.updatePetProfile(pet.id, { name: '豆包更新', age: 3 })
    await mockApi.createImmunizationRecord({ petId: updatedPet.id, vaccineName: '犬六联疫苗', vaccineBatchNo: 'VAC202606', immunizedAt: '2026-06-12', nextImmunizedAt: '2027-06-12', veterinarianId: veterinarian.id, institutionId: clinic.id })

    await expect(mockApi.deletePetProfile(updatedPet.id)).rejects.toThrow('该宠物档案已被业务引用，不能删除')
    const disabled = await mockApi.disablePetProfile(updatedPet.id)
    const data = await mockApi.getBootstrapData()

    expect(disabled.active).toBe(false)
    expect(data.petProfiles.find((item) => item.id === updatedPet.id)?.name).toBe('豆包更新')
    expect(data.operationLogs.some((item) => item.action === '停用宠物档案')).toBe(true)
  })

  it('处方作废后生成冲销出库记录并回补库存', async () => {
    const { pet, veterinarian, drug } = await setupClinicFlow()
    const prescription = await mockApi.issuePrescription({ petId: pet.id, diagnosis: '皮肤细菌感染', drugId: drug.id, dosage: '每日两次', quantity: 6, veterinarianId: veterinarian.id })
    const voided = await mockApi.voidPrescription(prescription.id, '处方录入错误')
    const data = await mockApi.getBootstrapData()

    expect(voided.status).toBe('voided')
    expect(data.drugInventories.find((item) => item.id === drug.id)?.quantity).toBe(80)
    expect(data.drugInOutRecords.some((item) => item.type === 'reversal' && item.relatedId === prescription.id)).toBe(true)
    expect(data.operationLogs.some((item) => item.action === '作废处方笺')).toBe(true)
  })

  it('年度报告提交后可撤回并写入操作日志', async () => {
    const { clinic } = await setupClinicFlow()
    const report = await mockApi.generateAnnualReport(clinic.id, 2026)
    const submitted = await mockApi.submitAnnualReport(report.id)
    const withdrawn = await mockApi.withdrawAnnualReport(submitted.id, '机构补充药品台账后重新提交')
    const data = await mockApi.getBootstrapData()

    expect(withdrawn.status).toBe('withdrawn')
    expect(data.operationLogs.some((item) => item.action === '撤回年度报告')).toBe(true)
  })

  it('支持宠物主人编辑删除并阻断已关联主人删除', async () => {
    const { owner } = await setupClinicFlow()
    const updated = await mockApi.updatePetOwner(owner.id, { address: '合肥市政务区潜山路' })

    await expect(mockApi.deletePetOwner(owner.id)).rejects.toThrow('该宠物主人已关联宠物档案，不能删除')
    const data = await mockApi.getBootstrapData()

    expect(updated.address).toBe('合肥市政务区潜山路')
    expect(data.operationLogs.some((item) => item.action === '编辑宠物主人档案')).toBe(true)
  })

  it('支持药品基础信息编辑和停用并写入日志', async () => {
    const { drug } = await setupClinicFlow()
    const updated = await mockApi.updateDrugInventory(drug.id, { supplier: '省级兽药配送中心更新', validTo: '2029-06-30' })
    const disabled = await mockApi.disableDrugInventory(updated.id)
    const data = await mockApi.getBootstrapData()

    expect(updated.supplier).toBe('省级兽药配送中心更新')
    expect(disabled.active).toBe(false)
    expect(data.operationLogs.some((item) => item.action === '编辑药品基础信息')).toBe(true)
    expect(data.operationLogs.some((item) => item.action === '停用药品')).toBe(true)
  })

  it('支持免疫记录作废并保留台账', async () => {
    const { pet, veterinarian, clinic } = await setupClinicFlow()
    const record = await mockApi.createImmunizationRecord({ petId: pet.id, vaccineName: '犬六联疫苗', vaccineBatchNo: 'VAC202606', immunizedAt: '2026-06-12', nextImmunizedAt: '2027-06-12', veterinarianId: veterinarian.id, institutionId: clinic.id })
    const voided = await mockApi.voidImmunizationRecord(record.id, '疫苗批号录入错误')
    const data = await mockApi.getBootstrapData()

    expect(voided.status).toBe('voided')
    expect(data.immunizationLedgers.some((item) => item.id === record.id)).toBe(true)
    expect(data.operationLogs.some((item) => item.action === '作废免疫记录')).toBe(true)
  })

  it('支持废弃物待处理记录编辑和作废，已处理记录禁止作废', async () => {
    const { pet, veterinarian, clinic } = await setupClinicFlow()
    const record = await mockApi.createImmunizationRecord({ petId: pet.id, vaccineName: '犬六联疫苗', vaccineBatchNo: 'VAC202606', immunizedAt: '2026-06-12', nextImmunizedAt: '2027-06-12', veterinarianId: veterinarian.id, institutionId: clinic.id })
    const waste = await mockApi.createMedicalWaste({ type: '疫苗瓶及注射器', sourceBusinessType: 'immunization', sourceBusinessId: record.id, weight: 1.2, generatedAt: '2026-06-12T10:00:00.000Z', storageLocation: '暂存柜 A', disposalCompany: '合肥绿安医疗废弃物处置有限公司', handoverPerson: '王护士' })
    const updated = await mockApi.updateMedicalWaste(waste.id, { storageLocation: '暂存柜 B', weight: 1.5 })
    const voided = await mockApi.voidMedicalWaste(updated.id, '登记重复')
    const handled = await mockApi.createMedicalWaste({ type: '处方包装废弃物', sourceBusinessType: 'immunization', sourceBusinessId: record.id, weight: 0.6, generatedAt: '2026-06-12T11:00:00.000Z', storageLocation: '暂存柜 C', disposalCompany: '合肥绿安医疗废弃物处置有限公司', handoverPerson: '王护士' })
    await mockApi.completeMedicalWaste({ wasteId: handled.id, handledAt: '2026-06-12T12:00:00.000Z', handlingMethod: '高温焚烧', voucherNo: 'WASTE-001' })

    await expect(mockApi.voidMedicalWaste(handled.id, '处理完成后作废')).rejects.toThrow('已处理废弃物记录不能作废')
    const data = await mockApi.getBootstrapData()

    expect(voided.status).toBe('voided')
    expect(data.operationLogs.some((item) => item.action === '编辑诊疗废弃物记录')).toBe(true)
    expect(data.operationLogs.some((item) => item.action === '作废诊疗废弃物记录')).toBe(true)
  })
})
