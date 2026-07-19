export const IMAGE_MODEL_OPTIONS = [
  { id: "openai", label: "OpenAI GPT Image", modelLabel: "GPT Image" },
  { id: "doubao", label: "豆包 Seedream 5.0 Lite", modelLabel: "Seedream 5.0 Lite" }
] as const;

export type ImageModelChoice = (typeof IMAGE_MODEL_OPTIONS)[number]["id"];

export const DEFAULT_IMAGE_MODEL_CHOICE: ImageModelChoice = "openai";

export function isImageModelChoice(value: unknown): value is ImageModelChoice {
  return value === "openai" || value === "doubao";
}

export function parseImageModelChoice(value: unknown): ImageModelChoice {
  return isImageModelChoice(value) ? value : DEFAULT_IMAGE_MODEL_CHOICE;
}

export function getImageModelOption(choice: ImageModelChoice) {
  return IMAGE_MODEL_OPTIONS.find((option) => option.id === choice) ?? IMAGE_MODEL_OPTIONS[0];
}

export function inferImageModelChoice(model: string): ImageModelChoice {
  const normalized = model.toLowerCase();
  return normalized.includes("seedream") || normalized.startsWith("doubao-")
    ? "doubao"
    : "openai";
}
