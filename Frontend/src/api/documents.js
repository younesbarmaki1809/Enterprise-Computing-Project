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

export async function createPresignedUpload({ fileName, contentType }) {
  const response = await api.post('/documents/presign-upload', {
    fileName,
    contentType,
  })

  return response.data
}

export async function createPresignedDownload(fileKey) {
  const response = await api.post('/documents/presign-download', { fileKey })
  return response.data
}

export async function getDocumentDownloadUrl(id) {
  const response = await api.get(`/documents/${id}/download-url`)
  return response.data
}

export async function uploadToPresignedUrl(url, file, contentType) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType || 'application/octet-stream',
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error('Failed to upload file')
  }
}
