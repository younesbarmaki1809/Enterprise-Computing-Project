export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        Prev
      </button>

      <span className="text-sm text-slate-600">
        Page {page} / {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )
}
