import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoverChat } from "./CoverChat";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push })
}));

afterEach(() => {
  vi.restoreAllMocks();
  push.mockReset();
});

describe("CoverChat", () => {
  it("offers four common tools and one inactive more button", () => {
    render(<CoverChat />);

    expect(screen.getByRole("link", { name: /POP Design/i })).toHaveAttribute("href", "/pop");
    expect(screen.getByRole("link", { name: /PDP Builder/i })).toHaveAttribute("href", "/pdp");
    expect(screen.getByRole("link", { name: /Style Transfer/i })).toHaveAttribute(
      "href",
      "/style-transfer"
    );
    expect(screen.getByRole("link", { name: /Product Video/i })).toHaveAttribute(
      "href",
      "/product-video"
    );
    expect(screen.getByRole("button", { name: "More tools" })).toBeDisabled();
  });

  it("shows the assistant reply and navigates when the API returns a target", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          reply: "好的，正在为你打开POP 设计。",
          navigation: { href: "/pop", label: "POP 设计" }
        })
      })
    );
    render(<CoverChat />);

    fireEvent.change(screen.getByLabelText("Message the creative assistant"), {
      target: { value: "我要去 POP 页面" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("好的，正在为你打开POP 设计。")).toBeInTheDocument();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/pop"));
  });
});
