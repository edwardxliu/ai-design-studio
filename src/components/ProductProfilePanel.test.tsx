import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoProducts } from "@/src/domain/test-fixtures";
import { ProductProfilePanel } from "./ProductProfilePanel";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/products/recognize")) {
      return {
        ok: true,
        json: async () => ({ product: demoProducts[0], recognizedFrom: "product-info.txt" })
      };
    }
    if (url.includes("/api/products/selling-points")) {
      return { ok: true, json: async () => ({ product: demoProducts[0] }) };
    }
    if (url.includes("/api/products")) {
      return { ok: true, json: async () => ({ products: demoProducts }) };
    }
    return { ok: true, json: async () => ({}) };
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProductProfilePanel", () => {
  it("lists the selected product's recognized selling points", async () => {
    render(<ProductProfilePanel />);

    const rows = await screen.findAllByTestId("profile-point-row");
    expect(rows.length).toBe(demoProducts[0].profile.detectedFeatures.length);
    expect(within(rows[0]).getByDisplayValue("640L Capacity")).toBeInTheDocument();
  });

  it("recognizes selling points from uploaded product documents", async () => {
    const user = userEvent.setup();
    render(<ProductProfilePanel />);

    await screen.findAllByTestId("profile-point-row");
    await user.click(screen.getByRole("button", { name: /从产品信息识别卖点/ }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/products/recognize",
      expect.objectContaining({ method: "POST" })
    );
    expect(await screen.findByText(/product-info\.txt/)).toBeInTheDocument();
  });

  it("adds a manual selling point and saves the profile", async () => {
    const user = userEvent.setup();
    render(<ProductProfilePanel />);

    await screen.findAllByTestId("profile-point-row");
    await user.click(screen.getByRole("button", { name: "新增卖点" }));

    const rows = screen.getAllByTestId("profile-point-row");
    expect(rows.length).toBe(demoProducts[0].profile.detectedFeatures.length + 1);

    await user.click(screen.getByRole("button", { name: "保存卖点" }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/products/selling-points",
      expect.objectContaining({ method: "POST" })
    );
  });
});
