import { beforeEach, describe, expect, it } from 'vitest'
import { mockApi } from '../api/mockApi'

describe('mockApi 检疫屠宰闭环', () => {
  beforeEach(async () => {
    await mockApi.restoreInitialData()
  })

  it('手动提交产地检疫申报后同步生成现场查验取证附件', async () => {
    const data = await mockApi.getBootstrapData()
    const batch = data.farmBatches[0]
    const vehicle = data.vehicles.find((item) => item.registered && !item.blacklisted)

    expect(vehicle).toBeTruthy()

    const origin = await mockApi.submitOriginApplication({
      batchId: batch.id,
      quantity: 50,
      destination: '皖北标准化屠宰中心',
      destinationAddress: '安徽省亳州市利辛县屠宰加工园区 1 号',
      purpose: 'slaughter',
      departureTime: '2026-06-13T08:00:00.000Z',
      contactPerson: '王场长',
      contactPhone: '13900002222',
      remark: '附件兜底测试',
      vehicleId: vehicle!.id,
    })

    const afterSubmit = await mockApi.getBootstrapData()
    const attachments = afterSubmit.inspectionAttachments.filter((item) => item.applicationNo === origin.applicationNo)

    expect(attachments.length).toBeGreaterThanOrEqual(1)
    expect(attachments.map((item) => item.type)).toContain('scene_photo')
  })

  it('产地检疫出证后同步生成待查验入场数据', async () => {
    const data = await mockApi.getBootstrapData()
    const batch = data.farmBatches[0]
    const vehicle = data.vehicles.find((item) => item.registered && !item.blacklisted)

    expect(vehicle).toBeTruthy()

    const origin = await mockApi.submitOriginApplication({
      batchId: batch.id,
      quantity: 50,
      destination: '皖北标准化屠宰中心',
      destinationAddress: '安徽省亳州市利辛县屠宰加工园区 1 号',
      purpose: 'slaughter',
      departureTime: '2026-06-13T08:00:00.000Z',
      contactPerson: '王场长',
      contactPhone: '13900002222',
      remark: '入场待查验测试',
      vehicleId: vehicle!.id,
    })

    const certificate = await mockApi.approveOriginApplication(origin.id, {
      faceRecognitionPassed: true,
      siteInspectionPassed: true,
      evidencePhotoCount: 3,
      remark: '现场查验合格',
    })

    const afterApprove = await mockApi.getBootstrapData()
    const entry = afterApprove.slaughterEntryRecords.find((item) => item.quarantineCertificateId === certificate.id)

    expect(entry?.status).toBe('pending_check')
    expect(entry?.checkResults).toEqual([])
    expect(entry?.quantity).toBe(certificate.quantity)
  })

  it('确认入场后生成待宰批次和屠宰批次并允许屠宰检疫申报选择', async () => {
    const data = await mockApi.getBootstrapData()
    const batch = data.farmBatches[0]
    const vehicle = data.vehicles.find((item) => item.registered && !item.blacklisted)

    expect(vehicle).toBeTruthy()

    const origin = await mockApi.submitOriginApplication({
      batchId: batch.id,
      quantity: 40,
      destination: '皖北标准化屠宰中心',
      destinationAddress: '安徽省亳州市利辛县屠宰加工园区 1 号',
      purpose: 'slaughter',
      departureTime: '2026-06-13T08:00:00.000Z',
      contactPerson: '王场长',
      contactPhone: '13900002222',
      remark: '入场办理联动测试',
      vehicleId: vehicle!.id,
    })

    const certificate = await mockApi.approveOriginApplication(origin.id, {
      faceRecognitionPassed: true,
      siteInspectionPassed: true,
      evidencePhotoCount: 3,
      remark: '现场查验合格',
    })

    const afterApprove = await mockApi.getBootstrapData()
    const entry = afterApprove.slaughterEntryRecords.find((item) => item.quarantineCertificateId === certificate.id)

    expect(entry).toBeTruthy()

    const confirmed = await mockApi.confirmSlaughterEntry(entry!.id, {
      actualQuantity: 40,
      waitingPenNo: 'A-12',
      actualVehiclePlateNo: vehicle!.plateNo,
      vehicleArrived: true,
      quantityMatched: true,
      earTagMatched: true,
      clinicalNormal: true,
      deathCount: 0,
      abnormalCount: 0,
      loadingNormal: true,
      sceneRemark: '现场核对无异常',
      operator: '屠宰经办人 李强',
      phone: '13900008888',
      entryTime: '2026-06-13T10:00:00.000Z',
      opinion: '准予入场',
      attachments: [
        { type: 'vehicle_photo', typeName: '车辆入场照片', fileName: 'vehicle.jpg', fileSize: 120000, fileType: 'image/jpeg', uploadedBy: '屠宰经办人 李强' },
      ],
    })

    expect(confirmed.status).toBe('entry_passed')
    expect(confirmed.actualQuantity).toBe(40)
    expect(confirmed.waitingPenNo).toBe('A-12')

    const finalData = await mockApi.getBootstrapData()
    const waitingBatch = finalData.slaughterBatches.find((item) => item.entryRecordId === confirmed.id)
    const legacyWaitingBatch = finalData.waitingSlaughterBatches.find((item) => item.entryCheckId === confirmed.id)
    const updatedCertificate = finalData.quarantineCertificates.find((item) => item.id === certificate.id)
    const attachments = finalData.inspectionAttachments.filter((item) => item.applicationNo === confirmed.entryNo)

    expect(waitingBatch?.status).toBe('pending_slaughter_apply')
    expect(waitingBatch?.waitingPenNo).toBe('A-12')
    expect(legacyWaitingBatch?.status).toBe('waiting_slaughter')
    expect(updatedCertificate?.entryUsageStatus).toBe('used')
    expect(attachments.map((item) => item.type)).toContain('vehicle_photo')
  })

  it('检疫验讫标志申领和退回审核可以驳回', async () => {
    const apply = await mockApi.applyQuarantineMarks({
      markType: 'card_ring',
      quantity: 20,
      reason: '生产补充申领',
      appliedBy: '屠宰经办人',
    })

    const rejectedApply = await mockApi.rejectQuarantineMarkApplication(apply.id, '申领数量与近期屠宰计划不匹配')
    expect(rejectedApply.status).toBe('rejected')

    const returnApply = await mockApi.applyQuarantineMarkReturn({
      markType: 'card_ring',
      quantity: 5,
      reason: '破损退回',
      appliedBy: '屠宰经办人',
    })

    const rejectedReturn = await mockApi.rejectQuarantineMarkApplication(returnApply.id, '退回标志编号范围不清晰')
    expect(rejectedReturn.status).toBe('return_rejected')

    const finalData = await mockApi.getBootstrapData()
    expect(finalData.quarantineMarkIssueOrders.some((item) => item.applicationId === apply.id)).toBe(false)
    expect(finalData.quarantineMarkReturnOrders.some((item) => item.applicationId === returnApply.id)).toBe(false)
  })
})
