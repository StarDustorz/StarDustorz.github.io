// Global Language Map
export const langMap: Record<string, string[]> = {
  'en': ['en-US'],
  'zh': ['zh-CN'],
}

// Waline Language Map
// https://waline.js.org/en/guide/features/i18n.html
export const walineLocaleMap: Record<string, string> = {
  'en': 'en-US',
  'zh': 'zh-CN',
}

// Giscus Language Map
// https://giscus.app/
export const giscusLocaleMap: Record<string, string> = {
  'en': 'en',
  'zh': 'zh-CN',
}

// Supported Languages
export const supportedLangs = Object.keys(langMap).flat()
