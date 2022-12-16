import { useCallback, useState, useEffect } from 'react';
import UploadButton from '../components/UploadButton';
import { fabric } from 'fabric'; // this also installed on your project
import { useFabricJSEditor, FabricJSCanvas } from 'fabricjs-react';

const MEME_TEXT_SHADOW = new fabric.Shadow({
  color: 'black',
  blur: 15,
});

let wasImageLoadedToCanvas = false;

const CreateMeme = (): JSX.Element => {
  const { editor, onReady } = useFabricJSEditor();
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>(
    `new-meme-${new Date().getTime()}.png`
  );

  const onDrop = useCallback(async (files) => {
    wasImageLoadedToCanvas = false;
    if (files.length === 0 || files.length > 1) return;
    setImagePath(URL.createObjectURL(files[0]));
  }, []);

  useEffect(() => {
    if (!imagePath || wasImageLoadedToCanvas || !editor) return;
    editor?.deleteAll();
    fabric.Image.fromURL(
      imagePath,
      function (oImg: any) {
        const aspectRatio = oImg.width / oImg.height;
        const width = 500;
        const height = width / aspectRatio;
        oImg.scaleToWidth(width);
        oImg.scaleToHeight(height);
        editor?.canvas.setDimensions({
          width: width,
          height: height,
        });

        editor?.canvas.sendToBack(oImg);
        wasImageLoadedToCanvas = true;
      },
      {
        selectable: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
      }
    );
  }, [imagePath, fabric, editor]);

  const onSave = useCallback(async () => {
    if (!imagePath || !editor) return;
    saveAs(
      editor.canvas.toDataURL({ format: 'png' }),
      fileName.endsWith('.png') ? fileName : `${fileName}.png`
    );
  }, [imagePath, editor, fileName]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-grow h-full w-full xl:flex-row">
        {!imagePath && (
          <div className="flex flex-col flex-grow h-full w-full lg:flex-row">
            <div className="px-3 py-3 flex-grow ">
              <UploadButton onDrop={onDrop} accept="image/*" fullSized={true} />
            </div>
          </div>
        )}
        {imagePath && (
          <div className="flex flex-col flex-grow">
            {/* Toolbar */}
            <div className="flex p-3">
              <div className="h-10 w-48 mr-2">
                <UploadButton
                  onDrop={onDrop}
                  accept="image/*"
                  fullSized={false}
                >
                  <span className="text-base">Create New Meme</span>
                </UploadButton>
              </div>
              <div>
                <button
                  className="h-10 self-end bg-gray-500 text-white px-3 py-2  hover:bg-green-700 mr-2"
                  onClick={() => {
                    const text = new fabric.Textbox('YOUR TEXT', {
                      fontFamily: 'IMPACT',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      shadow: MEME_TEXT_SHADOW,
                      fontSize: 50,
                      hasControls: true,
                      fill: '#ffffff',
                      width: 400,
                    });
                    editor?.canvas.add(text);
                  }}
                >
                  Add Text
                </button>
              </div>
              <div>
                <button
                  className="h-10 self-end bg-gray-500 text-white px-3 py-2  hover:bg-green-700 mr-2"
                  onClick={() => {
                    editor?.deleteSelected();
                  }}
                >
                  Delete Selected Text
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <FabricJSCanvas onReady={onReady} />
            </div>
            <div className="flex w-full sticky bottom-0 bg-white p-2 shadow border-black border-opacity-20 border-solid	border lg:static lg:bg-none lg:border-none lg:justify-end lg:shadow-none">
              <input
                onChange={(e) => setFileName(e.target.value)}
                type="text"
                className="flex-grow h-10 py-0 mr-2 lg:mr-5 px-2 lg:px-5  border-gray-300 placeholder-gray-200 leading-0 lg:leading-3 focus:ring-green-700 lg:max-w-sm"
                placeholder="name-your-meme.png"
              />
              <button
                onClick={onSave}
                className="h-10 self-end bg-gray-500 text-white px-3 py-2  hover:bg-green-700"
              >
                Download Meme
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateMeme;
