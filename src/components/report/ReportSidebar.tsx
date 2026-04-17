import React from 'react';
import {ChevronRight} from 'lucide-react';

export interface ReportCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  badge?: number;
  preview?: string;
  route: string;
}

interface ReportSidebarProps {
  categories: ReportCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  title?: string;
  className?: string;
}

export const ReportSidebar: React.FC<ReportSidebarProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  title = 'Report Category',
  className = '',
}) => {
  return (
    <aside className={`w-full lg:w-72 ${className}`}>
      <p className="text-on-surface-variant/40 mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.2em]">
        {title}
      </p>
      <nav className="space-y-1.5">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`group relative w-full overflow-hidden rounded-xl p-4 text-left transition-all duration-200 ${
              activeCategory === category.id
                ? 'bg-gradient-to-r from-primary/10 to-primary/5 shadow-md ring-1 ring-primary/20'
                : 'hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 transition-all duration-200 ${
                    activeCategory === category.id
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-surface-container text-on-surface-variant group-hover:bg-primary/10'
                  }`}
                >
                  {category.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        activeCategory === category.id
                          ? 'text-primary'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {category.label}
                    </span>
                    {category.badge !== undefined && category.badge > 0 && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        {category.badge}
                      </span>
                    )}
                  </div>
                  {category.preview && (
                    <p className="text-on-surface-variant/50 mt-0.5 text-[10px]">
                      {category.preview}
                    </p>
                  )}
                </div>
              </div>
              {activeCategory === category.id && (
                <ChevronRight className="h-4 w-4 text-primary" />
              )}
            </div>
          </button>
        ))}
      </nav>
    </aside>
  );
};
