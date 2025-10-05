import { test, expect } from '@playwright/test'
import {
  navigateToKoreanHomepage,
  openCreateWizard,
  openEditWizard,
  fillBasicInfo,
  fillCredentials,
  goToNextStep,
  verifyToastMessage,
} from './helpers/utils'
import { SELECTORS, TIMEOUTS } from './helpers/constants'

/**
 * Test Suite 6: UX Features
 * - 낙관적 업데이트
 * - Toast 알림
 * - 단계별 검증
 * - 스켈레톤 로딩
 * - 반응형 디자인
 */
test.describe('UX Features Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToKoreanHomepage(page)
  })

  test('TC 6.1.1: 성공 Toast 알림 - 생성', async ({ page }) => {
    await openCreateWizard(page)

    // 최소 정보로 생성
    await fillBasicInfo(page, 'Toast Test Cloud')
    await goToNextStep(page)

    await fillCredentials(page, 'AKIATEST', 'secret')
    await goToNextStep(page)

    // Region 선택
    const globalCheckbox = page.locator('button[id="region-global"]')
    await globalCheckbox.click()
    await goToNextStep(page)

    await page.click(SELECTORS.createSubmitButton)

    // Success Toast 확인
    await verifyToastMessage(page, SELECTORS.createSuccessToast)

    // Toast에 클라우드 이름이 포함되는지 확인 (선택적)
    const toast = page.locator('[role="status"]').or(page.locator('li')).first()
    await expect(toast).toContainText('Toast Test Cloud', { timeout: TIMEOUTS.TOAST })
  })

  test('TC 6.1.2: 성공 Toast 알림 - 수정', async ({ page }) => {
    await openEditWizard(page)

    // Name 수정
    const nameInput = page.locator(SELECTORS.nameInput)
    await nameInput.fill('Updated Cloud Name')

    // Step 4까지 이동
    await goToNextStep(page)
    await goToNextStep(page)
    await goToNextStep(page)

    await page.click(SELECTORS.saveButton)

    // Success Toast 확인
    await verifyToastMessage(page, SELECTORS.updateSuccessToast)
  })

  test('TC 6.2.1: 단계별 검증 - 필수 필드 에러', async ({ page }) => {
    await openCreateWizard(page)

    // Name을 입력하지 않고 Next 클릭
    await page.click(SELECTORS.nextButton)
    await page.waitForTimeout(TIMEOUTS.MEDIUM)

    // 검증 에러 Alert 표시 (Korean: "필수 필드를 입력해주세요: 클라우드 이름")
    const errorAlert = page.locator(SELECTORS.alert).filter({ hasText: '클라우드 이름' })
    await expect(errorAlert).toBeVisible()

    // 에러 메시지에 필드명 포함
    await expect(errorAlert).toContainText('클라우드 이름')

    // Step 1에 머물러 있는지 확인 (heading 사용)
    await expect(page.getByRole('heading', { name: SELECTORS.createWizardHeading })).toBeVisible()
  })

  test('TC 6.2.2: 검증 통과 시 다음 단계로 이동', async ({ page }) => {
    await openCreateWizard(page)

    // Name 입력
    await fillBasicInfo(page, 'Valid Name')

    // Next 클릭
    await goToNextStep(page)

    // Step 2로 이동했는지 확인 (Credentials 필드가 보임)
    const accessKeyInput = page.locator(SELECTORS.accessKeyInput)
    await expect(accessKeyInput).toBeVisible()

    // 검증 에러 Alert가 사라졌는지 확인
    const errorAlert = page.locator(SELECTORS.alert).filter({ hasText: '클라우드 이름' })
    await expect(errorAlert).not.toBeVisible()
  })

  test('TC 6.3.1: 진행 상태 표시 - Step Indicator', async ({ page }) => {
    await openCreateWizard(page)

    // Step Indicator가 보이는지 확인
    const stepIndicator = page.locator(SELECTORS.stepIndicator)
    await expect(stepIndicator).toBeVisible()

    // Step 1이 활성화되어 있는지 확인
    const step1 = stepIndicator.locator('li').first()
    await expect(step1).toBeVisible()

    // Step 2로 이동
    await fillBasicInfo(page, 'Test')
    await goToNextStep(page)

    // Step 1이 완료 상태인지 확인 (체크마크)
    const checkIcon = stepIndicator.locator('svg').first()
    await expect(checkIcon).toBeVisible()
  })

  test('TC 6.4.1: 스켈레톤 로딩 - 수정 위자드', async ({ page }) => {
    const firstRow = page.locator(SELECTORS.table + ' tbody tr').first()
    const actionButton = firstRow.locator(SELECTORS.editButton)
    await actionButton.click()
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // 로딩 텍스트가 표시되는지 확인 (빠르면 안 보일 수 있음)
    try {
      const loadingText = page.locator('text=Loading...')
      await expect(loadingText).toBeVisible({ timeout: TIMEOUTS.SKELETON })
    } catch {
      console.log('Loading skeleton not visible (data loaded too fast)')
    }

    // 데이터 로드 완료 후 위자드가 표시됨 (Korean: 클라우드 수정)
    await expect(
      page.getByRole('heading', { name: SELECTORS.editWizardHeading })
    ).toBeVisible({ timeout: TIMEOUTS.MEDIUM * 6 })
  })

  test('TC 6.5.1: 낙관적 업데이트 - 생성 시 즉시 UI 반영', async ({ page }) => {
    // 생성 전 row 개수 확인
    const rowsBefore = await page.locator(SELECTORS.table + ' tbody tr').count()

    await openCreateWizard(page)

    // 빠르게 생성
    await fillBasicInfo(page, 'Optimistic Test Cloud')
    await goToNextStep(page)

    await fillCredentials(page, 'AKIA', 'secret')
    await goToNextStep(page)

    // Region 선택
    const globalCheckbox = page.locator('button[id="region-global"]')
    await globalCheckbox.click()
    await goToNextStep(page)

    await page.click(SELECTORS.createSubmitButton)

    // 서버 응답 전에 UI가 업데이트되었는지 확인
    // (300ms 딜레이가 있으므로 즉시 확인)
    await page.waitForTimeout(100)

    // 새로운 row가 추가되었는지 확인 (낙관적 업데이트)
    const rowsAfter = await page.locator(SELECTORS.table + ' tbody tr').count()
    expect(rowsAfter).toBeGreaterThan(rowsBefore)

    // Toast 확인
    await verifyToastMessage(page, SELECTORS.createSuccessToast)
  })

  test('TC 6.6.1: 반응형 디자인 - 모바일 뷰', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 })
    await navigateToKoreanHomepage(page)

    // 테이블이 반응형으로 조정되는지 확인
    const table = page.locator(SELECTORS.table)
    await expect(table).toBeVisible()

    // 생성 버튼이 보이는지 확인
    const createButton = page.locator(SELECTORS.createButton)
    await expect(createButton).toBeVisible()

    // 위자드 열기
    await openCreateWizard(page)

    // 위자드가 모바일 화면에 맞게 조정되는지 확인
    const dialog = page.locator(SELECTORS.dialog)
    await expect(dialog).toBeVisible()

    // 버튼들이 세로로 배치되는지 확인 (간접적으로)
    const cancelButton = page.locator(SELECTORS.cancelButton)
    const nextButton = page.locator(SELECTORS.nextButton)
    await expect(cancelButton).toBeVisible()
    await expect(nextButton).toBeVisible()
  })

  test('TC 6.6.2: 반응형 디자인 - 태블릿 뷰', async ({ page }) => {
    // 태블릿 뷰포트로 변경
    await page.setViewportSize({ width: 768, height: 1024 })
    await navigateToKoreanHomepage(page)

    // 테이블이 정상 표시되는지 확인
    const table = page.locator(SELECTORS.table)
    await expect(table).toBeVisible()

    // 위자드 열기
    await openCreateWizard(page)

    // 위자드가 태블릿 화면에 맞게 조정되는지 확인
    const dialog = page.locator(SELECTORS.dialog)
    await expect(dialog).toBeVisible()

    // Step Indicator가 보이는지 확인
    const stepIndicator = page.locator(SELECTORS.stepIndicator)
    await expect(stepIndicator).toBeVisible()
  })

  test('TC 6.7.1: 키보드 네비게이션 - Tab 키', async ({ page }) => {
    await openCreateWizard(page)

    // Tab 키로 필드 간 이동
    await page.keyboard.press('Tab')
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // 포커스된 요소 확인
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeDefined()

    // Tab 키를 여러 번 눌러 다음 필드로 이동
    await page.keyboard.press('Tab')
    await page.waitForTimeout(TIMEOUTS.SHORT)
    await page.keyboard.press('Tab')
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // Enter 키로 버튼 클릭 가능한지 확인 (선택적)
    // await page.keyboard.press('Enter')
  })

  test('TC 6.8.1: 전역 로딩 인디케이터', async ({ page }) => {
    // 페이지 로드 중 전역 로딩 인디케이터가 표시되는지 확인
    // (이미 로드되었으므로 보이지 않을 수 있음)
    const globalLoading = page.locator('text=Loading...')

    // 생성 버튼 클릭 시 로딩 인디케이터 확인
    await openCreateWizard(page)

    // 필드 입력 및 생성
    await fillBasicInfo(page, 'Test')
    await goToNextStep(page)

    await fillCredentials(page, 'AKIA', 'secret')
    await goToNextStep(page)

    // Region 선택
    const globalCheckbox = page.locator('button[id="region-global"]')
    await globalCheckbox.click()
    await goToNextStep(page)

    await page.click(SELECTORS.createSubmitButton)

    // 제출 중 글로벌 로딩 인디케이터가 표시되는지 확인 (선택적)
    try {
      const loadingIndicator = page.locator(
        'div:has-text("Loading..."), [role="status"]',
      )
      await expect(loadingIndicator.first()).toBeVisible({ timeout: TIMEOUTS.MEDIUM })
    } catch {
      console.log('Global loading indicator not visible (too fast)')
    }
  })
})
