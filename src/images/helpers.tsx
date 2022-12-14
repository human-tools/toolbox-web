export const readImageSizing = (
  url: string
): Promise<{
  width: number;
  height: number;
}> =>
  new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = function () {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.src = url;
  });
