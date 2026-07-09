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
