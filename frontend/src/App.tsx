import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryProvider } from '@/providers/query-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { MainLayout } from '@/components/layout/main-layout'
import { LoginPage } from '@/pages/auth/login'
import { DashboardPage } from '@/pages/dashboard'
import { CompaniesPage } from '@/pages/companies'
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
              <Route path="/processes" element={<div>Processes Page (Coming Soon)</div>} />
              <Route path="/risks" element={<div>Risks Page (Coming Soon)</div>} />
              <Route path="/controls" element={<div>Controls Page (Coming Soon)</div>} />
              <Route path="/tests" element={<div>Tests Page (Coming Soon)</div>} />
              <Route path="/evidence" element={<div>Evidence Page (Coming Soon)</div>} />

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