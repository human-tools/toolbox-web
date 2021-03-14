import { useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import UploadButton from '../components/UploadButton';
import JSZip from 'jszip';

async function splitPDF(largePdfFile: File): Promise<PDFDocument[]> {
  const sourceDoc = await PDFDocument.load(await largePdfFile.arrayBuffer());
  const targetDocs: PDFDocument[] = [];

  for (const pageIdx of sourceDoc.getPageIndices()) {
    const pdfDoc = await PDFDocument.create();
    const [page] = await pdfDoc.copyPages(sourceDoc, [pageIdx]);
    pdfDoc.addPage(page);
    targetDocs.push(pdfDoc);
  }
  return targetDocs;
}

const SplitPDF = (): JSX.Element => {
  const onDrop = useCallback(async (files) => {
    if (files.length === 0) return;

    const docs = await splitPDF(files[0]);
    const zip = new JSZip();
    for (const docIdx in docs) {
      const bytes = await docs[docIdx].save();
      zip.file(`${`${+docIdx + 1}`.padStart(4, '0')}.pdf`, bytes);
    }
    const zipFile = await zip.generateAsync({ type: 'blob' });
    saveAs(zipFile, `splitted-files-${new Date().getDate()}.zip`);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="m-3 p-3 bg-green-200 rounded">
        <p>
          This tool helps you to quickly split a large PDF file pages into a lot
          of single-file PDF files.{' '}
          <b>
            No Data is ever uploaded to any servers. All the magic happen in
            your browser.
          </b>{' '}
          Just drag-and-drop a PDF file, it will get split and then download the
          files!
        </p>
      </div>
      <div className="flex flex-col flex-grow h-full w-full xl:flex-row">
        <div className="flex flex-col flex-grow h-full w-full lg:flex-row">
          <div className="px-3 pb-3 flex-grow ">
            <UploadButton onDrop={onDrop} accept=".pdf" fullSized={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitPDF;
