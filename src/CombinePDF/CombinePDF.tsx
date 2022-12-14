import {
  PhotoIcon,
  PlusCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { useSortable } from '@human-tools/use-sortable';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';
import { useCallback, useState } from 'react';
import UploadButton from '../components/UploadButton';
import PagePreview from '../PDFViewer/PagePreview';

async function mergePdfs(files: File[], addToDoc?: PDFDocument) {
  const pdfDoc = addToDoc ? addToDoc : await PDFDocument.create();

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

async function getOrderedPdf(srcPdf: PDFDocument, order: number[]) {
  const pdfDoc = await PDFDocument.create();
  const pages = await pdfDoc.copyPages(srcPdf, srcPdf.getPageIndices());
  order.forEach((pageNumber) => pdfDoc.addPage(pages[pageNumber - 1]));
  return {
    doc: pdfDoc,
    bytes: await pdfDoc.save(),
    pageCount: pages.length,
  };
}

const CombinePDF = (): JSX.Element => {
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const [doc, setDoc] = useState<PDFDocument>();
  const [scale, setScale] = useState<number>(0.25);
  const [previewPageNumber, setPreviewPageNumber] = useState<
    number | undefined
  >(undefined);
  const {
    orderedItems: pagesOrder,
    setItems: setPagesOrder,
    setContainerRef,
    addDraggableNodeRef,
  } = useSortable<number>([], {
    dragoverClassNames: ['border-green-200', 'border-opacity-100'],
    draggingClassNames: ['opacity-10'],
  });

  const [fileName, setFileName] = useState<string>(
    `combined-pdfs-${new Date().getTime()}.pdf`
  );

  const onDrop = useCallback(
    async (files) => {
      const oldPageCount = doc?.getPageCount() || 0;
      const { bytes, pageCount, doc: newDoc } = await mergePdfs(files, doc);
      const pdf = (await getDocument(bytes).promise) as PDFDocumentProxy;

      // Calculate new page order with the added pages at the end of the order.
      // To avoid losing previously ordered indexes.
      const oldPagesOrder = pagesOrder;
      const newlyAddedPagesOrder = new Array(pageCount - oldPageCount)
        .fill(0)
        .map((_, index) => oldPageCount + index + 1);
      console.log({ oldPageCount, newlyAddedPagesOrder });
      const newOrder = [...oldPagesOrder, ...newlyAddedPagesOrder];
      setDoc(newDoc);
      setPDF(pdf);
      setPagesOrder(newOrder);
    },
    [setPagesOrder, doc, pagesOrder]
  );

  const onDelete = useCallback(
    (pageNumber: number) => {
      const newPagesOrder = [...pagesOrder];
      const indexToDelete = newPagesOrder.indexOf(pageNumber);
      newPagesOrder.splice(indexToDelete, 1);
      setPagesOrder(newPagesOrder);
      if (newPagesOrder.length === 0) {
        setPDF(undefined);
        setDoc(undefined);
      }
    },
    [pagesOrder, setPagesOrder]
  );

  const onSave = useCallback(async () => {
    if (!doc) return;
    const { bytes } = await getOrderedPdf(doc, pagesOrder);
    saveAs(
      new Blob([bytes]),
      fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
    );
  }, [doc, fileName, pagesOrder]);

  return (
    <div className="h-full flex flex-col">
      {previewPageNumber && pdf && (
        <div className="flex justify-center items-center absolute h-full w-full bg-black bg-opacity-60 z-20 top-0 overflow-auto">
          <button
            className="absolute top-0 right-0 p-4"
            onClick={() => setPreviewPageNumber(undefined)}
          >
            <XMarkIcon className="w-10 h-10 text-white" />
          </button>
          <PagePreview scale={1.25} pageNumber={previewPageNumber} pdf={pdf} />
        </div>
      )}
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
                <div className="h-10 w-56">
                  <UploadButton onDrop={onDrop} accept=".pdf" fullSized={false}>
                    <div className="flex items-center text-center">
                      <PlusCircleIcon className="h-5 mr-2" />
                      <span className="text-base">Add Files</span>
                    </div>
                  </UploadButton>
                </div>
                <div>
                  <button
                    className="h-10 self-end bg-red-600 text-white px-3 py-2 hover:bg-green-700 mx-2 text-base"
                    onClick={() => {
                      setPDF(undefined);
                      setDoc(undefined);
                      setPagesOrder([]);
                    }}
                    disabled={!pdf}
                  >
                    <div className="flex items-center text-center">
                      <XCircleIcon className="h-5 mr-2" />
                      <span className="text-base">Start Over</span>
                    </div>
                  </button>
                </div>
                <div className="flex-grow"></div>
                <div className="flex justify-start align-top items-end">
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
                </div>
              </div>
              <div
                className="flex p-2 flex-wrap flex-grow-1 h-full my-1 items-start content-start lg:justify-start"
                ref={setContainerRef}
              >
                {pagesOrder.map((pageNumber: number) => (
                  <div
                    ref={addDraggableNodeRef}
                    key={pageNumber}
                    className="relative shadow p-1 bg-white m-1 overflow-hidden border-4 border-white hover:cursor-move"
                  >
                    <div
                      onClick={(e) => onDelete(pageNumber)}
                      className="absolute right-0 p-1 text-white text-xs cursor-pointer bg-white"
                    >
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    </div>{' '}
                    <div onClick={() => setPreviewPageNumber(pageNumber)}>
                      <PagePreview
                        key={pageNumber}
                        pageNumber={pageNumber}
                        pdf={pdf}
                        scale={scale}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex w-full sticky bottom-0 bg-white p-2 shadow border-black border-opacity-20 border-solid	border lg:static lg:bg-none lg:border-none lg:justify-end lg:shadow-none">
                <input
                  onChange={(e) => setFileName(e.target.value)}
                  type="text"
                  className="flex-grow h-10 py-0 mr-2 lg:mr-5 px-2 lg:px-5 border-gray-300 placeholder-gray-200 leading-0 lg:leading-3 focus:ring-green-700 lg:max-w-sm"
                  placeholder="name-your-file.pdf"
                />
                <button
                  className="h-10 self-end bg-green-500 text-white px-3 py-2 hover:bg-green-700"
                  onClick={onSave}
                  disabled={!pdf}
                >
                  Merge & Download
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CombinePDF;
