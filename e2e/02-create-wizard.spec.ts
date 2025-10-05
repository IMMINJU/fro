import { test, expect } from '@playwright/test'
import {
  navigateToKoreanHomepage,
  openCreateWizard,
  fillBasicInfo,
  fillCredentials,
  goToNextStep,
  verifyToastMessage,
  verifyWizardClosed,
  verifyValidationError,
  setupConsoleLogCapture,
  verifyConsoleLog,
} from './helpers/utils'
import { SELECTORS, TIMEOUTS, TEST_DATA } from './helpers/constants'

/**
 * Test Suite 2: Create Wizard
 * - 생성 버튼 클릭
 * - 빈 필드 확인
 * - 다중 선택 테스트
 * - 전체 생성 플로우
 */
test.describe('Create Wizard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToKoreanHomepage(page)
  })

  test('TC 2.1.1: 생성 버튼 클릭 시 위자드가 열림', async ({ page }) => {
    // 생성 버튼 클릭
    await openCreateWizard(page)

    // Step 1이 활성화되어 있는지 확인
    const stepIndicator = page.locator(SELECTORS.stepIndicator)
    await expect(stepIndicator).toBeVisible()
  })

  test('TC 2.2.1: 생성 위자드의 모든 필드가 빈 상태', async ({ page }) => {
    await openCreateWizard(page)

    // Step 1: Basic Info - 필드 확인
    const nameInput = page.locator(SELECTORS.nameInput)
    await expect(nameInput).toHaveValue('')

    // Provider는 기본값 AWS
    const providerSelect = page.locator('button:has-text("AWS")').first()
    await expect(providerSelect).toBeVisible()

    // Cloud Group - 모든 체크박스가 해제되어 있는지 확인
    const productionCheckbox = page.locator('button[id="group-Production"]')
    await expect(productionCheckbox).toHaveAttribute('data-state', 'unchecked')
  })

  test('TC 2.3.1: Cloud Group 다중 선택 가능', async ({ page }) => {
    await openCreateWizard(page)

    // 이름을 먼저 입력해서 폼을 유효한 상태로 만듦
    await fillBasicInfo(page, TEST_DATA.cloudName)

    // Production 선택
    const productionCheckbox = page.locator('button[id="group-Production"]')
    await productionCheckbox.click()
    await expect(productionCheckbox).toHaveAttribute('data-state', 'checked')

    // Security 선택
    const securityCheckbox = page.locator('button[id="group-Security"]')
    await securityCheckbox.click()
    await expect(securityCheckbox).toHaveAttribute('data-state', 'checked')

    // Monitoring 선택
    const monitoringCheckbox = page.locator('button[id="group-Monitoring"]')
    await monitoringCheckbox.click()
    await expect(monitoringCheckbox).toHaveAttribute('data-state', 'checked')

    // 3개 모두 선택되어 있는지 확인
    await expect(productionCheckbox).toHaveAttribute('data-state', 'checked')
    await expect(securityCheckbox).toHaveAttribute('data-state', 'checked')
    await expect(monitoringCheckbox).toHaveAttribute('data-state', 'checked')

    // Security 선택 해제
    await securityCheckbox.click()
    await expect(securityCheckbox).toHaveAttribute('data-state', 'unchecked')

    // 나머지는 여전히 선택되어 있는지 확인
    await expect(productionCheckbox).toHaveAttribute('data-state', 'checked')
    await expect(monitoringCheckbox).toHaveAttribute('data-state', 'checked')
  })

  test('TC 2.4.1: 리전 다중 선택 가능 (global 포함)', async ({ page }) => {
    await openCreateWizard(page)

    // Name 입력 (필수)
    await fillBasicInfo(page, TEST_DATA.cloudName)

    // Step 2로 이동 (Credentials)
    await goToNextStep(page)

    // Credentials 입력
    await fillCredentials(page, TEST_DATA.accessKeyId, TEST_DATA.secretAccessKey)

    // Step 3로 이동 (Regions)
    await goToNextStep(page)

    // global 리전 선택
    const globalLabel = page.locator('label', { hasText: 'global' }).first()
    await globalLabel.click()

    // us-east-1 선택
    const usEast1Label = page.locator('label', { hasText: 'us-east-1' }).first()
    await usEast1Label.click()

    // eu-west-1 선택
    const euWest1Label = page.locator('label', { hasText: 'eu-west-1' }).first()
    await euWest1Label.click()

    // 3개 리전이 모두 선택되었는지 확인
    await expect(globalLabel).toBeVisible()
    await expect(usEast1Label).toBeVisible()
    await expect(euWest1Label).toBeVisible()
  })

  test('TC 2.5.1: 전체 생성 플로우 - 페이로드 콘솔 출력 확인', async ({ page }) => {
    // 콘솔 로그 캡처
    const consoleLogs = setupConsoleLogCapture(page)

    await openCreateWizard(page)

    // Step 1: Basic Info
    await fillBasicInfo(page, 'QA Test Cloud', ['Production'])
    await goToNextStep(page)

    // Step 2: Credentials
    await fillCredentials(page, TEST_DATA.accessKeyId, TEST_DATA.secretAccessKey)
    await goToNextStep(page)

    // Step 3: Regions
    await page.locator('label', { hasText: 'global' }).first().click()
    await page.locator('label', { hasText: 'us-east-1' }).first().click()

    await goToNextStep(page)

    // Step 4: Features - Create 버튼 클릭
    await page.click(SELECTORS.createSubmitButton)

    // 페이로드 콘솔 출력 대기
    await page.waitForTimeout(TIMEOUTS.LONG)

    // 콘솔에 "Creating cloud with payload" 메시지가 있는지 확인
    expect(verifyConsoleLog(consoleLogs, 'Creating cloud with payload')).toBeTruthy()

    // 위자드가 닫혔는지 확인
    await verifyWizardClosed(page)

    // Success Toast 확인
    await verifyToastMessage(page, SELECTORS.createSuccessToast)
  })

  test('TC 2.6.1: 필수 필드 미입력 시 다음 단계 이동 불가', async ({ page }) => {
    await openCreateWizard(page)

    // Name을 입력하지 않고 Next 클릭
    await page.click(SELECTORS.nextButton)
    await page.waitForLoadState('networkidle')

    // 검증 에러 확인
    await verifyValidationError(page, '클라우드 이름')

    // Step 1에 머물러 있는지 확인
    const activeStep = page.locator('nav[aria-label="Progress"] span:has-text("1")')
    await expect(activeStep).toBeVisible()
  })
})
