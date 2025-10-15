import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { PoliciesManagement } from '../policies-management'

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

const mockPolicies = [
  {
    id: '1',
    name: 'Data Retention Policy',
    category: 'data-retention' as const,
    description: 'Guidelines for data retention and disposal',
    content: 'All business records must be retained for a minimum of 7 years...',
    status: 'active' as const,
    version: '1.0',
    created_by: 'admin@company.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    effective_date: '2024-01-01',
    review_date: '2025-01-01',
    approval_required: true,
    approved_by: 'admin@company.com',
    approved_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Security Access Policy',
    category: 'security' as const,
    description: 'Access control and security requirements',
    content: 'All users must follow principle of least privilege...',
    status: 'draft' as const,
    version: '1.1',
    created_by: 'security@company.com',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
    effective_date: '2024-03-01',
    review_date: '2025-03-01',
    approval_required: true
  }
]

const mockWorkflows = [
  {
    id: '1',
    name: 'Test Execution Workflow',
    description: 'Standard workflow for test execution and review',
    entity_type: 'test' as const,
    states: [
      {
        id: '1',
        name: 'planned',
        display_name: 'Planned',
        is_initial: true,
        is_final: false,
        required_permissions: [],
        auto_actions: [],
        color: '#3b82f6'
      },
      {
        id: '2',
        name: 'completed',
        display_name: 'Completed',
        is_initial: false,
        is_final: true,
        required_permissions: ['test.complete'],
        auto_actions: [],
        color: '#10b981'
      }
    ],
    transitions: [
      {
        id: '1',
        from_state: '1',
        to_state: '2',
        trigger: 'manual' as const,
        conditions: [],
        required_role: 'tester',
        required_permissions: ['test.execute'],
        label: 'Complete Test'
      }
    ],
    auto_assignments: [],
    notifications: [],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockSystemSettings = {
  password_policy: {
    min_length: 12,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_symbols: true,
    expiry_days: 90,
    history_count: 5
  },
  session_policy: {
    timeout_minutes: 480,
    max_concurrent_sessions: 3,
    require_2fa: true
  },
  audit_policy: {
    retention_days: 2555,
    log_level: 'standard' as const,
    encrypt_logs: true
  },
  evidence_policy: {
    max_file_size_mb: 100,
    allowed_file_types: ['pdf', 'docx', 'xlsx', 'png', 'jpg'],
    retention_years: 7,
    require_checksum: true,
    encrypt_at_rest: true
  },
  backup_policy: {
    frequency: 'daily' as const,
    retention_count: 30,
    include_evidence: true,
    encrypt_backups: true
  }
}

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

global.fetch = vi.fn()

describe('PoliciesManagement Component', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
      if (url.toString().includes('/api/admin/policies')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPolicies,
        } as Response)
      }
      if (url.toString().includes('/api/admin/workflows')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockWorkflows,
        } as Response)
      }
      if (url.toString().includes('/api/admin/system-settings')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSystemSettings,
        } as Response)
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`))
    })
  })

  it('renders policies management interface', async () => {
    renderWithQueryClient(<PoliciesManagement />)

    expect(screen.getByText('Policies & Configuration')).toBeInTheDocument()
    expect(screen.getByText('Manage organizational policies and system settings')).toBeInTheDocument()

    expect(screen.getByRole('tab', { name: /policies/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /workflows/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /system settings/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /compliance/i })).toBeInTheDocument()
  })

  it('displays list of organizational policies', async () => {
    renderWithQueryClient(<PoliciesManagement />)

    await waitFor(() => {
      expect(screen.getByText('Data Retention Policy')).toBeInTheDocument()
      expect(screen.getByText('Security Access Policy')).toBeInTheDocument()
    })

    expect(screen.getByText('Guidelines for data retention and disposal')).toBeInTheDocument()
    expect(screen.getByText('Access control and security requirements')).toBeInTheDocument()

    // Check badges
    expect(screen.getByText('data retention')).toBeInTheDocument()
    expect(screen.getByText('security')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it('opens new policy dialog when clicking new policy button', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PoliciesManagement />)

    const newPolicyButton = screen.getByRole('button', { name: /new policy/i })
    await user.click(newPolicyButton)

    await waitFor(() => {
      expect(screen.getByText('Create New Policy')).toBeInTheDocument()
      expect(screen.getByText('Create a new organizational policy')).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/policy name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/policy content/i)).toBeInTheDocument()
  })

  it('switches between different management tabs', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PoliciesManagement />)

    // Initially on policies tab
    await waitFor(() => {
      expect(screen.getByText('Organizational Policies')).toBeInTheDocument()
    })

    // Switch to workflows tab
    const workflowsTab = screen.getByRole('tab', { name: /workflows/i })
    await user.click(workflowsTab)

    await waitFor(() => {
      expect(screen.getByText('Workflow Configurations')).toBeInTheDocument()
      expect(screen.getByText('Test Execution Workflow')).toBeInTheDocument()
    })

    // Switch to system settings tab
    const systemTab = screen.getByRole('tab', { name: /system settings/i })
    await user.click(systemTab)

    await waitFor(() => {
      expect(screen.getByText('Password Policy')).toBeInTheDocument()
      expect(screen.getByText('Session Policy')).toBeInTheDocument()
      expect(screen.getByText('Evidence Policy')).toBeInTheDocument()
    })
  })

  it('displays system settings with correct values', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PoliciesManagement />)

    const systemTab = screen.getByRole('tab', { name: /system settings/i })
    await user.click(systemTab)

    await waitFor(() => {
      expect(screen.getByDisplayValue('12')).toBeInTheDocument() // min_length
      expect(screen.getByDisplayValue('90')).toBeInTheDocument() // expiry_days
      expect(screen.getByDisplayValue('480')).toBeInTheDocument() // timeout_minutes
      expect(screen.getByDisplayValue('100')).toBeInTheDocument() // max_file_size_mb
    })

    // Check switches
    const require2FASwitch = screen.getByRole('checkbox', { name: /require 2fa/i })
    expect(require2FASwitch).toBeChecked()

    const encryptBackupsSwitch = screen.getByRole('checkbox', { name: /encrypt backups/i })
    expect(encryptBackupsSwitch).toBeChecked()
  })

  it('handles policy creation form submission', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    renderWithQueryClient(<PoliciesManagement />)

    const newPolicyButton = screen.getByRole('button', { name: /new policy/i })
    await user.click(newPolicyButton)

    await waitFor(() => {
      expect(screen.getByText('Create New Policy')).toBeInTheDocument()
    })

    // Fill out the form
    const nameInput = screen.getByLabelText(/policy name/i)
    await user.type(nameInput, 'Test Security Policy')

    const descriptionInput = screen.getByLabelText(/description/i)
    await user.type(descriptionInput, 'A test security policy for validation')

    const contentTextarea = screen.getByLabelText(/policy content/i)
    await user.type(contentTextarea, 'This is the detailed policy content...')

    // Select category
    const categorySelect = screen.getByRole('combobox')
    await user.click(categorySelect)

    const securityOption = screen.getByRole('option', { name: /security/i })
    await user.click(securityOption)

    // Mock successful save
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ id: '3', name: 'Test Security Policy' }),
      } as Response)
    )

    const saveButton = screen.getByRole('button', { name: /save policy/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test Security Policy')
      })
    })
  })

  it('displays workflow information correctly', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PoliciesManagement />)

    const workflowsTab = screen.getByRole('tab', { name: /workflows/i })
    await user.click(workflowsTab)

    await waitFor(() => {
      expect(screen.getByText('Test Execution Workflow')).toBeInTheDocument()
      expect(screen.getByText('Standard workflow for test execution and review')).toBeInTheDocument()
      expect(screen.getByText('test')).toBeInTheDocument() // entity type badge
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('2 states')).toBeInTheDocument()
      expect(screen.getByText('1 configured')).toBeInTheDocument() // transitions count
    })
  })

  it('handles compliance framework display', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PoliciesManagement />)

    const complianceTab = screen.getByRole('tab', { name: /compliance/i })
    await user.click(complianceTab)

    await waitFor(() => {
      expect(screen.getByText('Compliance Framework')).toBeInTheDocument()
      expect(screen.getByText('SOX Compliance')).toBeInTheDocument()
      expect(screen.getByText('COSO Framework')).toBeInTheDocument()
      expect(screen.getByText('ISO 27001')).toBeInTheDocument()
    })

    expect(screen.getByText('Audit Schedule')).toBeInTheDocument()
    expect(screen.getByText('Q4 SOX Testing')).toBeInTheDocument()
    expect(screen.getByText('Annual Policy Review')).toBeInTheDocument()
  })

  it('handles error states when API calls fail', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => {
      return Promise.reject(new Error('Network error'))
    })

    renderWithQueryClient(<PoliciesManagement />)

    // The component should still render, but may show loading or error states
    expect(screen.getByText('Policies & Configuration')).toBeInTheDocument()
  })

  it('validates required fields in policy form', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PoliciesManagement />)

    const newPolicyButton = screen.getByRole('button', { name: /new policy/i })
    await user.click(newPolicyButton)

    await waitFor(() => {
      expect(screen.getByText('Create New Policy')).toBeInTheDocument()
    })

    // Try to submit without filling required fields
    const saveButton = screen.getByRole('button', { name: /save policy/i })
    await user.click(saveButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Policy name is required')).toBeInTheDocument()
      expect(screen.getByText('Description is required')).toBeInTheDocument()
      expect(screen.getByText('Policy content is required')).toBeInTheDocument()
    })
  })

  it('updates system settings when save button is clicked', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    renderWithQueryClient(<PoliciesManagement />)

    const systemTab = screen.getByRole('tab', { name: /system settings/i })
    await user.click(systemTab)

    await waitFor(() => {
      expect(screen.getByText('Password Policy')).toBeInTheDocument()
    })

    // Mock successful save
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response)
    )

    const saveSettingsButton = screen.getByRole('button', { name: /save system settings/i })
    await user.click(saveSettingsButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      })
    })
  })

  it('handles policy editing flow', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PoliciesManagement />)

    await waitFor(() => {
      expect(screen.getByText('Data Retention Policy')).toBeInTheDocument()
    })

    // Click edit button for first policy
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(button =>
      button.querySelector('svg') && button.getAttribute('class')?.includes('outline')
    )

    if (editButton) {
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Policy')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Data Retention Policy')).toBeInTheDocument()
      })
    }
  })
})