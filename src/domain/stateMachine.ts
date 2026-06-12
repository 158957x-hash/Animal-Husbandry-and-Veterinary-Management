import type { BusinessStatus } from './models'

export const statusTransitions: Record<BusinessStatus, BusinessStatus[]> = {
  draft: ['submitted', 'voided'],
  submitted: ['draft', 'origin_reviewing', 'rejected', 'voided'],
  origin_reviewing: ['origin_approved', 'rejected'],
  origin_approved: ['certificate_issued'],
  rejected: ['submitted', 'voided'],
  voided: [],
  certificate_issued: ['transporting'],
  transporting: ['landing_pending', 'landing_exception', 'arrived'],
  landing_pending: ['landing_submitted', 'landing_overdue', 'landing_exception'],
  landing_submitted: ['arrived'],
  landing_overdue: ['carrier_restricted'],
  landing_exception: ['carrier_restricted'],
  carrier_restricted: ['carrier_released'],
  carrier_released: ['transporting'],
  arrived: ['entry_checking'],
  entry_checking: ['entry_passed', 'entry_rejected'],
  entry_passed: ['waiting_slaughter', 'slaughter_submitted'],
  entry_rejected: ['harmless_pending'],
  waiting_slaughter: ['ante_mortem_checked'],
  ante_mortem_checked: ['post_mortem_checked'],
  post_mortem_checked: ['product_certificate_issued', 'harmless_pending'],
  slaughter_submitted: ['slaughter_reviewing'],
  slaughter_reviewing: ['slaughter_approved'],
  slaughter_approved: ['product_certificate_issued'],
  product_certificate_issued: ['meat_quality_certificate_issued'],
  meat_quality_certificate_issued: ['three_cert_linked'],
  three_cert_linked: [],
  harmless_pending: ['harmless_processing'],
  harmless_processing: ['harmless_completed'],
  harmless_completed: [],
}

export const statusText: Record<BusinessStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  origin_reviewing: '待现场查验',
  origin_approved: '产地检疫已通过',
  rejected: '已驳回',
  voided: '已作废',
  certificate_issued: '动物检疫证明已出证',
  transporting: '运输中',
  landing_pending: '待提交落地报告',
  landing_submitted: '落地报告已提交',
  landing_overdue: '超时未落地',
  landing_exception: '落地异常',
  carrier_restricted: '承运限制中',
  carrier_released: '承运限制已解除',
  arrived: '已到场',
  entry_checking: '入场查验中',
  entry_passed: '入场通过',
  entry_rejected: '入场驳回',
  waiting_slaughter: '待宰管理',
  ante_mortem_checked: '宰前检查完成',
  post_mortem_checked: '宰后检疫完成',
  slaughter_submitted: '屠宰检疫已申报',
  slaughter_reviewing: '屠宰检疫审核中',
  slaughter_approved: '屠宰检疫已通过',
  product_certificate_issued: '产品检疫证明已出证',
  meat_quality_certificate_issued: '肉品品质证已出证',
  three_cert_linked: '三证已关联',
  harmless_pending: '待无害化处理',
  harmless_processing: '无害化处理中',
  harmless_completed: '无害化处理完成',
}

export const statusType: Record<BusinessStatus, 'info' | 'primary' | 'success' | 'warning' | 'danger'> = {
  draft: 'info',
  submitted: 'primary',
  origin_reviewing: 'warning',
  origin_approved: 'success',
  rejected: 'danger',
  voided: 'info',
  certificate_issued: 'success',
  transporting: 'primary',
  landing_pending: 'warning',
  landing_submitted: 'success',
  landing_overdue: 'danger',
  landing_exception: 'danger',
  carrier_restricted: 'danger',
  carrier_released: 'success',
  arrived: 'primary',
  entry_checking: 'warning',
  entry_passed: 'success',
  entry_rejected: 'danger',
  waiting_slaughter: 'primary',
  ante_mortem_checked: 'success',
  post_mortem_checked: 'success',
  slaughter_submitted: 'primary',
  slaughter_reviewing: 'warning',
  slaughter_approved: 'success',
  product_certificate_issued: 'success',
  meat_quality_certificate_issued: 'success',
  three_cert_linked: 'success',
  harmless_pending: 'warning',
  harmless_processing: 'primary',
  harmless_completed: 'success',
}

export function canTransition(from: BusinessStatus, to: BusinessStatus) {
  return statusTransitions[from].includes(to)
}

export function transitionStatus(from: BusinessStatus, to: BusinessStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`非法状态流转：${statusText[from]} -> ${statusText[to]}`)
  }

  return to
}
