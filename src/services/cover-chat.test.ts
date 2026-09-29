import { describe, expect, it, vi } from "vitest";
import { createCoverChatReply, resolveCoverNavigation } from "./cover-chat";

describe("cover chat service", () => {
  it("maps explicit Chinese and English actions to whitelisted studio routes", () => {
    expect(resolveCoverNavigation("我要去 POP 页面")).toEqual({
      href: "/pop",
      label: "POP 设计"
    });
    expect(resolveCoverNavigation("Open the product video tool")).toEqual({
      href: "/product-video",
      label: "产品视频"
    });
    expect(resolveCoverNavigation("帮我做一张白底三视角图片")).toEqual({
      href: "/white-background",
      label: "白底多角度"
    });
  });

  it("answers navigation requests in the language of the latest message", async () => {
    await expect(
      createCoverChatReply({ message: "带我去 POP 页面" })
    ).resolves.toMatchObject({ reply: "好的，正在为你打开POP 设计。" });
    await expect(
      createCoverChatReply({ message: "Open the product video tool" })
    ).resolves.toMatchObject({ reply: "Opening Product Video." });
  });
  it("does not navigate when a module is only being discussed", () => {
    expect(resolveCoverNavigation("POP 是什么？")).toBeUndefined();
    expect(resolveCoverNavigation("请解释一下 PDP 和 POP 的区别")).toBeUndefined();
  });

  it("uses the configured completion for normal conversation", async () => {
    const complete = vi.fn().mockResolvedValue("可以。先告诉我产品和目标市场。");

    await expect(
      createCoverChatReply({
        message: "帮我规划一个产品发布创意",
        history: [{ role: "user", content: "这是一个新冰箱。" }],
        model: "test-text-model",
        complete
      })
    ).resolves.toEqual({
      reply: "可以。先告诉我产品和目标市场。",
      model: "test-text-model"
    });
    expect(complete).toHaveBeenCalledWith({
      history: [{ role: "user", content: "这是一个新冰箱。" }],
      message: "帮我规划一个产品发布创意",
      model: "test-text-model"
    });
  });
});
