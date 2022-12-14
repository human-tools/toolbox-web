/**
 * To implement this, the DrawablePagePreview implements a double canvas
 * mechanism that overlay a drawable canvas over the PDF renderer canvas.
 *
 * Limitations:
 *  - Once the user hits download the drawings are BURNED into the PDF pages and
 *    humans can no longer draw on top of it. Not sure why this happens but it seems
 *    it seems we can only burn onto the PDF once. Need investigation.
 *  - We can't currently control the scale of the PDF preview because it affects
 *    the scale the paths are affected in scaled and position.
 */

import fabric from 'fabric';
import { FabricJSEditor } from 'fabricjs-react';
import { saveAs } from 'file-saver';
import { PDFDocument, rgb } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import UploadButton from '../components/UploadButton';
import FabricPagePreview from '../PDFViewer/FabricPagePreview';

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
      <div className="m-3 p-3 bg-green-200 rounded">
        <p>
          This tool helps you to quickly sign PDF files.{' '}
          <b>
            No Data is ever uploaded to any servers. All the magic happen in
            your browser.
          </b>{' '}
          Just drag-and-drop some PDF files.
        </p>
      </div>
      <div className="flex flex-col flex-grow h-full w-full xl:flex-row">
        <div className="flex flex-col flex-grow h-full w-full lg:flex-row">
          {!pdf && (
            <div className="px-3 pb-3 flex-grow ">
              <UploadButton onDrop={onDrop} accept=".pdf" fullSized={!pdf} />
            </div>
          )}
          {pdf && (
            <div className="flex flex-col flex-grow">
              {/* Toolbar */}
              <div className="flex p-3">
                <div className="h-10 w-48">
                  <UploadButton onDrop={onDrop} accept=".pdf" fullSized={false}>
                    <span className="text-base">Upload New File</span>
                  </UploadButton>
                </div>
                <>
                  <div>
                    <button
                      className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700 mx-2"
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
                      className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700 mx-2"
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
                      className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700 mx-2"
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
                      className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700 mx-2"
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
                <div>
                  <span className="px-2 text-gray-500">
                    Page ({activePage} of {doc?.getPageCount()})
                  </span>
                  <button
                    disabled={!pdf || activePage > (doc?.getPageCount() || 1)}
                    className={`h-10 self-end text-white px-3 py-2 rounded-md mx-2 ${
                      activePage <= 1
                        ? 'bg-gray-200 cursor-not-allowed	'
                        : 'bg-green-500 hover:bg-green-700'
                    }`}
                    onClick={prevPage}
                  >
                    <span>Previous</span>
                  </button>
                  <button
                    disabled={!pdf || activePage >= (doc?.getPageCount() || 1)}
                    className={`h-10 self-end text-white px-3 py-2 rounded-md ${
                      activePage >= doc!.getPageCount()
                        ? 'bg-gray-200 cursor-not-allowed	'
                        : 'bg-green-500 hover:bg-green-700'
                    }`}
                    onClick={nextPage}
                  >
                    Next
                  </button>
                </div>
                <div>
                  <span className="px-2 text-gray-500">Page Size</span>
                  <button
                    className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700 mx-2"
                    onClick={() => setScale((scale) => scale / 1.2)}
                    disabled={!pdf}
                  >
                    <span>Smaller</span>
                  </button>
                  <button
                    className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700"
                    onClick={() => setScale((scale) => scale * 1.2)}
                    disabled={!pdf}
                  >
                    Larger
                  </button>
                </div>
              </div>
              {pdf && (
                <div className="flex justify-center items-center">
                  <FabricPagePreview
                    scale={scale}
                    pageNumber={activePage}
                    pdf={pdf}
                    ref={editorRef}
                  />
                </div>
              )}
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
