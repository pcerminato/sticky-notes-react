import { test, expect } from "@playwright/test";

test.describe("CanvasBoard E2E Interactive Paint Tests", () => {
  test.beforeEach(async ({ page }) => {
    // tests over the minimal viewport size
    await page.setViewportSize({ width: 1024, height: 768 });

    // Hardcoded, but should be on .env.test
    await page.goto("http://localhost:5173/");

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Force waiting for the layout to be resized properly
    await canvas.evaluate((el) => {
      if (el.clientWidth === 0 || el.clientHeight === 0) {
        throw new Error("Canvas has not initialized dimension styles yet");
      }
    });

    await page.evaluate(() => localStorage.clear());
  });

  test("should generate a new note on click over the canvas and add text content", async ({
    page,
  }) => {
    const canvas = page.locator("canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas bounding box missing");

    const clickX = box.x + box.width / 2;
    const clickY = box.y + box.height / 2;

    await canvas.focus();
    await page.mouse.click(clickX, clickY);
    await page.mouse.dblclick(clickX, clickY);

    const textInput = page.getByTestId("note-text-input");

    await textInput.waitFor({ state: "visible", timeout: 3000 });
    await expect(textInput).toBeVisible();

    await textInput.fill("E2E Note Content");
    await page.keyboard.press("Enter");
    await expect(textInput).toBeHidden();
  });

  test("should completely delete a note when dragged into the trash zone", async ({
    page,
  }) => {
    const canvas = page.locator("canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas bounding box missing");

    await canvas.focus();

    const targetX = box.x + 400;
    const targetY = box.y + 400;

    await page.mouse.click(targetX, targetY);
    await page.keyboard.type("Note to delete");
    await page.keyboard.press("Enter");

    // Clear active creation pointers out of memory loops
    await page.mouse.click(box.x + 10, box.y + 10);

    const insideNoteX = targetX + 60;
    const insideNoteY = targetY + 50;

    // Select the note
    await page.mouse.move(insideNoteX, insideNoteY);
    await page.mouse.down();

    const trashZoneX = box.x + box.width - 40;
    const trashZoneY = box.y + box.height - 40;

    // move it slowly to the trash zone and drop
    await page.mouse.move(trashZoneX, trashZoneY, { steps: 35 });
    await page.waitForTimeout(150);
    await page.mouse.up();

    // Verify the note was deleted from localStorage
    const savedNotesJson = await page.evaluate(() => {
      return localStorage.getItem("canvas-board-notes");
    });

    const parsedNotes = savedNotesJson ? JSON.parse(savedNotesJson) : [];
    expect(parsedNotes.length).toBe(0);
  });
});
