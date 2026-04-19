import { describe, expect, it } from "vitest";
import {
  OPENAI_IMAGE_EDIT_SIZE_PRESETS,
  resolveOpenAIImageEditSize,
} from "@/lib/openai-edit-size";

describe("resolveOpenAIImageEditSize", () => {
  it("picks closest aspect to portrait for tall sources", () => {
    expect(resolveOpenAIImageEditSize(800, 2400)).toBe("1024x1536");
  });

  it("picks closest aspect to landscape for wide sources", () => {
    expect(resolveOpenAIImageEditSize(2400, 800)).toBe("1536x1024");
  });

  it("uses square preset for near-square sources", () => {
    expect(resolveOpenAIImageEditSize(1000, 1000)).toBe("1024x1024");
  });

  it("matches each preset when source aspect equals that preset", () => {
    for (const preset of OPENAI_IMAGE_EDIT_SIZE_PRESETS) {
      const [w, h] = preset.split("x").map(Number);
      expect(resolveOpenAIImageEditSize(w * 10, h * 10)).toBe(preset);
    }
  });
});
