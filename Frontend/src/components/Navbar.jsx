import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Badge } from './Badge'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Enterprise Document Management
        </h1>
        <p className="text-sm text-slate-500">Welcome back, {user?.name}</p>
      </div>

      <div className="flex items-center gap-3">
        <Badge value={user?.role} />
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
