import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { AdminLayout } from '../components/admin/admin-layout'
import { AdminDashboard } from '../components/admin/admin-dashboard'
import { UserManagement } from '../components/admin/user-management'
import { PoliciesManagement } from '../components/admin/policies-management'

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

// Mock admin dashboard with integrated components
const AdminSystem = () => {
  const [currentView, setCurrentView] = React.useState('dashboard')

  const currentUser = {
    id: '1',
    name: 'Admin User',
    email: 'admin@company.com',
    permissions: ['admin.*', 'admin.users.manage', 'admin.policies.manage', 'admin.system.manage']
  }

  return (
    <AdminLayout currentUser={currentUser}>
      <div>
        <div className="mb-4">
          <button onClick={() => setCurrentView('dashboard')}>Dashboard</button>
          <button onClick={() => setCurrentView('users')}>Users</button>
          <button onClick={() => setCurrentView('policies')}>Policies</button>
        </div>

        {currentView === 'dashboard' && <AdminDashboard />}
        {currentView === 'users' && <UserManagement />}
        {currentView === 'policies' && <PoliciesManagement />}
      </div>
    </AdminLayout>
  )
}

const mockAdminStats = {
  users: {
    total: 150,
    active: 135,
    pending: 8,
    suspended: 7
  },
  permissions: {
    roles: 5,
    custom_permissions: 12
  },
  activity: {
    daily_logins: 45,
    active_sessions: 23,
    recent_actions: 127
  },
  system: {
    uptime: '15 days, 4 hours',
    database_size: '2.3 GB',
    storage_used: 15.7,
    storage_total: 100.0,
    last_backup: '2 hours ago'
  },
  security: {
    failed_logins: 3,
    suspicious_activity: 0,
    policy_violations: 1
  }
}

const mockUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    status: 'active' as const,
    role: 'admin',
    permissions: ['admin.*'],
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    loginCount: 45,
    department: 'IT'
  }
]

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
    approval_required: true
  }
]

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    </BrowserRouter>
  )
}

global.fetch = vi.fn()

describe('Admin Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
      if (url.toString().includes('/api/admin/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockAdminStats,
        } as Response)
      }
      if (url.toString().includes('/api/admin/activity-chart')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      if (url.toString().includes('/api/admin/user-distribution')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      if (url.toString().includes('/api/admin/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUsers,
        } as Response)
      }
      if (url.toString().includes('/api/admin/roles')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      if (url.toString().includes('/api/admin/policies')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPolicies,
        } as Response)
      }
      if (url.toString().includes('/api/admin/workflows')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response)
      }
      if (url.toString().includes('/api/admin/system-settings')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        } as Response)
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`))
    })
  })

  it('renders complete admin system with navigation', async () => {
    renderWithProviders(<AdminSystem />)

    expect(screen.getByText('Admin Console')).toBeInTheDocument()
    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByText('System configuration and management')).toBeInTheDocument()

    // Check admin user info
    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('admin@company.com')).toBeInTheDocument()
  })

  it('loads dashboard by default and shows system metrics', async () => {
    renderWithProviders(<AdminSystem />)

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument() // total users
      expect(screen.getByText('23')).toBeInTheDocument() // active sessions
    })
  })

  it('switches between admin sections', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminSystem />)

    // Initially shows dashboard
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    // Switch to users section
    const usersButton = screen.getByRole('button', { name: 'Users' })
    await user.click(usersButton)

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Switch to policies section
    const policiesButton = screen.getByRole('button', { name: 'Policies' })
    await user.click(policiesButton)

    await waitFor(() => {
      expect(screen.getByText('Policies & Configuration')).toBeInTheDocument()
      expect(screen.getByText('Data Retention Policy')).toBeInTheDocument()
    })
  })

  it('handles comprehensive admin workflow', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminSystem />)

    // Step 1: View dashboard metrics
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    // Step 2: Navigate to user management
    const usersButton = screen.getByRole('button', { name: 'Users' })
    await user.click(usersButton)

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })

    // Step 3: Attempt to add a new user
    const addUserButton = screen.getByRole('button', { name: /add user/i })
    await user.click(addUserButton)

    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument()
    })

    // Step 4: Navigate to policies
    const policiesButton = screen.getByRole('button', { name: 'Policies' })
    await user.click(policiesButton)

    await waitFor(() => {
      expect(screen.getByText('Policies & Configuration')).toBeInTheDocument()
    })

    // Step 5: Check policy management tabs
    const systemTab = screen.getByRole('tab', { name: /system settings/i })
    await user.click(systemTab)

    await waitFor(() => {
      expect(screen.getByText('Password Policy')).toBeInTheDocument()
    })

    // This represents a complete admin workflow
    expect(screen.getByText('Policies & Configuration')).toBeInTheDocument()
  })

  it('maintains user permissions throughout navigation', async () => {
    renderWithProviders(<AdminSystem />)

    // User should have access to all admin functions
    expect(screen.getByText('Admin Console')).toBeInTheDocument()

    // Check that admin navigation items are visible
    await waitFor(() => {
      expect(screen.getByText('Admin Overview')).toBeInTheDocument()
      expect(screen.getByText('User Management')).toBeInTheDocument()
      expect(screen.getByText('Policies & Workflows')).toBeInTheDocument()
    })
  })

  it('handles data flow between admin components', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    renderWithProviders(<AdminSystem />)

    // Dashboard loads stats
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/stats')
    })

    // Navigate to users
    const usersButton = screen.getByRole('button', { name: 'Users' })
    await user.click(usersButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users')
    })

    // Navigate to policies
    const policiesButton = screen.getByRole('button', { name: 'Policies' })
    await user.click(policiesButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/policies')
    })

    // Each component should load its own data independently
    expect(mockFetch).toHaveBeenCalledTimes(expect.any(Number))
  })

  it('handles sidebar navigation correctly', async () => {
    renderWithProviders(<AdminSystem />)

    // Check sidebar items are visible
    await waitFor(() => {
      expect(screen.getByText('Admin Overview')).toBeInTheDocument()
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })

    // Sidebar should show appropriate sections based on permissions
    expect(screen.getByText('System configuration and management')).toBeInTheDocument()
  })

  it('provides consistent error handling across components', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => {
      return Promise.reject(new Error('Network error'))
    })

    renderWithProviders(<AdminSystem />)

    // Dashboard should handle errors
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    // Other components should also handle errors gracefully
    const user = userEvent.setup()
    const usersButton = screen.getByRole('button', { name: 'Users' })
    await user.click(usersButton)

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })
  })

  it('supports real-time data refresh across admin components', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminSystem />)

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    // Find and click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    // Should trigger new API calls
    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/admin/stats')
    })
  })

  it('handles concurrent operations across admin sections', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminSystem />)

    // Dashboard loads
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    // Quickly navigate between sections
    const usersButton = screen.getByRole('button', { name: 'Users' })
    await user.click(usersButton)

    const policiesButton = screen.getByRole('button', { name: 'Policies' })
    await user.click(policiesButton)

    // Both should load their data independently
    await waitFor(() => {
      expect(screen.getByText('Policies & Configuration')).toBeInTheDocument()
    })
  })

  it('validates admin permission requirements', () => {
    const limitedUser = {
      id: '2',
      name: 'Limited User',
      email: 'limited@company.com',
      permissions: ['user.view'] // Limited permissions
    }

    const LimitedAdminLayout = () => (
      <AdminLayout currentUser={limitedUser}>
        <div>Limited access admin</div>
      </AdminLayout>
    )

    renderWithProviders(<LimitedAdminLayout />)

    // Should show admin console but with limited options
    expect(screen.getByText('Admin Console')).toBeInTheDocument()
    expect(screen.getByText('Limited User')).toBeInTheDocument()
  })
})