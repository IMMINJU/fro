import { FieldErrors } from 'react-hook-form'

/**
 * Step validation configuration
 * Defines required fields for each step
 */
export const STEP_REQUIRED_FIELDS = {
  0: ['name', 'provider'], // Step 1: Basic Info
  1: ['credentialType'], // Step 2: Credentials (dynamic fields handled separately)
  2: ['regionList'], // Step 3: Regions
  3: [], // Step 4: Features (all optional)
} as const

/**
 * Step validation messages
 */
export const STEP_VALIDATION_MESSAGES = {
  0: {
    name: 'Name is required',
    provider: 'Provider is required',
  },
  1: {
    credentialType: 'Credential type is required',
  },
  2: {
    regionList: 'At least one region is required',
  },
} as const

/**
 * Check if a step has all required fields filled
 * @param step - Current step number (0-indexed)
 * @param formData - Current form data
 * @param errors - Form errors from react-hook-form
 * @returns boolean - true if step is valid
 */
export function isStepValid(
  step: number,
  formData: Record<string, any>,
  errors: FieldErrors
): boolean {
  const requiredFields = STEP_REQUIRED_FIELDS[step as keyof typeof STEP_REQUIRED_FIELDS]

  if (!requiredFields) return true

  // Check if all required fields are filled
  const hasAllFields = requiredFields.every(field => {
    const value = formData[field]

    // Handle array fields (like regionList)
    if (Array.isArray(value)) {
      return value.length > 0
    }

    // Handle string/other fields
    return value !== undefined && value !== null && value !== ''
  })

  // Check if there are any errors for this step's fields
  const hasErrors = requiredFields.some(field => errors[field])

  return hasAllFields && !hasErrors
}

/**
 * Get credential field keys based on provider and credential type
 * @param provider - Cloud provider
 * @param credentialType - Credential type
 * @returns Array of credential field keys
 */
export function getCredentialFieldKeys(
  provider: string,
  credentialType: string
): string[] {
  // AWS
  if (provider === 'AWS') {
    if (credentialType === 'ACCESS_KEY') {
      return ['accessKeyId', 'secretAccessKey']
    }
    if (credentialType === 'ASSUME_ROLE') {
      return ['roleArn', 'accessKeyId', 'secretAccessKey']
    }
    if (credentialType === 'ROLES_ANYWHERE') {
      return ['roleArn', 'profileArn', 'trustAnchorArn', 'certificatePem', 'privateKeyPem']
    }
  }

  // Azure
  if (provider === 'AZURE' && credentialType === 'APPLICATION') {
    return ['tenantId', 'subscriptionId', 'applicationId', 'secretKey']
  }

  // GCP
  if (provider === 'GCP' && credentialType === 'JSON_TEXT') {
    return ['jsonText']
  }

  return []
}

/**
 * Validate step 2 (Credentials) including dynamic fields
 * @param formData - Current form data
 * @param errors - Form errors
 * @returns boolean - true if credentials step is valid
 */
export function validateCredentialsStep(
  formData: Record<string, any>,
  errors: FieldErrors
): boolean {
  // Check credentialType first
  if (!formData.credentialType) return false

  // Get required credential fields
  const credFieldKeys = getCredentialFieldKeys(
    formData.provider || 'AWS',
    formData.credentialType
  )

  // Check if all credential fields are filled
  const hasAllCredFields = credFieldKeys.every(key => {
    const value = formData[key]
    return value !== undefined && value !== null && value !== ''
  })

  // Check if there are any errors in credential fields
  const hasCredErrors = credFieldKeys.some(key => errors[key])

  return hasAllCredFields && !hasCredErrors && !errors.credentialType
}

/**
 * Get step validation status
 * @param step - Step number
 * @param formData - Current form data
 * @param errors - Form errors
 * @returns object with validation status and missing fields
 */
export function getStepValidationStatus(
  step: number,
  formData: Record<string, any>,
  errors: FieldErrors
) {
  // Special handling for credentials step
  if (step === 1) {
    const isValid = validateCredentialsStep(formData, errors)
    const credFieldKeys = getCredentialFieldKeys(
      formData.provider || 'AWS',
      formData.credentialType
    )

    const missingFields = ['credentialType', ...credFieldKeys].filter(field => {
      const value = formData[field]
      return !value || value === ''
    })

    return {
      isValid,
      missingFields,
      hasErrors: missingFields.length > 0 || Object.keys(errors).some(key =>
        ['credentialType', ...credFieldKeys].includes(key)
      )
    }
  }

  // Standard validation for other steps
  const requiredFields = STEP_REQUIRED_FIELDS[step as keyof typeof STEP_REQUIRED_FIELDS] || []
  const missingFields = requiredFields.filter(field => {
    const value = formData[field]

    if (Array.isArray(value)) {
      return value.length === 0
    }

    return !value || value === ''
  })

  const hasErrors = requiredFields.some(field => errors[field])
  const isValid = missingFields.length === 0 && !hasErrors

  return {
    isValid,
    missingFields,
    hasErrors
  }
}
