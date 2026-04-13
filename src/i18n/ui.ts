import type { Language } from '@/i18n/config'

interface Translation {
  title: string
  subtitle: string
  description: string
  posts: string
  tags: string
  about: string
  toc: string
}

export const ui: Record<Language, Translation> = {
  en: {
    title: 'Draco',
    subtitle: 'Known Unknowns',
    description: '',
    posts: 'Posts',
    tags: 'Tags',
    about: 'About',
    toc: 'Table of Contents',
  },
  zh: {
    title: '寻春续昼',
    subtitle: '拨雪寻春 烧灯续昼',
    description: '',
    posts: '文章',
    tags: '标签',
    about: '关于',
    toc: '目录',
  },
}
