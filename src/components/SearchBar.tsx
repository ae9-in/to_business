import { Search } from 'lucide-react'

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search shops, phones, areas, products...',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />
    </label>
  )
}
