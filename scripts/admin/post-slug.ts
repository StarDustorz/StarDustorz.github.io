import { slug } from 'github-slugger'

// Match Astro's glob loader, including spaces, punctuation and nested index.md.
export function postSlug(file: string, data: { abbrlink?: string, slug?: string }) {
  return data.abbrlink || data.slug || file.replace(/\.(?:md|mdx)$/, '')
    .split('/')
    .map(segment => slug(segment))
    .join('/')
    .replace(/\/index$/, '')
}
