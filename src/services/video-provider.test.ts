import { describe, expect, it, vi } from "vitest";
import {
  buildSeedancePrompt,
  createSeedanceVideoProvider,
  DEFAULT_SEEDANCE_FALLBACK_MODELS,
  DEFAULT_SEEDANCE_VIDEO_MODEL
} from "./video-provider";

const referenceImage = {
  bytes: Buffer.from("product"),
  contentType: "image/png",
  filename: "product.png"
};

function unavailableResponse() {
  return new Response(
    JSON.stringify({
      error: {
        code: "InvalidEndpointOrModel.NotFound",
        message: "The model does not exist or you do not have access to it."
      }
    }),
    { status: 404 }
  );
}

describe("Seedance video provider", () => {
  it("creates a 12-second first-frame task from the uploaded product image", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ id: "cgt-123", status: "queued", model: DEFAULT_SEEDANCE_VIDEO_MODEL }),
        { status: 200 }
      )
    );
    const provider = createSeedanceVideoProvider({
      apiKey: "ark-test-key",
      baseUrl: "https://ark.example/api/v3/",
      fetcher
    });

    const task = await provider.createTask({
      prompt: "黑色背景中的高端产品影片",
      referenceImage
    });

    expect(fetcher.mock.calls[0][0]).toBe(
      "https://ark.example/api/v3/contents/generations/tasks"
    );
    const body = JSON.parse(String(fetcher.mock.calls[0][1].body));
    expect(body.model).toBe(DEFAULT_SEEDANCE_VIDEO_MODEL);
    expect(body.content).toHaveLength(2);
    expect(body.content[0].text).toContain("--duration 12");
    expect(body.content[0].text).toContain("--resolution 720p");
    expect(body.content[1]).toMatchObject({
      type: "image_url",
      role: "first_frame"
    });
    expect(body.content[1].image_url.url).toMatch(/^data:image\/png;base64,/);
    expect(task).toMatchObject({ taskId: "cgt-123", status: "queued" });
  });

  it("uses a configured endpoint before the public model id", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "cgt-endpoint", status: "queued" }), { status: 200 })
    );
    const provider = createSeedanceVideoProvider({
      apiKey: "key",
      endpointId: "ep-video-123",
      fetcher
    });

    const task = await provider.createTask({ prompt: "Hero film", referenceImage });
    const body = JSON.parse(String(fetcher.mock.calls[0][1].body));
    expect(body.model).toBe("ep-video-123");
    expect(task.model).toBe("ep-video-123");
  });

  it("falls back only when the preferred model or endpoint is unavailable", async () => {
    const fallbackModel = DEFAULT_SEEDANCE_FALLBACK_MODELS[0];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(unavailableResponse())
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: "cgt-fallback", status: "queued", model: fallbackModel }),
          { status: 200 }
        )
      );
    const provider = createSeedanceVideoProvider({
      apiKey: "key",
      model: DEFAULT_SEEDANCE_VIDEO_MODEL,
      fallbackModels: [fallbackModel],
      fetcher
    });

    const task = await provider.createTask({ prompt: "Hero film", referenceImage });
    const models = fetcher.mock.calls.map((call) => JSON.parse(String(call[1].body)).model);
    expect(models).toEqual([DEFAULT_SEEDANCE_VIDEO_MODEL, fallbackModel]);
    expect(task.model).toBe(fallbackModel);
    expect(task.warning).toContain("已自动改用");
  });

  it("returns an actionable message when no configured model is available", async () => {
    const provider = createSeedanceVideoProvider({
      apiKey: "key",
      model: DEFAULT_SEEDANCE_VIDEO_MODEL,
      fallbackModels: [],
      fetcher: vi.fn().mockResolvedValue(unavailableResponse())
    });

    await expect(
      provider.createTask({ prompt: "Hero film", referenceImage })
    ).rejects.toThrow(/DOUBAO_VIDEO_ENDPOINT_ID=ep-/);
  });

  it("queries completed tasks and exposes the generated video URL", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "cgt-456",
          status: "succeeded",
          content: { video_url: "https://cdn.example/hero.mp4" }
        }),
        { status: 200 }
      )
    );
    const provider = createSeedanceVideoProvider({ apiKey: "key", fetcher });

    await expect(provider.getTask("cgt-456")).resolves.toMatchObject({
      taskId: "cgt-456",
      status: "succeeded",
      videoUrl: "https://cdn.example/hero.mp4"
    });
    expect(fetcher.mock.calls[0][0]).toContain("/contents/generations/tasks/cgt-456");
  });

  it("reports missing credentials before making a request", async () => {
    const provider = createSeedanceVideoProvider({ apiKey: "", fetcher: vi.fn() });
    await expect(
      provider.createTask({ prompt: "prompt", referenceImage })
    ).rejects.toThrow(/ARK_API_KEY/);
  });

  it("adds each fixed output flag once", () => {
    const prompt = buildSeedancePrompt("Hero film");
    expect(prompt.match(/--duration 12/g)).toHaveLength(1);
    expect(prompt.match(/图片1中的产品是唯一产品参考/g)).toHaveLength(1);
  });
});