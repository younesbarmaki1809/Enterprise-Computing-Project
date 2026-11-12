import api from './axios'

export async function loginUser(email, password) {
  const response = await api.post('/auth/login', {
    email,
    password,
  })

  const { token, roles } = response.data

  // Map backend roles (ROLE_ADMIN, ROLE_USER) to frontend roles (admin, user)
  const role = roles.includes('ROLE_ADMIN') ? 'admin' : 'user'

  const user = {
    email: response.data.email,
    role,
    roles,
  }

  return {
    user,
    token,
  }
}
