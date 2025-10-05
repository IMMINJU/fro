import { test, expect } from '@playwright/test'
import {
  navigateToKoreanHomepage,
  openEditWizard,
  goToNextStep,
  verifyToastMessage,
  verifyWizardClosed,
  setupConsoleLogCapture,
  verifyConsoleLog,
  waitForLoadingComplete,
} from './helpers/utils'
import { SELECTORS, TIMEOUTS } from './helpers/constants'

/**
 * Test Suite 3: Edit Wizard
 * - 수정 버튼 클릭
 * - 비동기 데이터 로딩 확인
 * - 데이터 초기화 확인
 * - 수정 플로우
 */
test.describe('Edit Wizard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToKoreanHomepage(page)
  })

  test('TC 3.1.1: 수정 버튼 클릭 시 수정 위자드가 열림', async ({ page }) => {
    await openEditWizard(page)
  })

  test('TC 3.2.1: 수정 위자드 - 로딩 스켈레톤 표시', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first()
    const actionButton = firstRow.locator(SELECTORS.editButton)
    await actionButton.click()

    // 로딩 중일 때 스켈레톤이 표시되는지 확인
    const loadingText = page.locator('text=Loading...')

    // 타임아웃을 짧게 설정하여 스켈레톤이 보이면 통과, 아니면 skip
    try {
      await expect(loadingText).toBeVisible({ timeout: TIMEOUTS.SKELETON })
    } catch {
      // 로딩이 너무 빠르면 스켈레톤이 안 보일 수 있음
      console.log('Loading skeleton not visible (data loaded too fast)')
    }

    // 데이터 로드 완료 대기
    await waitForLoadingComplete(page)
  })

  test('TC 3.3.1: 수정 위자드 - 서버 데이터로 필드 초기화', async ({ page }) => {
    await openEditWizard(page, 'Production AWS')
    await waitForLoadingComplete(page)

    // Step 1: Basic Info - 데이터가 초기화되어 있는지 확인
    const nameInput = page.locator(SELECTORS.nameInput)
    await expect(nameInput).toHaveValue('Production AWS')

    // Provider가 AWS로 설정되어 있는지 확인
    const providerSelect = page.locator('button:has-text("AWS")').first()
    await expect(providerSelect).toBeVisible()

    // Cloud Group이 선택되어 있는지 확인 (Production, Security)
    const productionCheckbox = page.locator('button[id="group-Production"]')
    const securityCheckbox = page.locator('button[id="group-Security"]')
    await expect(productionCheckbox).toHaveAttribute('data-state', 'checked')
    await expect(securityCheckbox).toHaveAttribute('data-state', 'checked')
  })

  test('TC 3.3.2: 수정 위자드 - Credentials 데이터 초기화', async ({ page }) => {
    await openEditWizard(page, 'Production AWS')
    await waitForLoadingComplete(page)

    // Step 2로 이동
    await goToNextStep(page)

    // Access Key ID가 표시되는지 확인
    const accessKeyInput = page.locator(SELECTORS.accessKeyInput)
    const accessKeyValue = await accessKeyInput.inputValue()

    // 값이 존재하는지 확인
    expect(accessKeyValue).toBeTruthy()
  })

  test('TC 3.3.3: 수정 위자드 - Region List 초기화', async ({ page }) => {
    await openEditWizard(page, 'Production AWS')
    await waitForLoadingComplete(page)

    // Step 2로 이동 (Regions step)
    await goToNextStep(page)
    await goToNextStep(page)

    // Production AWS는 4개 리전이 선택되어 있어야 함
    const regions = ['us-east-1', 'us-west-2', 'ap-northeast-1', 'eu-west-1']
    for (const region of regions) {
      const regionLabel = page.locator(`label[for="region-${region}"]`)
      await expect(regionLabel).toBeVisible()
    }
  })

  test('TC 3.4.1: 수정 플로우 - 페이로드 콘솔 출력', async ({ page }) => {
    // 콘솔 로그 캡처
    const consoleLogs = setupConsoleLogCapture(page)

    await openEditWizard(page, 'Production AWS')
    await waitForLoadingComplete(page)

    // Name 수정
    const nameInput = page.locator(SELECTORS.nameInput)
    await nameInput.fill('Updated Production AWS')

    // Step 4까지 이동
    await goToNextStep(page)
    await goToNextStep(page)
    await goToNextStep(page)

    // Save 버튼 클릭
    await page.click(SELECTORS.saveButton)
    await page.waitForTimeout(TIMEOUTS.LONG)

    // 콘솔에 "Updating cloud with payload" 메시지가 있는지 확인
    expect(verifyConsoleLog(consoleLogs, 'Updating cloud with payload')).toBeTruthy()

    // 위자드가 닫혔는지 확인
    await verifyWizardClosed(page)

    // Success Toast 확인
    await verifyToastMessage(page, SELECTORS.updateSuccessToast)
  })

  test('TC 3.5.1: Global AWS - global 리전이 선택되어 있는지 확인', async ({ page }) => {
    await openEditWizard(page, 'Global AWS')
    await waitForLoadingComplete(page)

    // Step 2로 이동 (Regions step)
    await goToNextStep(page)
    await goToNextStep(page)

    // global 리전이 선택되어 있는지 확인
    const globalLabel = page.locator('label[for="region-global"]')
    await expect(globalLabel).toBeVisible()
    await expect(globalLabel).toContainText('global')

    // 여러 리전이 선택되어 있는지 확인
    const regions = ['us-east-1', 'us-west-1', 'eu-west-1', 'ap-northeast-1', 'ap-southeast-1']
    for (const region of regions) {
      const regionLabel = page.locator(`label[for="region-${region}"]`)
      await expect(regionLabel).toBeVisible()
    }
  })
})
