import api from './axios'

export async function getCommentsByDocument(docId) {
  const response = await api.get('/comments', {
    params: {
      documentId: docId,
      _sort: 'createdAt',
      _order: 'desc',
    },
  })

  return response.data
}

export async function addComment(data) {
  const response = await api.post('/comments', data)
  return response.data
}
