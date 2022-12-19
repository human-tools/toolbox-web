/**
 * To implement this, the DrawablePagePreview implements a double canvas
 * mechanism that overlay a drawable canvas over the PDF renderer canvas.
 */
import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  ArrowUpTrayIcon,
  CalendarDaysIcon,
  CursorArrowRaysIcon,
  LanguageIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PaintBrushIcon,
  RectangleStackIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import fabric from 'fabric';
import { FabricJSEditor } from 'fabricjs-react';
import { saveAs } from 'file-saver';
import { LineCapStyle, PDFDocument, PDFPage, rgb } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RGBColor } from 'react-color';
import { useLocalStorage } from 'usehooks-ts';
import UploadButton from '../components/UploadButton';
import FabricPagePreview from '../PDFViewer/FabricPagePreview';
import PagePreview from '../PDFViewer/PagePreview';
import ColorPickerButton, {
  cssRgbaToRgbColor,
  DEFAULT_COLOR,
  rgbColorToCssRgba,
} from '../ui/ColorPickerButton';
import ImagePickerButton from '../ui/ImagePickerButton';
import useCanvasKeyBindings from '../useCanvasKeybindings';

export interface Signature {
  svg: JSX.Element;
  json: any;
}

export interface SerializedSignature {
  image: string;
  json: string[];
}

function offsetPath(path: any[][]) {
  // Get the starting position of the path
  const startX = path[0][1];
  const startY = path[0][2];

  // Create a new empty array to hold the offsetted path
  const offsettedPath = [];

  // Loop through the original path array
  for (let i = 0; i < path.length; i++) {
    const command = path[i];
    // If the command is a moveto command, offset the starting position by the starting position of the original path
    if (command[0] === 'M') {
      offsettedPath.push([
        command[0],
        command[1] - startX,
        command[2] - startY,
      ]);
    }
    // If the command is a curve command, offset the control points and end point by the starting position of the original path
    else {
      offsettedPath.push([
        command[0],
        command[1] - startX,
        command[2] - startY,
        command[3] - startX,
        command[4] - startY,
      ]);
    }
  }

  return offsettedPath;
}

function normalizePath(path: any[][]): any[][] {
  // Calculate the top left corner of the path
  let minX = Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;

  for (const command of path) {
    for (let i = 1; i < command.length; i += 2) {
      const x = command[i];
      const y = command[i + 1];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
    }
  }

  // Translate the path so that it starts from the top left corner
  const translatedPath: number[][] = [];
  let currentX = minX;
  let currentY = minY;

  for (const command of path) {
    const type = command[0];
    const args = command.slice(1);
    let newArgs: number[] = [];

    switch (type) {
      case 'M':
        newArgs = [currentX - args[0], currentY - args[1]];
        currentX = args[0];
        currentY = args[1];
        break;
      case 'L':
        newArgs = [currentX - args[0], currentY - args[1]];
        currentX = args[0];
        currentY = args[1];
        break;
      case 'H':
        newArgs = [currentX - args[0]];
        currentX = args[0];
        break;
      case 'V':
        newArgs = [currentY - args[0]];
        currentY = args[0];
        break;
      case 'C':
        newArgs = [
          currentX - args[0],
          currentY - args[1],
          currentX - args[2],
          currentY - args[3],
          args[4] - currentX,
          args[5] - currentY,
        ];
        currentX = args[4];
        currentY = args[5];
        break;
      case 'S':
        newArgs = [
          currentX - args[0],
          currentY - args[1],
          args[2] - currentX,
          args[3] - currentY,
        ];
        currentX = args[2];
        currentY = args[3];
        break;
      case 'Q':
        newArgs = [
          currentX - args[0],
          currentY - args[1],
          args[2] - currentX,
          args[3] - currentY,
        ];
        currentX = args[2];
        currentY = args[3];
        break;
      case 'T':
        newArgs = [args[0] - currentX, args[1] - currentY];
        currentX = args[0];
        currentY = args[1];
        break;
    }
    translatedPath.push([type, ...newArgs]);
  }
  return translatedPath;
}

async function createPDF(files: File[]) {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer);
    const pages = await pdfDoc.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => pdfDoc.addPage(page));
  }
  return {
    doc: pdfDoc,
    bytes: await pdfDoc.save(),
    pageCount: pdfDoc.getPageCount(),
  };
}

function drawObjectOnPage(
  object: any,
  page: PDFPage,
  offsetLeft?: number,
  offsetTop?: number
) {
  const fill = object.fill ? cssRgbaToRgbColor(object.fill) : DEFAULT_COLOR;
  const stroke = object.stroke
    ? cssRgbaToRgbColor(object.stroke)
    : DEFAULT_COLOR;
  switch (object.type) {
    case 'group':
      console.log('drawing group', { x: object.left, y: object.top });
      object.objects.forEach((object: any) =>
        drawObjectOnPage(object, page, object.left, object.top)
      );
      break;
    // TODO: Maybe add more annotations tools (circle/rect...);
    case 'text':
    case 'textbox':
      page.drawText(object.text, {
        x: object.left,
        // Offsetting by 4px to match between the two drawer
        // because I can't figure out where the offset between
        // Fabric canvas and the PDF canvas drawing.
        // page.getHeight() is used here to transform the y location
        // since PDF coordinate space top-bottom is 0,0 vs fabric canvas
        // which has top-left 0,0
        y: page.getHeight() - object.top - object.height + object.fontSize / 4,
        lineHeight: 100 * object.lineHeight * object.fontSize,
        color: rgb(fill.r / 255.0, fill.g / 255.0, fill.b / 255.0),
        opacity: fill.a,
        size: object.fontSize * object.scaleX,
      });
      break;
    case 'path':
      console.log(object);
      page.moveTo(0, page.getHeight());
      const xSign = Math.sign(object.path[0][1] - object.path[1][1]);
      const ySign = Math.sign(object.path[0][2] - object.path[1][2]);
      console.log({ xSign, ySign });
      const offsetedPath = offsetPath(object.path);
      console.log(offsetedPath);
      const path = offsetedPath
        .map((commandArr: (string | number)[]) => commandArr.join(' '))
        .join(' ');
      page.drawSvgPath(path, {
        borderLineCap: LineCapStyle.Round,
        borderColor: rgb(stroke.r / 255.0, stroke.g / 255.0, stroke.b / 255.0),
        borderOpacity: stroke.a,
        borderWidth: object.strokeWidth,
        x:
          object.left + (xSign > 0 ? object.width : 0) + object.strokeWidth / 2,
        y:
          page.getHeight() -
          object.top -
          (ySign > 0 ? object.height / 2 : 0) -
          object.strokeWidth / 2,
      });
      break;
  }
}

async function drawFabricObjectsOnAllPages(
  pdfDoc: PDFDocument,
  fabricObjects: { [index: number]: any }
) {
  // Copy PDF to a new document to avoid mutating it and locking us from
  // making further edits.
  const newPdfDoc = await PDFDocument.create();
  const pages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
  pages.forEach((page, index) => {
    newPdfDoc.addPage(page);
    const json = fabricObjects[index + 1];
    json?.objects.forEach((object: any) => {
      drawObjectOnPage(object, page);
    });
  });

  return {
    bytes: await newPdfDoc.save(),
    doc: newPdfDoc,
  };
}

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

const QuickSignPDF = (): JSX.Element => {
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const [doc, setDoc] = useState<PDFDocument>();
  const [activePage, setActivePage] = useState<number>(1);
  const [scale, setScale] = useState(1.5);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(16);
  const [color, setColor] = useState<RGBColor>(DEFAULT_RGB_COLOR);
  const [savedSignatures, setSavedSignatures] = useLocalStorage<
    SerializedSignature[]
  >('savedSignatures', []);

  // Tracks all pages drawables so we can burn them to the PDF once the user
  // click Sign & Download. This also allows humans to continue editing different
  // pages.
  const [pagesFabricObjects, setPagesFabricObjects] = useState<{
    [index: number]: any;
  }>({});

  const [fileName, setFileName] = useState<string>(
    `signed-pdfs-${new Date().getTime()}.pdf`
  );

  const editorRef = useRef<FabricJSEditor>(null);
  useCanvasKeyBindings(editorRef.current);

  const updatePageObjects = useCallback(() => {
    setPagesFabricObjects((currentPagesObjects) => {
      if (!editorRef.current) return currentPagesObjects;
      const objects = { ...currentPagesObjects };
      objects[activePage] = editorRef.current.canvas.toJSON();
      return objects;
    });
  }, [activePage]);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.canvas.loadFromJSON(
      pagesFabricObjects[activePage],
      () => {
        console.log('JSON Loaded');
      }
    );
  }, [activePage]);

  const onDrop = useCallback(async (files) => {
    setActivePage(1);
    setPagesFabricObjects({});
    editorRef.current?.deleteAll();
    const { bytes, doc: newDoc } = await createPDF(files);
    const pdf = (await getDocument(bytes).promise) as PDFDocumentProxy;
    setDoc(newDoc);
    setPDF(pdf);
  }, []);

  const nextPage = useCallback(async () => {
    if (!editorRef.current) return;
    editorRef.current.deleteAll();
    setActivePage((page) => Math.min(doc?.getPageCount() || 1, page + 1));
  }, [doc]);

  const prevPage = useCallback(async () => {
    if (!editorRef.current) return;
    editorRef.current.deleteAll();
    setActivePage((page) => Math.max(1, page - 1));
  }, []);

  const goToSelectedPage = useCallback(
    async (selectedPageNumber) => {
      if (!editorRef.current || selectedPageNumber == activePage) return;
      editorRef.current.deleteAll();
      setActivePage(selectedPageNumber);
    },
    [activePage]
  );

  const signFabric = useCallback(async () => {
    if (!doc) return;
    if (!editorRef.current) return;

    const { bytes, doc: signedDoc } = await drawFabricObjectsOnAllPages(
      doc,
      pagesFabricObjects
    );

    const pdf = (await getDocument(bytes).promise) as PDFDocumentProxy;
    return { bytes, pdf, doc: signedDoc };
  }, [doc, pagesFabricObjects]);

  const onSave = useCallback(async () => {
    if (!doc) return;
    if (!editorRef.current) return;
    const signedResults = await signFabric();
    if (!signedResults) return;
    setIsDrawingMode(false);
    saveAs(
      new Blob([signedResults.bytes]),
      fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
    );
  }, [doc, fileName, signFabric]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    function onMouseUp() {
      console.log(editor?.canvas.getObjects());
      updatePageObjects();
    }
    editor.canvas.on('mouse:up', onMouseUp);
    editor.canvas.isDrawingMode = isDrawingMode;
    editor.canvas.freeDrawingBrush.width = fontSize;
    editor.canvas.freeDrawingBrush.color = rgbColorToCssRgba(color);

    return () => {
      if (!editor) return;
      editor.canvas.off('mouse:up', onMouseUp);
    };
  }, [color, fontSize, isDrawingMode, updatePageObjects]);

  const onSaveSelected = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const selectedObjects = editor.canvas.getActiveObjects();
    if (!selectedObjects || selectedObjects.length === 0) return;

    editor.canvas.discardActiveObject();
    const json = selectedObjects.map((object: any) => object.toJSON());

    // Group to get the preview data uri. Ungroup right away because there's a bug
    // with Fabric where the selection box act wonky after grouping.
    const selectedGroup = new fabric.fabric.Group(selectedObjects);
    const image = selectedGroup.toDataURL({
      format: 'png',
    });

    selectedGroup.ungroupOnCanvas();
    for (const selectedObj of selectedGroup.getObjects()) {
      editor.canvas.remove(selectedObj);
      editor.canvas.add(selectedObj);
    }

    const selectedSignature = {
      json,
      image,
    };

    setSavedSignatures((savedSignatures) => [
      ...savedSignatures,
      selectedSignature,
    ]);
  }, [setSavedSignatures]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col flex-grow h-full w-full xl:flex-row">
        <div className="flex flex-col flex-grow h-full w-full lg:flex-row">
          {!pdf && (
            <div className="px-3 py-3 flex-grow ">
              <UploadButton onDrop={onDrop} accept=".pdf" fullSized={!pdf} />
            </div>
          )}
          {pdf && (
            <div className="flex flex-col flex-grow">
              {/* Toolbar */}
              <div className="flex items-center p-3">
                <div className="h-10 w-48">
                  <UploadButton onDrop={onDrop} accept=".pdf" fullSized={false}>
                    <div className="flex items-center text-center">
                      <ArrowUpTrayIcon className="h-5 mr-2" />
                      <span className="text-base">Sign a New File</span>
                    </div>
                  </UploadButton>
                </div>
                <div className="text-gray-200 text-xl mx-2"> | </div>
                <div>
                  <select
                    className="border border-gray-100"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  >
                    {FONT_SIZES.map((size) => (
                      <option value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div className="ml-2">
                  <ColorPickerButton
                    onChange={(color) => setColor(color)}
                    color={color}
                  />
                </div>
                <div className="text-gray-200 text-xl mx-2"> | </div>
                <button
                  className=" text-gray-500 hover:text-green-700"
                  onClick={() => setIsDrawingMode(false)}
                >
                  <CursorArrowRaysIcon className="w-5 mr-2" />
                </button>
                <button
                  className="text-gray-500 py-2 hover:text-green-700"
                  onClick={() => {
                    if (!editorRef.current) return;
                    setIsDrawingMode(false);
                    const text = new fabric.fabric.Textbox('Hello', {
                      fontFamily: 'Helvetica',
                      fontSize,
                      hasControls: false,
                      width: 400,
                      fill: rgbColorToCssRgba(color),
                      top: 100,
                      left: 100,
                    });
                    editorRef.current.canvas.add(text);

                    updatePageObjects();
                  }}
                >
                  <LanguageIcon className="w-5" />
                </button>
                <button
                  className="text-gray-500 mx-3 py-2 hover:text-green-700"
                  onClick={() => {
                    if (!editorRef.current) return;
                    setIsDrawingMode(false);
                    const text = new fabric.fabric.Textbox(
                      new Date().toLocaleDateString(),
                      {
                        fontFamily: 'Helvetica',
                        fontSize,
                        hasControls: false,
                        width: 400,
                        fill: rgbColorToCssRgba(color),
                        top: 100,
                        left: 100,
                      }
                    );
                    editorRef.current.canvas.add(text);

                    updatePageObjects();
                  }}
                >
                  <CalendarDaysIcon className="w-5" />
                </button>

                <button
                  className=" text-gray-500 hover:text-green-700"
                  onClick={() => {
                    if (!editorRef.current) return;
                    setIsDrawingMode((isDrawingMode) => !isDrawingMode);
                  }}
                >
                  {isDrawingMode ? (
                    <PaintBrushIcon className="w-5" fill="text-green-500" />
                  ) : (
                    <PaintBrushIcon className="w-5" />
                  )}
                </button>
                <div className="text-gray-200 text-xl mx-2"> | </div>
                <button
                  className="flex  text-gray-500 items-center hover:text-green-700"
                  onClick={() => {
                    editorRef.current?.deleteAll();
                    updatePageObjects();
                  }}
                >
                  <TrashIcon className="w-5 mr-1" />
                  <span>All</span>
                </button>
                <button
                  className="flex text-gray-500 ml-2 items-center hover:text-green-700"
                  onClick={() => {
                    editorRef.current?.deleteSelected();
                    updatePageObjects();
                  }}
                >
                  <TrashIcon className="w-5 mr-1" />
                  <span>Selected</span>
                </button>

                <div className="text-gray-200 text-xl mx-2"> | </div>
                <button
                  className="flex text-gray-500 items-center hover:text-green-700"
                  onClick={() => {
                    onSaveSelected();
                  }}
                >
                  <RectangleStackIcon className="w-5 mr-1" />
                  <span>Save Selected</span>
                </button>
                <div className="text-gray-500 hover:text-green-700 ml-2">
                  <ImagePickerButton
                    showDelete={true}
                    onDelete={(index: number) => {
                      setSavedSignatures((savedSignatures) => {
                        const newSignatures = [...savedSignatures];
                        newSignatures.splice(index, 1);
                        return newSignatures;
                      });
                    }}
                    onPick={(index: number) => {
                      const signatureToInsert = savedSignatures[index];
                      const json = signatureToInsert.json;
                      const prevObj = editorRef.current?.canvas.toObject();
                      const newObj = {
                        ...prevObj,
                        objects: [...prevObj.objects, ...json],
                      };
                      editorRef.current?.canvas.loadFromJSON(newObj, () => {
                        updatePageObjects();
                      });
                    }}
                    images={savedSignatures.map(
                      (s: SerializedSignature) => s.image
                    )}
                  />
                </div>

                <div className="flex-grow"></div>
                <div className="flex items-center">
                  <button
                    disabled={!pdf || activePage > (doc?.getPageCount() || 1)}
                    className={` text-gray-500 px-1 ${
                      activePage <= 1
                        ? 'cursor-not-allowed	'
                        : 'hover:text-green-700'
                    }`}
                    onClick={prevPage}
                  >
                    <ArrowLeftCircleIcon className="w-5" />
                  </button>
                  <span className="px-2 text-gray-500">
                    Page ({activePage} of {doc?.getPageCount()})
                  </span>
                  <button
                    disabled={!pdf || activePage >= (doc?.getPageCount() || 1)}
                    className={` text-gray-500 px-1  ${
                      activePage >= doc!.getPageCount()
                        ? 'cursor-not-allowed	'
                        : 'hover:text-green-700'
                    }`}
                    onClick={nextPage}
                  >
                    <ArrowRightCircleIcon className="w-5" />
                  </button>
                  <div className="text-gray-200 text-xl mx-2"> | </div>

                  <button
                    className="h-8 text-gray-500 px-1 hover:text-green-700"
                    onClick={() => setScale((scale) => scale / 1.2)}
                    disabled={!pdf}
                  >
                    <MagnifyingGlassMinusIcon className="w-5" />
                  </button>
                  <button
                    className="h-8 text-gray-500 px-1 hover:text-green-700"
                    onClick={() => setScale((scale) => scale * 1.2)}
                    disabled={!pdf}
                  >
                    <MagnifyingGlassPlusIcon className="w-5" />
                  </button>
                </div>
              </div>
              {pdf && (
                <div className="flex flex-row justify-center">
                  <div className="flex flex-col max-h-screen overflow-auto mx-8">
                    {new Array(pdf.numPages).fill(0).map((_, index) => (
                      <div
                        className="cursor-pointer relative m-2 shadow"
                        onClick={() => goToSelectedPage(index + 1)}
                      >
                        <PagePreview
                          scale={0.25}
                          key={index + 1}
                          pageNumber={index + 1}
                          pdf={pdf}
                        />
                        <div
                          className={`text-center absolute w-full bg-opacity-50 bottom-0 text-xs p-2 ${
                            activePage === index + 1
                              ? 'bg-green-700 text-white'
                              : 'bg-white'
                          }`}
                        >
                          {' '}
                          Page {index + 1}{' '}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="shadow m-2">
                    <FabricPagePreview
                      scale={scale}
                      pageNumber={activePage}
                      pdf={pdf}
                      ref={editorRef}
                    />
                  </div>
                </div>
              )}
              <div className="flex w-full sticky bottom-0 bg-white p-2 shadow border-black border-opacity-20 border-solid	border lg:static lg:bg-none lg:border-none lg:justify-end lg:shadow-none">
                <input
                  onChange={(e) => setFileName(e.target.value)}
                  type="text"
                  className="flex-grow h-10 py-0 mr-2 lg:mr-5 px-2 lg:px-5  border-gray-300 placeholder-gray-200 leading-0 lg:leading-3 focus:ring-green-700 lg:max-w-sm"
                  placeholder="name-your-file.pdf"
                />
                <button
                  className="h-10 self-end bg-gray-500 text-white px-3 py-2  hover:bg-green-700"
                  onClick={onSave}
                  disabled={!pdf}
                >
                  Sign & Download
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickSignPDF;
