// components/Common/PageHeader.tsx
import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`min-w-0 ${className}`}>
      <h2 className="font-headline text-xl font-black italic tracking-tight text-[#1a1a2e] dark:text-white sm:text-2xl lg:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="text-on-surface-variant text-[11px] tracking-wide sm:text-xs">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PageHeader;
