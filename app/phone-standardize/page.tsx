import { AppShell } from "@/src/components/AppShell";
import { PhoneStandardizeRunner } from "@/src/components/PhoneStandardizeRunner";

export default function Page() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>手机图标准化</h1>
      <p style={{ color: "#5f6c7b", marginBottom: 18, maxWidth: 900 }}>
        上传一张手机随拍或非标准产品图，清理复杂反射、贴纸和杂物，生成正视、左侧 45°、右侧 45°三张摄影棚级产品图。
      </p>
      <PhoneStandardizeRunner />
    </AppShell>
  );
}