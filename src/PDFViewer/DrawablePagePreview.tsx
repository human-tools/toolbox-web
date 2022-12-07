import { GlobalWorkerOptions } from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';
import { PageViewport } from 'pdfjs-dist/types/display/display_utils';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useSvgDrawing } from 'react-hooks-svgdrawing';
import { DrawingOption, SvgDrawing } from 'svg-drawing';
import workerContent from '../pdfjs.worker.min.json';

const workerBlob = new Blob([workerContent], { type: 'text/javascript' });
const workerBlobURL = URL.createObjectURL(workerBlob);
GlobalWorkerOptions.workerSrc = workerBlobURL;

interface Props {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale?: number;
}

export interface UseSvgDrawing {
  instance: SvgDrawing | null;
  clear: () => void;
  undo: () => void;
  changePenColor: (penColor: DrawingOption['penColor']) => void;
  changePenWidth: (penwidth: DrawingOption['penWidth']) => void;
  changeFill: (penColor: DrawingOption['fill']) => void;
  changeClose: (penwidth: DrawingOption['close']) => void;
  changeDelay: (penColor: DrawingOption['delay']) => void;
  changeCurve: (penwidth: DrawingOption['curve']) => void;
  getSvgXML: () => string | null;
  download: (ext: 'svg' | 'png' | 'jpg') => void;
}

const DrawablePagePreview = forwardRef<UseSvgDrawing, Props>(function (
  { pdf, pageNumber, scale }: Props,
  ref
): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<PageViewport>();
  // const drawingDivRef = useRef<HTMLDivElement>(null);
  const [renderRef, draw] = useSvgDrawing({
    penWidth: 2, // pen width
    penColor: '#000', // pen color
    close: false, // Use close command for path. Default is false.
    curve: true, // Use curve command for path. Default is true.
    delay: 60, // Set how many ms to draw points every.
    fill: 'none', // Set fill attribute for path. default is `none`
  });

  useImperativeHandle(ref, () => draw);

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
    <div className="relative">
      {/* PDF Canvas */}
      <canvas
        style={{ pointerEvents: 'none' }}
        ref={canvasRef}
        width={viewport?.width}
        height={viewport?.height}
      ></canvas>
      {/* Drawing Canvas */}
      <div
        className="absolute top-0 right-0 left-0 bottom-0"
        ref={renderRef}
        style={{
          width: viewport?.width,
          height: viewport?.height,
        }}
      ></div>
    </div>
  );
});

export default DrawablePagePreview;
