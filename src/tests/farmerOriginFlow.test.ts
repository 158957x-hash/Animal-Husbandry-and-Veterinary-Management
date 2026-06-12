import { beforeEach, describe, expect, it } from 'vitest'
import { mockApi } from '../api/mockApi'

function validOriginInput() {
  return {
    batchId: 'batch-001',
    quantity: 30,
    destination: '皖北标准化屠宰中心',
    vehicleId: 'vehicle-001',
    purpose: 'slaughter' as const,
    departureTime: '2026-06-13T08:00:00.000Z',
    contactPerson: '王场长',
    contactPhone: '13900002222',
    destinationAddress: '安徽省亳州市利辛县屠宰加工园区 1 号',
    remark: '按计划调运',
  }
}

describe('养殖场户端产地检疫办事流转', () => {
  beforeEach(async () => {
    await mockApi.restoreInitialData()
  })

  it('保存草稿后进入申报列表，草稿可编辑、删除并写入日志', async () => {
    const draft = await mockApi.saveOriginDraft(validOriginInput())
    const updated = await mockApi.updateOriginDraft(draft.id, { ...validOriginInput(), quantity: 36 })
    await mockApi.deleteOriginDraft(updated.id)
    const data = await mockApi.getBootstrapData()

    expect(draft.status).toBe('draft')
    expect(updated.quantity).toBe(36)
    expect(data.originApplications.some((item) => item.id === draft.id)).toBe(false)
    expect(data.operationLogs.some((item) => item.action === '保存产地检疫申报草稿')).toBe(true)
    expect(data.operationLogs.some((item) => item.action === '删除产地检疫申报草稿')).toBe(true)
  })

  it('草稿提交后进入官方兽医待办，已提交申报可撤回', async () => {
    const draft = await mockApi.saveOriginDraft(validOriginInput())
    const submitted = await mockApi.submitOriginDraft(draft.id)
    const withdrawn = await mockApi.withdrawOriginApplication(submitted.id, '补充承运材料后再提交')
    const data = await mockApi.getBootstrapData()

    expect(submitted.status).toBe('submitted')
    expect(data.originApplications.find((item) => item.id === submitted.id)?.status).toBe('draft')
    expect(withdrawn.status).toBe('draft')
    expect(data.operationLogs.some((item) => item.action === '撤回产地检疫申报')).toBe(true)
  })

  it('驳回申报可查看原因并编辑后重新提交', async () => {
    const submitted = await mockApi.submitOriginApplication(validOriginInput())
    const rejected = await mockApi.rejectOriginApplication(submitted.id, '目的地备案材料不完整')
    const resubmitted = await mockApi.resubmitRejectedOriginApplication(rejected.id, { ...validOriginInput(), destination: '皖北标准化屠宰中心复核通道' })
    const data = await mockApi.getBootstrapData()

    expect(rejected.status).toBe('rejected')
    expect(rejected.rejectReason).toBe('目的地备案材料不完整')
    expect(resubmitted.status).toBe('submitted')
    expect(resubmitted.destination).toBe('皖北标准化屠宰中心复核通道')
    expect(data.operationLogs.some((item) => item.action === '驳回产地检疫申报')).toBe(true)
    expect(data.operationLogs.some((item) => item.action === '重新提交产地检疫申报')).toBe(true)
  })

  it('初始化演示数据包含多状态申报且提交时间与状态一致', async () => {
    const data = await mockApi.getBootstrapData()
    const statuses = data.originApplications.map((item) => item.status)

    expect(statuses).toEqual(expect.arrayContaining(['draft', 'submitted', 'rejected', 'certificate_issued', 'transporting']))
    expect(data.originApplications.filter((item) => item.status === 'draft').every((item) => !item.submittedAt)).toBe(true)
    expect(data.originApplications.filter((item) => item.status !== 'draft').every((item) => Boolean(item.submittedAt))).toBe(true)
  })

  it('申报保存完整办事字段并支持已出证申请作废', async () => {
    const submitted = await mockApi.submitOriginApplication(validOriginInput())
    expect(submitted.purpose).toBe('slaughter')
    expect(submitted.departureTime).toBe('2026-06-13T08:00:00.000Z')
    expect(submitted.contactPerson).toBe('王场长')
    const certificate = await mockApi.approveOriginApplication(submitted.id, { faceRecognitionPassed: true, siteInspectionPassed: true, evidencePhotoCount: 2, remark: '现场查验通过' })
    const dataAfterIssue = await mockApi.getBootstrapData()
    const issued = dataAfterIssue.originApplications.find((item) => item.id === certificate.applicationId)
    const request = await mockApi.requestVoidOriginApplication(certificate.applicationId, '证明信息变更，申请作废')

    expect(issued?.status).toBe('certificate_issued')
    expect(request.status).toBe('certificate_issued')
    expect(request.voidRequestReason).toBe('证明信息变更，申请作废')
    expect((request as { voidRequested?: boolean }).voidRequested).toBe(true)
    expect(() => dataAfterIssue.originApplications.filter((item) => item.status === 'certificate_issued')).not.toThrow()
  })

  it('自检异常的申报不能提交到官方兽医待办', async () => {
    const invalidInput = { ...validOriginInput(), quantity: 9999 }
    const draft = await mockApi.saveOriginDraft(invalidInput)

    await expect(mockApi.submitOriginDraft(draft.id)).rejects.toThrow('申报前自查存在异常，不能提交')
    await expect(mockApi.submitOriginApplication(invalidInput)).rejects.toThrow('申报前自查存在异常，不能提交')
    const data = await mockApi.getBootstrapData()

    expect(data.originApplications.find((item) => item.id === draft.id)?.status).toBe('draft')
    expect(data.originApplications.some((item) => item.status === 'submitted' && item.quantity === 9999)).toBe(false)
    expect(data.operationLogs.some((item) => item.action === '阻断产地检疫申报提交')).toBe(true)
    expect(data.alerts.some((item) => item.type === '申报前自查异常')).toBe(true)
  })

  it('官方兽医出证后养殖场户端可读取电子证明和运输任务', async () => {
    const submitted = await mockApi.submitOriginApplication(validOriginInput())
    const certificate = await mockApi.approveOriginApplication(submitted.id, { faceRecognitionPassed: true, siteInspectionPassed: true, evidencePhotoCount: 2, remark: '现场查验通过' })
    const data = await mockApi.getBootstrapData()
    const task = data.transportTasks.find((item) => item.certificateId === certificate.id)
    const application = data.originApplications.find((item) => item.id === submitted.id)

    expect(application?.status).toBe('certificate_issued')
    expect(certificate.applicationId).toBe(submitted.id)
    expect(task?.status).toBe('transporting')
    expect(data.operationLogs.some((item) => item.action.includes('无纸化出证'))).toBe(true)
  })
})
