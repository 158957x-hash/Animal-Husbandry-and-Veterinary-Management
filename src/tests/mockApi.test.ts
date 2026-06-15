import { beforeEach, describe, expect, it } from 'vitest'
import { mockApi } from '../api/mockApi'

describe('mockApi 检疫屠宰闭环', () => {
  beforeEach(async () => {
    await mockApi.restoreInitialData()
  })

  it('完成产地申报、出证、运输、入场、屠宰申报和产品出证闭环', async () => {
    const data = await mockApi.getBootstrapData()
    const batch = data.farmBatches[0]
    const vehicle = data.vehicles.find((item) => item.registered && !item.blacklisted)

    expect(vehicle).toBeTruthy()

    const origin = await mockApi.submitOriginApplication({
      batchId: batch.id,
      quantity: 60,
      destination: '皖北标准化屠宰中心',
      destinationAddress: '安徽省亳州市利辛县屠宰加工园区 1 号',
      purpose: 'slaughter',
      departureTime: '2026-06-13T08:00:00.000Z',
      contactPerson: '王场长',
      contactPhone: '13900002222',
      remark: '闭环测试',
      vehicleId: vehicle!.id,
    })

    expect(origin.status).toBe('submitted')
    expect(origin.validationResults.every((item) => item.passed)).toBe(true)

    const certificate = await mockApi.approveOriginApplication(origin.id, {
      faceRecognitionPassed: true,
      siteInspectionPassed: true,
      evidencePhotoCount: 3,
      remark: '现场查验合格',
    })

    expect(certificate.quantity).toBe(60)

    const afterOrigin = await mockApi.getBootstrapData()
    const updatedBatch = afterOrigin.farmBatches.find((item) => item.id === batch.id)
    const task = afterOrigin.transportTasks.find((item) => item.certificateId === certificate.id)

    expect(updatedBatch?.stock).toBe(batch.stock - 60)
    expect(task?.status).toBe('transporting')

    const entry = await mockApi.performEntryCheck({
      query: certificate.certificateNo,
      actualQuantity: 60,
      channel: vehicle!.channel,
    })

    expect(entry.status).toBe('entry_passed')

    const slaughter = await mockApi.submitSlaughterApplication({
      entryCheckId: entry.id,
      quantity: 60,
      africanSwineFeverResult: 'negative',
      bannedDrugResult: 'negative',
    })

    expect(slaughter.status).toBe('pending_accept')

    const product = await mockApi.approveSlaughterApplication(slaughter.id, {
      anteMortemPassed: true,
      postMortemPassed: true,
      productName: '白条猪肉',
      weight: 4800,
      remark: '检疫合格',
    })

    expect(product.certificateNo).toContain('CP')

    const finalData = await mockApi.getBootstrapData()
    expect(finalData.productCertificates.length).toBeGreaterThanOrEqual(1)
    expect(finalData.operationLogs.length).toBeGreaterThan(5)
  })
})
