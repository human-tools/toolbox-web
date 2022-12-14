import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { useSortable } from '@human-tools/use-sortable';
import { useCallback, useState } from 'react';
import UploadButton from '../components/UploadButton';
import { readImageSizing } from '../images/helpers';
import { ImageData, ImagePreview } from '../images/ImagePreview';
import Rotator from './Rotator';
import { ChromePicker } from 'react-color';

const getCleanName = (fileName: string): string => {
  return fileName.replace(/([^a-zA-Z0-9]+)/gi, '-');
};

interface SlideshowConfig {
  isBlured: boolean;
  res: string;
  background: string;
}

const SLIDESHOW_COMMAND = [
  '-safe',
  '0',
  '-f',
  'concat',
  '-i',
  'out.txt',
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
];

const ASPECT_RATIOS = {
  '16:9': '1280:720',
  '9:16': '720:1280',
};

const ffmpeg = createFFmpeg({
  log: true,
});

const CreatePhotosSlideshow = (): JSX.Element => {
  const [videoSrc, setVideoSrc] = useState<string>();
  const [files, setFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [images, setImages] = useState<ImageData[]>([]);
  const [shouldShowColorPicker, toggleColorPicker] = useState<boolean>(false);
  const {
    orderedItems,
    setItems,
    setContainerRef,
    addDraggableNodeRef,
  } = useSortable<number>([], {
    dragoverClassNames: ['border-green-200', 'border-opacity-100'],
    draggingClassNames: ['opacity-10'],
  });

  const [fileName, setFileName] = useState<string>(
    `photos-slideshow-${new Date().getTime()}.mp4`
  );

  const [config, setConfig] = useState<SlideshowConfig>({
    isBlured: false,
    res: ASPECT_RATIOS['16:9'],
    background: '#000000',
  });

  const generateVideo = useCallback(async () => {
    if (orderedItems.length === 0 || isGenerating) return;
    setIsGenerating(true);

    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    ffmpeg.setProgress(({ ratio }) => {
      setProgress(parseFloat((ratio * 100).toFixed(1)));
    });

    const inputPaths: Array<string> = [];
    for (let i = 0; i < orderedItems.length; i++) {
      const itemPosition = orderedItems[i];
      const fileName = getCleanName(files[itemPosition].name);
      inputPaths.push(`file ${fileName}\nduration 1`);
      ffmpeg.FS('writeFile', fileName, await fetchFile(files[itemPosition]));

      // add the last file into the txt this is a quricky bug in ffmpeg
      // more details here in ffmpeg bug tracker https://trac.ffmpeg.org/ticket/6128
      const isLastFile = i === orderedItems.length - 1;
      if (isLastFile) {
        inputPaths.push(`file ${fileName}\nduration 0.04`);
      }
    }

    ffmpeg.FS(
      'writeFile',
      'out.txt',
      Uint8Array.from(new TextEncoder().encode(inputPaths.join('\n')))
    );

    const ffmpegRenderCommand = [...SLIDESHOW_COMMAND];
    if (config.isBlured) {
      ffmpegRenderCommand.push('-filter_complex');
      ffmpegRenderCommand.push(`split [copy][original]; \ 
        [copy] scale=${config.res}:force_original_aspect_ratio=increase,boxblur=20,crop=${config.res}[blured]; \
        [original] scale=${config.res}:force_original_aspect_ratio=decrease[scaled_original]; \ 
        [blured][scaled_original]overlay=((main_w-overlay_w)/2):((main_h-overlay_h)/2)`);
    } else {
      ffmpegRenderCommand.push('-vf');
      ffmpegRenderCommand.push(
        `scale=${config.res}:force_original_aspect_ratio=decrease,pad=${config.res}:(ow-iw)/2:(oh-ih)/2:${config.background}`
      );
    }
    ffmpegRenderCommand.push('out.mp4');
    await ffmpeg.run(...ffmpegRenderCommand);
    const data = ffmpeg.FS('readFile', 'out.mp4');
    setVideoSrc(
      URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
    );
    setIsGenerating(false);
  }, [files, isGenerating, orderedItems, config]);

  const onDrop = useCallback(
    async (newFiles: File[]) => {
      const newFilesLength = newFiles.length + files.length;
      setFiles((oldFiles) => [...oldFiles, ...newFiles]);
      setItems(new Array(newFilesLength).fill(0).map((_, index) => index));
      for (const file of newFiles) {
        const blob = await Rotator.createRotatedImage(file);
        const url = URL.createObjectURL(blob);
        const { width, height } = await readImageSizing(url);
        setImages((images) => [
          ...images,
          {
            url,
            width,
            height,
          },
        ]);
      }
    },
    [files]
  );

  const onSave = useCallback(async () => {
    if (!videoSrc) return;
    const data = ffmpeg.FS('readFile', 'out.mp4');
    saveAs(
      new Blob([data.buffer]),
      fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`
    );
  }, [fileName, videoSrc]);

  return (
    <div className="h-full flex flex-col">
      <div className="m-3 p-3 bg-green-200 rounded">
        <p>
          This tool helps you to quickly turn your photos into a video
          slideshow.{' '}
          <b>
            No Data is ever uploaded to any servers. All the magic happen in
            your browser.
          </b>{' '}
          Just drag-and-drop some photos and wait for the magic.
        </p>
      </div>
      <div className="flex flex-grow flex-col h-full w-full lg:flex-row">
        {orderedItems.length == 0 && (
          <div className="px-3 pb-3 flex-grow">
            <UploadButton
              onDrop={onDrop}
              accept="image/*"
              fullSized={orderedItems.length === 0}
            />
          </div>
        )}
        {orderedItems.length > 0 && (
          <div className="flex flex-col flex-grow m-3 lg:ml-0">
            <div className="flex p-3">
              <div className="h-10 w-48">
                <UploadButton
                  onDrop={onDrop}
                  accept="image/*"
                  fullSized={false}
                >
                  <span className="text-base">Upload New Image</span>
                </UploadButton>
              </div>
              <div>
                <button
                  onClick={() => toggleColorPicker(!shouldShowColorPicker)}
                  className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700 mx-2"
                >
                  Pick Background Color
                </button>
                {shouldShowColorPicker ? (
                  <div className="absolute z-20">
                    <ChromePicker
                      color={config.background}
                      onChange={(color) =>
                        setConfig({ ...config, background: color.hex })
                      }
                    />
                  </div>
                ) : null}
              </div>
              <div>
                <button
                  onClick={() =>
                    setConfig(() => ({ ...config, isBlured: !config.isBlured }))
                  }
                  className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700 mx-2"
                >{`${
                  !config.isBlured
                    ? 'Enable Blur Background'
                    : 'Disable Blur Background'
                }`}</button>
              </div>
            </div>
            <div className="flex flex-col flex-grow-1 relative align-middle self-center">
              {!videoSrc && (
                <div className="absolute text-center bg-black bg-opacity-50 text-white text-opacity-60 z-10 block w-full h-full flex flex-col items-center justify-center hover:text-opacity-100">
                  {isGenerating && (
                    <div className="text-2xl font-bold transform scale-150">
                      {progress}%
                    </div>
                  )}
                  {!isGenerating && (
                    <button onClick={generateVideo}>
                      <div>Click to Generate Slideshow</div>
                      <p className="text-xs w-72 mt-3">
                        Tip: You can drag to re-order your photos below to
                        change the order of the photos in the slideshow
                      </p>
                    </button>
                  )}
                </div>
              )}
              <video
                src={videoSrc}
                controls
                autoPlay={true}
                className="h-52 lg:h-96 lg:w-auto"
              />
            </div>

            <div
              className="flex flex-wrap flex-grow-1 h-full my-1 items-start content-start justify-center lg:justify-start"
              ref={setContainerRef}
            >
              {orderedItems.map((index) => {
                return (
                  <div
                    ref={addDraggableNodeRef}
                    key={index}
                    className="rounded-md overflow-hidden border-2 border-white hover:cursor-move"
                  >
                    <ImagePreview image={images[index]} />
                  </div>
                );
              })}
            </div>
            {videoSrc && (
              <div className="flex w-full sticky bottom-0 bg-white p-2 shadow border-black border-opacity-20 border-solid	border lg:static lg:bg-none lg:border-none lg:justify-end lg:shadow-none">
                <input
                  onChange={(e) => setFileName(e.target.value)}
                  type="text"
                  className="flex-grow h-10 py-0 mr-2 lg:mr-5 px-2 lg:px-5 rounded-md border-gray-300 placeholder-gray-200 leading-0 lg:leading-3 focus:ring-green-700 lg:max-w-sm"
                  placeholder="name-your-file.mp4"
                />
                <button
                  className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700"
                  onClick={onSave}
                >
                  Save Video
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePhotosSlideshow;
