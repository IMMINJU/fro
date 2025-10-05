'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepWizardContextType {
  currentStep: number
  setCurrentStep: (step: number) => void
  totalSteps: number
  goToNext: () => void
  goToPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

const StepWizardContext = createContext<StepWizardContextType | undefined>(
  undefined,
)

export function useStepWizard() {
  const context = useContext(StepWizardContext)
  if (!context) {
    throw new Error('useStepWizard must be used within a StepWizard')
  }
  return context
}

interface StepWizardProps {
  children: ReactNode
  totalSteps: number
  initialStep?: number
  onStepChange?: (step: number) => void
}

export function StepWizard({
  children,
  totalSteps,
  initialStep = 0,
  onStepChange,
}: StepWizardProps) {
  const [currentStep, setCurrentStepState] = useState(initialStep)

  const setCurrentStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStepState(step)
      onStepChange?.(step)
    }
  }

  const goToNext = () => setCurrentStep(currentStep + 1)
  const goToPrevious = () => setCurrentStep(currentStep - 1)

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  return (
    <StepWizardContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        totalSteps,
        goToNext,
        goToPrevious,
        isFirstStep,
        isLastStep,
      }}
    >
      <div className="space-y-6">{children}</div>
    </StepWizardContext.Provider>
  )
}

interface StepIndicatorProps {
  steps: Array<{
    title: string
    description?: string
  }>
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  const { currentStep } = useStepWizard()

  return (
    <nav aria-label="Progress" className="px-4 sm:px-0">
      <ol role="list" className="flex items-center overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={cn(
              'relative',
              index !== steps.length - 1 ? 'pr-6 sm:pr-12 lg:pr-20' : '',
              'flex-shrink-0',
            )}
          >
            {index < currentStep ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white" aria-hidden="true" />
                </div>
                <span className="mt-2 block text-xs sm:text-sm font-medium text-primary whitespace-nowrap">
                  {step.title}
                </span>
              </>
            ) : index === currentStep ? (
              <>
                {index !== 0 && (
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                )}
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white">
                  <span className="text-sm sm:text-base text-primary">{index + 1}</span>
                </div>
                <span className="mt-2 block text-xs sm:text-sm font-medium text-primary whitespace-nowrap">
                  {step.title}
                </span>
              </>
            ) : (
              <>
                {index !== 0 && (
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                )}
                <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                  <span className="text-sm sm:text-base text-gray-500">{index + 1}</span>
                </div>
                <span className="mt-2 block text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap">
                  {step.title}
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

interface StepContentProps {
  step: number
  children: ReactNode
}

export function StepContent({ step, children }: StepContentProps) {
  const { currentStep } = useStepWizard()

  if (currentStep !== step) {
    return null
  }

  return <div className="py-4">{children}</div>
}
