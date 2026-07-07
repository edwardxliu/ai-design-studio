import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders direct links to every demo feature page", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: /Upload assets/i })).toHaveAttribute("href", "/intake");
    expect(screen.getByRole("link", { name: /Task center/i })).toHaveAttribute("href", "/tasks");
    expect(screen.getByRole("link", { name: /POP templates/i })).toHaveAttribute("href", "/pop");
    expect(screen.getByRole("link", { name: /PDP builder/i })).toHaveAttribute("href", "/pdp");
    expect(screen.getByRole("link", { name: /Localization/i })).toHaveAttribute("href", "/localization");
    expect(screen.getByRole("link", { name: /Cost ledger/i })).toHaveAttribute("href", "/costs");
  });
});
