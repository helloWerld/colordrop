import type { Stylization } from "./validators";

export const STYLIZATION_PROMPTS: Record<Stylization, string> = {
  none:
    "Clean black-and-white coloring book page, bold outlines only, no shading, no color, white background, suitable for children.",
  fairy_tale:
    "Fairy tale storybook style, black-and-white coloring page, whimsical outlines, no shading, suitable for children.",
  cartoon:
    "Cartoon style black-and-white coloring book outline, simple bold lines, no shading, white background, suitable for children.",
  storybook:
    "Classic storybook illustration style, black-and-white coloring page, clear outlines, no shading, suitable for children.",
  sketch:
    "Hand-drawn sketch style, black-and-white coloring book page, pencil-like outlines, no shading, suitable for children.",
};
