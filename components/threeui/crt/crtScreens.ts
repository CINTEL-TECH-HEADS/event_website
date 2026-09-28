/* Screen painters for the CRT variants. Each one draws a complete picture into an
   offscreen 2D canvas that the WebGL pass then curves, scans, and grades. The
   authored ZION terminal stays in crtRenderer.ts; these are the added styles. */

export type CrtVariant = "terminal" | "cinematic" | "blue-screen" | "nintendo" | "cintel";

export type ScreenSurface =
  | { mode: "buffer" }
  | { mode: "cap"; width: number }
  | { mode: "fixed"; width: number; height: number };

export type CrtStyle = {
  curve: readonly [number, number];
  scanDensity: number;
  scanDepth: number;
  triadCss: number;
  grille: number;
  chroma: number;
  bar: number;
  flicker: number;
  grain: number;
  noise: number;
  vignette: number;
  mono: number;
  gain: number;
  halo: number;
  sheen: readonly [number, number, number];
  room: readonly [number, number, number];
  background: string;
  filtering: "linear" | "nearest";
  surface: ScreenSurface;
  redrawMs: number;
};

export const CRT_STYLES: Record<CrtVariant, CrtStyle> = {
  terminal: {
    curve: [0.115, 0.165], scanDensity: 0.44, scanDepth: 0.30, triadCss: 3.2, grille: 0.34, chroma: 1,
    bar: 0.045, flicker: 0.028, grain: 0.022, noise: 0, vignette: 0.58, mono: 0, gain: 1.34, halo: 0.10,
    sheen: [0.55, 1.0, 0.78], room: [0.012, 0.03, 0.022], background: "#03100a",
    filtering: "linear", surface: { mode: "buffer" }, redrawMs: 0,
  },
  cinematic: {
    curve: [0.085, 0.125], scanDensity: 0.40, scanDepth: 0.22, triadCss: 3.6, grille: 0.14, chroma: 0.7,
    bar: 0.022, flicker: 0.020, grain: 0.055, noise: 0, vignette: 0.74, mono: 1, gain: 1.16, halo: 0.20,
    sheen: [0.86, 0.90, 1.0], room: [0.016, 0.016, 0.018], background: "#07070a",
    filtering: "linear", surface: { mode: "cap", width: 1280 }, redrawMs: 33,
  },
  "blue-screen": {
    curve: [0.130, 0.180], scanDensity: 0.46, scanDepth: 0.34, triadCss: 3.0, grille: 0.30, chroma: 1.9,
    bar: 0.055, flicker: 0.042, grain: 0.038, noise: 1, vignette: 0.60, mono: 0, gain: 1.22, halo: 0.16,
    sheen: [0.62, 0.76, 1.0], room: [0.014, 0.020, 0.046], background: "#050a24",
    filtering: "linear", surface: { mode: "cap", width: 1600 }, redrawMs: 96,
  },
  nintendo: {
    curve: [0.070, 0.100], scanDensity: 0.34, scanDepth: 0.26, triadCss: 3.4, grille: 0.20, chroma: 0.55,
    bar: 0.018, flicker: 0.014, grain: 0.014, noise: 0, vignette: 0.46, mono: 0, gain: 1.20, halo: 0.06,
    sheen: [0.72, 0.84, 1.0], room: [0.020, 0.024, 0.040], background: "#0a1030",
    filtering: "nearest", surface: { mode: "fixed", width: 320, height: 180 }, redrawMs: 16,
  },
  /* CINTEL hero: the nintendo grid on flat glass. No curvature and only a trace
     of scanline and grille, so the scene reads as a page background, not a tube. */
  cintel: {
    curve: [0, 0], scanDensity: 0.34, scanDepth: 0.10, triadCss: 3.4, grille: 0.05, chroma: 0.2,
    bar: 0.006, flicker: 0.004, grain: 0.010, noise: 0, vignette: 0.30, mono: 0, gain: 1.04, halo: 0.03,
    sheen: [0.72, 0.84, 1.0], room: [0.031, 0.039, 0.078], background: "#080a14",
    filtering: "nearest", surface: { mode: "fixed", width: 384, height: 176 }, redrawMs: 33,
  },
};

export type ScreenPainter = (context: CanvasRenderingContext2D, width: number, height: number, time: number) => void;

const MONO_STACK = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';
const GROTESQUE_STACK = '"Helvetica Neue", "Inter", Helvetica, Arial, sans-serif';
const pad = (value: number, size = 2) => String(Math.floor(value)).padStart(size, "0");

/* ---------------------------------------------------------------- cinematic */

const CINEMATIC_CYCLE = 8;
const CINEMATIC_CHROME = [
  { text: "PICTURE START", corner: "tl" }, { text: "MONO · ACADEMY", corner: "bl" }, { text: "REEL 02 OF 04", corner: "br" },
] as const;

function registrationMark(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  context.beginPath(); context.moveTo(x - size, y); context.lineTo(x + size, y); context.moveTo(x, y - size); context.lineTo(x, y + size); context.stroke();
  context.beginPath(); context.arc(x, y, size * 0.52, 0, Math.PI * 2); context.stroke();
}

const paintCinematic: ScreenPainter = (context, width, height, time) => {
  const bar = height * 0.112, top = bar, bottom = height - bar, frameHeight = bottom - top;
  const cx = width / 2, cy = top + frameHeight / 2, radius = frameHeight * 0.325;
  const phase = ((time % CINEMATIC_CYCLE) + CINEMATIC_CYCLE) % CINEMATIC_CYCLE, counting = phase < 7;
  const label = Math.max(2, 9 - Math.ceil(phase || 0.0001));

  const wash = context.createLinearGradient(0, top, 0, bottom);
  wash.addColorStop(0, "#101013"); wash.addColorStop(0.55, "#08080a"); wash.addColorStop(1, "#0d0d10");
  context.setTransform(1, 0, 0, 1, 0, 0); context.fillStyle = wash; context.fillRect(0, 0, width, height);

  /* the running film edge: perforations scroll past on both sides of the frame */
  context.fillStyle = "rgba(236,236,240,0.20)";
  const pitch = frameHeight / 9, offset = (time * pitch * 2.4) % pitch, perfWidth = width * 0.011, perfHeight = pitch * 0.34;
  for (let y = top - pitch + offset; y < bottom + pitch; y += pitch) {
    context.fillRect(width * 0.022, y, perfWidth, perfHeight);
    context.fillRect(width - width * 0.022 - perfWidth, y, perfWidth, perfHeight);
  }

  context.strokeStyle = "rgba(238,238,244,0.16)"; context.lineWidth = Math.max(1, height * 0.0016);
  context.beginPath(); context.moveTo(cx, top); context.lineTo(cx, bottom); context.moveTo(width * 0.06, cy); context.lineTo(width * 0.94, cy); context.stroke();

  context.strokeStyle = "rgba(238,238,244,0.30)";
  for (const corner of ["tl", "tr", "bl", "br"] as const) {
    const x = corner.endsWith("l") ? width * 0.085 : width * 0.915, y = corner.startsWith("t") ? top + frameHeight * 0.16 : bottom - frameHeight * 0.16;
    registrationMark(context, x, y, height * 0.024);
  }

  if (counting) {
    context.strokeStyle = "rgba(240,240,246,0.42)"; context.lineWidth = Math.max(1.4, height * 0.0032);
    context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.stroke();
    context.strokeStyle = "rgba(240,240,246,0.22)";
    context.beginPath(); context.arc(cx, cy, radius * 0.845, 0, Math.PI * 2); context.stroke();

    const sweep = (phase % 1) * Math.PI * 2, start = -Math.PI / 2;
    context.fillStyle = "rgba(244,244,250,0.085)";
    context.beginPath(); context.moveTo(cx, cy); context.arc(cx, cy, radius, start, start + sweep); context.closePath(); context.fill();
    context.strokeStyle = "rgba(248,248,252,0.70)"; context.lineWidth = Math.max(1.2, height * 0.0026);
    context.beginPath(); context.moveTo(cx, cy); context.lineTo(cx + Math.cos(start + sweep) * radius, cy + Math.sin(start + sweep) * radius); context.stroke();

    context.strokeStyle = "rgba(238,238,244,0.34)"; context.lineWidth = Math.max(1, height * 0.0020);
    for (let tick = 0; tick < 12; tick += 1) {
      const angle = start + (tick / 12) * Math.PI * 2, inner = tick % 3 === 0 ? radius * 1.055 : radius * 1.028;
      context.beginPath(); context.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner); context.lineTo(cx + Math.cos(angle) * radius * 1.10, cy + Math.sin(angle) * radius * 1.10); context.stroke();
    }

    context.textAlign = "center"; context.textBaseline = "middle";
    context.shadowColor = "rgba(255,255,255,0.55)"; context.shadowBlur = height * 0.030;
    context.fillStyle = "#f6f6fa"; context.font = `700 ${(radius * 1.28).toFixed(2)}px ${GROTESQUE_STACK}`;
    context.fillText(String(label), cx, cy + radius * 0.02);
    context.shadowBlur = 0;
  } else {
    const flash = Math.max(0, 1 - (phase - 7) / 0.10);
    if (flash > 0) { context.fillStyle = `rgba(250,250,252,${(flash * 0.62).toFixed(3)})`; context.fillRect(0, top, width, frameHeight); }
    context.textAlign = "center"; context.textBaseline = "middle";
    context.fillStyle = "rgba(244,244,248,0.92)";
    const size = height * 0.052;
    context.font = `500 ${size.toFixed(2)}px ${MONO_STACK}`;
    const title = "T H E   L O N G   Q U I E T";
    context.shadowColor = "rgba(255,255,255,0.45)"; context.shadowBlur = height * 0.020;
    /* clear of the horizontal crosshair, which otherwise rules through the baseline */
    context.fillText(title, cx, cy - size * 0.78);
    context.shadowBlur = 0;
    context.font = `400 ${(size * 0.42).toFixed(2)}px ${MONO_STACK}`;
    context.fillStyle = "rgba(232,232,238,0.60)";
    context.fillText("S C E N E   1 4   ·   T A K E   0 3", cx, cy + size * 0.62);
  }

  const chromeSize = height * 0.0255;
  context.font = `500 ${chromeSize.toFixed(2)}px ${MONO_STACK}`; context.textBaseline = "middle"; context.fillStyle = "rgba(226,226,232,0.66)";
  for (const item of CINEMATIC_CHROME) {
    context.textAlign = item.corner.endsWith("l") ? "left" : "right";
    const x = item.corner.endsWith("l") ? width * 0.055 : width * 0.945;
    context.fillText(item.text, x, item.corner.startsWith("t") ? top + frameHeight * 0.055 : bottom - frameHeight * 0.055);
  }
  const frames = Math.floor(time * 24);
  context.textAlign = "right";
  context.fillStyle = "rgba(240,240,246,0.82)";
  context.fillText(`01:${pad((frames / 1440) % 60)}:${pad((frames / 24) % 60)}:${pad(frames % 24)}`, width * 0.945, top + frameHeight * 0.055);

  context.fillStyle = "#000"; context.fillRect(0, 0, width, bar); context.fillRect(0, bottom, width, bar + 1);
};

/* -------------------------------------------------------------- blue screen */

type BlueLine = { text: string; tone?: "head" | "dim" | "bright" };
const BLUE_LINES: BlueLine[] = [
  { text: "SIGNAL HALTED", tone: "head" }, { text: "" },
  { text: "A fault was detected in the video subsystem and the raster" },
  { text: "driver was stopped to prevent damage to the display." }, { text: "" },
  { text: "*  If this screen appears again, power the unit down and let" },
  { text: "   the flyback transformer discharge before restarting." }, { text: "" },
  { text: "*  Horizontal deflection module HD-04 reported a bad sync" },
  { text: "   pulse on line 312 of field 2." }, { text: "" },
  { text: "Technical information:", tone: "bright" }, { text: "" },
  { text: "***  STOP: 0x0000CA7E  (0x0F13D0C0, 0x00000002, 0xC0000005)" },
  { text: "***  RASTER.SYS  -  address 8C1FA00E  base at 8C1F0000" }, { text: "" },
];

const paintBlueScreen: ScreenPainter = (context, width, height, time) => {
  const wash = context.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, "#212ec0"); wash.addColorStop(0.62, "#1a22a4"); wash.addColorStop(1, "#141a86");
  context.setTransform(1, 0, 0, 1, 0, 0); context.fillStyle = wash; context.fillRect(0, 0, width, height);

  /* the panel is sized off the line budget so the whole fault report clears the
     curved edges of the tube at any aspect */
  const columns = 62, total = BLUE_LINES.length + 4;
  const size = Math.min((height * 0.88) / (total * 1.44), (width * 0.82) / (columns * 0.60));
  context.font = `600 ${size.toFixed(2)}px ${MONO_STACK}`;
  const advance = context.measureText("M").width || size * 0.6, lineHeight = size * 1.44;
  const blockWidth = advance * columns, left = Math.round((width - blockWidth) / 2);
  const startY = Math.round((height - total * lineHeight) / 2);
  context.textBaseline = "top"; context.textAlign = "left";

  const head = BLUE_LINES[0].text, headWidth = advance * (head.length + 4);
  context.fillStyle = "#e9ecff";
  context.fillRect(Math.round((width - headWidth) / 2), startY - size * 0.20, headWidth, lineHeight);
  context.fillStyle = "#161d92";
  context.fillText(head, Math.round((width - headWidth) / 2) + advance * 2, startY);

  context.shadowColor = "rgba(196,214,255,0.55)"; context.shadowBlur = size * 0.30;
  let y = startY + lineHeight;
  for (const line of BLUE_LINES.slice(1)) {
    if (line.text) {
      context.fillStyle = line.tone === "bright" ? "#ffffff" : line.tone === "dim" ? "#aab6f0" : "#dfe5ff";
      context.fillText(line.text, left, y);
    }
    y += lineHeight;
  }

  const dump = Math.min(100, Math.floor((((time % 12) + 12) % 12) * 22));
  context.fillStyle = "#dfe5ff";
  context.fillText(dump >= 100 ? "Dump of video memory complete." : `Beginning dump of video memory: ${pad(dump, 2)}%`, left, y);
  y += lineHeight * 2;
  const prompt = "Press any key to restart the deflection stage ";
  context.fillText(prompt, left, y);
  if (Math.floor(time * 2) % 2 === 0) context.fillRect(left + advance * prompt.length, y + size * 0.08, advance * 0.9, size * 0.96);
  context.shadowBlur = 0;
};

/* ----------------------------------------------------------------- nintendo */

export const GLYPHS: Record<string, string> = {
  "0": ".###.#...##..###.#.###..##...#.###.", "1": "..#...##....#....#....#....#...###.", "2": ".###.#...#....#...#...#...#...#####",
  "3": "####.....#....#.###.....#....#####.", "4": "#..#.#..#.#..#.#####...#....#....#.", "5": "######....####.....#....##...#.###.",
  "6": ".###.#....#....####.#...##...#.###.", "7": "#####....#...#...#...#....#....#...", "8": ".###.#...##...#.###.#...##...#.###.",
  "9": ".###.#...##...#.####....#....#.###.", A: ".###.#...##...#######...##...##...#", B: "####.#...##...#####.#...##...#####.",
  C: ".#####....#....#....#....#.....####", D: "####.#...##...##...##...##...#####.", E: "######....#....####.#....#....#####",
  F: "######....#....####.#....#....#....", G: ".#####....#....#..###...##...#.####", H: "#...##...##...#######...##...##...#",
  I: "#####..#....#....#....#....#..#####", J: "....#....#....#....##...##...#.###.", K: "#...##..#.#.#..##...#.#..#..#.#...#",
  L: "#....#....#....#....#....#....#####", M: "#...###.###.#.##...##...##...##...#", N: "#...###..##.#.##..###...##...##...#",
  O: ".###.#...##...##...##...##...#.###.", P: "####.#...##...#####.#....#....#....", Q: ".###.#...##...##...##.#.##..#..##.#",
  R: "####.#...##...#####.#.#..#..#.#...#", S: ".#####....#.....###.....#....#####.", T: "#####..#....#....#....#....#....#..",
  U: "#...##...##...##...##...##...#.###.", V: "#...##...##...##...##...#.#.#...#..", W: "#...##...##...##...##.#.###.###...#",
  X: "#...##...#.#.#...#...#.#.#...##...#", Y: "#...##...#.#.#...#....#....#....#..", Z: "#####....#...#...#...#...#....#####",
  " ": "...................................", "-": "...............#####...............", ".": "..........................##...##..",
  ":": "......##...##........##...##.......", "!": "..#....#....#....#....#.........#..", "?": ".###.#...#....#..##...#.........#..",
  "(": "..##..#....#....#....#....#.....##.", ")": ".##.....#....#....#....#....#..##..", "/": "....#....#...#...#...#...#....#....",
  "*": ".....#.#.#.###.#####.###.#.#.#.....", "'": "..#....#...........................",
};

const GLYPH_WIDTH = 5, GLYPH_HEIGHT = 7;

function pixelTextWidth(text: string, scale: number) {
  return text.length ? (text.length * (GLYPH_WIDTH + 1) - 1) * scale : 0;
}

function drawPixelText(context: CanvasRenderingContext2D, text: string, x: number, y: number, scale: number, color: string) {
  context.fillStyle = color;
  let cursor = x;
  for (const character of text.toUpperCase()) {
    const rows = GLYPHS[character];
    if (rows) {
      for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
        for (let column = 0; column < GLYPH_WIDTH; column += 1) {
          if (rows[row * GLYPH_WIDTH + column] === "#") context.fillRect(cursor + column * scale, y + row * scale, scale, scale);
        }
      }
    }
    cursor += (GLYPH_WIDTH + 1) * scale;
  }
}

export const RUNNER_PALETTE: Record<string, string> = { "1": "#1a1028", "2": "#e0402c", "3": "#f4f4f4", "4": "#2ec4e8", "5": "#22304a" };
export const RUNNER_HEAD = [
  "....111111....", "...13333331...", "..1333333331..", "..1355555531..", "..1355555531..", "..1333333331..", "...13333331...", "....111111....",
  "...12222221...", ".122222222221.", ".124444444421.", ".122222222221.", "..1222222221..",
];
export const RUNNER_LEGS: Record<string, string[]> = {
  a: ["...122..221...", "...122..221...", "..1111..1111.."],
  b: ["..122....221..", ".122......221.", "1111......1111"],
  jump: ["..122....221..", ".1221....1221.", ".111......111."],
};

function drawRunner(context: CanvasRenderingContext2D, x: number, y: number, pose: keyof typeof RUNNER_LEGS, flip: boolean) {
  const rows = [...RUNNER_HEAD, ...RUNNER_LEGS[pose]];
  for (let row = 0; row < rows.length; row += 1) {
    const line = rows[row];
    for (let column = 0; column < line.length; column += 1) {
      const color = RUNNER_PALETTE[line[column]];
      if (color) { context.fillStyle = color; context.fillRect(x + (flip ? line.length - 1 - column : column), y + row, 1, 1); }
    }
  }
}

function drawCloud(context: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  context.fillStyle = "#f4f8ff";
  const puffs: readonly (readonly [number, number, number, number])[] = [[0, 4, 22, 6], [4, 1, 14, 4], [11, 2, 12, 5], [2, 8, 20, 3]];
  for (const [dx, dy, w, h] of puffs) context.fillRect(Math.round(x + dx * scale), Math.round(y + dy * scale), Math.round(w * scale), Math.round(h * scale));
}

function drawHill(context: CanvasRenderingContext2D, x: number, baseY: number, size: number, color: string) {
  context.fillStyle = color;
  for (let step = 0; step < size; step += 1) {
    const width = (size - step) * 4;
    context.fillRect(Math.round(x - width / 2), baseY - (step + 1) * 3, width, 3);
  }
}

/* one 320x180 title screen, laid out so the wordmark, credit, prompt, crates, and
   the runner's jump arc each own a horizontal band and never overlap */
const NINTENDO_CYCLE = 10;
const CRATE_X = [118, 208], GROUND_ROW = 154, JUMP_SPAN = 50, JUMP_LIFT = 22;

function drawCrate(context: CanvasRenderingContext2D, x: number, y: number) {
  context.fillStyle = "#20140c"; context.fillRect(x, y, 16, 16);
  context.fillStyle = "#d8902c"; context.fillRect(x + 1, y + 1, 14, 14);
  context.fillStyle = "#f0c060"; context.fillRect(x + 1, y + 1, 14, 3);
  context.fillStyle = "#8a5414"; context.fillRect(x + 1, y + 11, 14, 3);
  context.fillStyle = "#20140c";
  context.fillRect(x + 6, y + 5, 4, 2); context.fillRect(x + 5, y + 7, 6, 2); context.fillRect(x + 6, y + 9, 4, 2);
}

function drawGem(context: CanvasRenderingContext2D, x: number, y: number, spin: number) {
  const gemWidth = [8, 6, 2, 6][spin], half = gemWidth / 2, inset = gemWidth > 3 ? 1 : 0;
  context.fillStyle = "#20140c";
  context.fillRect(x - half - 1, y + 1, gemWidth + 2, 8); context.fillRect(x - half, y - 1, gemWidth, 12);
  context.fillStyle = "#ffe070";
  context.fillRect(x - half, y + 1, gemWidth, 8); context.fillRect(x - half + inset, y, gemWidth - inset * 2, 10);
  context.fillStyle = "#fff8c8"; context.fillRect(x - half + inset, y + 2, Math.max(1, half - inset), 4);
}

const paintNintendo: ScreenPainter = (context, width, height, time) => {
  const groundY = GROUND_ROW, phase = ((time % NINTENDO_CYCLE) + NINTENDO_CYCLE) % NINTENDO_CYCLE;

  const sky = context.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, "#2440b8"); sky.addColorStop(0.55, "#5c94fc"); sky.addColorStop(1, "#9ecbff");
  context.setTransform(1, 0, 0, 1, 0, 0); context.fillStyle = sky; context.fillRect(0, 0, width, height);

  for (let star = 0; star < 22; star += 1) {
    const x = (star * 61) % width, y = 2 + ((star * 29) % 16);
    context.fillStyle = (star + Math.floor(time * 3)) % 5 === 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.30)";
    context.fillRect(x, y, 1, 1);
  }

  /* clouds sit in the sky band above the wordmark, never behind its counters */
  for (const [speed, cloudY, scale] of [[6, 18, 1.25], [3.5, 32, 0.85]] as const) {
    const span = width + 80;
    for (let copy = 0; copy < 3; copy += 1) drawCloud(context, (((time * speed) + (copy * span) / 3) % span) - 50, cloudY + (copy % 2) * 5, scale);
  }

  drawHill(context, 48, groundY, 9, "#2f7a3a");
  drawHill(context, 268, groundY, 11, "#2f7a3a");
  drawHill(context, 160, groundY, 6, "#3e9a48");

  context.fillStyle = "#3ca03c"; context.fillRect(0, groundY, width, 4);
  context.fillStyle = "#2c7a2c"; context.fillRect(0, groundY + 4, width, 2);
  context.fillStyle = "#a05a28"; context.fillRect(0, groundY + 6, width, height - groundY - 6);
  context.fillStyle = "#7c4018";
  for (let y = groundY + 6; y < height; y += 6) {
    context.fillRect(0, y, width, 1);
    for (let x = (y % 12 === 0 ? 0 : 6); x < width; x += 12) context.fillRect(x, y, 1, 6);
  }

  const spin = Math.floor(time * 8) % 4, bob = [0, 1, 1, 0][Math.floor(time * 6) % 4];
  for (const crateX of CRATE_X) { drawCrate(context, crateX, groundY - 16); drawGem(context, crateX + 8, groundY - 32 - bob, spin); }

  const runX = Math.round(-24 + ((phase / NINTENDO_CYCLE) * (width + 60)));
  let lift = 0;
  for (const crateX of CRATE_X) {
    const progress = (runX - (crateX - 28)) / JUMP_SPAN;
    if (progress > 0 && progress < 1) lift = Math.max(lift, Math.sin(progress * Math.PI) * JUMP_LIFT);
  }
  const pose = lift > 0.5 ? "jump" : Math.floor(time * 9) % 2 === 0 ? "a" : "b";
  context.fillStyle = "rgba(20,16,10,0.20)"; context.fillRect(runX + 2, groundY - 1, 10, 2);
  drawRunner(context, runX, groundY - 16 - Math.round(lift), pose, false);

  for (const [text, x] of [["PLAYER-1", 10], ["GEMS 0" + (2 + Math.floor(phase / 4)), 96], ["WORLD 1-1", 174], ["TIME " + pad(Math.max(0, 384 - Math.floor(time * 2)) % 1000, 3), 254]] as const) {
    drawPixelText(context, String(text), Number(x), 7, 1, "#141428");
    drawPixelText(context, String(text), Number(x), 6, 1, "#ffffff");
  }

  const title = "RASTER RUN", titleWidth = pixelTextWidth(title, 3), titleX = Math.round((width - titleWidth) / 2);
  drawPixelText(context, title, titleX + 3, 53, 3, "#141028");
  drawPixelText(context, title, titleX, 50, 3, "#f8e038");
  /* a highlight band sweeps the wordmark the way an attract-mode title does */
  const sweepX = titleX + ((time * 130) % (titleWidth + 110)) - 55;
  context.save();
  context.beginPath(); context.rect(sweepX, 50, 24, 21); context.clip();
  drawPixelText(context, title, titleX, 50, 3, "#fffce0");
  context.restore();

  const credit = "(C) 1987 THREEUI", creditX = Math.round((width - pixelTextWidth(credit, 1)) / 2);
  drawPixelText(context, credit, creditX, 79, 1, "#0e1430");
  drawPixelText(context, credit, creditX, 78, 1, "#dfe8ff");

  if (Math.floor(time * 1.6) % 2 === 0) {
    const start = "PUSH START", startX = Math.round((width - pixelTextWidth(start, 2)) / 2);
    drawPixelText(context, start, startX + 2, 100, 2, "#141028");
    drawPixelText(context, start, startX, 98, 2, "#ffffff");
  }
};

/* ------------------------------------------------------------------- cintel */

/* A 384x176 night level behind the CINTEL hero. The page copy sits over the
   left of the sky and the Next Up card over the right, so the busy art keeps to
   the bottom band (ground, platforms, coins, flag) and the right edge (the SRM
   building); the sky between them stays dark enough for cream type. */

const CINTEL_GROUND = 150;

const CINTEL_CLOUD = [
  "........1111..........",
  "......11111111..11....",
  "....1111111111111111..",
  "..11111111111111111111",
  ".111111111111111111111",
  "1122222111111222222211",
  "2222222222222222222222",
  ".33333222222222223333.",
  "...3333333333333333...",
];
const CINTEL_CLOUD_TONES: Record<string, string> = { "1": "#e2cfa4", "2": "#8e9fba", "3": "#4d5d7c" };

function cintelCloud(context: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  for (let row = 0; row < CINTEL_CLOUD.length; row += 1) {
    const line = CINTEL_CLOUD[row];
    for (let column = 0; column < line.length; column += 1) {
      const tone = CINTEL_CLOUD_TONES[line[column]];
      if (tone) { context.fillStyle = tone; context.fillRect(Math.round(x) + column * scale, y + row * scale, scale, scale); }
    }
  }
}

function cintelDisc(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string) {
  context.fillStyle = color;
  for (let dy = -radius; dy <= radius; dy += 1) {
    const half = Math.round(Math.sqrt(radius * radius - dy * dy));
    context.fillRect(cx - half, cy + dy, half * 2, 1);
  }
}

function cintelTree(context: CanvasRenderingContext2D, x: number, radius: number, dark = false) {
  const cy = CINTEL_GROUND - radius - 6;
  context.fillStyle = dark ? "#1b1410" : "#3b2414"; context.fillRect(x - 2, cy + radius - 2, 4, CINTEL_GROUND - cy - radius + 2);
  cintelDisc(context, x, cy, radius, dark ? "#0f2418" : "#1f4a26");
  cintelDisc(context, x - 1, cy - 1, radius - 2, dark ? "#15311f" : "#2f6d31");
  cintelDisc(context, x - Math.round(radius * 0.3), cy - Math.round(radius * 0.35), Math.max(2, Math.round(radius * 0.42)), dark ? "#1d3f27" : "#4f9a40");
  /* a scatter of leaf pixels breaks the disc edge so it reads as foliage */
  context.fillStyle = dark ? "#1d3f27" : "#62b24c";
  for (let leaf = 0; leaf < radius; leaf += 1) {
    const angle = leaf * 2.4, reach = radius * (0.35 + ((leaf * 7) % 5) / 10);
    context.fillRect(Math.round(x + Math.cos(angle) * reach), Math.round(cy + Math.sin(angle) * reach), 1, 1);
  }
}

function cintelBricks(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  context.fillStyle = "#8a4a1c"; context.fillRect(x, y, width, height);
  for (let row = 0; row * 6 < height; row += 1) {
    const top = y + row * 6;
    context.fillStyle = "#a8612a"; context.fillRect(x, top + 1, width, 1);
    context.fillStyle = "#5e2f10"; context.fillRect(x, top, width, 1);
    for (let brick = x + (row % 2 ? 6 : 0); brick < x + width; brick += 12) context.fillRect(brick, top, 1, Math.min(6, y + height - top));
  }
}

function cintelGrass(context: CanvasRenderingContext2D, x: number, y: number, width: number) {
  context.fillStyle = "#2e7a24"; context.fillRect(x - 1, y, width + 2, 5);
  context.fillStyle = "#4caf3a"; context.fillRect(x - 1, y, width + 2, 3);
  context.fillStyle = "#86d957";
  for (let blade = x; blade < x + width; blade += 3) context.fillRect(blade, y, 1, 1);
  context.fillStyle = "#2e7a24";
  for (let drip = x + 2; drip < x + width - 1; drip += 5) context.fillRect(drip, y + 5, 2, 1 + (drip % 2));
}

const CINTEL_PLATFORMS: readonly (readonly [number, number, number])[] = [[148, 32, 18], [226, 30, 12], [296, 34, 22], [352, 26, 10]];

function cintelCoin(context: CanvasRenderingContext2D, x: number, y: number, spin: number) {
  const coinWidth = [7, 5, 2, 5][spin], half = Math.floor(coinWidth / 2);
  context.fillStyle = "#6e4206"; context.fillRect(x - half - 1, y, coinWidth + 2, 10); context.fillRect(x - half, y - 1, coinWidth, 12);
  context.fillStyle = "#f5b316"; context.fillRect(x - half, y, coinWidth, 10);
  if (coinWidth > 2) { context.fillStyle = "#ffe27a"; context.fillRect(x - half + 1, y + 1, 1, 7); context.fillStyle = "#c98a0c"; context.fillRect(x + half - 1, y + 2, 1, 7); }
}

function cintelBuilding(context: CanvasRenderingContext2D, left: number, time: number) {
  const top = 30, right = 384;
  context.fillStyle = "#6f6a5c"; context.fillRect(left - 6, top + 4, 6, CINTEL_GROUND - top - 4);
  context.fillStyle = "#b3aa92"; context.fillRect(left, top, right - left, CINTEL_GROUND - top);
  context.fillStyle = "#d8d0b8"; context.fillRect(left - 6, top - 5, right - left + 6, 5);
  context.fillStyle = "#6f6a5c"; context.fillRect(left - 6, top, right - left + 6, 1);
  for (let column = left + 3; column < right; column += 12) {
    context.fillStyle = "#d6cfba"; context.fillRect(column, top + 4, 3, CINTEL_GROUND - top - 4);
    context.fillStyle = "#8a8472"; context.fillRect(column + 3, top + 4, 1, CINTEL_GROUND - top - 4);
  }
  for (let row = 0; row < 6; row += 1) {
    for (let column = left + 8; column + 5 < right; column += 12) {
      const lit = ((row * 5 + column) % 7 === 0) !== (Math.floor(time * 0.5 + row + column) % 11 === 0);
      context.fillStyle = lit ? "#f2c14e" : "#1c2a44"; context.fillRect(column, top + 10 + row * 16, 5, 9);
      context.fillStyle = "#8a8472"; context.fillRect(column, top + 19 + row * 16, 5, 1);
    }
  }
  /* the name board sits on the roof's right end, clear of the Next Up card
     that overlaps the building's left side */
  const boardWidth = pixelTextWidth("SRM", 2) + 10, boardLeft = right - boardWidth - 3;
  context.fillStyle = "#7d7564"; context.fillRect(boardLeft - 1, top - 25, boardWidth + 2, 20);
  context.fillStyle = "#cfc5a6"; context.fillRect(boardLeft, top - 24, boardWidth, 18);
  context.fillStyle = "#e6dcc0"; context.fillRect(boardLeft, top - 24, boardWidth, 2);
  drawPixelText(context, "SRM", boardLeft + 5, top - 21, 2, "#3a3326");
}

const paintCintel: ScreenPainter = (context, width, height, time) => {
  const ground = CINTEL_GROUND;

  const sky = context.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, "#080a14"); sky.addColorStop(0.6, "#0e1628"); sky.addColorStop(1, "#18223a");
  context.setTransform(1, 0, 0, 1, 0, 0); context.fillStyle = sky; context.fillRect(0, 0, width, height);

  for (let star = 0; star < 46; star += 1) {
    const x = (star * 97 + 13) % width, y = 3 + ((star * 53) % 104);
    context.fillStyle = (star + Math.floor(time * 2)) % 7 === 0 ? "rgba(214,224,255,0.9)" : "rgba(214,224,255,0.28)";
    context.fillRect(x, y, 1, 1);
  }

  /* faint outlined tiles, the level editor's grid showing through */
  context.fillStyle = "rgba(160,176,220,0.10)";
  for (const [x, y, size] of [[6, 58, 9], [6, 84, 9], [6, 110, 9], [192, 70, 8], [206, 58, 8], [212, 96, 8]] as const) {
    context.fillRect(x, y, size, 1); context.fillRect(x, y + size - 1, size, 1); context.fillRect(x, y, 1, size); context.fillRect(x + size - 1, y, 1, size);
  }

  /* far skyline and treeline, one step lighter than the sky */
  context.fillStyle = "#0f182b";
  for (let x = 0; x < width; x += 6) {
    const rise = 14 + ((x * 37) % 19) + (x % 30 === 0 ? 10 : 0);
    context.fillRect(x, ground - rise - 12, 6, rise + 12);
  }
  for (let x = 0; x < width; x += 5) cintelDisc(context, x, ground - 8, 5 + ((x * 13) % 5), "#142434");

  for (const [base, y, scale, speed] of [[150, 16, 2, 1.6], [300, 6, 1, 2.4], [-8, 88, 2, 1.1], [60, 30, 1, 2.0]] as const) {
    const span = width + 60, x = ((((base + time * speed) % span) + span) % span) - 50;
    cintelCloud(context, x, y, scale);
  }

  cintelBuilding(context, 334, time);
  cintelCloud(context, 346 + Math.sin(time * 0.4) * 3, 64, 2);

  cintelTree(context, 30, 10, true);
  cintelTree(context, 106, 9, true);
  cintelTree(context, 176, 18);
  cintelTree(context, 262, 12);
  cintelTree(context, 318, 15);
  cintelTree(context, 372, 13);

  cintelBricks(context, 0, ground + 5, width, height - ground - 5);
  cintelGrass(context, 0, ground, width);

  const spin = Math.floor(time * 8) % 4, bob = [0, 1, 1, 0][Math.floor(time * 5) % 4];
  for (const [x, platformWidth, rise] of CINTEL_PLATFORMS) {
    cintelBricks(context, x, ground - rise, platformWidth, rise);
    cintelGrass(context, x, ground - rise, platformWidth);
  }
  for (const [x, platformWidth, rise] of CINTEL_PLATFORMS.slice(0, 3)) cintelCoin(context, x + Math.floor(platformWidth / 2), ground - rise - 17 - bob, spin);

  /* goal flag on the last platform */
  const [flagPlatform, , flagRise] = CINTEL_PLATFORMS[3], poleX = flagPlatform + 4, poleTop = ground - flagRise - 34;
  context.fillStyle = "#d9d9d9"; context.fillRect(poleX, poleTop, 1, 34);
  context.fillStyle = "#f2c14e"; context.fillRect(poleX - 1, poleTop - 2, 3, 2);
  for (let column = 0; column < 13; column += 1) {
    const wave = Math.round(Math.sin(time * 6 - column * 0.6) * (column / 12) * 1.6);
    context.fillStyle = "#e0304a"; context.fillRect(poleX + 1 + column, poleTop + 1 + wave, 1, 8 - Math.floor(column / 5));
    context.fillStyle = "#a01c30"; context.fillRect(poleX + 1 + column, poleTop + 8 - Math.floor(column / 5) + wave, 1, 1);
  }

  /* the runner holds the left of the level, running in place with speed lines */
  const stride = Math.floor(time * 10) % 2, runnerX = 44, runnerY = ground - 16 - stride;
  context.fillStyle = "rgba(20,16,10,0.35)"; context.fillRect(runnerX + 2, ground - 1, 10, 1);
  context.fillStyle = "rgba(220,230,255,0.7)";
  for (const [dy, length] of [[4, 6], [8, 9], [12, 5]] as const) context.fillRect(runnerX - 3 - length - ((Math.floor(time * 14) + dy) % 3), runnerY + dy, length, 1);
  drawRunner(context, runnerX, runnerY, stride ? "a" : "b", false);
};

export const CRT_SCREENS: Record<Exclude<CrtVariant, "terminal">, ScreenPainter> = {
  cinematic: paintCinematic,
  "blue-screen": paintBlueScreen,
  nintendo: paintNintendo,
  cintel: paintCintel,
};
