import React from 'react';

interface GenericButtonProps {
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const GenericButton: React.FC<GenericButtonProps> = ({
  type = 'button',
  onClick,
  className = '',
  disabled = false,
  children,
  label,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}) => {
  // Size variants
  const sizeClasses = {
    xs: 'px-1 py-1 text-[8px] sm:text-[10px] gap-1',
    sm: 'px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs gap-1.5',
    md: 'px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm gap-2',
    lg: 'px-3 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base gap-2.5',
  };

  // Variant styles
  const variantClasses = {
    primary:
      'bg-gradient-to-br from-[#785600] to-[#986d00] text-white hover:shadow-md',
    secondary:
      'bg-gradient-to-br from-gray-600 to-gray-800 text-white hover:shadow-md',
    outline:
      'border-2 border-[#785600] text-[#785600] bg-transparent hover:bg-[#785600]/10',
    danger:
      'bg-gradient-to-br from-red-600 to-red-800 text-white hover:shadow-md',
    success:
      'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white hover:shadow-md',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${fullWidth ? 'w-full' : 'w-auto'} ${className} `}
      disabled={disabled}
    >
      {children}
      {label && <span className="hidden sm:inline">{label}</span>}
      {label && (
        <span className="sm:hidden">
          {label.length > 8 ? label.substring(0, 6) + '…' : label}
        </span>
      )}
    </button>
  );
};

export default GenericButton;
