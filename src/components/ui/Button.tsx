import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'

  const variants = {
    primary:   'bg-teal-500 hover:bg-teal-600 text-white focus:ring-teal-400 shadow-sm hover:shadow-md',
    secondary: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-400 shadow-sm hover:shadow-md',
    danger:    'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
    ghost:     'bg-transparent hover:bg-teal-50 text-teal-600 focus:ring-teal-300',
    outline:   'border-2 border-teal-500 text-teal-600 hover:bg-teal-50 focus:ring-teal-300 bg-white',
  }

  const sizes = {
    sm:  'px-3 py-1.5 text-xs',
    md:  'px-4 py-2 text-sm',
    lg:  'px-6 py-3 text-base',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
        </svg>
      ) : icon}
      {children}
    </button>
  )
}
