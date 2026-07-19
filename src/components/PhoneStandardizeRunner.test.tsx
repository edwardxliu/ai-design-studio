import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset, ProductWithProfile } from "@/src/domain/types";
import { PhoneStandardizeRunner } from "./PhoneStandardizeRunner";

const fetchMock = vi.fn();

function phoneAsset(): Asset {
  return {
    id: "asset-phone-shot",
    projectId: "project-user-workspace",
    productId: "product-user-washer",
    type: "phone-shot",
    filename: "washer-phone.jpg",
    url: "/uploads/washer-phone.jpg",
    source: "uploaded"
  };
}

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

function installFetchStub(product: ProductWithProfile) {
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/products")) {
      return { ok: true, json: async () => ({ products: [product] }) };
    }
    if (url.includes("/api/upload")) {
      return { ok: true, json: async () => ({ assets: [phoneAsset()] }) };
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
            id: body.outputId,
            taskId: body.taskId,
            projectId: product.projectId,
            productId: product.id,
            type: "image",
            url: `/generated/phone/${body.outputId}.png`,
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
            requirement: "three studio views",
            spec: {
              id: body.outputId,
              label: body.outputId,
              kind: "image",
              angle: body.outputId.replace("standardize-phone-shot-", "")
            },
            metadata: {}
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

describe("PhoneStandardizeRunner", () => {
  it("requires one phone or non-standard product image", async () => {
    installFetchStub(createProduct());
    render(<PhoneStandardizeRunner />);

    expect(await screen.findByRole("button", { name: "生成 3 张标准图" })).toBeDisabled();
    expect(screen.getByText("等待上传")).toBeInTheDocument();
  });

  it("uploads one source image and generates exactly three studio views", async () => {
    installFetchStub(createProduct());
    const user = userEvent.setup();
    render(<PhoneStandardizeRunner />);

    await user.upload(
      await screen.findByLabelText("上传手机拍摄图"),
      new File(["phone image"], "phone.jpg", { type: "image/jpeg" })
    );
    expect(await screen.findByText(/手机图已上传/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("图像模型"), "doubao");
    await user.click(screen.getByRole("button", { name: "生成 3 张标准图" }));

    await waitFor(() => {
      const calls = generationCalls();
      expect(calls).toHaveLength(3);
      expect(calls.map((call) => call.outputId)).toEqual([
        "standardize-phone-shot-studio-left-45",
        "standardize-phone-shot-studio-front",
        "standardize-phone-shot-studio-right-45"
      ]);
      for (const call of calls) {
        expect(call).toMatchObject({
          taskId: "task1-phone-to-studio-6",
          productId: "product-user-washer",
          sourceAssetId: "asset-phone-shot",
          imageModel: "doubao"
        });
      }
    });

    expect(await screen.findAllByRole("img")).toHaveLength(4);
  });

  it("uses an existing phone-shot asset as the only source for all outputs", async () => {
    installFetchStub(createProduct([phoneAsset()]));
    const user = userEvent.setup();
    render(<PhoneStandardizeRunner />);

    await user.click(await screen.findByRole("button", { name: "生成 3 张标准图" }));

    await waitFor(() => {
      const calls = generationCalls();
      expect(calls).toHaveLength(3);
      expect(calls.every((call) => call.sourceAssetId === "asset-phone-shot")).toBe(true);
    });
  });
});

function generationCalls(): Array<Record<string, string>> {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).includes("/api/competition/run-output"))
    .map(([, init]) => JSON.parse(String(init?.body)) as Record<string, string>);
}