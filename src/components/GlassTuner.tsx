"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { Check, Copy, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import styles from "./GlassTuner.module.css";

export const GLASS_TUNER_STORAGE_KEY = "midea-home-glass-tuner";

export type GlassTunerSettings = {
  frameColor: string;
  surfaceColor: string;
  frameOpacity: number;
  surfaceOpacity: number;
  controlOpacity: number;
  blur: number;
  saturation: number;
  overlayOpacity: number;
};

export const DEFAULT_GLASS_TUNER_SETTINGS: GlassTunerSettings = {
  frameColor: "#f0f5f7",
  surfaceColor: "#ffffff",
  frameOpacity: 0.18,
  surfaceOpacity: 0.18,
  controlOpacity: 0.24,
  blur: 24,
  saturation: 128,
  overlayOpacity: 0.14
};

type GlassTunerProps = {
  resetSettings: () => void;
  setSettings: Dispatch<SetStateAction<GlassTunerSettings>>;
  settings: GlassTunerSettings;
  triggerClassName: string;
};

type ColorControlProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

type RangeControlProps = {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  suffix?: string;
  value: number;
};

export function useGlassTunerSettings() {
  const [settings, setSettings] = useState(DEFAULT_GLASS_TUNER_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(GLASS_TUNER_STORAGE_KEY);
      if (stored) {
        setSettings(normalizeSettings(JSON.parse(stored) as Partial<GlassTunerSettings>));
      }
    } catch {
      window.localStorage.removeItem(GLASS_TUNER_STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(GLASS_TUNER_STORAGE_KEY, JSON.stringify(settings));
    }
  }, [loaded, settings]);

  const resetSettings = () => {
    setSettings(DEFAULT_GLASS_TUNER_SETTINGS);
  };

  return { resetSettings, setSettings, settings };
}

export function getGlassTunerStyle(settings: GlassTunerSettings): CSSProperties {
  return {
    "--home-frame-rgb": hexToRgbTuple(settings.frameColor),
    "--home-surface-rgb": hexToRgbTuple(settings.surfaceColor),
    "--home-frame-opacity": String(settings.frameOpacity),
    "--home-surface-opacity": String(settings.surfaceOpacity),
    "--home-control-opacity": String(settings.controlOpacity),
    "--home-glass-blur": settings.blur + "px",
    "--home-glass-saturation": settings.saturation + "%",
    "--home-overlay-opacity": String(settings.overlayOpacity)
  } as CSSProperties;
}

export function serializeGlassTunerSettings(settings: GlassTunerSettings) {
  return [
    "frameColor=" + settings.frameColor,
    "surfaceColor=" + settings.surfaceColor,
    "frameOpacity=" + settings.frameOpacity.toFixed(2),
    "surfaceOpacity=" + settings.surfaceOpacity.toFixed(2),
    "controlOpacity=" + settings.controlOpacity.toFixed(2),
    "blur=" + settings.blur + "px",
    "saturation=" + settings.saturation + "%",
    "overlayOpacity=" + settings.overlayOpacity.toFixed(2)
  ].join("; ");
}

export function GlassTuner({
  resetSettings,
  setSettings,
  settings,
  triggerClassName
}: GlassTunerProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const serializedSettings = serializeGlassTunerSettings(settings);

  const updateSetting = <Key extends keyof GlassTunerSettings>(
    key: Key,
    value: GlassTunerSettings[Key]
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const copySettings = async () => {
    let copySucceeded = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(serializedSettings);
        copySucceeded = true;
      }
    } catch {
      copySucceeded = false;
    }

    if (!copySucceeded) {
      copySucceeded = copyWithTemporaryInput(serializedSettings);
    }
    if (!copySucceeded) {
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={styles.root}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className={triggerClassName}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <SlidersHorizontal size={18} />
        <span>玻璃参数</span>
      </button>

      {open ? (
        <aside aria-label="毛玻璃参数调节" className={styles.panel}>
          <header className={styles.header}>
            <div>
              <span>TEMP</span>
              <strong>毛玻璃参数</strong>
            </div>
            <button
              aria-label="关闭毛玻璃参数"
              className={styles.iconButton}
              onClick={() => setOpen(false)}
              type="button"
            >
              <X size={17} />
            </button>
          </header>

          <div className={styles.colorGrid}>
            <ColorControl
              label="主窗玻璃色"
              onChange={(value) => updateSetting("frameColor", value)}
              value={settings.frameColor}
            />
            <ColorControl
              label="内层玻璃色"
              onChange={(value) => updateSetting("surfaceColor", value)}
              value={settings.surfaceColor}
            />
          </div>

          <div className={styles.rangeList}>
            <RangeControl
              label="主窗透明度"
              max={0.7}
              min={0}
              onChange={(value) => updateSetting("frameOpacity", value)}
              step={0.01}
              value={settings.frameOpacity}
            />
            <RangeControl
              label="卡片透明度"
              max={0.8}
              min={0}
              onChange={(value) => updateSetting("surfaceOpacity", value)}
              step={0.01}
              value={settings.surfaceOpacity}
            />
            <RangeControl
              label="控件透明度"
              max={0.9}
              min={0}
              onChange={(value) => updateSetting("controlOpacity", value)}
              step={0.01}
              value={settings.controlOpacity}
            />
            <RangeControl
              label="模糊强度"
              max={48}
              min={0}
              onChange={(value) => updateSetting("blur", value)}
              step={1}
              suffix="px"
              value={settings.blur}
            />
            <RangeControl
              label="色彩饱和度"
              max={180}
              min={60}
              onChange={(value) => updateSetting("saturation", value)}
              step={1}
              suffix="%"
              value={settings.saturation}
            />
            <RangeControl
              label="底图遮罩"
              max={0.5}
              min={0}
              onChange={(value) => updateSetting("overlayOpacity", value)}
              step={0.01}
              value={settings.overlayOpacity}
            />
          </div>

          <code className={styles.values}>{serializedSettings}</code>

          <div className={styles.actions}>
            <button onClick={resetSettings} type="button">
              <RotateCcw size={15} />
              恢复默认
            </button>
            <button className={styles.copyButton} onClick={copySettings} type="button">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "已复制" : "复制参数"}
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function ColorControl({ label, onChange, value }: ColorControlProps) {
  return (
    <label className={styles.colorControl}>
      <span>{label}</span>
      <span className={styles.colorValue}>
        <input
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={value}
        />
        <output>{value.toUpperCase()}</output>
      </span>
    </label>
  );
}

function RangeControl({
  label,
  max,
  min,
  onChange,
  step,
  suffix = "",
  value
}: RangeControlProps) {
  return (
    <label className={styles.rangeControl}>
      <span>{label}</span>
      <input
        aria-label={label}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
      <output>
        {step < 1 ? value.toFixed(2) : value}
        {suffix}
      </output>
    </label>
  );
}

function normalizeSettings(input: Partial<GlassTunerSettings>): GlassTunerSettings {
  return {
    frameColor: normalizeColor(input.frameColor, DEFAULT_GLASS_TUNER_SETTINGS.frameColor),
    surfaceColor: normalizeColor(input.surfaceColor, DEFAULT_GLASS_TUNER_SETTINGS.surfaceColor),
    frameOpacity: normalizeNumber(input.frameOpacity, 0, 0.7, DEFAULT_GLASS_TUNER_SETTINGS.frameOpacity),
    surfaceOpacity: normalizeNumber(
      input.surfaceOpacity,
      0,
      0.8,
      DEFAULT_GLASS_TUNER_SETTINGS.surfaceOpacity
    ),
    controlOpacity: normalizeNumber(
      input.controlOpacity,
      0,
      0.9,
      DEFAULT_GLASS_TUNER_SETTINGS.controlOpacity
    ),
    blur: normalizeNumber(input.blur, 0, 48, DEFAULT_GLASS_TUNER_SETTINGS.blur),
    saturation: normalizeNumber(
      input.saturation,
      60,
      180,
      DEFAULT_GLASS_TUNER_SETTINGS.saturation
    ),
    overlayOpacity: normalizeNumber(
      input.overlayOpacity,
      0,
      0.5,
      DEFAULT_GLASS_TUNER_SETTINGS.overlayOpacity
    )
  };
}

function normalizeColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function normalizeNumber(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function copyWithTemporaryInput(value: string) {
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  return copied;
}

function hexToRgbTuple(hex: string) {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16)
  ].join(", ");
}
