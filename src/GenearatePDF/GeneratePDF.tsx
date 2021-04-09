import { useCallback, useState } from 'react';
import { PDFDocument, PDFImage } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { getDocument } from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';
import PagePreview from '../PDFViewer/PagePreview';
import { useSortable } from '@human-tools/use-sortable';
import UploadButton from '../components/UploadButton';

async function generatePDF(files: File[], addToDoc?: PDFDocument) {
  console.log(files, addToDoc);
  const pdfDoc = addToDoc ? addToDoc : await PDFDocument.create();
  console.log(pdfDoc);

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
  const {
    orderedItems: orderedPages,
    setItems: setPages,
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
      const { bytes, pageCount, doc: newPdfDoc } = await generatePDF(
        files,
        doc
      );
      const pdf = (await getDocument(bytes).promise) as PDFDocumentProxy;
      setDoc(newPdfDoc);
      setPDF(pdf);
      setPages(new Array(pageCount).fill(0).map((_, index) => index + 1));
    },
    [setPages, doc]
  );

  const onSave = useCallback(async () => {
    if (!doc) return;
    const { bytes } = await getOrderedPdf(doc, orderedPages);
    saveAs(
      new Blob([bytes]),
      fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
    );
  }, [doc, fileName, orderedPages]);

  return (
    <div className="h-full flex flex-col">
      <div className="m-3 p-3 bg-green-200 rounded">
        <p>
          This tool helps you to quickly merge bunch of images into one PDF
          file.{' '}
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
          <div className="px-3 pb-3 flex-grow ">
            <UploadButton
              onDrop={onDrop}
              accept=".png,.jpg,.jpeg"
              fullSized={!pdf}
            />
          </div>
          {pdf && pdf.numPages === orderedPages.length && (
            <div className="flex flex-col flex-grow">
              <div
                className="flex p-2 flex-wrap flex-grow-1 h-full my-1 items-start content-start justify-center lg:justify-start"
                ref={setContainerRef}
              >
                {orderedPages.map((pageNumber: number) => (
                  <div
                    ref={addDraggableNodeRef}
                    key={pageNumber}
                    className="shadow p-1 bg-white m-1 rounded-md overflow-hidden border-4 border-white hover:cursor-move"
                  >
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
