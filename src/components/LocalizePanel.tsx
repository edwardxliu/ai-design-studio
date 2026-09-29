"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_IMAGE_MODEL_CHOICE,
  type ImageModelChoice
} from "@/src/domain/generation-models";
import { mapWithConcurrency } from "@/src/lib/concurrency";
import { ImageModelSelector } from "./ImageModelSelector";

type LocalizeResult = {
  url: string;
  model: string;
  sourceUrl: string;
  width?: number;
  height?: number;
  error?: string;
};

type UploadItem = {
  id: string;
  file: File;
  originalName: string;
  previewUrl: string;
  state: "pending" | "running" | "done" | "failed";
  resultUrl?: string;
  error?: string;
};

const countries = ["Mexico", "Brazil", "Saudi Arabia", "United States"];
const languages = ["Spanish", "Portuguese", "English", "Arabic"];
const BATCH_CONCURRENCY = 3;
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
const MAX_UPLOAD_COUNT = 20;
const SVG_RASTER_MAX_DIMENSION = 2048;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml"
]);

export function LocalizePanel() {
  const [imageModel, setImageModel] = useState<ImageModelChoice>(DEFAULT_IMAGE_MODEL_CHOICE);
  const [targetCountry, setTargetCountry] = useState(countries[1]);
  const [targetLanguage, setTargetLanguage] = useState(languages[1]);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const previewUrls = useRef(new Set<string>());

  useEffect(() => {
    return () => {
      for (const url of previewUrls.current) {
        revokeObjectUrl(url);
      }
      previewUrls.current.clear();
    };
  }, []);

  async function addFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    setError("");
    const remaining = Math.max(0, MAX_UPLOAD_COUNT - items.length);
    const selected = Array.from(fileList).slice(0, remaining);
    if (!selected.length) {
      setError(`一次最多处理 ${MAX_UPLOAD_COUNT} 张图片。`);
      return;
    }

    const nextItems: UploadItem[] = [];
    const failures: string[] = [];
    for (const sourceFile of selected) {
      try {
        const file = await normalizeUploadFile(sourceFile);
        const previewUrl = URL.createObjectURL(file);
        previewUrls.current.add(previewUrl);
        nextItems.push({
          id: createUploadId(),
          file,
          originalName: sourceFile.name,
          previewUrl,
          state: "pending"
        });
      } catch (cause) {
        failures.push(
          `${sourceFile.name}: ${cause instanceof Error ? cause.message : "无法读取图片"}`
        );
      }
    }

    if (nextItems.length) {
      setItems((current) => [...current, ...nextItems]);
    }
    if (failures.length) {
      setError(failures.join("；"));
    }
  }

  function removeItem(id: string) {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        revokeObjectUrl(target.previewUrl);
        previewUrls.current.delete(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  function clearItems() {
    for (const item of items) {
      revokeObjectUrl(item.previewUrl);
      previewUrls.current.delete(item.previewUrl);
    }
    setItems([]);
    setError("");
  }

  async function convertBatch() {
    if (!items.length) {
      setError("请先上传需要转换文字语言的图片。");
      return;
    }

    setError("");
    setRunning(true);
    setItems((current) =>
      current.map((item) => ({
        ...item,
        state: "pending",
        resultUrl: undefined,
        error: undefined
      }))
    );

    const update = (id: string, patch: Partial<UploadItem>) =>
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );

    await mapWithConcurrency(items, BATCH_CONCURRENCY, async (item) => {
      update(item.id, { state: "running" });
      try {
        const formData = new FormData();
        formData.append("image", item.file, item.file.name);
        formData.append("country", targetCountry);
        formData.append("language", targetLanguage);
        formData.append("imageModel", imageModel);

        const response = await fetch("/api/localize", {
          method: "POST",
          body: formData
        });
        const payload: LocalizeResult = await response.json();
        if (!response.ok || payload.error) {
          throw new Error(payload.error ?? `Request failed with ${response.status}`);
        }
        update(item.id, { state: "done", resultUrl: payload.url });
      } catch (cause) {
        update(item.id, {
          state: "failed",
          error: cause instanceof Error ? cause.message : "转换失败"
        });
      }
    });

    setRunning(false);
  }

  const completed = items.filter((item) => item.state === "done").length;

  return (
    <section style={{ display: "grid", gap: 20 }}>
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <strong>批量转换图片文字语言</strong>
            <span style={mutedStyle}>
              上传设计完成的图片，系统会识别并翻译其中的文字，同时保持原图像素尺寸。
            </span>
          </div>
          <span style={{ ...mutedStyle, fontWeight: 700 }}>{completed}/{items.length} 已完成</span>
        </div>

        <div style={controlGridStyle}>
          <label style={fieldStyle}>
            目标国家
            <select
              aria-label="目标国家"
              disabled={running}
              onChange={(event) => setTargetCountry(event.target.value)}
              value={targetCountry}
            >
              {countries.map((country) => <option key={country}>{country}</option>)}
            </select>
          </label>
          <label style={fieldStyle}>
            目标语言
            <select
              aria-label="目标语言"
              disabled={running}
              onChange={(event) => setTargetLanguage(event.target.value)}
              value={targetLanguage}
            >
              {languages.map((language) => <option key={language}>{language}</option>)}
            </select>
          </label>
          <ImageModelSelector disabled={running} onChange={setImageModel} value={imageModel} />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <label style={secondaryButtonStyle}>
            选择图片
            <input
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              aria-label="上传待转换图片"
              disabled={running}
              multiple
              onChange={(event) => {
                void addFiles(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
              style={{ display: "none" }}
              type="file"
            />
          </label>
          <button disabled={running || !items.length} onClick={clearItems} style={secondaryButtonStyle} type="button">
            清空
          </button>
          <button
            data-generate-action="true"
            disabled={running || !items.length}
            onClick={convertBatch}
            style={primaryButtonStyle}
            type="button"
          >
            {running ? "正在转换..." : `转换上传图片（${items.length}）`}
          </button>
        </div>
        <p style={{ ...mutedStyle, margin: 0 }}>
          支持 PNG、JPEG、WebP 和 SVG。SVG 会先在浏览器中转换为受控尺寸的 PNG，避免超大矢量文件解析失败。
        </p>
        {error ? <p role="alert" style={{ color: "#9b2c2c", margin: 0 }}>{error}</p> : null}
      </div>

      {items.length ? (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((item) => (
            <article key={item.id} style={panelStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.originalName}
                  </strong>
                  <span style={mutedStyle}>
                    {item.state === "running"
                      ? "正在识别并转换文字..."
                      : item.state === "done"
                        ? "转换完成"
                        : item.state === "failed"
                          ? `转换失败：${item.error}`
                          : "等待转换"}
                  </span>
                </div>
                <button
                  aria-label={`移除 ${item.originalName}`}
                  disabled={running}
                  onClick={() => removeItem(item.id)}
                  style={secondaryButtonStyle}
                  type="button"
                >
                  移除
                </button>
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: item.resultUrl ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)", maxWidth: 980 }}>
                <figure style={figureStyle}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={`原图 ${item.originalName}`} src={item.previewUrl} style={imageStyle} />
                  <figcaption style={captionStyle}>原图</figcaption>
                </figure>
                {item.resultUrl ? (
                  <figure style={figureStyle}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={`本地化结果 ${item.originalName}`} src={item.resultUrl} style={imageStyle} />
                    <figcaption style={captionStyle}>{targetLanguage}</figcaption>
                  </figure>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

const panelStyle = {
  background: "var(--studio-glass-card, rgba(255, 255, 255, 0.42))",
  border: "1px solid rgba(255, 255, 255, 0.72)",
  borderRadius: 8,
  display: "grid",
  gap: 16,
  padding: 16
} as const;

const controlGridStyle = {
  alignItems: "end",
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))"
} as const;

const fieldStyle = { display: "grid", gap: 6, fontWeight: 700 } as const;
const mutedStyle = { color: "var(--text-muted, #4b5b67)", fontSize: 13 } as const;

const primaryButtonStyle = {
  background: "#0f7be1",
  border: "1px solid #005ab0",
  borderRadius: 8,
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 800,
  padding: "10px 16px"
} as const;

const secondaryButtonStyle = {
  alignItems: "center",
  background: "var(--studio-glass-card, rgba(255, 255, 255, 0.45))",
  border: "1px solid rgba(255, 255, 255, 0.82)",
  borderRadius: 8,
  color: "#26313d",
  cursor: "pointer",
  display: "inline-flex",
  fontWeight: 700,
  justifyContent: "center",
  minHeight: 40,
  padding: "9px 13px"
} as const;

const figureStyle = {
  background: "rgba(255, 255, 255, 0.22)",
  border: "1px solid rgba(255, 255, 255, 0.58)",
  borderRadius: 8,
  display: "grid",
  margin: 0,
  overflow: "hidden"
} as const;

const imageStyle = {
  display: "block",
  height: "min(34vh, 360px)",
  objectFit: "contain",
  width: "100%"
} as const;

const captionStyle = {
  borderTop: "1px solid rgba(255, 255, 255, 0.52)",
  color: "#33424d",
  fontSize: 12,
  padding: "8px 10px"
} as const;

async function normalizeUploadFile(file: File): Promise<File> {
  const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
  if (!SUPPORTED_IMAGE_TYPES.has(file.type) && !isSvg) {
    throw new Error("仅支持 PNG、JPEG、WebP 或 SVG 图片");
  }
  if (!file.size) {
    throw new Error("文件为空");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("文件不能超过 30 MB");
  }
  return isSvg ? rasterizeSvgFile(file) : file;
}

async function rasterizeSvgFile(file: File): Promise<File> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("SVG 栅格化失败"));
      image.src = sourceUrl;
    });

    const sourceWidth = image.naturalWidth || image.width || 1024;
    const sourceHeight = image.naturalHeight || image.height || 1024;
    const scale = Math.min(
      1,
      SVG_RASTER_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight)
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("浏览器不支持 SVG 栅格化");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("SVG 栅格化失败"))),
        "image/png"
      );
    });
    const filename = file.name.replace(/\.svg$/i, "") || "localized-source";
    return new File([blob], `${filename}.png`, { type: "image/png" });
  } finally {
    revokeObjectUrl(sourceUrl);
  }
}

function revokeObjectUrl(url: string): void {
  if (typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}

function createUploadId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
