import { describe, it, expect } from 'vitest'
import { format, isAfter, parseISO } from 'date-fns'

describe('Date utilities', () => {
  it('formats dates correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z')
    const formatted = format(date, 'MMM d, yyyy')
    expect(formatted).toBe('Jan 15, 2024')
  })

  it('checks if date is after another date', () => {
    const date1 = new Date('2024-01-15')
    const date2 = new Date('2024-01-10')

    expect(isAfter(date1, date2)).toBe(true)
    expect(isAfter(date2, date1)).toBe(false)
  })

  it('parses ISO strings correctly', () => {
    const isoString = '2024-01-15T10:30:00Z'
    const parsed = parseISO(isoString)

    expect(parsed.getFullYear()).toBe(2024)
    expect(parsed.getMonth()).toBe(0) // January is 0
    expect(parsed.getDate()).toBe(15)
  })

  it('detects overdue dates', () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    expect(isAfter(today, yesterday)).toBe(true) // overdue
    expect(isAfter(today, tomorrow)).toBe(false) // not overdue
  })
})