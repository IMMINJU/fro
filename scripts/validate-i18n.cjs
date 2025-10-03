/**
 * i18n Translation Validation Script
 * Validates that all translation files have the same keys
 */

const fs = require('fs')
const path = require('path')

const MESSAGES_DIR = path.join(__dirname, '../messages')
const LOCALES = ['en', 'ko', 'ja']

function loadTranslations(locale) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`)
  const content = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(content)
}

function getAllKeys(obj, prefix = '') {
  let keys = []

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

function validateTranslations() {
  console.log('🌐 Validating i18n translations...\n')

  const translations = {}
  const allKeys = {}

  // Load all translations
  for (const locale of LOCALES) {
    translations[locale] = loadTranslations(locale)
    allKeys[locale] = new Set(getAllKeys(translations[locale]))
    console.log(`✓ Loaded ${locale}: ${allKeys[locale].size} keys`)
  }

  console.log('\n📊 Validation Results:\n')

  let hasErrors = false

  // Compare keys between locales
  const baseLocale = 'en'
  const baseKeys = allKeys[baseLocale]

  for (const locale of LOCALES) {
    if (locale === baseLocale) continue

    const currentKeys = allKeys[locale]

    // Find missing keys
    const missingKeys = [...baseKeys].filter(key => !currentKeys.has(key))

    // Find extra keys
    const extraKeys = [...currentKeys].filter(key => !baseKeys.has(key))

    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`✅ ${locale}: Perfect match with ${baseLocale}`)
    } else {
      hasErrors = true
      console.log(`❌ ${locale}: Found discrepancies`)

      if (missingKeys.length > 0) {
        console.log(`\n  Missing keys (${missingKeys.length}):`)
        missingKeys.forEach(key => console.log(`    - ${key}`))
      }

      if (extraKeys.length > 0) {
        console.log(`\n  Extra keys (${extraKeys.length}):`)
        extraKeys.forEach(key => console.log(`    + ${key}`))
      }

      console.log('')
    }
  }

  // Check for empty values
  console.log('\n🔍 Checking for empty values:\n')

  for (const locale of LOCALES) {
    const keys = getAllKeys(translations[locale])
    const emptyKeys = keys.filter(key => {
      const parts = key.split('.')
      let value = translations[locale]
      for (const part of parts) {
        value = value[part]
      }
      return !value || value.trim() === ''
    })

    if (emptyKeys.length === 0) {
      console.log(`✅ ${locale}: No empty values`)
    } else {
      hasErrors = true
      console.log(`⚠️  ${locale}: Found ${emptyKeys.length} empty value(s)`)
      emptyKeys.forEach(key => console.log(`    - ${key}`))
    }
  }

  console.log('\n' + '='.repeat(50) + '\n')

  if (hasErrors) {
    console.log('❌ Validation failed! Please fix the issues above.\n')
    process.exit(1)
  } else {
    console.log('✅ All translations are valid!\n')
    process.exit(0)
  }
}

// Run validation
validateTranslations()
