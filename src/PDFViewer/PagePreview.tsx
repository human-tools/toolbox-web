import { GlobalWorkerOptions } from 'pdfjs-dist';
import { PDFDocumentProxy } from '../../node_modules/pdfjs-dist/types/src/display/api';
import { PageViewport } from '../../node_modules/pdfjs-dist/types/src/display/display_utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import workerContent from '../pdfjs.worker.min.json';

const workerBlob = new Blob([workerContent], { type: 'text/javascript' });
const workerBlobURL = URL.createObjectURL(workerBlob);
GlobalWorkerOptions.workerSrc = workerBlobURL;

interface Props {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale?: number;
}

export default function PagePreview({
  pdf,
  pageNumber,
  scale,
}: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<PageViewport>();

  const load = useCallback(async () => {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: scale || 0.25 });
    const canvas = canvasRef.current;
    if (!canvas || !viewport) return;
    const canvasContext = canvas.getContext('2d');
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    if (!canvasContext || !page) return;
    page.render({
      canvasContext,
      viewport,
    });
    setViewport(viewport);
  }, [pageNumber, pdf, scale]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <canvas
      style={{ pointerEvents: 'none' }}
      ref={canvasRef}
      width={viewport?.width}
      height={viewport?.height}
    ></canvas>
  );
}
