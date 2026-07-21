import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/sku-variants"
}));

describe("AppShell", () => {
  it("renders every capability as its own sidebar entry", () => {
    render(
      <AppShell>
        <div>Workbench content</div>
      </AppShell>
    );

    const links = screen.getAllByRole("link").map((link) => link.textContent);
    expect(links).toEqual([
      "工作台",
      "素材库",
      "产品档案",
      "白底多角度",
      "手机图标准化",
      "SKU 替换",
      "风格迁移",
      "Icon Design",
      "产品视频",
      "POP 设计",
      "PDP 构建",
      "本地化",
      "资源消耗"
    ]);
    expect(screen.queryByText("图像工作室")).not.toBeInTheDocument();
    expect(screen.getByText("Workbench content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "SKU 替换" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "工作台" })).not.toHaveAttribute("aria-current");
  });
});
