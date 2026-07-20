export interface Note {
  id: string; // Unique identifier to improve rendering
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string;
}

export interface Config {
  resizeHandleSize: number;
  deleteZoneSize: number;
  defaultBorderColor: string;
  textColor: string;
}

export type Coordinates = {
  x: number;
  y: number;
};

export type RectShape = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/* Action types >>> */
export interface DragAction {
  type: "dragging";
  note: Note;
  cursorOffset: { x: number; y: number };
}

export interface ResizeAction {
  type: "resizing";
  note: Note;
  startWidth: number;
  startHeight: number;
  initCursor: { x: number; y: number };
}

export interface EditAction {
  type: "editing";
  noteId: string;
}

export interface IdleAction {
  type: "idle";
}

export type Interaction = DragAction | ResizeAction | EditAction | IdleAction;

/* <<< Action types */
