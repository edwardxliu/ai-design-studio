import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("renders the core workbench navigation", () => {
    render(
      <AppShell>
        <div>Workbench content</div>
      </AppShell>
    );

    expect(screen.getByText("AI Content Studio")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Intake/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /POP/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /PDP/i })).toBeInTheDocument();
    expect(screen.getByText("Workbench content")).toBeInTheDocument();
  });
});

