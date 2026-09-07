import React, {useState, useEffect} from 'react';
import {useNavigate, useLocation} from '@tanstack/react-router';
import {
  TrendingUp,
  Box,
  Flame,
  Hammer,
  Scissors,
  CheckCircle,
} from 'lucide-react';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {manufacturingStore} from '@/utils/manufacturingStore';

// Import all department components
import MeltingDept from './melting/MeltingDept';
import AddTar from './tar/AddTar';
import BoxDept from './boxdept/BoxDept';
import SolderingDept from './soldering/SolderingDept';
import JointDept from './joint/JointDept';
import CuttingDept from './cutting/CuttingDept';
import SKundaDept from './skunda/SKundaDept';

interface ProcessStep {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  path: string;
  status: 'pending' | 'active' | 'completed';
}

const Process: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [wasTarCompleted, setWasTarCompleted] = useState(false);

  // Define process steps with their routes
  const processSteps: ProcessStep[] = [
    {
      id: 'melting',
      name: 'Melting',
      icon: <Flame className="h-4 w-4" />,
      component: <MeltingDept />,
      path: '/manufacturingprocess/melting',
      status: 'active',
    },
    {
      id: 'tar',
      name: 'Tar Management',
      icon: <TrendingUp className="h-4 w-4" />,
      component: <AddTar showBack={false} />,
      path: '/manufacturingprocess/addtar',
      status: 'pending',
    },
    {
      id: 'box',
      name: 'Box Department',
      icon: <Box className="h-4 w-4" />,
      component: <BoxDept />,
      path: '/manufacturingprocess/box/boxdept',
      status: 'pending',
    },
    {
      id: 'soldering',
      name: 'Soldering',
      icon: <Flame className="h-4 w-4" />,
      component: <SolderingDept />,
      path: '/manufacturingprocess/solderingdept',
      status: 'pending',
    },
    {
      id: 'joint',
      name: 'Joint Department',
      icon: <Hammer className="h-4 w-4" />,
      component: <JointDept />,
      path: '/manufacturingprocess/joint/JointDept',
      status: 'pending',
    },
    {
      id: 'cutting',
      name: 'Cutting',
      icon: <Scissors className="h-4 w-4" />,
      component: <CuttingDept />,
      path: '/manufacturingprocess/cutting/cuttingdept',
      status: 'pending',
    },
    {
      id: 'kunda',
      name: 'S / Kunda',
      icon: <CheckCircle className="h-4 w-4" />,
      component: <SKundaDept />,
      path: '/manufacturingprocess/skunda',
      status: 'pending',
    },
  ];

  // Initialize steps based on current route or state
  useEffect(() => {
    const currentPath = location.pathname;
    const state = location.state as {selectedTab?: string} | null;

    let stepIndex = processSteps.findIndex((step) =>
      currentPath.includes(step.path),
    );

    // If we have a selectedTab in state, use that
    if (state?.selectedTab) {
      const tabIndex = processSteps.findIndex(
        (step) => step.id === state.selectedTab,
      );
      if (tabIndex !== -1) {
        stepIndex = tabIndex;
      }
    }

    // If no tab selected from state, check if we should show a specific tab
    if (stepIndex === -1) {
      // Check if any tab is completed to show the first pending or active tab
      const entries = manufacturingStore.getEntries();
      const hasTar = entries.some((e) => e.tar !== undefined || e.openingStock);

      if (hasTar) {
        stepIndex = 0; // Show Box tab if Tar is completed
      } else {
        stepIndex = 0; // Show Tar tab by default
      }
    }

    // Initialize steps with statuses
    const updatedSteps = processSteps.map((step, index) => {
      if (index < stepIndex) {
        return {...step, status: 'completed' as const};
      } else if (index === stepIndex) {
        return {...step, status: 'active' as const};
      } else {
        return {...step, status: 'pending' as const};
      }
    });

    setSteps(updatedSteps);
    setCurrentStep(stepIndex);

    // Check if Tar is completed
    const entries = manufacturingStore.getEntries();
    const hasTar = entries.some((e) => e.tar !== undefined || e.openingStock);
    setWasTarCompleted(hasTar);
  }, [location.pathname, location.state]);

  // Handle navigation when Tar is completed
  useEffect(() => {
    if (steps.length === 0) return;

    const entries = manufacturingStore.getEntries();
    const hasTar = entries.some((e) => e.tar !== undefined || e.openingStock);

    if (hasTar && currentStep === 0 && !wasTarCompleted) {
      setWasTarCompleted(true);
      const updatedSteps = steps.map((step, index) => {
        if (index === 0) return {...step, status: 'completed' as const};
        if (index === 1) return {...step, status: 'active' as const};
        return step;
      });
      setSteps(updatedSteps);
      setCurrentStep(1);
    }
  }, [currentStep, steps, wasTarCompleted]);

  // Handle tab click - Switch tab without changing URL
  const handleTabClick = (index: number) => {
    const updatedSteps = steps.map((step, i) => {
      if (i < index) {
        return {...step, status: 'completed' as const};
      } else if (i === index) {
        return {...step, status: 'active' as const};
      } else {
        return {...step, status: 'pending' as const};
      }
    });

    setSteps(updatedSteps);
    setCurrentStep(index);

    // Update URL state without navigating
    navigate({
      to: '/manufacturingprocess/process',
      state: {selectedTab: steps[index].id},
      replace: true,
    });
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Header */}
        <div className="mb-4">
          <PageHeader
            title="Manufacturing Process"
            subtitle="Complete all steps to finish the manufacturing process"
          />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-[#d3c4af]/20 dark:border-slate-700">
          <nav className="flex flex-wrap gap-1" aria-label="Tabs">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isPending = index > currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => handleTabClick(index)}
                  className={`group relative flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-[#785600] bg-[#785600]/5 text-[#785600] dark:border-[#986d00] dark:bg-[#986d00]/10 dark:text-[#986d00]'
                      : isCompleted
                        ? 'border-transparent text-[#785600] hover:bg-[#785600]/5 dark:text-[#986d00] dark:hover:bg-[#986d00]/10'
                        : 'border-transparent text-[#4f4535] hover:bg-[#785600]/5 dark:text-slate-500 dark:hover:bg-[#986d00]/10'
                  } cursor-pointer`}
                >
                  {/* Icon */}
                  <span
                    className={` ${isActive ? 'text-[#785600] dark:text-[#986d00]' : ''} ${isCompleted ? 'text-[#785600] dark:text-[#986d00]' : ''} ${isPending ? 'text-[#4f4535] dark:text-slate-500' : ''} `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.icon
                    )}
                  </span>

                  {/* Tab Name */}
                  <span>{step.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area - Shows the component of the current tab */}
        <div>{steps[currentStep]?.component}</div>
      </div>
    </div>
  );
};

export default Process;
