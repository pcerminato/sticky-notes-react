import { useLayoutEffect } from "react";
import type { RefObject } from "react";

interface UseWindowResizeParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  boundsRef: RefObject<DOMRect | null>;
  onWindowResize?: ({
    width,
    height,
  }: {
    width: number;
    height: number;
  }) => void;
}

export function useWindowResize({
  canvasRef,
  boundsRef,
  onWindowResize,
}: UseWindowResizeParams) {
  useLayoutEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Cache the layout geometry bounds
        boundsRef.current = canvas.getBoundingClientRect();

        if (onWindowResize !== undefined) {
          onWindowResize({ width: canvas.width, height: canvas.height });
        }
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
}
