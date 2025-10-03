import { FieldErrors } from 'react-hook-form'

/**
 * Generic Field Configuration
 * Defines how a field should be validated
 */
export interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'password' | 'textarea' | 'select' | 'checkbox' | 'array'
  required: boolean
  validator?: (value: any) => boolean | string
}

/**
 * Step Validation Configuration
 * Defines validation rules for each step
 */
export interface StepValidationConfig {
  requiredFields: string[]
  customValidation?: (formData: Record<string, any>) => {
    isValid: boolean
    errors?: Record<string, string>
  }
}

/**
 * Generic Validation System
 * Provider-independent validation logic
 */
export class FormValidation {
  private stepConfigs: Map<number, StepValidationConfig>
  private fieldConfigs: Map<string, FieldConfig>

  constructor(
    stepConfigs: Record<number, StepValidationConfig>,
    fieldConfigs: FieldConfig[]
  ) {
    this.stepConfigs = new Map(Object.entries(stepConfigs).map(([k, v]) => [Number(k), v]))
    this.fieldConfigs = new Map(fieldConfigs.map(f => [f.key, f]))
  }

  /**
   * Validate a specific step
   */
  validateStep(
    step: number,
    formData: Record<string, any>,
    errors: FieldErrors
  ): {
    isValid: boolean
    missingFields: string[]
    hasErrors: boolean
  } {
    const config = this.stepConfigs.get(step)
    if (!config) {
      return { isValid: true, missingFields: [], hasErrors: false }
    }

    // Check required fields
    const missingFields = this.getMissingFields(config.requiredFields, formData)

    // Check for react-hook-form errors
    const hasFormErrors = config.requiredFields.some(field => errors[field])

    // Run custom validation if provided
    let customValidationPassed = true
    if (config.customValidation) {
      const result = config.customValidation(formData)
      customValidationPassed = result.isValid
    }

    const isValid = missingFields.length === 0 && !hasFormErrors && customValidationPassed

    return {
      isValid,
      missingFields,
      hasErrors: hasFormErrors || !customValidationPassed,
    }
  }

  /**
   * Get missing required fields
   */
  private getMissingFields(requiredFields: string[], formData: Record<string, any>): string[] {
    return requiredFields.filter(field => {
      const value = formData[field]
      const fieldConfig = this.fieldConfigs.get(field)

      // Array fields
      if (fieldConfig?.type === 'array' || Array.isArray(value)) {
        return !value || value.length === 0
      }

      // Boolean fields (checkbox) - always valid
      if (fieldConfig?.type === 'checkbox') {
        return false
      }

      // Other fields
      return value === undefined || value === null || value === ''
    })
  }

  /**
   * Validate a single field
   */
  validateField(field: string, value: any): string | undefined {
    const config = this.fieldConfigs.get(field)
    if (!config) return undefined

    // Check required
    if (config.required) {
      if (config.type === 'array' && (!value || value.length === 0)) {
        return `${config.label} is required`
      }
      if (!value || value === '') {
        return `${config.label} is required`
      }
    }

    // Run custom validator
    if (config.validator) {
      const result = config.validator(value)
      if (typeof result === 'string') return result
      if (result === false) return `${config.label} is invalid`
    }

    return undefined
  }

  /**
   * Get all validation errors for current form data
   */
  getAllErrors(formData: Record<string, any>): Record<string, string> {
    const errors: Record<string, string> = {}

    this.fieldConfigs.forEach((config, key) => {
      const error = this.validateField(key, formData[key])
      if (error) {
        errors[key] = error
      }
    })

    return errors
  }
}

/**
 * Create a validation system from configuration
 */
export function createFormValidation(
  stepConfigs: Record<number, StepValidationConfig>,
  fieldConfigs: FieldConfig[]
): FormValidation {
  return new FormValidation(stepConfigs, fieldConfigs)
}

/**
 * Helper: Create step config with required fields only
 */
export function createStepConfig(requiredFields: string[]): StepValidationConfig {
  return { requiredFields }
}

/**
 * Helper: Create field config
 */
export function createFieldConfig(
  key: string,
  label: string,
  options: {
    type?: FieldConfig['type']
    required?: boolean
    validator?: (value: any) => boolean | string
  } = {}
): FieldConfig {
  return {
    key,
    label,
    type: options.type || 'text',
    required: options.required ?? true,
    validator: options.validator,
  }
}

/**
 * Common validators
 */
export const validators = {
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) || 'Invalid email address'
  },

  url: (value: string) => {
    try {
      new URL(value)
      return true
    } catch {
      return 'Invalid URL'
    }
  },

  minLength: (min: number) => (value: string) => {
    return value.length >= min || `Minimum length is ${min}`
  },

  maxLength: (max: number) => (value: string) => {
    return value.length <= max || `Maximum length is ${max}`
  },

  pattern: (regex: RegExp, message: string) => (value: string) => {
    return regex.test(value) || message
  },

  arrayMinLength: (min: number) => (value: any[]) => {
    return value.length >= min || `Select at least ${min} item(s)`
  },
}
