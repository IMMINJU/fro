import { Provider, AWSRegionList, AzureRegionList, GCPRegionList } from '@/types/types'

export function getRegionList(provider: Provider): readonly string[] {
  switch (provider) {
    case 'AWS': return AWSRegionList
    case 'AZURE': return AzureRegionList
    case 'GCP': return GCPRegionList
    default: return AWSRegionList
  }
}
