export type StudioBackgroundPreset = {
  id: string;
  label: string;
  url: string;
};

export const STUDIO_BACKGROUND_STORAGE_KEY = "midea-studio-background";

export const STUDIO_BACKGROUNDS: StudioBackgroundPreset[] = [
  {
    id: "neutral",
    label: "浅色建筑",
    url: "/home/studio-background-neutral.webp"
  },
  {
    id: "warm",
    label: "暖光建筑",
    url: "/home/studio-background-warm.webp"
  },
  {
    id: "blue",
    label: "Midea 蓝",
    url: "/home/studio-background-blue.webp"
  }
];

export const DEFAULT_STUDIO_BACKGROUND = STUDIO_BACKGROUNDS[0].url;

export function isStudioBackgroundUrl(value: string | null): value is string {
  return STUDIO_BACKGROUNDS.some((background) => background.url === value) ||
    (typeof value === "string" && value.length <= 2_800_000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value));
}
