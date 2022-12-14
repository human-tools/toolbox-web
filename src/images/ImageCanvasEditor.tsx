import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import { GridLoader } from 'react-spinners';

interface ImageCanvasEditorProps {
  srcCanvas: HTMLCanvasElement;
  frame?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  brightness?: number;
  grayscale?: number;
  contrast?: number;
  hueRotation?: number;
  invert?: number;
  saturation?: number;
  sepia?: number;
  opacity?: number;
  blur?: number;
}

export interface CanvasEditorRef {
  srcCanvas: HTMLCanvasElement;
  outCanvas: HTMLCanvasElement | null;
}

export const ImageCanvasEditor = forwardRef<
  CanvasEditorRef,
  ImageCanvasEditorProps
>(function (
  {
    srcCanvas,
    frame = {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    brightness = 100,
    grayscale = 100,
    contrast = 100,
    hueRotation = 0,
    invert = 0,
    saturation = 100,
    sepia = 0,
    opacity = 100,
    blur = 0,
  },
  ref
): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(
    ref,
    () => {
      return {
        srcCanvas,
        outCanvas: canvasRef.current,
      };
    },
    [srcCanvas]
  );

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (srcCanvas.width === 0 || srcCanvas.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context available');
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = srcCanvas.width;
    canvas.height = srcCanvas.height;
    // ctx.scale(0.9, 0.9);
    ctx.fillStyle = '#fff';
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) opacity(${opacity}%) sepia(${sepia}%) grayscale(${grayscale}%) hue-rotate(${hueRotation}deg) saturate(${saturation}%) invert(${invert}%) blur(${blur}px)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      srcCanvas,
      -frame.left,
      -frame.top,
      srcCanvas.width,
      srcCanvas.height,
      0,
      0,
      srcCanvas.width - frame.right,
      srcCanvas.height - frame.bottom
    );
  }, [blur, brightness, contrast, frame.bottom, frame.left, frame.right, frame.top, grayscale, hueRotation, invert, opacity, saturation, sepia, srcCanvas]);
  return (
    <div className="flex justify-center">
      <div className="shadow-md m-0.5">
        {srcCanvas ? (
          <canvas
            ref={canvasRef}
            className="h-40 inline-block pointer-events-none"
          />
        ) : (
          <div className="h-40 w-32 flex justify-center items-center">
            <div className="w-9 transform scale-75">
              <GridLoader
                color={'#BFDBFE'}
                loading={true}
                size={8}
                margin="5px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
