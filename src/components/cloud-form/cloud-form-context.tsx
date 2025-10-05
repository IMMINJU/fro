'use client'

import { createContext, useContext, ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { Provider } from '@/types/types'
import { cloudFormSchema } from '@/features/clouds/config/cloud-form.config'
import { getProviderConfig, getCredentialFields, getEventSourceFields } from '@/features/clouds/config/provider-configs'

interface CloudFormContextValue {
  form: UseFormReturn<z.infer<typeof cloudFormSchema>>
  currentProvider: Provider
  currentCredentialType: string
  providerConfig: ReturnType<typeof getProviderConfig>
  credentialFields: ReturnType<typeof getCredentialFields>
  eventSourceFields: ReturnType<typeof getEventSourceFields>
}

const CloudFormContext = createContext<CloudFormContextValue | undefined>(undefined)

export function useCloudFormContext() {
  const context = useContext(CloudFormContext)
  if (!context) {
    throw new Error('useCloudFormContext must be used within CloudFormProvider')
  }
  return context
}

interface CloudFormProviderProps {
  children: ReactNode
  value: CloudFormContextValue
}

export function CloudFormProvider({ children, value }: CloudFormProviderProps) {
  return (
    <CloudFormContext.Provider value={value}>
      {children}
    </CloudFormContext.Provider>
  )
}
