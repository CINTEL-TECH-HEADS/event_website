// lib/image.ts
//
// Serve a photo through Next's image optimizer instead of the original file:
// resized to `width` and sent as WebP/AVIF, cached by Vercel. The club photos
// in /public/club are ~200-300 KB each and posters can be up to 5 MB; cards
// and the sphere never need that. Works for our own /public files and for
// Supabase Storage URLs (allowed by images.remotePatterns in next.config.js).
// Widths must be one of Next's deviceSizes; quality 75 is Next's default.

export type ImageWidth = 640 | 828 | 1080 | 1200 | 1920

export function optimizedImage(src: string, width?: ImageWidth): string
export function optimizedImage(src: string | null | undefined, width?: ImageWidth): string | undefined
export function optimizedImage(src: string | null | undefined, width: ImageWidth = 828): string | undefined {
  if (!src) return undefined
  // Already in-memory (previews, generated tiles): nothing to optimize.
  if (src.startsWith('data:') || src.startsWith('blob:')) return src
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`
}
