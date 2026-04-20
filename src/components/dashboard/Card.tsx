import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Visual surface variant */
  variant?: 'default' | 'low' | 'high' | 'lowest' | 'glass' | 'gradient';
  /** Remove inner padding – useful for full-bleed tables / images */
  noPadding?: boolean;
  /** Adds a subtle lift + shadow on hover */
  hoverable?: boolean;
  /** Accent colour for the left border stripe */
  accent?: 'primary' | 'secondary' | 'error' | 'none';
}

// Palette: #F4F4F2 secondary, #FFFFFF white, #EEEEEC hover, #D3C4AF border
const variantClasses: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-[#F4F4F2]',
  low: 'bg-[#F4F4F2]',
  high: 'bg-[#EEEEEC]',
  lowest: 'bg-white',
  glass: 'bg-white/70 backdrop-blur-lg',
  gradient: 'bg-gradient-to-br from-white to-[#F4F4F2]',
};

// Accent stripes use the brand gold (#785600) and silver (#5D5C74)
const accentClasses: Record<NonNullable<CardProps['accent']>, string> = {
  primary: 'border-l-[3px] border-l-[#785600]',
  secondary: 'border-l-[3px] border-l-[#5D5C74]',
  error: 'border-l-[3px] border-l-red-600',
  none: '',
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  variant = 'default',
  noPadding = false,
  hoverable = false,
  accent = 'none',
}) => {
  return (
    <div
      className={[
        'overflow-hidden rounded-2xl border border-[#D3C4AF]/25 shadow-sm',
        variantClasses[variant],
        accentClasses[accent],
        hoverable
          ? 'hover:shadow-[#785600]/6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg'
          : '',
        className,
      ].join(' ')}
    >
      {/* Card Header */}
      {(title || action) && (
        <div className="flex items-start justify-between border-b border-[#E2E3E1] px-5 py-4">
          <div>
            {title && (
              <h4 className="text-base font-semibold tracking-tight text-[#1A1C1B]">
                {title}
              </h4>
            )}
            {subtitle && (
              <p className="mt-0.5 text-lg text-[#817563]">{subtitle}</p>
            )}
          </div>
          {action && <div className="ml-4 flex-shrink-0">{action}</div>}
        </div>
      )}

      {/* Card Body */}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
};

export default Card;
