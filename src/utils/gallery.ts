import type { Language } from '@/i18n/config'
import { getCollection } from 'astro:content'
import { isVisible, privatePreview } from '@/utils/content-access'

export async function getAlbums(lang?: Language) {
  const entries = await getCollection('albums', ({ data }) => isVisible(data)
    && (!lang || !data.lang || data.lang === lang))
  if (new Set(entries.map(entry => entry.data.slug)).size !== entries.length)
    throw new Error('相册标识重复')
  const albums = entries.map((entry) => {
    const photos = entry.data.photos
      .filter(photo => privatePreview || !photo.hidden)
      .map(photo => ({ ...photo, thumbnail: photo.src, full: photo.src }))
    return {
      ...entry.data,
      photos,
      coverPhoto: photos.find(photo => photo.id === entry.data.cover) ?? photos[0],
    }
  })
  return albums.filter(album => privatePreview || album.photos.length > 0)
    .sort((a, b) => b.order - a.order || Date.parse(b.published) - Date.parse(a.published))
}
