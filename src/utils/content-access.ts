import type { Visibility } from './visibility'
import process from 'node:process'
import { isPublic } from './visibility'

// Private preview is only enabled in a guarded, loopback-only dev process.
export const privatePreview = import.meta.env.DEV && process.env.STARDUST_PREVIEW === '1'

export function isVisible(data: Visibility): boolean {
  return privatePreview || isPublic(data)
}
