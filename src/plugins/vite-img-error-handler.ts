export function viteImgErrorHandler() {
  return {
    name: 'vite-img-error-handler',
    resolveId(id: string) {
      // 检查是否是图片文件且以特定格式命名（可能是缺失的图片）
      if (id.match(/file-\d{17}\.(png|jpg|jpeg|gif|webp)$/)) {
        console.warn(`⚠️  图片文件不存在，已忽略: ${id}`)
        // 返回一个1x1透明PNG的data URL作为占位符
        return '\0virtual:placeholder-image'
      }
      return null
    },
    load(id: string) {
      // 为虚拟的缺失图片模块返回一个1x1透明PNG的data URL
      if (id === '\0virtual:placeholder-image') {
        // 1x1透明PNG的base64编码
        const transparentPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        return `export default "${transparentPng}"`
      }
      return null
    }
  }
} 