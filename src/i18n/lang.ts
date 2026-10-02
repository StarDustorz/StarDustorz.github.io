import type { Language } from '@/i18n/config'
import { base, defaultLocale, moreLocales } from '@/config'
import { langMap } from '@/i18n/config'

/**
 * Get the short language code for the `[...lang]` route parameter
 *
 * @param lang Current language code (e.g. 'en')
 * @returns Route parameter value (e.g. 'en') or undefined (root path '/')
 */
export function getLangRouteParam(lang: Language): string | undefined {
  return lang === defaultLocale ? undefined : lang
}

/**
 * Get the corresponding short language code from the complete current locale value
 *
 * @param locale Current locale value (e.g. 'en-US')
 * @returns Corresponding language code (e.g. 'en') or default locale
 */
export function getLangFromLocale(locale: string | undefined): Language {
  if (!locale) {
    return defaultLocale
  }

  const match = Object.entries(langMap).find(([, codes]) =>
    (codes as readonly string[]).includes(locale),
  )
  return (match?.[0] ?? defaultLocale) as Language
}

/**
 * Get the language code from the current path
 *
 * @param path Current page path
 * @returns Language code detected from path or default locale
 */
export function getLangFromPath(path: string): Language {
  const pathWithoutBase = base && path.startsWith(base)
    ? path.slice(base.length)
    : path

  return moreLocales.find(lang => pathWithoutBase.startsWith(`/${lang}/`)) ?? defaultLocale
}
