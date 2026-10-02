import { isPublic } from './visibility'

interface Entry { id: string, data: { tags: string[], published: Date | string, draft?: boolean, hidden?: boolean, lang?: string } }

export function postSeries<T extends Entry>(current: T, posts: T[], lang: string) {
  const visible = posts.filter(post => isPublic(post.data) && (!post.data.lang || post.data.lang === lang))
  // Prefer the last (usually more specific) tag with another published article.
  const tagIndex = current.data.tags.findLastIndex(tag => visible.some(post => post.id !== current.id && post.data.tags.includes(tag)))
  const selectedIndex = tagIndex >= 0 ? tagIndex : 0
  const tag = current.data.tags[selectedIndex]
  const tagPath = tag ? current.data.tags.slice(0, selectedIndex + 1) : []
  const entries = tag ? visible.filter(post => post.data.tags.includes(tag)) : []
  entries.sort((a, b) => new Date(b.data.published).valueOf() - new Date(a.data.published).valueOf() || a.id.localeCompare(b.id))
  return { tag, tagPath, entries }
}
