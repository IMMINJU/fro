'use client'

import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldConfig } from '@/features/clouds/config/provider-configs'

interface DynamicFieldProps {
  field: FieldConfig
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  value?: string
}

export function DynamicField({ field, register, errors }: DynamicFieldProps) {
  const error = errors[field.key]
  const fieldId = `field-${field.key}`

  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      placeholder: field.placeholder,
      ...register(field.key),
    }

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={4}
            className="resize-none"
          />
        )
      case 'password':
        return (
          <Input
            {...commonProps}
            type="password"
            autoComplete="new-password"
          />
        )
      case 'text':
      default:
        return (
          <Input
            {...commonProps}
            type="text"
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {renderInput()}

      {field.description && (
        <p className="text-xs text-muted-foreground">
          {field.description}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500">
          {error.message as string}
        </p>
      )}
    </div>
  )
}