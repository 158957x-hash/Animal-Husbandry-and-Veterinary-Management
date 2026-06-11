import { describe, expect, it } from 'vitest'
import { canTransition, transitionStatus } from '../domain/stateMachine'

describe('业务状态机', () => {
  it('允许产地检疫到屠宰出证的关键状态正向流转', () => {
    const chain = [
      'draft',
      'submitted',
      'origin_reviewing',
      'origin_approved',
      'certificate_issued',
      'transporting',
      'arrived',
      'entry_checking',
      'entry_passed',
      'slaughter_submitted',
      'slaughter_reviewing',
      'slaughter_approved',
      'product_certificate_issued',
    ] as const

    for (let index = 0; index < chain.length - 1; index += 1) {
      expect(canTransition(chain[index], chain[index + 1])).toBe(true)
    }
  })

  it('阻止跳过入场查验直接提交屠宰检疫', () => {
    expect(canTransition('transporting', 'slaughter_submitted')).toBe(false)
    expect(() => transitionStatus('transporting', 'slaughter_submitted')).toThrow('非法状态流转')
  })
})
