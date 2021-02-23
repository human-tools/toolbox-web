import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { getDocument } from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';
import PagePreview from '../PDFViewer/PagePreview';
import { useSortable } from '@human-tools/use-sortable';

async function mergePdfs(files: File[]) {
  const pdfDoc = await PDFDocument.create();

  let pageCount = 0;
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer);
    const pages = await pdfDoc.copyPages(doc, doc.getPageIndices());
    pageCount += pages.length;
    pages.forEach((page) => pdfDoc.addPage(page));
  }
  return {
    doc: pdfDoc,
    bytes: await pdfDoc.save(),
    pageCount,
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
  const [
    orderedPages,
    setPages,
    setContainerRef,
    addDraggableRef,
  ] = useSortable<number>([], {
    dragoverClassNames: ['border-green-200', 'border-opacity-100'],
    draggingClassNames: ['opacity-10'],
  });

  const [fileName, setFileName] = useState<string>(
    `combined-pdfs-${new Date().getTime()}.pdf`
  );

  const onDrop = useCallback(
    async (files) => {
      const { bytes, pageCount, doc } = await mergePdfs(files);
      const pdf = (await getDocument(bytes).promise) as PDFDocumentProxy;
      setDoc(doc);
      setPDF(pdf);
      setPages(new Array(pageCount).fill(0).map((_, index) => index + 1));
    },
    [setPages]
  );

  const onSave = useCallback(async () => {
    if (!doc) return;
    const { bytes } = await getOrderedPdf(doc, orderedPages);
    saveAs(
      new Blob([bytes]),
      fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
    );
  }, [doc, fileName, orderedPages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex flex-col h-full">
      <div
        {...getRootProps()}
        className="p-10 bg-blue-100 rounded text-center text-blue-900 text-xl flex-grow-0 hover:bg-blue-900 hover:text-white hover:cursor-pointer "
      >
        <input {...getInputProps()} accept=".pdf" />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
      {pdf && (
        <div
          className="flex flex-wrap flex-grow-1 h-full my-1 items-start "
          ref={setContainerRef}
        >
          {orderedPages.map((pageNumber: number) => (
            <div
              ref={addDraggableRef}
              key={pageNumber}
              className="shadow m-1 rounded-md overflow-hidden border-4 border-white hover:cursor-move"
            >
              <PagePreview key={pageNumber} pageNumber={pageNumber} pdf={pdf} />
            </div>
          ))}
        </div>
      )}

      <div className="flex self-end justify-end flex-grow-0 ">
        {pdf && (
          <input
            onChange={(e) => setFileName(e.target.value)}
            type="text"
            className="mr-5 px-5 rounded-md border-gray-300 placeholder-gray-200 leading-3 focus:ring-green-700"
            placeholder="name-your-file.pdf"
          />
        )}
        <button
          className="group relative self-end bg-green-500 text-white px-10 py-2 rounded-2xl hover:bg-green-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
          onClick={onSave}
          disabled={!pdf}
        >
          Merge & Download
          {!pdf && (
            <span className="hidden absolute right-56 top-1 w-max bg-black bg-opacity-80 text-xs py-2 px-5 rounded-2xl group-hover:block">
              You need to upload some PDFs first!
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default CombinePDF;
