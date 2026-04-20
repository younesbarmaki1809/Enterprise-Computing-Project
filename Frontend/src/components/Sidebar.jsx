import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const linksByRole = {
  user: [
    { to: '/documents', label: 'Documents' },
  ],
  admin: [
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/departments', label: 'Departments' },
    { to: '/admin/categories', label: 'Categories' },
  ],
}

export function Sidebar() {
  const { user } = useAuth()
  const links = linksByRole[user?.role] || []

  return (
    <aside className="w-full border-r border-slate-200 bg-white p-4 md:w-56">
      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
