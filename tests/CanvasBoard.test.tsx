import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { CanvasBoard } from "../src/components/CanvasBoard";

// Mock HTMLCanvasElement context
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  strokeRect: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 50 }),
});

// Mock core hooks
const mockSaveToLocalStorage = vi.fn();
const mockReadFromLocalStorage = vi.fn().mockReturnValue([]);
vi.mock("../src/hooks", () => ({
  useCanvas: vi.fn(),
  useWindowResize: vi.fn(({ canvasRef, boundsRef }) => {
    if (canvasRef.current) {
      canvasRef.current.width = 800;
      canvasRef.current.height = 600;
    }
    boundsRef.current = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;
  }),
  useLocalStorage: vi.fn(() => [
    mockSaveToLocalStorage,
    mockReadFromLocalStorage,
  ]),
}));

// Mock utilities
import * as cursorUtils from "../src/utils/cursor";
import * as createNoteUtil from "../src/utils/createNote";

vi.mock("../src/utils/cursor", () => ({
  getClickCoordinates: vi.fn().mockReturnValue({ x: 100, y: 100 }),
  clickIsOverResizeHandle: vi.fn().mockReturnValue(false),
  clickIsOverArea: vi.fn().mockReturnValue(false),
  isOverDeleteZone: vi.fn().mockReturnValue(false),
}));

vi.mock("../src/utils/createNote", () => ({
  createNote: vi.fn().mockReturnValue({
    id: "note-123",
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    color: "blue",
  }),
}));

describe("<CanvasBoard />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFromLocalStorage.mockReturnValue([]);
  });

  // Snapshot test to verify visual backwards compatibility
  it("should match the snapshot on initial mount", () => {
    const { container } = render(<CanvasBoard />);

    expect(container).toMatchSnapshot();
  });

  it("should match the snapshot when a note enters editing mode", () => {
    const activeNote = {
      id: "note-text-1",
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      color: "green",
      text: "Hello",
    };
    mockReadFromLocalStorage.mockReturnValue([activeNote]);
    vi.spyOn(cursorUtils, "clickIsOverArea").mockReturnValue(true);

    const { container } = render(<CanvasBoard />);
    const canvas = container.querySelector("canvas")!;

    // Open text input element
    fireEvent.doubleClick(canvas, { clientX: 20, clientY: 20 });

    expect(container).toMatchSnapshot();
  });

  it("should render the canvas element successfully", () => {
    const { container } = render(<CanvasBoard />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("should load notes from localStorage on component mount", () => {
    const cachedNotes = [
      { id: "loaded-1", x: 50, y: 50, width: 100, height: 100, color: "red" },
    ];
    mockReadFromLocalStorage.mockReturnValue(cachedNotes);

    render(<CanvasBoard />);
    expect(mockReadFromLocalStorage).toHaveBeenCalledTimes(1);
  });

  it("should generate a new note on canvas click event", () => {
    const { container } = render(<CanvasBoard />);
    const canvas = container.querySelector("canvas")!;

    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

    expect(createNoteUtil.createNote).toHaveBeenCalledWith({ x: 100, y: 100 });

    /* As the note is "dragging" at creation, it needs to be put into idle state to 
    be saved to the localStorage */
    fireEvent.mouseUp(canvas);

    expect(mockSaveToLocalStorage).toHaveBeenCalled();
  });

  it("should set the dragging interaction when clicking on top of an existing note", () => {
    const activeNote = {
      id: "note-1",
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      color: "green",
    };
    mockReadFromLocalStorage.mockReturnValue([activeNote]);
    vi.spyOn(cursorUtils, "clickIsOverArea").mockReturnValue(true);

    const { container } = render(<CanvasBoard />);
    const canvas = container.querySelector("canvas")!;

    fireEvent.mouseDown(canvas, { clientX: 15, clientY: 15 });

    vi.spyOn(cursorUtils, "getClickCoordinates").mockReturnValue({
      x: 25,
      y: 15,
    });
    fireEvent.mouseMove(canvas, { clientX: 25, clientY: 15 });
    fireEvent.mouseUp(canvas);

    expect(mockSaveToLocalStorage).toHaveBeenCalled();
  });

  it("should enable the TextInput on double click", () => {
    const activeNote = {
      id: "note-text-1",
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      color: "green",
      text: "Hello",
    };
    mockReadFromLocalStorage.mockReturnValue([activeNote]);
    vi.spyOn(cursorUtils, "clickIsOverArea").mockReturnValue(true);

    const { container } = render(<CanvasBoard />);
    const canvas = container.querySelector("canvas")!;

    fireEvent.doubleClick(canvas, { clientX: 20, clientY: 20 });

    const inputOverlay = screen.getByRole("textbox");
    expect(inputOverlay).toBeInTheDocument();
    expect(inputOverlay).toHaveValue("Hello");
  });

  it("should clear the active TextInput and save changes on blur", () => {
    const activeNote = {
      id: "note-text-1",
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      color: "green",
    };
    mockReadFromLocalStorage.mockReturnValue([activeNote]);
    vi.spyOn(cursorUtils, "clickIsOverArea").mockReturnValue(true);

    const { container } = render(<CanvasBoard />);
    const canvas = container.querySelector("canvas")!;

    fireEvent.doubleClick(canvas, { clientX: 20, clientY: 20 });
    const inputOverlay = screen.getByRole("textbox");

    fireEvent.change(inputOverlay, {
      target: { value: "Updated Text String" },
    });
    fireEvent.blur(inputOverlay);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(mockSaveToLocalStorage).toHaveBeenCalled();
  });

  it("should delete a note if dropped inside the delete zone", () => {
    const targetNote = {
      id: "doomed-note",
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      color: "orange",
    };
    mockReadFromLocalStorage.mockReturnValue([targetNote]);

    vi.spyOn(cursorUtils, "clickIsOverArea").mockReturnValue(true);
    const { container } = render(<CanvasBoard />);
    const canvas = container.querySelector("canvas")!;
    fireEvent.mouseDown(canvas, { clientX: 15, clientY: 15 });

    vi.spyOn(cursorUtils, "isOverDeleteZone").mockReturnValue(true);
    fireEvent.mouseUp(canvas);

    expect(mockSaveToLocalStorage).toHaveBeenCalledWith([]);
  });
});
