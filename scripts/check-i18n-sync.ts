/**
 * i18n Sync Checker
 * Validates that all locales have the same translation keys
 * Run: npm run i18n:check
 */

import fs from 'fs'
import path from 'path'

const MESSAGES_DIR = path.join(process.cwd(), 'messages')
const LOCALES = ['en', 'ko', 'ja']

type JsonValue = string | number | boolean | null | JsonObject | JsonArray
interface JsonObject {
  [key: string]: JsonValue
}
type JsonArray = JsonValue[]

/**
 * Get all keys from nested object (flattened)
 */
function getAllKeys(obj: JsonObject, prefix = ''): Set<string> {
  const keys = new Set<string>()

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nestedKeys = getAllKeys(value as JsonObject, fullKey)
      nestedKeys.forEach(k => keys.add(k))
    } else {
      keys.add(fullKey)
    }
  }

  return keys
}

/**
 * Check a single namespace across all locales
 */
function checkNamespace(namespacePath: string, namespaceName: string): boolean {
  const localeKeys: Record<string, Set<string>> = {}

  // Load all locale files
  for (const locale of LOCALES) {
    const filePath = path.join(namespacePath, `${locale}.json`)

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing file: ${filePath}`)
      return false
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const json = JSON.parse(content) as JsonObject
    localeKeys[locale] = getAllKeys(json)
  }

  // Use 'en' as reference
  const referenceKeys = localeKeys['en']
  let hasErrors = false

  // Check each locale against reference
  for (const locale of LOCALES) {
    if (locale === 'en') continue

    const currentKeys = localeKeys[locale]

    // Find missing keys
    const missing = Array.from(referenceKeys).filter(k => !currentKeys.has(k))
    const extra = Array.from(currentKeys).filter(k => !referenceKeys.has(k))

    if (missing.length > 0) {
      console.error(`\n❌ ${namespaceName} [${locale}] - Missing keys:`)
      missing.forEach(k => console.error(`   - ${k}`))
      hasErrors = true
    }

    if (extra.length > 0) {
      console.error(`\n⚠️  ${namespaceName} [${locale}] - Extra keys (not in 'en'):`)
      extra.forEach(k => console.error(`   - ${k}`))
      hasErrors = true
    }

    if (!hasErrors && missing.length === 0 && extra.length === 0) {
      console.log(`✅ ${namespaceName} [${locale}]: ${currentKeys.size} keys (synced)`)
    }
  }

  return !hasErrors
}

/**
 * Main checker
 */
function checkSync() {
  console.log('🔍 Checking i18n sync across locales...\n')

  let allValid = true

  // Check main namespaces
  const mainNamespaces = ['common', 'cloud']
  for (const namespace of mainNamespaces) {
    const namespacePath = path.join(MESSAGES_DIR, namespace)

    if (!fs.existsSync(namespacePath)) {
      console.warn(`⚠️  Namespace not found: ${namespace}`)
      continue
    }

    const valid = checkNamespace(namespacePath, namespace)
    if (!valid) {
      allValid = false
    }
  }

  // Check shared namespaces
  const sharedPath = path.join(MESSAGES_DIR, 'shared')
  if (fs.existsSync(sharedPath)) {
    const sharedNamespaces = fs.readdirSync(sharedPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const namespace of sharedNamespaces) {
      const namespacePath = path.join(sharedPath, namespace)
      const valid = checkNamespace(namespacePath, `shared/${namespace}`)
      if (!valid) {
        allValid = false
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  if (allValid) {
    console.log('✨ All translations are in sync!')
  } else {
    console.log('❌ Translation sync issues found. Please fix them.')
    process.exit(1)
  }
}

// Run
try {
  checkSync()
} catch (error) {
  console.error('❌ Error checking sync:', error)
  process.exit(1)
}
