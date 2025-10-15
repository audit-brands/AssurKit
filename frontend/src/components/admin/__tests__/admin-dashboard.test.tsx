import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { AdminDashboard } from '../admin-dashboard'

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

const mockStats = {
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

const mockActivityData = [
  { date: '2024-01-01', logins: 42, actions: 156, errors: 2 },
  { date: '2024-01-02', logins: 38, actions: 142, errors: 1 },
  { date: '2024-01-03', logins: 45, actions: 168, errors: 0 },
  { date: '2024-01-04', logins: 41, actions: 134, errors: 3 },
  { date: '2024-01-05', logins: 48, actions: 179, errors: 1 }
]

const mockUserDistribution = [
  { role: 'Admin', count: 5, percentage: 3.3 },
  { role: 'Manager', count: 15, percentage: 10.0 },
  { role: 'Tester', count: 85, percentage: 56.7 },
  { role: 'Viewer', count: 45, percentage: 30.0 }
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

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation((url) => {
      if (url.toString().includes('/api/admin/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockStats,
        } as Response)
      }
      if (url.toString().includes('/api/admin/activity-chart')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockActivityData,
        } as Response)
      }
      if (url.toString().includes('/api/admin/user-distribution')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUserDistribution,
        } as Response)
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`))
    })
  })

  it('renders admin dashboard header and key metrics', async () => {
    renderWithQueryClient(<AdminDashboard />)

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('System overview and health metrics')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument() // total users
      expect(screen.getByText('23')).toBeInTheDocument() // active sessions
      expect(screen.getByText('15 days, 4 hours')).toBeInTheDocument() // uptime
    })
  })

  it('displays user statistics correctly', async () => {
    renderWithQueryClient(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('135 active')).toBeInTheDocument()
      expect(screen.getByText('8 pending')).toBeInTheDocument()
    })
  })

  it('shows system health and security status', async () => {
    renderWithQueryClient(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('System Uptime')).toBeInTheDocument()
      expect(screen.getByText('Security Status')).toBeInTheDocument()
      expect(screen.getByText('Normal')).toBeInTheDocument() // Security status
      expect(screen.getByText('3 failed logins')).toBeInTheDocument()
    })
  })

  it('displays active sessions and activity metrics', async () => {
    renderWithQueryClient(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Active Sessions')).toBeInTheDocument()
      expect(screen.getByText('23')).toBeInTheDocument()
      expect(screen.getByText('45 logins today')).toBeInTheDocument()
    })
  })

  it('switches between different dashboard tabs', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    // Check all tabs are available
    expect(screen.getByRole('tab', { name: /system activity/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /user analytics/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /system health/i })).toBeInTheDocument()

    // Switch to user analytics tab
    const userAnalyticsTab = screen.getByRole('tab', { name: /user analytics/i })
    await user.click(userAnalyticsTab)

    await waitFor(() => {
      expect(screen.getByText('User Distribution by Role')).toBeInTheDocument()
      expect(screen.getByText('User Status Overview')).toBeInTheDocument()
    })

    // Switch to system health tab
    const systemHealthTab = screen.getByRole('tab', { name: /system health/i })
    await user.click(systemHealthTab)

    await waitFor(() => {
      expect(screen.getByText('Storage Usage')).toBeInTheDocument()
      expect(screen.getByText('Security Monitoring')).toBeInTheDocument()
    })
  })

  it('displays activity trends chart data', async () => {
    renderWithQueryClient(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Activity Trends')).toBeInTheDocument()
      expect(screen.getByText('Daily logins and user actions over time')).toBeInTheDocument()
    })

    // Chart should be rendered (testing library may not see chart internals)
    expect(screen.getByText('Activity Trends')).toBeInTheDocument()
  })

  it('shows user distribution pie chart', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AdminDashboard />)

    const userAnalyticsTab = screen.getByRole('tab', { name: /user analytics/i })
    await user.click(userAnalyticsTab)

    await waitFor(() => {
      expect(screen.getByText('User Distribution by Role')).toBeInTheDocument()
      expect(screen.getByText('Breakdown of users across different roles')).toBeInTheDocument()
    })
  })

  it('displays storage usage information', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AdminDashboard />)

    const systemHealthTab = screen.getByRole('tab', { name: /system health/i })
    await user.click(systemHealthTab)

    await waitFor(() => {
      expect(screen.getByText('Storage Usage')).toBeInTheDocument()
      expect(screen.getByText('Database Size')).toBeInTheDocument()
      expect(screen.getByText('2.3 GB')).toBeInTheDocument()
      expect(screen.getByText('Storage Used')).toBeInTheDocument()
      expect(screen.getByText('16% used')).toBeInTheDocument() // 15.7/100 rounded
      expect(screen.getByText('15.7GB of 100GB')).toBeInTheDocument()
    })
  })

  it('shows security monitoring details', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AdminDashboard />)

    const systemHealthTab = screen.getByRole('tab', { name: /system health/i })
    await user.click(systemHealthTab)

    await waitFor(() => {
      expect(screen.getByText('Security Monitoring')).toBeInTheDocument()
      expect(screen.getByText('Failed Login Attempts')).toBeInTheDocument()
      expect(screen.getByText('Suspicious Activities')).toBeInTheDocument()
      expect(screen.getByText('Policy Violations')).toBeInTheDocument()
    })
  })

  it('handles refresh functionality', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    renderWithQueryClient(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/stats')
    })
  })

  it('displays recent activity feed', async () => {
    renderWithQueryClient(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
      expect(screen.getByText('Latest system actions and events')).toBeInTheDocument()
    })

    // Should show some sample activity items
    expect(screen.getByText('User login successful')).toBeInTheDocument()
    expect(screen.getByText('john.doe@company.com • 2 min ago')).toBeInTheDocument()
    expect(screen.getByText('System configuration updated')).toBeInTheDocument()
    expect(screen.getByText('New user pending approval')).toBeInTheDocument()
  })

  it('shows appropriate security alert when failed logins are high', async () => {
    const mockFetch = vi.mocked(fetch)
    const highFailureStats = {
      ...mockStats,
      security: {
        failed_logins: 25, // High number
        suspicious_activity: 2,
        policy_violations: 1
      }
    }

    mockFetch.mockImplementation((url) => {
      if (url.toString().includes('/api/admin/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => highFailureStats,
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response)
    })

    renderWithQueryClient(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Alert')).toBeInTheDocument() // Security status changes to Alert
      expect(screen.getByText('25 failed logins')).toBeInTheDocument()
    })
  })

  it('handles loading state correctly', () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => {
      return new Promise(() => {}) // Never resolves - stays in loading
    })

    renderWithQueryClient(<AdminDashboard />)

    // Should show loading skeletons
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()

    // Loading skeletons should be visible
    const loadingElements = screen.getAllByRole('generic')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('handles error state when API fails', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => {
      return Promise.reject(new Error('Network error'))
    })

    renderWithQueryClient(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load admin statistics')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('handles retry functionality on error', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)

    // First call fails
    mockFetch.mockImplementationOnce(() => {
      return Promise.reject(new Error('Network error'))
    })

    // Second call succeeds
    mockFetch.mockImplementationOnce(() => {
      return Promise.resolve({
        ok: true,
        json: async () => mockStats,
      } as Response)
    })

    renderWithQueryClient(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load admin statistics')).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: /retry/i })
    await user.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument() // Should show data now
    })
  })

  it('calculates and displays storage percentage correctly', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AdminDashboard />)

    const systemHealthTab = screen.getByRole('tab', { name: /system health/i })
    await user.click(systemHealthTab)

    await waitFor(() => {
      // 15.7/100 = 15.7%, rounded to 16%
      expect(screen.getByText('16% used')).toBeInTheDocument()
    })
  })

  it('displays user status progress bars correctly', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AdminDashboard />)

    const userAnalyticsTab = screen.getByRole('tab', { name: /user analytics/i })
    await user.click(userAnalyticsTab)

    await waitFor(() => {
      expect(screen.getByText('User Status Overview')).toBeInTheDocument()
      expect(screen.getByText('Active Users')).toBeInTheDocument()
      expect(screen.getByText('135 of 150')).toBeInTheDocument()
      expect(screen.getByText('Pending Approval')).toBeInTheDocument()
      expect(screen.getByText('Suspended')).toBeInTheDocument()
    })
  })
})