/**
 * To implement this, the DrawablePagePreview implements a double canvas
 * mechanism that overlay a drawable canvas over the PDF renderer canvas.
 */
import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  PhotoIcon,
} from '@heroicons/react/24/solid';
import fabric from 'fabric';
import { FabricJSEditor } from 'fabricjs-react';
import { saveAs } from 'file-saver';
import { PDFDocument, rgb } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import UploadButton from '../components/UploadButton';
import FabricPagePreview from '../PDFViewer/FabricPagePreview';
import PagePreview from '../PDFViewer/PagePreview';

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
      switch (object.type) {
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
            y: page.getHeight() - object.top - object.height + 4,
            lineHeight: object.lineHeight,
            color: rgb(0, 0, 0),
            size: object.fontSize * object.scaleX,
          });
          break;
        case 'path':
          page.moveTo(0, page.getHeight());
          const path = object.path
            .map((commandArr: (string | number)[]) => commandArr.join(' '))
            .join(' ');
          page.drawSvgPath(path);
          break;
      }
    });
  });

  return {
    bytes: await newPdfDoc.save(),
    doc: newPdfDoc,
  };
}

const QuickSignPDF = (): JSX.Element => {
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const [doc, setDoc] = useState<PDFDocument>();
  const [activePage, setActivePage] = useState<number>(1);
  const [scale, setScale] = useState(1);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);

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
      updatePageObjects();
    }
    editor.canvas.on('mouse:up', onMouseUp);
    editor.canvas.isDrawingMode = isDrawingMode;
    return () => {
      if (!editor) return;
      editor.canvas.off('mouse:up', onMouseUp);
    };
  }, [isDrawingMode, updatePageObjects]);

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
              <div className="flex p-3">
                <div className="h-10 w-48 mr-2">
                  <UploadButton onDrop={onDrop} accept=".pdf" fullSized={false}>
                    <span className="text-base">Upload New File</span>
                  </UploadButton>
                </div>
                <>
                  <div>
                    <button
                      className="h-10 self-end bg-gray-500 text-white px-3 py-2  hover:bg-green-700 mr-2"
                      onClick={() => {
                        if (!editorRef.current) return;
                        setIsDrawingMode(false);
                        const text = new fabric.fabric.Textbox('Hello', {
                          fontFamily: 'Helvetica',
                          fontSize: 16,
                          hasControls: false,
                          width: 400,
                        });
                        editorRef.current.canvas.add(text);

                        updatePageObjects();
                      }}
                    >
                      Add Text
                    </button>
                  </div>
                  <div>
                    <button
                      className="h-10 self-end bg-gray-500 text-white px-3 py-2  hover:bg-green-700 mr-2"
                      onClick={() => {
                        if (!editorRef.current) return;
                        setIsDrawingMode((isDrawingMode) => !isDrawingMode);
                      }}
                    >
                      {isDrawingMode ? 'Stop Drawing' : 'Start Drawing'}
                    </button>
                  </div>
                  <div>
                    <button
                      className="h-10 self-end bg-gray-500 text-white px-3 py-2  hover:bg-green-700 mr-2"
                      onClick={() => {
                        editorRef.current?.deleteAll();
                        updatePageObjects();
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div>
                    <button
                      className="h-10 self-end bg-gray-500 text-white px-3 py-2  hover:bg-green-700 mr-2"
                      onClick={() => {
                        editorRef.current?.deleteSelected();
                        updatePageObjects();
                      }}
                    >
                      Delete Selected
                    </button>
                  </div>
                </>

                <div className="flex-grow"></div>
                <div className="flex items-center">
                  <button
                    disabled={!pdf || activePage > (doc?.getPageCount() || 1)}
                    className={` text-gray-500 px-3 py-2 ${
                      activePage <= 1
                        ? 'cursor-not-allowed	'
                        : 'hover:text-green-700'
                    }`}
                    onClick={prevPage}
                  >
                    <ArrowLeftCircleIcon className="h-8" />
                  </button>
                  <span className="px-2 text-gray-500">
                    Page ({activePage} of {doc?.getPageCount()})
                  </span>
                  <button
                    disabled={!pdf || activePage >= (doc?.getPageCount() || 1)}
                    className={` text-gray-500 px-3 py-2  ${
                      activePage >= doc!.getPageCount()
                        ? 'cursor-not-allowed	'
                        : 'hover:text-green-700'
                    }`}
                    onClick={nextPage}
                  >
                    <ArrowRightCircleIcon className="h-8" />
                  </button>
                </div>
                <div>
                  <div className="flex justify-start align-top items-end ml-2">
                    <button
                      className="h-5 bg-gray-500 text-white px-1 hover:bg-green-700 mr-2"
                      onClick={() => setScale((scale) => scale / 1.2)}
                      disabled={!pdf}
                    >
                      <PhotoIcon className="w-3" />
                    </button>
                    <button
                      className="h-8 bg-gray-500 text-white px-1 hover:bg-green-700"
                      onClick={() => setScale((scale) => scale * 1.2)}
                      disabled={!pdf}
                    >
                      <PhotoIcon className="w-5" />
                    </button>
                  </div>{' '}
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
