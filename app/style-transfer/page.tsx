import { AppShell } from "@/src/components/AppShell";
import { StyleTransferStudio } from "@/src/components/StyleTransferStudio";

export default function Page() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>风格迁移</h1>
      <p style={{ color: "var(--muted)", marginBottom: 18, maxWidth: 900 }}>
        输入 Keywords，将上传产品放入 PPT 定义的广告风格场景；每种风格固定输出 3 张静态图片。
      </p>
      <StyleTransferStudio />
    </AppShell>
  );
}