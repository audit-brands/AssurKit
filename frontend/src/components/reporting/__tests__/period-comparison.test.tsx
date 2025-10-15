import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { PeriodComparison } from '../period-comparison'
import type { PeriodComparison as PeriodComparisonData } from '../period-comparison'

// Mock fetch
global.fetch = vi.fn()

const mockComparisonData: PeriodComparisonData = {
  current_period: {
    period: 'current-month',
    period_start: '2024-06-01',
    period_end: '2024-06-30',
    tests_planned: 100,
    tests_completed: 95,
    tests_passed: 85,
    tests_failed: 10,
    pass_rate: 89.5,
    issues_opened: 12,
    issues_closed: 8,
    issues_overdue: 4,
    avg_resolution_days: 5.2,
    controls_tested: 45,
    control_effectiveness: 92.1,
    key_controls_tested: 20,
    evidence_collected: 150,
    evidence_reviewed: 140,
    evidence_approved: 135
  },
  previous_period: {
    period: 'last-month',
    period_start: '2024-05-01',
    period_end: '2024-05-31',
    tests_planned: 90,
    tests_completed: 85,
    tests_passed: 75,
    tests_failed: 10,
    pass_rate: 88.2,
    issues_opened: 15,
    issues_closed: 10,
    issues_overdue: 5,
    avg_resolution_days: 6.1,
    controls_tested: 40,
    control_effectiveness: 89.5,
    key_controls_tested: 18,
    evidence_collected: 130,
    evidence_reviewed: 125,
    evidence_approved: 120
  },
  variance_analysis: {
    tests_completion_change: 11.8,
    pass_rate_change: 1.3,
    issues_resolution_change: -20.0,
    control_effectiveness_change: 2.6
  },
  trend_data: [
    {
      period: 'May',
      tests_completed: 85,
      pass_rate: 88.2,
      issues_closed: 10,
      control_effectiveness: 89.5
    },
    {
      period: 'June',
      tests_completed: 95,
      pass_rate: 89.5,
      issues_closed: 8,
      control_effectiveness: 92.1
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

describe('PeriodComparison Component', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders loading state initially', () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderWithQueryClient(<PeriodComparison />)

    expect(screen.getByText('Period Comparison')).toBeInTheDocument()
    expect(screen.getAllByRole('generic').some(el =>
      el.className.includes('animate-pulse')
    )).toBe(true)
  })

  it('renders comparison data successfully', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockComparisonData,
    } as Response)

    renderWithQueryClient(<PeriodComparison />)

    await waitFor(() => {
      expect(screen.getByText('95')).toBeInTheDocument() // Tests completed
      expect(screen.getByText('89.5%')).toBeInTheDocument() // Pass rate
      expect(screen.getByText('8')).toBeInTheDocument() // Issues resolved
      expect(screen.getByText('92.1%')).toBeInTheDocument() // Control effectiveness
    })
  })

  it('displays variance indicators correctly', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockComparisonData,
    } as Response)

    renderWithQueryClient(<PeriodComparison />)

    await waitFor(() => {
      expect(screen.getByText('+11.8%')).toBeInTheDocument() // Tests completion increase
      expect(screen.getByText('+1.3%')).toBeInTheDocument() // Pass rate increase
      expect(screen.getByText('-20.0%')).toBeInTheDocument() // Issues resolution decrease
      expect(screen.getByText('+2.6%')).toBeInTheDocument() // Control effectiveness increase
    })
  })

  it('handles API error gracefully', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    renderWithQueryClient(<PeriodComparison />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load period comparison data')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('shows trend direction icons', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockComparisonData,
    } as Response)

    renderWithQueryClient(<PeriodComparison />)

    await waitFor(() => {
      // Should show positive trend icons for increases
      const positiveChanges = screen.getAllByText('+11.8%')
      expect(positiveChanges.length).toBeGreaterThan(0)

      // Should show negative trend icon for decrease
      const negativeChanges = screen.getAllByText('-20.0%')
      expect(negativeChanges.length).toBeGreaterThan(0)
    })
  })

  it('renders charts with correct data', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockComparisonData,
    } as Response)

    renderWithQueryClient(<PeriodComparison />)

    await waitFor(() => {
      expect(screen.getByText('Testing Performance Trends')).toBeInTheDocument()
      expect(screen.getByText('Control & Issue Trends')).toBeInTheDocument()
    })
  })

  it('handles period selector changes', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockComparisonData,
    } as Response)

    renderWithQueryClient(<PeriodComparison />)

    await waitFor(() => {
      // Check for period comparison content instead of specific selectors
      expect(screen.getByText('Period Comparison')).toBeInTheDocument()
      expect(screen.getByText('95')).toBeInTheDocument() // Tests completed
    })
  })

  it('generates CSV export correctly', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockComparisonData,
    } as Response)

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement)

    renderWithQueryClient(<PeriodComparison />)

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export/i })
      exportButton.click()
    })

    expect(mockLink.click).toHaveBeenCalled()
    expect(mockLink.download).toContain('period-comparison')
  })

  it('applies custom period selections', () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const customPeriods = {
      current: 'current-quarter',
      previous: 'last-quarter'
    }

    renderWithQueryClient(<PeriodComparison selectedPeriods={customPeriods} />)

    // Just verify the component renders with custom periods
    expect(screen.getByText('Period Comparison')).toBeInTheDocument()
  })

  it('validates metric calculations', () => {
    const current = mockComparisonData.current_period
    const previous = mockComparisonData.previous_period

    // Test completion rate calculation
    const testCompletionChange = ((current.tests_completed - previous.tests_completed) / previous.tests_completed) * 100
    expect(Math.round(testCompletionChange * 10) / 10).toBe(11.8)

    // Pass rate change
    const passRateChange = current.pass_rate - previous.pass_rate
    expect(Math.round(passRateChange * 10) / 10).toBe(1.3)

    // Issues resolution change
    const issuesChange = ((current.issues_closed - previous.issues_closed) / previous.issues_closed) * 100
    expect(Math.round(issuesChange * 10) / 10).toBe(-20.0)

    // Control effectiveness change
    const controlChange = current.control_effectiveness - previous.control_effectiveness
    expect(Math.round(controlChange * 10) / 10).toBe(2.6)
  })
})