import api from './axios'

export async function getVersionsByDocument(docId) {
  const response = await api.get('/versions', {
    params: {
      documentId: docId,
      _sort: 'versionNumber',
      _order: 'desc',
    },
  })

  return response.data
}

export async function createVersion(data) {
  const response = await api.post('/versions', data)
  return response.data
}
