import React, { useLayoutEffect, useRef, useState } from "react";
import type { Note, Interaction, Config, Coordinates } from "./types";
import { useCanvas } from "./useCanvas";
import {
  getClickCoordinates,
  clickIsOverResizeHandle,
  clickIsOverArea,
  isOverDeleteZone,
} from "./utils/cursor";
import { assertNever } from "./utils/assertNever";
import { createNote } from "./utils/createNote";
import {
  DELETE_ZONE_SIZE,
  RESIZE_HANDLE_SIZE,
  BORDER_COLOR,
} from "./constants";

const CONFIG: Config = {
  resizeHandleSize: RESIZE_HANDLE_SIZE,
  deleteZoneSize: DELETE_ZONE_SIZE,
  defaultBorderColor: BORDER_COLOR,
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

  useCanvas({ canvasRef, notes, interaction, config: CONFIG });

  // Update canvas pixel dimensions on start and cache bounds.
  useLayoutEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Cache the layout geometry bounds
        boundsRef.current = canvas.getBoundingClientRect();
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

      // Re-using Note structure shapes safely since they contain x, y, width, height
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
      Why? So you can create & drag on one single mosedown stroke */
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
        break;
      }

      case "resizing":
      case "idle":
        break;
      default: {
        assertNever(interaction);
      }
    }

    setInteraction({ type: "idle" });
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setInteraction({ type: "idle" })}
      className="canvas-board"
    />
  );
};
