import type { CollectionEntry } from 'astro:content'
import type { Language } from '@/i18n/config'
import type { Post } from '@/types'
import { getCollection, render } from 'astro:content'
import { defaultLocale } from '@/config'
import { memoize } from '@/utils/cache'

const metaCache = new Map<string, { minutes: number }>()
const TAG_PATH_SEPARATOR = '/'

export interface TagNode {
  name: string
  path: string[]
  count: number
  children: TagNode[]
}

function normalizeTagPath(tags: string[] | undefined): string[] {
  return (tags ?? [])
    .filter((tag): tag is string => typeof tag === 'string')
    .map(tag => tag.trim())
    .filter(Boolean)
}

function pathToKey(path: string[]): string {
  return path.join(TAG_PATH_SEPARATOR)
}

function isPathPrefix(prefix: string[], full: string[]): boolean {
  if (prefix.length > full.length)
    return false
  return prefix.every((seg, idx) => seg === full[idx])
}

/**
 * Add metadata including reading time to a post
 *
 * @param post The post to enhance with metadata
 * @returns Enhanced post with reading time information
 */
async function addMetaToPost(post: CollectionEntry<'posts'>): Promise<Post> {
  const cacheKey = `${post.id}-${post.data.lang || 'universal'}`
  const cachedMeta = metaCache.get(cacheKey)
  if (cachedMeta) {
    return {
      ...post,
      remarkPluginFrontmatter: cachedMeta,
    }
  }

  const { remarkPluginFrontmatter } = await render(post)
  const meta = remarkPluginFrontmatter as { minutes: number }
  metaCache.set(cacheKey, meta)

  return {
    ...post,
    remarkPluginFrontmatter: meta,
  }
}

/**
 * Find duplicate post slugs within the same language
 *
 * @param posts Array of blog posts to check
 * @returns Array of descriptive error messages for duplicate slugs
 */
export async function checkPostSlugDuplication(posts: CollectionEntry<'posts'>[]): Promise<string[]> {
  const slugMap = new Map<string, Set<string>>()
  const duplicates: string[] = []

  posts.forEach((post) => {
    const lang = post.data.lang
    const slug = post.data.abbrlink || post.id

    let slugSet = slugMap.get(lang)
    if (!slugSet) {
      slugSet = new Set()
      slugMap.set(lang, slugSet)
    }

    if (!slugSet.has(slug)) {
      slugSet.add(slug)
      return
    }

    if (!lang) {
      duplicates.push(`Duplicate slug "${slug}" found in universal post (applies to all languages)`)
    }
    else {
      duplicates.push(`Duplicate slug "${slug}" found in "${lang}" language post`)
    }
  })

  return duplicates
}

/**
 * Get all posts (including pinned ones, excluding drafts in production)
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Posts filtered by language, enhanced with metadata, sorted by date
 */
async function _getPosts(lang?: Language) {
  const currentLang = lang || defaultLocale

  const filteredPosts = await getCollection(
    'posts',
    ({ data }: CollectionEntry<'posts'>) => {
      // Hide drafts in all environments
      const shouldInclude = !data.draft
      return shouldInclude && (data.lang === currentLang || data.lang === '')
    },
  )

  const enhancedPosts = await Promise.all(filteredPosts.map(addMetaToPost))

  return enhancedPosts.sort((a, b) =>
    b.data.published.valueOf() - a.data.published.valueOf(),
  )
}

export const getPosts = memoize(_getPosts)

/**
 * Get all non-pinned posts
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Regular posts (non-pinned), filtered by language
 */
async function _getRegularPosts(lang?: Language) {
  const posts = await getPosts(lang)
  return posts.filter(post => !post.data.pin)
}

export const getRegularPosts = memoize(_getRegularPosts)

/**
 * Get pinned posts sorted by pin priority
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Pinned posts sorted by pin value in descending order
 */
async function _getPinnedPosts(lang?: Language) {
  const posts = await getPosts(lang)
  return posts
    .filter(post => post.data.pin && post.data.pin > 0)
    .sort((a, b) => (b.data.pin ?? 0) - (a.data.pin ?? 0))
}

export const getPinnedPosts = memoize(_getPinnedPosts)

/**
 * Group posts by year and sort within each year
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Map of posts grouped by year (descending), sorted by date within each year
 */
async function _getPostsByYear(lang?: Language): Promise<Map<number, Post[]>> {
  const posts = await getRegularPosts(lang)
  const yearMap = new Map<number, Post[]>()

  posts.forEach((post: Post) => {
    const year = post.data.published.getFullYear()
    let yearPosts = yearMap.get(year)
    if (!yearPosts) {
      yearPosts = []
      yearMap.set(year, yearPosts)
    }
    yearPosts.push(post)
  })

  // Sort posts within each year by date
  yearMap.forEach((yearPosts) => {
    yearPosts.sort((a, b) => {
      const aDate = a.data.published
      const bDate = b.data.published
      return bDate.getMonth() - aDate.getMonth() || bDate.getDate() - aDate.getDate()
    })
  })

  return new Map([...yearMap.entries()].sort((a, b) => b[0] - a[0]))
}

export const getPostsByYear = memoize(_getPostsByYear)

/**
 * Group posts by their tags
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Map where keys are tag names and values are arrays of posts with that tag
 */
async function _getPostsGroupByTags(lang?: Language) {
  const posts = await getPosts(lang)
  const tagMap = new Map<string, Post[]>()

  posts.forEach((post: Post) => {
    post.data.tags?.forEach((tag: string) => {
      let tagPosts = tagMap.get(tag)
      if (!tagPosts) {
        tagPosts = []
        tagMap.set(tag, tagPosts)
      }
      tagPosts.push(post)
    })
  })

  return tagMap
}

export const getPostsGroupByTags = memoize(_getPostsGroupByTags)

/**
 * Build hierarchical tag tree from post frontmatter tags.
 * Example:
 * tags:
 *   - Golang
 *   - Go关键字
 */
async function _getTagTree(lang?: Language): Promise<TagNode[]> {
  const posts = await getPosts(lang)
  const countMap = new Map<string, number>()
  const childrenMap = new Map<string, Set<string>>()

  posts.forEach((post) => {
    const tagPath = normalizeTagPath(post.data.tags)
    if (tagPath.length === 0)
      return

    // Each post contributes count to all ancestor paths.
    for (let i = 0; i < tagPath.length; i += 1) {
      const currentPath = tagPath.slice(0, i + 1)
      const currentKey = pathToKey(currentPath)
      countMap.set(currentKey, (countMap.get(currentKey) ?? 0) + 1)

      if (i > 0) {
        const parentPath = tagPath.slice(0, i)
        const parentKey = pathToKey(parentPath)
        if (!childrenMap.has(parentKey)) {
          childrenMap.set(parentKey, new Set())
        }
        childrenMap.get(parentKey)?.add(currentKey)
      }
    }
  })

  const nodeMap = new Map<string, TagNode>()
  for (const [key, count] of countMap.entries()) {
    const path = key.split(TAG_PATH_SEPARATOR)
    nodeMap.set(key, {
      name: path[path.length - 1],
      path,
      count,
      children: [],
    })
  }

  for (const [parentKey, childKeys] of childrenMap.entries()) {
    const parent = nodeMap.get(parentKey)
    if (!parent)
      continue
    parent.children = Array.from(childKeys)
      .map(childKey => nodeMap.get(childKey))
      .filter((node): node is TagNode => Boolean(node))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }

  return Array.from(nodeMap.values())
    .filter(node => node.path.length === 1)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export const getTagTree = memoize(_getTagTree)

/**
 * Get all tags sorted by post count
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Array of tags sorted by popularity (most posts first)
 */
async function _getAllTags(lang?: Language) {
  const tagMap = await getPostsGroupByTags(lang)
  const tagsWithCount = Array.from(tagMap.entries())

  tagsWithCount.sort((a, b) => b[1].length - a[1].length)
  return tagsWithCount.map(([tag]) => tag)
}

export const getAllTags = memoize(_getAllTags)

/**
 * Get all posts that contain a specific tag
 *
 * @param tag The tag name to filter posts by
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Array of posts that contain the specified tag
 */
async function _getPostsByTag(tag: string, lang?: Language) {
  return _getPostsByTagPath([tag], lang, false)
}

export const getPostsByTag = memoize(_getPostsByTag)

/**
 * Get all posts that match a tag path.
 *
 * @param tagPath Hierarchical tag path, e.g. ['Golang', 'Go关键字']
 * @param lang The language code to filter by
 * @param includeDescendants Whether to include descendant tag paths
 */
async function _getPostsByTagPath(tagPath: string[], lang?: Language, includeDescendants = true) {
  const posts = await getPosts(lang)
  const normalizedPath = normalizeTagPath(tagPath)
  if (normalizedPath.length === 0)
    return []

  return posts.filter((post) => {
    const postTagPath = normalizeTagPath(post.data.tags)
    if (postTagPath.length === 0)
      return false

    if (includeDescendants) {
      return isPathPrefix(normalizedPath, postTagPath)
    }

    return postTagPath.length === normalizedPath.length
      && isPathPrefix(normalizedPath, postTagPath)
  })
}

export const getPostsByTagPath = memoize(_getPostsByTagPath)

/**
 * Check which languages support a specific tag
 *
 * @param tag The tag name to check language support for
 * @returns Array of language codes that support the specified tag
 */
async function _getTagSupportedLangs(tag: string | string[]): Promise<Language[]> {
  const posts = await getCollection(
    'posts',
    ({ data }) => !data.draft,
  )
  const { allLocales } = await import('@/config')
  const tagPath = Array.isArray(tag)
    ? normalizeTagPath(tag)
    : normalizeTagPath([tag])

  return allLocales.filter(locale =>
    posts.some(post =>
      isPathPrefix(tagPath, normalizeTagPath(post.data.tags))
      && (post.data.lang === locale || post.data.lang === ''),
    ),
  )
}

export const getTagSupportedLangs = memoize(_getTagSupportedLangs)
