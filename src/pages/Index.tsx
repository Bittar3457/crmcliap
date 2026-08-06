import { useAuth } from '@/hooks/use-auth'
import Login from './Login'
import Dashboard from './Dashboard'

export default function Index() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return <Dashboard />
}
