export interface Visibility {
  draft?: boolean
  hidden?: boolean
}

export function contentStatus(data: Visibility): 'draft' | 'hidden' | 'public' {
  return data.draft ? 'draft' : data.hidden ? 'hidden' : 'public'
}

export function isPublic(data: Visibility): boolean {
  return contentStatus(data) === 'public'
}
