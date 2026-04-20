export function formatDate(value) {
  if (!value) {
    return 'N/A'
  }

  return new Date(value).toLocaleString()
}
