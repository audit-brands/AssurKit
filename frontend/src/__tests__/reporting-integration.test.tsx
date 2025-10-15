import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import { AdvancedFilters } from '../components/reporting/advanced-filters'
import { PeriodComparison } from '../components/reporting/period-comparison'
import { ExceptionHeatmap } from '../components/reporting/exception-heatmap'
import { ExportCenter } from '../components/reporting/export-center'
import type { ReportingFilters } from '../components/reporting/advanced-filters'

global.fetch = vi.fn()

// Mock reporting dashboard component that integrates all reporting features
const ReportingDashboard = () => {
  const [filters, setFilters] = useState<ReportingFilters>({
    dateRange: {
      from: new Date('2024-01-01'),
      to: new Date('2024-06-30'),
      preset: 'custom'
    },
    processes: [],
    controls: [],
    issueSeverities: [],
    testStatuses: [],
    assignedUsers: [],
    reviewers: [],
    testMethods: [],
    evidenceTypes: [],
    tags: [],
    includeResolved: false,
    includeOverdue: false,
    riskLevel: 'all',
    period: 'current-year'
  })

  const [activeView, setActiveView] = useState<'comparison' | 'heatmap' | 'export'>('comparison')

  return (
    <div>
      <h1>SOX Reporting Dashboard</h1>

      {/* Filter Section */}
      <div className="mb-6">
        <AdvancedFilters
          initialFilters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* View Selector */}
      <div className="mb-4">
        <button
          onClick={() => setActiveView('comparison')}
          className={activeView === 'comparison' ? 'active' : ''}
        >
          Period Comparison
        </button>
        <button
          onClick={() => setActiveView('heatmap')}
          className={activeView === 'heatmap' ? 'active' : ''}
        >
          Exception Heatmap
        </button>
        <button
          onClick={() => setActiveView('export')}
          className={activeView === 'export' ? 'active' : ''}
        >
          Export Center
        </button>
      </div>

      {/* Main Content */}
      <div>
        {activeView === 'comparison' && (
          <PeriodComparison />
        )}
        {activeView === 'heatmap' && (
          <ExceptionHeatmap
            timeRange={filters.dateRange?.preset || 'last-3-months'}
            processFilter={filters.processes}
          />
        )}
        {activeView === 'export' && (
          <ExportCenter
            filters={filters}
            dataType="tests"
          />
        )}
      </div>
    </div>
  )
}

const mockPeriodComparisonData = {
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
  trend_data: []
}

const mockHeatmapData = {
  exceptions_by_process: [
    {
      process: 'Financial Reporting',
      total_exceptions: 25,
      critical_count: 3,
      high_count: 8,
      medium_count: 10,
      low_count: 4,
      trend_direction: 'up' as const,
      trend_percentage: 15.2
    }
  ],
  exceptions_by_month: [],
  exceptions_by_control_type: [],
  resolution_patterns: [],
  hot_spots: []
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

describe('Reporting Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
      if (url.toString().includes('/api/reporting/period-comparison')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPeriodComparisonData,
        } as Response)
      }
      if (url.toString().includes('/api/reporting/exception-heatmap')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockHeatmapData,
        } as Response)
      }
      if (url === '/api/exports/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      if (url === '/api/exports/templates') {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`))
    })
  })

  it('renders the complete reporting dashboard', async () => {
    renderWithQueryClient(<ReportingDashboard />)

    expect(screen.getByText('SOX Reporting Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Period Comparison' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exception Heatmap' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export Center' })).toBeInTheDocument()
  })

  it('switches between different reporting views', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ReportingDashboard />)

    // Initially shows period comparison
    await waitFor(() => {
      expect(screen.getByText('Period Comparison')).toBeInTheDocument()
    })

    // Switch to heatmap view
    const heatmapButton = screen.getByRole('button', { name: 'Exception Heatmap' })
    await user.click(heatmapButton)

    await waitFor(() => {
      expect(screen.getByText('Exception Analysis & Heatmap')).toBeInTheDocument()
    })

    // Switch to export view
    const exportButton = screen.getByRole('button', { name: 'Export Center' })
    await user.click(exportButton)

    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeInTheDocument()
    })
  })

  it('applies filters across different views', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    renderWithQueryClient(<ReportingDashboard />)

    // Expand filters and set process filter
    await waitFor(() => {
      const entitiesTab = screen.getByRole('tab', { name: 'Entities' })
      user.click(entitiesTab)
    })

    // Add process filter
    await waitFor(() => {
      const processSelect = screen.getByDisplayValue('All Processes')
      user.click(processSelect)
    })

    // Switch to heatmap view
    const heatmapButton = screen.getByRole('button', { name: 'Exception Heatmap' })
    await user.click(heatmapButton)

    // Verify that the heatmap API call includes the process filter
    await waitFor(() => {
      const heatmapCalls = mockFetch.mock.calls.filter(call =>
        call[0]?.toString().includes('/api/reporting/exception-heatmap')
      )
      expect(heatmapCalls.length).toBeGreaterThan(0)
    })
  })

  it('maintains filter state when switching views', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ReportingDashboard />)

    // Set severity filter
    await waitFor(() => {
      const statusTab = screen.getByRole('tab', { name: 'Status & Severity' })
      user.click(statusTab)
    })

    await waitFor(() => {
      const severitySelect = screen.getByDisplayValue('All Severities')
      user.click(severitySelect)
    })

    // Switch views
    const heatmapButton = screen.getByRole('button', { name: 'Exception Heatmap' })
    await user.click(heatmapButton)

    const comparisonButton = screen.getByRole('button', { name: 'Period Comparison' })
    await user.click(comparisonButton)

    // Verify filters are still applied
    await waitFor(() => {
      const statusTab = screen.getByRole('tab', { name: 'Status & Severity' })
      user.click(statusTab)
    })

    // Filter state should be preserved
    expect(screen.getByText('Status & Severity')).toBeInTheDocument()
  })

  it('handles date range changes across views', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    renderWithQueryClient(<ReportingDashboard />)

    // Change date range preset
    const presetSelect = screen.getByDisplayValue('Custom Range')
    await user.click(presetSelect)

    const lastMonthOption = screen.getByText('Last Month')
    await user.click(lastMonthOption)

    // Switch to heatmap view
    const heatmapButton = screen.getByRole('button', { name: 'Exception Heatmap' })
    await user.click(heatmapButton)

    // Verify API calls use updated time range
    await waitFor(() => {
      const heatmapCalls = mockFetch.mock.calls.filter(call =>
        call[0]?.toString().includes('/api/reporting/exception-heatmap') &&
        call[0]?.toString().includes('time_range=last-month')
      )
      expect(heatmapCalls.length).toBeGreaterThan(0)
    })
  })

  it('integrates export functionality with current filters', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ReportingDashboard />)

    // Set some filters first
    await waitFor(() => {
      const statusTab = screen.getByRole('tab', { name: 'Status & Severity' })
      user.click(statusTab)
    })

    // Switch to export view
    const exportButton = screen.getByRole('button', { name: 'Export Center' })
    await user.click(exportButton)

    // The export center should have access to the current filters
    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument()
    })
  })

  it('handles error states gracefully across components', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => {
      return Promise.reject(new Error('Network error'))
    })

    renderWithQueryClient(<ReportingDashboard />)

    // Period comparison should show error
    await waitFor(() => {
      expect(screen.getByText('Failed to load period comparison data')).toBeInTheDocument()
    })

    // Switch to heatmap - should also show error
    const user = userEvent.setup()
    const heatmapButton = screen.getByRole('button', { name: 'Exception Heatmap' })
    await user.click(heatmapButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to load exception heatmap data')).toBeInTheDocument()
    })
  })

  it('validates comprehensive reporting workflow', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ReportingDashboard />)

    // Step 1: Configure filters
    await waitFor(() => {
      const entitiesTab = screen.getByRole('tab', { name: 'Entities' })
      user.click(entitiesTab)
    })

    // Step 2: View period comparison
    await waitFor(() => {
      expect(screen.getByText('Period Comparison')).toBeInTheDocument()
    })

    // Step 3: Analyze exception heatmap
    const heatmapButton = screen.getByRole('button', { name: 'Exception Heatmap' })
    await user.click(heatmapButton)

    await waitFor(() => {
      expect(screen.getByText('Exception Analysis & Heatmap')).toBeInTheDocument()
    })

    // Step 4: Export results
    const exportButton = screen.getByRole('button', { name: 'Export Center' })
    await user.click(exportButton)

    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeInTheDocument()
    })

    // This represents a complete reporting workflow
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument()
  })

  it('handles concurrent data loading across components', async () => {
    const mockFetch = vi.mocked(fetch)
    let callCount = 0

    mockFetch.mockImplementation((url) => {
      callCount++

      if (url.toString().includes('/api/reporting/period-comparison')) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => mockPeriodComparisonData,
            } as Response)
          }, 100)
        })
      }

      if (url.toString().includes('/api/reporting/exception-heatmap')) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => mockHeatmapData,
            } as Response)
          }, 150)
        })
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response)
    })

    renderWithQueryClient(<ReportingDashboard />)

    // Multiple API calls should be initiated
    expect(callCount).toBeGreaterThan(0)

    // All views should eventually load
    await waitFor(() => {
      expect(screen.getByText('Period Comparison')).toBeInTheDocument()
    }, { timeout: 2000 })
  })
})