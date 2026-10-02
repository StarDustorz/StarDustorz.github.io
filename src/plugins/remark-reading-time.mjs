export function readingStats(tree) {
  let chinese = 0
  let words = 0
  let code = 0
  let images = 0
  function walk(node) {
    if (node.type === 'code') {
      code += node.value.trim().length
      return
    }
    if (node.type === 'image' || (node.type === 'leafDirective' && node.name === 'photo') || node.data?.hName === 'figure') {
      images++
      return
    }
    if (node.type === 'html' || node.data?.directiveLabel)
      return
    if (node.type === 'text' || node.type === 'inlineCode') {
      chinese += (node.value.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) || []).length
      words += (node.value.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ').match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []).length
    }
    for (const child of node.children || [])
      walk(child)
  }
  walk(tree)
  return { minutes: Math.max(1, Math.ceil(chinese / 350 + words / 200 + code / 600 + images * 3 / 60)), wordCount: chinese + words, imageCount: images }
}

export function remarkReadingTime() {
  return (tree, { data }) => {
    Object.assign(data.astro.frontmatter, readingStats(tree))
  }
}
