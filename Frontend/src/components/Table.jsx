import { useMemo, useState } from 'react'

function compareValues(a, b, direction) {
  if (a === b) {
    return 0
  }

  if (a == null) {
    return direction === 'asc' ? -1 : 1
  }

  if (b == null) {
    return direction === 'asc' ? 1 : -1
  }

  return direction === 'asc'
    ? String(a).localeCompare(String(b))
    : String(b).localeCompare(String(a))
}

export function Table({ columns, rows, rowKey, emptyText = 'No records found.' }) {
  const [sort, setSort] = useState(null)

  const sortedRows = useMemo(() => {
    if (!sort) {
      return rows
    }

    return [...rows].sort((first, second) =>
      compareValues(first[sort.key], second[sort.key], sort.direction),
    )
  }, [rows, sort])

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    if (!column.sortable) {
                      return
                    }

                    setSort((current) => {
                      if (!current || current.key !== column.key) {
                        return { key: column.key, direction: 'asc' }
                      }

                      return {
                        key: column.key,
                        direction: current.direction === 'asc' ? 'desc' : 'asc',
                      }
                    })
                  }}
                  className={column.sortable ? 'cursor-pointer' : ''}
                >
                  {column.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.length ? (
            sortedRows.map((row) => (
              <tr
                key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}
                className="border-t border-slate-100"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-slate-700">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
