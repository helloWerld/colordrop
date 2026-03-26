export type RotatedCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Convert crop from source image coords to rotated display coords. */
export function sourceToDisplayCrop(
  crop: RotatedCropRect,
  rotationDegrees: number,
): RotatedCropRect {
  const { x, y, width, height } = crop;
  switch (rotationDegrees) {
    case 90:
      return { x: y, y: 1 - x - width, width: height, height: width };
    case 180:
      return { x: 1 - x - width, y: 1 - y - height, width, height };
    case 270:
      return { x: 1 - y - height, y: x, width: height, height: width };
    default:
      return { ...crop };
  }
}

/** Convert crop from rotated display coords back to source image coords. */
export function displayToSourceCrop(
  display: RotatedCropRect,
  rotationDegrees: number,
): RotatedCropRect {
  const { x, y, width, height } = display;
  switch (rotationDegrees) {
    case 90:
      return { x: 1 - y - height, y: x, width: height, height: width };
    case 180:
      return { x: 1 - x - width, y: 1 - y - height, width, height };
    case 270:
      return { x: y, y: 1 - x - width, width: height, height: width };
    default:
      return { ...display };
  }
}
