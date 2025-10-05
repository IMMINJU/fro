/**
 * Field Translation Utilities
 * Helper functions for translating field names in validation errors
 */

/**
 * Translates field names using a translation map and translator function
 *
 * @param fields - Array of field names to translate
 * @param translationMap - Map of field names to translation keys
 * @param translate - Translation function that takes a key and returns translated string
 * @returns Comma-separated string of translated field names
 *
 * @example
 * ```typescript
 * const translated = translateFieldNames(
 *   ['regionList', 'name'],
 *   { regionList: 'regions', name: 'name' },
 *   (key) => t(key)
 * )
 * // Returns: "Regions, Name"
 * ```
 */
export function translateFieldNames(
  fields: string[],
  translationMap: Record<string, string> | undefined,
  translate: (key: string) => string,
): string {
  return fields
    .map(field => {
      // Use provided translationMap if available
      if (translationMap) {
        const translationKey = translationMap[field]
        if (translationKey) {
          try {
            return translate(translationKey)
          } catch {
            // Fallback to original field name if translation fails
            return field
          }
        }
      }
      // Return original field name if no translation found
      return field
    })
    .join(', ')
}
