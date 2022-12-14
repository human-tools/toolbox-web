import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactCrop, { centerCrop, Crop, makeAspectCrop } from 'react-image-crop';
import { DEFAULT_ROTATION } from './defaults';
import { ImageData } from './ImagePreview';

const TO_RADIANS = Math.PI / 180;

interface Props {
  aspect?: number;
  image: ImageData;
  onCrop?: () => void;
  previewSize?: number;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: 'px',
        width: 100,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export interface PhotoCropperRef {
  image: ImageData;
  canvas?: HTMLCanvasElement;
}

const PhotoCropper = forwardRef<PhotoCropperRef, Props>(function (
  { image, onCrop, aspect, previewSize = 250 },
  ref
): JSX.Element {
  const [crop, setCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(DEFAULT_ROTATION);
  const imgRef = useRef<HTMLImageElement>(null);

  const canvas = useMemo(() => {
    const imageEl = imgRef.current;
    if (!imageEl || !crop) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = imageEl.naturalWidth / imageEl.width;
    const scaleY = imageEl.naturalHeight / imageEl.height;
    // devicePixelRatio slightly increases sharpness on retina devices
    // at the expense of slightly slower render times and needing to
    // size the image back down if you want to download/upload and be
    // true to the images natural size.
    // const pixelRatio = window.devicePixelRatio;
    // const pixelRatio = 1;

    canvas.width = Math.min(
      Math.floor(crop.width * scaleX),
      imageEl.naturalWidth
    );
    canvas.height = Math.min(
      Math.floor(crop.height * scaleY),
      imageEl.naturalHeight
    );

    // ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    const rotateRads = rotate * TO_RADIANS;
    const centerX = imageEl.naturalWidth / 2;
    const centerY = imageEl.naturalHeight / 2;

    ctx.save();

    // 5) Move the crop origin to the canvas origin (0,0)
    ctx.translate(-cropX, -cropY);
    // // 4) Move the origin to the center of the original position
    ctx.translate(centerX, centerY);
    // // 3) Rotate around the origin
    ctx.rotate(rotateRads);
    // // 2) Scale the image
    ctx.scale(scale, scale);
    // // 1) Move the center of the image to the origin (0,0)
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(
      imageEl,
      0,
      0,
      imageEl.naturalWidth,
      imageEl.naturalHeight,
      0,
      0,
      imageEl.naturalWidth,
      imageEl.naturalHeight
    );

    ctx.restore();

    return canvas;
  }, [crop, rotate, scale]);
  useImperativeHandle(
    ref,
    () => {
      return {
        image,
        canvas,
      };
    },
    [canvas, image]
  );

  useLayoutEffect(() => {
    if (!imgRef.current) return;
    if (!aspect) {
      return onCrop && onCrop();
    }
    setCrop(
      centerAspectCrop(imgRef.current.width, imgRef.current.height, aspect)
    );
    onCrop && onCrop();
  }, [aspect, onCrop]);
  return (
    <div className="flex flex-col items-start">
      <ReactCrop
        crop={crop}
        onChange={(pixelCrop, _) => {
          setCrop(pixelCrop);
          onCrop && onCrop();
        }}
        aspect={aspect}
        onComplete={() => onCrop && onCrop()}
      >
        {' '}
        <img
          ref={imgRef}
          alt="Crop me"
          src={image.url}
          style={{
            transform: `scale(${scale}) rotate(${rotate}deg)`,
            height: previewSize,
          }}
          className="block pointer-events-none"
        />
      </ReactCrop>
      {/* Toolbar */}
      <div className="flex flex-col w-full">
        <div className="flex items-start w-full py-1 px-2 flex-col border border-2">
          <label
            htmlFor="rotate-input"
            className="text-xs flex w-full"
            onDoubleClick={() => setRotate(DEFAULT_ROTATION)}
          >
            <span>Rotate</span>
            <div className="flex-grow"></div>
            <span className="text-xs">{rotate}˚</span>
          </label>
          <input
            className="w-full"
            id="rotate-input"
            type="range"
            min={-180}
            max={180}
            value={rotate}
            disabled={!image.url}
            onChange={(e) =>
              setRotate(Math.min(180, Math.max(-180, Number(e.target.value))))
            }
          />
        </div>
      </div>
    </div>
  );
});

export default PhotoCropper;
