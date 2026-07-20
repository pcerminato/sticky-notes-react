import React, { useEffect, useRef, useState } from "react";
import styles from "./CanvasBoard.module.css";
import type { Note, Interaction, Config, Coordinates } from "../types";
import {
  getClickCoordinates,
  clickIsOverResizeHandle,
  clickIsOverArea,
  isOverDeleteZone,
} from "../utils/cursor";
import { assertNever } from "../utils/assertNever";
import { createNote } from "../utils/createNote";
import {
  DELETE_ZONE_SIZE,
  RESIZE_HANDLE_SIZE,
  BORDER_COLOR,
  TEXT_COLOR,
  LOCAL_STORAGE_KEY,
} from "../constants";
import { useCanvas, useLocalStorage, useWindowResize } from "../hooks";
import { TextInput } from ".";

const CONFIG: Config = {
  resizeHandleSize: RESIZE_HANDLE_SIZE,
  deleteZoneSize: DELETE_ZONE_SIZE,
  defaultBorderColor: BORDER_COLOR,
  textColor: TEXT_COLOR,
};

export const CanvasBoard: React.FC = () => {
  /* 
    boundsRef is a cache placeholder reference for the canvas bounds to avoid calling getBoundingClientRect() on every mousemove,
    because that would create multiple roundtrips of DOM reads which would hinder performance.
  */
  const boundsRef = useRef<DOMRect | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [interaction, setInteraction] = useState<Interaction>({ type: "idle" });
  const [saveToLocalStorage, readFromLocalStorage] =
    useLocalStorage<Note[]>(LOCAL_STORAGE_KEY);

  const activeEditingNote =
    interaction.type === "editing"
      ? notes.find((n) => n.id === interaction.noteId)
      : null;

  useCanvas({ canvasRef, notes, interaction, config: CONFIG });

  // Update canvas pixel dimensions on start and cache bounds.
  useWindowResize({ canvasRef, boundsRef });

  useEffect(() => {
    const data = readFromLocalStorage();
    if (data) {
      setNotes(data);
    }
  }, []);

  useEffect(() => {
    if (interaction.type === "idle") {
      saveToLocalStorage(notes);
    }
  }, [notes, interaction]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (interaction.type === "editing") {
      return;
    }
    const canvas = canvasRef.current;
    const bounds = boundsRef.current;
    if (!canvas || !bounds) return;

    const cursor: Coordinates = getClickCoordinates(
      canvas,
      e.nativeEvent, // nativeEvent keeps the raw coordinates. It is more reliable than the React.MouseEvent
      bounds,
    );
    let noteClicked = false;
    const updatedNotes = [...notes];

    for (let i = updatedNotes.length - 1; i >= 0; i--) {
      const note = updatedNotes[i];

      if (clickIsOverResizeHandle(cursor, note, CONFIG.resizeHandleSize)) {
        setInteraction({
          type: "resizing",
          note,
          startWidth: note.width,
          startHeight: note.height,
          initCursor: cursor,
        });

        /* splice and push to bring the clicked-over note to the front */
        updatedNotes.splice(i, 1);
        updatedNotes.push(note);
        setNotes(updatedNotes);
        noteClicked = true;
        break;
      }

      if (clickIsOverArea(cursor, note)) {
        setInteraction({
          type: "dragging",
          note,
          cursorOffset: { x: cursor.x - note.x, y: cursor.y - note.y },
        });

        updatedNotes.splice(i, 1);
        updatedNotes.push(note);
        setNotes(updatedNotes);
        noteClicked = true;
        break;
      }
    }

    if (!noteClicked) {
      const newNote = createNote({
        x: cursor.x,
        y: cursor.y,
      });
      setNotes([...notes, newNote]);
      /* Note: "dragging" is set as the default interaction on note creation. 
      Why? So you can create & drag on a single mosedown stroke */
      setInteraction({
        type: "dragging",
        note: newNote,
        cursorOffset: { x: 0, y: 0 },
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const bounds = boundsRef.current;
    if (!canvas || !bounds) return;

    const cursor: Coordinates = getClickCoordinates(
      canvas,
      e.nativeEvent,
      bounds,
    );

    switch (interaction.type) {
      case "idle":
      case "editing":
        break;
      case "resizing": {
        const rangeX = cursor.x - interaction.initCursor.x;
        const rangeY = cursor.y - interaction.initCursor.y;

        setNotes(
          notes.map((n) =>
            n.id === interaction.note.id
              ? {
                  ...n,
                  width: Math.max(50, interaction.startWidth + rangeX),
                  height: Math.max(50, interaction.startHeight + rangeY),
                }
              : n,
          ),
        );
        break;
      }
      case "dragging": {
        const nextX = cursor.x - interaction.cursorOffset.x;
        const nextY = cursor.y - interaction.cursorOffset.y;
        const updatedNote = { ...interaction.note, x: nextX, y: nextY };

        setInteraction({ ...interaction, note: updatedNote });
        setNotes(
          notes.map((n) => (n.id === interaction.note.id ? updatedNote : n)),
        );
        break;
      }
      default: {
        assertNever(interaction);
      }
    }
  };

  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    const bounds = boundsRef.current;
    if (!canvas || !bounds) return;

    switch (interaction.type) {
      case "dragging": {
        const shouldDelete = isOverDeleteZone(
          interaction.note,
          canvas.width,
          canvas.height,
          CONFIG.deleteZoneSize,
        );

        if (shouldDelete) {
          setNotes(notes.filter((n) => n.id !== interaction.note.id));
        }

        setInteraction({ type: "idle" });

        break;
      }

      case "resizing":
        setInteraction({ type: "idle" });
        break;
      case "editing":
      case "idle":
        break;
      default: {
        assertNever(interaction);
      }
    }

    setInteraction({ type: "idle" });
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const bounds = boundsRef.current;
    if (!canvas || !bounds) return;

    const cursor = getClickCoordinates(canvas, e.nativeEvent, bounds);

    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i];
      if (clickIsOverArea(cursor, note)) {
        setInteraction({ type: "editing", noteId: note.id });
        break;
      }
    }
  };

  const handleTextSave = (id: string, newText: string) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, text: newText } : n)));
    setInteraction({ type: "idle" });
  };

  const handleMouseLeave = () => {
    if (interaction.type !== "editing") {
      setInteraction({ type: "idle" });
    }
  };

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onMouseLeave={handleMouseLeave}
        className={styles.canvasBoard}
      />

      {activeEditingNote && (
        <TextInput
          note={activeEditingNote}
          boundsRef={boundsRef}
          canvasRef={canvasRef}
          onBlur={(e) => handleTextSave(activeEditingNote.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              handleTextSave(activeEditingNote.id, e.currentTarget.value);
            if (e.key === "Escape") setInteraction({ type: "idle" });
          }}
        />
      )}
    </div>
  );
};
