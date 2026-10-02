import { z } from 'astro/zod'
import { allLocales, themeConfig } from '../config'

export const postSchema = z.object({
  title: z.string().trim().min(1),
  published: z.coerce.date(),
  description: z.string().optional().default(''),
  updated: z.preprocess(val => val === '' ? undefined : val, z.coerce.date().optional()),
  tags: z.array(z.string()).optional().default([]),
  draft: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
  pin: z.number().int().min(0).max(99).optional().default(0),
  toc: z.boolean().optional().default(themeConfig.global.toc),
  lang: z.enum(['', ...allLocales]).optional().default(''),
  abbrlink: z.string().optional().default('').refine(
    abbrlink => !abbrlink || /^[a-z0-9-]*$/.test(abbrlink),
    { message: '短链接只能包含小写字母、数字和连字符' },
  ),
})
