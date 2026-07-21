import type { Note } from "../types";
import styles from "./TextInput.module.css";

interface TextInputParams {
  note: Note;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  boundsRef: React.RefObject<DOMRect | null>;
  onBlur: (e: React.FocusEvent<HTMLInputElement, Element>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function TextInput({
  note,
  boundsRef,
  canvasRef,
  onBlur,
  onKeyDown,
}: TextInputParams) {
  return (
    <input
      data-testid="note-text-input"
      autoFocus
      type="text"
      defaultValue={note.text || ""}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      /* Stop propagation of these events to avoid conflicts with the upstream event handlers (at CanvasBoard)  */
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className={styles.textInput}
      style={{
        /* Dynamically calculates the position (left, top) and size (width) of the input relative to the note */
        left: `${(note.x * (boundsRef.current?.width || 1)) / (canvasRef.current?.width || 1) + (boundsRef.current?.left || 0) + 10}px`,
        top: `${(note.y * (boundsRef.current?.height || 1)) / (canvasRef.current?.height || 1) + (boundsRef.current?.top || 0) + note.height / 2 - 15}px`,
        width: `${(note.width * (boundsRef.current?.width || 1)) / (canvasRef.current?.width || 1) - 20}px`,
        outline: `2px solid ${note.color}`,
        background: note.color,
      }}
    />
  );
}
