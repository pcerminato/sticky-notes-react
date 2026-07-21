# Notes

## Architecture

- `CanvasBoard.tsx` is the component that renders the canvas and defines the event handlers over the canvas events. The approach to interact with the canvas relies on an _interactions state machine_ idea, based on different interaction types (`idle`, `dragging`, `resizing` or `editing`) to signal what mode the application is in and to bind the actions accordingly.
  - `boundsRef`. In order to to maintain ultra-smooth responsiveness during mouse movements, the component uses this mutable React ref to cache the canvas´s physical position in the browser layout.
  - `<TextInput />`. When on editing mode, the <TextInput> is set directly on top of the active note boundaries.

- `useCanvas.tsx` encapsulates all the rendering logic of the canvas. It uses `requestAnimationFrame()` to schedule the renders when there is a change in the state or in the canvas size change.
  - The approach I used to draw the notes on the canvas is _drawing everything all the time_. Example: even if a single note is begin dragged over the canvas, all the other notes are re-drawn. This is a trade-off I made to keep implementation straigh forward. Still, for an enterprise application a different approach should be taken, like [multi-layered canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#use_multiple_layered_canvases_for_complex_scenes) or [HTML-in-canvas](https://developer.chrome.com/blog/html-in-canvas-origin-trial).

- Other hooks.
  - `useWindowResize()` to read the `getBoundingClientRect()` only once and to update the DOM reliying on `useLayoutEffect()` to efficiently set up the canvas boundaries on start up.
  - `useLocalStorage()` to encapsulate the logic related to localStorage interactions.

## Features implemented

1. Create a new note of the specified size at the specified position.
2. Change note size by dragging.
3. Move a note by dragging.
4. Remove a note by dragging it over a predefined "trash" zone.

### Bonus

1. Entering/editing note text.
2. Moving notes to front (in case of overlapping notes).
3. Saving notes to local storage (restoring them on page load).
4. Different note colors.
5. ~~Saving notes to REST API~~

## Tests

Added unit test, regression tests (snapshots) and e2e tests. Though the coverage is not exaustive, the basic cases are set up.

## How to run 🚀

The project is built with vite.
It uses vitest for unit and snapshot tests -and- playwright for e2e tests.

- `nvm use` to use Node.js `v24.14.1` defined for this project in .nvmrc.
- Install dependencies with `npm install`.
- Run on dev mode with `npm run dev`.
  - Open the app on http://localhost:5173/ (or check the localhost link in the console).
- Run unit tests: `npm test`.
- Run e2e tests: `npm run e2e`.
