"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Box, Boxes, ChevronDown, ClipboardList, Film, House, Languages, LayoutTemplate, Network, PackageSearch, PanelTop, ScanLine, Sparkles, SwatchBook, Tag, WandSparkles } from "lucide-react";
import styles from "./StudioNavigation.module.css";

const groups = [
  { id: "creation", label: "创作中心", icon: Box, items: [
    { href: "/style-transfer", label: "风格迁移", icon: SwatchBook },
    { href: "/white-background", label: "白底图多角度", icon: Box },
    { href: "/phone-standardize", label: "手机图标准化", icon: ScanLine },
    { href: "/sku-variants", label: "SKU 替换", icon: WandSparkles },
    { href: "/pop", label: "POP 物料设计", icon: PanelTop },
    { href: "/pdp", label: "PDP 构建", icon: LayoutTemplate },
    { href: "/localize", label: "多语言环境适应", icon: Languages },
    { href: "/product-video", label: "产品视频", icon: Film }
  ] },
  { id: "assets", label: "资产中心", icon: Network, items: [
    { href: "/assets", label: "素材库", icon: Boxes },
    { href: "/products", label: "产品档案", icon: PackageSearch }
  ] },
  { id: "brand", label: "品牌管理", icon: Tag, items: [
    { href: "/icon-design", label: "Icon Design", icon: Sparkles }
  ] }
];

export function StudioNavigation({ className, home = false }: { className?: string; home?: boolean }) {
  const currentPath = usePathname();
  const pathname = home ? "/studio-home" : currentPath ?? "/studio-home";
  const activeGroup = groups.find(group => group.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/")))?.id;
  const [expanded, setExpanded] = useState<string[]>(activeGroup ? [activeGroup] : []);
  const id = useId();

  useEffect(() => {
    if (activeGroup) setExpanded(current => current.includes(activeGroup) ? current : [...current, activeGroup]);
  }, [activeGroup]);

  return (
    <nav aria-label="平台导航" className={[styles.navigation, className].filter(Boolean).join(" ")}>
      <Link href="/studio-home" className={styles.item} aria-current={pathname === "/studio-home" ? "page" : undefined}>
        <House size={15} aria-hidden /><span>首页</span>
      </Link>
      {groups.map(group => {
        const Icon = group.icon;
        const open = expanded.includes(group.id);
        return <div className={styles.group} key={group.id}>
          <button className={styles.item} aria-expanded={open} aria-controls={`${id}-${group.id}`} onClick={() => setExpanded(current => open ? current.filter(item => item !== group.id) : [...current, group.id])} type="button">
            <Icon size={15} aria-hidden /><span>{group.label}</span><ChevronDown size={12} className={open ? styles.chevronOpen : styles.chevron} aria-hidden />
          </button>
          <div className={styles.children} id={`${id}-${group.id}`} hidden={!open}>
            {group.items.map(item => {
              const ItemIcon = item.icon;
              return <Link className={styles.child} key={item.href} href={item.href} aria-current={pathname === item.href || pathname.startsWith(item.href + "/") ? "page" : undefined}>
                <ItemIcon size={13} aria-hidden /><span>{item.label}</span>
              </Link>;
            })}
          </div>
        </div>;
      })}
      <Link href="/costs" className={styles.item} aria-current={pathname === "/costs" ? "page" : undefined} title="查看生成任务与资源消耗记录">
        <ClipboardList size={15} aria-hidden /><span>任务与记录</span>
      </Link>
    </nav>
  );
}
