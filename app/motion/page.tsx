import { AppShell } from "@/src/components/AppShell";
import { CapabilityRunner } from "@/src/components/CapabilityRunner";

export default function Page() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>视频方向</h1>
      <p style={{ color: "#5f6c7b", marginBottom: 18, maxWidth: 860 }}>输出产品视频的分镜方向与动态延展建议。</p>
      <CapabilityRunner taskId="task2-motion-direction" />
    </AppShell>
  );
}
