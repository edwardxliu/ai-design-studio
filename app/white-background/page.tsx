import { AppShell } from "@/src/components/AppShell";
import { WhiteBackgroundRunner } from "@/src/components/WhiteBackgroundRunner";

export default function Page() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>白底三视角产品图</h1>
      <p style={{ color: "#5f6c7b", marginBottom: 18, maxWidth: 900 }}>
        分别上传关门和开门产品图。每张参考图固定生成左侧 45°、正视、右侧 45°三张 Catalog 级白底产品图。
      </p>
      <WhiteBackgroundRunner />
    </AppShell>
  );
}