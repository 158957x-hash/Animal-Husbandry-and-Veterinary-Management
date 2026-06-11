import { beforeEach, describe, expect, it } from 'vitest'
import { mockApi } from '../api/mockApi'

describe('扩展检疫屠宰监管闭环', () => {
  beforeEach(async () => {
    await mockApi.restoreInitialData()
  })

  async function createIssuedTransport() {
    const data = await mockApi.getBootstrapData()
    const batch = data.farmBatches[0]
    const vehicle = data.vehicles[0]
    const origin = await mockApi.submitOriginApplication({
      batchId: batch.id,
      quantity: 50,
      destination: '皖北标准化屠宰中心',
      vehicleId: vehicle.id,
    })
    const certificate = await mockApi.approveOriginApplication(origin.id, {
      faceRecognitionPassed: true,
      siteInspectionPassed: true,
      evidencePhotoCount: 3,
      remark: '扩展闭环测试出证',
    })
    const afterIssue = await mockApi.getBootstrapData()
    const transport = afterIssue.transportTasks.find((item) => item.certificateId === certificate.id)
    expect(transport).toBeTruthy()
    return { certificate, transport: transport! }
  }

  it('提交正常落地报告后生成同步日志和闭环节点', async () => {
    const { transport } = await createIssuedTransport()

    const landing = await mockApi.submitLandingReport({
      transportTaskId: transport.id,
      actualDestination: '皖北标准化屠宰中心',
      reporter: '屠宰企业门岗',
      arrivedAt: new Date().toISOString(),
    })

    expect(landing.status).toBe('submitted')
    expect(landing.onDestination).toBe(true)
    expect(landing.overdue).toBe(false)

    const data = await mockApi.getBootstrapData()
    expect(data.syncLogs.some((item) => item.businessNo === landing.reportNo)).toBe(true)
    expect(data.closedLoopNodes.some((item) => item.nodeName === '落地报告')).toBe(true)
  })

  it('运输异常会生成预警并加入承运限制名单', async () => {
    const { transport, certificate } = await createIssuedTransport()

    await mockApi.markTransportException({
      transportTaskId: transport.id,
      type: 'route_deviation',
      message: '车辆偏离申报路线 12 公里',
    })

    const data = await mockApi.getBootstrapData()
    const restriction = data.carrierRestrictions.find((item) => item.certificateId === certificate.id)

    expect(restriction?.status).toBe('restricted')
    expect(data.alerts.some((item) => item.type === '轨迹偏离')).toBe(true)
    expect(data.syncLogs.some((item) => item.businessNo === certificate.certificateNo)).toBe(true)
  })

  it('屠宰全过程生成产品证、肉品品质证、三证关联和证章使用记录', async () => {
    const { certificate, transport } = await createIssuedTransport()
    await mockApi.submitLandingReport({
      transportTaskId: transport.id,
      actualDestination: '皖北标准化屠宰中心',
      reporter: '屠宰企业门岗',
      arrivedAt: new Date().toISOString(),
    })
    const entry = await mockApi.performEntryCheck({
      query: certificate.certificateNo,
      actualQuantity: 50,
      channel: '东门动物运输专用通道',
      recognizedPlateNo: certificate.vehiclePlateNo,
      earTagMatched: true,
      originRegionMatched: true,
    })
    const waiting = await mockApi.createWaitingSlaughterBatch(entry.id)
    const ante = await mockApi.submitAnteMortemCheck({
      waitingBatchId: waiting.id,
      checkedBy: '官方兽医 王敏',
      passed: true,
      remark: '宰前检查合格',
    })
    const post = await mockApi.submitPostMortemCheck({
      waitingBatchId: waiting.id,
      checkedBy: '官方兽医 王敏',
      qualifiedQuantity: 48,
      unqualifiedQuantity: 2,
      productWeight: 3900,
      remark: '发现 2 头局部异常，转无害化处理',
    })

    expect(ante.status).toBe('completed')
    expect(post.unqualifiedQuantity).toBe(2)

    const product = await mockApi.issueProductCertificate({
      waitingBatchId: waiting.id,
      productName: '白条猪肉',
      weight: 3900,
      issuedBy: '官方兽医 王敏',
    })
    const meat = await mockApi.issueMeatQualityCertificate({
      waitingBatchId: waiting.id,
      productName: '白条猪肉',
      weight: 3900,
      inspector: '品质检验员 周宁',
    })
    const link = await mockApi.linkThreeCertificates(waiting.id)

    const data = await mockApi.getBootstrapData()
    expect(product.certificateNo).toContain('CP')
    expect(meat.certificateNo).toContain('RZ')
    expect(link.productCertificateId).toBe(product.id)
    expect(data.harmlessTasks.some((item) => item.source === 'slaughter_unqualified')).toBe(true)
    expect(data.sealRecords.some((item) => item.action === 'use')).toBe(true)
  })

  it('无害化处理完成后回写闭环状态并生成同步日志', async () => {
    await mockApi.createHarmlessTreatmentTask({
      source: 'farm_death',
      sourceId: 'farm-death-record',
      quantity: 3,
      weight: 240,
      reason: '养殖死亡申报',
    })
    const data = await mockApi.getBootstrapData()
    const task = data.harmlessTasks[0]

    const completed = await mockApi.completeHarmlessTreatment({
      taskId: task.id,
      method: '高温化制',
      processedQuantity: 3,
      processedWeight: 240,
      photoCount: 4,
      operator: '无害化中心 李伟',
    })

    const finalData = await mockApi.getBootstrapData()
    expect(completed.status).toBe('completed')
    expect(finalData.syncLogs.some((item) => item.businessNo === completed.taskNo)).toBe(true)
    expect(finalData.closedLoopNodes.some((item) => item.nodeName === '无害化处理')).toBe(true)
  })
})
