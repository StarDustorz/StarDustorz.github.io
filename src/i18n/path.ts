import type { Language } from '@/i18n/config'
import { base, defaultLocale } from '@/config'
import { getLangFromPath } from '@/i18n/lang'

/**
 * Get path to a specific tag page with language support
 *
 * @param tagName Tag name or hierarchical tag path
 * @param lang Current language code
 * @returns Path to tag page
 */
export function getTagPath(tagName: string | string[], lang: Language): string {
  const normalizedTagPath = (Array.isArray(tagName) ? tagName : [tagName])
    .map(seg => seg.trim())
    .filter(Boolean)
  const encodedPath = normalizedTagPath
    .map(seg => encodeURIComponent(seg))
    .join('/')

  const tagPath = lang === defaultLocale
    ? `/tags/${encodedPath}/`
    : `/${lang}/tags/${encodedPath}/`

  return base ? `${base}${tagPath}` : tagPath
}

/**
 * Get path to a specific post page with language support
 *
 * @param slug Post slug
 * @param lang Current language code
 * @returns Path to post page
 */
export function getPostPath(slug: string, lang: Language): string {
  const postPath = lang === defaultLocale
    ? `/posts/${slug}/`
    : `/${lang}/posts/${slug}/`

  return base ? `${base}${postPath}` : postPath
}

/**
 * Generate localized path based on current language
 *
 * @param path Path to localize
 * @param currentLang Current language code
 * @returns Localized path with language prefix
 */
export function getLocalizedPath(path: string, currentLang?: Language) {
  const normalizedPath = path.replace(/^\/|\/$/g, '')
  const lang = currentLang ?? getLangFromPath(path)

  const langPrefix = lang === defaultLocale ? '' : `/${lang}`
  const localizedPath = normalizedPath === ''
    ? `${langPrefix}/`
    : `${langPrefix}/${normalizedPath}${/\.[a-z0-9]+$/i.test(normalizedPath) ? '' : '/'}`

  return base ? `${base}${localizedPath}` : localizedPath
}

/**
 * Build path for next language
 *
 * @param currentPath Current page path
 * @param currentLang Current language code
 * @param nextLang Next language code to switch to
 * @returns Path for next language
 */
export function getNextLangPath(currentPath: string, currentLang: Language, nextLang: Language): string {
  const pathWithoutBase = base && currentPath.startsWith(base)
    ? currentPath.slice(base.length)
    : currentPath

  const pagePath = currentLang === defaultLocale
    ? pathWithoutBase
    : pathWithoutBase.replace(`/${currentLang}`, '')

  return getLocalizedPath(pagePath, nextLang)
}
