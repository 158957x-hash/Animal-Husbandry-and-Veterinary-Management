import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf-8')
}

describe('菜单与免疫台账界面契约', () => {
  it('执业兽医和屠宰端包含新增菜单', () => {
    const shell = readSource('../layouts/AppShell.vue')

    expect(shell).toContain("{ label: '宠物检疫管理'")
    expect(shell).toContain("{ label: '宠物免疫管理'")
    expect(shell).toContain("{ label: '屠宰管理'")
  })

  it('屠宰端和监管端主要页面采用清爽政务版统一排版骨架', () => {
    const slaughterDashboard = readSource('../views/slaughter/SlaughterDashboardView.vue')
    const entryCheck = readSource('../views/slaughter/EntryCheckView.vue')
    const waiting = readSource('../views/slaughter/WaitingSlaughterView.vue')
    const records = readSource('../views/slaughter/SlaughterRecordListView.vue')
    const regulatorDashboard = readSource('../views/regulator/DashboardView.vue')
    const certificateSpotCheck = readSource('../views/regulator/CertificateSpotCheckView.vue')
    const closedLoop = readSource('../views/regulator/ClosedLoopOverviewView.vue')

    for (const source of [slaughterDashboard, entryCheck, waiting, records, regulatorDashboard, certificateSpotCheck, closedLoop]) {
      expect(source).toContain('gov-compact-card')
    }

    for (const source of [slaughterDashboard, regulatorDashboard]) {
      expect(source).toContain('gov-kpi-grid')
    }

    for (const source of [entryCheck, waiting, records, certificateSpotCheck, closedLoop]) {
      expect(source).toContain('gov-pagination-bar')
    }

    expect(slaughterDashboard).toContain('屠宰企业工作台')
    expect(entryCheck).toContain('入场查验')
    expect(waiting).toContain('待宰管理')
    expect(records).toContain('屠宰')
    expect(regulatorDashboard).toContain('监管驾驶舱')
  })

  it('全局导航和门户满足最新交互要求', () => {
    const shell = readSource('../layouts/AppShell.vue')
    const login = readSource('../views/LoginView.vue')
    const style = readSource('../style.css')
    const regulatorDashboard = readSource('../views/regulator/DashboardView.vue')

    expect(shell).not.toContain("{ label: '新增产地检疫申报'")
    expect(shell).toContain("{ label: '宠物检疫管理', path: '' }")
    expect(shell).toContain("{ label: '宠物免疫管理', path: '' }")
    expect(login).not.toContain("role: 'pet_owner'")
    expect(shell).toContain('app-header')
    expect(shell).toContain('消息提醒')
    expect(shell).toContain('退出登录')
    expect(shell).toContain('user-avatar')
    expect(style).toContain('.role-card.gov-compact-card')
    expect(style).toContain('background: linear-gradient(145deg, rgba(8, 91, 61, 0.96) 0%, rgba(6, 44, 33, 0.92) 100%) !important')
    expect(style).toContain('.regulator-dashboard .gov-kpi-card')
    expect(regulatorDashboard).toContain('regulator-dashboard')
  })

  it('产地检疫申报时间字段使用日期时间选择器且全局移除返回角色选择', () => {
    const shell = readSource('../layouts/AppShell.vue')
    const originApply = readSource('../views/farmer/OriginApplyView.vue')

    expect(shell).not.toContain('返回角色选择')
    expect(originApply).toContain('label="启运时间"')
    expect(originApply).toContain('v-model="form.departureTime"')
    expect(originApply).toContain('type="datetime"')
    expect(originApply).not.toContain('<el-form-item label="启运时间"><el-input v-model="form.departureTime" /></el-form-item>')
  })

  it('产地检疫查验支持取证附件上传弹窗和人脸识别', () => {
    const originInspection = readSource('../views/vet/OriginInspectionView.vue')

    expect(originInspection).toContain('上传附件')
    expect(originInspection).toContain('uploadDialogVisible')
    expect(originInspection).toContain('附件类型')
    expect(originInspection).toContain('车辆照片')
    expect(originInspection).toContain('el-upload')
    expect(originInspection).toContain('上传成功')
    expect(originInspection).toContain('人脸识别')
    expect(originInspection).toContain('faceDialogVisible')
    expect(originInspection).toContain('getUserMedia')
    expect(originInspection).toContain('face-camera-video')
  })

  it('官方兽医三个检疫页面均支持摄像头人脸识别', () => {
    const originInspection = readSource('../views/vet/OriginInspectionView.vue')
    const slaughterAudit = readSource('../views/vet/SlaughterAuditDetailView.vue')
    const postMortem = readSource('../views/vet/PostMortemCheckDetailView.vue')

    for (const source of [originInspection, slaughterAudit, postMortem]) {
      expect(source).toContain('人脸识别')
      expect(source).toContain('faceDialogVisible')
      expect(source).toContain('getUserMedia')
      expect(source).toContain('face-camera-video')
      expect(source).toContain('face-scan-frame')
      expect(source).toContain('stopFaceRecognition')
      expect(source).toContain('未核验')
      expect(source).toContain('identityVerified')
    }
  })
})
