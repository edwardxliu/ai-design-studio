import { AppShell } from "@/src/components/AppShell";
import { LocalizePanel } from "@/src/components/LocalizePanel";

export default function LocalizePage() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>本地化</h1>
      <p style={{ color: "#5f6c7b", marginBottom: 18, maxWidth: 860 }}>
        选择国家与语言后,把之前生成的图里的文字替换成对应语言版本;产品外观、构图与品牌元素保持不变。
        每次本地化同样计入资源台账。
      </p>
      <LocalizePanel />
    </AppShell>
  );
}
