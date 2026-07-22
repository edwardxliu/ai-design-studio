"use client";

import Link from "next/link";
import type { CSSProperties, ComponentType, ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Box,
  Boxes,
  CircleDollarSign,
  Film,
  House,
  Languages,
  LayoutTemplate,
  PackageSearch,
  PanelTop,
  ScanLine,
  Sparkles,
  SwatchBook,
  WandSparkles
} from "lucide-react";
import styles from "./AppShell.module.css";
import { getGlassTunerStyle, useGlassTunerSettings } from "./GlassTuner";
import { useStudioBackground } from "./useStudioBackground";

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

const navItems: NavigationItem[] = [
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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { backgroundUrl } = useStudioBackground();
  const { settings: glassSettings } = useGlassTunerSettings();
  const stageStyle = {
    ...getGlassTunerStyle(glassSettings),
    "--studio-background": 'url("' + backgroundUrl + '")'
  } as CSSProperties;

  return (
    <main className={styles.stage} style={stageStyle}>
      <div aria-hidden="true" className={styles.background} />

      <section aria-label="Midea AI Content Studio 功能工作区" className={styles.workbench}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <span>Midea Overseas</span>
            <strong>AI Content Studio</strong>
          </div>

          <nav aria-label="平台导航" className={styles.navigation}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={styles.navLink + (isActive ? " " + styles.navLinkActive : "")}
                  href={item.href}
                  prefetch={true}
                  key={item.href}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <span className={styles.onlineDot} />
            在线生成模式
          </div>
        </aside>

        <section className={styles.main}>{children}</section>
      </section>
    </main>
  );
}