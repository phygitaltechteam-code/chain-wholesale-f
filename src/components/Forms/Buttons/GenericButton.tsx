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
      className={`mx-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-6 py-1 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={disabled}
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  );
};

export default GenericButton;
