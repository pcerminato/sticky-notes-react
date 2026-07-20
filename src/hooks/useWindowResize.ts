import { useLayoutEffect } from "react";
import type { RefObject } from "react";

interface UseWindowResizeParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  boundsRef: RefObject<DOMRect | null>;
}

export function useWindowResize({
  canvasRef,
  boundsRef,
}: UseWindowResizeParams) {
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
}
