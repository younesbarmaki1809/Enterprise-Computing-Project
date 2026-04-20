export function extractListData(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return []
}

export function extractTotalPages(response, pageSize, list) {
  const pages = Number(response?.data?.pages)

  if (Number.isFinite(pages) && pages > 0) {
    return pages
  }

  const totalFromHeader = Number(response?.headers?.['x-total-count'])

  if (Number.isFinite(totalFromHeader) && totalFromHeader >= 0) {
    return Math.max(1, Math.ceil(totalFromHeader / pageSize))
  }

  const totalFromPayload = Number(response?.data?.items)

  if (Number.isFinite(totalFromPayload) && totalFromPayload >= 0) {
    return Math.max(1, Math.ceil(totalFromPayload / pageSize))
  }

  return Math.max(1, Math.ceil(list.length / pageSize))
}
