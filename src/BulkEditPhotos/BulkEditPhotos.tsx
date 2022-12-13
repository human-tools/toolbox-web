import JSZip from 'jszip';
import { doc } from 'prettier';
import { useCallback, useEffect, useRef, useState } from 'react';
import UploadButton from '../components/UploadButton';
import Rotator from '../CreatePhotosSlideshow/Rotator';
import { readImageSizing } from '../images/helpers';
import {
  CanvasEditorRef,
  ImageCanvasEditor,
} from '../images/ImageCanvasEditor';
import { ImageData } from '../images/ImagePreview';
import PhotoCropper, { PhotoCropperRef } from '../images/PhotoCropper';

type Tool = 'crop' | 'frame';

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
  const [top, setTop] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [right, setRight] = useState(0);
  const [left, setLeft] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>('crop');

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
        const blob = await Rotator.createRotatedImage(file);
        const url = URL.createObjectURL(blob);
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
            <div className="px-3 pb-3 flex-grow ">
              <UploadButton
                onDrop={onDrop}
                accept="image/*"
                fullSized={images.length === 0}
              />
            </div>
          )}

          {images.length > 0 && (
            <div className="flex flex-grow m-3 lg:ml-0">
              {/* Sidebar */}
              <div className="flex flex-col p-3 bg-gray-800 w-96">
                <div className="h-10 w-48">
                  <UploadButton
                    onDrop={onDrop}
                    accept="image/*"
                    fullSized={false}
                  >
                    <span className="text-base">Add More Images</span>
                  </UploadButton>
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-col my-2">
                    <div>
                      <button
                        className="h-10 self-end bg-green-500 text-white px-3 py-2 hover:bg-green-700 mr-2"
                        onClick={() => {
                          setActiveTool('crop');
                        }}
                      >
                        Crop
                      </button>
                    </div>{' '}
                    {/* Crops */}
                    {activeTool === 'crop' && (
                      <div className="flex items-center bg-green-500">
                        <div>
                          <button
                            className="h-8 text-xs self-end bg-green-500 text-white px-3 py-2 hover:bg-green-700 mr-2"
                            onClick={() => {
                              setAspect((aspect) => (aspect ? undefined : 1));
                            }}
                          >
                            Toggle Aspect
                          </button>
                        </div>{' '}
                        <div>
                          <button
                            className="h-8 text-xs self-end bg-green-500 text-white px-3 py-2 hover:bg-green-700 mr-2"
                            onClick={() => {
                              setAspect(9 / 16);
                            }}
                          >
                            Insta Story
                          </button>
                        </div>
                        <div>
                          <button
                            className="h-8 text-xs self-end bg-green-500 text-white px-3 py-2 hover:bg-green-700 mr-2"
                            onClick={() => {
                              setAspect(1);
                            }}
                          >
                            Insta Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col my-2">
                    <div>
                      <button
                        className="h-10 self-end bg-green-500 text-white px-3 py-2 hover:bg-green-700 mr-2"
                        onClick={() => {
                          setActiveTool('frame');
                        }}
                      >
                        Frame
                      </button>
                    </div>{' '}
                    {/* Crops */}
                    {activeTool === 'frame' && (
                      <div className="flex flex-wrap items-center bg-green-500">
                        <div>
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white">
                            <label
                              htmlFor="rotate-input"
                              className="text-xs flex w-full"
                            >
                              <span>Top</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{top}</span>
                            </label>
                            <input
                              className="w-full"
                              id="rotate-input"
                              type="range"
                              min={0}
                              max={200}
                              value={top}
                              onChange={(e) => setTop(Number(e.target.value))}
                            />
                          </div>{' '}
                        </div>{' '}
                        <div>
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white">
                            <label
                              htmlFor="rotate-input"
                              className="text-xs flex w-full"
                            >
                              <span>Left</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{left}</span>
                            </label>
                            <input
                              className="w-full"
                              id="rotate-input"
                              type="range"
                              min={0}
                              max={200}
                              value={left}
                              onChange={(e) => setLeft(Number(e.target.value))}
                            />
                          </div>{' '}
                        </div>{' '}
                        <div>
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white">
                            <label
                              htmlFor="rotate-input"
                              className="text-xs flex w-full"
                            >
                              <span>Bottom</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{bottom}</span>
                            </label>
                            <input
                              className="w-full"
                              id="rotate-input"
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
                        <div>
                          <div className="flex items-start w-40 py-1 px-2 flex-col text-white">
                            <label
                              htmlFor="rotate-input"
                              className="text-xs flex w-full"
                            >
                              <span>Right</span>
                              <div className="flex-grow"></div>
                              <span className="text-xs">{right}</span>
                            </label>
                            <input
                              className="w-full"
                              id="rotate-input"
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
                </div>
                <div className="flex-grow"></div>
                <div className="flex w-full sticky bottom-0 lg:static lg:bg-none lg:border-none lg:justify-end lg:shadow-none">
                  <input
                    onChange={(e) => setFileName(e.target.value)}
                    type="text"
                    className="flex-grow h-10 py-0 mr-2 lg:mr-5 px-2 lg:px-5 border-gray-300 placeholder-gray-200 leading-0 lg:leading-3 focus:ring-green-700 lg:max-w-sm"
                    placeholder="name-your-file.zip"
                  />
                  <button
                    className="h-10 self-end bg-green-500 text-white px-3 py-2 hover:bg-green-700"
                    onClick={onSave}
                  >
                    Download
                  </button>
                </div>
              </div>

              <div
                className={`flex flex-wrap flex-grow-1 h-full items-start content-start justify-start lg:justify-start ${
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
                      />
                    </div>
                  );
                })}
              </div>

              <div
                className={`flex flex-wrap flex-grow-1 h-full items-start content-start justify-start lg:justify-start ${
                  activeTool !== 'frame' ? 'hidden' : 'visible'
                }`}
              >
                {croppedCanvases.map((canvas, index) => {
                  return (
                    <div key={index} className="m-1">
                      {canvas && (
                        <ImageCanvasEditor
                          ref={(ref) => registerCanvasEditorRef(ref, index)}
                          srcCanvas={canvas}
                          frame={{
                            top,
                            left,
                            bottom,
                            right,
                          }}
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
