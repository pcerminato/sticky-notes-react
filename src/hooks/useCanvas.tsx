import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Note, Interaction, Config } from "../types";
import { isOverDeleteZone } from "../utils/cursor";

interface UseCanvasParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  notes: Note[];
  interaction: Interaction;
  config: Config;
}

/* This hook keeps the drawing logic of the elements on the canvas */
export const useCanvas = ({
  canvasRef,
  notes,
  interaction,
  config,
}: UseCanvasParams) => {
  /* To excell rendering performance, this hook uses the "latest ref patters" (https://www.epicreact.dev/the-latest-ref-pattern-in-react) */
  const renderDataRef = useRef({ notes, interaction, config });

  /* This use effect updates the reference on every re-render */
  useEffect(() => {
    renderDataRef.current = { notes, interaction, config };
  }, [notes, interaction, config]);

  useEffect(() => {
    let animationFrameId: number;

    /* The render loop is a clouse but it access the fresh data from the renderDataRef, decoupled from React re-render cycles */
    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      const {
        notes: currentNotes,
        interaction: currentInteraction,
        config: currentConfig,
      } = renderDataRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draws all the notes
      currentNotes.forEach((note) => {
        ctx.fillStyle = note.color;
        ctx.fillRect(note.x, note.y, note.width, note.height);

        ctx.fillStyle = currentConfig.defaultBorderColor;
        ctx.fillRect(
          note.x + note.width - currentConfig.resizeHandleSize,
          note.y + note.height - currentConfig.resizeHandleSize,
          currentConfig.resizeHandleSize,
          currentConfig.resizeHandleSize,
        );

        /* Highlights the active note */
        const isSelected =
          (currentInteraction.type === "dragging" ||
            currentInteraction.type === "resizing") &&
          currentInteraction.note.id === note.id;

        if (isSelected) {
          ctx.strokeStyle = currentConfig.defaultBorderColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(note.x, note.y, note.width, note.height);
        }
      });

      /*
       * Draws the delete zone.
       * The delete zone is always visible, but it is highlighted when hovered (dragging a note over it).
       */
      const isHovered =
        currentInteraction.type === "dragging" &&
        isOverDeleteZone(
          currentInteraction.note,
          canvas.width,
          canvas.height,
          currentConfig.deleteZoneSize,
        );

      ctx.fillStyle = isHovered
        ? "rgba(220, 20, 60, 0.8)"
        : "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(
        canvas.width - currentConfig.deleteZoneSize,
        canvas.height - currentConfig.deleteZoneSize,
        currentConfig.deleteZoneSize,
        currentConfig.deleteZoneSize,
      );

      ctx.fillStyle = isHovered ? "#FFFFFF" : "rgba(0, 0, 0, 0.4)";
      ctx.font = isHovered ? "bold 20px sans-serif" : "16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "🗑️",
        canvas.width - currentConfig.deleteZoneSize / 2,
        canvas.height - currentConfig.deleteZoneSize / 2,
      );

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    // Prevent memory leaks by cancelling pending animation requests when the component is unmounted.
    return () => cancelAnimationFrame(animationFrameId);
  }, [canvasRef]);
};
