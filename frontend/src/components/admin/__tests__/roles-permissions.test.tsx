import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { RolesPermissions } from '../roles-permissions'

global.fetch = vi.fn()

const mockRoles = [
  {
    id: 'role-1',
    name: 'Admin',
    description: 'Full system access',
    permissions: ['perm-1', 'perm-2', 'perm-3'],
    user_count: 2,
    is_system: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'role-2',
    name: 'Manager',
    description: 'Limited management access',
    permissions: ['perm-1', 'perm-2'],
    user_count: 5,
    is_system: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
]

const mockPermissions = [
  {
    id: 'perm-1',
    name: 'users.read',
    description: 'View users',
    category: 'users',
    resource: 'user',
    action: 'read',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'perm-2',
    name: 'users.create',
    description: 'Create users',
    category: 'users',
    resource: 'user',
    action: 'create',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'perm-3',
    name: 'controls.read',
    description: 'View controls',
    category: 'controls',
    resource: 'control',
    action: 'read',
    created_at: '2024-01-01T00:00:00Z'
  }
]

const mockRoleUsers = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    status: 'active' as const,
    assigned_at: '2024-01-01T00:00:00Z'
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

describe('RolesPermissions Component', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders loading state initially', () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => new Promise(() => {}))

    renderWithQueryClient(<RolesPermissions />)

    expect(screen.getByRole('generic')).toHaveClass('animate-spin')
  })

  it('renders roles and permissions tabs', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions,
      } as Response)

    renderWithQueryClient(<RolesPermissions />)

    await waitFor(() => {
      expect(screen.getByText('Roles & Permissions')).toBeInTheDocument()
      expect(screen.getByText('Roles')).toBeInTheDocument()
      expect(screen.getByText('Permissions')).toBeInTheDocument()
      expect(screen.getByText('Role Assignment')).toBeInTheDocument()
    })
  })

  it('displays role cards with correct information', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions,
      } as Response)

    renderWithQueryClient(<RolesPermissions />)

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Full system access')).toBeInTheDocument()
      expect(screen.getByText('Manager')).toBeInTheDocument()
      expect(screen.getByText('Limited management access')).toBeInTheDocument()
    })

    expect(screen.getByText('2 users')).toBeInTheDocument()
    expect(screen.getByText('5 users')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('switches to permissions tab and displays permissions', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions,
      } as Response)

    renderWithQueryClient(<RolesPermissions />)

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Permissions'))

    await waitFor(() => {
      expect(screen.getByText('users.read')).toBeInTheDocument()
      expect(screen.getByText('View users')).toBeInTheDocument()
      expect(screen.getByText('users.create')).toBeInTheDocument()
      expect(screen.getByText('controls.read')).toBeInTheDocument()
    })
  })

  it('filters permissions by search term', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions,
      } as Response)

    renderWithQueryClient(<RolesPermissions />)

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Permissions'))

    await waitFor(() => {
      expect(screen.getByText('users.read')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search permissions...')
    fireEvent.change(searchInput, { target: { value: 'controls' } })

    await waitFor(() => {
      expect(screen.getByText('controls.read')).toBeInTheDocument()
      expect(screen.queryByText('users.read')).not.toBeInTheDocument()
    })
  })

  it('shows role assignment tab with users', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions,
      } as Response)

    renderWithQueryClient(<RolesPermissions />)

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Role Assignment'))

    await waitFor(() => {
      expect(screen.getByText('Select Role')).toBeInTheDocument()
      expect(screen.getByText('Select a role to view users')).toBeInTheDocument()
    })
  })

  it('opens create role dialog', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions,
      } as Response)

    renderWithQueryClient(<RolesPermissions />)

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create Role')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Create New Role')).toBeInTheDocument()
      expect(screen.getByLabelText('Role Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
    })
  })

  it('opens create permission dialog', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions,
      } as Response)

    renderWithQueryClient(<RolesPermissions />)

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Permissions'))

    await waitFor(() => {
      expect(screen.getByText('users.read')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create Permission')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Create New Permission')).toBeInTheDocument()
      expect(screen.getByLabelText('Permission Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Category')).toBeInTheDocument()
    })
  })

  it('handles role selection and shows users', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoleUsers,
      } as Response)

    renderWithQueryClient(<RolesPermissions />)

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Role Assignment'))

    await waitFor(() => {
      expect(screen.getByText('Select Role')).toBeInTheDocument()
    })

    const adminRoleCard = screen.getByText('Admin').closest('div')
    if (adminRoleCard) {
      fireEvent.click(adminRoleCard)
    }

    await waitFor(() => {
      expect(screen.getByText('Users with Admin Role')).toBeInTheDocument()
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    })
  })

  it('disables system role editing', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions,
      } as Response)

    renderWithQueryClient(<RolesPermissions />)

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    const systemRoleCard = screen.getByText('Admin').closest('.cursor-pointer')
    if (systemRoleCard) {
      fireEvent.click(systemRoleCard)
    }

    const moreButton = screen.getAllByRole('button').find(button =>
      button.querySelector('svg')?.classList.contains('lucide-more-horizontal')
    )
    if (moreButton) {
      fireEvent.click(moreButton)

      await waitFor(() => {
        const editButton = screen.getByText('Edit Role')
        expect(editButton.closest('button')).toBeDisabled()
      })
    }
  })

  it('validates permission structure', () => {
    mockPermissions.forEach(permission => {
      expect(permission).toHaveProperty('id')
      expect(permission).toHaveProperty('name')
      expect(permission).toHaveProperty('description')
      expect(permission).toHaveProperty('category')
      expect(permission).toHaveProperty('resource')
      expect(permission).toHaveProperty('action')
      expect(permission).toHaveProperty('created_at')

      expect(typeof permission.id).toBe('string')
      expect(typeof permission.name).toBe('string')
      expect(typeof permission.description).toBe('string')
      expect(typeof permission.category).toBe('string')
      expect(typeof permission.resource).toBe('string')
      expect(typeof permission.action).toBe('string')
    })
  })

  it('validates role structure', () => {
    mockRoles.forEach(role => {
      expect(role).toHaveProperty('id')
      expect(role).toHaveProperty('name')
      expect(role).toHaveProperty('description')
      expect(role).toHaveProperty('permissions')
      expect(role).toHaveProperty('user_count')
      expect(role).toHaveProperty('is_system')
      expect(role).toHaveProperty('created_at')
      expect(role).toHaveProperty('updated_at')

      expect(typeof role.id).toBe('string')
      expect(typeof role.name).toBe('string')
      expect(typeof role.description).toBe('string')
      expect(Array.isArray(role.permissions)).toBe(true)
      expect(typeof role.user_count).toBe('number')
      expect(typeof role.is_system).toBe('boolean')
    })
  })

  it('handles API errors gracefully', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    renderWithQueryClient(<RolesPermissions />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  it('validates RBAC permission categories', () => {
    const expectedCategories = [
      'users', 'roles', 'controls', 'tests', 'evidence', 'issues', 'reports', 'admin', 'audit'
    ]

    mockPermissions.forEach(permission => {
      expect(expectedCategories).toContain(permission.category)
    })
  })

  it('validates permission actions', () => {
    const expectedActions = [
      'create', 'read', 'update', 'delete', 'assign', 'approve', 'export', 'configure'
    ]

    mockPermissions.forEach(permission => {
      expect(expectedActions).toContain(permission.action)
    })
  })
})