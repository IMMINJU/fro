// 프로바이더 타입 정의 (AWS만 활성화)
export type Provider = 'AWS' | 'AZURE' | 'GCP';

// AWS 리전 목록
export const AWSRegionList = [
  'global',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ca-central-1',
  'eu-central-1',
  'eu-north-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
] as const

export type AWSRegion = typeof AWSRegionList[number];

// Azure 리전 목록 (미사용)
export const AzureRegionList = [
  'global',
  'eastus',
  'westus',
  'centralus',
  'northeurope',
  'westeurope',
  'southeastasia',
  'eastasia',
  'japaneast',
  'koreacentral',
  'australiaeast',
  'canadacentral',
  'brazilsouth',
  'uksouth',
  'southindia',
] as const

export type AzureRegion = typeof AzureRegionList[number];

// GCP 리전 목록 (미사용)
export const GCPRegionList = [
  'global',
  'us-central1',
  'us-east1',
  'us-west1',
  'europe-west1',
  'europe-west2',
  'asia-east1',
  'asia-northeast1',
  'asia-southeast1',
  'australia-southeast1',
  'southamerica-east1',
] as const

export type GCPRegion = typeof GCPRegionList[number];

// AWS 크리덴셜 타입 (ACCESS_KEY만 활성화)
export type AWSCredentialType = 'ACCESS_KEY' | 'ASSUME_ROLE' | 'ROLES_ANYWHERE';

export interface AWSCredential {
  accessKeyId: string;
  secretAccessKey: string;
  roleArn?: string;
}

export interface AWSEventSource {
  cloudTrailName?: string;
}

// Azure 크리덴셜 타입 (미사용)
export type AzureCredentialType = 'APPLICATION';

export interface AzureCredential {
  tenantId: string;
  subscriptionId: string;
  applicationId: string;
  secretKey: string;
}

export interface AzureEventSource {
  storageAccountName?: string;
}

// GCP 크리덴셜 타입 (미사용)
export type GCPCredentialType = 'JSON_TEXT';

export interface GCPCredential {
  projectId?: string;
  jsonText: string;
}

export interface GCPEventSource {
  storageAccountName?: string;
}

// 스케줄 스캔 설정
export interface ScheduleScanSetting {
  /**
   * frequency에 따라 각 필드의 필수 여부가 변경됨
   * HOUR  : 매시간을 의미
   * DAY   : 매일을 의미
   * WEEK  : 매주를 의미
   * MONTH : 매월을 의미
   */
  frequency: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  date?: string; // '1' ~ '28'
  weekday?: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  hour?: string; // '0' ~ '23'
  minute?: string; // '0' ~ '60', '5' 단위로 증가
}

// Cloud 상태 타입
export type CloudStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ERROR';

// 메인 Cloud 인터페이스
export interface Cloud {
  id: string; // GET 요청 시 획득
  provider: Provider;
  name: string;
  status?: CloudStatus;
  createdAt?: string;
  updatedAt?: string;
  cloudGroupName?: string[]; // 선택 가능한 cloudGroupName 목록을 서버에서 받아야하지만, 편의상 상수로 선언하여 사용
  eventProcessEnabled: boolean;
  userActivityEnabled: boolean;
  scheduleScanEnabled: boolean;
  scheduleScanSetting?: ScheduleScanSetting; // scheduleScanEnabled = true 인 경우만 존재
  regionList: string[];
  proxyUrl?: string;
  /**
   * 비밀 값이라 GET 요청 시 마스킹 상태로 데이터 전송됨. 마스킹된 값을 UI에서 어떻게 활용할지는 자유
   * 예 : { accessKeyId: "AKIA********18", secretAccessKey: "jZd1********0n" }
   */
  credentials: AWSCredential | AzureCredential | GCPCredential;
  credentialType: AWSCredentialType | AzureCredentialType | GCPCredentialType;
  /**
   * 비밀 값이 아니라 마스킹되지 않음
   */
  eventSource?: AWSEventSource | AzureEventSource | GCPEventSource;
}

// 클라우드 그룹 이름 상수 (편의상 정의)
export const CLOUD_GROUP_NAMES = [
  'Production',
  'Development',
  'Staging',
  'Test',
  'Security',
  'Monitoring',
] as const

export type CloudGroupName = typeof CLOUD_GROUP_NAMES[number];

// 요일 타입
export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

// 빈도 타입
export type Frequency = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

// 클라우드 생성/수정 요청 타입
export type CloudCreateRequest = Omit<Cloud, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
export type CloudUpdateRequest = Partial<CloudCreateRequest>;
