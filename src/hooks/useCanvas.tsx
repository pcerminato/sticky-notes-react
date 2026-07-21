import { useEffect } from "react";
import type { RefObject } from "react";
import type { Note, Interaction, Config } from "../types";
import { isOverDeleteZone } from "../utils/cursor";

interface UseCanvasParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  notes: Note[];
  interaction: Interaction;
  config: Config;
  canvasSize: { width: number; height: number };
}

/* This hook keeps the drawing logic of the elements on the canvas */
export const useCanvas = ({
  canvasRef,
  notes,
  interaction,
  config,
  canvasSize,
}: UseCanvasParams) => {
  useEffect(() => {
    let animationFrameId: number;
    let lastCalledTime = performance.now();
    let fps = 0;

    const renderFrame = () => {
      performance.mark("canvas-draw-start");

      const delta = (performance.now() - lastCalledTime) / 1000;
      lastCalledTime = performance.now();
      fps = Math.round(1 / delta);

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draws all the notes
      notes.forEach((note) => {
        ctx.fillStyle = note.color;
        ctx.fillRect(note.x, note.y, note.width, note.height);

        if (note.text) {
          // Draws the text
          ctx.fillStyle = config.textColor;
          ctx.font = "15px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Calculate center of the note card
          const centerX = note.x + note.width / 2;
          const centerY = note.y + note.height / 2;

          // Truncate text with ellipsis if it overflows the note box width safely
          const maxTextWidth = note.width - 20;
          let textToDraw = note.text;
          if (ctx.measureText(textToDraw).width > maxTextWidth) {
            while (
              textToDraw.length > 0 &&
              ctx.measureText(textToDraw + "...").width > maxTextWidth
            ) {
              textToDraw = textToDraw.slice(0, -1);
            }
            textToDraw += "...";
          }

          ctx.fillText(textToDraw, centerX, centerY);
        }

        ctx.fillStyle = config.defaultBorderColor;
        ctx.fillRect(
          note.x + note.width - config.resizeHandleSize,
          note.y + note.height - config.resizeHandleSize,
          config.resizeHandleSize,
          config.resizeHandleSize,
        );

        /* Highlights the active note */
        const isSelected =
          (interaction.type === "dragging" ||
            interaction.type === "resizing") &&
          interaction.note.id === note.id;

        if (isSelected) {
          ctx.strokeStyle = config.defaultBorderColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(note.x, note.y, note.width, note.height);
        }
      });

      /*
       * Draws the delete zone.
       * The delete zone is always visible, but it is highlighted when hovered (dragging a note over it).
       */
      const isHovered =
        interaction.type === "dragging" &&
        isOverDeleteZone(
          interaction.note,
          canvas.width,
          canvas.height,
          config.deleteZoneSize,
        );

      ctx.fillStyle = isHovered
        ? "rgba(220, 20, 60, 0.8)"
        : "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(
        canvas.width - config.deleteZoneSize,
        canvas.height - config.deleteZoneSize,
        config.deleteZoneSize,
        config.deleteZoneSize,
      );

      ctx.font = isHovered ? "bold 20px sans-serif" : "16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "🗑️",
        canvas.width - config.deleteZoneSize / 2,
        canvas.height - config.deleteZoneSize / 2,
      );

      performance.mark("canvas-draw-end");
      performance.measure(
        "Canvas Render Time",
        "canvas-draw-start",
        "canvas-draw-end",
      );

      if (fps < 60) {
        console.warn(`⚠️ Frame rate dropped to: ${fps} FPS`);
      }
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    // Prevent memory leaks by cancelling pending animation requests when the component is unmounted.
    return () => cancelAnimationFrame(animationFrameId);
  }, [canvasRef, notes, interaction, config, canvasSize]);
};
