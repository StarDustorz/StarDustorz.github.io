import { visit } from 'unist-util-visit'

export function rehypePhotoRows() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (!node.properties?.className?.includes('photo-row'))
        return
      const figures = node.children.filter(child => child.type !== 'text' || child.value.trim())
      if (!figures.length || figures.some(child => child.tagName !== 'figure'))
        return
      const columns = Math.max(1, Math.min(4, Number(node.properties['data-columns']) || 4))
      const rows = []
      for (let index = 0; index < figures.length; index += columns) {
        rows.push({ type: 'element', tagName: 'div', properties: { className: ['photo-row-line'] }, children: figures.slice(index, index + columns) })
      }
      node.children = rows
    })
  }
}
