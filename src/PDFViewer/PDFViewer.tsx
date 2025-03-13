import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import {
  PDFDocumentProxy,
  PDFPageProxy,
} from '../../node_modules/pdfjs-dist/types/src/display/api';
import { PageViewport } from '../../node_modules/pdfjs-dist/types/src/display/display_utils';

interface Props {
  data: Uint8Array;
}

export default function PDFViewer({ data }: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const [page, setPage] = useState<PDFPageProxy>();
  const [viewport, setViewport] = useState<PageViewport>();

  const loadDoc = useCallback(async () => {
    const pdf = (await getDocument(data).promise) as PDFDocumentProxy;
    const page = await pdf.getPage(1);
    const scale = 1;
    const viewport = page.getViewport({ scale });
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

    setPage(page);
    setViewport(viewport);
    setPDF(pdf);
  }, [data]);

  useEffect(() => {
    loadDoc();
  }, [loadDoc]);

  return (
    <canvas
      ref={canvasRef}
      width={viewport?.width}
      height={viewport?.height}
    ></canvas>
  );
}
