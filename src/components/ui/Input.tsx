import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export function Input({ label, error, hint, icon, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`
            w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#2B3440]
            placeholder:text-[#64748B] outline-none transition-all duration-200
            focus:border-teal-500 focus:ring-2 focus:ring-teal-100
            disabled:bg-[#F4F7F6] disabled:cursor-not-allowed
            ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200'}
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {hint && !error && <p className="text-xs text-[#64748B]">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string | number; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#2B3440] outline-none
          transition-all duration-200 cursor-pointer
          focus:border-teal-500 focus:ring-2 focus:ring-teal-100
          disabled:bg-[#F4F7F6] disabled:cursor-not-allowed
          ${error ? 'border-red-400' : 'border-gray-200'}
          ${className}
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const taId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={taId} className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={taId}
        rows={3}
        className={`
          w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#2B3440]
          placeholder:text-[#64748B] outline-none transition-all duration-200 resize-none
          focus:border-teal-500 focus:ring-2 focus:ring-teal-100
          ${error ? 'border-red-400' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface MultiSelectProps {
  label?: string
  selectedValues: string[]
  onChange: (values: string[]) => void
  options: { value: string | number; label: string }[]
  placeholder?: string
  className?: string
}

export function MultiSelect({
  label,
  selectedValues,
  onChange,
  options,
  placeholder = 'Pilih...',
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val))
    } else {
      onChange([...selectedValues, val])
    }
  }

  const selectedLabels = options
    .filter(opt => selectedValues.includes(String(opt.value)))
    .map(opt => opt.label)

  return (
    <div className="flex flex-col gap-1 relative" ref={containerRef}>
      {label && (
        <span className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-xs text-[#2B3440] outline-none
          transition-all duration-200 cursor-pointer min-h-[38px] text-left border-gray-200
          focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${className}
        `}
      >
        <span className="truncate pr-4 font-medium">
          {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
        </span>
        <span className="text-gray-400 text-[10px] shrink-0 select-none">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto py-1 w-52">
          {options.map(opt => {
            const valStr = String(opt.value)
            const checked = selectedValues.includes(valStr)
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-2 hover:bg-teal-50/40 cursor-pointer text-xs text-[#2B3440] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleOption(valStr)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="font-medium">{opt.label}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
