import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset, ProductWithProfile } from "@/src/domain/types";
import { WhiteBackgroundRunner } from "./WhiteBackgroundRunner";

const fetchMock = vi.fn();

function createProduct(assets: Asset[] = []): ProductWithProfile {
  return {
    id: "product-user-washer",
    projectId: "project-user-workspace",
    category: "Laundry appliance",
    displayName: "SmartWash 洗衣机 X1",
    profile: {
      id: "profile-washer",
      productId: "product-user-washer",
      category: "Laundry appliance",
      detectedFeatures: [],
      localizationHints: [],
      confidence: 0.9
    },
    assets,
    acceptsUserUploads: true
  };
}

function sourceAsset(state: "closed" | "open"): Asset {
  return {
    id: `asset-${state}`,
    projectId: "project-user-workspace",
    productId: "product-user-washer",
    type: state === "closed" ? "white-background-closed" : "white-background-open",
    filename: `washer-${state}.png`,
    url: `/uploads/washer-${state}.png`,
    source: "uploaded"
  };
}

function installFetchStub(product: ProductWithProfile) {
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/products")) {
      return { ok: true, json: async () => ({ products: [product] }) };
    }
    if (url.includes("/api/upload")) {
      const form = init?.body as FormData;
      const type = String(form.get("type"));
      const state = type.endsWith("open") ? "open" : "closed";
      return { ok: true, json: async () => ({ assets: [sourceAsset(state)] }) };
    }
    if (url.includes("/api/assets")) {
      return { ok: true, json: async () => ({ removed: true }) };
    }
    if (url.includes("/api/competition/run-output")) {
      const body = JSON.parse(String(init?.body));
      return {
        ok: true,
        json: async () => ({
          output: {
            id: `${body.outputId}-${body.sourceState}`,
            taskId: body.taskId,
            projectId: product.projectId,
            productId: product.id,
            type: "image",
            url: `/generated/${body.sourceState}/${body.outputId}.png`,
            label: {
              productName: product.displayName,
              country: "Mexico",
              language: "Spanish"
            },
            provenance: {
              model: body.imageModel === "doubao" ? "doubao-seedream" : "gpt-image-1",
              sourceAssetIds: [body.sourceAssetId],
              generatedAt: "2026-07-16T00:00:00.000Z",
              isFallback: false
            },
            requirement: "three views",
            spec: {
              id: body.outputId,
              label: body.outputId,
              kind: "image",
              angle: body.outputId.replace("white-background-", ""),
              sourceState: body.sourceState
            },
            metadata: { sourceState: body.sourceState }
          }
        })
      };
    }
    return { ok: true, json: async () => ({}) };
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WhiteBackgroundRunner", () => {
  it("requires at least one open or closed product image", async () => {
    installFetchStub(createProduct());
    render(<WhiteBackgroundRunner />);

    const button = await screen.findByRole("button", { name: "生成 3 张白底图" });
    expect(button).toBeDisabled();
    expect(screen.getByText("0/2 已上传 · 将生成 0 张")).toBeInTheDocument();
  });

  it("uploads one closed-door image and generates exactly three angles", async () => {
    installFetchStub(createProduct());
    const user = userEvent.setup();
    render(<WhiteBackgroundRunner />);

    await user.upload(
      await screen.findByLabelText("上传关门产品图"),
      new File(["image"], "closed.png", { type: "image/png" })
    );
    expect(await screen.findByText(/关门产品图已上传/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("图像模型"), "doubao");
    await user.click(screen.getByRole("button", { name: "生成 3 张白底图" }));

    await waitFor(() => {
      const calls = generationCalls();
      expect(calls).toHaveLength(3);
      expect(calls.map((call) => call.outputId)).toEqual([
        "white-background-left-45",
        "white-background-front",
        "white-background-right-45"
      ]);
      for (const call of calls) {
        expect(call).toMatchObject({
          productId: "product-user-washer",
          imageModel: "doubao",
          sourceAssetId: "asset-closed",
          sourceState: "closed"
        });
      }
    });

    const group = await screen.findByRole("heading", { name: "关门图三视角" });
    expect(within(group.parentElement!.parentElement!).getAllByRole("img")).toHaveLength(3);
  });

  it("generates six outputs when both product states are supplied", async () => {
    installFetchStub(createProduct([sourceAsset("closed"), sourceAsset("open")]));
    const user = userEvent.setup();
    render(<WhiteBackgroundRunner />);

    await user.click(await screen.findByRole("button", { name: "生成 6 张白底图" }));

    await waitFor(() => {
      const calls = generationCalls();
      expect(calls).toHaveLength(6);
      expect(calls.filter((call) => call.sourceState === "closed")).toHaveLength(3);
      expect(calls.filter((call) => call.sourceState === "open")).toHaveLength(3);
    });

    expect(await screen.findByRole("heading", { name: "关门图三视角" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "开门图三视角" })).toBeInTheDocument();
  });
});

function generationCalls(): Array<Record<string, string>> {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).includes("/api/competition/run-output"))
    .map(([, init]) => JSON.parse(String(init?.body)) as Record<string, string>);
}
