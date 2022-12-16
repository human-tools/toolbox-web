import { PhotoIcon } from '@heroicons/react/24/solid';
import JSZip from 'jszip';
import { doc } from 'prettier';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RGBColor } from 'react-color';
import UploadButton from '../components/UploadButton';
import {
  DEFAULT_BLUR,
  DEFAULT_BOTTOM,
  DEFAULT_BRIGHTNESS,
  DEFAULT_CONTRAST,
  DEFAULT_FRAME_COLOR,
  DEFAULT_GRAYSCALE,
  DEFAULT_HUE_ROTATION,
  DEFAULT_INVERT,
  DEFAULT_LEFT,
  DEFAULT_OPACITY,
  DEFAULT_RIGHT,
  DEFAULT_SATURATION,
  DEFAULT_SEPIA,
  DEFAULT_TOP,
  SOCIAL_PHOTO_SIZES,
} from '../images/defaults';
import { readImageSizing } from '../images/helpers';
import {
  CanvasEditorRef,
  ImageCanvasEditor,
} from '../images/ImageCanvasEditor';
import { ImageData } from '../images/ImagePreview';
import PhotoCropper, { PhotoCropperRef } from '../images/PhotoCropper';
import ColorPickerButton, { rgbColorToCssRgba } from '../ui/ColorPickerButton';

type Tool = 'crop' | 'frame' | 'adjust';

const BulkEditPhotos = (): JSX.Element => {
  // TODO: use original files to make sure we save files with their correct file extension.
  const [files, setFiles] = useState<File[]>([]);
  const [images, setImages] = useState<ImageData[]>([]);
  const [fileName, setFileName] = useState<string>(
    `edited-photos-${new Date().getTime()}.zip`
  );
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [croppedCanvases, setCroppedCanvases] = useState<
    (HTMLCanvasElement | undefined)[]
  >([]);
  const cropperRefs = useRef<PhotoCropperRef[]>([]);
  const canvasEditorRefs = useRef<CanvasEditorRef[]>([]);
  const [top, setTop] = useState(DEFAULT_TOP);
  const [bottom, setBottom] = useState(DEFAULT_BOTTOM);
  const [right, setRight] = useState(DEFAULT_RIGHT);
  const [left, setLeft] = useState(DEFAULT_LEFT);
  const [activeTool, setActiveTool] = useState<Tool>('crop');
  const [brightness, setBrightness] = useState(DEFAULT_BRIGHTNESS);
  const [contrast, setContrast] = useState(DEFAULT_CONTRAST);
  const [blur, setBlur] = useState(DEFAULT_BLUR);
  const [grayscale, setGrayscale] = useState(DEFAULT_GRAYSCALE);
  const [hueRotation, setHueRotation] = useState(DEFAULT_HUE_ROTATION);
  const [invert, setInvert] = useState(DEFAULT_INVERT);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [saturation, setSaturation] = useState(DEFAULT_SATURATION);
  const [sepia, setSepia] = useState(DEFAULT_SEPIA);
  const [previewSize, setPreviewSize] = useState(250);
  const [frameColor, setFrameColor] = useState<RGBColor>(DEFAULT_FRAME_COLOR);
  const [downloadSizeScale, setDownloadSizeScale] = useState(1);

  const onCrop = useCallback(() => {
    const croppedCanvases = cropperRefs.current.map((cropper) => {
      return cropper.canvas;
    });
    setCroppedCanvases(croppedCanvases);
  }, []);
  const onDrop = useCallback(
    async (newFiles: File[]) => {
      setFiles((oldFiles) => [...oldFiles, ...newFiles]);
      const newImages = [...images];
      for (const file of newFiles) {
        // Dropping fixing rotation of images because it is slow.
        // Instead leave that to the user to fix with the rotation tool.
        // const blob = await Rotator.createRotatedImage(file);
        const url = URL.createObjectURL(file);
        const { width, height } = await readImageSizing(url);
        newImages.push({
          // TODO: Add a uid for finding the correct image.
          url,
          width,
          height,
        });
      }
      setImages(newImages);
    },
    [images]
  );
  const onSave = useCallback(async () => {
    if (!doc) return;

    const promises: Promise<Blob>[] = [];

    for (const idx in canvasEditorRefs.current) {
      promises.push(
        new Promise((resolve, reject) => {
          canvasEditorRefs.current[idx].outCanvas?.toBlob((blob) => {
            blob ? resolve(blob) : reject('Blob is null');
          });
        })
      );
    }
    const blobs = await Promise.all(promises);

    const zip = new JSZip();
    for (const blobIdx in blobs) {
      zip.file(`${`${+blobIdx + 1}`.padStart(4, '0')}.jpg`, blobs[blobIdx]);
    }
    const zipFile = await zip.generateAsync({ type: 'blob' });
    saveAs(zipFile, fileName);
  }, [fileName]);

  const registerPhotoCropperRef = useCallback(
    (newRef: PhotoCropperRef | null, index: number) => {
      if (!newRef) return;
      cropperRefs.current[index] = newRef;
    },
    []
  );

  const registerCanvasEditorRef = useCallback(
    (newRef: CanvasEditorRef | null, index: number) => {
      if (!newRef) return;
      canvasEditorRefs.current[index] = newRef;
    },
    []
  );

  useEffect(() => {
    cropperRefs.current = [];
    canvasEditorRefs.current = [];
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col flex-grow h-full w-full xl:flex-row">
        <div className="flex flex-col flex-grow h-full w-full lg:flex-row">
          {images.length === 0 && (
            <div className="px-3 py-3 flex-grow ">
              <UploadButton
                onDrop={onDrop}
                accept="image/*"
                fullSized={images.length === 0}
              />
            </div>
          )}

          {images.length > 0 && (
            <div className="flex flex-grow p-3 lg:ml-0">
              {/* Sidebar */}
              <div className="flex flex-col p-3 bg-gray-800 w-96">
                <div className="flex w-full mb-2">
                  <div className="h-10 w-48">
                    <UploadButton
                      onDrop={onDrop}
                      accept="image/*"
                      fullSized={false}
                    >
                      <span className="text-base">Add More Images</span>
                    </UploadButton>
                  </div>
                  <div className="flex-grow" />
                  <div className="flex items-center">
                    <div>
                      <button
                        className="h-5 self-end bg-gray-500 text-white px-1 hover:bg-green-700 mr-2"
                        onClick={() => {
                          setPreviewSize((previewSize) => previewSize / 1.2);
                        }}
                      >
                        <PhotoIcon className="w-3" />
                      </button>
                    </div>{' '}
                    <div>
                      <button
                        className="h-8 self-end bg-gray-500 text-white px-1 hover:bg-green-700"
                        onClick={() => {
                          setPreviewSize((previewSize) => previewSize * 1.2);
                        }}
                      >
                        <PhotoIcon className="w-5" />
                      </button>
                    </div>{' '}
                  </div>
                </div>
                <div className="flex flex-col">
                  {/* Crops */}
                  <div className="flex flex-col my-2">
                    <div>
                      <button
                        className="h-10 self-end bg-gray-500 text-white px-3 py-2 hover:bg-green-700 mr-2"
                        onClick={() => {
                          setActiveTool('crop');
                        }}
                      >
                        Crop
                      </button>
                    </div>{' '}
                    {activeTool === 'crop' && (
                      <div className="flex flex-col items-start bg-gray-500 px-2 py-4">
                        <div>
                          <button
                            className="h-8 text-xs self-end bg-gray-500 text-white px-3 py-2 hover:bg-green-700 mr-2"
                            onClick={() => {
                              setAspect((aspect) => (aspect ? undefined : 1));
                            }}
                          >
                            Toggle Aspect
                          </button>
                        </div>{' '}
                        <div className="text-white font-bold">
                          Popular Sizes
                        </div>
                        {SOCIAL_PHOTO_SIZES.map((size) => (
                          <div className="w-full">
                            <button
                              className="h-8 text-xs self-end bg-gray-500 text-white px-3 py-2 hover:bg-green-700 mr-2 w-full text-left"
                              onClick={() => {
                                setAspect(size.width / size.height);
                              }}
                            >
                              <div className="flex">
                                <span>{size.label}</span>
                                <span className="flex-grow"></span>{' '}
                                <span>
                                  {size.width}x{size.height}
                                </span>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Framing */}
                  <div className="flex flex-col my-2">
                    <div>
                      <button
                        className="h-10 self-end bg-gray-500 text-white px-3 py-2 hover:bg-green-700 mr-2"
                        onClick={() => {
                          // Update crops before switching to another tool.
                          onCrop();
                          setActiveTool('frame');
                        }}
                      >
                        Frame
                      </button>
                    </div>{' '}
                    {activeTool === 'frame' && (
                      <div className="flex flex-wrap items-center bg-gray-500  px-2 py-4">
                        <div className="w-full">
                          <div className="ml-2">
                            <label className="text-xs text-white">Color</label>
                            <ColorPickerButton
                              onChange={(color) => setFrameColor(color)}
                              color={frameColor}
                            />
                          </div>
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="top-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() => setTop(DEFAULT_TOP)}
                            >
                              <span>Top</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{top}</span>
                            </label>
                            <input
                              className="w-full"
                              id="top-input"
                              type="range"
                              min={0}
                              max={200}
                              value={top}
                              onChange={(e) => setTop(Number(e.target.value))}
                            />
                          </div>{' '}
                        </div>{' '}
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="left-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() => setLeft(DEFAULT_LEFT)}
                            >
                              <span>Left</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{left}</span>
                            </label>
                            <input
                              className="w-full"
                              id="left-input"
                              type="range"
                              min={0}
                              max={200}
                              value={left}
                              onChange={(e) => setLeft(Number(e.target.value))}
                            />
                          </div>{' '}
                        </div>{' '}
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="bottom-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() => setBottom(DEFAULT_BOTTOM)}
                            >
                              <span>Bottom</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{bottom}</span>
                            </label>
                            <input
                              className="w-full"
                              id="bottom-input"
                              type="range"
                              min={0}
                              max={200}
                              value={bottom}
                              onChange={(e) =>
                                setBottom(Number(e.target.value))
                              }
                            />
                          </div>{' '}
                        </div>{' '}
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="right-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() => setRight(DEFAULT_RIGHT)}
                            >
                              <span>Right</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{right}</span>
                            </label>
                            <input
                              className="w-full"
                              id="right-input"
                              type="range"
                              min={0}
                              max={200}
                              value={right}
                              onChange={(e) => setRight(Number(e.target.value))}
                            />
                          </div>{' '}
                        </div>{' '}
                      </div>
                    )}
                  </div>
                  {/* Adjust */}
                  <div className="flex flex-col my-2">
                    <div>
                      <button
                        className="h-10 self-end bg-gray-500 text-white px-3 py-2 hover:bg-green-700 mr-2"
                        onClick={() => {
                          // Update crops before switching to another tool.
                          onCrop();
                          setActiveTool('adjust');
                        }}
                      >
                        Adjust
                      </button>
                    </div>{' '}
                    {activeTool === 'adjust' && (
                      <div className="flex flex-wrap items-center bg-gray-500 px-2 py-4">
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="brightness-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() =>
                                setBrightness(DEFAULT_BRIGHTNESS)
                              }
                            >
                              <span>Brightness</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{brightness}%</span>
                            </label>
                            <input
                              className="w-full"
                              id="brightness-input"
                              type="range"
                              min={0}
                              max={300}
                              value={brightness}
                              onChange={(e) =>
                                setBrightness(Number(e.target.value))
                              }
                            />
                          </div>{' '}
                        </div>{' '}
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="grayscale-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() =>
                                setGrayscale(DEFAULT_GRAYSCALE)
                              }
                            >
                              <span>Grayscale</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{grayscale}%</span>
                            </label>
                            <input
                              className="w-full"
                              id="grayscale-input"
                              type="range"
                              min={0}
                              max={100}
                              value={grayscale}
                              onChange={(e) =>
                                setGrayscale(Number(e.target.value))
                              }
                            />
                          </div>{' '}
                        </div>{' '}
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="contrast-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() =>
                                setContrast(DEFAULT_CONTRAST)
                              }
                            >
                              <span>Contrast</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{contrast}%</span>
                            </label>
                            <input
                              className="w-full"
                              id="contrast-input"
                              type="range"
                              min={0}
                              max={300}
                              value={contrast}
                              onChange={(e) =>
                                setContrast(Number(e.target.value))
                              }
                            />
                          </div>{' '}
                        </div>{' '}
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="saturation-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() =>
                                setSaturation(DEFAULT_SATURATION)
                              }
                            >
                              <span>Saturation</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{saturation}%</span>
                            </label>
                            <input
                              className="w-full"
                              id="saturation-input"
                              type="range"
                              min={0}
                              max={300}
                              value={saturation}
                              onChange={(e) =>
                                setSaturation(Number(e.target.value))
                              }
                            />
                          </div>{' '}
                        </div>{' '}
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="sepia-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() => setSepia(DEFAULT_SEPIA)}
                            >
                              <span>Sepia</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{sepia}%</span>
                            </label>
                            <input
                              className="w-full"
                              id="sepia-input"
                              type="range"
                              min={0}
                              max={100}
                              value={sepia}
                              onChange={(e) => setSepia(Number(e.target.value))}
                            />
                          </div>{' '}
                        </div>{' '}
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="opacity-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() => setOpacity(DEFAULT_OPACITY)}
                            >
                              <span>Opacity</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{opacity}%</span>
                            </label>
                            <input
                              className="w-full"
                              id="opacity-input"
                              type="range"
                              min={0}
                              max={100}
                              value={opacity}
                              onChange={(e) =>
                                setOpacity(Number(e.target.value))
                              }
                            />
                          </div>{' '}
                        </div>{' '}
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="hue-rotation-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() =>
                                setHueRotation(DEFAULT_HUE_ROTATION)
                              }
                            >
                              <span>Hue Rotation</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{hueRotation}˚</span>
                            </label>
                            <input
                              className="w-full"
                              id="hue-rotation-input"
                              type="range"
                              min={0}
                              max={360}
                              value={hueRotation}
                              onChange={(e) =>
                                setHueRotation(Number(e.target.value))
                              }
                            />
                          </div>{' '}
                        </div>{' '}
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="invert-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() => setInvert(DEFAULT_INVERT)}
                            >
                              <span>Invert</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{invert}%</span>
                            </label>
                            <input
                              className="w-full"
                              id="invert-input"
                              type="range"
                              min={0}
                              max={100}
                              value={invert}
                              onChange={(e) =>
                                setInvert(Number(e.target.value))
                              }
                            />
                          </div>{' '}
                        </div>{' '}
                        <div className="w-full">
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                            <label
                              htmlFor="blur-input"
                              className="text-xs flex w-full"
                              onDoubleClick={() => setBlur(DEFAULT_BLUR)}
                            >
                              <span>Blur</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{blur}</span>
                            </label>
                            <input
                              className="w-full"
                              id="blur-input"
                              type="range"
                              min={0}
                              max={200}
                              value={blur}
                              onChange={(e) => setBlur(Number(e.target.value))}
                            />
                          </div>{' '}
                        </div>{' '}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-grow"></div>
                <div className="flex flex-col">
                  <div className="w-full">
                    <div className="flex items-start w-40 py-1 px-2 flex-col text-white w-full">
                      <label
                        htmlFor="downloadSizeScale-input"
                        className="text-xs flex w-full"
                        onDoubleClick={() => setDownloadSizeScale(1)}
                      >
                        <span>Download Size Scale</span>
                        <div className="flex-grow"></div>
                        <span className="text-xs">{downloadSizeScale}</span>
                      </label>
                      <input
                        className="w-full"
                        id="downloadSizeScale-input"
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={downloadSizeScale}
                        onChange={(e) =>
                          setDownloadSizeScale(Number(e.target.value))
                        }
                      />
                    </div>{' '}
                  </div>
                  <div className="flex w-full sticky bottom-0 lg:static lg:bg-none lg:border-none lg:justify-end lg:shadow-none">
                    <input
                      onChange={(e) => setFileName(e.target.value)}
                      type="text"
                      className="flex-grow h-10 py-0 mr-2 lg:mr-5 px-2 lg:px-5 border-gray-300 placeholder-gray-200 leading-0 lg:leading-3 focus:ring-green-700 lg:max-w-sm"
                      placeholder="name-your-file.zip"
                    />
                    <button
                      className="h-10 self-end bg-gray-500 text-white px-3 py-2 hover:bg-green-700"
                      onClick={onSave}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={`flex flex-wrap flex-grow-1 h-full items-start content-start justify-start px-1  lg:justify-start ${
                  activeTool !== 'crop' ? 'hidden' : 'visible'
                }`}
              >
                {images.map((image, index) => {
                  return (
                    <div key={index} className="mx-1 mb-2">
                      <PhotoCropper
                        aspect={aspect}
                        image={image}
                        ref={(ref) => registerPhotoCropperRef(ref, index)}
                        onCrop={onCrop}
                        previewSize={previewSize}
                      />
                    </div>
                  );
                })}
              </div>

              <div
                className={`flex flex-wrap flex-grow-1 h-full items-start content-start justify-start px-1 lg:justify-start ${
                  ['frame', 'adjust'].includes(activeTool)
                    ? 'visible'
                    : 'hidden'
                }`}
              >
                {croppedCanvases.map((canvas, index) => {
                  return (
                    <div key={index} className="m-1 shadow-md">
                      {canvas && (
                        <ImageCanvasEditor
                          ref={(ref) => registerCanvasEditorRef(ref, index)}
                          srcCanvas={canvas}
                          frame={{
                            top,
                            left,
                            bottom,
                            right,
                            color: rgbColorToCssRgba(frameColor),
                          }}
                          brightness={brightness}
                          grayscale={grayscale}
                          contrast={contrast}
                          hueRotation={hueRotation}
                          invert={invert}
                          saturation={saturation}
                          sepia={sepia}
                          opacity={opacity}
                          blur={blur}
                          previewSize={previewSize}
                          downloadSizeScale={downloadSizeScale}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkEditPhotos;
