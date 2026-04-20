import api from './axios'

export function getDocuments(params = {}) {
  return api.get('/documents', { params })
}

export async function getDocumentById(id) {
  const response = await api.get(`/documents/${id}`)
  return response.data
}

export async function createDocument(data) {
  const response = await api.post('/documents', data)
  return response.data
}

export async function updateDocument(id, data) {
  const response = await api.patch(`/documents/${id}`, data)
  return response.data
}
