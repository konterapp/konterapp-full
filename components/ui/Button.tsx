'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'light'
  | 'warning-light'
  | 'outline-primary'
  | 'outline-danger'
  | 'outline-warning'
  | 'outline-secondary';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: LucideIcon;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#2a4061] text-white hover:bg-[#1e2f47]',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  success: 'bg-green-600 text-white hover:bg-green-700',
  warning: 'bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f]',
  light: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  'warning-light': 'bg-[#EBC170]/10 text-[#d4ab5f] border border-[#EBC170]/50 hover:bg-[#EBC170]/30 hover:text-[#b8904f] hover:border-[#EBC170]/70 font-semibold',
  'outline-primary': 'bg-white text-[#2a4061] border border-[#2a4061] hover:bg-[#2a4061] hover:text-white',
  'outline-danger': 'bg-white text-red-500 border border-red-500 hover:bg-red-500 hover:text-white',
  'outline-warning': 'bg-white text-[#EBC170] border border-[#EBC170] hover:bg-[#EBC170] hover:text-gray-900',
  'outline-secondary': 'bg-white text-gray-600 border border-gray-600 hover:bg-gray-600 hover:text-white',
};

const sizeStyles: Record<ButtonSize, { button: string; icon: string; spinner: string }> = {
  sm: {
    button: 'px-3 py-1.5 text-xs',
    icon: 'w-3 h-3',
    spinner: 'h-3 w-3',
  },
  md: {
    button: 'px-4 py-2.5 text-sm',
    icon: 'w-4 h-4',
    spinner: 'h-4 w-4',
  },
  lg: {
    button: 'px-6 py-3 text-base',
    icon: 'w-5 h-5',
    spinner: 'h-5 w-5',
  },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center space-x-2 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <button
      className={`${baseStyles} ${variantStyle} ${sizeStyle.button} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className={`animate-spin rounded-full border-b-2 ${variant.startsWith('outline') ? 'border-current' : 'border-current'} ${sizeStyle.spinner}`}></div>
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={sizeStyle.icon} />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
