import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "工作台" },
  { href: "/assets", label: "素材库" },
  { href: "/products", label: "产品档案" },
  { href: "/white-background", label: "白底多角度" },
  { href: "/phone-standardize", label: "手机图标准化" },
  { href: "/sku-variants", label: "SKU 替换" },
  { href: "/style-transfer", label: "风格迁移" },
  { href: "/icon-design", label: "Icon Design" },
  { href: "/motion", label: "视频方向" },
  { href: "/product-video", label: "产品视频" },
  { href: "/pop", label: "POP 设计" },
  { href: "/pdp", label: "PDP 构建" },
  { href: "/localize", label: "本地化" },
  { href: "/costs", label: "资源消耗" }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell-layout">
      <aside className="app-shell-sidebar">
        <div className="app-shell-brand">
          <div style={{ color: "#057ca2", fontSize: 12, fontWeight: 800 }}>
            Midea Overseas
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: 22, lineHeight: 1.15 }}>
            AI Content Studio
          </h1>
        </div>
        <nav aria-label="平台导航" className="app-shell-nav">
          {navItems.map((item) => (
            <a
              href={item.href}
              key={item.href}
              style={{
                border: "1px solid #d9e0e7",
                borderRadius: 8,
                color: "#17202a",
                display: "block",
                fontWeight: 700,
                padding: "10px 12px",
                textDecoration: "none"
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <p className="app-shell-path">
          素材库 → 产品档案 → 生成与模板 → 本地化 → 资源台账
        </p>
      </aside>
      <main className="app-shell-main">{children}</main>
    </div>
  );
}
