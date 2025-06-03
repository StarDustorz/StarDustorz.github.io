import { visit } from 'unist-util-visit'

export function rehypeImgErrorHandler() {
  return (tree) => {
    const nodesToRemove = []
    
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'img' && node.properties?.src) {
        const src = node.properties.src
        
        // 检查是否是可能缺失的图片文件（特定命名格式）
        if (typeof src === 'string' && src.match(/file-\d{17}\.(png|jpg|jpeg|gif|webp)$/)) {
          console.warn(`⚠️  检测到可能缺失的图片，已移除: ${src}`)
          
          // 标记需要移除的节点
          nodesToRemove.push({ node, index, parent })
        }
      }
    })
    
    // 从后往前移除标记的节点，避免索引问题
    nodesToRemove.reverse().forEach(({ node, index, parent }) => {
      if (parent && Array.isArray(parent.children) && typeof index === 'number') {
        parent.children.splice(index, 1)
      }
    })
  }
} 