export function FilterBar({ filters = [], values, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filters.map((filter) => (
        <label key={filter.key} className="text-sm text-slate-600">
          <span className="mb-1 block font-medium">{filter.label}</span>
          <select
            value={values[filter.key] || ''}
            onChange={(event) => onChange(filter.key, event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            <option value="">All</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}
