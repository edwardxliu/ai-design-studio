"use client";

import type { CSSProperties, ReactNode } from "react";
import styles from "./AppShell.module.css";
import { getGlassTunerStyle, useGlassTunerSettings } from "./GlassTuner";
import { useStudioBackground } from "./useStudioBackground";
import { StudioNavigation } from "./StudioNavigation";
import { StudioSettings } from "./StudioSettings";

export function AppShell({ children }: { children: ReactNode }) {
  const { backgroundUrl } = useStudioBackground();
  const glass = useGlassTunerSettings();
  const stageStyle = {
    ...getGlassTunerStyle(glass.settings),
    "--studio-background": 'url("' + backgroundUrl + '")'
  } as CSSProperties;
  return (
    <main className={styles.stage} style={stageStyle}>
      <div aria-hidden="true" className={styles.background} />
      <section aria-label="Midea AI Content Studio 功能工作区" className={styles.workbench}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}><span>Midea Overseas</span><strong>AI Content Studio</strong></div>
          <StudioNavigation className={styles.navigation} />
          <div className={styles.sidebarFooter}><span className={styles.onlineDot} />在线生成模式</div>
        </aside>
        <div className={styles.settingsDock}><StudioSettings glass={glass} /></div>
        <section className={styles.main}>{children}</section>
      </section>
    </main>
  );
}
