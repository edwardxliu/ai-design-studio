"use client";

import { useEffect, useState } from "react";
import { Check, ImagePlus, RotateCcw, UserRoundCog } from "lucide-react";
import { GlassTuner, type useGlassTunerSettings } from "./GlassTuner";
import { EdgeTuner } from "./EdgeTuner";
import { StudioDialog } from "./StudioDialog";
import { DEFAULT_STUDIO_BACKGROUND, STUDIO_BACKGROUNDS } from "./studio-backgrounds";
import { useStudioBackground } from "./useStudioBackground";
import { SYSTEM_SETTINGS_CHANGED } from "@/src/lib/system-settings-events";
import styles from "./StudioSettings.module.css";

type GlassControls = ReturnType<typeof useGlassTunerSettings>;
const countries = ["Mexico", "Brazil", "Saudi Arabia", "United States"];
const languages = ["Spanish", "Portuguese", "English", "Arabic"];
const tabs = ["外观", "玻璃与边框", "默认市场"] as const;

export function StudioSettings({ glass }: { glass: GlassControls }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className={styles.trigger} aria-label="用户设置" title="用户设置" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} type="button"><UserRoundCog size={17} aria-hidden /></button>
    {open ? <SettingsPanel glass={glass} onClose={() => setOpen(false)} /> : null}
  </>;
}

function SettingsPanel({ glass, onClose }: { glass: GlassControls; onClose: () => void }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("外观");
  const { backgroundUrl, selectBackground } = useStudioBackground();
  const [market, setMarket] = useState({ country: "Mexico", language: "Spanish" });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [marketLoadError, setMarketLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadVersion, setLoadVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoaded(false); setMarketLoadError("");
    fetch("/api/settings", { signal: controller.signal }).then(async response => {
      const payload = await response.json();
      if (!response.ok || !payload.settings?.country || !payload.settings?.language) throw new Error(payload.error ?? "无法读取默认市场");
      if (!controller.signal.aborted) { setMarket(payload.settings); setLoaded(true); }
    }).catch(cause => { if (!controller.signal.aborted) setMarketLoadError(cause instanceof Error ? cause.message : "无法读取默认市场"); });
    return () => controller.abort();
  }, [loadVersion]);

  async function saveMarket() {
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(market) });
      const payload = await response.json();
      if (!response.ok || payload.error || !payload.settings?.country || !payload.settings?.language) throw new Error(payload.error ?? "保存失败，请重试");
      window.dispatchEvent(new CustomEvent(SYSTEM_SETTINGS_CHANGED, { detail: payload.settings }));
      setNotice("默认市场已保存，将用于后续生成任务。");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "保存失败，请重试"); }
    finally { setSaving(false); }
  }

  function changeBackground(url: string) {
    try { selectBackground(url); setError(""); setNotice("外观已保存在此浏览器，所有工作页共享。"); }
    catch { setError("浏览器存储空间不足，背景未保存。请换用更小的图片。"); }
  }

  async function uploadBackground(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size === 0 || file.size > 2 * 1024 * 1024) { setError("请选择不超过 2 MB 的 PNG、JPEG 或 WebP 图片。"); return; }
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
      });
      changeBackground(url);
    } catch { setError("背景图片读取失败，请重新选择。"); }
  }

  return <StudioDialog title="用户设置" onClose={onClose} busy={saving}>
    <div role="tablist" aria-label="设置分类" className={styles.tabs}>
      {tabs.map(value => <button role="tab" aria-selected={tab === value} key={value} onClick={() => { setTab(value); setNotice(""); }} type="button">{value}</button>)}
    </div>
    <div role="tabpanel" aria-label={tab} className={styles.panel}>
      {tab === "外观" ? <>
        <div className={styles.sectionTitle}><h3>工作台背景</h3><span>实时生效 · 本机保存</span></div>
        <div className={styles.backgrounds} role="group" aria-label="默认底图">
          {STUDIO_BACKGROUNDS.map(preset => <button aria-label={`使用${preset.label}底图`} aria-pressed={backgroundUrl === preset.url} key={preset.id} onClick={() => changeBackground(preset.url)} type="button">
            {/* eslint-disable-next-line @next/next/no-img-element */}<img src={preset.url} alt="" /><span>{preset.label}{backgroundUrl === preset.url ? <Check size={13} aria-hidden /> : null}</span>
          </button>)}
        </div>
        <div className={styles.actions}><label className={styles.secondary}><ImagePlus size={15} aria-hidden />上传背景<input aria-label="选择工作台背景图片" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void uploadBackground(event.target.files?.[0]); event.target.value = ""; }} /></label>
          <button className={styles.secondary} onClick={() => changeBackground(DEFAULT_STUDIO_BACKGROUND)} type="button"><RotateCcw size={14} aria-hidden />恢复默认底图</button></div>
        <p className={styles.hint}>支持 PNG、JPEG、WebP，最大 2 MB。自定义背景只保存在当前浏览器，不上传到服务器。</p>
        {backgroundUrl.startsWith("data:") ? <p className={styles.hint}>当前使用自定义背景</p> : null}
      </> : tab === "玻璃与边框" ? <div className={styles.tuners}>
        <GlassTuner {...glass} triggerClassName={styles.secondary} embedded />
        <EdgeTuner settings={glass.settings} setSettings={glass.setSettings} triggerClassName={styles.secondary} embedded />
      </div> : <>
        <div className={styles.sectionTitle}><h3>默认生成市场</h3><span>用于后续任务，不改变已有结果</span></div>
        <div className={styles.fields}>
          <label>系统国家<select disabled={!loaded || saving} value={market.country} onChange={event => setMarket(current => ({ ...current, country: event.target.value }))}>{Array.from(new Set([...countries, market.country])).map(value => <option key={value}>{value}</option>)}</select></label>
          <label>系统语言<select disabled={!loaded || saving} value={market.language} onChange={event => setMarket(current => ({ ...current, language: event.target.value }))}>{Array.from(new Set([...languages, market.language])).map(value => <option key={value}>{value}</option>)}</select></label>
        </div>
        <p className={styles.hint}>这里设置生成内容的默认市场；本地化页面的目标语言仍可单独选择，不影响界面语言。</p>
        <div className={styles.actions}><button className={styles.primary} disabled={!loaded || saving} onClick={saveMarket} type="button">{saving ? "保存中…" : "保存默认市场"}</button>
          {!loaded && marketLoadError ? <button className={styles.secondary} onClick={() => setLoadVersion(value => value + 1)} type="button">重新读取设置</button> : null}</div>
      </>}
    </div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {marketLoadError ? <p className={styles.error} role="alert">{marketLoadError}</p> : null}
    {notice ? <p className={styles.hint} role="status">{notice}</p> : null}
  </StudioDialog>;
}
