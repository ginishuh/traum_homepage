import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline-white';
type ButtonSize = 'large' | 'medium';

interface BlogButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export function BlogButton({ 
  variant = 'primary', 
  size = 'medium', 
  children, 
  className = '',
  ...props 
}: BlogButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-[50px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-[#1A4F34] text-white hover:bg-[#0F3322] hover:shadow-[0_5px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 focus:ring-[#1A4F34]',
    secondary: 'bg-white text-[#1A4F34] border border-[#E5E7EB] hover:bg-[#F8F9FA] hover:shadow-[0_5px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 focus:ring-[#1A4F34]',
    'outline-white': 'bg-transparent text-white border-2 border-white hover:bg-white hover:text-[#1A4F34] focus:ring-white'
  };
  
  const sizeStyles = {
    large: 'px-6 py-3',
    medium: 'px-5 py-3'
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
