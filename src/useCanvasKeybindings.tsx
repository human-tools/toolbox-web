import { useCallback, useState, useEffect } from 'react';
import { fabric } from 'fabric';

const objectHasTheCorrectType = (obj: any) => {
  return obj.get('type') == 'textbox' || obj.get('type') == 'path';
};

const useCanvasBindings = (editor: any) => {
  const [listenersLoaded, setListenersLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!editor || listenersLoaded) return;

    function onKeyDown(options: any) {
      if (options.repeat) return;

      const key = options.key;
      const isAKeyDown = key == 'a';
      const isDKeyDown = key == 'd';
      const shouldSelectAll =
        (isAKeyDown && options.ctrlKey) || (isAKeyDown && options.metaKey);
      const shouldDeselectAll =
        (isDKeyDown && options.ctrlKey) || (isDKeyDown && options.metaKey);
      const shouldDeleteSelected = key == 'Backspace';

      if (shouldSelectAll) {
        selectAllTextObjects();
      } else if (shouldDeselectAll) {
        deselectAllTextObjects();
      } else if (shouldDeleteSelected) {
        deleteSelectedObjects();
      }
    }

    fabric.util.addListener(document.body, 'keydown', onKeyDown);
    setListenersLoaded(true);
  }, [editor]);

  const selectAllTextObjects = useCallback(() => {
    if (!editor) return;
    editor.canvas.discardActiveObject();
    const sel = new fabric.ActiveSelection(
      editor.canvas.getObjects().filter(objectHasTheCorrectType),
      {
        canvas: editor?.canvas,
      }
    );
    editor.canvas.setActiveObject(sel);
    editor.canvas.requestRenderAll();
  }, [editor]);

  const deselectAllTextObjects = useCallback(() => {
    if (!editor) return;
    editor.canvas.discardActiveObject();
    editor.canvas.requestRenderAll();
  }, [editor]);

  const deleteSelectedObjects = useCallback(() => {
    if (!editor) return;
    editor.canvas
      .getActiveObjects()
      .map((obj: any) => editor.canvas.remove(obj));
    editor.canvas.discardActiveObject();
    editor.canvas.requestRenderAll();
  }, [editor]);
};

export default useCanvasBindings;
