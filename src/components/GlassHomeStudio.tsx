"use client";

import type { CSSProperties, ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Box,
  Boxes,
  CircleDollarSign,
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
  { href: "/pop", label: "POP 设计", icon: PanelTop },
  { href: "/pdp", label: "PDP 构建", icon: LayoutTemplate },
  { href: "/icon-design", label: "Icon Design", icon: Sparkles }
];

export function GlassHomeStudio() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | undefined>(undefined);
  const { backgroundUrl: presetBackgroundUrl, selectBackground } = useStudioBackground();
  const {
    resetSettings: resetGlassSettings,
    setSettings: setGlassSettings,
    settings: glassSettings
  } = useGlassTunerSettings();
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string>();
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

  const stageStyle = {
    ...getGlassTunerStyle(glassSettings),
    "--home-background": 'url("' + backgroundUrl + '")'
  } as CSSProperties;

  return (
    <main className={styles.stage} style={stageStyle}>
      <div aria-hidden="true" className={styles.background} />

      <section aria-label="Midea AI Content Studio 工作台" className={styles.workbench}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
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
                  <Icon size={17} strokeWidth={1.8} />
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
            <div>
              <p className={styles.eyebrow}>Overseas Product Marketing</p>
              <h1>你好，今天想创建什么？</h1>
              <p className={styles.intro}>
                从一份产品素材开始，完成图像、模板、视频与全球市场内容交付。
              </p>
            </div>

            <div className={styles.backgroundActions}>
              <div
                aria-label={"\u9ed8\u8ba4\u5e95\u56fe"}
                className={styles.backgroundPresets}
                role="group"
              >
                {STUDIO_BACKGROUNDS.map((background) => (
                  <button
                    aria-label={`\u4f7f\u7528${background.label}\u5e95\u56fe`}
                    aria-pressed={!hasCustomBackground && presetBackgroundUrl === background.url}
                    className={styles.backgroundPreset}
                    key={background.id}
                    onClick={() => choosePresetBackground(background.url)}
                    style={{ "--preset-background": `url("${background.url}")` } as CSSProperties}
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
                <ImagePlus size={18} />
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
                  <RefreshCcw size={18} />
                </button>
              ) : null}
              <GlassTuner
                resetSettings={resetGlassSettings}
                setSettings={setGlassSettings}
                settings={glassSettings}
                triggerClassName={styles.secondaryButton}
              />
            </div>
          </header>

          <section aria-labelledby="start-title" className={styles.startSection}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionLabel}>START</p>
                <h2 id="start-title">从产品开始</h2>
              </div>
              <a className={styles.textLink} href="/assets">
                查看全部素材 <ArrowUpRight size={16} />
              </a>
            </div>

            <div className={styles.featureGrid}>
              <a className={styles.primaryFeature} href="/assets">
                <div className={styles.featureCopy}>
                  <span className={styles.featureIcon}>
                    <ImageIcon size={21} />
                  </span>
                  <p>01 / PRODUCT INTAKE</p>
                  <h3>上传产品素材</h3>
                  <span>建立产品档案并识别卖点</span>
                </div>
                <img
                  alt="产品素材示例"
                  className={styles.productImage}
                  src="/demo-assets/space-master-hires.png"
                />
                <ArrowUpRight className={styles.featureArrow} size={21} />
              </a>

              <div className={styles.secondaryFeatures}>
                <a className={styles.sceneFeature} href="/style-transfer">
                  <img alt="高端场景风格参考" src="/style-references/premium-universal/ref-2.jpg" />
                  <span className={styles.sceneOverlay}>
                    <SwatchBook size={20} />
                    <strong>场景与风格</strong>
                    <small>Keywords 驱动</small>
                  </span>
                </a>
                <a className={styles.deliveryFeature} href="/localize">
                  <Globe2 size={24} />
                  <span>
                    <strong>全球市场交付</strong>
                    <small>图像文字批量本地化</small>
                  </span>
                  <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </section>

          <section aria-labelledby="tools-title" className={styles.toolsSection}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionLabel}>CREATE</p>
                <h2 id="tools-title">快捷创作</h2>
              </div>
            </div>

            <div className={styles.quickGrid}>
              {quickTools.map((item, index) => {
                const Icon = item.icon;
                return (
                  <a className={styles.quickTool} href={item.href} key={item.href}>
                    <span className={styles.quickIndex}>{String(index + 1).padStart(2, "0")}</span>
                    <Icon size={22} strokeWidth={1.7} />
                    <strong>{item.label}</strong>
                    <ArrowUpRight className={styles.quickArrow} size={17} />
                  </a>
                );
              })}
            </div>
          </section>

          <footer className={styles.contentFooter}>
            <span>Midea AI Content Studio</span>
            <a href="/costs">
              <FileImage size={16} /> 查看生成记录
            </a>
          </footer>
        </div>
      </section>
    </main>
  );
}