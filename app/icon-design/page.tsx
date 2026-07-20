import { AppShell } from "@/src/components/AppShell";
import { IconDesignStudio } from "@/src/components/IconDesignStudio";

export default function Page() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Icon Design VI 套用</h1>
      <p style={{ color: "var(--muted)", marginBottom: 18, maxWidth: 920 }}>
        上传品牌色彩与 Icon 设计规范，形成可编辑的 VI 提示词模板，再把任意功能 Icon 统一为四种官方颜色和两种图文版式。
      </p>
      <IconDesignStudio />
    </AppShell>
  );
}