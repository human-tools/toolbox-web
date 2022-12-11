// import { FabricJSEditor } from 'fabricjs-react';
import JSZip from 'jszip';
import { doc } from 'prettier';
import { useCallback, useEffect, useRef, useState } from 'react';
import UploadButton from '../components/UploadButton';
import Rotator from '../CreatePhotosSlideshow/Rotator';
import { readImageSizing } from '../images/helpers';
import { ImageData } from '../images/ImagePreview';
import PhotoCropper, { PhotoCropperRef } from '../images/PhotoCropper';

const BulkEditPhotos = (): JSX.Element => {
  // TODO: use original files to make sure we save files with their correct file extension.
  const [files, setFiles] = useState<File[]>([]);
  const [images, setImages] = useState<ImageData[]>([]);
  const [fileName, setFileName] = useState<string>(
    `edited-photos-${new Date().getTime()}.zip`
  );
  const cropperRefs = useRef<PhotoCropperRef[]>([]);

  const onDrop = useCallback(
    async (newFiles: File[]) => {
      setFiles((oldFiles) => [...oldFiles, ...newFiles]);
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
    [setImages, setFiles]
  );
  const onSave = useCallback(async () => {
    if (!doc) return;

    const images = cropperRefs.current.map((cropper) => {
      return cropper.getCroppedImageUrl();
    });

    const zip = new JSZip();
    for (const imageIdx in images) {
      const dataUri = images[imageIdx];
      zip.file(
        `${`${+imageIdx + 1}`.padStart(4, '0')}.jpg`,
        dataUri.substr(dataUri.indexOf(',') + 1),
        {
          base64: true,
        }
      );
    }
    const zipFile = await zip.generateAsync({ type: 'blob' });
    saveAs(zipFile, fileName);
  }, [fileName]);

  const registerPhotoCropperRef = useCallback((newRef: PhotoCropperRef) => {
    if (!newRef) return;
    if (cropperRefs.current.some((ref) => ref.image === newRef.image)) {
      const index = cropperRefs.current.findIndex(
        (ref) => ref.image === newRef.image
      );
      // Replace old reference with new one.
      cropperRefs.current[index] = newRef;
    } else {
      cropperRefs.current.push(newRef);
    }
  }, []);

  useEffect(() => {
    cropperRefs.current = [];
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="m-3 p-3 bg-green-200 rounded">
        <p>
          This tool helps you to quickly edit bunch of images at once.
          <b>
            No Data is ever uploaded to any servers. All the magic happen in
            your browser.
          </b>{' '}
          Just drag-and-drop some images, re-order your pages as you'd like and
          and then download the file!
        </p>
      </div>
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
            <div className="flex flex-col flex-grow m-3 lg:ml-0">
              <div className="flex p-3">
                <div className="h-10 w-48">
                  <UploadButton
                    onDrop={onDrop}
                    accept="image/*"
                    fullSized={false}
                  >
                    <span className="text-base">Add More Images</span>
                  </UploadButton>
                </div>

                <div className="flex-grow"></div>
              </div>

              <div className="flex flex-wrap flex-grow-1 h-full my-1 items-start content-start justify-start lg:justify-start">
                {images.map((image, index) => {
                  return (
                    <div key={index} className="m-1">
                      <PhotoCropper
                        image={image}
                        ref={registerPhotoCropperRef}
                      />
                    </div>
                  );
                })}
              </div>
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
                  Download Edited
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkEditPhotos;
