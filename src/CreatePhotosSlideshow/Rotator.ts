/**
 * Forked from: https://github.com/onurzorluer/exif-auto-rotate
 *
 * Changes made
 *   - Switched to Typescript.
 *   - Using Promises instead of callbacks.
 *   - Dropping usage of data URLs and using only Blobs.
 */
class Rotator {
  static rotateImage(
    image: HTMLImageElement,
    srcOrientation: number
  ): Promise<Blob> {
    const width = image.width;
    const height = image.height;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    // set proper canvas dimensions before transform & export
    canvas.width = width;
    canvas.height = height;

    // transform context before drawing image
    switch (srcOrientation) {
      case 2:
        ctx.transform(-1, 0, 0, 1, width, 0);
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        break;
      case 3:
        ctx.transform(-1, 0, 0, -1, width, height);
        ctx.translate(width, height);
        ctx.rotate(Math.PI);
        break;
      case 4:
        ctx.transform(1, 0, 0, -1, 0, height);
        ctx.translate(0, height);
        ctx.scale(1, -1);
        break;
      case 5:
        ctx.transform(0, 1, 1, 0, 0, 0);
        ctx.rotate(-0.5 * Math.PI);
        ctx.scale(-1, 1);
        break;
      case 6:
        ctx.transform(0, 1, -1, 0, width, 0);
        ctx.rotate(-0.5 * Math.PI);
        ctx.translate(-width, 0);
        break;
      case 7:
        ctx.transform(0, -1, -1, 0, width, height);
        ctx.rotate(-0.5 * Math.PI);
        ctx.translate(-width, height);
        ctx.scale(1, -1);
        break;
      case 8:
        ctx.transform(0, -1, 1, 0, 0, height);
        ctx.rotate(0.5 * Math.PI);
        ctx.translate(0, -height);
        break;
      default:
        break;
    }
    // draw image
    ctx.drawImage(image, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob((blob: Blob | null) => resolve(blob as Blob));
    });
  }

  static getOrientation(file: File): Promise<number> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = function (event) {
        const view = new DataView(event.target?.result as ArrayBuffer);

        if (view.getUint16(0, false) != 0xffd8) return resolve(-2);

        const length = view.byteLength;
        let offset = 2;

        while (offset < length) {
          const marker = view.getUint16(offset, false);
          offset += 2;

          if (marker == 0xffe1) {
            if (view.getUint32((offset += 2), false) != 0x45786966) {
              return resolve(-1);
            }
            const little = view.getUint16((offset += 6), false) == 0x4949;
            offset += view.getUint32(offset + 4, little);
            const tags = view.getUint16(offset, little);
            offset += 2;

            for (let i = 0; i < tags; i++)
              if (view.getUint16(offset + i * 12, little) == 0x0112)
                return resolve(view.getUint16(offset + i * 12 + 8, little));
          } else if ((marker & 0xff00) != 0xff00) break;
          else offset += view.getUint16(offset, false);
        }
        return resolve(-1);
      };

      reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
    });
  }

  static createRotatedImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      if (file.type && !file.type.includes('image')) {
        console.warn('File passed is not an image, not rotating.');
        return resolve(file);
      } else {
        reader.readAsDataURL(file);
        reader.onload = () => {
          const image = new Image();
          image.src = reader.result as string;
          image.onload = async function () {
            const orientation = await Rotator.getOrientation(file);
            if (orientation === -2) {
              console.warn('File is not jpg');
              return resolve(file);
            } else if (orientation === -1) {
              console.warn('File has no orientation metadata');
              return resolve(file);
            } else {
              const rotatedBlob = await Rotator.rotateImage(image, orientation);
              return resolve(rotatedBlob);
            }
          };
        };
        reader.onerror = (error) => {
          reject(error);
        };
      }
    });
  }
}

export default Rotator;
