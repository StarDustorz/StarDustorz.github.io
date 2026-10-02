import type { Language } from '@/i18n/config'

interface Translation {
  title: string
  subtitle: string
  description: string
  posts: string
  tags: string
  gallery: string
  about: string
  toc: string
}

export const ui: Record<Language, Translation> = {
  en: {
    title: 'Draco',
    subtitle: 'Known Unknowns',
    description: 'Notes on technology, reading, and moments of everyday life by StarDust.',
    posts: 'Posts',
    tags: 'Tags',
    gallery: 'Gallery',
    about: 'About',
    toc: 'Table of Contents',
  },
  zh: {
    title: '寻春续昼',
    subtitle: '拨雪寻春 烧灯续昼',
    description: '记录技术、阅读与生活中的光影。',
    posts: '文章',
    tags: '标签',
    gallery: '相册',
    about: '关于',
    toc: '目录',
  },
}
