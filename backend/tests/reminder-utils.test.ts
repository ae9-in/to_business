import { describe, expect, it } from 'vitest'
import { calculateReminderDate, getReminderStatusForDate } from '../src/utils/date.js'

describe('reminder date calculation', () => {
  it('creates a 30-day reminder from the delivery date', () => {
    const { nextMonthVisitDate, reminderDate } = calculateReminderDate(
      new Date('2026-03-20T00:00:00.000Z'),
    )

    expect(nextMonthVisitDate.toISOString()).toBe('2026-04-19T00:00:00.000Z')
    expect(reminderDate.toISOString()).toBe('2026-04-19T00:00:00.000Z')
  })

  it('adds 30 days consistently across month boundaries', () => {
    const { nextMonthVisitDate, reminderDate } = calculateReminderDate(
      new Date('2026-01-31T00:00:00.000Z'),
    )

    expect(nextMonthVisitDate.toISOString()).toBe('2026-03-02T00:00:00.000Z')
    expect(reminderDate.toISOString()).toBe('2026-03-02T00:00:00.000Z')
  })

  it('marks statuses as upcoming or overdue correctly', () => {
    expect(getReminderStatusForDate(new Date('2026-04-10T00:00:00.000Z'), new Date('2026-04-09T00:00:00.000Z'))).toBe('UPCOMING')
    expect(getReminderStatusForDate(new Date('2026-04-01T00:00:00.000Z'), new Date('2026-04-09T00:00:00.000Z'))).toBe('OVERDUE')
  })
})
