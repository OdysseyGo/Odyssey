export type AvatarSelectionModalProps = {
  visible: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  onAvatarSaved: (url: string) => void;
};

/**
 * DiceBear styles available via their HTTP API.
 * See: https://www.dicebear.com/how-to-use/http-api/
 */
export const DICEBEAR_STYLES = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'avataaars-neutral',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'bottts-neutral',
  'croodles',
  'croodles-neutral',
  'dylan',
  'fun-emoji',
  'glass',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'notionists',
  'notionists-neutral',
  'open-peeps',
  'personas',
  'pixel-art',
  'pixel-art-neutral',
  'rings',
  'shapes',
  'thumbs',
] as const;

export type DiceBearStyle = (typeof DICEBEAR_STYLES)[number];

export const DICEBEAR_BASE = 'https://api.dicebear.com/9.x';

export const buildAvatarUrl = (style: DiceBearStyle, seed: number): string =>
  `${DICEBEAR_BASE}/${style}/png?seed=${seed}&size=200`;
