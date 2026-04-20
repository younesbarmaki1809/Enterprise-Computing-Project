import { useApp } from '../context/AppContext'

export function ToastContainer() {
  const { state, removeNotification } = useApp()

  if (!state.notifications.length) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 space-y-2">
      {state.notifications.map((notification) => (
        <div
          key={notification.id}
          className={`pointer-events-auto min-w-72 rounded-lg px-4 py-3 text-sm shadow ${
            notification.type === 'error'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{notification.message}</span>
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              className="font-semibold"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
