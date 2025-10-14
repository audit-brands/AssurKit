import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  allowedRoles?: string[]
  children?: React.ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, user, fetchUser } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (!user && isAuthenticated) {
      fetchUser()
    }
  }, [user, isAuthenticated, fetchUser])

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children ? <>{children}</> : <Outlet />
}