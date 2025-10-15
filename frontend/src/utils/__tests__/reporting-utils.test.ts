import { describe, it, expect } from 'vitest'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

describe('Reporting utility functions', () => {
  describe('Period comparison calculations', () => {
    it('calculates percentage change correctly', () => {
      const calculatePercentageChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
      }

      expect(calculatePercentageChange(120, 100)).toBe(20)
      expect(calculatePercentageChange(80, 100)).toBe(-20)
      expect(calculatePercentageChange(100, 100)).toBe(0)
      expect(calculatePercentageChange(50, 0)).toBe(100)
      expect(calculatePercentageChange(0, 0)).toBe(0)
    })

    it('determines trend direction based on change', () => {
      const getTrendDirection = (change: number): 'up' | 'down' | 'stable' => {
        if (Math.abs(change) < 0.1) return 'stable'
        return change > 0 ? 'up' : 'down'
      }

      expect(getTrendDirection(15.5)).toBe('up')
      expect(getTrendDirection(-10.2)).toBe('down')
      expect(getTrendDirection(0.05)).toBe('stable')
      expect(getTrendDirection(-0.08)).toBe('stable')
    })

    it('formats variance with correct sign and suffix', () => {
      const formatVariance = (change: number, suffix = '%'): string => {
        const sign = change > 0 ? '+' : ''
        return `${sign}${change.toFixed(1)}${suffix}`
      }

      expect(formatVariance(15.7)).toBe('+15.7%')
      expect(formatVariance(-8.3)).toBe('-8.3%')
      expect(formatVariance(0)).toBe('0.0%')
      expect(formatVariance(25.5, ' days')).toBe('+25.5 days')
    })
  })

  describe('Exception severity handling', () => {
    it('assigns correct colors to severity levels', () => {
      const getSeverityColor = (severity: string): string => {
        const colors = {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#d97706',
          low: '#65a30d'
        }
        return colors[severity as keyof typeof colors] || '#6b7280'
      }

      expect(getSeverityColor('critical')).toBe('#dc2626')
      expect(getSeverityColor('high')).toBe('#ea580c')
      expect(getSeverityColor('medium')).toBe('#d97706')
      expect(getSeverityColor('low')).toBe('#65a30d')
      expect(getSeverityColor('unknown')).toBe('#6b7280')
    })

    it('calculates severity weights correctly', () => {
      const getSeverityWeight = (severity: string): number => {
        const weights = { critical: 4, high: 3, medium: 2, low: 1 }
        return weights[severity as keyof typeof weights] || 0
      }

      expect(getSeverityWeight('critical')).toBe(4)
      expect(getSeverityWeight('high')).toBe(3)
      expect(getSeverityWeight('medium')).toBe(2)
      expect(getSeverityWeight('low')).toBe(1)
      expect(getSeverityWeight('invalid')).toBe(0)
    })

    it('sorts exceptions by severity and date', () => {
      const exceptions = [
        { severity: 'low', date: '2024-01-15', count: 5 },
        { severity: 'critical', date: '2024-01-10', count: 2 },
        { severity: 'high', date: '2024-01-12', count: 3 },
        { severity: 'medium', date: '2024-01-14', count: 4 }
      ]

      const sortBySeverityAndDate = (data: typeof exceptions) => {
        const weights = { critical: 4, high: 3, medium: 2, low: 1 }
        return data.sort((a, b) => {
          const severityDiff = (weights[b.severity as keyof typeof weights] || 0) -
                               (weights[a.severity as keyof typeof weights] || 0)
          if (severityDiff !== 0) return severityDiff
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        })
      }

      const sorted = sortBySeverityAndDate([...exceptions])
      expect(sorted[0].severity).toBe('critical')
      expect(sorted[1].severity).toBe('high')
      expect(sorted[2].severity).toBe('medium')
      expect(sorted[3].severity).toBe('low')
    })
  })

  describe('Date range utilities', () => {
    it('generates correct date ranges for presets', () => {
      const getDateRangeFromPreset = (preset: string, referenceDate = new Date('2024-06-15')) => {
        switch (preset) {
          case 'last-7-days':
            const sevenDaysAgo = new Date(referenceDate)
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            return { from: sevenDaysAgo, to: referenceDate }

          case 'last-30-days':
            const thirtyDaysAgo = new Date(referenceDate)
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            return { from: thirtyDaysAgo, to: referenceDate }

          case 'current-month':
            return {
              from: startOfMonth(referenceDate),
              to: endOfMonth(referenceDate)
            }

          case 'last-month':
            const lastMonth = subMonths(referenceDate, 1)
            return {
              from: startOfMonth(lastMonth),
              to: endOfMonth(lastMonth)
            }

          default:
            return { from: referenceDate, to: referenceDate }
        }
      }

      const testDate = new Date('2024-06-15')

      const last7Days = getDateRangeFromPreset('last-7-days', testDate)
      // Just verify the date range logic is working
      expect(last7Days.from).toBeInstanceOf(Date)
      expect(last7Days.to).toBeInstanceOf(Date)
      expect(last7Days.from < last7Days.to).toBe(true)

      const currentMonth = getDateRangeFromPreset('current-month', testDate)
      expect(format(currentMonth.from, 'yyyy-MM-dd')).toBe('2024-06-01')
      expect(format(currentMonth.to, 'yyyy-MM-dd')).toBe('2024-06-30')
    })

    it('validates date range consistency', () => {
      const isValidDateRange = (from?: Date, to?: Date): boolean => {
        if (!from || !to) return false
        return from <= to
      }

      const validFrom = new Date('2024-01-01')
      const validTo = new Date('2024-01-31')
      const invalidTo = new Date('2023-12-31')

      expect(isValidDateRange(validFrom, validTo)).toBe(true)
      expect(isValidDateRange(validFrom, invalidTo)).toBe(false)
      expect(isValidDateRange(undefined, validTo)).toBe(false)
      expect(isValidDateRange(validFrom, undefined)).toBe(false)
    })
  })

  describe('File size formatting', () => {
    it('formats file sizes correctly', () => {
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
      }

      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(2621440)).toBe('2.5 MB')
    })
  })

  describe('Export validation', () => {
    it('validates export configuration', () => {
      const validateExportConfig = (config: { name?: string; format?: string; include_charts?: boolean; include_summary?: boolean; include_raw_data?: boolean }): string[] => {
        const errors: string[] = []

        if (!config.name || !config.name.trim()) {
          errors.push('Export name is required')
        }

        if (!['csv', 'excel', 'pdf', 'json'].includes(config.format)) {
          errors.push('Invalid export format')
        }

        if (config.format === 'csv' && config.include_charts) {
          errors.push('Charts cannot be included in CSV format')
        }

        if (!config.include_summary && !config.include_raw_data) {
          errors.push('At least one data type must be included')
        }

        return errors
      }

      const validConfig = {
        name: 'Test Export',
        format: 'excel',
        include_summary: true,
        include_charts: true,
        include_raw_data: true
      }

      const invalidConfig1 = {
        name: '',
        format: 'csv',
        include_charts: true,
        include_summary: false,
        include_raw_data: false
      }

      expect(validateExportConfig(validConfig)).toEqual([])
      expect(validateExportConfig(invalidConfig1)).toEqual([
        'Export name is required',
        'Charts cannot be included in CSV format',
        'At least one data type must be included'
      ])
    })
  })

  describe('Filter aggregation', () => {
    it('builds query parameters from filters', () => {
      const buildQueryParams = (filters: { dateRange?: { preset?: string }; processes?: string[]; severity?: string[]; status?: string[] }): URLSearchParams => {
        const params = new URLSearchParams()

        if (filters.dateRange?.preset) {
          params.set('time_range', filters.dateRange.preset)
        }

        if (filters.processes?.length) {
          params.set('processes', filters.processes.join(','))
        }

        if (filters.severity?.length) {
          params.set('severity', filters.severity.join(','))
        }

        if (filters.status?.length) {
          params.set('status', filters.status.join(','))
        }

        return params
      }

      const filters = {
        dateRange: { preset: 'last-30-days' },
        processes: ['process-1', 'process-2'],
        severity: ['high', 'critical'],
        status: ['open', 'in-progress']
      }

      const params = buildQueryParams(filters)
      expect(params.get('time_range')).toBe('last-30-days')
      expect(params.get('processes')).toBe('process-1,process-2')
      expect(params.get('severity')).toBe('high,critical')
      expect(params.get('status')).toBe('open,in-progress')
    })

    it('handles empty or undefined filter values', () => {
      const buildQueryParams = (filters: { dateRange?: { preset?: string }; processes?: string[]; severity?: string[]; status?: string[] }): URLSearchParams => {
        const params = new URLSearchParams()

        if (filters.processes?.length) {
          params.set('processes', filters.processes.join(','))
        }

        return params
      }

      const emptyFilters = { processes: [] }
      const undefinedFilters = { processes: undefined }
      const nullFilters = { processes: null }

      expect(buildQueryParams(emptyFilters).toString()).toBe('')
      expect(buildQueryParams(undefinedFilters).toString()).toBe('')
      expect(buildQueryParams(nullFilters).toString()).toBe('')
    })
  })
})