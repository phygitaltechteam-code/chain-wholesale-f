import React, {useState} from 'react';
import {useNavigate} from '@tanstack/react-router';
import {
  Gem,
  Flame,
  Layers,
  Scissors,
  Wrench,
  Package,
  Sparkles,
  Zap,
  Database,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronDown,
  Building2,
  Key,
  Printer,
  Scale,
  ChevronRight,
  Award,
  Sliders,
  Check,
  Menu,
  X,
} from 'lucide-react';

// ─── 7-Stage Manufacturing Process Data ───────────────────────────────────────
interface ProcessStep {
  id: string;
  name: string;
  shortDesc: string;
  icon: any;
  badge: string;
  details: {
    input: string;
    output: string;
    lossMetrics: string;
    keyFeatures: string[];
  };
}

const manufacturingSteps: ProcessStep[] = [
  {
    id: 'melting',
    name: '1. Melting & Alloy',
    shortDesc: 'Pure gold bullion alloying & karat balancing',
    icon: Flame,
    badge: 'Raw Metal Prep',
    details: {
      input: 'Pure 24K Gold (999.0) + Copper / Silver Master Alloy',
      output: 'Tested 22K (916) / 18K (750) / 14K (585) Ingot Bars',
      lossMetrics: 'Crucible combustion & vaporization loss % calculation',
      keyFeatures: [
        'Automated Touch & Purity Karat calculation',
        'Crucible loss tracking with benchmark tolerance limits',
        'Batch genealogy linking raw bullion to output ingot',
      ],
    },
  },
  {
    id: 'tar',
    name: '2. Tar (Wire Drawing)',
    shortDesc: 'Ingot rolling & precision gauge wire drawing',
    icon: Layers,
    badge: 'Wire Forming',
    details: {
      input: 'Alloyed Gold Ingot Strip',
      output: 'Calibrated Wire Spools (0.25mm - 2.5mm)',
      lossMetrics: 'Die wear, annealing scale & trimming scrap balance',
      keyFeatures: [
        'Multi-pass gauge reduction logs with weight checkpoints',
        'Automatic scrap vs dust separation calculation',
        'Operator-level yield efficiency analytics',
      ],
    },
  },
  {
    id: 'soldering',
    name: '3. Soldering (Taanka)',
    shortDesc: 'Flux application & alloy solder integration',
    icon: Sparkles,
    badge: 'Thermal Joining',
    details: {
      input: 'Drawn Wire & Formed Links + Kadka / Solder Alloy',
      output: 'Solid Bonded Chain Strands',
      lossMetrics: 'Solder weight addition vs thermal volatilization loss',
      keyFeatures: [
        'Precise Taanka / solder metal credit and debit ledger',
        'Gross weight increase vs fine gold balance calculation',
        'Gas & flux consumption optimization tracking',
      ],
    },
  },
  {
    id: 'joint',
    name: '4. Jointing Dept',
    shortDesc: 'Master link assembly & continuous link locking',
    icon: Wrench,
    badge: 'Assembly',
    details: {
      input: 'Soldered Strands & Master Joint Rings',
      output: 'Continuous Linked Chain Mesh',
      lossMetrics: 'Link trimming scrap & joint micro-loss',
      keyFeatures: [
        'Batch-wise link count and pitch measurement',
        'Real-time weight balance before sending to weaving',
        'Defect rejection & instant rework return logging',
      ],
    },
  },
  {
    id: 'box',
    name: '5. Box Dept',
    shortDesc: 'Automated chain weaving & pattern calibration',
    icon: Package,
    badge: 'Weaving & Sizing',
    details: {
      input: 'Continuous Chain Mesh',
      output: 'Box, Rope, Figaro, Curb & Custom Pattern Chains',
      lossMetrics: 'Machine friction loss & link clipping scrap',
      keyFeatures: [
        'Machine-specific speed, pitch, and cycle counters',
        'Live loss variance alert for abnormal weight drops',
        'Multi-size categorization (16", 18", 20", 22", 24")',
      ],
    },
  },
  {
    id: 'cutting',
    name: '6. Diamond Cutting',
    shortDesc: 'High-speed diamond faceting & edge polishing',
    icon: Scissors,
    badge: 'Surface Faceting',
    details: {
      input: 'Woven Pattern Chains',
      output: 'High-Luster Diamond Faceted Chains',
      lossMetrics: 'Fine cutting dust recovery & suction filtration',
      keyFeatures: [
        'Diamond fly-wheel faceting depth parameter records',
        'Closed-loop gold dust suction recovery tracking',
        'Surface finish optical inspection status',
      ],
    },
  },
  {
    id: 'skunda',
    name: '7. S-Kunda & Finishing',
    shortDesc: 'Clasp fitting, final polish & hallmark testing',
    icon: Award,
    badge: 'Final Delivery',
    details: {
      input: 'Diamond Cut Chains + S-Kunda Hooks & Locks',
      output: 'Finished, Tagged, Hallmarked & Stock-Ready Chains',
      lossMetrics: 'Final ultrasonic buffing loss & tag weight net-off',
      keyFeatures: [
        'BIS Hallmark & XRF purity testing stamp verification',
        'Net fine gold certification and automatic barcode generation',
        'Direct 1-click handoff to Inventory Vault & Billing',
      ],
    },
  },
];

// ─── ERP Core Modules ────────────────────────────────────────────────────────
const erpModules = [
  {
    title: 'Micro-Precision Fine Weight Ledger',
    desc: 'Automated calculation of Fine Gold = Gross Weight × (Purity / 100). Track bullion down to the milligram across all shifts and transfers.',
    icon: Scale,
    tag: 'Core Accounting',
  },
  {
    title: 'High-Speed Smart Billing & Invoicing',
    desc: 'Instant generation of detailed customer bills, draft receipts, thermal slips, and GST tax invoices with custom header branding.',
    icon: Printer,
    tag: 'Billing Engine',
  },
  {
    title: 'Vault & Real-Time Stock Management',
    desc: 'Live stock monitoring categorized by chain design, size, purity, fine weight, and safe vault storage location.',
    icon: Database,
    tag: 'Inventory Vault',
  },
  {
    title: 'Multi-Branch & Super Admin Portal',
    desc: 'Centralized multi-workshop governance, role-based access permissions, tenant management, and aggregate executive reports.',
    icon: Building2,
    tag: 'Enterprise Control',
  },
  {
    title: 'Cryptographic E-PIN License System',
    desc: 'Instant cloud & offline activation key generation, subscription expiration enforcement, and automated grace period renewals.',
    icon: Key,
    tag: 'Security & Licensing',
  },
  {
    title: 'Factory-Floor Offline-First Resilience',
    desc: 'Uninterrupted shop floor operations even during network outages, with automatic background sync when connectivity is restored.',
    icon: Zap,
    tag: 'Continuous Uptime',
  },
];

// ─── Pricing Plans ───────────────────────────────────────────────────────────
const pricingPlans = [
  {
    name: 'Trial Edition',
    duration: '7 Days Free Access',
    price: '₹0',
    desc: 'Experience full gold chain manufacturing and billing capabilities for your workshop.',
    features: [
      'All 7 Manufacturing Departments',
      'Fine Weight & Loss Calculations',
      'Smart Invoicing & Bill Generator',
      'Single Workshop Admin Account',
      'Standard Thermal & A4 Printing',
    ],
    highlighted: false,
    cta: 'Start Free Trial',
  },
  {
    name: 'Cloud Standard',
    duration: 'Annual Subscription',
    price: '₹14,999',
    desc: 'Complete cloud-connected ERP suite for growing jewelry chain manufacturers and traders.',
    features: [
      'Unlimited Manufacturing Orders & Batches',
      'Multi-User Roles & Permissions',
      'Real-Time Vault & Metal Balances',
      'Automated WhatsApp & Print Invoices',
      'Cloud Backup & Audit History',
      'Priority Technical Support',
    ],
    highlighted: true,
    cta: 'Get Cloud Standard',
  },
  {
    name: 'Factory Enterprise',
    duration: 'Custom Multi-Shop',
    price: '₹29,999',
    desc: 'Heavy-duty multi-branch factory solution with offline edge sync and custom reporting.',
    features: [
      'Multi-Branch & Super Admin Suite',
      'Offline-First Local Edge Resiliency',
      'Custom BIS Hallmark & Barcode Templates',
      'Automated E-PIN Licensing Generator',
      'Dedicated Account Manager',
      'On-Site / Video Training & Customization',
    ],
    highlighted: false,
    cta: 'Contact Enterprise Sales',
  },
];

// ─── FAQ Data ────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'How does the ERP calculate and track manufacturing gold loss?',
    a: 'Every manufacturing department (Melting, Tar, Soldering, Joint, Box, Cutting, S-Kunda) records initial input weight, final output weight, recovered scrap, and suction dust. The platform calculates exact process loss percentage in real time and updates your fine gold ledger.',
  },
  {
    q: 'Can our factory floor workers use the ERP if internet connectivity drops?',
    a: 'Yes! The platform is built with an offline-first architecture. Operators can continue logging production batches, weighments, and job cards seamlessly without downtime. Data synchronizes automatically when network restores.',
  },
  {
    q: 'What is the E-PIN License Key system?',
    a: 'The E-PIN module enables Super Admins to generate cryptographic license keys with specific validity durations (e.g. 30 days, 1 year). Clients can enter the key in their billing portal to instantly unlock and extend their active subscription.',
  },
  {
    q: 'Does the billing module support both Draft and Finalized Invoices?',
    a: 'Yes. You can prepare draft receipts with live customer metal balances, fine weight conversions, labor charges (SRP), and payment modes, and then finalize them into formal printable bills with custom company header branding.',
  },
  {
    q: 'Can Super Admins manage multiple branches and workshops?',
    a: 'Absolutely. The Super Admin console allows creating separate admin accounts for different factory locations, setting distinct price/renewal terms, and monitoring aggregate bullion inventory across the entire business network.',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState<ProcessStep>(
    manufacturingSteps[0],
  );
  const [activeDemoTab, setActiveDemoTab] = useState<
    'manufacturing' | 'ledger' | 'billing'
  >('manufacturing');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleGoToLogin = () => {
    setIsMobileMenuOpen(false);
    navigate({to: '/signin'});
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({behavior: 'smooth'});
    }
  };

  return (
    <div className="font-sans min-h-screen bg-[#f9f9f7] text-[#1a1c1b] antialiased selection:bg-[#785600] selection:text-white">
      {/* ─── 1. Top Navigation Bar (Responsive with Mobile Drawer) ─────────── */}
      <header className="sticky top-0 z-50 border-b border-[#d3c4af]/40 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
          {/* Logo Branding */}
          <div
            className="flex cursor-pointer items-center gap-2.5 sm:gap-3"
            onClick={() => scrollToSection('hero')}
          >
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-[#785600] via-[#986d00] to-[#b8860b] p-0.5 shadow-md shadow-[#785600]/15 sm:h-11 sm:w-11">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white">
                <Gem className="h-4 w-4 text-[#785600] sm:h-6 sm:w-6" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#1a1c1b] sm:text-xl">
                Gold<span className="text-[#785600]">Chain</span>
              </span>
              <p className="xs:block hidden text-[9px] font-medium tracking-wider text-[#817563] sm:text-[10px]">
                Precious Metal Manufacturing Suite
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-7 text-xs font-semibold text-[#4f4535] sm:text-sm lg:flex">
            <button
              onClick={() => scrollToSection('features')}
              className="transition-colors hover:text-[#785600]"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('manufacturing')}
              className="transition-colors hover:text-[#785600]"
            >
              7-Stage Process
            </button>
            <button
              onClick={() => scrollToSection('modules')}
              className="transition-colors hover:text-[#785600]"
            >
              ERP Modules
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="transition-colors hover:text-[#785600]"
            >
              System Preview
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="transition-colors hover:text-[#785600]"
            >
              Licensing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="transition-colors hover:text-[#785600]"
            >
              FAQ
            </button>
          </nav>

          {/* Action Button (Desktop) & Mobile Hamburger */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoToLogin}
              className="hidden items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#785600]/20 transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] sm:inline-flex sm:px-5 sm:py-2.5"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Login</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg border border-[#d3c4af]/60 p-2 text-[#785600] hover:bg-[#fff9ed] focus:outline-none lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="animate-in slide-in-from-top-2 space-y-3 border-t border-[#d3c4af]/40 bg-white px-4 pb-6 pt-3 shadow-xl duration-200 lg:hidden">
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-semibold text-[#4f4535]">
              <button
                onClick={() => scrollToSection('features')}
                className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('manufacturing')}
                className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
              >
                7-Stage Process
              </button>
              <button
                onClick={() => scrollToSection('modules')}
                className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
              >
                ERP Modules
              </button>
              <button
                onClick={() => scrollToSection('demo')}
                className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
              >
                System Preview
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
              >
                Licensing
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="rounded-lg p-2.5 text-left hover:bg-[#fff9ed] hover:text-[#785600]"
              >
                FAQ
              </button>
            </div>

            <div className="border-t border-[#d3c4af]/30 pt-2">
              <button
                onClick={handleGoToLogin}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] py-3 text-xs font-bold text-white shadow-md"
              >
                <Lock className="h-4 w-4" />
                <span>Login to ERP Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="space-y-16 pb-16 sm:space-y-24 sm:pb-20">
        {/* ─── 2. Hero Section ───────────────────────────────────────────────── */}
        <section
          id="hero"
          className="mx-auto max-w-7xl px-4 pt-10 text-center sm:px-6 sm:pt-16 md:pt-20 lg:px-8"
        >
          {/* Badge */}
          <div className="mb-5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#785600]/20 bg-[#785600]/10 px-3 py-1.5 text-center text-[11px] font-bold text-[#785600] shadow-sm sm:gap-2 sm:px-4 sm:text-xs">
            <Sparkles className="h-3 w-3 shrink-0 text-[#785600] sm:h-3.5 sm:w-3.5" />
            <span className="truncate">
              Next-Gen Gold Chain Manufacturing & ERP
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-5xl text-3xl font-extrabold leading-[1.2] tracking-tight text-[#1a1c1b] sm:text-5xl sm:leading-[1.15] md:text-6xl lg:text-7xl">
            Precision Gold Chain Manufacturing &{' '}
            <span className="bg-gradient-to-r from-[#785600] via-[#986d00] to-[#b8860b] bg-clip-text text-transparent">
              Complete Enterprise ERP
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-4 max-w-3xl text-sm font-normal leading-relaxed text-[#4f4535] sm:mt-6 sm:text-lg md:text-xl">
            Eliminate unaccounted metal loss from raw bullion ingot to finished
            hallmarked chain. Track all 7 manufacturing stages with
            micro-milligram precision, live fine weight ledger, smart billing,
            and offline factory resilience.
          </p>

          {/* Action CTAs */}
          <div className="mx-auto mt-8 flex max-w-md flex-col items-center justify-center gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:gap-4">
            <button
              onClick={handleGoToLogin}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] px-6 py-3.5 text-xs font-bold text-white shadow-xl shadow-[#785600]/25 transition-all hover:scale-105 active:scale-[0.98] sm:w-auto sm:px-8 sm:py-4 sm:text-sm"
            >
              <Lock className="h-4 w-4" />
              <span>Login to ERP</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => scrollToSection('manufacturing')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d3c4af] bg-white px-6 py-3.5 text-xs font-bold text-[#4f4535] shadow-sm transition-all hover:border-[#785600] hover:bg-[#fff9ed] hover:text-[#785600] sm:w-auto sm:px-8 sm:py-4 sm:text-sm"
            >
              <Layers className="h-4 w-4 text-[#785600]" />
              <span>Explore 7-Stage Process</span>
            </button>
          </div>

          {/* Metrics Counter Bar */}
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:mt-16 sm:gap-5 md:grid-cols-4">
            <div className="rounded-2xl border border-[#d3c4af]/50 bg-white p-4 text-left shadow-sm sm:p-6 sm:shadow-md">
              <div className="text-2xl font-black text-[#785600] sm:text-3xl lg:text-4xl">
                99.99%
              </div>
              <div className="mt-1 text-xs font-bold text-[#1a1c1b]">
                Fine Weight Accuracy
              </div>
              <div className="mt-0.5 text-[10px] text-[#817563] sm:text-[11px]">
                Real-time Karat ledger
              </div>
            </div>

            <div className="rounded-2xl border border-[#d3c4af]/50 bg-white p-4 text-left shadow-sm sm:p-6 sm:shadow-md">
              <div className="text-2xl font-black text-[#986d00] sm:text-3xl lg:text-4xl">
                7 Stages
              </div>
              <div className="mt-1 text-xs font-bold text-[#1a1c1b]">
                Shop-Floor Tracking
              </div>
              <div className="mt-0.5 text-[10px] text-[#817563] sm:text-[11px]">
                Melting to S-Kunda
              </div>
            </div>

            <div className="rounded-2xl border border-[#d3c4af]/50 bg-white p-4 text-left shadow-sm sm:p-6 sm:shadow-md">
              <div className="text-2xl font-black text-[#785600] sm:text-3xl lg:text-4xl">
                0% Loss
              </div>
              <div className="mt-1 text-xs font-bold text-[#1a1c1b]">
                Unaccounted Metal Drops
              </div>
              <div className="mt-0.5 text-[10px] text-[#817563] sm:text-[11px]">
                Automated scrap recovery
              </div>
            </div>

            <div className="rounded-2xl border border-[#d3c4af]/50 bg-white p-4 text-left shadow-sm sm:p-6 sm:shadow-md">
              <div className="text-2xl font-black text-[#986d00] sm:text-3xl lg:text-4xl">
                Offline+
              </div>
              <div className="mt-1 text-xs font-bold text-[#1a1c1b]">
                Factory Resilience
              </div>
              <div className="mt-0.5 text-[10px] text-[#817563] sm:text-[11px]">
                Zero-downtime logging
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. Interactive 7-Stage Manufacturing Process ─────────────────── */}
        <section
          id="manufacturing"
          className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
        >
          <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#785600]/20 bg-[#785600]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#785600] sm:mb-3 sm:text-xs">
              Shop Floor Engineering
            </div>
            <h2 className="text-2xl font-black text-[#1a1c1b] sm:text-3xl md:text-4xl">
              End-to-End 7-Stage Manufacturing Pipeline
            </h2>
            <p className="mt-2 text-xs text-[#4f4535] sm:mt-3 sm:text-sm md:text-base">
              Click on any stage below to inspect how every gram of gold, alloy
              addition, link count, and micro-loss is tracked in the system.
            </p>
          </div>

          {/* Interactive Steps Selector (Horizontally scrollable on small screens) */}
          <div className="no-scrollbar mb-5 flex gap-2.5 overflow-x-auto pb-2 sm:mb-6 sm:grid sm:grid-cols-4 sm:gap-3 sm:pb-0 lg:grid-cols-7">
            {manufacturingSteps.map((step) => {
              const Icon = step.icon;
              const isSelected = selectedStep.id === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedStep(step)}
                  className={`flex w-44 shrink-0 flex-col justify-between rounded-xl border p-3 text-left transition-all sm:w-auto sm:p-4 ${
                    isSelected
                      ? 'scale-[1.01] border-[#785600] bg-gradient-to-b from-[#fff9ed] to-[#fcf5e5] shadow-md'
                      : 'border-[#d3c4af]/50 bg-white hover:border-[#785600]/40 hover:bg-[#faf8f5]'
                  }`}
                >
                  <div>
                    <div
                      className={`mb-2 w-fit rounded-lg p-2 ${
                        isSelected
                          ? 'bg-[#785600] text-white shadow-sm'
                          : 'bg-[#785600]/10 text-[#785600]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 font-bold sm:h-4 sm:w-4" />
                    </div>
                    <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-[#785600] sm:text-[10px]">
                      {step.badge}
                    </span>
                    <h3 className="text-xs font-bold leading-snug text-[#1a1c1b]">
                      {step.name}
                    </h3>
                  </div>

                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#785600] sm:text-[11px]">
                      <span>Active</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Stage Deep-Dive Card */}
          <div className="rounded-2xl border border-[#d3c4af]/60 bg-white p-5 shadow-lg sm:p-8">
            <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-3">
              {/* Left Column: Stage Overview */}
              <div>
                <span className="rounded border border-[#785600]/20 bg-[#785600]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#785600] sm:text-xs">
                  {selectedStep.badge}
                </span>
                <h3 className="mt-3 text-xl font-extrabold text-[#1a1c1b] sm:text-2xl md:text-3xl">
                  {selectedStep.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#4f4535] sm:text-sm">
                  {selectedStep.shortDesc}
                </p>

                <div className="mt-5 space-y-2.5">
                  <div className="rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-3 sm:p-3.5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#817563] sm:text-[11px]">
                      Stage Input
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-[#785600] sm:text-sm">
                      {selectedStep.details.input}
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-3 sm:p-3.5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#817563] sm:text-[11px]">
                      Stage Output
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-emerald-700 sm:text-sm">
                      {selectedStep.details.output}
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Column: Loss Accounting */}
              <div className="space-y-3 sm:space-y-4">
                <div className="rounded-xl border border-[#785600]/30 bg-gradient-to-br from-[#fff9ed] to-[#fcf6e8] p-4 shadow-sm sm:p-5">
                  <div className="mb-1.5 flex items-center gap-2 text-[#785600]">
                    <Scale className="h-4 w-4 shrink-0" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Loss & Recovery Formula
                    </h4>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-[#4f4535]">
                    {selectedStep.details.lossMetrics}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-[#d3c4af]/40 pt-2.5 text-[10px] text-[#817563] sm:text-[11px]">
                    <span>Audit Status:</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />{' '}
                      Auto-Balanced
                    </span>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-4 sm:p-5">
                  <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#1a1c1b]">
                    Department Capabilities
                  </h4>
                  {selectedStep.details.keyFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-[#4f4535]"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 font-bold text-[#785600]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Live Simulated UI Card */}
              <div className="rounded-xl border border-[#785600]/30 bg-white p-5 shadow-md sm:p-6">
                <div className="mb-3.5 flex items-center justify-between border-b border-[#d3c4af]/30 pb-2.5">
                  <span className="flex items-center gap-2 text-xs font-bold text-[#1a1c1b]">
                    <Sliders className="h-3.5 w-3.5 text-[#785600]" />
                    Live Department Entry
                  </span>
                  <span className="rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 sm:text-[10px]">
                    22K / 916 READY
                  </span>
                </div>

                <div className="font-mono space-y-2 text-xs sm:space-y-2.5">
                  <div className="flex justify-between border-b border-[#f0eae0] py-1 text-[#4f4535]">
                    <span className="text-[#817563]">Gross In Weight:</span>
                    <span className="font-bold text-[#1a1c1b]">
                      1,245.850 g
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#f0eae0] py-1 text-[#4f4535]">
                    <span className="text-[#817563]">Target Purity:</span>
                    <span className="font-bold text-[#785600]">
                      91.60 % (22K)
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#f0eae0] py-1 text-[#4f4535]">
                    <span className="text-[#817563]">Fine Gold Equiv:</span>
                    <span className="font-bold text-emerald-700">
                      1,141.198 g
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#f0eae0] py-1 text-[#4f4535]">
                    <span className="text-[#817563]">Process Scrap:</span>
                    <span className="font-bold text-[#1a1c1b]">14.220 g</span>
                  </div>
                  <div className="flex justify-between py-1 text-[#4f4535]">
                    <span className="text-[#817563]">Net Process Loss:</span>
                    <span className="font-bold text-rose-600">
                      0.430 g (0.034%)
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGoToLogin}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#785600] to-[#986d00] py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-95 sm:mt-5"
                >
                  <span>Open in ERP Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. Core ERP Modules Grid ──────────────────────────────────────── */}
        <section
          id="modules"
          className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
        >
          <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#785600]/20 bg-[#785600]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#785600] sm:mb-3 sm:text-xs">
              Comprehensive Suite
            </div>
            <h2 className="text-2xl font-black text-[#1a1c1b] sm:text-3xl md:text-4xl">
              Built Specifically for Precious Metal Enterprises
            </h2>
            <p className="mt-2 text-xs text-[#4f4535] sm:mt-3 sm:text-sm md:text-base">
              From the factory floor to retail billing desks and corporate Super
              Admins, all operations share a single unified fine gold ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {erpModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#d3c4af]/50 bg-white p-5 transition-all hover:border-[#785600]/60 hover:bg-[#fffdfa] hover:shadow-lg sm:p-6"
                >
                  <div className="mb-3.5 flex items-center justify-between">
                    <div className="rounded-xl border border-[#785600]/20 bg-[#785600]/10 p-2.5 text-[#785600] shadow-sm sm:p-3">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="rounded border border-[#d3c4af]/40 bg-[#f9f9f7] px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-[#785600] sm:text-[10px]">
                      {mod.tag}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#1a1c1b] sm:text-base">
                    {mod.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#4f4535]">
                    {mod.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── 5. Interactive System Preview / Live Showcase ─────────────────── */}
        <section
          id="demo"
          className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
        >
          <div className="rounded-3xl border border-[#d3c4af]/60 bg-white p-5 shadow-xl sm:p-8 md:p-10">
            <div className="mb-6 flex flex-col gap-4 border-b border-[#d3c4af]/30 pb-5 sm:mb-8 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-[#785600] sm:text-xs">
                  Live Platform Preview
                </span>
                <h3 className="text-xl font-extrabold text-[#1a1c1b] sm:text-2xl md:text-3xl">
                  Experience the ERP Interface
                </h3>
              </div>

              {/* Tabs */}
              <div className="flex max-w-full items-center gap-1 self-start overflow-x-auto rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-1 sm:gap-2 sm:self-auto">
                <button
                  onClick={() => setActiveDemoTab('manufacturing')}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeDemoTab === 'manufacturing'
                      ? 'bg-gradient-to-r from-[#785600] to-[#986d00] text-white shadow-sm'
                      : 'text-[#4f4535] hover:text-[#785600]'
                  }`}
                >
                  Factory Floor
                </button>
                <button
                  onClick={() => setActiveDemoTab('ledger')}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeDemoTab === 'ledger'
                      ? 'bg-gradient-to-r from-[#785600] to-[#986d00] text-white shadow-sm'
                      : 'text-[#4f4535] hover:text-[#785600]'
                  }`}
                >
                  Fine Gold Ledger
                </button>
                <button
                  onClick={() => setActiveDemoTab('billing')}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeDemoTab === 'billing'
                      ? 'bg-gradient-to-r from-[#785600] to-[#986d00] text-white shadow-sm'
                      : 'text-[#4f4535] hover:text-[#785600]'
                  }`}
                >
                  Smart Invoicing
                </button>
              </div>
            </div>

            {/* Tab 1: Manufacturing Simulation */}
            {activeDemoTab === 'manufacturing' && (
              <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-4 sm:p-5">
                  <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#785600]">
                    Active Job Batches
                  </div>
                  <div className="font-mono space-y-2.5 text-xs">
                    <div className="flex items-center justify-between rounded-lg border border-[#d3c4af]/30 bg-white p-2.5 shadow-sm sm:p-3">
                      <div>
                        <div className="font-bold text-[#1a1c1b]">
                          BATCH #CH-2026-88
                        </div>
                        <div className="text-[10px] text-[#817563]">
                          22K Box Chain (18 Inch)
                        </div>
                      </div>
                      <span className="rounded bg-[#785600]/15 px-2 py-0.5 text-[9px] font-bold text-[#785600] sm:text-[10px]">
                        Cutting
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-[#d3c4af]/30 bg-white p-2.5 shadow-sm sm:p-3">
                      <div>
                        <div className="font-bold text-[#1a1c1b]">
                          BATCH #CH-2026-89
                        </div>
                        <div className="text-[10px] text-[#817563]">
                          18K Rope Chain (20 Inch)
                        </div>
                      </div>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 sm:text-[10px]">
                        Finishing
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-[#d3c4af]/30 bg-white p-2.5 shadow-sm sm:p-3">
                      <div>
                        <div className="font-bold text-[#1a1c1b]">
                          BATCH #CH-2026-90
                        </div>
                        <div className="text-[10px] text-[#817563]">
                          22K Tar Wire Spool (0.35mm)
                        </div>
                      </div>
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800 sm:text-[10px]">
                        Tar Dept
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-4 sm:p-5 md:col-span-2">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1a1c1b]">
                      Department Weight Reconciliation
                    </span>
                    <span className="font-mono rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:text-[11px]">
                      99.96% Yield
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="font-mono w-full min-w-[340px] text-left text-xs">
                      <thead className="border-b border-[#d3c4af]/40 text-[10px] text-[#817563] sm:text-[11px]">
                        <tr>
                          <th className="pb-2">Dept</th>
                          <th className="pb-2">Gross In</th>
                          <th className="pb-2">Gross Out</th>
                          <th className="pb-2">Scrap</th>
                          <th className="pb-2 text-right">Loss</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8e2d8] text-[#1a1c1b]">
                        <tr>
                          <td className="py-2 font-bold text-[#785600]">
                            1. Melting
                          </td>
                          <td>2,500.00 g</td>
                          <td>2,488.50 g</td>
                          <td>10.20 g</td>
                          <td className="text-right font-bold text-rose-600">
                            1.30 g
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-[#785600]">
                            2. Tar
                          </td>
                          <td>2,488.50 g</td>
                          <td>2,460.10 g</td>
                          <td>26.50 g</td>
                          <td className="text-right font-bold text-rose-600">
                            1.90 g
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-[#785600]">
                            3. Soldering
                          </td>
                          <td>2,460.10 g</td>
                          <td>2,520.40 g</td>
                          <td>5.20 g</td>
                          <td className="text-right font-bold text-emerald-700">
                            +65.50 g
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Ledger Simulation */}
            {activeDemoTab === 'ledger' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                <div className="rounded-xl border border-[#785600]/30 bg-[#fffdf9] p-4 text-center shadow-sm sm:p-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#817563] sm:text-[11px]">
                    Vault Pure Gold Stock
                  </div>
                  <div className="font-mono mt-1.5 text-2xl font-black text-[#785600] sm:text-3xl">
                    4,821.450 g
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-[#4f4535]">
                    24K Bullion Equivalent
                  </div>
                </div>

                <div className="rounded-xl border border-[#785600]/30 bg-[#fffdf9] p-4 text-center shadow-sm sm:p-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#817563] sm:text-[11px]">
                    Customer Pending Metal
                  </div>
                  <div className="font-mono mt-1.5 text-2xl font-black text-[#986d00] sm:text-3xl">
                    1,240.800 g
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-[#4f4535]">
                    Fine Gold Receivables
                  </div>
                </div>

                <div className="rounded-xl border border-[#785600]/30 bg-[#fffdf9] p-4 text-center shadow-sm sm:p-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#817563] sm:text-[11px]">
                    Finished Ready Stock
                  </div>
                  <div className="font-mono mt-1.5 text-2xl font-black text-emerald-700 sm:text-3xl">
                    3,580.650 g
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-[#4f4535]">
                    Hallmarked 916 Chains
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Billing Simulation */}
            {activeDemoTab === 'billing' && (
              <div className="rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-4 sm:p-6">
                <div className="mb-4 flex flex-col justify-between gap-2 border-b border-[#d3c4af]/40 pb-3 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="text-xs font-bold text-[#1a1c1b] sm:text-sm">
                      TAX INVOICE / RECEIPT #INV-2026-1044
                    </h4>
                    <p className="text-[10px] text-[#817563] sm:text-[11px]">
                      Client: Royal Jewellers (GSTIN: 27AABCR1234F1Z5)
                    </p>
                  </div>
                  <span className="self-start rounded border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 sm:self-auto sm:text-xs">
                    PAID / SETTLED
                  </span>
                </div>

                <div className="font-mono mb-4 grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-4 sm:gap-4">
                  <div className="rounded-lg border border-[#d3c4af]/40 bg-white p-2.5 shadow-sm sm:p-3">
                    <span className="block text-[9px] text-[#817563] sm:text-[10px]">
                      Total Gross Wt:
                    </span>
                    <span className="text-xs font-bold text-[#1a1c1b] sm:text-sm">
                      485.600 g
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#d3c4af]/40 bg-white p-2.5 shadow-sm sm:p-3">
                    <span className="block text-[9px] text-[#817563] sm:text-[10px]">
                      Total Fine Gold:
                    </span>
                    <span className="text-xs font-bold text-[#785600] sm:text-sm">
                      444.810 g
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#d3c4af]/40 bg-white p-2.5 shadow-sm sm:p-3">
                    <span className="block text-[9px] text-[#817563] sm:text-[10px]">
                      Labor (SRP):
                    </span>
                    <span className="text-xs font-bold text-emerald-700 sm:text-sm">
                      ₹ 24,280
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#d3c4af]/40 bg-white p-2.5 shadow-sm sm:p-3">
                    <span className="block text-[9px] text-[#817563] sm:text-[10px]">
                      Settlement:
                    </span>
                    <span className="text-xs font-bold text-[#1a1c1b] sm:text-sm">
                      Metal + Cash
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleGoToLogin}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#785600] to-[#986d00] px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:opacity-95"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Open in Billing Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── 6. Pricing & Licensing Plans ──────────────────────────────────── */}
        <section
          id="pricing"
          className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
        >
          <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#785600]/20 bg-[#785600]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#785600] sm:mb-3 sm:text-xs">
              Deployment & Licensing
            </div>
            <h2 className="text-2xl font-black text-[#1a1c1b] sm:text-3xl md:text-4xl">
              Flexible Plans for Every Workshop Size
            </h2>
            <p className="mt-2 text-xs text-[#4f4535] sm:mt-3 sm:text-sm md:text-base">
              Activate instantly via our automated cryptographic E-PIN key
              system with zero setup hurdles.
            </p>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-5 sm:gap-8 md:grid-cols-3">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`flex flex-col justify-between rounded-3xl p-6 transition-all sm:p-8 ${
                  plan.highlighted
                    ? 'relative border-2 border-[#785600] bg-gradient-to-b from-[#fffdf9] via-white to-[#fff9ed] shadow-xl md:-translate-y-2'
                    : 'border border-[#d3c4af]/50 bg-white shadow-md hover:border-[#785600]/30'
                }`}
              >
                <div>
                  {plan.highlighted && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#785600] to-[#986d00] px-3 py-1 text-[9px] font-extrabold uppercase text-white shadow-md sm:text-[10px]">
                      Most Popular
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-[#1a1c1b] sm:text-xl">
                    {plan.name}
                  </h3>
                  <div className="mt-1 text-xs font-bold text-[#785600]">
                    {plan.duration}
                  </div>
                  <p className="mt-2.5 text-xs text-[#4f4535]">{plan.desc}</p>

                  <div className="mb-4 mt-4 sm:mb-6 sm:mt-6">
                    <span className="text-3xl font-extrabold text-[#1a1c1b] sm:text-4xl">
                      {plan.price}
                    </span>
                    {plan.price !== '₹0' && (
                      <span className="text-xs font-normal text-[#817563]">
                        {' '}
                        / year
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 border-t border-[#d3c4af]/30 pt-3.5 text-xs text-[#4f4535]">
                    {plan.features.map((f, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 shrink-0 font-bold text-[#785600]" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGoToLogin}
                  className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all sm:mt-8 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-[#785600] to-[#986d00] text-white shadow-md hover:opacity-95'
                      : 'border border-[#d3c4af]/50 bg-[#f9f9f7] text-[#4f4535] hover:bg-[#fff9ed] hover:text-[#785600]'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 7. FAQ Section ────────────────────────────────────────────────── */}
        <section
          id="faq"
          className="mx-auto max-w-4xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
        >
          <div className="mb-8 text-center sm:mb-10">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#785600]/20 bg-[#785600]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#785600] sm:mb-3 sm:text-xs">
              Frequently Asked Questions
            </div>
            <h2 className="text-2xl font-black text-[#1a1c1b] sm:text-3xl">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-xl border border-[#d3c4af]/50 bg-white shadow-sm transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
                  >
                    <span className="text-xs font-bold text-[#1a1c1b] sm:text-sm">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#785600] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#d3c4af]/30 px-4 pb-4 pt-2.5 text-xs leading-relaxed text-[#4f4535] sm:px-5 sm:pb-5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── 8. Bottom CTA Banner ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#785600] via-[#8c6400] to-[#986d00] p-6 text-center text-white shadow-xl sm:p-10 md:flex-row md:p-12 md:text-left">
            <div className="max-w-2xl">
              <span className="mb-2.5 inline-block rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[10px] font-extrabold uppercase sm:text-xs">
                Ready for Modern Precious Metal ERP?
              </span>
              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl md:text-4xl">
                Transform Your Gold Manufacturing & Billing Operations
              </h2>
              <p className="mt-2 text-xs font-medium leading-relaxed text-white/90 sm:text-sm">
                Join high-precision gold chain manufacturers running zero-loss
                manufacturing and automated billing.
              </p>
            </div>

            <div className="w-full shrink-0 md:w-auto">
              <button
                onClick={handleGoToLogin}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-bold text-[#785600] shadow-2xl transition-all hover:scale-105 hover:bg-[#fff9ed] active:scale-95 sm:px-8 sm:py-4 sm:text-sm md:w-auto"
              >
                <Lock className="h-4 w-4 text-[#785600]" />
                <span>Login to ERP Workspace</span>
                <ArrowRight className="h-4 w-4 text-[#785600]" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 9. Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#d3c4af]/40 bg-white px-4 py-8 text-xs text-[#817563] sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#785600]/20 bg-[#785600]/10 sm:h-8 sm:w-8">
              <Gem className="h-3.5 w-3.5 text-[#785600] sm:h-4 sm:w-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-[#1a1c1b]">
                GoldChain
              </span>
              <p className="text-[9px] text-[#817563] sm:text-[10px]">
                © {new Date().getFullYear()} Precision Jewelry Manufacturing
                System
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#4f4535] sm:gap-6">
            <button
              onClick={() => scrollToSection('features')}
              className="transition-colors hover:text-[#785600]"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('manufacturing')}
              className="transition-colors hover:text-[#785600]"
            >
              7-Stage Process
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="transition-colors hover:text-[#785600]"
            >
              Licensing
            </button>
            <button
              onClick={handleGoToLogin}
              className="font-bold text-[#785600] transition-colors hover:text-[#986d00]"
            >
              Login
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-700 sm:text-[11px]">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-600" />
            <span>Systems Online • 99.99% Uptime</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
