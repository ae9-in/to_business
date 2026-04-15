export function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function addUtcDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

export function calculateReminderDate(deliveryDate: Date) {
  const reminderDate = addUtcDays(startOfUtcDay(deliveryDate), 30)
  return { nextMonthVisitDate: reminderDate, reminderDate }
}

export function getReminderStatusForDate(date: Date, now = new Date()) {
  const today = startOfUtcDay(now)
  const reminderDay = startOfUtcDay(date)
  const diffDays = Math.floor((reminderDay.getTime() - today.getTime()) / 86400000)

  if (diffDays < 0) return 'OVERDUE'
  if (diffDays <= 3) return 'UPCOMING'
  return 'PENDING'
}
