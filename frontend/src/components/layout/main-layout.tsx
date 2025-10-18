import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/notifications/notification-center'
import {
  Building2,
  Network,
  GitBranch,
  Shield,
  AlertTriangle,
  Grid3x3,
  ClipboardCheck,
  FileCheck,
  Users,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  UserCheck,
  ClipboardList
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'Companies', href: '/companies', icon: Building2, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'Processes', href: '/processes', icon: Network, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'Subprocesses', href: '/subprocesses', icon: GitBranch, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'Risks', href: '/risks', icon: AlertTriangle, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'Controls', href: '/controls', icon: Shield, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'RCM', href: '/rcm', icon: Grid3x3, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'Tests', href: '/tests', icon: ClipboardCheck, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'Evidence', href: '/evidence', icon: FileCheck, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'Issues', href: '/issues', icon: AlertTriangle, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'Assignments', href: '/assignments', icon: UserCheck, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'Reviews', href: '/reviews', icon: ClipboardList, roles: ['Admin', 'Manager', 'Tester', 'Viewer'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['Admin'] },
]

export function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredNavigation = navigation.filter(item =>
    user && item.roles.includes(user.role)
  )

  return (
    <div className="flex h-screen bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-blue-600 focus:shadow-lg"
      >
        Skip to main content
      </a>
      {/* Sidebar */}
      <div className="flex w-64 flex-col bg-gray-900" role="complementary">
        <div className="flex h-16 items-center justify-center bg-gray-800" role="banner">
          <h1 className="text-xl font-bold text-white" aria-label="AssurKit">
            AssurKit
          </h1>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4" aria-label="Primary navigation">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {item.name}
                {isActive && (
                  <ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" />
                )}
              </Link>
            )
          })}
        </nav>
        <div className="flex flex-shrink-0 border-t border-gray-800 p-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6" role="banner">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {filteredNavigation.find(item => location.pathname.startsWith(item.href))?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <time className="text-sm text-gray-600" aria-label="Current date">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-gray-50 p-6" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
