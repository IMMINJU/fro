'use client'

import { ReactNode, useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { useForm, UseFormReturn, FieldErrors } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { ButtonLoading } from '@/components/loading/global-loading'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StepWizard, StepIndicator, StepContent, useStepWizard } from '@/components/ui/step-wizard'

/**
 * Step configuration for the wizard
 */
export interface WizardStep {
  title: string
  description?: string
  requiredFields?: string[]
}

/**
 * Validation function type
 * Returns validation status for a specific step
 */
export type StepValidationFn = (
  step: number,
  formData: Record<string, any>,
  errors: FieldErrors
) => {
  isValid: boolean
  missingFields: string[]
  hasErrors: boolean
}

/**
 * Generic Form Wizard Props
 */
export interface GenericFormWizardProps<T extends z.ZodTypeAny> {
  // Dialog props
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string

  // Wizard configuration
  steps: WizardStep[]
  schema: T
  defaultValues: z.infer<T>

  // Step validation
  validateStep?: StepValidationFn

  // Render functions
  renderStep: (step: number, form: UseFormReturn<z.infer<T>>) => ReactNode

  // Submit handling
  onSubmit: (data: z.infer<T>) => Promise<void>
  isSubmitting?: boolean

  // Mode
  mode?: 'create' | 'edit'

  // Loading state
  isLoading?: boolean
  loadingContent?: ReactNode

  // i18n configuration
  fieldTranslationMap?: Record<string, string>
  translationNamespace?: string
}

/**
 * Generic Form Wizard Component
 * Reusable wizard component for multi-step forms
 *
 * @example
 * ```tsx
 * <GenericFormWizard
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Create User"
 *   steps={userSteps}
 *   schema={userSchema}
 *   defaultValues={defaultUserValues}
 *   renderStep={(step, form) => <UserStep step={step} form={form} />}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export function GenericFormWizard<T extends z.ZodTypeAny>({
  open,
  onOpenChange,
  title,
  description,
  steps,
  schema,
  defaultValues,
  validateStep,
  renderStep,
  onSubmit,
  isSubmitting = false,
  mode = 'create',
  isLoading = false,
  loadingContent,
  fieldTranslationMap,
  translationNamespace = 'cloud',
}: GenericFormWizardProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const { handleSubmit, formState: { errors, isDirty }, reset, watch } = form
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, defaultValues, reset])

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && isDirty && !isSubmitting) {
      setShowUnsavedWarning(true)
      return
    }
    onOpenChange(isOpen)
  }

  const confirmClose = () => {
    setShowUnsavedWarning(false)
    onOpenChange(false)
  }

  const cancelClose = () => {
    setShowUnsavedWarning(false)
  }

  const handleFormSubmit = async (data: z.infer<T>) => {
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  if (isLoading && loadingContent) {
    return (
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          {loadingContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <StepWizard totalSteps={steps.length}>
            {/* Step Indicator */}
            <StepIndicator steps={steps} />

            {/* Render each step */}
            {steps.map((_, index) => (
              <StepContent key={index} step={index}>
                {renderStep(index, form)}
              </StepContent>
            ))}

            {/* Wizard Footer */}
            <WizardFooter
              mode={mode}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
              formData={watch()}
              errors={errors}
              steps={steps}
              validateStep={validateStep}
              fieldTranslationMap={fieldTranslationMap}
              translationNamespace={translationNamespace}
            />
          </StepWizard>
        </form>
      </DialogContent>
    </Dialog>

    {/* Unsaved Changes Warning */}
    <UnsavedChangesDialog
      open={showUnsavedWarning}
      onOpenChange={setShowUnsavedWarning}
      onConfirm={confirmClose}
      onCancel={cancelClose}
    />
  </>
  )
}

/**
 * Unsaved Changes Dialog Component
 */
interface UnsavedChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
}

function UnsavedChangesDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: UnsavedChangesDialogProps) {
  const t = useTranslations('common')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('unsavedChanges')}</DialogTitle>
          <DialogDescription>
            {t('unsavedChangesMessage')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            {t('continueEditing')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            {t('discardChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Wizard Footer Component
 * Handles navigation and validation
 */
interface WizardFooterProps {
  mode: 'create' | 'edit'
  isSubmitting: boolean
  onCancel: () => void
  formData: Record<string, any>
  errors: FieldErrors
  steps: WizardStep[]
  validateStep?: StepValidationFn
  fieldTranslationMap?: Record<string, string>
  translationNamespace?: string
}

function WizardFooter({
  mode,
  isSubmitting,
  onCancel,
  formData,
  errors,
  steps,
  validateStep,
  fieldTranslationMap,
  translationNamespace = 'cloud',
}: WizardFooterProps) {
  const t = useTranslations('common')
  const tDomain = useTranslations(translationNamespace)
  const { currentStep, goToPrevious, goToNext, isFirstStep, isLastStep } = useStepWizard()
  const [showValidationError, setShowValidationError] = useState(false)

  // Default validation using required fields
  const defaultValidation = (step: number) => {
    const requiredFields = steps[step]?.requiredFields || []
    const missingFields = requiredFields.filter(field => {
      const value = formData[field]
      if (Array.isArray(value)) {
        return value.length === 0
      }
      return !value || value === ''
    })

    const hasErrors = requiredFields.some(field => errors[field])

    return {
      isValid: missingFields.length === 0 && !hasErrors,
      missingFields,
      hasErrors,
    }
  }

  // Use custom validation if provided, otherwise use default
  const validationStatus = validateStep
    ? validateStep(currentStep, formData, errors)
    : defaultValidation(currentStep)

  // Translate field names for error messages
  const translatedFields = validationStatus.missingFields
    .map(field => {
      // Use provided fieldTranslationMap if available
      if (fieldTranslationMap) {
        const translationKey = fieldTranslationMap[field]
        if (translationKey) {
          try {
            return tDomain(translationKey)
          } catch {
            return field
          }
        }
      }
      return field
    })
    .join(', ')

  const handleNext = () => {
    if (!validationStatus.isValid) {
      setShowValidationError(true)
      return
    }
    setShowValidationError(false)
    goToNext()
  }

  const handlePrevious = () => {
    setShowValidationError(false)
    goToPrevious()
  }

  return (
    <>
      {/* Validation Error Alert */}
      {showValidationError && !validationStatus.isValid && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationStatus.missingFields.length > 0
              ? t('validationError', { fields: translatedFields })
              : t('fixErrors')}
          </AlertDescription>
        </Alert>
      )}

      <DialogFooter className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between w-full gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={isFirstStep ? onCancel : handlePrevious}
            className="w-full sm:w-auto"
          >
            {isFirstStep ? 'Cancel' : 'Previous'}
          </Button>

          {isLastStep ? (
            <ButtonLoading
              type="submit"
              isLoading={isSubmitting}
              variant="default"
              className="min-w-[100px] w-full sm:w-auto"
            >
              {mode === 'create' ? 'Create' : 'Save'}
            </ButtonLoading>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              variant="default"
              className="min-w-[100px] w-full sm:w-auto"
            >
              Next
            </Button>
          )}
        </div>
      </DialogFooter>
    </>
  )
}
