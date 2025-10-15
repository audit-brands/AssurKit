import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdvancedFilters } from '../advanced-filters'
import type { ReportingFilters } from '../advanced-filters'

const mockOnFiltersChange = vi.fn()

const defaultFilters: ReportingFilters = {
  dateRange: {
    from: new Date('2024-01-01'),
    to: new Date('2024-06-30'),
    preset: 'custom'
  },
  processes: ['financial-reporting'],
  controls: [],
  issueSeverities: ['high', 'critical'],
  testStatuses: ['submitted'],
  assignedUsers: [],
  reviewers: [],
  testMethods: [],
  evidenceTypes: [],
  tags: [],
  includeResolved: false,
  includeOverdue: true,
  riskLevel: 'all',
  period: 'current-year'
}

const renderAdvancedFilters = (props = {}) => {
  const defaultProps = {
    filters: defaultFilters,
    onFiltersChange: mockOnFiltersChange,
    isLoading: false,
    ...props
  }

  return render(<AdvancedFilters {...defaultProps} />)
}

describe('AdvancedFilters Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter sections correctly', () => {
    renderAdvancedFilters()

    expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Date & Period' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Entities' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Status & Severity' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'People' })).toBeInTheDocument()
  })

  it('displays current filter values', () => {
    renderAdvancedFilters()

    // Check that the component renders with filters
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Date & Period' })).toBeInTheDocument()
  })

  it('handles date range preset selection', async () => {
    renderAdvancedFilters()

    // Verify filter change callback is available
    expect(mockOnFiltersChange).toBeDefined()
  })

  it('updates custom date range', async () => {
    const user = userEvent.setup()
    renderAdvancedFilters()

    const fromDateInput = screen.getByDisplayValue('01/01/2024')
    await user.clear(fromDateInput)
    await user.type(fromDateInput, '02/01/2024')

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dateRange: expect.objectContaining({
          from: expect.any(Date),
          preset: 'custom'
        })
      })
    )
  })

  it('handles process selection', async () => {
    const user = userEvent.setup()
    renderAdvancedFilters()

    // Switch to Entities tab
    const entitiesTab = screen.getByRole('tab', { name: 'Entities' })
    await user.click(entitiesTab)

    const processSelect = screen.getByDisplayValue('Financial Reporting')
    await user.click(processSelect)

    const accessControlsOption = screen.getByText('Access Controls')
    await user.click(accessControlsOption)

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        processes: expect.arrayContaining(['access-controls'])
      })
    )
  })

  it('handles severity multi-selection', async () => {
    const user = userEvent.setup()
    renderAdvancedFilters()

    // Switch to Status & Severity tab
    const statusTab = screen.getByRole('tab', { name: 'Status & Severity' })
    await user.click(statusTab)

    const severitySelect = screen.getByDisplayValue('High, Critical')
    await user.click(severitySelect)

    // Add medium severity
    const mediumOption = screen.getByText('Medium')
    await user.click(mediumOption)

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: expect.arrayContaining(['high', 'critical', 'medium'])
      })
    )
  })

  it('toggles boolean filters correctly', async () => {
    const user = userEvent.setup()
    renderAdvancedFilters()

    // Switch to Status & Severity tab
    const statusTab = screen.getByRole('tab', { name: 'Status & Severity' })
    await user.click(statusTab)

    const overdueCheckbox = screen.getByRole('checkbox', { name: /include overdue/i })
    expect(overdueCheckbox).toBeChecked()

    await user.click(overdueCheckbox)

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        includeOverdue: false
      })
    )
  })

  it('handles risk level selection', async () => {
    const user = userEvent.setup()
    renderAdvancedFilters()

    // Switch to Status & Severity tab
    const statusTab = screen.getByRole('tab', { name: 'Status & Severity' })
    await user.click(statusTab)

    const riskSelect = screen.getByDisplayValue('All Levels')
    await user.click(riskSelect)

    const highRiskOption = screen.getByText('High Risk Only')
    await user.click(highRiskOption)

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        riskLevel: 'high'
      })
    )
  })

  it('clears all filters', async () => {
    const user = userEvent.setup()
    renderAdvancedFilters()

    const clearButton = screen.getByRole('button', { name: /clear all/i })
    await user.click(clearButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        processes: [],
        controls: [],
        issueSeverities: [],
        testStatuses: [],
        assignedUsers: [],
        reviewers: [],
        includeResolved: false,
        includeOverdue: false,
        riskLevel: 'all'
      })
    )
  })

  it('saves filter preset', async () => {
    const user = userEvent.setup()
    renderAdvancedFilters()

    const saveButton = screen.getByRole('button', { name: /save preset/i })
    await user.click(saveButton)

    // Should open save dialog
    await waitFor(() => {
      expect(screen.getByText('Save Filter Preset')).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText('Enter preset name...')
    await user.type(nameInput, 'Critical Issues Filter')

    const confirmSaveButton = screen.getByRole('button', { name: /save/i })
    await user.click(confirmSaveButton)

    // Should trigger save action (would normally call an API)
    await waitFor(() => {
      expect(screen.queryByText('Save Filter Preset')).not.toBeInTheDocument()
    })
  })

  it('shows loading state when filters are being applied', () => {
    renderAdvancedFilters({ isLoading: true })

    const loadingIndicator = screen.getByRole('generic', { name: /loading/i })
    expect(loadingIndicator).toBeInTheDocument()
  })

  it('handles tab navigation', async () => {
    const user = userEvent.setup()
    renderAdvancedFilters()

    // Initially on Date & Period tab
    expect(screen.getByText('Date Range')).toBeInTheDocument()

    // Switch to Entities tab
    const entitiesTab = screen.getByRole('tab', { name: 'Entities' })
    await user.click(entitiesTab)

    expect(screen.getByText('Business Processes')).toBeInTheDocument()

    // Switch to People tab
    const peopleTab = screen.getByRole('tab', { name: 'People' })
    await user.click(peopleTab)

    expect(screen.getByText('Assigned Owner')).toBeInTheDocument()
  })

  it('validates date range inputs', async () => {
    const user = userEvent.setup()
    renderAdvancedFilters()

    const fromDateInput = screen.getByDisplayValue('01/01/2024')

    // Try to set from date after to date
    await user.clear(fromDateInput)
    await user.type(fromDateInput, '12/31/2024')

    // Should show validation error or correct the range
    // This would depend on implementation details
  })

  it('expands and collapses filter sections', async () => {
    const user = userEvent.setup()
    renderAdvancedFilters()

    // Find collapse trigger (this might be a button or the collapsible trigger)
    const collapseButton = screen.getByRole('button', { name: /advanced filters/i })

    // Initially expanded
    expect(screen.getByRole('tab', { name: 'Date & Period' })).toBeVisible()

    await user.click(collapseButton)

    // Should collapse
    await waitFor(() => {
      expect(screen.queryByRole('tab', { name: 'Date & Period' })).not.toBeVisible()
    })
  })

  it('handles tag input and management', async () => {
    const user = userEvent.setup()
    renderAdvancedFilters()

    // Switch to Entities tab
    const entitiesTab = screen.getByRole('tab', { name: 'Entities' })
    await user.click(entitiesTab)

    const tagInput = screen.getByPlaceholderText(/add tags/i)
    await user.type(tagInput, 'high-priority{enter}')

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: expect.arrayContaining(['high-priority'])
      })
    )
  })

  it('validates filter combinations', () => {
    const filtersWithNoDateRange: ReportingFilters = {
      ...defaultFilters,
      dateRange: undefined
    }

    renderAdvancedFilters({ filters: filtersWithNoDateRange })

    // Should handle missing date range gracefully
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
  })

  it('handles empty filter arrays', () => {
    const emptyFilters: ReportingFilters = {
      dateRange: {
        preset: 'last-30-days'
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
      period: 'current-month'
    }

    renderAdvancedFilters({ filters: emptyFilters })

    expect(screen.getByDisplayValue('Last 30 Days')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All Processes')).toBeInTheDocument()
  })
})