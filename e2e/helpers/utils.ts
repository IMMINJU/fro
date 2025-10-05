import { Page, expect } from '@playwright/test'
import { TIMEOUTS, SELECTORS } from './constants'

/**
 * Navigation Helpers
 */

export async function navigateToKoreanHomepage(page: Page) {
  await page.goto('/ko')
  await page.waitForLoadState('networkidle')
}

export async function openCreateWizard(page: Page) {
  await page.click(SELECTORS.createButton)
  await page.waitForSelector(SELECTORS.dialog, { state: 'visible' })
  await expect(page.getByRole('heading', { name: SELECTORS.createWizardHeading })).toBeVisible()
}

export async function openEditWizard(page: Page, rowLocator?: string) {
  const row = rowLocator
    ? page.locator('table tbody tr', { hasText: rowLocator })
    : page.locator('table tbody tr').first()

  const editButton = row.locator(SELECTORS.editButton)
  await editButton.click()
  await page.waitForSelector(SELECTORS.dialog, { state: 'visible' })
  await expect(page.getByRole('heading', { name: SELECTORS.editWizardHeading })).toBeVisible()
}

/**
 * Wizard Navigation
 */

export async function goToNextStep(page: Page) {
  await page.click(SELECTORS.nextButton)
  await page.waitForLoadState('networkidle')
}

export async function goToPreviousStep(page: Page) {
  await page.click(SELECTORS.previousButton)
  await page.waitForLoadState('networkidle')
}

export async function cancelWizard(page: Page, expectUnsavedWarning = false) {
  await page.click(SELECTORS.cancelButton)

  if (expectUnsavedWarning) {
    await expect(
      page.getByRole('heading', { name: SELECTORS.unsavedChangesHeading })
    ).toBeVisible({ timeout: TIMEOUTS.LONG })
  }
}

/**
 * Form Filling Helpers
 */

export async function fillBasicInfo(page: Page, name: string, cloudGroups?: string[]) {
  await page.fill(SELECTORS.nameInput, name)

  if (cloudGroups) {
    for (const group of cloudGroups) {
      const checkbox = page.locator(`button[id="group-${group}"]`)
      const state = await checkbox.getAttribute('data-state')
      if (state !== 'checked') {
        await checkbox.click()
      }
    }
  }
}

export async function fillCredentials(page: Page, accessKey: string, secretKey: string) {
  await page.fill(SELECTORS.accessKeyInput, accessKey)
  await page.fill(SELECTORS.secretKeyInput, secretKey)
}

export async function selectRegions(page: Page, regions: string[]) {
  for (const region of regions) {
    const regionLabel = page.locator(`label[for="region-${region}"]`)
    await regionLabel.click()
    await page.waitForTimeout(TIMEOUTS.SHORT)
  }
}

/**
 * Complete Flows
 */

export async function completeCreateFlow(
  page: Page,
  {
    name,
    accessKey,
    secretKey,
    regions = ['global'],
    cloudGroups,
  }: {
    name: string
    accessKey: string
    secretKey: string
    regions?: string[]
    cloudGroups?: string[]
  }
) {
  // Step 1: Basic Info
  await fillBasicInfo(page, name, cloudGroups)
  await goToNextStep(page)

  // Step 2: Credentials
  await fillCredentials(page, accessKey, secretKey)
  await goToNextStep(page)

  // Step 3: Regions
  await selectRegions(page, regions)
  await goToNextStep(page)

  // Step 4: Features (Submit)
  await page.click(SELECTORS.createSubmitButton)
}

export async function completeEditFlow(
  page: Page,
  {
    name,
    skipToEnd = true,
  }: {
    name?: string
    skipToEnd?: boolean
  }
) {
  if (name) {
    await page.fill(SELECTORS.nameInput, name)
  }

  if (skipToEnd) {
    // Navigate to final step
    for (let i = 0; i < 3; i++) {
      await goToNextStep(page)
    }
  }

  await page.click(SELECTORS.saveButton)
}

/**
 * Verification Helpers
 */

export async function verifyToastMessage(page: Page, message: string) {
  await expect(page.locator(`text=${message}`)).toBeVisible({
    timeout: TIMEOUTS.TOAST,
  })
}

export async function verifyWizardClosed(page: Page) {
  await expect(page.locator(SELECTORS.dialog)).not.toBeVisible()
}

export async function verifyValidationError(page: Page, fieldName: string) {
  const errorAlert = page.locator(SELECTORS.alert).filter({ hasText: fieldName })
  await expect(errorAlert).toBeVisible()
}

/**
 * Checkbox Helpers
 */

export async function toggleCheckbox(page: Page, id: string, checked: boolean) {
  const checkbox = page.locator(`button[id="${id}"]`)
  const currentState = await checkbox.getAttribute('data-state')

  if ((checked && currentState !== 'checked') || (!checked && currentState === 'checked')) {
    await checkbox.click()
  }

  await expect(checkbox).toHaveAttribute('data-state', checked ? 'checked' : 'unchecked')
}

/**
 * Loading State Helpers
 */

export async function waitForLoadingComplete(page: Page) {
  // Wait for any loading text to disappear
  const loadingText = page.locator('text=Loading...')
  try {
    await loadingText.waitFor({ state: 'hidden', timeout: TIMEOUTS.MEDIUM })
  } catch {
    // Already hidden or never appeared
  }
}

/**
 * Console Log Helpers
 */

export function setupConsoleLogCapture(page: Page): string[] {
  const logs: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'log') {
      logs.push(msg.text())
    }
  })
  return logs
}

export function verifyConsoleLog(logs: string[], expectedText: string): boolean {
  return logs.some((log) => log.includes(expectedText))
}
