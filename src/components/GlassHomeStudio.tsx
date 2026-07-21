"use client";

import type { CSSProperties, ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Box,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  FileImage,
  Film,
  Globe2,
  House,
  ImageIcon,
  ImagePlus,
  Languages,
  LayoutTemplate,
  PackageSearch,
  PanelTop,
  RefreshCcw,
  ScanLine,
  Sparkles,
  Sun,
  SwatchBook,
  WandSparkles
} from "lucide-react";
import styles from "./GlassHomeStudio.module.css";
import { GlassTuner, getGlassTunerStyle, useGlassTunerSettings } from "./GlassTuner";
import { STUDIO_BACKGROUNDS } from "./studio-backgrounds";
import { useStudioBackground } from "./useStudioBackground";

type StudioLink = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

type WeatherData = {
  condition: string;
  temperature: number;
  weatherCode: number;
};

const navigation: StudioLink[] = [
  { href: "/", label: "工作台", icon: House },
  { href: "/assets", label: "素材库", icon: Boxes },
  { href: "/products", label: "产品档案", icon: PackageSearch },
  { href: "/white-background", label: "白底多角度", icon: Box },
  { href: "/phone-standardize", label: "手机图标准化", icon: ScanLine },
  { href: "/sku-variants", label: "SKU 替换", icon: WandSparkles },
  { href: "/style-transfer", label: "风格迁移", icon: SwatchBook },
  { href: "/icon-design", label: "Icon Design", icon: Sparkles },
  { href: "/product-video", label: "产品视频", icon: Film },
  { href: "/pop", label: "POP 设计", icon: PanelTop },
  { href: "/pdp", label: "PDP 构建", icon: LayoutTemplate },
  { href: "/localize", label: "本地化", icon: Languages },
  { href: "/costs", label: "资源消耗", icon: CircleDollarSign }
];

const quickTools: StudioLink[] = [
  { href: "/white-background", label: "白底多角度", icon: Box },
  { href: "/phone-standardize", label: "手机图标准化", icon: ScanLine },
  { href: "/sku-variants", label: "SKU 局部替换", icon: WandSparkles },
  { href: "/style-transfer", label: "风格迁移", icon: SwatchBook },
  { href: "/icon-design", label: "Icon Design", icon: Sparkles },
  { href: "/product-video", label: "产品视频", icon: Film },
  { href: "/pop", label: "POP 设计", icon: PanelTop },
  { href: "/pdp", label: "PDP 构建", icon: LayoutTemplate },
  { href: "/localize", label: "本地化", icon: Languages },
  { href: "/assets", label: "素材库", icon: Boxes }
];

export function GlassHomeStudio() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | undefined>(undefined);
  const quickScrollerRef = useRef<HTMLDivElement>(null);
  const { backgroundUrl: presetBackgroundUrl, selectBackground } = useStudioBackground();
  const {
    resetSettings: resetGlassSettings,
    setSettings: setGlassSettings,
    settings: glassSettings
  } = useGlassTunerSettings();
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string>();
  const [quickPosition, setQuickPosition] = useState(0);
  const backgroundUrl = customBackgroundUrl ?? presetBackgroundUrl;
  const hasCustomBackground = Boolean(customBackgroundUrl);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const replaceBackground = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setCustomBackgroundUrl(nextUrl);
  };

  const restoreBackground = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = undefined;
    }
    setCustomBackgroundUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const choosePresetBackground = (nextBackground: string) => {
    restoreBackground();
    selectBackground(nextBackground);
  };

  const setQuickScroll = (position: number) => {
    setQuickPosition(position);
    const scroller = quickScrollerRef.current;
    if (!scroller) {
      return;
    }
    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    scroller.scrollLeft = (position / 100) * maxScroll;
  };

  const syncQuickScroll = () => {
    const scroller = quickScrollerRef.current;
    if (!scroller) {
      return;
    }
    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    setQuickPosition(maxScroll > 0 ? (scroller.scrollLeft / maxScroll) * 100 : 0);
  };

  const stageStyle = {
    ...getGlassTunerStyle(glassSettings),
    "--home-background": 'url("' + backgroundUrl + '")'
  } as CSSProperties;

  return (
    <main className={styles.stage} style={stageStyle}>
      <div aria-hidden="true" className={styles.background} />

      <section aria-label="Midea AI Content Studio 工作台" className={styles.workbench}>
        <aside className={styles.sidebar}>          <div className={styles.brand}>
            <span className={styles.brandOverline}>Midea Overseas</span>
            <strong>AI Content Studio</strong>
          </div>

          <nav aria-label="平台导航" className={styles.navigation}>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  aria-current={item.href === "/" ? "page" : undefined}
                  className={styles.navLink + (item.href === "/" ? " " + styles.navLinkActive : "")}
                  href={item.href}
                  key={item.href}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <span className={styles.onlineDot} />
            在线生成模式
          </div>
        </aside>

        <div className={styles.content}>
          <header className={styles.topbar}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Midea Overseas AI Content Studio</p>
              <h1>
                <span>Hi,</span>
                How Can I Help You?
              </h1>
              <p className={styles.intro}>
                Start with one product asset, then build images, templates, videos and localized
                campaigns.
              </p>
            </div>

            <div className={styles.topbarSide}>
              <HomeInfoWidgets />

              <div className={styles.backgroundActions}>
                <div aria-label="默认底图" className={styles.backgroundPresets} role="group">
                  {STUDIO_BACKGROUNDS.map((background) => (
                    <button
                      aria-label={"使用" + background.label + "底图"}
                      aria-pressed={!hasCustomBackground && presetBackgroundUrl === background.url}
                      className={styles.backgroundPreset}
                      key={background.id}
                      onClick={() => choosePresetBackground(background.url)}
                      style={
                        {
                          "--preset-background": 'url("' + background.url + '")'
                        } as CSSProperties
                      }
                      title={background.label}
                      type="button"
                    />
                  ))}
                </div>
                <input
                  accept="image/*"
                  aria-label="选择首页背景图片"
                  className={styles.fileInput}
                  onChange={(event) => replaceBackground(event.target.files?.[0])}
                  ref={fileInputRef}
                  type="file"
                />
                <button
                  className={styles.secondaryButton}
                  onClick={() => fileInputRef.current?.click()}
                  title="替换首页底图"
                  type="button"
                >
                  <ImagePlus size={16} />
                  <span>替换底图</span>
                </button>
                {hasCustomBackground ? (
                  <button
                    aria-label="恢复默认底图"
                    className={styles.iconButton}
                    onClick={restoreBackground}
                    title="恢复默认底图"
                    type="button"
                  >
                    <RefreshCcw size={16} />
                  </button>
                ) : null}
                <GlassTuner
                  resetSettings={resetGlassSettings}
                  setSettings={setGlassSettings}
                  settings={glassSettings}
                  triggerClassName={styles.secondaryButton}
                />
              </div>
            </div>
          </header>

          <section aria-labelledby="start-title" className={styles.startSection}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionLabel}>START</p>
                <h2 id="start-title">从产品开始</h2>
              </div>
              <a className={styles.textLink} href="/assets">
                查看全部素材 <ArrowUpRight size={15} />
              </a>
            </div>

            <div className={styles.featureGrid}>
              <a className={styles.featureCard + " " + styles.productFeature} href="/assets">
                <span aria-hidden="true" className={styles.featureBackdrop} />
                <span className={styles.featureContent}>
                  <span className={styles.featureIcon}>
                    <ImageIcon size={19} />
                  </span>
                  <small>01 / PRODUCT INTAKE</small>
                  <strong>上传产品素材</strong>
                  <span>建立产品档案并识别卖点</span>
                </span>
                <ArrowUpRight className={styles.featureArrow} size={18} />
              </a>

              <a
                className={styles.featureCard + " " + styles.styleFeature}
                href="/style-transfer"
              >
                <span aria-hidden="true" className={styles.featureBackdrop} />
                <span className={styles.featureContent}>
                  <span className={styles.featureIcon}>
                    <SwatchBook size={19} />
                  </span>
                  <small>02 / STYLE SYSTEM</small>
                  <strong>场景与风格</strong>
                  <span>Keywords 驱动场景生成</span>
                </span>
                <ArrowUpRight className={styles.featureArrow} size={18} />
              </a>

              <a
                className={styles.featureCard + " " + styles.deliveryFeature}
                href="/localize"
              >
                <span className={styles.featureContent}>
                  <span className={styles.featureIcon}>
                    <Globe2 size={19} />
                  </span>
                  <small>03 / GLOBAL DELIVERY</small>
                  <strong>全球市场交付</strong>
                  <span>图像文字批量本地化</span>
                </span>
                <ArrowUpRight className={styles.featureArrow} size={18} />
              </a>
            </div>
          </section>

          <section aria-labelledby="tools-title" className={styles.toolsSection}>
            <div className={styles.toolsHeader}>
              <div>
                <p className={styles.sectionLabel}>CREATE</p>
                <h2 id="tools-title">快捷创作</h2>
              </div>
              <span>{String(quickTools.length).padStart(2, "0")} TOOLS</span>
            </div>

            <label className={styles.quickSlider}>
              <span className={styles.visuallyHidden}>快捷工具横向位置</span>
              <input
                aria-label="快捷工具横向位置"
                max="100"
                min="0"
                onChange={(event) => setQuickScroll(Number(event.target.value))}
                step="1"
                type="range"
                value={quickPosition}
              />
            </label>

            <div
              className={styles.quickScroller}
              onScroll={syncQuickScroll}
              ref={quickScrollerRef}
            >
              <div className={styles.quickGrid}>
                {quickTools.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <a
                      className={styles.quickTool}
                      href={item.href}
                      key={item.href + "-" + index}
                    >
                      <span className={styles.quickIndex}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Icon size={20} strokeWidth={1.7} />
                      <strong>{item.label}</strong>
                      <ArrowUpRight className={styles.quickArrow} size={15} />
                    </a>
                  );
                })}
              </div>
            </div>
          </section>

          <footer className={styles.contentFooter}>
            <span>Midea AI Content Studio</span>
            <a href="/costs">
              <FileImage size={14} /> 查看生成记录
            </a>
          </footer>
        </div>
      </section>
    </main>
  );
}

function HomeInfoWidgets() {
  const [now, setNow] = useState<Date>();
  const [weather, setWeather] = useState<WeatherData>();
  const [weatherUnavailable, setWeatherUnavailable] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadWeather = async () => {
      try {
        const response = await fetch("/api/weather", {
          cache: "no-store",
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error("Weather request failed");
        }
        const nextWeather = (await response.json()) as WeatherData;
        setWeather(nextWeather);
        setWeatherUnavailable(false);
      } catch {
        if (!controller.signal.aborted) {
          setWeather(undefined);
          setWeatherUnavailable(true);
        }
      }
    };

    void loadWeather();
    const timer = window.setInterval(loadWeather, 10 * 60_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  const date = now
    ? new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        timeZone: "Asia/Shanghai"
      }).format(now)
    : "--";
  const weekday = now
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "Asia/Shanghai"
      }).format(now)
    : "Today";
  const WeatherIcon = getWeatherIcon(weather?.weatherCode);

  return (
    <div className={styles.infoGrid}>
      <article className={styles.infoCard}>
        <span aria-hidden="true" className={styles.infoBackdrop} />
        <CalendarDays size={18} />
        <span>
          <small>{weekday}</small>
          <strong>{date}</strong>
        </span>
      </article>

      <article className={styles.infoCard}>
        <span aria-hidden="true" className={styles.infoBackdrop} />
        <WeatherIcon size={19} />
        <span>
          <small>Shunde · {weather?.condition ?? (weatherUnavailable ? "Unavailable" : "Loading")}</small>
          <strong>{weather ? Math.round(weather.temperature) + "°C" : "--°C"}</strong>
        </span>
      </article>
    </div>
  );
}

function getWeatherIcon(code: number | undefined) {
  if (code === 0) {
    return Sun;
  }
  if (code === 45 || code === 48) {
    return CloudFog;
  }
  if (code !== undefined && code >= 95) {
    return CloudLightning;
  }
  if (code !== undefined && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))) {
    return CloudRain;
  }
  if (code !== undefined && ((code >= 71 && code <= 77) || (code >= 85 && code <= 86))) {
    return CloudSnow;
  }
  return CloudSun;
}