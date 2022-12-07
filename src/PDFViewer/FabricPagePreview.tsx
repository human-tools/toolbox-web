import {
  FabricJSCanvas,
  FabricJSEditor,
  useFabricJSEditor,
} from 'fabricjs-react';
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
import workerContent from '../pdfjs.worker.min.json';

const workerBlob = new Blob([workerContent], { type: 'text/javascript' });
const workerBlobURL = URL.createObjectURL(workerBlob);
GlobalWorkerOptions.workerSrc = workerBlobURL;

interface Props {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale?: number;
}

const FabricPagePreview = forwardRef<FabricJSEditor, Props>(function (
  { pdf, pageNumber, scale }: Props,
  ref
): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<PageViewport>();
  const { editor, onReady } = useFabricJSEditor();
  useImperativeHandle(ref, () => editor!);

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
      {viewport && (
        <FabricJSCanvas
          className="absolute top-0 right-0 left-0 bottom-0"
          onReady={(canvas) => {
            canvas.width = viewport!.width;
            canvas.height = viewport!.height;
            onReady(canvas);
          }}
        />
      )}
    </div>
  );
});

export default FabricPagePreview;
