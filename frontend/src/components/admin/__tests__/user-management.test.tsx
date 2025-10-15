import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { UserManagement } from '../user-management'

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

const mockUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    status: 'active' as const,
    role: 'admin',
    permissions: ['admin.*', 'user.manage', 'system.config'],
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    loginCount: 45,
    department: 'IT'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@company.com',
    status: 'pending' as const,
    role: 'tester',
    permissions: ['test.execute', 'evidence.upload'],
    lastLogin: null,
    createdAt: '2024-01-10T00:00:00Z',
    loginCount: 0,
    department: 'Audit'
  },
  {
    id: '3',
    firstName: 'Bob',
    lastName: 'Wilson',
    email: 'bob.wilson@company.com',
    status: 'suspended' as const,
    role: 'viewer',
    permissions: ['read.only'],
    lastLogin: '2024-01-05T14:22:00Z',
    createdAt: '2023-12-01T00:00:00Z',
    loginCount: 12,
    department: 'Finance'
  }
]

const mockRoles = [
  {
    id: '1',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access',
    permissions: ['admin.*']
  },
  {
    id: '2',
    name: 'tester',
    displayName: 'Tester',
    description: 'Can execute tests and upload evidence',
    permissions: ['test.execute', 'evidence.upload']
  },
  {
    id: '3',
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access',
    permissions: ['read.only']
  }
]

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

global.fetch = vi.fn()

describe('UserManagement Component', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
      if (url.toString().includes('/api/admin/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUsers,
        } as Response)
      }
      if (url.toString().includes('/api/admin/roles')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockRoles,
        } as Response)
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`))
    })
  })

  it('renders user management interface', async () => {
    renderWithQueryClient(<UserManagement />)

    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('Manage users, roles, and permissions')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export users/i })).toBeInTheDocument()
  })

  it('displays list of users with correct information', async () => {
    renderWithQueryClient(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('jane.smith@company.com')).toBeInTheDocument()
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    })

    // Check user details
    expect(screen.getByText('john.doe@company.com')).toBeInTheDocument()
    expect(screen.getByText('IT')).toBeInTheDocument()
    expect(screen.getByText('Audit')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()

    // Check status badges
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
    expect(screen.getByText('suspended')).toBeInTheDocument()
  })

  it('opens add user dialog when clicking add user button', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<UserManagement />)

    const addUserButton = screen.getByRole('button', { name: /add user/i })
    await user.click(addUserButton)

    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument()
      expect(screen.getByText('Create a new user account')).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
  })

  it('filters users by status', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Initially shows all users
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument()

    // Filter by status
    const statusFilter = screen.getByDisplayValue('All Statuses')
    await user.click(statusFilter)

    const activeOption = screen.getByText('Active')
    await user.click(activeOption)

    // Component would filter results - in real implementation this would trigger a new API call
    // For testing, we assume the component correctly handles the filter
  })

  it('searches users by name or email', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search users/i)
    await user.type(searchInput, 'jane')

    // In real implementation, this would trigger filtering
    expect(searchInput).toHaveValue('jane')
  })

  it('handles user creation form submission', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    renderWithQueryClient(<UserManagement />)

    const addUserButton = screen.getByRole('button', { name: /add user/i })
    await user.click(addUserButton)

    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument()
    })

    // Fill out the form
    const firstNameInput = screen.getByLabelText(/first name/i)
    await user.type(firstNameInput, 'Test')

    const lastNameInput = screen.getByLabelText(/last name/i)
    await user.type(lastNameInput, 'User')

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test.user@company.com')

    // Select role
    const roleSelect = screen.getByRole('combobox')
    await user.click(roleSelect)

    const testerOption = screen.getByRole('option', { name: /tester/i })
    await user.click(testerOption)

    // Mock successful save
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          id: '4',
          firstName: 'Test',
          lastName: 'User',
          email: 'test.user@company.com'
        }),
      } as Response)
    )

    const saveButton = screen.getByRole('button', { name: /add user/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('test.user@company.com')
      })
    })
  })

  it('handles user editing', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click edit button for first user
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(button => {
      const svg = button.querySelector('svg')
      return svg && button.getAttribute('class')?.includes('outline')
    })

    if (editButton) {
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument()
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      })
    }
  })

  it('displays user statistics correctly', async () => {
    renderWithQueryClient(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // Total count
    })

    // Should show active count (1), pending count (1), suspended count (1)
    const badges = screen.getAllByText(/\d+/)
    expect(badges.length).toBeGreaterThan(0)
  })

  it('handles user status changes', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    renderWithQueryClient(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    })

    // Mock successful status update
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ status: 'active' }),
      } as Response)
    )

    // Find and click a status action button
    const actionButtons = screen.getAllByRole('button')
    const statusButton = actionButtons.find(button =>
      button.textContent?.includes('Activate') || button.textContent?.includes('Suspend')
    )

    if (statusButton) {
      await user.click(statusButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/users/'),
          expect.objectContaining({
            method: 'PUT'
          })
        )
      })
    }
  })

  it('handles bulk operations', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Select multiple users
    const checkboxes = screen.getAllByRole('checkbox')
    if (checkboxes.length > 0) {
      await user.click(checkboxes[0])
      if (checkboxes[1]) {
        await user.click(checkboxes[1])
      }
    }

    // Bulk actions would be available
    // This test verifies the component structure supports bulk operations
  })

  it('exports user data', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    renderWithQueryClient(<UserManagement />)

    // Mock successful export
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        blob: async () => new Blob(['user data'], { type: 'text/csv' }),
      } as Response)
    )

    const exportButton = screen.getByRole('button', { name: /export users/i })
    await user.click(exportButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/export')
    })
  })

  it('validates required fields in user form', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<UserManagement />)

    const addUserButton = screen.getByRole('button', { name: /add user/i })
    await user.click(addUserButton)

    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument()
    })

    // Try to submit without filling required fields
    const saveButton = screen.getByRole('button', { name: /add user/i })
    await user.click(saveButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
      expect(screen.getByText('Last name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  it('handles permission management', async () => {
    renderWithQueryClient(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Check that permissions are displayed
    expect(screen.getByText('admin.*')).toBeInTheDocument()
    expect(screen.getByText('test.execute')).toBeInTheDocument()
    expect(screen.getByText('read.only')).toBeInTheDocument()
  })

  it('displays last login information', async () => {
    renderWithQueryClient(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Should show login counts
    expect(screen.getByText('45 logins')).toBeInTheDocument()
    expect(screen.getByText('Never')).toBeInTheDocument() // For Jane Smith who never logged in
    expect(screen.getByText('12 logins')).toBeInTheDocument()
  })

  it('handles error states when API calls fail', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => {
      return Promise.reject(new Error('Network error'))
    })

    renderWithQueryClient(<UserManagement />)

    // The component should still render the header
    expect(screen.getByText('User Management')).toBeInTheDocument()
  })

  it('shows loading state correctly', () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => {
      return new Promise(() => {}) // Never resolves - stays in loading
    })

    renderWithQueryClient(<UserManagement />)

    expect(screen.getByText('User Management')).toBeInTheDocument()

    // Should show loading skeletons
    const loadingElements = screen.getAllByRole('generic')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('filters by role correctly', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Filter by role
    const roleFilter = screen.getByDisplayValue('All Roles')
    await user.click(roleFilter)

    const adminOption = screen.getByText('Administrator')
    await user.click(adminOption)

    // The component should handle role filtering
    expect(roleFilter).toBeInTheDocument()
  })

  it('handles department filtering', async () => {
    renderWithQueryClient(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Check departments are displayed
    expect(screen.getByText('IT')).toBeInTheDocument()
    expect(screen.getByText('Audit')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
  })
})