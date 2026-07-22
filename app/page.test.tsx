import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./page";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() })
}));


describe("Cover HomePage", () => {
  it("presents the cover story and enters the existing studio homepage", () => {
    const { container } = render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /Skip the noise\.\s*Time to make\./i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Where ideas become the work" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Learn more about how to use this platform. Start creating excellence in the palm of your hand"
      )
    ).toBeInTheDocument();
    screen.getAllByRole("link", { name: /Start now/i }).forEach((link) => {
      expect(link).toHaveAttribute("href", "/studio-home");
    });
    expect(screen.getByRole("link", { name: /^Enter$/i })).toHaveAttribute(
      "href",
      "/studio-home"
    );
    expect(container.querySelector('source[src="/midea-ai/midea-scroll-new.mp4"]')).not.toBeNull();
    expect(
      container.querySelector('source[src="/midea-ai/brand-source-hero.mp4"]')
    ).not.toBeNull();
    expect(screen.getByRole("region", { name: "Workflow execution demos" })).toBeInTheDocument();
    [
      "Eliminate Production Friction",
      "Instant Ideas Execution",
      "Deliver with Continuity at Scale"
    ].forEach((heading) => {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    });
    [
      "/midea-ai/execution-demo-01.mp4",
      "/midea-ai/execution-demo-02.mp4",
      "/midea-ai/execution-demo-03.mp4"
    ].forEach((src) => {
      expect(container.querySelector(`source[src="${src}"]`)).not.toBeNull();
    });
    expect(
      screen.getByLabelText("brand.ai floating reference collage").querySelectorAll("img")
    ).toHaveLength(16);
  });
});
