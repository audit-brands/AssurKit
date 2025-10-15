import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryProvider } from '@/providers/query-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { MainLayout } from '@/components/layout/main-layout'
import { LoginPage } from '@/pages/auth/login'
import { DashboardPage } from '@/pages/dashboard'
import { CompaniesPage } from '@/pages/companies'
import { ProcessesPage } from '@/pages/processes'
import { SubprocessesPage } from '@/pages/subprocesses'
import { RisksPage } from '@/pages/risks'
import { ControlsPage } from '@/pages/controls'
import { RCMPage } from '@/pages/rcm'
import { TestsPage } from '@/pages/tests'
import { EvidencePage } from '@/pages/evidence'
import { IssuesPage } from '@/pages/issues'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect } from 'react'

function App() {
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    // Check if user is logged in on app load
    fetchUser()
  }, [fetchUser])

  return (
    <QueryProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/processes" element={<ProcessesPage />} />
              <Route path="/subprocesses" element={<SubprocessesPage />} />
              <Route path="/risks" element={<RisksPage />} />
              <Route path="/controls" element={<ControlsPage />} />
              <Route path="/rcm" element={<RCMPage />} />
              <Route path="/tests" element={<TestsPage />} />
              <Route path="/evidence" element={<EvidencePage />} />
              <Route path="/issues" element={<IssuesPage />} />

              {/* Admin only */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <div>Users Management (Coming Soon)</div>
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </Router>
    </QueryProvider>
  )
}

export default App