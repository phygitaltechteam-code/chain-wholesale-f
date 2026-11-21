import React from 'react';

interface GenericButtonProps {
  type?: 'reset';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

const GenericResetButton: React.FC<GenericButtonProps> = ({
  type = 'reset',
  onClick,
  className = '',
  disabled = false,
  children,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`hover:bg-gray-100 mx-1 rounded border border-graydark bg-transparent min-h-[40px] px-4 py-2 text-graydark sm:min-h-0 sm:px-8 transition duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 dark:border-bodydark dark:text-bodydark ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default GenericResetButton;
