/**
 * E2E Test Constants
 * Centralized timing and selector constants for all test files
 */

// Timeout constants (in milliseconds)
export const TIMEOUTS = {
  SHORT: 200,
  MEDIUM: 500,
  LONG: 1000,
  TOAST: 5000,
  SKELETON: 500,
} as const

// Test data
export const TEST_DATA = {
  cloudName: 'Test Cloud',
  accessKeyId: 'AKIATEST12345678',
  secretAccessKey: 'mysecretkey123456789',
  roleArn: 'arn:aws:iam::123456789012:role/TestRole',
} as const

// Locators
export const SELECTORS = {
  // Buttons
  createButton: 'button:has-text("클라우드 생성")',
  editButton: 'button:has-text("Edit")',
  nextButton: 'button:has-text("Next")',
  previousButton: 'button:has-text("Previous")',
  cancelButton: 'button:has-text("Cancel")',
  createSubmitButton: 'button[type="submit"]:has-text("Create")',
  saveButton: 'button:has-text("Save")',
  discardButton: 'button:has-text("변경사항 버리기")',
  continueEditingButton: 'button:has-text("계속 편집")',

  // Inputs
  nameInput: 'input[name="name"]',
  accessKeyInput: 'input[placeholder*="AKIAIOSFODNN7EXAMPLE"]',
  secretKeyInput: 'input[placeholder*="wJalrXUtnFEMI"]',
  roleArnInput: 'input[placeholder*="arn:aws:iam::123456789012:role/RoleName"]',

  // Dialogs & Headings
  createWizardHeading: '클라우드 생성',
  editWizardHeading: '클라우드 수정',
  unsavedChangesHeading: '저장되지 않은 변경사항',

  // Toast messages
  createSuccessToast: '클라우드가 성공적으로 생성되었습니다',
  updateSuccessToast: '클라우드가 성공적으로 업데이트되었습니다',

  // Other
  stepIndicator: 'nav[aria-label="Progress"]',
  table: 'table',
  dialog: '[role="dialog"]',
  alert: '[role="alert"]',
} as const

// Cloud Groups
export const CLOUD_GROUPS = [
  'Production',
  'Development',
  'Staging',
  'Test',
  'Security',
  'Monitoring',
] as const

// AWS Regions
export const AWS_REGIONS = {
  global: 'global',
  usEast1: 'us-east-1',
  usWest1: 'us-west-1',
  usWest2: 'us-west-2',
  euWest1: 'eu-west-1',
  apNortheast1: 'ap-northeast-1',
  apSoutheast1: 'ap-southeast-1',
} as const
