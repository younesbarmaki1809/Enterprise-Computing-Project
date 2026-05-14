import api from './axios'

export async function getDepartments() {
  const response = await api.get('/departments')
  return response.data
}

export async function createDepartment(data) {
  const response = await api.post('/departments', data)
  return response.data
}

export async function updateDepartment(id, data) {
  const response = await api.patch(`/departments/${id}`, data)
  return response.data
}
