import { ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import { useCallback, useState, useEffect } from 'react';
import UploadButton from '../components/UploadButton';
import { fabric } from 'fabric'; // this also installed on your project
import { useFabricJSEditor, FabricJSCanvas } from 'fabricjs-react';
import { RGBColor } from 'react-color';
import ColorPickerButton, { rgbColorToCssRgba } from '../ui/ColorPickerButton';

const MEME_TEXT_SHADOW = new fabric.Shadow({
  color: 'black',
  blur: 15,
});

const FONT_SIZES = [
  1,
  2,
  4,
  8,
  12,
  16,
  24,
  32,
  36,
  40,
  48,
  60,
  64,
  80,
  96,
  128,
  160,
];

const DEFAULT_RGB_COLOR = {
  r: 0,
  g: 0,
  b: 0,
  a: 1,
};

let wasImageLoadedToCanvas = false;

const CreateMeme = (): JSX.Element => {
  const { editor, onReady } = useFabricJSEditor();
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<any>({});
  const [fontSize, setFontSize] = useState<number>(48);
  const [fontWeight, setFontWeight] = useState<string>('bold');
  const [color, setColor] = useState<RGBColor>(DEFAULT_RGB_COLOR);
  const [rotation, setRotation] = useState<number>(0);
  const [textAlign, setTextAlign] = useState<string>('center');
  const [allCaps, setAllCaps] = useState<boolean>(false);
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [flipVertical, setFlipVertical] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>(
    `new-meme-${new Date().getTime()}.png`
  );

  const onDrop = useCallback(
    async (files) => {
      wasImageLoadedToCanvas = false;
      if (files.length === 0 || files.length > 1) return;
      setImagePath(URL.createObjectURL(files[0]));
    },
    [editor]
  );

  useEffect(() => {
    if (!editor) return;
    if (!imagePath || wasImageLoadedToCanvas) return;
    loadImageToCanvas(imagePath);
  }, [imagePath, fabric, editor]);

  useEffect(() => {
    if (!editor) return;
    if (allCaps) {
      editor.canvas.on('text:changed', (e) => {
        const textObj: any = e.target;
        if (allCaps) textObj.set('text', textObj.text.toUpperCase());
      });
    } else {
      editor.canvas.off('text:changed');
    }
    return () => {
      editor.canvas.off('text:changed');
    };
  }, [allCaps, editor]);

  const loadImageToCanvas = useCallback(
    (imagePath) => {
      editor?.deleteAll();
      wasImageLoadedToCanvas = true;
      fabric.Image.fromURL(
        imagePath,
        function (oImg: any) {
          const aspectRatio = oImg.width / oImg.height;
          const width = 600;
          const height = width / aspectRatio;
          oImg.scaleToWidth(width);
          oImg.scaleToHeight(height);
          editor?.canvas.setDimensions({
            width: width,
            height: height,
          });
          setOriginalImage(oImg);
          editor?.canvas.add(oImg);
        },
        {
          selectable: false,
          hasControls: false,
          lockMovementX: true,
          lockMovementY: true,
        }
      );
    },
    [editor]
  );

  const updateSelectedEditorText = useCallback(
    (operation: string, value: string | number) => {
      if (!editor) return;
      const activeObjects: any = editor.canvas.getActiveObjects();
      if (!activeObjects) return;
      for (const activeObject of activeObjects) {
        const isTextType = activeObject.get('type') == 'textbox';
        if (isTextType) activeObject.set(operation, value);
      }
      editor.canvas.requestRenderAll();
    },
    [editor]
  );

  const applyRotateAndFlip = useCallback(
    (doItToMe: string) => {
      if (!editor || !originalImage) return;
      if (doItToMe == 'rotate') {
        const angle = rotation + 90;
        setRotation(angle);
        originalImage.rotate(angle);
      } else if (doItToMe == 'horizontal') {
        setFlipHorizontal(!flipHorizontal);
        originalImage.set('flipX', !flipHorizontal);
      } else if (doItToMe == 'vertical') {
        setFlipVertical(!flipVertical);
        originalImage.set('flipY', !flipVertical);
      }
      editor.canvas.requestRenderAll();
    },
    [editor, rotation, flipHorizontal, flipVertical]
  );

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
            <div className="flex items-center p-3">
              <div className="h-10 w-48 mr-2">
                <UploadButton
                  onDrop={onDrop}
                  accept="image/*"
                  fullSized={false}
                >
                  <div className="flex items-center text-center">
                    <ArrowUpTrayIcon className="h-5 mr-2" />
                    <span className="text-base">New Meme</span>
                  </div>
                </UploadButton>
              </div>
              <div>
                <select
                  className="border border-gray-100"
                  value={fontSize}
                  onChange={(e) => {
                    setFontSize(Number(e.target.value));
                    updateSelectedEditorText(
                      'fontSize',
                      Number(e.target.value)
                    );
                  }}
                >
                  {FONT_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ml-2">
                <ColorPickerButton
                  onChange={(color) => {
                    setColor(color);
                    updateSelectedEditorText('fill', rgbColorToCssRgba(color));
                  }}
                  color={color}
                />
              </div>
              <div>
                <select
                  className="border border-gray-100"
                  value={fontWeight}
                  onChange={(e) => {
                    setFontWeight(e.target.value);
                    updateSelectedEditorText('fontWeight', e.target.value);
                  }}
                >
                  {['bold', 'italic'].map((weight) => (
                    <option key={weight} value={weight}>
                      {weight}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="border border-gray-100"
                  value={textAlign}
                  onChange={(e) => {
                    setTextAlign(e.target.value);
                    updateSelectedEditorText('textAlign', e.target.value);
                  }}
                >
                  {['left', 'center', 'right'].map((alignment) => (
                    <option key={alignment} value={alignment}>
                      {alignment}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mr-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allCaps}
                    onClick={() => setAllCaps(!allCaps)}
                  />
                  <span className="pl-2">ALL CAPS</span>
                </label>
              </div>
              <div>
                <button
                  className="ml-2 h-10 self-end bg-gray-500 text-white px-3 py-2  hover:bg-green-700 mr-2"
                  onClick={() => {
                    const text = new fabric.Textbox('YOUR TEXT', {
                      fontFamily: 'IMPACT',
                      textAlign,
                      fontWeight,
                      fontSize,
                      fill: rgbColorToCssRgba(color),
                      shadow: MEME_TEXT_SHADOW,
                      hasControls: true,
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
                  className="ml-2 h-10 self-end bg-gray-500 text-white px-3 py-2  hover:bg-green-700 mr-2"
                  onClick={() => {
                    applyRotateAndFlip('rotate');
                  }}
                >
                  Rotate
                </button>
              </div>
              <div>
                <button
                  className={`ml-2 h-10 self-end ${
                    flipVertical ? 'bg-green-700' : 'bg-gray-500'
                  } text-white px-3 py-2  hover:bg-green-700 mr-2`}
                  onClick={() => {
                    applyRotateAndFlip('vertical');
                  }}
                >
                  Flip Vertical
                </button>
              </div>
              <div>
                <button
                  className={`ml-2 h-10 self-end ${
                    flipHorizontal ? 'bg-green-700' : 'bg-gray-500'
                  } text-white px-3 py-2  hover:bg-green-700 mr-2`}
                  onClick={() => {
                    applyRotateAndFlip('horizontal');
                  }}
                >
                  Flip Horizontal
                </button>
              </div>
              <div>
                <button
                  className="ml-2 h-10 self-end bg-gray-500 text-white px-3 py-2  hover:bg-green-700 mr-2"
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
