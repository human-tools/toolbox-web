import { XCircleIcon } from '@heroicons/react/24/solid';
import { useCallback, useState } from 'react';
import { PDFDocument, PDFImage } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { getDocument } from 'pdfjs-dist';
import { PDFDocumentProxy } from '../../node_modules/pdfjs-dist/types/src/display/api';
import PagePreview from '../PDFViewer/PagePreview';
import { useSortable } from '@human-tools/use-sortable';
import UploadButton from '../components/UploadButton';

async function generatePDF(files: File[], addToDoc?: PDFDocument) {
  const pdfDoc = addToDoc ? addToDoc : await PDFDocument.create();

  for (const file of files) {
    let image: PDFImage | undefined = undefined;
    if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(await file.arrayBuffer());
    } else if (file.type === 'image/jpeg') {
      image = await pdfDoc.embedJpg(await file.arrayBuffer());
    }
    if (!image) continue;
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
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

const GeneratePDFFromImages = (): JSX.Element => {
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const [doc, setDoc] = useState<PDFDocument>();
  const [scale, setScale] = useState<number>(0.15);
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
      const oldPagesCount = doc?.getPageCount() || 0;
      const { bytes, pageCount, doc: newPdfDoc } = await generatePDF(
        files,
        doc
      );

      // Calculate new page order with the added pages at the end of the order.
      // To avoid losing previously ordered indexes.
      const pdf = (await getDocument(bytes).promise) as PDFDocumentProxy;
      const oldPagesOrder = pagesOrder;
      const newlyAddedPagesOrder = new Array(pageCount - oldPagesCount)
        .fill(0)
        .map((_, index) => oldPagesCount + index + 1);
      const newOrder = [...oldPagesOrder, ...newlyAddedPagesOrder];
      setDoc(newPdfDoc);
      setPDF(pdf);
      setPagesOrder(newOrder);
    },
    [doc, pagesOrder]
  );

  const onSave = useCallback(async () => {
    if (!doc) return;
    const { bytes } = await getOrderedPdf(doc, pagesOrder);
    saveAs(
      new Blob([bytes]),
      fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
    );
  }, [doc, fileName, pagesOrder]);

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
    [pagesOrder]
  );

  const applyScale = useCallback(
    (newScale) => {
      setScale(newScale);
    },
    [scale]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col flex-grow h-full w-full xl:flex-row">
        <div className="flex flex-col flex-grow h-full w-full lg:flex-row">
          {!pdf && (
            <div className="px-3 py-3 flex-grow ">
              <UploadButton
                onDrop={onDrop}
                accept=".png,.jpg,.jpeg"
                fullSized={!pdf}
              />
            </div>
          )}
          {pdf && (
            <div className="flex flex-col flex-grow">
              {/* Toolbar */}
              <div className="flex p-3">
                <div className="h-10 w-48">
                  <UploadButton
                    onDrop={onDrop}
                    accept=".png,.jpg,.jpeg"
                    fullSized={!pdf}
                  >
                    <span className="text-base">Add New Image</span>
                  </UploadButton>
                </div>
                <div>
                  <button
                    className="h-10 self-end bg-red-500 text-white px-3 py-2 rounded-md hover:bg-green-700 mx-2 text-base"
                    onClick={() => {
                      setPDF(undefined);
                      setDoc(undefined);
                      setScale(0.15);
                      setPagesOrder([]);
                    }}
                    disabled={!pdf}
                  >
                    Clear & Start Fresh
                  </button>
                </div>
                <div className="flex-grow"></div>
                <div>
                  <span className="px-2 text-gray-500">Preview Size</span>
                  <button
                    className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700 mx-2"
                    onClick={() => applyScale(scale / 1.15)}
                  >
                    <span>Smaller</span>
                  </button>
                  <button
                    className="h-10 self-end bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-700"
                    onClick={() => applyScale(scale * 1.15)}
                  >
                    Larger
                  </button>
                </div>
              </div>
              <div
                className="flex p-2 flex-wrap flex-grow-1 h-full my-1 items-start content-start justify-center lg:justify-start"
                ref={setContainerRef}
              >
                {pagesOrder.map((pageNumber: number) => (
                  <div
                    ref={addDraggableNodeRef}
                    key={pageNumber}
                    className="relative shadow p-1 bg-white m-1 rounded-md overflow-hidden border-4 border-white hover:cursor-move"
                  >
                    <div
                      onClick={(e) => onDelete(pageNumber)}
                      className="absolute right-0 rounded-md p-1 text-white text-xs cursor-pointer bg-white"
                    >
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    </div>{' '}
                    <PagePreview
                      key={pageNumber}
                      scale={scale}
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
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratePDFFromImages;
