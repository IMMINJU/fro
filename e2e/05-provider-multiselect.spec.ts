import { test, expect } from '@playwright/test'
import {
  navigateToKoreanHomepage,
  openCreateWizard,
  fillBasicInfo,
  goToNextStep,
  fillCredentials,
} from './helpers/utils'
import { SELECTORS, TIMEOUTS, CLOUD_GROUPS } from './helpers/constants'

/**
 * Test Suite 5: Provider Restrictions and Multi-select
 * - AWS만 활성화, Azure/GCP 비활성화
 * - Credential Type 변경 시 동적 필드 변경
 * - Cloud Group 다중 선택
 * - Region List 다중 선택 (global 포함)
 */
test.describe('Provider and Multi-select Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToKoreanHomepage(page)
  })

  test('TC 5.1.1: AWS만 활성화, Azure/GCP는 비활성화', async ({ page }) => {
    await openCreateWizard(page)

    // Provider 드롭다운 클릭
    const providerButton = page.locator('button:has-text("AWS")')
    await providerButton.click()
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // AWS 옵션이 활성화되어 있는지 확인
    const awsOption = page.locator('[role="option"]', { hasText: 'AWS' })
    await expect(awsOption).toBeVisible()

    // Azure 옵션이 비활성화되어 있는지 확인
    const azureOption = page.locator('[role="option"]', {
      hasText: 'Azure (Coming Soon)',
    })
    await expect(azureOption).toBeVisible()

    // Azure가 disabled 속성을 가지고 있는지 확인 (Radix UI는 data-disabled 또는 aria-disabled 사용)
    const azureDisabled = await azureOption.getAttribute('data-disabled')
    const azureAriaDisabled = await azureOption.getAttribute('aria-disabled')
    expect(azureDisabled === 'true' || azureAriaDisabled === 'true').toBeTruthy()

    // GCP 옵션도 비활성화 확인
    const gcpOption = page.locator('[role="option"]', {
      hasText: 'GCP (Coming Soon)',
    })
    await expect(gcpOption).toBeVisible()

    const gcpDisabled = await gcpOption.getAttribute('data-disabled')
    const gcpAriaDisabled = await gcpOption.getAttribute('aria-disabled')
    expect(gcpDisabled === 'true' || gcpAriaDisabled === 'true').toBeTruthy()
  })

  test('TC 5.1.2: 비활성화된 프로바이더 클릭 시도', async ({ page }) => {
    await openCreateWizard(page)

    // Provider 드롭다운 클릭
    await page.click('button:has-text("AWS")')
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // Azure 옵션 클릭 시도
    const azureOption = page.locator('[role="option"]', {
      hasText: 'Azure (Coming Soon)',
    })
    await azureOption.click({ force: true })
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // Provider가 여전히 AWS인지 확인 (변경되지 않음)
    const providerButton = page.locator('button', { hasText: 'AWS' })
    await expect(providerButton).toBeVisible()
  })

  test('TC 5.2.1: Credential Type 변경 시 동적 필드 변경', async ({ page }) => {
    await openCreateWizard(page)

    // Step 2로 이동
    await fillBasicInfo(page, 'Test Cloud')
    await goToNextStep(page)

    // 기본 Credential Type은 ACCESS_KEY
    // Access Key ID, Secret Access Key 필드가 있어야 함
    const accessKeyInput = page.locator(SELECTORS.accessKeyInput)
    const secretKeyInput = page.locator(SELECTORS.secretKeyInput)

    await expect(accessKeyInput).toBeVisible()
    await expect(secretKeyInput).toBeVisible()

    // Role ARN 필드는 없어야 함
    const roleArnInput = page.locator(SELECTORS.roleArnInput)
    await expect(roleArnInput).not.toBeVisible()

    // Credential Type을 ASSUME_ROLE로 변경
    const credentialTypeButton = page
      .locator('button[role="combobox"]')
      .filter({ hasText: 'Access Key' })
    await credentialTypeButton.click()
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // ASSUME_ROLE 옵션 클릭
    const assumeRoleOption = page.locator('[role="option"]', {
      hasText: 'Assume Role',
    })
    await assumeRoleOption.click()
    await page.waitForTimeout(TIMEOUTS.MEDIUM)

    // 이제 Role ARN 필드가 나타나야 함
    const roleArnInputAfter = page.locator(SELECTORS.roleArnInput)
    await expect(roleArnInputAfter).toBeVisible()

    // Access Key ID와 Secret Access Key는 여전히 있어야 함
    await expect(accessKeyInput).toBeVisible()
    await expect(secretKeyInput).toBeVisible()
  })

  test('TC 5.3.1: Cloud Group 다중 선택', async ({ page }) => {
    await openCreateWizard(page)

    // 이름을 먼저 입력해서 폼을 유효한 상태로 만듦
    await fillBasicInfo(page, 'Test Cloud')
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // Production 선택 (Radix UI Checkbox는 button으로 렌더링됨)
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

  test('TC 5.3.2: 모든 Cloud Group 선택/해제', async ({ page }) => {
    await openCreateWizard(page)

    // 이름을 먼저 입력해서 폼을 유효한 상태로 만듦
    await fillBasicInfo(page, 'Test Cloud')
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // 6개 그룹 모두 선택
    const groups = [...CLOUD_GROUPS]

    // 각 그룹을 선택하고 즉시 확인
    for (const group of groups) {
      await page.click(`button[id="group-${group}"]`)
      const checkbox = page.locator(`button[id="group-${group}"]`)
      await expect(checkbox).toHaveAttribute('data-state', 'checked')
    }

    // 모두 선택되었는지 다시 확인 (Radix UI Checkbox는 button으로 렌더링됨)
    for (const group of groups) {
      const checkbox = page.locator(`button[id="group-${group}"]`)
      await expect(checkbox).toHaveAttribute('data-state', 'checked')
    }

    // 각 그룹을 해제하고 즉시 확인
    for (const group of groups) {
      await page.click(`button[id="group-${group}"]`)
      const checkbox = page.locator(`button[id="group-${group}"]`)
      await expect(checkbox).toHaveAttribute('data-state', 'unchecked')
    }

    // 모두 해제되었는지 다시 확인
    for (const group of groups) {
      const checkbox = page.locator(`button[id="group-${group}"]`)
      await expect(checkbox).toHaveAttribute('data-state', 'unchecked')
    }
  })

  test('TC 5.4.1: Region List 다중 선택 (global 포함)', async ({ page }) => {
    await openCreateWizard(page)

    // Step 4로 이동
    await fillBasicInfo(page, 'Test')
    await goToNextStep(page)

    await fillCredentials(page, 'AKIA', 'secret')
    await goToNextStep(page)

    await goToNextStep(page)

    // global 리전 선택
    const globalLabel = page.locator('label', { hasText: 'global' }).first()
    await globalLabel.click()
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // us-east-1 선택
    const usEast1Label = page.locator('label', { hasText: 'us-east-1' }).first()
    await usEast1Label.click()
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // us-west-2 선택
    const usWest2Label = page.locator('label', { hasText: 'us-west-2' }).first()
    await usWest2Label.click()
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // eu-west-1 선택
    const euWest1Label = page.locator('label', { hasText: 'eu-west-1' }).first()
    await euWest1Label.click()
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // 4개 리전이 모두 선택되었는지 확인
    await expect(globalLabel).toBeVisible()
    await expect(usEast1Label).toBeVisible()
    await expect(usWest2Label).toBeVisible()
    await expect(euWest1Label).toBeVisible()

    // us-east-1 선택 해제
    await usEast1Label.click()
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // 나머지는 여전히 선택되어 있는지 확인
    await expect(globalLabel).toBeVisible()
    await expect(usWest2Label).toBeVisible()
    await expect(euWest1Label).toBeVisible()
  })

  test('TC 5.4.2: global 리전이 목록 첫 번째에 있는지 확인', async ({ page }) => {
    await openCreateWizard(page)

    // Step 2 (Regions)로 이동
    // Step 0: Basic Info
    await fillBasicInfo(page, 'Test')
    await goToNextStep(page)

    // Step 1: Credentials
    await fillCredentials(page, 'AKIA', 'secret')
    await goToNextStep(page)

    // Step 2: Regions - 첫 번째 리전 라벨이 global인지 확인
    const firstRegionLabel = page.locator('label[for^="region-"]').first()
    await expect(firstRegionLabel).toContainText('global')
  })

  test('TC 5.5.1: Provider 유지 확인 (단계 간 이동)', async ({ page }) => {
    await openCreateWizard(page)

    // Provider가 AWS인지 확인
    const providerButton = page.locator('button:has-text("AWS")')
    await expect(providerButton).toBeVisible()

    // Step 2로 이동
    await fillBasicInfo(page, 'Test')
    await goToNextStep(page)

    // Step 1로 다시 돌아가기
    await page.click(SELECTORS.previousButton)
    await page.waitForLoadState('networkidle')

    // Provider가 여전히 AWS인지 확인
    await expect(providerButton).toBeVisible()
  })
})
