import { isPublic } from './visibility'

export function relatedPosts<T extends { id: string, data: { tags: string[], published: Date | string, draft?: boolean, hidden?: boolean, lang?: string } }>(current: T, posts: T[], lang: string) {
  const tags = new Set(current.data.tags)
  return posts.filter(post => post.id !== current.id && isPublic(post.data) && (!post.data.lang || post.data.lang === lang))
    .map(post => ({ post, score: post.data.tags.filter(tag => tags.has(tag)).length }))
    .filter(value => value.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.post.data.published).valueOf() - new Date(a.post.data.published).valueOf())
    .slice(0, 3)
    .map(value => value.post)
}
