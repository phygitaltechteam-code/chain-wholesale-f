import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import {
  TrendingUp,
  Box,
  Flame,
  Hammer,
  Scissors,
  CheckCircle
} from 'lucide-react';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { manufacturingStore } from '@/utils/manufacturingStore';

// Import all department components
import AddTar from './AddTar';
import BoxDept from './BoxDept';
import SolderingDept from './SolderingDept';
import JointDept from './JointDept';
import CuttingDept from './CuttingDept';

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
      id: 'tar',
      name: 'Tar Management',
      icon: <TrendingUp className="h-4 w-4" />,
      component: <AddTar showBack={false} />,
      path: '/manufacturingprocess/addtar',
      status: 'active',
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
  ];

  // Initialize steps based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find which step matches the current path
    const stepIndex = processSteps.findIndex(step => currentPath.includes(step.path));
    
    if (stepIndex !== -1) {
      // Update steps status based on current route
      const updatedSteps = processSteps.map((step, index) => {
        if (index < stepIndex) {
          return { ...step, status: 'completed' as const };
        } else if (index === stepIndex) {
          return { ...step, status: 'active' as const };
        } else {
          return { ...step, status: 'pending' as const };
        }
      });
      setSteps(updatedSteps);
      setCurrentStep(stepIndex);
    } else {
      // Default to first step
      setSteps(processSteps);
      setCurrentStep(0);
    }

    // Check if Tar is completed
    const entries = manufacturingStore.getEntries();
    const hasTar = entries.some(e => e.tar !== undefined || e.openingStock);
    setWasTarCompleted(hasTar);
  }, [location.pathname]);

  // Handle navigation when Tar is completed
  useEffect(() => {
    if (steps.length === 0) return;

    const entries = manufacturingStore.getEntries();
    const hasTar = entries.some(e => e.tar !== undefined || e.openingStock);

    // If Tar is completed and we're still on the Tar step, navigate to Box
    if (hasTar && currentStep === 0 && !wasTarCompleted) {
      setWasTarCompleted(true);
      // Update steps status
      const updatedSteps = steps.map((step, index) => {
        if (index === 0) return { ...step, status: 'completed' as const };
        if (index === 1) return { ...step, status: 'active' as const };
        return step;
      });
      setSteps(updatedSteps);
      setCurrentStep(1);
      
      // Navigate to Box Department
      navigate({ to: '/manufacturingprocess/box/boxdept' });
    }
  }, [currentStep, steps, wasTarCompleted, navigate]);

  // Listen for route changes to update step
  useEffect(() => {
    const currentPath = location.pathname;
    const stepIndex = processSteps.findIndex(step => currentPath.includes(step.path));
    
    if (stepIndex !== -1 && stepIndex !== currentStep) {
      setCurrentStep(stepIndex);
      
      // Update step statuses
      const updatedSteps = processSteps.map((step, index) => {
        if (index < stepIndex) {
          return { ...step, status: 'completed' as const };
        } else if (index === stepIndex) {
          return { ...step, status: 'active' as const };
        } else {
          return { ...step, status: 'pending' as const };
        }
      });
      setSteps(updatedSteps);
    }
  }, [location.pathname]);

  // Handle step click - allow navigation to completed steps
  const handleStepClick = (index: number) => {
    const step = steps[index];
    if (index <= currentStep && step) {
      navigate({ to: step.path });
    }
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950 overflow-hidden">
      <div className="h-screen px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 mb-2 sm:mb-3">
          <PageHeader
            title="Manufacturing Process"
            subtitle="Complete all steps to finish the manufacturing process"
          />
        </div>

        {/* Horizontal Process Stepper - Dark Gold Theme */}
        <div className="flex-shrink-0 rounded-lg border border-[#b8860b]/30 bg-gradient-to-r from-[#1a1208] to-[#2a1f0f] px-3 py-3 shadow-lg sm:px-4 sm:py-3 md:px-5 md:py-3">
          <div className="relative">
            {/* Progress Line Background */}
            <div className="absolute left-0 top-3.5 h-0.5 w-full bg-[#4a3a20]" />

            {/* Progress Line Fill - Gold */}
            <div
              className="absolute left-0 top-3.5 h-0.5 transition-all duration-500 bg-gradient-to-r from-[#d4a017] to-[#f5d061]"
              style={{
                width: `${(currentStep / (steps.length - 1)) * 100}%`
              }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isPending = index > currentStep;

                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center"
                    style={{ flex: 1 }}
                  >
                    {/* Step Circle */}
                    <button
                      onClick={() => handleStepClick(index)}
                      disabled={isPending}
                      className={`
                        group relative flex flex-col items-center transition-all duration-300
                        ${(isCompleted || isActive) ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                      `}
                    >
                      <div className={`
                        relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300
                        sm:h-10 sm:w-10
                        ${isCompleted ? 'border-[#d4a017] bg-[#d4a017]' : ''}
                        ${isActive ? 'border-[#f5d061] bg-[#f5d061] ring-4 ring-[#f5d061]/30 shadow-lg shadow-[#f5d061]/20' : ''}
                        ${isPending ? 'border-[#4a3a20] bg-[#1a1208]' : ''}
                      `}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-[#1a1208]" />
                        ) : (
                          <div className={`
                            ${isActive ? 'text-[#1a1208]' : ''}
                            ${isPending ? 'text-[#4a3a20]' : ''}
                          `}>
                            {step.icon}
                          </div>
                        )}
                      </div>

                      {/* Step Label */}
                      <div className="mt-1.5 text-center">
                        <div className={`
                          text-[10px] font-medium transition-colors duration-300
                          sm:text-xs
                          ${isCompleted ? 'text-[#d4a017]' : ''}
                          ${isActive ? 'text-[#f5d061]' : ''}
                          ${isPending ? 'text-[#4a3a20]' : ''}
                        `}>
                          <span className="hidden xs:inline">{step.name}</span>
                          <span className="xs:hidden">{step.name.split(' ')[0]}</span>
                        </div>
                      </div>

                      {/* Step Number Badge */}
                      <div className={`
                        absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold
                        sm:-right-2 sm:-top-2 sm:h-5 sm:w-5 sm:text-[10px]
                        ${isCompleted ? 'bg-[#d4a017] text-[#1a1208]' : ''}
                        ${isActive ? 'bg-[#f5d061] text-[#1a1208]' : ''}
                        ${isPending ? 'bg-[#4a3a20] text-[#2a1f0f]' : ''}
                      `}>
                        {index + 1}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex-shrink-0 mt-1.5 flex items-center justify-between text-[10px] text-[#4f4535] dark:text-slate-400 sm:mt-2 sm:text-xs">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span className="text-[#d4a017] dark:text-amber-400 font-medium">
            {Math.round((currentStep / (steps.length - 1)) * 100)}% Complete
          </span>
        </div>

        {/* Form Content Area */}
        <div className="flex-1 mt-3 overflow-hidden">
          {steps[currentStep]?.component}
        </div>
      </div>
    </div>
  );
};

export default Process;