import type { Note } from "../types";
import { COLORS, NOTE_WIDTH, NOTE_HEIGHT } from "../constants";

export function createNote(note?: Partial<Note>): Note {
  const randomColorIndex = Math.floor(Math.random() * COLORS.length);

  return {
    id: crypto.randomUUID(),
    x: note?.x || 0,
    y: note?.y || 0,
    width: note?.width || NOTE_WIDTH,
    height: note?.height || NOTE_HEIGHT,
    color: note?.color || COLORS[randomColorIndex],
  };
}
