import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  Users,
  Shield,
  Building2,
  Clock,
  Activity,
  ChevronLeft,
  Menu,
  Bell,
  Workflow,
  Eye
} from 'lucide-react'

interface AdminSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: string
  requiresPermission?: string
}

const adminSections: AdminSection[] = [
  {
    id: 'dashboard',
    title: 'Admin Overview',
    description: 'System status and key metrics',
    icon: Activity,
    path: '/admin',
    badge: undefined
  },
  {
    id: 'users',
    title: 'User Management',
    description: 'Manage users, roles, and permissions',
    icon: Users,
    path: '/admin/users',
    requiresPermission: 'admin.users.manage'
  },
  {
    id: 'roles',
    title: 'Roles & Permissions',
    description: 'Configure role-based access control',
    icon: Shield,
    path: '/admin/roles',
    requiresPermission: 'admin.roles.manage'
  },
  {
    id: 'organization',
    title: 'Organization Setup',
    description: 'Company structure and entity management',
    icon: Building2,
    path: '/admin/organization',
    requiresPermission: 'admin.org.manage'
  },
  {
    id: 'policies',
    title: 'Policies & Workflows',
    description: 'Organizational policies and workflow configuration',
    icon: Workflow,
    path: '/admin/policies',
    requiresPermission: 'admin.policies.manage'
  },
  {
    id: 'periods',
    title: 'Period Management',
    description: 'Fiscal periods and testing cycles',
    icon: Clock,
    path: '/admin/periods',
    requiresPermission: 'admin.periods.manage'
  },
  {
    id: 'system',
    title: 'System Configuration',
    description: 'Global settings and preferences',
    icon: Settings,
    path: '/admin/system',
    requiresPermission: 'admin.system.manage'
  },
  {
    id: 'audit',
    title: 'Audit & Monitoring',
    description: 'Audit trail and system monitoring',
    icon: Eye,
    path: '/admin/audit',
    requiresPermission: 'admin.audit.view'
  }
]

interface AdminLayoutProps {
  currentUser?: {
    id: string
    name: string
    email: string
    permissions: string[]
  }
  children?: React.ReactNode
}

export function AdminLayout({ currentUser, children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true
    return currentUser?.permissions.includes(permission) ||
           currentUser?.permissions.includes('admin.*') || false
  }

  const isActivePath = (path: string): boolean => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  const availableSections = adminSections.filter(section => hasPermission(section.requiresPermission))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Admin Console</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm">
              <div className="font-medium">{currentUser?.name || 'Admin User'}</div>
              <div className="text-muted-foreground">{currentUser?.email || 'admin@example.com'}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-80'} border-r bg-white transition-all duration-200`}>
          <div className="p-6">
            {!sidebarCollapsed && (
              <div className="mb-6">
                <h2 className="font-semibold text-gray-900">Administration</h2>
                <p className="text-sm text-muted-foreground">System configuration and management</p>
              </div>
            )}

            <nav className="space-y-2">
              {availableSections.map((section) => {
                const Icon = section.icon
                const isActive = isActivePath(section.path)

                return (
                  <NavLink
                    key={section.id}
                    to={section.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    {!sidebarCollapsed && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{section.title}</span>
                          {section.badge && (
                            <Badge variant="secondary" className="ml-2">
                              {section.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {section.description}
                        </div>
                      </div>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <NavLink to="/dashboard" className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </NavLink>
            </Button>
          </div>

          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}