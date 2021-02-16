import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { getDocument } from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';
import PagePreview from '../PDFViewer/PagePreview';

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
    bytes: await pdfDoc.save(),
    pageCount,
  };
}
const CombinePDF = (): JSX.Element => {
  const [mergedPDFData, setMergedPDFData] = useState<Uint8Array>();
  const [pageCount, setPageCount] = useState<number>(0);
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const onDrop = useCallback(async (files) => {
    const { bytes, pageCount } = await mergePdfs(files);
    const pdf = (await getDocument(bytes).promise) as PDFDocumentProxy;
    setMergedPDFData(bytes);
    setPageCount(pageCount);
    setPDF(pdf);
  }, []);

  const onSave = useCallback(() => {
    if (!mergedPDFData) return;
    saveAs(
      new Blob([mergedPDFData]),
      `combined-pdfs-${new Date().getTime()}.pdf`
    );
  }, [mergedPDFData]);

  const renderPagePreviews = useCallback(() => {
    if (!pdf) return null;
    const previews = [];
    for (let i = 1; i <= pageCount; i++) {
      previews.push(<PagePreview key={i} pageNumber={i} pdf={pdf} />);
    }
    return previews;
  }, [pageCount, pdf]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex flex-col h-full">
      <div
        {...getRootProps()}
        className="p-10 bg-blue-100 rounded text-center text-blue-900 text-xl flex-grow-0 hover:bg-blue-900 hover:text-white hover:cursor-pointer "
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
      <div className="flex flex-wrap flex-grow-1 h-full">
        {/* TODO: Better previews and drag to rearrange pages */}
        {renderPagePreviews()}
      </div>

      <div className="flex self-end justify-end flex-grow-0 ">
        {/* TODO: Add name field for them to name the downloaded file */}
        <button
          className="group relative self-end bg-green-500 text-white px-10 py-3 rounded-2xl hover:bg-green-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
          onClick={onSave}
          disabled={!pdf}
        >
          Merge & Download
          {!pdf && (
            <span className="hidden absolute right-56 top-2 w-max bg-black bg-opacity-80 text-xs py-2 px-5 rounded-2xl group-hover:block">
              You need to upload some PDFs first!
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default CombinePDF;
