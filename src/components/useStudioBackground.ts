"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_STUDIO_BACKGROUND,
  isStudioBackgroundUrl,
  STUDIO_BACKGROUND_STORAGE_KEY
} from "./studio-backgrounds";

const BACKGROUND_CHANGE_EVENT = "midea-studio-background-change";

export function useStudioBackground() {
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_STUDIO_BACKGROUND);

  useEffect(() => {
    let storedBackground: string | null = null;
    try { storedBackground = window.localStorage.getItem(STUDIO_BACKGROUND_STORAGE_KEY); } catch { /* Browser storage may be disabled. */ }
    if (isStudioBackgroundUrl(storedBackground)) {
      setBackgroundUrl(storedBackground);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STUDIO_BACKGROUND_STORAGE_KEY && isStudioBackgroundUrl(event.newValue)) {
        setBackgroundUrl(event.newValue);
      }
    };

    const handleLocalChange = (event: Event) => {
      const nextBackground = (event as CustomEvent<string>).detail;
      if (isStudioBackgroundUrl(nextBackground)) {
        setBackgroundUrl(nextBackground);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(BACKGROUND_CHANGE_EVENT, handleLocalChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(BACKGROUND_CHANGE_EVENT, handleLocalChange);
    };
  }, []);

  const selectBackground = useCallback((nextBackground: string) => {
    if (!isStudioBackgroundUrl(nextBackground)) {
      return;
    }

    window.localStorage.setItem(STUDIO_BACKGROUND_STORAGE_KEY, nextBackground);
    setBackgroundUrl(nextBackground);
    window.dispatchEvent(new CustomEvent(BACKGROUND_CHANGE_EVENT, { detail: nextBackground }));
  }, []);

  return { backgroundUrl, selectBackground };
}
