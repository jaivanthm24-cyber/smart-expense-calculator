export function formatCurrency(
  amount: number | string | undefined | null,
  currency: string = 'USD'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  if (isNaN(num)) return '$0.00'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  } catch {
    return `$${num.toFixed(2)}`
  }
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return ''
  try {
    const [year, month, day] = dateString.split('-').map(Number)
    if (year && month && day) {
      const d = new Date(year, month - 1, day)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
    return dateString
  } catch {
    return dateString
  }
}

export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0%'
  const rounded = Math.round((Number(value) + Number.EPSILON) * 10) / 10
  return `${rounded.toFixed(1)}%`
}
