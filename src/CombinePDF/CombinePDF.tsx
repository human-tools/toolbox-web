import { useCallback, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { getDocument } from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';
import PagePreview from '../PDFViewer/PagePreview';
import { useSortable } from '@human-tools/use-sortable';
import UploadButton from '../components/UploadButton';

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

// This is a work around for the pdf-js library because removePage method does not delete all
// of the page's objects from the document but removes the reference from page tree
// there's a feature request here https://github.com/Hopding/pdf-lib/issues/140
// once it's resolved this work around can be deprecated.
async function removePageFromPdf(doc: PDFDocument, currentPages: number[]) {
  const modifiedDoc = await PDFDocument.create();

  const pages = await modifiedDoc.copyPages(doc, currentPages);
  pages.forEach((page) => modifiedDoc.addPage(page));

  return {
    modifiedDoc,
    bytes: await modifiedDoc.save(),
    pageCount: modifiedDoc.getPageCount(),
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
      const { bytes, pageCount, doc: newDoc } = await mergePdfs(files, doc);
      const pdf = (await getDocument(bytes).promise) as PDFDocumentProxy;

      // Calculate new page order with the added pages at the end of the order.
      // To avoid losing previously ordered indexes.
      const oldPagesOrder = pagesOrder;
      const oldPageCount = oldPagesOrder.length;
      const newlyAddedPagesOrder = new Array(pageCount - oldPageCount)
        .fill(0)
        .map((_, index) => oldPageCount + index + 1);
      const newOrder = [...oldPagesOrder, ...newlyAddedPagesOrder];
      setDoc(newDoc);
      setPDF(pdf);
      setPagesOrder(newOrder);
    },
    [setPagesOrder, doc, pagesOrder]
  );

  const onSave = useCallback(async () => {
    if (!doc) return;
    const { bytes } = await getOrderedPdf(doc, pagesOrder);
    saveAs(
      new Blob([bytes]),
      fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
    );
  }, [doc, fileName, pagesOrder]);

  const onDelete = async (pageNumber: number) => {
    if (!doc) return;

    const currentPages = new Array(doc.getPageCount())
      .fill(0)
      .map((_, index) => index)
      .filter((page) => page !== pageNumber - 1);

    // A document needs to at least have one page
    // @(TODO) show error message
    if (currentPages.length < 1) return;

    const { modifiedDoc, bytes, pageCount } = await removePageFromPdf(
      doc,
      currentPages
    );

    const pdf = (await getDocument(bytes).promise) as PDFDocumentProxy;

    const newPageOrder = new Array(pageCount)
      .fill(0)
      .map((_, index) => index + 1);

    setPagesOrder(newPageOrder);

    setDoc(modifiedDoc);
    setPDF(pdf);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="m-3 p-3 bg-green-200 rounded">
        <p>
          This tool helps you to quickly merge bunch of PDF files into one.{' '}
          <b>
            No Data is ever uploaded to any servers. All the magic happen in
            your browser.
          </b>{' '}
          Just drag-and-drop some PDF files, re-order your pages as you'd like
          and then download the file!
        </p>
      </div>
      <div className="flex flex-col flex-grow h-full w-full xl:flex-row">
        <div className="flex flex-col flex-grow h-full w-full lg:flex-row">
          <div className="px-3 pb-3 flex-grow ">
            <UploadButton onDrop={onDrop} accept=".pdf" fullSized={!pdf} />
          </div>
          {pdf && pdf.numPages === pagesOrder.length && (
            <div className="flex flex-col flex-grow">
              <div
                className="flex p-2 flex-wrap flex-grow-1 h-full my-1 items-start content-start justify-center lg:justify-start"
                ref={setContainerRef}
              >
                {pagesOrder.map((pageNumber: number) => (
                  <div
                    ref={addDraggableNodeRef}
                    key={pageNumber}
                    className="shadow p-1 bg-white m-1 rounded-md overflow-hidden border-4 border-white hover:cursor-move"
                  >
                    <div
                      onClick={(e) => onDelete(pageNumber)}
                      className="absolute rounded-md p-1 bg-red-600 text-white -mt-6 text-xs cursor-pointer"
                    >
                      Delete
                    </div>
                    <PagePreview
                      key={pageNumber}
                      pageNumber={pageNumber}
                      pdf={pdf}
                    />
                  </div>
                ))}
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
