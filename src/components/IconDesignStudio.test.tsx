import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset, AssetType } from "@/src/domain/types";
import { IconDesignStudio } from "./IconDesignStudio";

const fetchMock = vi.fn();

function uploadedAsset(type: AssetType): Asset {
  return {
    id: `asset-${type}`,
    projectId: "project-icon-design",
    productId: "icon-design-workspace",
    type,
    filename: `${type}.png`,
    url: `/uploads/icon/${type}.png`,
    source: "uploaded"
  };
}

function installFetchStub() {
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/api/upload") && (!init?.method || init.method === "GET")) {
      return { ok: true, json: async () => ({ assets: [] }) };
    }
    if (url.endsWith("/api/upload") && init?.method === "POST") {
      const form = init.body as FormData;
      const type = String(form.get("type")) as AssetType;
      return { ok: true, json: async () => ({ assets: [uploadedAsset(type)] }) };
    }
    if (url.includes("/api/icon-design/generate")) {
      const body = JSON.parse(String(init?.body));
      return {
        ok: true,
        json: async () => ({
          output: {
            id: `output-${body.variantId}`,
            variantId: body.variantId,
            label: body.variantId,
            group: body.variantId.startsWith("layout") ? "layout" : "color",
            size: body.variantId === "layout-horizontal" ? "1536x1024" : "1024x1024",
            url: `/generated/icon/${body.variantId}.png`,
            model: body.imageModel === "doubao" ? "doubao-seedream-5-0-lite" : "gpt-image-1",
            prompt: "brand-standardized icon",
            sourceAssetIds: [body.sourceIconAssetId],
            generatedAt: "2026-07-17T00:00:00.000Z"
          }
        })
      };
    }
    if (url.includes("/api/assets")) {
      return { ok: true, json: async () => ({ removed: true }) };
    }
    return { ok: true, json: async () => ({}) };
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  installFetchStub();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("IconDesignStudio", () => {
  it("requires only the source icon and hides duplicate VI controls", async () => {
    render(<IconDesignStudio />);

    expect(await screen.findByRole("button", { name: "生成全部 6 个版本" })).toBeDisabled();
    expect(screen.getByLabelText("上传待规范化 Icon")).toBeInTheDocument();
    expect(screen.queryByText("VI 规范")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "AI 解析 VI 规则" })).not.toBeInTheDocument();
  });

  it("generates six variants from one icon with the selected image model", async () => {
    const user = userEvent.setup();
    render(<IconDesignStudio />);

    await user.upload(
      screen.getByLabelText("上传待规范化 Icon"),
      new File(["source"], "crispers.png", { type: "image/png" })
    );
    expect(await screen.findByText(/待规范化 Icon已上传/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("图像模型"), "doubao");
    await user.click(screen.getByRole("button", { name: "生成全部 6 个版本" }));

    await waitFor(() => expect(generationCalls()).toHaveLength(6));
    const calls = generationCalls();
    expect(calls.map((call) => call.variantId)).toEqual([
      "standard-black",
      "midea-blue",
      "blue-background",
      "deep-blue-background",
      "layout-vertical",
      "layout-horizontal"
    ]);
    for (const call of calls) {
      expect(call).toMatchObject({
        sourceIconAssetId: "asset-icon-source",
        featureTitle: "Twin Crispers",
        imageModel: "doubao"
      });
      expect(call).not.toHaveProperty("viColorAssetId");
      expect(call).not.toHaveProperty("viStyleAssetId");
      expect(call).not.toHaveProperty("promptTemplate");
    }

    expect(await screen.findByRole("img", { name: "标准黑色" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "左右排版" })).toBeInTheDocument();
    expect(screen.getByText("6/6 已生成")).toBeInTheDocument();
  });
});

function generationCalls(): Array<Record<string, string>> {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).includes("/api/icon-design/generate"))
    .map(([, init]) => JSON.parse(String(init?.body)) as Record<string, string>);
}