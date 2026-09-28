import type { Professional } from './types.js';

type SocialKey = keyof Professional['socials'];

export function socialUrl(key: SocialKey, value: string): string {
  const v = value.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  const handle = encodeURIComponent(v.replace(/^@/, ''));
  const urls: Record<SocialKey, string> = {
    instagram: `https://instagram.com/${handle}`,
    youtube: `https://youtube.com/@${handle}`,
    tiktok: `https://tiktok.com/@${handle}`,
    facebook: `https://facebook.com/${handle}`,
  };
  return urls[key];
}
