import { createHash } from 'node:crypto'
import MarkdownIt from 'markdown-it'
import { safeMediaURL } from '../../src/utils/photo'
import { parsePhotoMarkup } from '../../src/utils/photo-markup'
import { getPost, listAlbums, listPosts } from './store'

export async function mediaLibrary() {
  type Photo = NonNullable<ReturnType<typeof parsePhotoMarkup>>
  interface Usage { kind: 'post' | 'album', id: string, title: string, status: string }
  const resources = new Map<string, Omit<Photo, 'id' | 'hidden'> & { key: string, uses: Usage[] }>()
  const add = (photo: Partial<Photo>, use: Usage) => {
    const src = safeMediaURL(photo.src)
    if (!src)
      return
    const previous = resources.get(src)
    if (previous) {
      if (!previous.uses.some(usage => usage.kind === use.kind && usage.id === use.id && usage.status === use.status))
        previous.uses.push(use)
      previous.live ||= photo.live || ''
      previous.width ||= photo.width
      previous.height ||= photo.height
      previous.metadata = { ...photo.metadata, ...previous.metadata }
      return
    }
    resources.set(src, {
      key: createHash('sha256').update(src).digest('hex').slice(0, 24),
      src,
      title: photo.title || '',
      description: photo.description || '',
      alt: photo.alt || photo.title || '',
      taken: photo.taken || '',
      live: safeMediaURL(photo.live),
      metadata: photo.metadata || {},
      width: photo.width,
      height: photo.height,
      uses: [use],
    })
  }
  for (const album of await listAlbums()) {
    for (const photo of album.data.photos)
      add(photo, { kind: 'album', id: album.id, title: album.data.title, status: photo.hidden ? 'hidden' : album.status })
  }
  const parser = new MarkdownIt()
  for (const entry of await listPosts()) {
    if (!('data' in entry))
      continue
    const post = await getPost(entry.id)
    const use: Usage = { kind: 'post', id: post.id, title: post.data.title, status: post.status }
    for (const token of parser.parse(post.body, {})) {
      if (token.type !== 'inline')
        continue
      for (const line of token.content.split('\n')) {
        const photo = parsePhotoMarkup(line)
        if (photo)
          add(photo, use)
      }
      for (const child of token.children || []) {
        if (child.type === 'image')
          add({ src: child.attrGet('src') || '', title: child.content, alt: child.content }, use)
      }
    }
  }
  return [...resources.values()]
}
