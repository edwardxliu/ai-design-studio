import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CapabilityRunner } from "./CapabilityRunner";

const fetchMock = vi.fn();

const washer = {
  id: "product-user-washer",
  projectId: "project-user-workspace",
  category: "Laundry appliance",
  displayName: "SmartWash 洗衣机 X1",
  profile: {
    id: "profile-w",
    productId: "product-user-washer",
    category: "Laundry appliance",
    detectedFeatures: [],
    localizationHints: [],
    confidence: 0.9
  },
  assets: [],
  acceptsUserUploads: true
};

function stubFetch(products: unknown[]) {
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/products")) {
      return { ok: true, json: async () => ({ products }) };
    }
    if (url.includes("/api/competition/run-output")) {
      const body = JSON.parse(String(init?.body));
      return {
        ok: true,
        json: async () => ({
          output: {
            id: `x-${body.outputId}`,
            taskId: body.taskId,
            projectId: "p",
            productId: body.productId,
            type: "image",
            url: `/generated/x/${body.outputId}.png`,
            label: { productName: "SmartWash 洗衣机 X1", country: "Mexico", language: "Spanish" },
            provenance: {
              model: "gpt-image-1",
              sourceAssetIds: [],
              generatedAt: new Date().toISOString(),
              isFallback: false
            },
            requirement: "r",
            spec: { id: body.outputId, label: body.outputId, kind: "image" },
            metadata: {}
          },
          totalOutputs: 3
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

describe("CapabilityRunner", () => {
  it("asks the user to create a product first when none exist", async () => {
    stubFetch([]);
    render(<CapabilityRunner taskId="task2-style-transfer-3" />);

    expect(await screen.findByText(/还没有产品/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "素材库" })).toHaveAttribute("href", "/assets");
  });

  it("generates every output of the capability for the selected product", async () => {
    stubFetch([washer]);
    const user = userEvent.setup();
    render(<CapabilityRunner taskId="task2-style-transfer-3" />);

    await user.selectOptions(screen.getByLabelText("图像模型"), "doubao");

    await user.click(await screen.findByRole("button", { name: /开始生成/ }));

    await waitFor(() => {
      const calls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes("/api/competition/run-output")
      );
      expect(calls).toHaveLength(3);
      for (const [, init] of calls) {
        expect(JSON.parse(String(init.body))).toMatchObject({
          productId: "product-user-washer",
          imageModel: "doubao"
        });
      }
    });

    expect(await screen.findAllByText(/SmartWash 洗衣机 X1/)).not.toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/[Mm]ock/);
  });
});
