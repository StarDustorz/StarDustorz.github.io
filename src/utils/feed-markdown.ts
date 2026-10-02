import MarkdownIt from 'markdown-it'
import { parameterText } from './photo'
import { parsePhotoMarkup } from './photo-markup'

const parser = new MarkdownIt()
const escape = (value: string) => parser.utils.escapeHtml(value)
parser.block.ruler.before('paragraph', 'photo-directive', (state, startLine, _endLine, silent) => {
  const line = state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine])
  const photo = parsePhotoMarkup(line)
  if (!photo)
    return false
  if (silent)
    return true
  const token = state.push('html_block', '', 0)
  token.content = `<figure><a href="${escape(photo.src)}"><img src="${escape(photo.src)}" alt="${escape(photo.alt)}"${photo.width ? ` width="${photo.width}"` : ''}${photo.height ? ` height="${photo.height}"` : ''}></a><figcaption>${escape([photo.title, parameterText(photo.metadata)].filter(Boolean).join(' · '))}${photo.live ? ` <a href="${escape(photo.live)}">Live</a>` : ''}</figcaption></figure>\n`
  state.line = startLine + 1
  return true
}, { alt: ['paragraph'] })
export function renderFeedMarkdown(body: string) {
  // Layout directives have no meaning in an RSS reader; retain their photos.
  const tokens = parser.parse(body, {})
  for (const token of tokens) {
    if (token.type === 'inline') {
      token.children = (token.children || []).filter((child) => {
        if (child.type !== 'text')
          return true
        const marker = child.content.trim()
        if (/^:{3,}(?:photos(?:\{[^}]*\})?|gallery)?$/.test(marker))
          return false
        const fold = marker.match(/^:{3,}fold\[([^\]\n]+)\]$/)
        if (fold)
          child.content = fold[1]
        return true
      })
    }
  }
  return parser.renderer.render(tokens, parser.options, {})
}
