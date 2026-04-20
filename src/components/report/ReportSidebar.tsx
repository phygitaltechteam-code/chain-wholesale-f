import React, {useState, useEffect} from 'react';
import {ChevronRight, Menu, X} from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Mobile Menu Button - Positioned at bottom right for easy access
  const MobileMenuButton = () => (
    <button
      onClick={toggleMobileMenu}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-primary p-3.5 text-white shadow-xl transition-all hover:bg-primary/90 active:scale-95 md:hidden"
      aria-label="Toggle report menu"
    >
      {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
    </button>
  );

  // Mobile Overlay
  const MobileOverlay = () => (
    <div
      className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-300 md:hidden ${
        isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
      onClick={toggleMobileMenu}
    />
  );

  // Sidebar Content
  const SidebarContent = () => (
    <>
      <div className="mb-6 border-b border-primary/10 pb-4">
        <h3 className="text-lg font-bold text-primary">Reports</h3>
        <p className="text-on-surface-variant/60 mt-1 text-xs">
          Select a report category
        </p>
      </div>
      <nav className="space-y-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`group relative w-full overflow-hidden rounded-xl p-3.5 text-left transition-all duration-200 active:scale-[0.98] ${
              activeCategory === category.id
                ? 'bg-gradient-to-r from-primary/10 to-primary/5 shadow-md ring-1 ring-primary/20'
                : 'hover:bg-surface-container-low active:bg-surface-container-low'
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
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
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
                      <span className="whitespace-nowrap rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        {category.badge}
                      </span>
                    )}
                  </div>
                  {category.preview && (
                    <p className="text-on-surface-variant/50 mt-0.5 truncate text-[10px]">
                      {category.preview}
                    </p>
                  )}
                </div>
              </div>
              {activeCategory === category.id && (
                <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-primary" />
              )}
            </div>
          </button>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <MobileMenuButton />
      <MobileOverlay />

      {/* Sidebar - Desktop: always visible, Mobile: slide from left */}
      <aside
        className={` ${className} transition-all duration-300 ease-in-out ${
          isMobile
            ? `fixed left-0 top-0 z-50 h-full w-80 transform overflow-hidden bg-white shadow-2xl ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'relative w-full lg:w-80'
        } `}
      >
        <div className="h-full overflow-y-auto scroll-smooth p-5">
          {/* Close button inside sidebar for mobile */}
          {isMobile && (
            <button
              onClick={toggleMobileMenu}
              className="text-on-surface-variant hover:bg-surface-container-low active:bg-surface-container-low absolute right-4 top-4 z-10 rounded-lg p-2 transition-colors"
            >
              <X size={20} />
            </button>
          )}

          <SidebarContent />
        </div>
      </aside>
    </>
  );
};

// Horizontal scroll version for mobile (alternative layout)
export const MobileHorizontalReportSidebar: React.FC<ReportSidebarProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  title = 'Reports',
  className = '',
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // For desktop, use the regular sidebar
  if (!isMobile) {
    return (
      <ReportSidebar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        title={title}
        className={className}
      />
    );
  }

  const displayedCategories = showAll ? categories : categories.slice(0, 6);

  return (
    <div className={`w-full ${className}`}>
      {/* Header with title and expand button */}
      <div className="mb-3 flex items-center justify-between px-2">
        <p className="text-on-surface-variant/40 text-[10px] font-bold uppercase tracking-[0.2em]">
          {title}
        </p>
        {categories.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-medium text-primary"
          >
            {showAll ? 'Show Less' : `+${categories.length - 6} More`}
          </button>
        )}
      </div>

      {/* Horizontal scroll or grid based on showAll */}
      {showAll ? (
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`rounded-xl p-3 transition-all duration-200 active:scale-[0.97] ${
                activeCategory === category.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center">
                  {category.icon}
                </div>
                <span className="truncate text-sm font-medium">
                  {category.label}
                </span>
                {category.badge !== undefined && category.badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                      activeCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {category.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="scrollbar-thin scrollbar-thumb-primary/20 flex gap-2 overflow-x-auto pb-3">
          {displayedCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex-shrink-0 rounded-xl px-4 py-2.5 transition-all duration-200 active:scale-[0.97] ${
                activeCategory === category.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center">
                  {category.icon}
                </div>
                <span className="whitespace-nowrap text-sm font-medium">
                  {category.label}
                </span>
                {category.badge !== undefined && category.badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                      activeCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {category.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Compact bottom sheet version for mobile
export const BottomSheetReportSidebar: React.FC<ReportSidebarProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  title = 'Reports',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!isMobile) {
    return (
      <ReportSidebar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        title={title}
        className={className}
      />
    );
  }

  const activeCategoryData = categories.find((c) => c.id === activeCategory);

  return (
    <div className={`w-full ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-surface-container flex w-full items-center justify-between rounded-xl p-4 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            {activeCategoryData?.icon}
          </div>
          <div className="text-left">
            <p className="text-on-surface-variant/60 text-xs">Current Report</p>
            <p className="text-on-surface font-semibold">
              {activeCategoryData?.label || 'Select Report'}
            </p>
          </div>
        </div>
        <ChevronRight className="text-on-surface-variant h-5 w-5" />
      </button>

      {/* Bottom Sheet Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all"
            onClick={() => setIsOpen(false)}
          />
          <div className="animate-slide-up fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-primary/10 p-4">
              <h3 className="text-lg font-bold text-primary">{title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-surface-container-low rounded-lg p-2"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              <nav className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      onCategoryChange(category.id);
                      setIsOpen(false);
                    }}
                    className={`w-full rounded-xl p-3.5 text-left transition-all active:scale-[0.98] ${
                      activeCategory === category.id
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 shadow-md ring-1 ring-primary/20'
                        : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          activeCategory === category.id
                            ? 'bg-primary text-white'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              activeCategory === category.id
                                ? 'text-primary'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {category.label}
                          </span>
                          {category.badge !== undefined &&
                            category.badge > 0 && (
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
                      {activeCategory === category.id && (
                        <ChevronRight className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Export all versions
export default ReportSidebar;
