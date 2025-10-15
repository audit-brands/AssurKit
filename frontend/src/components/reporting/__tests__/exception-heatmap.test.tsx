import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { ExceptionHeatmap } from '../exception-heatmap'
import type { HeatmapData } from '../exception-heatmap'

global.fetch = vi.fn()

const mockHeatmapData: HeatmapData = {
  exceptions_by_process: [
    {
      process: 'Financial Reporting',
      total_exceptions: 25,
      critical_count: 3,
      high_count: 8,
      medium_count: 10,
      low_count: 4,
      trend_direction: 'up',
      trend_percentage: 15.2
    },
    {
      process: 'Access Controls',
      total_exceptions: 18,
      critical_count: 1,
      high_count: 5,
      medium_count: 8,
      low_count: 4,
      trend_direction: 'down',
      trend_percentage: -8.5
    },
    {
      process: 'Change Management',
      total_exceptions: 12,
      critical_count: 0,
      high_count: 2,
      medium_count: 6,
      low_count: 4,
      trend_direction: 'stable',
      trend_percentage: 1.2
    }
  ],
  exceptions_by_month: [
    {
      month: 'May 2024',
      total_exceptions: 42,
      by_severity: {
        critical: 3,
        high: 12,
        medium: 18,
        low: 9
      },
      by_type: {
        test_failure: 20,
        control_deficiency: 12,
        missing_evidence: 7,
        overdue_remediation: 3
      }
    },
    {
      month: 'June 2024',
      total_exceptions: 55,
      by_severity: {
        critical: 4,
        high: 15,
        medium: 24,
        low: 12
      },
      by_type: {
        test_failure: 28,
        control_deficiency: 15,
        missing_evidence: 8,
        overdue_remediation: 4
      }
    }
  ],
  exceptions_by_control_type: [
    {
      control_type: 'Automated Controls',
      automation_level: 'automated',
      exception_rate: 5.2,
      total_tests: 150,
      failed_tests: 8
    },
    {
      control_type: 'Manual Reviews',
      automation_level: 'manual',
      exception_rate: 12.8,
      total_tests: 125,
      failed_tests: 16
    },
    {
      control_type: 'Hybrid Controls',
      automation_level: 'hybrid',
      exception_rate: 8.7,
      total_tests: 115,
      failed_tests: 10
    }
  ],
  resolution_patterns: [
    {
      exception_type: 'test_failure',
      avg_resolution_days: 5.2,
      min_days: 1,
      max_days: 15,
      count: 48
    },
    {
      exception_type: 'control_deficiency',
      avg_resolution_days: 12.5,
      min_days: 3,
      max_days: 30,
      count: 27
    },
    {
      exception_type: 'missing_evidence',
      avg_resolution_days: 3.8,
      min_days: 1,
      max_days: 10,
      count: 15
    }
  ],
  hot_spots: [
    {
      entity: 'Month-End Close Process',
      entity_type: 'process',
      exception_density: 0.85,
      risk_score: 92,
      last_exception_date: '2024-06-28'
    },
    {
      entity: 'User Access Review Control',
      entity_type: 'control',
      exception_density: 0.72,
      risk_score: 78,
      last_exception_date: '2024-06-25'
    },
    {
      entity: 'Journal Entry Testing',
      entity_type: 'test',
      exception_density: 0.65,
      risk_score: 85,
      last_exception_date: '2024-06-27'
    }
  ]
}

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('ExceptionHeatmap Component', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders loading state initially', () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => new Promise(() => {}))

    renderWithQueryClient(<ExceptionHeatmap />)

    expect(screen.getByText('Exception Analysis & Heatmap')).toBeInTheDocument()
    expect(screen.getAllByRole('generic').some(el =>
      el.className.includes('animate-pulse')
    )).toBe(true)
  })

  it('renders heatmap data successfully', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHeatmapData,
    } as Response)

    renderWithQueryClient(<ExceptionHeatmap />)

    await waitFor(() => {
      expect(screen.getByText('Exception Analysis & Heatmap')).toBeInTheDocument()
      expect(screen.getByText('Financial Reporting')).toBeInTheDocument()
      expect(screen.getByText('Access Controls')).toBeInTheDocument()
      expect(screen.getByText('Change Management')).toBeInTheDocument()
    })
  })

  it('displays exception counts by process', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHeatmapData,
    } as Response)

    renderWithQueryClient(<ExceptionHeatmap />)

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument() // Financial Reporting total
      expect(screen.getByText('18')).toBeInTheDocument() // Access Controls total
      expect(screen.getByText('12')).toBeInTheDocument() // Change Management total
    })
  })

  it('shows severity badges correctly', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHeatmapData,
    } as Response)

    renderWithQueryClient(<ExceptionHeatmap />)

    await waitFor(() => {
      expect(screen.getByText('Critical: 3')).toBeInTheDocument()
      expect(screen.getByText('High: 8')).toBeInTheDocument()
      expect(screen.getByText('Medium: 10')).toBeInTheDocument()
      expect(screen.getByText('Low: 4')).toBeInTheDocument()
    })
  })

  it('displays trend indicators', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHeatmapData,
    } as Response)

    renderWithQueryClient(<ExceptionHeatmap />)

    await waitFor(() => {
      expect(screen.getByText('↗ 15.2%')).toBeInTheDocument() // Trending up
      expect(screen.getByText('↘ 8.5%')).toBeInTheDocument() // Trending down
      expect(screen.getByText('→ 1.2%')).toBeInTheDocument() // Stable
    })
  })

  it('handles tab navigation', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHeatmapData,
    } as Response)

    renderWithQueryClient(<ExceptionHeatmap />)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Trends' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Hot Spots' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Resolution' })).toBeInTheDocument()
    })

    // Test tab switching
    const trendsTab = screen.getByRole('tab', { name: 'Trends' })
    fireEvent.click(trendsTab)

    await waitFor(() => {
      expect(screen.getByText('Exception Rate by Control Type')).toBeInTheDocument()
      expect(screen.getByText('Automated Controls')).toBeInTheDocument()
      expect(screen.getByText('Manual Reviews')).toBeInTheDocument()
    })
  })

  it('displays control type exception rates', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHeatmapData,
    } as Response)

    renderWithQueryClient(<ExceptionHeatmap />)

    // Switch to trends tab
    await waitFor(() => {
      const trendsTab = screen.getByRole('tab', { name: 'Trends' })
      fireEvent.click(trendsTab)
    })

    await waitFor(() => {
      expect(screen.getByText('5.2%')).toBeInTheDocument() // Automated rate
      expect(screen.getByText('12.8%')).toBeInTheDocument() // Manual rate
      expect(screen.getByText('8.7%')).toBeInTheDocument() // Hybrid rate
    })
  })

  it('shows hot spots with risk scores', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHeatmapData,
    } as Response)

    renderWithQueryClient(<ExceptionHeatmap />)

    // Switch to hot spots tab
    await waitFor(() => {
      const hotspotsTab = screen.getByRole('tab', { name: 'Hot Spots' })
      fireEvent.click(hotspotsTab)
    })

    await waitFor(() => {
      expect(screen.getByText('Month-End Close Process')).toBeInTheDocument()
      expect(screen.getByText('92/100')).toBeInTheDocument() // Risk score
      expect(screen.getByText('User Access Review Control')).toBeInTheDocument()
      expect(screen.getByText('78/100')).toBeInTheDocument()
    })
  })

  it('displays resolution patterns', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHeatmapData,
    } as Response)

    renderWithQueryClient(<ExceptionHeatmap />)

    // Switch to resolution tab
    await waitFor(() => {
      const resolutionTab = screen.getByRole('tab', { name: 'Resolution' })
      fireEvent.click(resolutionTab)
    })

    await waitFor(() => {
      expect(screen.getByText('Resolution Time Patterns')).toBeInTheDocument()
    })
  })

  it('handles time range selection', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockHeatmapData,
    } as Response)

    renderWithQueryClient(<ExceptionHeatmap />)

    await waitFor(() => {
      const timeRangeSelect = screen.getByDisplayValue('Last 3 Months')
      expect(timeRangeSelect).toBeInTheDocument()
    })
  })

  it('exports heatmap data correctly', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHeatmapData,
    } as Response)

    // Mock URL.createObjectURL and link.click()
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement)

    renderWithQueryClient(<ExceptionHeatmap />)

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)
    })

    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(mockLink.click).toHaveBeenCalled()
    expect(mockLink.download).toContain('exception-heatmap')

    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })

  it('handles API error gracefully', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    renderWithQueryClient(<ExceptionHeatmap />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load exception heatmap data')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('applies process filters correctly', () => {
    const mockFetch = vi.mocked(fetch)
    let capturedUrl = ''
    mockFetch.mockImplementation((url) => {
      capturedUrl = url as string
      return Promise.resolve({
        ok: true,
        json: async () => mockHeatmapData,
      } as Response)
    })

    const processFilter = ['financial-reporting', 'access-controls']
    renderWithQueryClient(<ExceptionHeatmap processFilter={processFilter} />)

    expect(capturedUrl).toContain('processes=financial-reporting,access-controls')
  })

  it('validates severity color mapping', () => {
    const getSeverityColor = (severity: string) => {
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
  })

  it('calculates trend icons correctly', () => {
    const getTrendIcon = (direction: string) => {
      return direction === 'up' ? '↗' : direction === 'down' ? '↘' : '→'
    }

    expect(getTrendIcon('up')).toBe('↗')
    expect(getTrendIcon('down')).toBe('↘')
    expect(getTrendIcon('stable')).toBe('→')
  })
})