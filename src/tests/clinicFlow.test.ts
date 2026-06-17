import { beforeEach, describe, expect, it } from 'vitest'
import { mockApi } from '../api/mockApi'

describe('动物诊疗管理闭环', () => {
  beforeEach(async () => {
    await mockApi.restoreInitialData()
  })

  async function createApprovedClinicAndVet() {
    const clinic = await mockApi.submitClinicInstitution({
      name: '安心动物诊疗中心',
      licenseNo: '皖动诊许第2026001号',
      address: '安徽省合肥市包河区徽州大道 188 号',
      contactPerson: '周院长',
      phone: '0551-66889900',
      type: '动物诊所',
      mapPoint: '117.29,31.82',
    })
    await mockApi.reviewClinicInstitution(clinic.id, true, '材料齐全，准予备案')
    const veterinarian = await mockApi.submitVeterinarian({
      name: '陈晓宁',
      certificateNo: 'VET-AH-2026-001',
      practiceType: 'licensed_veterinarian',
      institutionId: clinic.id,
      practiceScope: '犬猫诊疗、免疫接种、处方开具',
      phone: '13900001111',
      material: '执业兽医资格证、劳动合同、身份证明',
    })
    await mockApi.reviewVeterinarian(veterinarian.id, true, '人员资质有效')
    return { clinic: (await mockApi.getBootstrapData()).clinicInstitutions[0], veterinarian: (await mockApi.getBootstrapData()).veterinarians[0] }
  }

  it('完成诊疗机构备案到年度报告提交的完整数据流', async () => {
    const { clinic, veterinarian } = await createApprovedClinicAndVet()
    const owner = await mockApi.createPetOwner({ name: '李女士', phone: '13800000001', address: '合肥市蜀山区望江西路' })
    const pet = await mockApi.createPetProfile({ ownerId: owner.id, name: '豆包', species: '犬', breed: '柯基', gender: '雄性', age: 2, weight: 5, identityNo: 'IMM-AH-0001' })
    const immunization = await mockApi.createImmunizationRecord({ petId: pet.id, vaccineName: '犬六联疫苗', vaccineBatchNo: 'VAC202606', immunizedAt: '2026-06-12', nextImmunizedAt: '2027-06-12', veterinarianId: veterinarian.id, institutionId: clinic.id })
    const drug = await mockApi.stockInDrug({ institutionId: clinic.id, drugName: '阿莫西林克拉维酸钾片', specification: '250mg×24片', batchNo: 'DRUG202606', unit: '盒', manufacturer: '安徽动物药业有限公司', approvalNo: '兽药字120102001', validTo: '2028-06-30', quantity: 80, storageLocation: '门诊药房A柜', supplier: '省级兽药配送中心', traceCode: 'TRACE-AH-DRUG-001' })
    const prescription = await mockApi.issuePrescription({ petId: pet.id, diagnosis: '皮肤细菌感染', drugId: drug.id, dosage: '每日两次，每次半片，连用 5 日', quantity: 6, veterinarianId: veterinarian.id })
    const waste = await mockApi.createMedicalWaste({ type: '疫苗瓶及注射器', sourceBusinessType: 'immunization', sourceBusinessId: immunization.id, weight: 1.2, generatedAt: '2026-06-12T10:00:00.000Z', storageLocation: '诊疗中心医疗废弃物暂存柜', disposalCompany: '合肥绿安医疗废弃物处置有限公司', handoverPerson: '王护士' })
    await mockApi.completeMedicalWaste({ wasteId: waste.id, handledAt: '2026-06-12T16:00:00.000Z', voucherNo: 'WASTE-20260612-001' })
    const report = await mockApi.generateAnnualReport(clinic.id, 2026)
    const submitted = await mockApi.submitAnnualReport(report.id)
    const data = await mockApi.getBootstrapData()

    expect(submitted.status).toBe('pending')
    expect(submitted.veterinarianCount).toBe(1)
    expect(submitted.petCount).toBeGreaterThanOrEqual(1)
    expect(submitted.immunizationCount).toBeGreaterThanOrEqual(1)
    expect(submitted.prescriptionCount).toBeGreaterThanOrEqual(1)
    expect(submitted.drugStockInQuantity).toBe(80)
    expect(submitted.drugStockOutQuantity).toBe(6)
    expect(submitted.wasteHandledCount).toBeGreaterThanOrEqual(1)
    expect(data.drugInventories.find((item) => item.id === drug.id)?.quantity).toBe(74)
    expect(data.drugInOutRecords.some((item) => item.type === 'out' && item.relatedId === prescription.id)).toBe(true)
    expect(data.operationLogs.length).toBeGreaterThanOrEqual(10)
  })

  it('阻断未备案通过兽医开具处方', async () => {
    const { clinic } = await createApprovedClinicAndVet()
    const blockedVet = await mockApi.submitVeterinarian({
      name: '未审兽医',
      certificateNo: 'VET-AH-2026-999',
      practiceType: 'assistant_veterinarian',
      institutionId: clinic.id,
      practiceScope: '犬猫诊疗',
      phone: '13900009999',
      material: '待审核材料',
    })
    const owner = await mockApi.createPetOwner({ name: '张先生', phone: '13800000002', address: '合肥市庐阳区' })
    const pet = await mockApi.createPetProfile({ ownerId: owner.id, name: '雪球', species: '猫', breed: '英短', gender: '雌性', age: 1, weight: 3.5, identityNo: 'IMM-AH-0002' })
    const drug = await mockApi.stockInDrug({ institutionId: clinic.id, drugName: '宠物益生菌', specification: '5g×30袋', batchNo: 'DRUG202607', unit: '盒', manufacturer: '安徽动物药业有限公司', approvalNo: '兽药字120102002', validTo: '2028-07-30', quantity: 20, storageLocation: '门诊药房A柜', supplier: '省级兽药配送中心', traceCode: 'TRACE-AH-DRUG-002' })

    await expect(mockApi.issuePrescription({ petId: pet.id, diagnosis: '肠胃不适', drugId: drug.id, dosage: '每日一次', quantity: 2, veterinarianId: blockedVet.id })).rejects.toThrow('未备案通过的执业兽医不能开具处方')
  })

  it('按库位拆分选择出库并只保留待出库和已出库状态', async () => {
    const { clinic } = await createApprovedClinicAndVet()
    const owner = await mockApi.createPetOwner({ name: '钱女士', phone: '13800000004', address: '合肥市包河区' })
    const pet = await mockApi.createPetProfile({ ownerId: owner.id, name: '奶茶', species: '犬', breed: '比熊', gender: '雌性', age: 2, weight: 4.8, identityNo: 'IMM-AH-0004' })
    const drugA = await mockApi.stockInDrug({ institutionId: clinic.id, drugName: '阿莫西林克拉维酸钾片', specification: '250mg×24片', batchNo: 'DRUG-POS-001', unit: '盒', manufacturer: '安徽动物药业有限公司', approvalNo: '兽药字120102006', validTo: '2028-06-30', quantity: 4, supplier: '省级兽药配送中心', traceCode: 'TRACE-AH-DRUG-006A', storageLocation: '门诊药房A柜' })
    const drugB = await mockApi.stockInDrug({ institutionId: clinic.id, drugName: '阿莫西林克拉维酸钾片', specification: '250mg×24片', batchNo: 'DRUG-POS-001', unit: '盒', manufacturer: '安徽动物药业有限公司', approvalNo: '兽药字120102006', validTo: '2028-06-30', quantity: 6, supplier: '省级兽药配送中心', traceCode: 'TRACE-AH-DRUG-006B', storageLocation: '常温库B架' })
    const consultation = await mockApi.createConsultation({ petId: pet.id, chiefComplaint: '皮肤瘙痒', initialSymptoms: '局部红肿', weight: pet.weight })
    await mockApi.confirmConsultation(consultation.id)
    await mockApi.saveTreatmentRecord(consultation.id, { temperature: 38.5, weight: pet.weight, mentalState: '良好', appetite: '正常', clinicalSymptoms: '皮肤局部红肿', checkItems: '皮肤检查', checkResult: '轻度感染', preliminaryDiagnosis: '皮肤感染', finalDiagnosis: '皮肤细菌感染', treatmentOpinion: '口服抗菌药', needFollowUp: false, followUpTime: '', medicalAdvice: '按时服药' })
    await mockApi.createConsultationPrescription({ consultationId: consultation.id, diagnosis: '皮肤细菌感染', needDispensing: true, items: [{ drugId: drugA.id, drugName: drugA.drugName, specification: drugA.specification, batchNo: drugA.batchNo, unit: drugA.unit, currentStock: 10, singleDose: '半片', frequency: 'BID（每日2次）', days: 5, quantity: 6, administration: '口服', notes: '饭后服用' }] })
    const dataAfterPrescription = await mockApi.getBootstrapData()
    const requisition = dataAfterPrescription.drugRequisitions.find((item) => item.consultationId === consultation.id)!

    expect(requisition.status).toBe('pending_outbound')
    expect(dataAfterPrescription.drugRequisitions.every((item) => item.status === 'pending_outbound' || item.status === 'outbound')).toBe(true)
    await expect(mockApi.processDrugOutbound(requisition.id, [{ requisitionItemKey: `${drugA.drugName}|${drugA.specification}|${drugA.batchNo}|${drugA.unit}`, drugInventoryId: drugA.id, quantity: 4 }])).rejects.toThrow('选择出库数量必须等于领用数量')

    const outbound = await mockApi.processDrugOutbound(requisition.id, [
      { requisitionItemKey: `${drugA.drugName}|${drugA.specification}|${drugA.batchNo}|${drugA.unit}`, drugInventoryId: drugA.id, quantity: 4 },
      { requisitionItemKey: `${drugA.drugName}|${drugA.specification}|${drugA.batchNo}|${drugA.unit}`, drugInventoryId: drugB.id, quantity: 2 },
    ])
    const data = await mockApi.getBootstrapData()

    expect(outbound.status).toBe('outbound')
    expect(data.drugInventories.find((item) => item.id === drugA.id)?.quantity).toBe(0)
    expect(data.drugInventories.find((item) => item.id === drugB.id)?.quantity).toBe(4)
  })
})
