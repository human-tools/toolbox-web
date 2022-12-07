import { createFFmpeg } from '@ffmpeg/ffmpeg';
import { useSortable } from '@human-tools/use-sortable';
import { useCallback, useState } from 'react';
import GridLoader from 'react-spinners/GridLoader';
import UploadButton from '../components/UploadButton';
import Rotator from './Rotator';

const getCleanName = (file: File): string => {
  return file.name.replace(/([^a-zA-Z0-9]+)/gi, '-');
};

interface ImagePreviewProps {
  image?: ImageData;
}

const ImagePreview = ({ image }: ImagePreviewProps) => {
  return (
    <div className="flex h-full justify-center items-center">
      <div className="shadow-sm m-0.5">
        {image ? (
          <img
            src={image.url}
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
};

interface ImageData {
  url: string;
  width: number;
  height: number;
}

const readImageSizing = (url: string) =>
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

const ffmpeg = createFFmpeg({
  log: true,
});

const CreatePhotosSlideshow = (): JSX.Element => {
  const [videoSrc, setVideoSrc] = useState<string>();
  const [files, setFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [images, setImages] = useState<ImageData[]>([]);
  const [correctedFileArrayBuffer, setCorrectedFileArrayBuffer] = useState<
    ArrayBuffer[]
  >([]);
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
    `photos-slideshow-${new Date().getTime()}.pdf`
  );

  const generateVideo = useCallback(async () => {
    if (orderedItems.length === 0 || isGenerating) return;
    setIsGenerating(true);
    await ffmpeg.load();

    ffmpeg.setProgress(({ ratio }) => {
      setProgress(parseFloat((ratio * 100).toFixed(1)));
    });

    for (const index of orderedItems) {
      ffmpeg.FS(
        'writeFile',
        getCleanName(files[index]),
        new Uint8Array(correctedFileArrayBuffer[index])
      );
    }

    const ffconcatPath = 'slides.ffconcat';
    const concatFileLines = ['ffconcat version 1.0']
      .concat(
        orderedItems.map((index) => {
          const slideDuration = 1;
          return `file ${getCleanName(
            files[index]
          )}\nduration ${slideDuration}`;
        })
      )
      .join('\n');

    ffmpeg.FS(
      'writeFile',
      ffconcatPath,
      Uint8Array.from(new TextEncoder().encode(concatFileLines))
    );

    const slideShowWithPaddingAndBlurredBG = `-safe 0 -i ${ffconcatPath} -filter_complex format=yuv420p,rotate=2*PI,split[in_1][in_2];[in_1]scale='if(gt(a,1024/576),1000,-1)':'if(gt(a,1024/576),-1,526)':eval=frame[scaled_video];[scaled_video]format=rgba,pad=iw+50:ih+50:(ow-iw)/2:(oh-ih)/2:color=#00000000[padded_video];[in_2]scale=1024:576:force_original_aspect_ratio=increase,crop=1024:576,boxblur=20[bg];[bg][padded_video]overlay=(W-w-10)/2:(H-h-10)/2[out] -c:v libx264 -aspect 1024/576 -map [out] out.mp4 -y`;

    await ffmpeg.run(...slideShowWithPaddingAndBlurredBG.split(' '));
    const data = ffmpeg.FS('readFile', 'out.mp4');
    setVideoSrc(
      URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
    );
    setIsGenerating(false);
  }, [correctedFileArrayBuffer, files, isGenerating, orderedItems]);

  const onDrop = useCallback(
    async (newFiles: File[]) => {
      const newFilesLength = newFiles.length + files.length;
      setFiles((oldFiles) => [...oldFiles, ...newFiles]);
      setItems(new Array(newFilesLength).fill(0).map((_, index) => index));
      for (const file of newFiles) {
        const blob = await Rotator.createRotatedImage(file);
        const url = URL.createObjectURL(blob);
        const correctedFile = await blob.arrayBuffer();
        const { width, height } = await readImageSizing(url);
        setImages((images) => [
          ...images,
          {
            url,
            width,
            height,
          },
        ]);
        setCorrectedFileArrayBuffer((correctedFileArrayBuffer) => [
          ...correctedFileArrayBuffer,
          correctedFile,
        ]);
      }
    },
    [setItems, setImages, setCorrectedFileArrayBuffer, setFiles, files]
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
        <div
          className={`px-3 pb-3 ${
            orderedItems.length === 0 ? 'flex-grow' : ''
          }`}
        >
          <UploadButton
            onDrop={onDrop}
            accept="image/*"
            fullSized={orderedItems.length === 0}
          />
        </div>
        {orderedItems.length > 0 && (
          <div className="flex flex-col flex-grow m-3 lg:ml-0">
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
                  placeholder="name-your-file.pdf"
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
