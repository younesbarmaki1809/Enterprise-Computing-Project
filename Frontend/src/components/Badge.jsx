const colorMap = {
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-rose-100 text-rose-700',
  admin: 'bg-indigo-100 text-indigo-700',
  user: 'bg-sky-100 text-sky-700',
}

export function Badge({ value }) {
  const key = String(value || '').toLowerCase()
  const classes = colorMap[key] || 'bg-slate-100 text-slate-700'

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classes}`}>
      {value}
    </span>
  )
}
