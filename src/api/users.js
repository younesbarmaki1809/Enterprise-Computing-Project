import api from './axios'

export function getUsers(params = {}) {
  return api.get('/users', { params })
}

export async function createUser(data) {
  const response = await api.post('/users', data)
  return response.data
}

export async function updateUser(id, data) {
  const response = await api.put(`/users/${id}`, data)
  return response.data
}

export async function patchUser(id, data) {
  const response = await api.patch(`/users/${id}`, data)
  return response.data
}
