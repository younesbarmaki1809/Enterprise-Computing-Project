import { useEffect, useState } from 'react'

export function SearchBar({ value = '', onChange, placeholder = 'Search...' }) {
  const [term, setTerm] = useState(value)

  useEffect(() => {
    setTerm(value)
  }, [value])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onChange(term)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [term, onChange])

  return (
    <input
      type="search"
      value={term}
      onChange={(event) => setTerm(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
    />
  )
}
