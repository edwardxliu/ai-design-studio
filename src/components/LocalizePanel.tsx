"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_IMAGE_MODEL_CHOICE,
  type ImageModelChoice
} from "@/src/domain/generation-models";
import { mapWithConcurrency } from "@/src/lib/concurrency";
import type { RuntimeImageEntry } from "@/src/services/runtime-files";
import { ImageModelSelector } from "./ImageModelSelector";

type LocalizeResult = {
  url: string;
  model: string;
  sourceUrl: string;
  error?: string;
};

type BatchItem = {
  sourceUrl: string;
  state: "pending" | "running" | "done" | "failed";
  resultUrl?: string;
  error?: string;
};

const countries = ["Mexico", "Brazil", "Saudi Arabia", "United States"];
const languages = ["Spanish", "Portuguese", "English", "Arabic"];
const BATCH_CONCURRENCY = 3;

export function LocalizePanel() {
  const [settings, setSettings] = useState({ country: "Mexico", language: "Spanish" });
  const [imageModel, setImageModel] = useState<ImageModelChoice>(DEFAULT_IMAGE_MODEL_CHOICE);
  const [settingsStatus, setSettingsStatus] = useState("");
  const [outputs, setOutputs] = useState<RuntimeImageEntry[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [targetCountry, setTargetCountry] = useState(countries[1]);
  const [targetLanguage, setTargetLanguage] = useState(languages[1]);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("/api/settings"), fetch("/api/outputs")])
      .then(async ([settingsResponse, outputsResponse]) => {
        const settingsPayload = settingsResponse.ok ? await settingsResponse.json() : null;
        const outputsPayload = outputsResponse.ok ? await outputsResponse.json() : { outputs: [] };
        if (cancelled) {
          return;
        }
        if (settingsPayload?.settings) {
          setSettings(settingsPayload.settings);
        }
        if (Array.isArray(outputsPayload.outputs)) {
          setOutputs(outputsPayload.outputs);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveSettings() {
    setSettingsStatus("保存中…");
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "保存失败");
      }
      setSettings(payload.settings);
      setSettingsStatus("已保存。POP / PDP / 图像生成的输出标注将使用该市场语言。");
    } catch (cause) {
      setSettingsStatus(cause instanceof Error ? cause.message : "保存失败");
    }
  }

  function toggleSelected(url: string) {
    setSelectedUrls((current) => {
      const next = new Set(current);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  }

  function selectAllOutputs() {
    setSelectedUrls(new Set(outputs.map((output) => output.url)));
  }

  function clearSelection() {
    setSelectedUrls(new Set());
  }

  async function convertBatch() {
    const urls = Array.from(selectedUrls);
    if (!urls.length) {
      setError("请先勾选要转换的图片。");
      return;
    }
    setError("");
    setRunning(true);
    setItems(urls.map((sourceUrl) => ({ sourceUrl, state: "pending" })));

    const update = (sourceUrl: string, patch: Partial<BatchItem>) =>
      setItems((current) =>
        current.map((item) => (item.sourceUrl === sourceUrl ? { ...item, ...patch } : item))
      );

    await mapWithConcurrency(urls, BATCH_CONCURRENCY, async (sourceUrl) => {
      update(sourceUrl, { state: "running" });
      try {
        const sourcePayload = await prepareSourcePayload(sourceUrl);
        const response = await fetch("/api/localize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            outputUrl: sourceUrl,
            country: targetCountry,
            language: targetLanguage,
            imageModel,
            ...sourcePayload
          })
        });
        const payload: LocalizeResult = await response.json();
        if (!response.ok || payload.error) {
          throw new Error(payload.error ?? `Request failed with ${response.status}`);
        }
        update(sourceUrl, { state: "done", resultUrl: payload.url });
      } catch (cause) {
        update(sourceUrl, {
          state: "failed",
          error: cause instanceof Error ? cause.message : "转换失败"
        });
      }
    });

    setRunning(false);
  }

  const completed = items.filter((item) => item.state === "done" || item.state === "failed").length;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div style={panelStyle}>
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>系统语言设置</h2>
        <p style={{ color: "var(--muted)", margin: "0 0 12px" }}>
          你只需要用自己的语言设计;各功能页生成的输出会按这里设置的目标市场进行标注。
        </p>
        <div style={{ alignItems: "end", display: "flex", flexWrap: "wrap", gap: 12 }}>
          <label style={fieldStyle}>
            系统国家
            <select
              value={settings.country}
              onChange={(event) => setSettings((c) => ({ ...c, country: event.target.value }))}
            >
              {countries.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label style={fieldStyle}>
            系统语言
            <select
              value={settings.language}
              onChange={(event) => setSettings((c) => ({ ...c, language: event.target.value }))}
            >
              {languages.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <button onClick={saveSettings} style={primaryButtonStyle} type="button">
            保存系统语言
          </button>
          {settingsStatus ? <span style={{ color: "#0049bb" }}>{settingsStatus}</span> : null}
        </div>
      </div>

      <div style={panelStyle}>
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>批量转换图像文字语言</h2>
        <p style={{ color: "var(--muted)", margin: "0 0 12px" }}>
          勾选已生成的图片,选择目标市场后批量转换:系统保持产品与构图不变,
          把图中的所有文字(包括你输入的文案)翻译成目标语言——你不需要会写目标语言。
        </p>
        <div style={{ alignItems: "end", display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <label style={fieldStyle}>
            目标国家
            <select value={targetCountry} onChange={(event) => setTargetCountry(event.target.value)}>
              {countries.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label style={fieldStyle}>
            目标语言
            <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>
              {languages.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <ImageModelSelector
            disabled={running}
            onChange={setImageModel}
            value={imageModel}
          />
          <button disabled={running || outputs.length === 0} onClick={selectAllOutputs} style={secondaryButtonStyle} type="button">
            全选
          </button>
          <button disabled={running || selectedUrls.size === 0} onClick={clearSelection} style={secondaryButtonStyle} type="button">
            清空
          </button>
          <button data-generate-action="true" disabled={running} onClick={convertBatch} style={primaryButtonStyle} type="button">
            {running ? `转换中 ${completed}/${items.length}…` : `批量转换所选(${selectedUrls.size})`}
          </button>
          {error ? <span style={{ color: "#8f1f1f" }}>{error}</span> : null}
        </div>

        {outputs.length === 0 ? (
          <p style={{ color: "var(--muted-soft)", margin: 0 }}>
            还没有生成记录。先在各功能页生成一些内容。
          </p>
        ) : null}
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          {outputs.map((output) => {
            const checked = selectedUrls.has(output.url);
            return (
              <label
                key={output.url}
                style={{
                  background: "var(--studio-glass-card, #ffffff)",
                  border: checked ? "2px solid var(--accent-strong)" : "1px solid #e5e8ec",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "grid",
                  gap: 6,
                  padding: 8
                }}
              >
                <input
                  aria-label={`选择 ${output.filename}`}
                  checked={checked}
                  onChange={() => toggleSelected(output.url)}
                  type="checkbox"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={output.filename}
                  src={output.url}
                  style={{ background: "var(--studio-glass-preview, #f6f7f9)", height: 110, objectFit: "contain", width: "100%" }}
                />
                <span style={{ color: "var(--muted)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {output.taskId}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {items.length ? (
        <div style={panelStyle}>
          <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>
            转换结果({targetCountry} / {targetLanguage})
          </h2>
          <div style={{ display: "grid", gap: 14 }}>
            {items.map((item) => (
              <div key={item.sourceUrl} style={{ borderTop: "1px solid #eef1f4", paddingTop: 10 }}>
                <p style={{ color: "var(--muted)", fontSize: 12, margin: "0 0 6px" }}>
                  {item.sourceUrl}
                  {" — "}
                  {item.state === "running"
                    ? "转换中…"
                    : item.state === "done"
                      ? "完成"
                      : item.state === "failed"
                        ? `失败:${item.error}`
                        : "等待中"}
                </p>
                {item.resultUrl ? (
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", maxWidth: 860 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="原图" src={item.sourceUrl} style={imageStyle} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="本地化结果" src={item.resultUrl} style={imageStyle} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

const panelStyle = {
  background: "var(--studio-glass-card, #ffffff)",
  border: "1px solid #d9e0e7",
  borderRadius: 8,
  padding: 16
} as const;

const fieldStyle = { display: "grid", gap: 6 } as const;

const primaryButtonStyle = {
  background: "var(--accent-strong)",
  border: "1px solid var(--accent-strong)",
  borderRadius: 8,
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 800,
  padding: "10px 14px"
} as const;

const secondaryButtonStyle = {
  background: "var(--studio-glass-card, #ffffff)",
  border: "1px solid #aeb8c3",
  borderRadius: 8,
  color: "#26313d",
  cursor: "pointer",
  fontWeight: 700,
  padding: "10px 12px"
} as const;

const imageStyle = {
  border: "1px solid #e5e8ec",
  maxWidth: "100%"
} as const;

async function prepareSourcePayload(sourceUrl: string): Promise<{
  imageBase64?: string;
  imageContentType?: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
}> {
  if (!/\.svg(?:$|[?#])/i.test(sourceUrl)) {
    return {};
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error("SVG 原图读取失败。");
  }

  const svg = await response.text();
  const blobUrl = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
  );

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("SVG 栅格化失败。"));
      image.src = blobUrl;
    });

    const sourceWidth = image.naturalWidth || image.width || 1024;
    const sourceHeight = image.naturalHeight || image.height || 1024;
    const maximumDimension = 2048;
    const scale = Math.min(1, maximumDimension / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("浏览器不支持 SVG 栅格化。");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const ratio = sourceWidth / sourceHeight;
    const size =
      ratio > 1.15
        ? "1536x1024"
        : ratio < 0.87
          ? "1024x1536"
          : "1024x1024";

    return {
      imageBase64: canvas.toDataURL("image/png").split(",")[1],
      imageContentType: "image/png",
      size
    };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
