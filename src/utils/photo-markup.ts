import { photoSchema } from '../schemas/album'

const unquote = (text: string) => text.replace(/&#10;|&quot;|&#39;|&lt;|&gt;|&amp;/g, entity => ({ '&#10;': '\n', '&quot;': '"', '&#39;': '\'', '&lt;': '<', '&gt;': '>', '&amp;': '&' })[entity]!)

/** Read only our single-line photo directive; never interpret arbitrary HTML. */
export function parsePhotoMarkup(line: string) {
  const match = /^::photo\{(.*)\}\s*$/.exec(line.trim())
  if (!match)
    return
  const attributes: Record<string, string> = {}
  for (const attribute of match[1].matchAll(/([a-z]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi))
    attributes[attribute[1]] = unquote(attribute[2] ?? attribute[3])
  const metadata = Object.fromEntries(['camera', 'lens', 'focalLength', 'aperture', 'shutter', 'iso', 'exposure', 'location'].filter(key => attributes[key]).map(key => [key, attributes[key]]))
  const parsed = photoSchema.safeParse({
    id: 'media',
    src: attributes.src,
    title: attributes.title || '',
    alt: attributes.alt || attributes.title || '',
    description: attributes.description || '',
    taken: attributes.taken || '',
    live: attributes.live || '',
    metadata,
    ...(attributes.width ? { width: Number(attributes.width) } : {}),
    ...(attributes.height ? { height: Number(attributes.height) } : {}),
  })
  return parsed.success ? parsed.data : undefined
}
