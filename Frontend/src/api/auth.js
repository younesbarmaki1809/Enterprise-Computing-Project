import api from './axios'

export async function loginUser(email, password) {
  const response = await api.get('/users', {
    params: {
      email,
      password,
    },
  })

  if (!response.data.length) {
    throw new Error('Invalid email or password')
  }

  const user = response.data[0]
  const token = btoa(`${user.id}:${user.email}:${Date.now()}`)

  return {
    user,
    token,
  }
}
