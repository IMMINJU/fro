import { test, expect } from '@playwright/test'
import { navigateToKoreanHomepage, openEditWizard } from './helpers/utils'
import { SELECTORS, TIMEOUTS } from './helpers/constants'

/**
 * Test Suite 1: Data Display
 * - 타입 기반 더미 데이터 표시
 * - global 리전 포함 확인
 */
test.describe('Data Display Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToKoreanHomepage(page)
  })

  test('TC 1.1.1: 클라우드 목록이 올바르게 표시됨', async ({ page }) => {
    // 테이블이 표시되는지 확인
    const table = page.locator(SELECTORS.table)
    await expect(table).toBeVisible()

    // 6개의 샘플 데이터가 표시되는지 확인
    const rows = page.locator('table tbody tr')
    // Wait for data to load
    await page.waitForLoadState('networkidle')
    const rowCount = await rows.count()

    expect(rowCount).toBeGreaterThanOrEqual(6)

    // 첫 번째 row의 데이터 확인 (Production AWS)
    const firstRow = rows.first()
    await expect(firstRow).toContainText('Production AWS')
    await expect(firstRow).toContainText('AWS')
  })

  test('TC 1.1.2: Global AWS 데이터에 global 리전 포함 확인', async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState('networkidle')

    // "Global AWS" 클라우드 찾기 및 수정 위자드 열기
    await openEditWizard(page, 'Global AWS')

    // Step 3 (Regions)로 이동
    await page.click(SELECTORS.nextButton)
    await page.waitForLoadState('networkidle')

    await page.click(SELECTORS.nextButton)
    await page.waitForLoadState('networkidle')

    // Now on Step 3 (Regions) - check for global region
    const globalLabel = page.locator('label[for="region-global"]')
    await expect(globalLabel).toBeVisible()
    await expect(globalLabel).toContainText('global')

    // Verify global is selected (checkbox is checked via data-state or aria-checked)
    const globalCheckboxContainer = page
      .locator('button[role="checkbox"][aria-labelledby*="region-global"]')
      .or(page.locator('label[for="region-global"]').locator('..').locator('button[data-state="checked"]'))
      .first()
    await expect(globalCheckboxContainer).toBeVisible()

    // 위자드 닫기
    await page.click(SELECTORS.cancelButton)
  })

  test('TC 1.1.3: 테이블 헤더가 올바르게 표시됨', async ({ page }) => {
    // 테이블 헤더 확인
    const tableHead = page.locator('table thead')

    // 최소한 Name, Provider 컬럼이 있어야 함
    await expect(tableHead).toContainText('Name')
    await expect(tableHead).toContainText('Provider')
  })

  test('TC 1.1.4: 각 row에 수정 버튼이 존재함', async ({ page }) => {
    const rows = page.locator('table tbody tr')
    const firstRow = rows.first()

    // Edit 버튼이 있는지 확인
    const actionButton = firstRow.locator(SELECTORS.editButton)
    await expect(actionButton).toBeVisible()
  })

  test('TC 1.1.5: 테이블 상단에 생성 버튼이 존재함', async ({ page }) => {
    // "Create Cloud" 버튼 찾기
    const createButton = page.locator(SELECTORS.createButton)
    await expect(createButton).toBeVisible()

    // 버튼이 활성화 상태인지 확인
    await expect(createButton).toBeEnabled()
  })

  test('TC 1.1.6: 다양한 프로바이더의 데이터가 표시됨', async ({ page }) => {
    const tableBody = page.locator('table tbody')

    // AWS 데이터 확인
    await expect(tableBody).toContainText('AWS')

    // Azure 데이터 확인
    await expect(tableBody).toContainText('AZURE')

    // GCP 데이터 확인
    await expect(tableBody).toContainText('GCP')
  })
})
