import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "./page";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
});

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("HomePage", () => {
  it("keeps the main creation workflows directly accessible", () => {
    render(<HomePage />);

    expect(screen.getAllByRole("link", { name: /素材库/ })[0]).toHaveAttribute("href", "/assets");
    expect(screen.getAllByRole("link", { name: /产品档案/ })[0]).toHaveAttribute("href", "/products");
    expect(screen.getAllByRole("link", { name: /白底多角度/ })[0]).toHaveAttribute(
      "href",
      "/white-background"
    );
    expect(screen.getAllByRole("link", { name: /POP 设计/ })[0]).toHaveAttribute("href", "/pop");
    expect(screen.getAllByRole("link", { name: /PDP 构建/ })[0]).toHaveAttribute("href", "/pdp");
    expect(screen.getAllByRole("link", { name: /本地化/ })[0]).toHaveAttribute("href", "/localize");
  });

  it("renders the compact dashboard content and horizontal tool rail", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        condition: "Partly cloudy",
        location: "Shunde",
        temperature: 29.4,
        weatherCode: 2
      }),
      ok: true
    } as Response);
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /Hi,\s*How Can I Help You\?/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Start with one product asset/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /上传产品素材/ })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /场景与风格/ })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /全球市场交付/ })).toHaveLength(1);
    expect(await screen.findByText("29°C")).toBeInTheDocument();
    expect(screen.getByText(/Shunde · Partly cloudy/)).toBeInTheDocument();

    const toolSection = screen.getByRole("heading", { name: "快捷创作" }).closest("section");
    expect(toolSection).not.toBeNull();
    expect(within(toolSection as HTMLElement).getAllByRole("link")).toHaveLength(10);

    const slider = screen.getByRole("slider", { name: "快捷工具横向位置" });
    fireEvent.change(slider, { target: { value: "100" } });
    expect(slider).toHaveValue("100");
  });

  it("offers three built-in backgrounds and remembers the selected preset", () => {
    render(<HomePage />);

    const presetGroup = screen.getByRole("group", { name: "\u9ed8\u8ba4\u5e95\u56fe" });
    const presetButtons = within(presetGroup).getAllByRole("button");
    expect(presetButtons).toHaveLength(3);
    expect(presetButtons[0]).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(presetButtons[2]);

    expect(presetButtons[2]).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem("midea-studio-background")).toBe(
      "/home/studio-background-blue.webp"
    );
  });

  it("lets the user replace and restore the background image", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:custom-home-background");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
    render(<HomePage />);

    const file = new File(["image"], "workspace.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("选择首页背景图片"), {
      target: { files: [file] }
    });

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByRole("button", { name: "恢复默认底图" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "恢复默认底图" }));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:custom-home-background");
    expect(screen.queryByRole("button", { name: "恢复默认底图" })).not.toBeInTheDocument();
  });
  it("tunes and persists homepage glass parameters", async () => {
    const { unmount } = render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "\u73bb\u7483\u53c2\u6570" }));
    fireEvent.change(screen.getByLabelText("\u4e3b\u7a97\u900f\u660e\u5ea6"), {
      target: { value: "0.32" }
    });

    expect(screen.getByRole("main").style.getPropertyValue("--home-frame-opacity")).toBe("0.32");
    expect(screen.getByText(/frameOpacity=0\.32/)).toBeInTheDocument();

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem("midea-home-glass-tuner") ?? "{}"
      ) as { frameOpacity?: number };
      expect(stored.frameOpacity).toBe(0.32);
    });

    unmount();
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByRole("main").style.getPropertyValue("--home-frame-opacity")).toBe("0.32");
    });
  });
});
