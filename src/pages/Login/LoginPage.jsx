import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const { user, login } = useAuth()
  const { addNotification } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    navigate(user.role === 'admin' ? '/admin/users' : '/documents', {
      replace: true,
    })
  }, [navigate, user])

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const loggedInUser = await login(email, password)
      addNotification(`Welcome ${loggedInUser.name}!`)

      navigate(loggedInUser.role === 'admin' ? '/admin/users' : '/documents', {
        replace: true,
      })
    } catch (error) {
      addNotification(error.message || 'Failed to login', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Login</h1>
      <p className="mb-6 text-sm text-slate-500">Sign in to access your documents.</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-left text-sm text-slate-700">
          <span className="mb-1 block">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-left text-sm text-slate-700">
          <span className="mb-1 block">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
