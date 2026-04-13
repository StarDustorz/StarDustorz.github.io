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
    title: 'Retypeset',
    subtitle: 'Revive the beauty of typography',
    description: 'Retypeset is a static blog theme based on the Astro framework. Inspired by Typography, Retypeset establishes a new visual standard and reimagines the layout of all pages, creating a reading experience reminiscent of paper books, reviving the beauty of typography. Details in every sight, elegance in every space.',
    posts: 'Posts',
    tags: 'Tags',
    about: 'About',
    toc: 'Table of Contents',
  },
  zh: {
    title: '重新编排',
    subtitle: '再现版式之美',
    description: 'Retypeset是一款基于Astro框架的静态博客主题，中文名为重新编排。本主题以活版印字为设计灵感，通过建立全新的视觉规范，对所有页面进行重新编排，打造纸质书页般的阅读体验，再现版式之美。所见皆为细节，方寸尽显优雅。',
    posts: '文章',
    tags: '标签',
    about: '关于',
    toc: '目录',
  },
}
