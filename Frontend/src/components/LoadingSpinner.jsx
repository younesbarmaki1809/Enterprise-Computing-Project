export function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm text-slate-600 shadow">
        <span className="h-3 w-3 animate-ping rounded-full bg-blue-500" />
        <span>{label}</span>
      </div>
    </div>
  )
}
