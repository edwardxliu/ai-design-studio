import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("presents the platform pipeline in workflow order", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: /素材库/ })).toHaveAttribute("href", "/assets");
    expect(screen.getByRole("link", { name: /^02 · 产品档案/ })).toHaveAttribute("href", "/products");
    expect(screen.getByRole("link", { name: /图像生成/ })).toHaveAttribute("href", "/white-background");
    expect(screen.getByRole("link", { name: /Icon Design/ })).toHaveAttribute("href", "/icon-design");
    expect(screen.getByRole("link", { name: /产品视频/ })).toHaveAttribute("href", "/product-video");
    expect(screen.getByRole("link", { name: /POP 设计/ })).toHaveAttribute("href", "/pop");
    expect(screen.getByRole("link", { name: /PDP 构建/ })).toHaveAttribute("href", "/pdp");
    expect(screen.getByRole("link", { name: /本地化/ })).toHaveAttribute("href", "/localize");
    expect(screen.getByRole("link", { name: /资源消耗/ })).toHaveAttribute("href", "/costs");
    expect(document.body.textContent).not.toMatch(/任务[一二三]/);
  });

  it("states the category-agnostic principle", () => {
    render(<HomePage />);

    expect(screen.getByText(/不限品类/)).toBeInTheDocument();
  });
});
