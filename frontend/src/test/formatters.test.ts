import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters'

describe('Formatters Utility', () => {
  it('formats currency correctly with symbol', () => {
    expect(formatCurrency('1250.50', 'USD')).toBe('$1,250.50')
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
    expect(formatCurrency(null, 'USD')).toBe('$0.00')
    expect(formatCurrency('invalid', 'USD')).toBe('$0.00')
  })

  it('formats dates in readable format', () => {
    expect(formatDate('2026-11-19')).toBe('Nov 19, 2026')
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026')
    expect(formatDate('')).toBe('')
  })

  it('formats percentages correctly', () => {
    expect(formatPercentage(85.55)).toBe('85.6%')
    expect(formatPercentage(0)).toBe('0.0%')
    expect(formatPercentage(null)).toBe('0%')
  })
})
