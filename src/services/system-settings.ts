import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

/** The system-wide target market; every generated artifact is labeled with it. */
export type SystemSettings = {
  country: string;
  language: string;
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  country: "Mexico",
  language: "Spanish"
};

export type SystemSettingsStore = {
  read(): Promise<SystemSettings>;
  save(settings: SystemSettings): Promise<SystemSettings>;
};

export function createSystemSettingsStore(options: { dataDir: string }): SystemSettingsStore {
  const dataDir = resolve(options.dataDir);
  const settingsPath = join(dataDir, "settings.json");

  return {
    async read() {
      try {
        const parsed = JSON.parse(await readFile(settingsPath, "utf8"));
        return {
          country: String(parsed.country ?? DEFAULT_SYSTEM_SETTINGS.country),
          language: String(parsed.language ?? DEFAULT_SYSTEM_SETTINGS.language)
        };
      } catch {
        return { ...DEFAULT_SYSTEM_SETTINGS };
      }
    },

    async save(settings) {
      await mkdir(dataDir, { recursive: true });
      const normalized = {
        country: settings.country.trim() || DEFAULT_SYSTEM_SETTINGS.country,
        language: settings.language.trim() || DEFAULT_SYSTEM_SETTINGS.language
      };
      await writeFile(settingsPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
      return normalized;
    }
  };
}

export function createDefaultSystemSettingsStore(): SystemSettingsStore {
  return createSystemSettingsStore({ dataDir: join(process.cwd(), "data") });
}
