import { colors, mark } from "./colors.js";
import type { ValueOf } from "./types.js";

// ANSI escape codes
const ESC = "\x1b[";
const HIDE_CURSOR = `${ESC}?25l`;
const SHOW_CURSOR = `${ESC}?25h`;
const CLEAR_SCREEN = `${ESC}2J`;
const MOVE_HOME = `${ESC}H`;
const CLEAR_LINE = `${ESC}2K`;

// Pre-computed move sequences for common positions (cache)
const moveCache = new Map<string, string>();
function moveTo(row: number, col: number = 0): string {
  const key = `${row},${col}`;
  let cached = moveCache.get(key);
  if (!cached) {
    cached = `${ESC}${row + 1};${col + 1}H`;
    moveCache.set(key, cached);
  }
  return cached;
}

export type CellTransform<T> = (args: {
  item: T;
  row: number;
  col: number;
}) => string | { content: string; color: ValueOf<typeof colors> };

interface TUIOptions {
  /** Throttle renders to this many ms (default: 16 ~= 60fps) */
  throttleMs?: number;
  /** Title shown at top */
  title?: string;
  /** Show FPS counter */
  showFps?: boolean;
}

interface Region {
  startRow: number;
  height: number;
  dirty: boolean;
}

/**
 * TUI - Terminal User Interface for real-time visualization
 *
 * Provides smooth, flicker-free rendering by:
 * - Using array buffers and batch writes
 * - Throttling renders to a target framerate
 * - Dirty tracking to only redraw changed regions
 * - Pre-allocated buffers to minimize GC pressure
 */
export class TUI<T = string> {
  private lastRender = 0;
  private throttleMs: number;
  private title: string;
  private showFps: boolean;
  private frameCount = 0;
  private fpsStartTime = Date.now();
  private currentFps = 0;
  private isInitialized = false;

  // Regions with dirty tracking
  private titleRegion: Region = { startRow: 0, height: 1, dirty: true };
  private matrixRegion: Region = { startRow: 1, height: 0, dirty: true };
  private statusRegion: Region = { startRow: 1, height: 0, dirty: true };
  private progressRegion: Region = { startRow: 1, height: 1, dirty: true };

  // State
  private matrix: T[][] | null = null;
  private matrixTransform: CellTransform<T> | null = null;
  private statusLines: string[] = [];
  private prevStatusLines: string[] = [];
  private progress: { current: number; total: number } | null = null;
  private progressWidth = 40;

  // Pre-allocated output buffer (array of strings to join)
  private outputBuffer: string[] = [];

  // Async render loop
  private renderLoopRunning = false;
  private renderLoopTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: TUIOptions = {}) {
    this.throttleMs = options.throttleMs ?? 16;
    this.title = options.title ?? "";
    this.showFps = options.showFps ?? false;
  }

  /** Initialize the TUI - hides cursor and clears screen */
  init(): this {
    process.stdout.write(HIDE_CURSOR + CLEAR_SCREEN + MOVE_HOME);
    this.isInitialized = true;
    this.setupExitHandlers();
    return this;
  }

  /** Clean up - shows cursor and moves to end */
  cleanup(): void {
    if (!this.isInitialized) return;
    this.stopRenderLoop();
    const totalHeight =
      this.titleRegion.height +
      this.matrixRegion.height +
      this.statusRegion.height +
      this.progressRegion.height +
      4;
    process.stdout.write(moveTo(totalHeight) + SHOW_CURSOR + "\n");
    this.isInitialized = false;
  }

  private setupExitHandlers(): void {
    const cleanup = () => this.cleanup();
    process.on("exit", cleanup);
    process.on("SIGINT", () => {
      cleanup();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      cleanup();
      process.exit(0);
    });
  }

  /** Set the matrix to display */
  setMatrix(matrix: T[][], transform?: CellTransform<T>): this {
    this.matrix = matrix;
    this.matrixTransform = transform ?? null;
    this.matrixRegion.height = matrix.length;
    this.matrixRegion.dirty = true;
    this.recalculateRegions();
    return this;
  }

  /** Update matrix transform without changing the matrix */
  setTransform(transform: CellTransform<T>): this {
    this.matrixTransform = transform;
    this.matrixRegion.dirty = true;
    return this;
  }

  /** Mark matrix as dirty (needs redraw) */
  invalidateMatrix(): this {
    this.matrixRegion.dirty = true;
    return this;
  }

  /** Set status lines shown below the matrix */
  setStatus(...lines: string[]): this {
    // Only mark dirty if changed
    if (
      lines.length !== this.statusLines.length ||
      lines.some((l, i) => l !== this.statusLines[i])
    ) {
      this.statusLines = lines;
      this.statusRegion.height = lines.length;
      this.statusRegion.dirty = true;
      this.recalculateRegions();
    }
    return this;
  }

  /** Update progress bar */
  setProgress(current: number, total: number): this {
    // Only mark dirty if changed
    if (
      !this.progress ||
      this.progress.current !== current ||
      this.progress.total !== total
    ) {
      this.progress = { current, total };
      this.progressRegion.dirty = true;
    }
    return this;
  }

  /** Set title */
  setTitle(title: string): this {
    if (this.title !== title) {
      this.title = title;
      this.titleRegion.dirty = true;
    }
    return this;
  }

  private recalculateRegions(): void {
    let row = 0;

    this.titleRegion.startRow = row;
    this.titleRegion.height = this.title ? 2 : 0;
    row += this.titleRegion.height;

    this.matrixRegion.startRow = row;
    row += this.matrixRegion.height;

    this.statusRegion.startRow = row + 1;
    this.statusRegion.height = this.statusLines.length;
    row += this.statusRegion.height + 1;

    this.progressRegion.startRow = row + 1;
  }

  /** Force an immediate render */
  render(): void {
    // Force all regions dirty for explicit render
    this.matrixRegion.dirty = true;
    this.doRender();
  }

  /** Request a render (throttled) */
  requestRender(): void {
    const now = Date.now();
    if (now - this.lastRender < this.throttleMs) return;
    this.doRender();
  }

  /**
   * Start an async render loop that runs independently of computation.
   * The loop renders the current state at the configured frame rate.
   * Call stopRenderLoop() when done.
   */
  startRenderLoop(): this {
    if (this.renderLoopRunning) return this;
    this.renderLoopRunning = true;

    // Do an immediate first render
    this.doRender();

    const renderFrame = () => {
      if (!this.renderLoopRunning) return;
      this.doRender();
    };

    // Use setInterval for consistent frame rate
    this.renderLoopTimer = setInterval(renderFrame, this.throttleMs);

    return this;
  }

  /** Stop the async render loop */
  stopRenderLoop(): this {
    this.renderLoopRunning = false;
    if (this.renderLoopTimer) {
      clearInterval(this.renderLoopTimer);
      this.renderLoopTimer = null;
    }
    return this;
  }

  /** Check if render loop is running */
  isRenderLoopRunning(): boolean {
    return this.renderLoopRunning;
  }

  private doRender(): void {
    if (!this.isInitialized) return;

    // Reset output buffer
    this.outputBuffer.length = 0;

    // Update FPS
    this.frameCount++;
    const now = Date.now();
    const elapsed = now - this.fpsStartTime;
    if (elapsed >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.fpsStartTime = now;
      this.titleRegion.dirty = true; // FPS changed
    }

    // Render title (only if dirty or FPS display enabled)
    if (this.title && this.titleRegion.dirty) {
      this.outputBuffer.push(moveTo(this.titleRegion.startRow), CLEAR_LINE);
      this.outputBuffer.push(mark(this.title, colors.brightCyan));
      if (this.showFps) {
        this.outputBuffer.push(
          mark(`  [${this.currentFps} fps]`, colors.brightBlack)
        );
      }
      this.titleRegion.dirty = false;
    }

    // Render matrix (only if dirty)
    if (this.matrix && this.matrixRegion.dirty) {
      this.renderMatrix();
      this.matrixRegion.dirty = false;
    }

    // Render status (only if dirty)
    if (this.statusRegion.dirty) {
      this.renderStatus();
      this.statusRegion.dirty = false;
    }

    // Render progress (only if dirty)
    if (this.progress && this.progressRegion.dirty) {
      this.renderProgress();
      this.progressRegion.dirty = false;
    }

    // Batch write
    if (this.outputBuffer.length > 0) {
      process.stdout.write(this.outputBuffer.join(""));
    }
    this.lastRender = now;
  }

  private renderMatrix(): void {
    if (!this.matrix) return;

    const rows = this.matrix.length;
    const transform = this.matrixTransform;

    for (let row = 0; row < rows; row++) {
      const matrixRow = this.matrix[row];
      const cols = matrixRow.length;

      // Start row
      this.outputBuffer.push(moveTo(this.matrixRegion.startRow + row));

      // Build row content
      const rowParts: string[] = [];
      for (let col = 0; col < cols; col++) {
        const item = matrixRow[col];
        if (transform) {
          const result = transform({ item, row, col });
          if (typeof result === "object") {
            rowParts.push(result.color, result.content, colors.reset);
          } else {
            rowParts.push(result);
          }
        } else {
          rowParts.push(String(item));
        }
      }
      this.outputBuffer.push(rowParts.join(""));
    }
  }

  private renderStatus(): void {
    for (let i = 0; i < this.statusLines.length; i++) {
      this.outputBuffer.push(
        moveTo(this.statusRegion.startRow + i),
        CLEAR_LINE,
        this.statusLines[i]
      );
    }
    // Clear any extra lines from previous status
    for (
      let i = this.statusLines.length;
      i < this.prevStatusLines.length;
      i++
    ) {
      this.outputBuffer.push(moveTo(this.statusRegion.startRow + i), CLEAR_LINE);
    }
    this.prevStatusLines = [...this.statusLines];
  }

  private renderProgress(): void {
    if (!this.progress) return;

    const { current, total } = this.progress;
    const percentage = (current / total) * 100;
    const completed = Math.round((current / total) * this.progressWidth);
    const remaining = this.progressWidth - completed;

    // Build progress bar efficiently
    const barParts: string[] = [
      moveTo(this.progressRegion.startRow),
      CLEAR_LINE,
      "[",
    ];

    // Add filled portion
    if (completed > 0) {
      barParts.push(colors.green, "█".repeat(completed), colors.reset);
    }
    // Add empty portion
    if (remaining > 0) {
      barParts.push(colors.brightBlack, "░".repeat(remaining), colors.reset);
    }

    barParts.push(
      "] ",
      colors.yellow,
      percentage.toFixed(1),
      "%",
      colors.reset,
      " ",
      colors.brightBlack,
      String(current),
      "/",
      String(total),
      colors.reset
    );

    this.outputBuffer.push(barParts.join(""));
  }
}

/**
 * Helper to create a highlight transform for matrices
 * Uses Set for O(1) lookups instead of array.some()
 */
export function createHighlighter<T>(
  getColor: (key: string, item: T) => { color: ValueOf<typeof colors>; char?: string } | null,
  defaultTransform?: (item: T) => string
): CellTransform<T> {
  return ({ item, row, col }) => {
    const key = `${row},${col}`;
    const highlight = getColor(key, item);
    if (highlight) {
      return {
        content: highlight.char ?? String(item),
        color: highlight.color,
      };
    }
    return defaultTransform ? defaultTransform(item) : String(item);
  };
}

/**
 * Simple sleep helper for controlling animation speed
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Yield to the event loop - allows pending timers/IO to run
 * Use this in tight loops to let the render loop execute
 */
export function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Wait for user to press any key
 * Falls back to immediate resolve if stdin is not a TTY (e.g., in tests)
 */
export function waitForKeypress(message?: string): Promise<void> {
  return new Promise((resolve) => {
    if (message) {
      process.stdout.write(message);
    }
    // Check if stdin is a TTY and setRawMode is available
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      resolve();
      return;
    }
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

/**
 * Batch iterator - yields in batches with optional delay between batches
 */
export async function* batchedIterator<T>(
  items: T[],
  batchSize: number,
  delayMs: number = 0
): AsyncGenerator<{ item: T; index: number; batch: number }> {
  for (let i = 0; i < items.length; i++) {
    yield { item: items[i], index: i, batch: Math.floor(i / batchSize) };
    if (delayMs > 0 && (i + 1) % batchSize === 0) {
      await sleep(delayMs);
    }
  }
}
