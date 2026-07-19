import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoProducts } from "@/src/domain/test-fixtures";
import { AssetLibrary } from "./AssetLibrary";

const fetchMock = vi.fn();

function mockRoutes() {
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/products")) {
      return { ok: true, json: async () => ({ products: demoProducts }) };
    }
    if (url.includes("/api/upload")) {
      return {
        ok: true,
        json: async () => ({
          assets: [
            ...demoProducts.flatMap((product) => product.assets),
            {
              id: "asset-user-upload",
              projectId: "project-user",
              productId: "product-space-master",
              type: "product-photo",
              filename: "my-upload.png",
              url: "/uploads/project-user/asset-user-upload.png",
              source: "uploaded"
            }
          ]
        })
      };
    }
    return { ok: true, json: async () => ({}) };
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  mockRoutes();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AssetLibrary", () => {
  it("groups stored materials into the four required categories", async () => {
    render(<AssetLibrary />);

    expect(await screen.findByRole("heading", { name: "产品信息" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "品牌规范" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "模板资料" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "样例素材" })).toBeInTheDocument();
  });

  it("lists the selected product's materials with delete controls", async () => {
    render(<AssetLibrary />);

    const sampleGroup = await screen.findByTestId("material-group-sample");
    expect(within(sampleGroup).getByText("space-master-front.png")).toBeInTheDocument();
    expect(within(sampleGroup).getByText("my-upload.png")).toBeInTheDocument();

    const uploadedRow = within(sampleGroup).getByTestId("asset-row-asset-user-upload");
    expect(within(uploadedRow).getByRole("button", { name: /删除/ })).toBeInTheDocument();
  });

  it("offers a create-product form so any category can be onboarded", async () => {
    const user = userEvent.setup();
    render(<AssetLibrary />);

    await screen.findByRole("heading", { name: "产品信息" });
    await user.type(screen.getByLabelText("新产品名称"), "SmartWash 洗衣机 X1");
    await user.type(screen.getByLabelText("新产品品类"), "Laundry appliance");
    await user.click(screen.getByRole("button", { name: "创建产品" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/products",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("offers product deletion only for user-created products", async () => {
    const user = userEvent.setup();
    const userProduct = {
      id: "product-user-1",
      projectId: "project-user-workspace",
      category: "Laundry appliance",
      displayName: "SmartWash 洗衣机 X1",
      profile: {
        id: "profile-user-1",
        productId: "product-user-1",
        category: "Laundry appliance",
        detectedFeatures: [],
        localizationHints: [],
        confidence: 0.5
      },
      assets: [],
      acceptsUserUploads: true
    };
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/products")) {
        return { ok: true, json: async () => ({ products: [...demoProducts, userProduct] }) };
      }
      return { ok: true, json: async () => ({ assets: [] }) };
    });

    render(<AssetLibrary />);
    const productSelect = await screen.findByLabelText("当前产品");

    // Seed product selected: no delete button.
    expect(screen.queryByRole("button", { name: "删除产品" })).not.toBeInTheDocument();

    await user.selectOptions(productSelect, "product-user-1");
    await user.click(screen.getByRole("button", { name: "删除产品" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/products?id=product-user-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("switches products and shows only that product's materials", async () => {
    const user = userEvent.setup();
    render(<AssetLibrary />);

    const productSelect = await screen.findByLabelText("当前产品");
    await user.selectOptions(productSelect, "product-mega-oven");

    const sampleGroup = screen.getByTestId("material-group-sample");
    expect(within(sampleGroup).queryByText("space-master-front.png")).not.toBeInTheDocument();
    expect(within(sampleGroup).getByText("mega-oven-front.png")).toBeInTheDocument();
  });
});
