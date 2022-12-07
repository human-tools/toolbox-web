/**
 * To implement this, the DrawablePagePreview implements a double canvas
 * mechanism that overlay a drawable canvas over the PDF renderer canvas.
 *
 * Limitations:
 *  - Once the user hits Next/Previous the current page drawings are BURNED
 *    into the PDF page and can't be undo'd or cleared.
 *    We could fix this in future if we can figure out how to load existing paths
 *    into the svg drawer library we are using. (Once we figure it out we can store
 *    the current drawn paths in array until the user is ready to burn them)
 *  - We can't currently control the scale of the PDF preview because it affects
 *    the scale the paths are affected in scaled and position.
 */

import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';
import { useCallback, useRef, useState } from 'react';
import UploadButton from '../components/UploadButton';
import DrawablePagePreview, {
  UseSvgDrawing,
} from '../PDFViewer/DrawablePagePreview';

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

async function drawSvgPaths(
  pdfDoc: PDFDocument,
  pageNumber: number,
  paths: string[]
) {
  const page = pdfDoc.getPage(pageNumber - 1);
  page.moveTo(0, page.getHeight());
  paths.forEach((path) => page.drawSvgPath(path));

  return {
    bytes: await pdfDoc.save(),
    doc: pdfDoc,
  };
}

const QuickSignPDF = (): JSX.Element => {
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const [doc, setDoc] = useState<PDFDocument>();
  const [activePage, setActivePage] = useState<number>(1);
  const [scale] = useState(1);
  const [isSigning, setIsSigning] = useState<boolean>(false);

  const [fileName, setFileName] = useState<string>(
    `signed-pdfs-${new Date().getTime()}.pdf`
  );

  const pdfDrawRef = useRef<UseSvgDrawing>(null);

  const onDrop = useCallback(async (files) => {
    const { bytes, doc: newDoc } = await createPDF(files);
    const pdf = (await getDocument(bytes).promise) as PDFDocumentProxy;
    setDoc(newDoc);
    setPDF(pdf);
  }, []);

  const sign = useCallback(async () => {
    if (!doc) return;
    if (!pdfDrawRef.current) return;
    const svg = pdfDrawRef.current.getSvgXML() as string;
    const p = new DOMParser();
    const d = p.parseFromString(svg, 'text/html');
    const pathElements = d.querySelectorAll('svg path');
    const paths = Array.from(pathElements)
      .map((pathEl) => pathEl.getAttribute('d'))
      .filter((path) => !!path) as string[];

    const { bytes, doc: signedDoc } = await drawSvgPaths(
      doc,
      activePage,
      paths
    );
    const pdf = (await getDocument(bytes).promise) as PDFDocumentProxy;
    setDoc(signedDoc);
    setPDF(pdf);
  }, [activePage, doc]);

  const onSave = useCallback(async () => {
    if (!doc) return;
    await sign();
    pdfDrawRef.current?.clear();
    const bytes = await doc.save();
    saveAs(
      new Blob([bytes]),
      fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
    );
  }, [doc, fileName, sign]);

  // Add mouse events to draw location of the signature.

  const nextPage = useCallback(async () => {
    setIsSigning(true);
    await sign();

    // For some reason PDF lib is still busy after waiting for drawing PDFs
    // This is hacky until we figure out how can we wait for the previous
    // operation to finish.
    setTimeout(() => {
      pdfDrawRef.current?.clear();
      setActivePage((page) => Math.min(doc?.getPageCount() || 1, page + 1));
      setIsSigning(false);
    }, 1000);
  }, [doc, sign]);

  const prevPage = useCallback(async () => {
    setIsSigning(true);
    await sign();
    // For some reason PDF lib is still busy after waiting for drawing PDFs
    // This is hacky until we figure out how can we wait for the previous
    // operation to finish.
    setTimeout(() => {
      pdfDrawRef.current?.clear();
      setActivePage((page) => Math.max(1, page - 1));
      setIsSigning(false);
    }, 1000);
  }, [sign]);

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
                    <span className="text-base">Upload New Files</span>
                  </UploadButton>
                </div>
                <div>
                  <button
                    className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700 mx-2"
                    onClick={() => pdfDrawRef.current?.clear()}
                  >
                    Clear
                  </button>
                </div>
                <div>
                  <button
                    className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700 mx-2"
                    onClick={() => pdfDrawRef.current?.undo()}
                  >
                    Undo
                  </button>
                </div>
                <div className="flex-grow"></div>
                <div>
                  <span className="px-2 text-gray-500">
                    Page ({activePage} of {doc?.getPageCount()})
                  </span>
                  <button
                    disabled={
                      isSigning ||
                      !pdf ||
                      activePage > (doc?.getPageCount() || 1)
                    }
                    className={`h-10 self-end text-white px-3 py-2 rounded-md mx-2 ${
                      activePage <= 1 || isSigning
                        ? 'bg-gray-200 cursor-not-allowed	'
                        : 'bg-green-500 hover:bg-green-700'
                    }`}
                    onClick={prevPage}
                  >
                    <span>Previous</span>
                  </button>
                  <button
                    disabled={
                      isSigning ||
                      !pdf ||
                      activePage >= (doc?.getPageCount() || 1)
                    }
                    className={`h-10 self-end text-white px-3 py-2 rounded-md ${
                      activePage >= doc!.getPageCount() || isSigning
                        ? 'bg-gray-200 cursor-not-allowed	'
                        : 'bg-green-500 hover:bg-green-700'
                    }`}
                    onClick={nextPage}
                  >
                    Next
                  </button>
                </div>
                {/* TODO(fix): Page scale would affect the drawn SVG scales and position */}
                {/* <div>
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
                </div> */}
              </div>
              {pdf && (
                <div className="flex justify-center items-center">
                  <DrawablePagePreview
                    scale={scale}
                    pageNumber={activePage}
                    pdf={pdf}
                    ref={pdfDrawRef}
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
