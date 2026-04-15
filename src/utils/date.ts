export const DAY_MS = 24 * 60 * 60 * 1000

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  },
) {
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(value))
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function daysBetween(from: string | Date, to: string | Date) {
  const start = new Date(from)
  const end = new Date(to)
  return Math.ceil((end.getTime() - start.getTime()) / DAY_MS)
}

export function isSameMonth(dateA: string, dateB: Date = new Date()) {
  const first = new Date(dateA)
  return (
    first.getMonth() === dateB.getMonth() &&
    first.getFullYear() === dateB.getFullYear()
  )
}
