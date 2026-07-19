import { PRODUCT_VIDEO_OUTPUT } from "@/src/domain/product-video";
import { DEFAULT_ARK_API_ROOT, normalizeArkApiRoot } from "@/src/services/doubao-image-provider";
import { createProxyDispatcher, fetchOpenAi } from "@/src/services/image-provider";

export const DEFAULT_SEEDANCE_VIDEO_MODEL = "doubao-seedance-1-5-pro-251215";
export const DEFAULT_SEEDANCE_FALLBACK_MODELS = ["doubao-seedance-1-0-pro-250528"];

export type SeedanceTaskStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type SeedanceVideoTask = {
  taskId: string;
  status: SeedanceTaskStatus;
  model: string;
  videoUrl?: string;
  error?: string;
  warning?: string;
};

export type SeedanceReferenceImage = {
  bytes: Buffer;
  contentType: string;
  filename: string;
};

export type CreateSeedanceVideoTaskInput = {
  prompt: string;
  referenceImage: SeedanceReferenceImage;
};

export type DownloadedVideo = {
  bytes: Buffer;
  contentType: string;
};

export type SeedanceVideoProvider = {
  createTask(input: CreateSeedanceVideoTaskInput): Promise<SeedanceVideoTask>;
  getTask(taskId: string): Promise<SeedanceVideoTask>;
  downloadVideo(url: string): Promise<DownloadedVideo>;
};

export type ArkFetch = (url: string, init: RequestInit) => Promise<Response>;
export type SeedanceReferenceImageRole = "first_frame" | "reference_image";

type SeedanceVideoProviderOptions = {
  apiKey?: string;
  model?: string;
  endpointId?: string;
  fallbackModels?: string[];
  referenceImageRole?: SeedanceReferenceImageRole;
  baseUrl?: string;
  proxyUrl?: string;
  fetcher?: ArkFetch;
};

type ArkTaskPayload = {
  id?: unknown;
  model?: unknown;
  status?: unknown;
  content?: { video_url?: unknown } | null;
  error?: { message?: unknown } | string | null;
};

type ArkErrorPayload = {
  error?: { code?: unknown; message?: unknown } | string;
};

class ArkVideoApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(`火山方舟视频 API ${status}: ${message}`);
    this.name = "ArkVideoApiError";
  }
}

export function createSeedanceVideoProvider(
  options: SeedanceVideoProviderOptions
): SeedanceVideoProvider {
  const apiKey = options.apiKey?.trim() ?? "";
  const candidates = buildModelCandidates(options);
  const referenceImageRole = options.referenceImageRole ?? "first_frame";
  const baseUrl = normalizeArkApiRoot(options.baseUrl ?? DEFAULT_ARK_API_ROOT);
  const dispatcher = createProxyDispatcher(options.proxyUrl ?? process.env.ARK_PROXY_URL);
  const request: ArkFetch =
    options.fetcher ?? ((url, init) => fetchOpenAi(url, init, dispatcher));

  function assertConfigured() {
    if (!apiKey) {
      throw new Error("未配置 ARK_API_KEY，无法调用即梦 Seedance 视频模型。");
    }
  }

  return {
    async createTask(input) {
      assertConfigured();
      const prompt = buildSeedancePrompt(input.prompt);
      const imageDataUrl = `data:${input.referenceImage.contentType};base64,${input.referenceImage.bytes.toString("base64")}`;

      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        try {
          const response = await request(`${baseUrl}/contents/generations/tasks`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: candidate,
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: { url: imageDataUrl },
                  role: referenceImageRole
                }
              ],
              return_last_frame: false
            })
          });
          const task = normalizeTask(await parseArkResponse(response), candidate, "queued");
          return index === 0
            ? task
            : {
                ...task,
                warning: `首选视频模型或接入点 ${candidates[0]} 当前不可用，已自动改用 ${candidate}。`
              };
        } catch (error) {
          if (isUnavailableModelError(error) && index < candidates.length - 1) {
            continue;
          }
          if (isUnavailableModelError(error)) {
            throw new Error(buildUnavailableModelMessage(candidates));
          }
          throw error;
        }
      }

      throw new Error(buildUnavailableModelMessage(candidates));
    },

    async getTask(taskId) {
      assertConfigured();
      const response = await request(
        `${baseUrl}/contents/generations/tasks/${encodeURIComponent(taskId)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${apiKey}` }
        }
      );
      return normalizeTask(await parseArkResponse(response), candidates[0]);
    },

    async downloadVideo(url) {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        throw new Error("Seedance 返回了不受支持的视频地址。");
      }
      const response = await request(parsed.toString(), {
        method: "GET",
        headers: { Accept: "video/mp4,video/*" }
      });
      if (!response.ok) {
        throw new Error(`Seedance 视频下载失败 (${response.status})。`);
      }
      return {
        bytes: Buffer.from(await response.arrayBuffer()),
        contentType: response.headers.get("content-type")?.split(";")[0] || "video/mp4"
      };
    }
  };
}

export function buildSeedancePrompt(prompt: string): string {
  const normalized = prompt.trim();
  if (!normalized) {
    throw new Error("视频提示词不能为空。");
  }
  return [
    "图片1中的产品是唯一产品参考。",
    normalized,
    `--ratio ${PRODUCT_VIDEO_OUTPUT.aspectRatio}`,
    `--duration ${PRODUCT_VIDEO_OUTPUT.durationSeconds}`,
    `--resolution ${PRODUCT_VIDEO_OUTPUT.resolution}`,
    "--generate_audio false",
    "--watermark false"
  ].join("\n");
}

function buildModelCandidates(options: SeedanceVideoProviderOptions): string[] {
  const configured = [
    options.endpointId?.trim(),
    options.model?.trim() || DEFAULT_SEEDANCE_VIDEO_MODEL,
    ...(options.fallbackModels ?? DEFAULT_SEEDANCE_FALLBACK_MODELS).map((model) => model.trim())
  ].filter((value): value is string => Boolean(value));
  return Array.from(new Set(configured));
}

async function parseArkResponse(response: Response): Promise<ArkTaskPayload> {
  const text = await response.text();
  if (!response.ok) {
    let code = "";
    let message = text.slice(0, 500);
    try {
      const payload = JSON.parse(text) as ArkErrorPayload;
      if (typeof payload.error === "string") {
        message = payload.error;
      } else if (payload.error) {
        code = typeof payload.error.code === "string" ? payload.error.code : "";
        message =
          typeof payload.error.message === "string" ? payload.error.message : message;
      }
    } catch {
      // Preserve the raw response excerpt when the service does not return JSON.
    }
    throw new ArkVideoApiError(response.status, code, message);
  }
  try {
    return JSON.parse(text) as ArkTaskPayload;
  } catch {
    throw new Error("火山方舟视频 API 返回了无法解析的响应。");
  }
}

function isUnavailableModelError(error: unknown): error is ArkVideoApiError {
  return (
    error instanceof ArkVideoApiError &&
    (error.code === "InvalidEndpointOrModel.NotFound" || error.status === 404)
  );
}

function buildUnavailableModelMessage(candidates: string[]): string {
  return [
    `当前 ARK_API_KEY 无法调用已配置的视频模型或接入点（已尝试：${candidates.join("、")}）。`,
    "请在火山方舟控制台开通对应 Seedance 模型，或创建视频推理接入点后在 .env.local 设置 DOUBAO_VIDEO_ENDPOINT_ID=ep-...，然后重启服务。"
  ].join("");
}

function normalizeTask(
  payload: ArkTaskPayload,
  fallbackModel: string,
  fallbackStatus?: SeedanceTaskStatus
): SeedanceVideoTask {
  const taskId = typeof payload.id === "string" ? payload.id : "";
  if (!taskId) {
    throw new Error("Seedance 响应中缺少任务 ID。");
  }
  const status = parseTaskStatus(payload.status, fallbackStatus);
  const videoUrl =
    typeof payload.content?.video_url === "string" ? payload.content.video_url : undefined;
  const error =
    typeof payload.error === "string"
      ? payload.error
      : typeof payload.error?.message === "string"
        ? payload.error.message
        : undefined;
  return {
    taskId,
    status,
    model: typeof payload.model === "string" ? payload.model : fallbackModel,
    videoUrl,
    error
  };
}

function parseTaskStatus(
  value: unknown,
  fallback?: SeedanceTaskStatus
): SeedanceTaskStatus {
  if (
    value === "queued" ||
    value === "running" ||
    value === "succeeded" ||
    value === "failed" ||
    value === "cancelled"
  ) {
    return value;
  }
  if (value === "canceled") {
    return "cancelled";
  }
  if (fallback) {
    return fallback;
  }
  throw new Error("Seedance 响应中缺少有效的任务状态。");
}