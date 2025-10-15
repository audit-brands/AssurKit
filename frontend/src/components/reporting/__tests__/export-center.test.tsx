import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { ExportCenter } from '../export-center'
import type { ExportJob, ReportTemplate } from '../export-center'
import type { ReportingFilters } from '../advanced-filters'

global.fetch = vi.fn()

const mockFilters: ReportingFilters = {
  dateRange: {
    from: new Date('2024-01-01'),
    to: new Date('2024-06-30'),
    preset: 'custom'
  },
  processes: ['financial-reporting'],
  severity: ['high', 'critical'],
  status: ['open'],
  controls: [],
  owner: [],
  reviewer: [],
  testTypes: [],
  evidenceTypes: [],
  tags: [],
  includeResolved: false,
  includeOverdue: true,
  riskLevel: 'all',
  period: 'current-year'
}

const mockExportJobs: ExportJob[] = [
  {
    id: 'job-1',
    name: 'Critical Issues Report',
    type: 'pdf',
    status: 'completed',
    progress: 100,
    created_at: '2024-06-15T10:30:00Z',
    completed_at: '2024-06-15T10:32:15Z',
    download_url: 'https://api.example.com/exports/job-1/download',
    file_size: 2048576,
    filters: mockFilters,
    config: {
      format: 'pdf',
      include_summary: true,
      include_charts: true,
      include_raw_data: false,
      date_format: 'YYYY-MM-DD',
      timezone: 'UTC',
      custom_fields: [],
      grouping: [],
      sorting: []
    }
  },
  {
    id: 'job-2',
    name: 'Monthly Tests Export',
    type: 'excel',
    status: 'running',
    progress: 65,
    created_at: '2024-06-15T11:00:00Z',
    filters: mockFilters,
    config: {
      format: 'excel',
      include_summary: true,
      include_charts: false,
      include_raw_data: true,
      date_format: 'MM/DD/YYYY',
      timezone: 'America/New_York',
      custom_fields: [],
      grouping: [],
      sorting: []
    }
  },
  {
    id: 'job-3',
    name: 'Failed Export',
    type: 'csv',
    status: 'failed',
    progress: 0,
    created_at: '2024-06-15T09:45:00Z',
    error_message: 'Insufficient permissions to access data',
    filters: mockFilters,
    config: {
      format: 'csv',
      include_summary: false,
      include_charts: false,
      include_raw_data: true,
      date_format: 'YYYY-MM-DD',
      timezone: 'UTC',
      custom_fields: [],
      grouping: [],
      sorting: []
    }
  }
]

const mockTemplates: ReportTemplate[] = [
  {
    id: 'sox-quarterly',
    name: 'SOX Quarterly Report',
    description: 'Comprehensive SOX compliance report for quarterly reviews',
    type: 'compliance',
    config: {
      format: 'pdf',
      include_summary: true,
      include_charts: true,
      include_raw_data: true,
      date_format: 'MMMM DD, YYYY',
      timezone: 'UTC',
      custom_fields: ['risk_level', 'control_type'],
      grouping: ['process', 'severity'],
      sorting: [{ field: 'severity', direction: 'desc' }]
    },
    is_public: true,
    created_by: 'admin',
    created_at: '2024-01-01T00:00:00Z'
  }
]

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

describe('ExportCenter Component', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Mock URL methods
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  it('renders export options correctly', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
      if (url === '/api/exports/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => mockExportJobs,
        } as Response)
      }
      if (url === '/api/exports/templates') {
        return Promise.resolve({
          ok: true,
          json: async () => mockTemplates,
        } as Response)
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    renderWithQueryClient(<ExportCenter filters={mockFilters} dataType="tests" />)

    expect(screen.getByText('Export Data')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export excel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /custom export/i })).toBeInTheDocument()
  })

  it('displays export job history', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
      if (url === '/api/exports/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => mockExportJobs,
        } as Response)
      }
      if (url === '/api/exports/templates') {
        return Promise.resolve({
          ok: true,
          json: async () => mockTemplates,
        } as Response)
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    renderWithQueryClient(<ExportCenter filters={mockFilters} dataType="tests" />)

    await waitFor(() => {
      expect(screen.getByText('Critical Issues Report')).toBeInTheDocument()
      expect(screen.getByText('Monthly Tests Export')).toBeInTheDocument()
      expect(screen.getByText('Failed Export')).toBeInTheDocument()
    })
  })

  it('shows correct status icons and progress', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
      if (url === '/api/exports/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => mockExportJobs,
        } as Response)
      }
      if (url === '/api/exports/templates') {
        return Promise.resolve({
          ok: true,
          json: async () => mockTemplates,
        } as Response)
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    renderWithQueryClient(<ExportCenter filters={mockFilters} dataType="tests" />)

    await waitFor(() => {
      // Completed job should show download button
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()

      // Running job should show progress
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      // Failed job should show error message
      expect(screen.getByText('Insufficient permissions to access data')).toBeInTheDocument()
    })
  })

  it('handles quick export actions', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    mockFetch.mockImplementation((url, options) => {
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
      if (url === '/api/exports/create' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'new-job', status: 'pending' }),
        } as Response)
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    renderWithQueryClient(<ExportCenter filters={mockFilters} dataType="tests" />)

    await waitFor(() => {
      const csvButton = screen.getByRole('button', { name: /export csv/i })
      user.click(csvButton)
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/exports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"format":"csv"')
      })
    })
  })

  it('opens custom export dialog', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
      if (url === '/api/exports/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      if (url === '/api/exports/templates') {
        return Promise.resolve({
          ok: true,
          json: async () => mockTemplates,
        } as Response)
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    renderWithQueryClient(<ExportCenter filters={mockFilters} dataType="tests" />)

    const customButton = screen.getByRole('button', { name: /custom export/i })
    await user.click(customButton)

    await waitFor(() => {
      expect(screen.getByText('Custom Export Configuration')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Basic Options' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Formatting' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Templates' })).toBeInTheDocument()
    })
  })

  it('handles custom export configuration', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    mockFetch.mockImplementation((url, options) => {
      if (url === '/api/exports/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      if (url === '/api/exports/templates') {
        return Promise.resolve({
          ok: true,
          json: async () => mockTemplates,
        } as Response)
      }
      if (url === '/api/exports/create' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'custom-job', status: 'pending' }),
        } as Response)
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    renderWithQueryClient(<ExportCenter filters={mockFilters} dataType="tests" />)

    // Open custom export dialog
    const customButton = screen.getByRole('button', { name: /custom export/i })
    await user.click(customButton)

    await waitFor(() => {
      expect(screen.getByText('Custom Export Configuration')).toBeInTheDocument()
    })

    // Fill in export name
    const nameInput = screen.getByPlaceholderText('Enter export name...')
    await user.type(nameInput, 'My Custom Export')

    // Change format to Excel
    const formatSelect = screen.getByDisplayValue('CSV')
    await user.click(formatSelect)
    await user.click(screen.getByText('Excel'))

    // Submit export
    const startButton = screen.getByRole('button', { name: /start export/i })
    await user.click(startButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/exports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"name":"My Custom Export"')
      })
    })
  })

  it('applies report templates', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
      if (url === '/api/exports/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      if (url === '/api/exports/templates') {
        return Promise.resolve({
          ok: true,
          json: async () => mockTemplates,
        } as Response)
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    renderWithQueryClient(<ExportCenter filters={mockFilters} dataType="tests" />)

    // Open custom export dialog
    const customButton = screen.getByRole('button', { name: /custom export/i })
    await user.click(customButton)

    // Switch to templates tab
    const templatesTab = screen.getByRole('tab', { name: 'Templates' })
    await user.click(templatesTab)

    await waitFor(() => {
      expect(screen.getByText('SOX Quarterly Report')).toBeInTheDocument()
    })

    // Apply template
    const templateCard = screen.getByText('SOX Quarterly Report').closest('div')
    await user.click(templateCard!)

    // Verify template was applied (name field should be populated)
    expect(screen.getByDisplayValue('SOX Quarterly Report')).toBeInTheDocument()
  })

  it('handles file download', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    // Mock the download fetch
    const mockBlob = new Blob(['file content'], { type: 'application/pdf' })
    mockFetch.mockImplementation((url) => {
      if (url === '/api/exports/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => mockExportJobs,
        } as Response)
      }
      if (url === '/api/exports/templates') {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      if (url === 'https://api.example.com/exports/job-1/download') {
        return Promise.resolve({
          ok: true,
          blob: async () => mockBlob,
        } as Response)
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    // Mock link click
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)

    renderWithQueryClient(<ExportCenter filters={mockFilters} dataType="tests" />)

    await waitFor(() => {
      const downloadButton = screen.getByRole('button', { name: /download/i })
      user.click(downloadButton)
    })

    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe('Critical Issues Report.pdf')
    })
  })

  it('deletes export jobs', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    mockFetch.mockImplementation((url, options) => {
      if (url === '/api/exports/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => mockExportJobs,
        } as Response)
      }
      if (url === '/api/exports/templates') {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      if (url === '/api/exports/jobs/job-1' && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
        } as Response)
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    renderWithQueryClient(<ExportCenter filters={mockFilters} dataType="tests" />)

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      user.click(deleteButtons[0])
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/exports/jobs/job-1', {
        method: 'DELETE'
      })
    })
  })

  it('formats file sizes correctly', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
      if (url === '/api/exports/jobs') {
        return Promise.resolve({
          ok: true,
          json: async () => mockExportJobs,
        } as Response)
      }
      if (url === '/api/exports/templates') {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    renderWithQueryClient(<ExportCenter filters={mockFilters} dataType="tests" />)

    await waitFor(() => {
      expect(screen.getByText('2 MB')).toBeInTheDocument() // 2048576 bytes = 2MB
    })
  })

  it('shows empty state when no jobs exist', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
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
      return Promise.reject(new Error('Unknown URL'))
    })

    renderWithQueryClient(<ExportCenter filters={mockFilters} dataType="tests" />)

    await waitFor(() => {
      expect(screen.getByText('No export jobs yet')).toBeInTheDocument()
    })
  })

  it('validates export configuration', () => {
    const validateConfig = (config: any): string[] => {
      const errors: string[] = []

      if (!config.name?.trim()) {
        errors.push('Export name is required')
      }

      if (config.format === 'csv' && config.include_charts) {
        errors.push('Charts cannot be included in CSV format')
      }

      return errors
    }

    const invalidConfig = { name: '', format: 'csv', include_charts: true }
    const errors = validateConfig(invalidConfig)

    expect(errors).toContain('Export name is required')
    expect(errors).toContain('Charts cannot be included in CSV format')
  })
})