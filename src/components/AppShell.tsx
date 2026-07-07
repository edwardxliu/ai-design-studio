import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/intake", label: "Intake" },
  { href: "/tasks", label: "Tasks" },
  { href: "/pop", label: "POP" },
  { href: "/pdp", label: "PDP" },
  { href: "/localization", label: "Localization" },
  { href: "/costs", label: "Costs" }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px minmax(0, 1fr)",
        minHeight: "100vh"
      }}
    >
      <aside
        style={{
          borderRight: "1px solid #d9e0e7",
          background: "#ffffff",
          padding: 22
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <div style={{ color: "#057ca2", fontSize: 12, fontWeight: 800 }}>
            Midea Overseas
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: 22, lineHeight: 1.15 }}>
            AI Content Studio
          </h1>
        </div>
        <nav aria-label="Workbench navigation" style={{ display: "grid", gap: 8 }}>
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
      </aside>
      <main style={{ padding: 28 }}>{children}</main>
    </div>
  );
}

