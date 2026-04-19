export const AVATAR_PALETTE = ['#0284C7', '#D97706', '#16A34A', '#DC2626', '#7C3AED', '#0891B2'];

export function getAvatarColor(username: string): string {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = username.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

export type StatItem = {
  label: string;
  value: number;
};
