import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("cover chat route", () => {
  it("returns a whitelisted navigation target without requiring a model call", async () => {
    const response = await POST(
      new Request("http://localhost/api/cover-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "带我去 PDP 构建页面", history: [] })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reply: "好的，正在为你打开PDP 构建。",
      navigation: { href: "/pdp", label: "PDP 构建" }
    });
  });

  it("returns English copy for an English navigation request", async () => {
    const response = await POST(
      new Request("http://localhost/api/cover-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Open the product video tool", history: [] })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reply: "Opening Product Video.",
      navigation: { href: "/product-video", label: "产品视频" }
    });
  });
  it("rejects empty messages", async () => {
    const response = await POST(
      new Request("http://localhost/api/cover-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "   " })
      })
    );

    expect(response.status).toBe(400);
  });
});
