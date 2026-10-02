import { z } from 'astro/zod'

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '标识只能包含小写字母、数字和连字符')
export const imageURLSchema = z.url({ error: '请输入完整的 HTTPS 图片链接' }).max(4096).refine((value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
  }
  catch {
    return false
  }
}, '图片必须使用 HTTPS 链接，不能包含账号密码').transform(value => new URL(value).href)

export const photoSchema = z.object({
  id: slugSchema,
  src: imageURLSchema,
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
  title: z.string().max(200).default(''),
  description: z.string().max(5000).default(''),
  alt: z.string().max(500).default(''),
  taken: z.string().default('').refine(value => !value || !Number.isNaN(Date.parse(value)), '拍摄日期无效'),
  live: imageURLSchema.or(z.literal('')).optional(),
  metadata: z.object({
    camera: z.string().max(200).optional(),
    lens: z.string().max(200).optional(),
    focalLength: z.string().max(60).optional(),
    aperture: z.string().max(60).optional(),
    shutter: z.string().max(60).optional(),
    iso: z.string().max(60).optional(),
    exposure: z.string().max(60).optional(),
    location: z.string().max(200).optional(),
  }).optional(),
  hidden: z.boolean().default(false),
})

export const albumSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).default(''),
  published: z.string().refine(value => !Number.isNaN(Date.parse(value)), '相册日期无效'),
  tags: z.array(z.string()).default([]),
  lang: z.enum(['', 'zh', 'en']).default(''),
  draft: z.boolean().default(true),
  hidden: z.boolean().default(false),
  order: z.number().int().default(0),
  cover: z.string().default(''),
  photos: z.array(photoSchema).max(5000).default([]),
}).superRefine((album, ctx) => {
  if (new Set(album.photos.map(photo => photo.id)).size !== album.photos.length)
    ctx.addIssue({ code: 'custom', message: '照片标识不能重复', path: ['photos'] })
})

export type AlbumData = z.infer<typeof albumSchema>
