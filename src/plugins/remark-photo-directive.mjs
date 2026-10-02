import { visit } from 'unist-util-visit'

const keys = ['camera', 'lens', 'focalLength', 'aperture', 'shutter', 'iso', 'exposure', 'location']
function https(value = '') {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''
  }
  catch { return '' }
}
export function remarkPhotoDirective() {
  return (tree) => {
    visit(tree, 'leafDirective', (node) => {
      if (node.name !== 'photo')
        return
      const attributes = node.attributes || {}
      const src = https(attributes.src)
      if (!src)
        throw new Error('photo 指令需要有效的 HTTPS 图片链接')
      const live = https(attributes.live)
      if (attributes.live && !live)
        throw new Error('photo Live 视频必须使用 HTTPS 链接')
      const metadata = Object.fromEntries(keys.filter(key => attributes[key]).map(key => [key, attributes[key]]))
      const title = attributes.title || ''
      const properties = {
        'data-photo-view': '',
        'data-title': title,
        'data-description': attributes.description || '',
        'data-taken': attributes.taken || '',
        'data-metadata': JSON.stringify(metadata),
        'data-live': live,
        'aria-label': `${title || '照片'} · 查看照片`,
      }
      for (const dimension of ['width', 'height']) {
        const value = Number(attributes[dimension])
        if (Number.isInteger(value) && value > 0 && value <= 20000)
          properties[`data-pswp-${dimension}`] = value
      }
      node.type = 'paragraph'
      node.data = { hName: 'figure', hProperties: { className: ['photograph'] } }
      node.children = [
        { type: 'link', url: src, data: { hProperties: properties }, children: [{ type: 'image', url: src, alt: title, data: { hProperties: { loading: 'lazy', decoding: 'async', width: properties['data-pswp-width'], height: properties['data-pswp-height'] } } }] },
        { type: 'text', value: title, data: { hName: 'figcaption', hProperties: { className: ['photo-parameters'] } } },
      ]
      delete node.name
      delete node.attributes
    })
  }
}
