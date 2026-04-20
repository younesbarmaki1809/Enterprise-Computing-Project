import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from './LoadingSpinner'

export function ProtectedRoute({ children, role }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner label="Checking your access..." />
  }

  if (!user || user.role !== role) {
    return <Navigate to="/login" replace />
  }

  return children
}
