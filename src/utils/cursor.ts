import type { Coordinates, Note, RectShape } from "../types";

/* 
This files holds utility framework-agnostic functions to work with cursor/mouse events
and pixels position calculations.
*/

/* Returns the coordinates x and y where the cursor clicks relative to the canvas */
export function getClickCoordinates(
  canvas: HTMLCanvasElement,
  e: MouseEvent,
  cachedBounds: DOMRect,
) {
  const { clientX, clientY } = e;
  const { left, top, width, height } = cachedBounds;
  // calc mouse position relative to the canvas element
  const canvasX = clientX - left;
  const canvasY = clientY - top;
  // map coords to the internal pixel dimetion
  const x = canvasX * (canvas.width / width);
  const y = canvasY * (canvas.height / height);

  return { x, y };
}

/* Returns true when the cursor click happens over the area of the Rect */
export function clickIsOverArea(cursor: Coordinates, rect: RectShape) {
  return (
    cursor.x >= rect.x &&
    cursor.x <= rect.x + rect.width &&
    cursor.y >= rect.y &&
    cursor.y <= rect.y + rect.height
  );
}

/* Returns true when the cursor click happens over the area of the resize handle */
export function clickIsOverResizeHandle(
  cursor: Coordinates,
  note: Note,
  resizeHandleSize: number,
) {
  // shaping the resize handler rect as a
  const resizeHandleRect: RectShape = {
    x: note.x + note.width - resizeHandleSize,
    y: note.y + note.height - resizeHandleSize,
    width: resizeHandleSize,
    height: resizeHandleSize,
  };

  return clickIsOverArea(cursor, resizeHandleRect);
}

/**
 * Returns true if the note has entered at least @minOverlap (default 10px) inside the delete zone.
 */
export function isOverDeleteZone(
  note: Note,
  canvasWidth: number,
  canvasHeight: number,
  zoneSize: number,
  minOverlap = 10,
) {
  const zoneLeft = canvasWidth - zoneSize;
  const zoneTop = canvasHeight - zoneSize;

  // Check if the bottom-right portion of the note enters 10px deep into the zone
  const hasHorizontalIntersection =
    note.x + note.width >= zoneLeft + minOverlap;
  const hasVerticalIntersection = note.y + note.height >= zoneTop + minOverlap;

  // Optional: Also ensure the note hasn't completely left the canvas boundaries
  const isWithinCanvasBounds = note.x <= canvasWidth && note.y <= canvasHeight;

  return (
    hasHorizontalIntersection && hasVerticalIntersection && isWithinCanvasBounds
  );
}
