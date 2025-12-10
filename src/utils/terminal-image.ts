/**
 * Terminal image rendering using Kitty Graphics Protocol
 * https://sw.kovidgoyal.net/kitty/graphics-protocol/
 *
 * Renders a matrix as an image where each cell is a colored pixel block
 */

// RGB color type
export type RGB = [number, number, number];

// Color palette for matrix cells
export const PALETTE: Record<string, RGB> = {
  ".": [25, 25, 30], // outside - very dark
  "#": [255, 200, 50], // wall corner - yellow
  X: [60, 180, 180], // wall - cyan
  "-": [60, 60, 70], // unfilled - gray
  default: [80, 80, 90],
};

/**
 * Create a simple PNG from raw RGBA data
 * Minimal PNG encoder - no dependencies
 */
function createPNG(
  width: number,
  height: number,
  pixels: Uint8Array
): Uint8Array {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = createIHDRChunk(width, height);
  const idat = createIDATChunk(width, height, pixels);
  const iend = createIENDChunk();

  const png = new Uint8Array(
    signature.length + ihdr.length + idat.length + iend.length
  );
  let offset = 0;
  png.set(signature, offset);
  offset += signature.length;
  png.set(ihdr, offset);
  offset += ihdr.length;
  png.set(idat, offset);
  offset += idat.length;
  png.set(iend, offset);

  return png;
}

function createIHDRChunk(width: number, height: number): Uint8Array {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  view.setUint32(0, width, false);
  view.setUint32(4, height, false);
  data[8] = 8; // bit depth
  data[9] = 6; // color type (RGBA)
  data[10] = 0; // compression
  data[11] = 0; // filter
  data[12] = 0; // interlace
  return createChunk("IHDR", data);
}

function createIDATChunk(
  width: number,
  height: number,
  pixels: Uint8Array
): Uint8Array {
  const rowSize = width * 4 + 1;
  const filtered = new Uint8Array(height * rowSize);

  for (let y = 0; y < height; y++) {
    filtered[y * rowSize] = 0;
    for (let x = 0; x < width * 4; x++) {
      filtered[y * rowSize + 1 + x] = pixels[y * width * 4 + x];
    }
  }

  const zlibData = createZlibWrapper(filtered);
  return createChunk("IDAT", zlibData);
}

function createZlibWrapper(data: Uint8Array): Uint8Array {
  const deflated = Bun.deflateSync(data as Uint8Array<ArrayBuffer>, {
    level: 6,
  });
  const result = new Uint8Array(2 + deflated.length + 4);
  result[0] = 0x78;
  result[1] = 0x9c;
  result.set(deflated, 2);
  const adler = adler32(data);
  const view = new DataView(result.buffer);
  view.setUint32(result.length - 4, adler, false);
  return result;
}

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  const MOD = 65521;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % MOD;
    b = (b + a) % MOD;
  }
  return (b << 16) | a;
}

function createIENDChunk(): Uint8Array {
  return createChunk("IEND", new Uint8Array(0));
}

function createChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length, false);
  for (let i = 0; i < 4; i++) {
    chunk[4 + i] = type.charCodeAt(i);
  }
  chunk.set(data, 8);
  const crc = crc32(chunk.subarray(4, 8 + data.length));
  view.setUint32(8 + data.length, crc, false);
  return chunk;
}

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface MatrixRendererOptions<T> {
  /** Pixels per cell (default: 2) */
  cellSize?: number;
  /** Get color for a cell */
  getColor?: (item: T, row: number, col: number) => RGB;
  /** Fixed row position for the image (default: current cursor) */
  row?: number;
  /** Fixed column position for the image (default: 0) */
  col?: number;
}

/**
 * Persistent matrix renderer that updates in place without flashing
 */
export class MatrixRenderer<T> {
  private imageId: number;
  private cellSize: number;
  private getColor: (item: T, row: number, col: number) => RGB;
  private initialized = false;
  private lastWidth = 0;
  private lastHeight = 0;

  // Reusable pixel buffer
  private pixels: Uint8Array | null = null;

  constructor(options: MatrixRendererOptions<T> = {}) {
    this.imageId = Math.floor(Math.random() * 1000000) + 1;
    this.cellSize = options.cellSize ?? 2;
    this.getColor =
      options.getColor ??
      ((item: T) => {
        const key = String(item);
        return PALETTE[key] ?? PALETTE.default;
      });
  }

  /**
   * Render the matrix - updates in place if already displayed
   */
  render(matrix: T[][]): void {
    const height = matrix.length;
    const width = matrix[0]?.length ?? 0;
    if (width === 0 || height === 0) return;

    const imgWidth = width * this.cellSize;
    const imgHeight = height * this.cellSize;

    // Reallocate buffer if size changed
    if (
      !this.pixels ||
      imgWidth !== this.lastWidth ||
      imgHeight !== this.lastHeight
    ) {
      this.pixels = new Uint8Array(imgWidth * imgHeight * 4);
      this.lastWidth = imgWidth;
      this.lastHeight = imgHeight;
      this.initialized = false; // Force new image placement
    }

    // Fill pixels
    const cellSize = this.cellSize;
    const pixels = this.pixels;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const color = this.getColor(matrix[row][col], row, col);

        // Fill cell block
        for (let dy = 0; dy < cellSize; dy++) {
          for (let dx = 0; dx < cellSize; dx++) {
            const px = col * cellSize + dx;
            const py = row * cellSize + dy;
            const idx = (py * imgWidth + px) * 4;

            pixels[idx] = color[0];
            pixels[idx + 1] = color[1];
            pixels[idx + 2] = color[2];
            pixels[idx + 3] = 255;
          }
        }
      }
    }

    // Create PNG and send
    const png = createPNG(imgWidth, imgHeight, pixels);
    this.sendImage(png, imgWidth, imgHeight);
  }

  private sendImage(png: Uint8Array, width: number, height: number): void {
    const b64 = Buffer.from(png).toString("base64");
    const chunkSize = 4096;
    const chunks = Math.ceil(b64.length / chunkSize);

    for (let i = 0; i < chunks; i++) {
      const chunk = b64.slice(i * chunkSize, (i + 1) * chunkSize);
      const isFirst = i === 0;
      const isLast = i === chunks - 1;

      let control = "";
      if (isFirst) {
        // Use image ID for replacement, and virtual placement
        // a=T transmit and display, f=100 PNG, i=id, p=id for placement
        // q=2 suppresses response
        control = `a=T,f=100,t=d,i=${this.imageId},p=${this.imageId},q=2,s=${width},v=${height}`;
        if (!this.initialized) {
          // First time: also set placement position
          // C=1 means replace if exists
          control += `,C=1`;
          this.initialized = true;
        }
      }
      if (!isLast) {
        control += (control ? "," : "") + "m=1";
      }

      process.stdout.write(`\x1b_G${control};${chunk}\x1b\\`);
    }
  }

  /**
   * Clear this renderer's image
   */
  clear(): void {
    // Delete by image ID
    process.stdout.write(`\x1b_Ga=d,d=i,i=${this.imageId},q=2\x1b\\`);
    this.initialized = false;
  }
}

/**
 * Simple one-shot render (may flash on repeated calls)
 */
export function renderMatrixImage<T>(
  matrix: T[][],
  options: MatrixRendererOptions<T> = {}
): void {
  const renderer = new MatrixRenderer(options);
  renderer.render(matrix);
}

/**
 * Clear all kitty images
 */
export function clearKittyImages(): void {
  process.stdout.write("\x1b_Ga=d,d=A,q=2\x1b\\");
}

/**
 * Check if terminal likely supports Kitty graphics
 */
export function supportsKittyGraphics(): boolean {
  const term = process.env.TERM ?? "";
  const termProgram = process.env.TERM_PROGRAM ?? "";
  const kitty = process.env.KITTY_WINDOW_ID;
  return (
    term.includes("kitty") ||
    termProgram.includes("WezTerm") ||
    termProgram.includes("Ghostty") ||
    kitty !== undefined
  );
}
