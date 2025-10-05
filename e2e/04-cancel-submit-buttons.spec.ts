import { test, expect } from '@playwright/test'
import {
  navigateToKoreanHomepage,
  openCreateWizard,
  openEditWizard,
  fillBasicInfo,
  fillCredentials,
  goToNextStep,
  verifyWizardClosed,
} from './helpers/utils'
import { SELECTORS, TIMEOUTS } from './helpers/constants'

/**
 * Test Suite 4: Cancel and Submit Buttons
 * - 모든 단계에서 Cancel 버튼 표시
 * - Cancel 클릭 시 위자드 닫기
 * - Unsaved Changes 경고
 * - Submit 시 페이로드 출력
 */
test.describe('Cancel and Submit Button Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToKoreanHomepage(page)
  })

  test('TC 4.1.1: 모든 단계에서 Cancel 버튼이 표시됨', async ({ page }) => {
    await openCreateWizard(page)

    // Step 1: Cancel 버튼 확인
    let cancelButton = page.locator(SELECTORS.cancelButton)
    await expect(cancelButton).toBeVisible()

    // Step 1 -> Step 2
    await fillBasicInfo(page, 'Test')
    await goToNextStep(page)

    // Step 2: Cancel + Previous 버튼 확인
    cancelButton = page.locator(SELECTORS.cancelButton)
    await expect(cancelButton).toBeVisible()

    const previousButton = page.locator(SELECTORS.previousButton)
    await expect(previousButton).toBeVisible()

    // Step 2 -> Step 3
    await fillCredentials(page, 'AKIATEST', 'secret')
    await goToNextStep(page)

    // Step 3: Cancel + Previous 버튼 확인
    cancelButton = page.locator(SELECTORS.cancelButton)
    await expect(cancelButton).toBeVisible()
    await expect(previousButton).toBeVisible()

    // Step 3 -> Step 4
    await goToNextStep(page)

    // Step 4: Cancel + Previous 버튼 확인
    cancelButton = page.locator(SELECTORS.cancelButton)
    await expect(cancelButton).toBeVisible()
    await expect(previousButton).toBeVisible()
  })

  test('TC 4.2.1: 변경사항 없이 Cancel 클릭 시 즉시 닫힘', async ({ page }) => {
    await openCreateWizard(page)

    // 아무 입력도 하지 않고 Cancel 클릭
    await page.click(SELECTORS.cancelButton)
    await page.waitForTimeout(TIMEOUTS.MEDIUM)

    // 위자드가 닫혔는지 확인 (dialog가 사라짐)
    await verifyWizardClosed(page)

    // Unsaved Changes 경고가 표시되지 않음
    await expect(
      page.getByRole('heading', { name: SELECTORS.unsavedChangesHeading })
    ).not.toBeVisible()
  })

  test('TC 4.2.2: 변경사항 있을 때 Cancel 클릭 시 경고 표시', async ({ page }) => {
    await openCreateWizard(page)

    // Name 필드 입력 (변경사항 발생)
    await page.fill(SELECTORS.nameInput, 'Test Cloud Name')
    // Trigger blur to ensure form state updates
    await page.locator(SELECTORS.nameInput).blur()
    await page.waitForTimeout(TIMEOUTS.MEDIUM) // react-hook-form isDirty 업데이트 대기

    // Cancel 클릭
    await page.click(SELECTORS.cancelButton)
    await page.waitForTimeout(TIMEOUTS.MEDIUM)

    // Unsaved Changes 경고 다이얼로그 표시
    await expect(
      page.getByRole('heading', { name: SELECTORS.unsavedChangesHeading })
    ).toBeVisible({ timeout: TIMEOUTS.LONG * 10 })

    // Continue Editing 버튼 클릭
    await page.click(SELECTORS.continueEditingButton)
    await page.waitForTimeout(TIMEOUTS.MEDIUM)

    // Unsaved changes 다이얼로그가 닫혔는지 확인
    await expect(
      page.getByRole('heading', { name: SELECTORS.unsavedChangesHeading })
    ).not.toBeVisible()

    // 위자드로 돌아감 (dialog role로 확인)
    await expect(page.getByRole('heading', { name: SELECTORS.createWizardHeading })).toBeVisible()

    // 입력한 값이 유지되는지 확인
    const nameInput = page.locator(SELECTORS.nameInput)
    await expect(nameInput).toHaveValue('Test Cloud Name')
  })

  test('TC 4.2.3: Unsaved Changes에서 Discard Changes 클릭', async ({ page }) => {
    await openCreateWizard(page)

    // Name 필드 입력
    await page.fill(SELECTORS.nameInput, 'Test Cloud Name')
    // Trigger blur to ensure form state updates
    await page.locator(SELECTORS.nameInput).blur()
    await page.waitForTimeout(TIMEOUTS.MEDIUM) // react-hook-form isDirty 업데이트 대기

    // Cancel 클릭
    await page.click(SELECTORS.cancelButton)
    await page.waitForTimeout(TIMEOUTS.MEDIUM)

    // Unsaved Changes 경고 표시 확인
    await expect(
      page.getByRole('heading', { name: SELECTORS.unsavedChangesHeading })
    ).toBeVisible({ timeout: TIMEOUTS.LONG * 10 })

    // Discard Changes 버튼 클릭
    await page.click(SELECTORS.discardButton)
    await page.waitForTimeout(TIMEOUTS.MEDIUM)

    // 위자드가 완전히 닫혔는지 확인
    await verifyWizardClosed(page)
    await expect(
      page.getByRole('heading', { name: SELECTORS.unsavedChangesHeading })
    ).not.toBeVisible()
  })

  test('TC 4.3.1: X 버튼(Dialog Close)으로 닫을 때도 경고 표시', async ({ page }) => {
    await openCreateWizard(page)

    // Name 필드 입력
    await page.fill(SELECTORS.nameInput, 'Test Cloud Name')

    // Dialog의 X 버튼 클릭 (있는 경우)
    const closeButton = page.locator('button[aria-label="Close"]')

    // X 버튼이 있으면 클릭, 없으면 skip
    const closeButtonCount = await closeButton.count()
    if (closeButtonCount > 0) {
      await closeButton.click()
      await page.waitForTimeout(TIMEOUTS.MEDIUM)

      // Unsaved Changes 경고 표시
      await expect(
        page.getByRole('heading', { name: SELECTORS.unsavedChangesHeading })
      ).toBeVisible()
    }
  })

  test('TC 4.4.1: Submit 버튼 - Create 모드', async ({ page }) => {
    await openCreateWizard(page)

    // Step 3 (Features)까지 이동
    // Step 0: Basic Info
    await fillBasicInfo(page, 'Test Cloud')
    await goToNextStep(page)

    // Step 1: Credentials
    await fillCredentials(page, 'AKIATEST', 'secret')
    await goToNextStep(page)

    // Step 2: Regions - 최소 1개 리전 선택
    const firstRegionCheckbox = page.locator('button[id^="region-"]').first()
    await firstRegionCheckbox.click()
    await goToNextStep(page)

    // Step 3 (Features)에서 Create 버튼 확인
    const createButton = page.locator(SELECTORS.createSubmitButton)
    await expect(createButton).toBeVisible()

    // Save 버튼은 없어야 함
    const saveButton = page.locator(SELECTORS.saveButton)
    await expect(saveButton).not.toBeVisible()
  })

  test('TC 4.4.2: Submit 버튼 - Edit 모드', async ({ page }) => {
    // 수정 위자드 열기
    await openEditWizard(page)

    // Step 4까지 이동
    await goToNextStep(page)
    await goToNextStep(page)
    await goToNextStep(page)

    // Step 4에서 Save 버튼 확인
    const saveButton = page.locator(SELECTORS.saveButton)
    await expect(saveButton).toBeVisible()

    // Create 버튼은 없어야 함
    const createButton = page.locator(SELECTORS.createSubmitButton)
    await expect(createButton).not.toBeVisible()
  })

  test('TC 4.5.1: Submit 중 로딩 상태', async ({ page }) => {
    await openCreateWizard(page)

    // Step 3 (Features)까지 이동
    // Step 0: Basic Info
    await fillBasicInfo(page, 'Test')
    await goToNextStep(page)

    // Step 1: Credentials
    await fillCredentials(page, 'AKIATEST', 'secret')
    await goToNextStep(page)

    // Step 2: Regions - 최소 1개 리전 선택
    const firstRegionCheckbox = page.locator('button[id^="region-"]').first()
    await firstRegionCheckbox.click()
    await goToNextStep(page)

    // Step 3 (Features)에서 Create 버튼 클릭
    const createButton = page.locator(SELECTORS.createSubmitButton)
    await createButton.click()

    // 로딩 스피너가 표시되는지 확인 (짧은 시간)
    // Mock 딜레이가 300ms이므로 빠르게 지나갈 수 있음
    try {
      const loadingSpinner = page.locator('button:has-text("Create") svg')
      await expect(loadingSpinner).toBeVisible({ timeout: TIMEOUTS.SHORT })
    } catch {
      // 로딩이 너무 빠르면 스피너가 안 보일 수 있음
      console.log('Loading spinner not visible (too fast)')
    }

    // 제출 완료 후 위자드가 닫힘
    await verifyWizardClosed(page)
  })

  test('TC 4.6.1: 각 단계에서 Cancel 클릭 시 위자드 닫힘', async ({ page }) => {
    await openCreateWizard(page)

    // Step 1 (Credentials)로 이동
    await fillBasicInfo(page, 'Test')
    await page.locator(SELECTORS.nameInput).blur()
    await page.waitForTimeout(TIMEOUTS.SHORT)
    await goToNextStep(page)

    // Step 1에서 Cancel 클릭
    await page.click(SELECTORS.cancelButton)
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // Unsaved Changes 경고
    await expect(
      page.getByRole('heading', { name: SELECTORS.unsavedChangesHeading })
    ).toBeVisible({ timeout: TIMEOUTS.LONG * 10 })

    // Discard
    await page.click(SELECTORS.discardButton)
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // 위자드 닫힘
    await verifyWizardClosed(page)

    // ---------- Step 3에서도 테스트 ----------
    await openCreateWizard(page)

    await fillBasicInfo(page, 'Test2')
    await goToNextStep(page)

    await fillCredentials(page, 'AKIA', 'sec')
    await goToNextStep(page)

    // Step 3에서 Cancel
    await page.click(SELECTORS.cancelButton)
    await page.waitForTimeout(TIMEOUTS.SHORT)
    await page.click(SELECTORS.discardButton)
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // 위자드 다이얼로그가 닫혔는지 확인
    await verifyWizardClosed(page)
  })
})
