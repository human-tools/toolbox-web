import { useCallback } from 'react';
import { fabric } from 'fabric';
import { useHotkeys } from 'react-hotkeys-hook';

const objectHasTheCorrectType = (obj: any) => {
  return obj.get('type') == 'textbox' || obj.get('type') == 'path';
};

const useCanvasBindings = (editor: any) => {
  useHotkeys('ctrl+a, meta+a', () => selectAllTextObjects(), [editor]);
  useHotkeys('ctrl+d, meta+d', () => deselectAllTextObjects(), [editor]);
  useHotkeys('Backspace', () => deleteSelectedObjects(), [editor]);

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
