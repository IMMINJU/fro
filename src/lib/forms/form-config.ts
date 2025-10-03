import { z } from 'zod'
import { ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FieldConfig, StepValidationConfig } from '@/lib/validation/generic-validation'

/**
 * Dynamic Field Configuration
 * Extends basic FieldConfig with rendering options
 */
export interface DynamicFieldConfig extends FieldConfig {
  placeholder?: string
  description?: string
  options?: Array<{ value: string; label: string }> // For select fields
  render?: (form: UseFormReturn<any>) => ReactNode // Custom render function
}

/**
 * Step Configuration
 * Defines everything needed for a wizard step
 */
export interface StepConfig {
  title: string
  description?: string
  fields: DynamicFieldConfig[]
  validation: StepValidationConfig
  render?: (form: UseFormReturn<any>) => ReactNode // Custom step renderer
}

/**
 * Complete Form Configuration
 * Everything needed to generate a full form wizard
 */
export interface FormConfig<T extends z.ZodTypeAny = any> {
  // Form metadata
  name: string
  title: string
  description?: string

  // Schema and defaults
  schema: T
  defaultValues: z.infer<T>

  // Steps configuration
  steps: StepConfig[]

  // All fields (flattened from steps)
  fields: DynamicFieldConfig[]

  // Mode
  mode?: 'create' | 'edit'
}

/**
 * Form Config Builder
 * Fluent API to build form configurations
 */
export class FormConfigBuilder<T extends z.ZodTypeAny = any> {
  private config: Partial<FormConfig<T>> = {}

  name(name: string): this {
    this.config.name = name
    return this
  }

  title(title: string): this {
    this.config.title = title
    return this
  }

  description(description: string): this {
    this.config.description = description
    return this
  }

  schema(schema: T): this {
    this.config.schema = schema
    return this
  }

  defaults(defaults: z.infer<T>): this {
    this.config.defaultValues = defaults
    return this
  }

  addStep(step: StepConfig): this {
    if (!this.config.steps) this.config.steps = []
    this.config.steps.push(step)
    return this
  }

  addField(field: DynamicFieldConfig): this {
    if (!this.config.fields) this.config.fields = []
    this.config.fields.push(field)
    return this
  }

  build(): FormConfig<T> {
    // Flatten all fields from steps if not provided
    if (!this.config.fields && this.config.steps) {
      this.config.fields = this.config.steps.flatMap(step => step.fields)
    }

    return this.config as FormConfig<T>
  }
}

/**
 * Create a form configuration
 */
export function createFormConfig<T extends z.ZodTypeAny>(): FormConfigBuilder<T> {
  return new FormConfigBuilder<T>()
}

/**
 * Create a step configuration
 */
export function createStep(
  title: string,
  fields: DynamicFieldConfig[],
  options: {
    description?: string
    requiredFields?: string[]
    customValidation?: StepValidationConfig['customValidation']
    render?: (form: UseFormReturn<any>) => ReactNode
  } = {}
): StepConfig {
  return {
    title,
    description: options.description,
    fields,
    validation: {
      requiredFields: options.requiredFields || fields.filter(f => f.required).map(f => f.key),
      customValidation: options.customValidation,
    },
    render: options.render,
  }
}

/**
 * Create a dynamic field configuration
 */
export function createDynamicField(
  key: string,
  label: string,
  options: Partial<Omit<DynamicFieldConfig, 'key' | 'label'>> = {}
): DynamicFieldConfig {
  return {
    key,
    label,
    type: options.type || 'text',
    required: options.required ?? false,
    placeholder: options.placeholder,
    description: options.description,
    options: options.options,
    validator: options.validator,
    render: options.render,
  }
}

/**
 * Common field presets
 */
export const fieldPresets = {
  name: (required = true) =>
    createDynamicField('name', 'Name', {
      type: 'text',
      required,
      placeholder: 'Enter name',
    }),

  email: (required = true) =>
    createDynamicField('email', 'Email', {
      type: 'text',
      required,
      placeholder: 'user@example.com',
      validator: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value) || 'Invalid email address'
      },
    }),

  password: (required = true) =>
    createDynamicField('password', 'Password', {
      type: 'password',
      required,
      placeholder: 'Enter password',
    }),

  description: (required = false) =>
    createDynamicField('description', 'Description', {
      type: 'textarea',
      required,
      placeholder: 'Enter description',
    }),

  select: (key: string, label: string, options: Array<{ value: string; label: string }>, required = true) =>
    createDynamicField(key, label, {
      type: 'select',
      required,
      options,
    }),

  checkbox: (key: string, label: string) =>
    createDynamicField(key, label, {
      type: 'checkbox',
      required: false,
    }),

  array: (key: string, label: string, required = true) =>
    createDynamicField(key, label, {
      type: 'array',
      required,
    }),
}
