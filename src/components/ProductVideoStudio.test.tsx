import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { demoProducts } from "@/src/domain/test-fixtures";
import { ProductVideoStudio } from "./ProductVideoStudio";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ProductVideoStudio", () => {
  it("submits the selected product image and polls until the video is ready", async () => {
    let pollCount = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("?taskId=")) {
        pollCount += 1;
        const status = pollCount === 1 ? "queued" : pollCount === 2 ? "running" : "succeeded";
        return new Response(
          JSON.stringify({
            taskId: "cgt-video-1",
            status,
            model: "doubao-seedance-1-0-pro-250528",
            videoUrl: status === "succeeded" ? "/generated/product-video-cgt-video-1/output.mp4" : undefined
          }),
          { status: 200 }
        );
      }
      if (url === "/api/product-video" && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            taskId: "cgt-video-1",
            status: "queued",
            model: "doubao-seedance-1-0-pro-250528",
            warning: "首选视频模型或接入点当前不可用，已自动改用 doubao-seedance-1-0-pro-250528。"
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ error: "unexpected request" }), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<ProductVideoStudio pollIntervalMs={1} products={[demoProducts[0]]} />);
    expect(screen.getByText("Seedance 2.0 Fast")).toBeInTheDocument();
    expect((screen.getByLabelText("视频提示词") as HTMLTextAreaElement).value).toContain("Hero Product Film");

    await user.click(screen.getByRole("button", { name: "生成产品视频" }));

    await waitFor(() => {
      expect(document.querySelector("video")).toHaveAttribute(
        "src",
        "/generated/product-video-cgt-video-1/output.mp4"
      );
    });
    expect(screen.getByText(/已自动改用 doubao-seedance-1-0-pro-250528/)).toBeInTheDocument();

    const postCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url) === "/api/product-video" && init?.method === "POST"
    );
    expect(postCall).toBeDefined();
    expect(JSON.parse(String(postCall![1]?.body))).toMatchObject({
      productId: demoProducts[0].id,
      productAssetId: demoProducts[0].assets[0].id
    });
    expect(pollCount).toBe(3);
  });

  it("shows an upload route when the selected product has no product image", () => {
    render(<ProductVideoStudio products={[{ ...demoProducts[0], assets: [] }]} />);

    expect(screen.getByRole("link", { name: "到素材库上传产品照片" })).toHaveAttribute(
      "href",
      "/assets"
    );
    expect(screen.getByRole("button", { name: "生成产品视频" })).toBeDisabled();
  });
});
