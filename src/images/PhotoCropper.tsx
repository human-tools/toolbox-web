import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import ReactCrop, { centerCrop, Crop, makeAspectCrop } from 'react-image-crop';
import { ImageData } from './ImagePreview';

const TO_RADIANS = Math.PI / 180;

interface Props {
  image: ImageData;
  onCrop?: (dataUrl: string) => void;
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
  getCroppedImageUrl(): string;
}

const PhotoCropper = forwardRef<PhotoCropperRef, Props>(function (
  { image, onCrop },
  ref
): JSX.Element {
  const [crop, setCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  // TODO: pass the aspect from parent component.
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);

  const getCroppedImageUrl = useCallback(() => {
    const imageEl = imgRef.current;
    if (!imageEl || !crop) return image.url;

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

    try {
      const base64Image = canvas.toDataURL('image/jpeg', 1);
      return base64Image;
    } catch (e) {
      console.error(e);
    }
    return image.url;
  }, [crop, image.url, rotate, scale]);

  // TODO: Use debounce memo for performance gain.
  // const croppedSrc = useMemo(() => getCroppedImageUrl(), [getCroppedImageUrl]);
  useImperativeHandle(
    ref,
    () => {
      return {
        image,
        getCroppedImageUrl,
      };
    },
    [getCroppedImageUrl, image]
  );

  // function handleToggleAspectClick() {
  //   if (aspect) {
  //     setAspect(undefined)
  //   } else if (imgRef.current) {
  //     const { width, height } = imgRef.current
  //     setAspect(16 / 9)
  //     setCrop(centerAspectCrop(width, height, 16 / 9))
  //   }
  // }

  useEffect(() => {
    if (!imgRef.current) return;
    if (!aspect) return;
    setCrop(
      centerAspectCrop(imgRef.current.width, imgRef.current.height, aspect)
    );
  }, [aspect]);
  return (
    <div className="flex flex-col items-start">
      <ReactCrop
        crop={crop}
        onChange={(pixelCrop, _) => setCrop(pixelCrop)}
        aspect={aspect}
      >
        {' '}
        <img
          ref={imgRef}
          alt="Crop me"
          src={image.url}
          style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
          className="w-40 block pointer-events-none"
        />
      </ReactCrop>
      {/* Toolbar */}
      <div className="flex flex-col">
        {/* <div>
          <label htmlFor="scale-input">Scale</label>
          <input
            id="scale-input"
            type="range"
            step={0.1}
            min={1}
            max={10}
            value={scale}
            disabled={!image.url}
            onChange={(e) => setScale(Number(e.target.value))}
          />
        </div> */}
        <div className="flex items-start w-40 py-1 px-2 flex-col border border-2">
          <label htmlFor="rotate-input" className="text-xs flex w-full">
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
        {/* <div>
          <img src={croppedSrc} className="w-40" />
        </div> */}
        {/* <div>
          <button onClick={handleToggleAspectClick}>
            Toggle aspect {aspect ? 'off' : 'on'}
          </button>
        </div> */}
      </div>
    </div>
  );
});

export default PhotoCropper;
