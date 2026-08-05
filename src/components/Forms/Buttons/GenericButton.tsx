import React from 'react';

interface GenericButtonProps {
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
  label?: string;
}

const GenericButton: React.FC<GenericButtonProps> = ({
  type = 'button',
  onClick,
  className = '',
  disabled = false,
  children,
  label,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-1.5 
        px-2 py-1 sm:px-2.5 sm:py-1.5 
        text-[10px] sm:text-xs font-semibold 
        bg-gradient-to-br from-[#785600] to-[#986d00] 
        text-white 
        shadow-sm hover:shadow-md 
        transition-all duration-200 
        hover:scale-[1.02] active:scale-[0.98] 
        disabled:cursor-not-allowed disabled:opacity-50 
        whitespace-nowrap rounded-lg
        ${className}
      `}
      disabled={disabled}
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  );
};

export default GenericButton;