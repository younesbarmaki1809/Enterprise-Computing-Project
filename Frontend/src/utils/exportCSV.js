export function exportRowsToCSV(rows, fileName) {
  if (!rows.length) {
    return
  }

  const headers = Object.keys(rows[0])
  const csvBody = rows.map((row) =>
    headers
      .map((header) => {
        const value = row[header] ?? ''
        return `"${String(value).replaceAll('"', '""')}"`
      })
      .join(','),
  )

  const csv = [headers.join(','), ...csvBody].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
