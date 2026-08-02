/**
 * Procedural surface library for the Dream Room.
 *
 * Every texture here is painted into a canvas at runtime, so the scene still
 * loads no external asset. Each `Surface` carries a colour map plus the maps
 * that actually sell the material: a normal map derived from a height pass and
 * a roughness map, so light breaks across grain, weave, and bark instead of
 * sliding over flat plastic.
 */

import * as THREE from "three";

export type Surface = {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
};

type Painter = {
  size: number;
  color: CanvasRenderingContext2D;
  height: CanvasRenderingContext2D;
  rough: CanvasRenderingContext2D;
};

const HEIGHT_SCALE = 0.5;

function makeCanvas(width: number, height = width) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  return ctx;
}

/** Deterministic noise so a reload always paints the same room. */
function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Three canvases sharing one coordinate space: colour at full resolution,
 * height and roughness at half. Drawing code can address all three in the same
 * units without tracking the resolution difference.
 */
function painter(size: number): Painter {
  const color = context(makeCanvas(size));
  const height = context(makeCanvas(size * HEIGHT_SCALE));
  const rough = context(makeCanvas(size * HEIGHT_SCALE));
  height.scale(HEIGHT_SCALE, HEIGHT_SCALE);
  rough.scale(HEIGHT_SCALE, HEIGHT_SCALE);
  return { size, color, height, rough };
}

function fill(painting: Painter, color: string, heightLevel: string, roughLevel: string) {
  const { size } = painting;
  painting.color.fillStyle = color;
  painting.color.fillRect(0, 0, size, size);
  painting.height.fillStyle = heightLevel;
  painting.height.fillRect(0, 0, size, size);
  painting.rough.fillStyle = roughLevel;
  painting.rough.fillRect(0, 0, size, size);
}

/**
 * Sobel-style height-to-normal conversion. Sampling wraps, so a tiling height
 * pass produces a tiling normal map with no seam down the repeat boundary.
 */
function normalFromHeight(ctx: CanvasRenderingContext2D, strength = 2.2) {
  const { width, height } = ctx.canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  const pixels = new Uint8Array(width * height * 4);
  const at = (x: number, y: number) =>
    data[((((y % height) + height) % height) * width + (((x % width) + width) % width)) * 4] / 255;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = (at(x - 1, y) - at(x + 1, y)) * strength;
      const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
      const length = Math.hypot(dx, dy, 1);
      const index = (y * width + x) * 4;
      pixels[index] = ((dx / length) * 0.5 + 0.5) * 255;
      pixels[index + 1] = ((dy / length) * 0.5 + 0.5) * 255;
      pixels[index + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      pixels[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function createSurfaceFactory(anisotropy: number) {
  const dress = (texture: THREE.Texture, repeat: number, srgb: boolean) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    texture.anisotropy = anisotropy;
    if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const resolve = (painting: Painter, repeat: number, normalStrength: number): Surface => {
    const map = dress(new THREE.CanvasTexture(painting.color.canvas), repeat, true);
    const normalMap = normalFromHeight(painting.height, normalStrength);
    dress(normalMap, repeat, false);
    const roughnessMap = dress(new THREE.CanvasTexture(painting.rough.canvas), repeat, false);
    return { map, normalMap, roughnessMap };
  };

  /** Soft irregular blotches — wear, dust, uneven sheen. */
  const mottle = (
    ctx: CanvasRenderingContext2D,
    size: number,
    count: number,
    colors: string[],
    radius: [number, number],
    seed: number,
  ) => {
    const random = rng(seed);
    for (let i = 0; i < count; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const r = radius[0] + random() * (radius[1] - radius[0]);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      const color = colors[Math.floor(random() * colors.length)];
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  /** Fine speckle that keeps large flat areas from reading as vinyl. */
  const speckle = (ctx: CanvasRenderingContext2D, size: number, count: number, alpha: number, seed: number) => {
    const random = rng(seed);
    for (let i = 0; i < count; i += 1) {
      const shade = Math.floor(random() * 255);
      ctx.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`;
      ctx.fillRect(random() * size, random() * size, 1.4, 1.4);
    }
  };

  /**
   * Oiled oak boards laid along X, with grain, knots, and routed seams.
   * `tone` is the mid colour of a board, so the same painter serves the dark
   * floor and the honey-coloured desk without repeating the drawing code.
   */
  const oakBoards = (tone: [number, number, number], repeat: number, seed: number): Surface => {
    const painting = painter(1024);
    const { size, color, height, rough } = painting;
    fill(painting, `rgb(${tone[0]},${tone[1]},${tone[2]})`, "#8c8c8c", "#b4b4b4");
    const random = rng(seed);
    const planks = 8;
    const plankHeight = size / planks;

    for (let row = 0; row < planks; row += 1) {
      const top = row * plankHeight;
      const shade = 0.86 + random() * 0.28;
      color.fillStyle = `rgb(${Math.round(tone[0] * shade)},${Math.round(tone[1] * shade)},${Math.round(tone[2] * shade)})`;
      color.fillRect(0, top, size, plankHeight);

      // Grain follows the board, wandering just enough to look sawn.
      for (let line = 0; line < 26; line += 1) {
        const base = top + (line + random() * 0.6) * (plankHeight / 26);
        const strong = line % 6 === 0;
        color.strokeStyle = strong ? "rgba(74,48,31,0.34)" : "rgba(58,38,25,0.13)";
        color.lineWidth = strong ? 2.1 : 1;
        height.strokeStyle = strong ? "#6d6d6d" : "#828282";
        height.lineWidth = strong ? 2.4 : 1.2;
        color.beginPath();
        height.beginPath();
        for (let x = 0; x <= size; x += 16) {
          const wobble = Math.sin(x * 0.011 + row * 2.3 + line) * 3.4 + Math.sin(x * 0.047 + line * 0.7) * 1.2;
          if (x === 0) {
            color.moveTo(x, base + wobble);
            height.moveTo(x, base + wobble);
          } else {
            color.lineTo(x, base + wobble);
            height.lineTo(x, base + wobble);
          }
        }
        color.stroke();
        height.stroke();
      }

      if (row % 3 === 1) {
        const knotX = 120 + random() * (size - 260);
        const knotY = top + plankHeight * (0.32 + random() * 0.36);
        for (let ring = 6; ring > 0; ring -= 1) {
          color.strokeStyle = `rgba(63,39,24,${0.09 + ring * 0.035})`;
          color.lineWidth = 1.8;
          color.beginPath();
          color.ellipse(knotX, knotY, ring * 5.5, ring * 3.1, 0.4, 0, Math.PI * 2);
          color.stroke();
        }
        height.fillStyle = "#6a6a6a";
        height.beginPath();
        height.ellipse(knotX, knotY, 13, 8, 0.4, 0, Math.PI * 2);
        height.fill();
      }

      // Butt joints stagger per row so the boards do not line up.
      const joint = ((row * 317) % 900) + 60;
      color.fillStyle = "rgba(48,30,20,0.5)";
      color.fillRect(joint, top, 2.5, plankHeight);
      height.fillStyle = "#3c3c3c";
      height.fillRect(joint - 1, top, 4, plankHeight);

      color.fillStyle = "rgba(42,26,17,0.42)";
      color.fillRect(0, top, size, 2.5);
      height.fillStyle = "#3a3a3a";
      height.fillRect(0, top - 1, size, 4);
    }

    // Waxed patches: where the floor is walked, it is smoother and shinier.
    mottle(rough, size, 26, ["rgba(60,60,60,0.5)", "rgba(210,210,210,0.36)"], [70, 230], seed + 14);
    mottle(color, size, 18, ["rgba(255,236,205,0.07)", "rgba(46,29,19,0.09)"], [90, 260], seed + 26);
    speckle(color, size, 5200, 0.05, seed + 5);
    return resolve(painting, repeat, 1.5);
  };

  const oakFloor = () => oakBoards([150, 106, 72], 2.4, 7);
  // Box faces are UV-mapped 0..1 whatever their size, so the desk repeat has
  // to stay low — a high one turns a drawer front into corduroy.
  const oakDesk = () => oakBoards([198, 151, 104], 0.55, 41);

  /** Hand-troweled plaster: broad swells, a fine tooth, dust along the base. */
  const plaster = (): Surface => {
    const painting = painter(1024);
    const { size, color, height, rough } = painting;
    fill(painting, "#d9cfc1", "#8a8a8a", "#e2e2e2");
    const random = rng(91);

    for (let i = 0; i < 150; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const width = 60 + random() * 190;
      const angle = (random() - 0.5) * 0.9;
      color.save();
      height.save();
      color.translate(x, y);
      height.translate(x, y);
      color.rotate(angle);
      height.rotate(angle);
      color.fillStyle = random() > 0.5 ? "rgba(255,250,240,0.13)" : "rgba(150,134,116,0.1)";
      height.fillStyle = random() > 0.5 ? "rgba(190,190,190,0.3)" : "rgba(110,110,110,0.3)";
      color.fillRect(-width / 2, -9, width, 18);
      height.fillRect(-width / 2, -9, width, 18);
      color.restore();
      height.restore();
    }

    speckle(height, size, 22000, 0.16, 4);
    speckle(color, size, 15000, 0.045, 5);
    mottle(rough, size, 20, ["rgba(255,255,255,0.3)", "rgba(120,120,120,0.28)"], [110, 300], 63);
    return resolve(painting, 3.1, 1.1);
  };

  /** Loop-pile wool: concentric bands over a visible weave. */
  const wovenWool = (): Surface => {
    const painting = painter(768);
    const { size, color, height, rough } = painting;
    fill(painting, "#ab8f6d", "#8a8a8a", "#f0f0f0");

    for (let ring = 0; ring < 15; ring += 1) {
      const radius = size * 0.5 - ring * (size * 0.031);
      color.strokeStyle = ring % 3 === 0 ? "rgba(110,84,58,0.4)" : "rgba(199,175,141,0.34)";
      color.lineWidth = ring % 3 === 0 ? 8 : 5;
      color.beginPath();
      color.arc(size / 2, size / 2, Math.max(radius, 4), 0, Math.PI * 2);
      color.stroke();
    }

    // Warp and weft, drawn as raised loops rather than a flat grid.
    for (let y = 0; y < size; y += 6) {
      for (let x = 0; x < size; x += 6) {
        const raised = (x / 6 + y / 6) % 2 === 0;
        height.fillStyle = raised ? "rgba(215,215,215,0.75)" : "rgba(84,84,84,0.7)";
        height.fillRect(x, y, 6, 6);
        color.fillStyle = raised ? "rgba(238,222,196,0.09)" : "rgba(78,60,42,0.12)";
        color.fillRect(x, y, 6, 6);
      }
    }

    speckle(color, size, 9000, 0.07, 77);
    mottle(rough, size, 14, ["rgba(255,255,255,0.35)"], [60, 170], 88);
    return resolve(painting, 1, 1.9);
  };

  /** Deep vertical bark fissures for the trunk. */
  const bark = (): Surface => {
    const painting = painter(768);
    const { size, color, height, rough } = painting;
    fill(painting, "#83573b", "#909090", "#f2f2f2");
    const random = rng(303);

    for (let i = 0; i < 130; i += 1) {
      const x = random() * size;
      const width = 4 + random() * 16;
      const depth = random();
      color.strokeStyle = depth > 0.5 ? "rgba(48,30,20,0.55)" : "rgba(150,109,74,0.34)";
      color.lineWidth = width * 0.6;
      height.strokeStyle = depth > 0.5 ? "rgba(38,38,38,0.85)" : "rgba(208,208,208,0.6)";
      height.lineWidth = width * 0.6;
      color.beginPath();
      height.beginPath();
      for (let y = 0; y <= size; y += 14) {
        const drift = Math.sin(y * 0.021 + i) * 9 + Math.sin(y * 0.006 + i * 2.1) * 17;
        if (y === 0) {
          color.moveTo(x + drift, y);
          height.moveTo(x + drift, y);
        } else {
          color.lineTo(x + drift, y);
          height.lineTo(x + drift, y);
        }
      }
      color.stroke();
      height.stroke();
    }

    // Lichen: the patches that make bark look outdoors rather than sculpted.
    mottle(color, size, 26, ["rgba(150,164,124,0.16)", "rgba(84,96,74,0.14)"], [16, 54], 404);
    mottle(rough, size, 22, ["rgba(160,160,160,0.4)"], [30, 110], 414);
    speckle(height, size, 16000, 0.2, 55);
    return resolve(painting, 3, 2.8);
  };

  /** Clustered leaf shapes so the crown reads as foliage, not as green spheres. */
  const foliage = (): Surface => {
    const painting = painter(768);
    const { size, color, height, rough } = painting;
    fill(painting, "#4c765b", "#7c7c7c", "#dcdcdc");
    const random = rng(515);
    const greens = ["#5f8a63", "#7ba471", "#3f6650", "#8bb078", "#456e56"];

    for (let i = 0; i < 620; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const length = 16 + random() * 30;
      const angle = random() * Math.PI * 2;
      color.save();
      height.save();
      color.translate(x, y);
      height.translate(x, y);
      color.rotate(angle);
      height.rotate(angle);
      color.fillStyle = greens[Math.floor(random() * greens.length)];
      height.fillStyle = `rgba(255,255,255,${0.14 + random() * 0.3})`;
      color.beginPath();
      color.ellipse(0, 0, length, length * 0.42, 0, 0, Math.PI * 2);
      color.fill();
      height.beginPath();
      height.ellipse(0, 0, length, length * 0.42, 0, 0, Math.PI * 2);
      height.fill();
      color.strokeStyle = "rgba(38,58,44,0.3)";
      color.lineWidth = 1.4;
      color.beginPath();
      color.moveTo(-length, 0);
      color.lineTo(length, 0);
      color.stroke();
      color.restore();
      height.restore();
    }

    mottle(color, size, 30, ["rgba(18,32,24,0.3)"], [40, 130], 616);
    mottle(rough, size, 24, ["rgba(255,255,255,0.3)"], [40, 120], 626);
    return resolve(painting, 1.6, 2.1);
  };

  /** Plain-weave linen for the shirt. */
  const linen = (): Surface => {
    const painting = painter(512);
    const { size, color, height, rough } = painting;
    fill(painting, "#f4e8d5", "#8c8c8c", "#e8e8e8");

    for (let y = 0; y < size; y += 4) {
      for (let x = 0; x < size; x += 4) {
        const over = (x / 4 + y / 4) % 2 === 0;
        height.fillStyle = over ? "rgba(224,224,224,0.7)" : "rgba(76,76,76,0.62)";
        height.fillRect(x, y, 4, 4);
        color.fillStyle = over ? "rgba(255,252,244,0.2)" : "rgba(200,182,155,0.16)";
        color.fillRect(x, y, 4, 4);
      }
    }

    speckle(color, size, 4200, 0.05, 131);
    mottle(rough, size, 10, ["rgba(255,255,255,0.28)"], [50, 140], 141);
    return resolve(painting, 1.6, 1.5);
  };

  /** Diagonal twill for denim, with the lighter thread showing through. */
  const denim = (): Surface => {
    const painting = painter(512);
    const { size, color, height, rough } = painting;
    fill(painting, "#3f76a0", "#8a8a8a", "#dedede");

    for (let i = -size; i < size * 2; i += 5) {
      color.strokeStyle = "rgba(150,186,212,0.24)";
      color.lineWidth = 2.2;
      height.strokeStyle = "rgba(220,220,220,0.6)";
      height.lineWidth = 2.4;
      color.beginPath();
      color.moveTo(i, 0);
      color.lineTo(i + size, size);
      color.stroke();
      height.beginPath();
      height.moveTo(i, 0);
      height.lineTo(i + size, size);
      height.stroke();

      color.strokeStyle = "rgba(18,42,66,0.3)";
      color.lineWidth = 1.5;
      height.strokeStyle = "rgba(70,70,70,0.5)";
      height.lineWidth = 1.6;
      color.beginPath();
      color.moveTo(i + 2.6, 0);
      color.lineTo(i + 2.6 + size, size);
      color.stroke();
      height.beginPath();
      height.moveTo(i + 2.6, 0);
      height.lineTo(i + 2.6 + size, size);
      height.stroke();
    }

    // Worn-pale patches at the knees and seat of a well-used skirt.
    mottle(color, size, 16, ["rgba(226,238,247,0.11)"], [40, 130], 191);
    mottle(rough, size, 12, ["rgba(255,255,255,0.26)"], [45, 140], 195);
    speckle(color, size, 3600, 0.05, 199);
    return resolve(painting, 2.6, 1.4);
  };

  /**
   * A fired ceramic glaze, for the little house.
   *
   * What makes a surface read as glazed pottery rather than as painted wall is
   * almost entirely in the roughness: the glaze pools very slightly, so the
   * gloss is uneven across a panel, and it crazes into a fine web of hairline
   * cracks that catch light a shade duller than the field around them. The
   * height pass stays deliberately shallow — porcelain is smooth, and any real
   * relief here would turn the cottage back into stucco.
   */
  const ceramicGlaze = (): Surface => {
    const painting = painter(512);
    const { size, color, height, rough } = painting;
    // A mid-grey height field: the glaze deviates in both directions from it.
    fill(painting, "#ffffff", "#808080", "#4a4a4a");

    // Where the glaze runs thin over an edge the colour lifts; where it pools
    // it deepens. Both are broad and low-contrast — this multiplies the
    // material colour, so it must not carry a tint of its own.
    mottle(color, size, 22, ["rgba(255,255,255,0.18)"], [70, 200], 1201);
    mottle(color, size, 20, ["rgba(196,190,182,0.16)"], [60, 180], 1207);
    // Pooled glaze is the glossiest part of the panel.
    mottle(rough, size, 24, ["rgba(0,0,0,0.34)"], [50, 170], 1213);
    mottle(rough, size, 16, ["rgba(255,255,255,0.16)"], [40, 120], 1217);

    // Crazing. Each crack walks a short distance and forks, which is what
    // gives a craquelure its cell structure instead of a scratch pattern.
    const random = rng(1223);
    const craze = (x: number, y: number, angle: number, life: number) => {
      if (life <= 0) return;
      const length = 12 + random() * 26;
      const nx = x + Math.cos(angle) * length;
      const ny = y + Math.sin(angle) * length;
      for (const [ctx, style, width] of [
        [color, "rgba(178,170,158,0.3)", 0.9],
        [height, "rgba(96,96,96,0.5)", 1.1],
        [rough, "rgba(255,255,255,0.42)", 1.4],
      ] as const) {
        ctx.strokeStyle = style;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
      craze(nx, ny, angle + (random() - 0.5) * 1.5, life - 1);
      if (random() > 0.72) craze(nx, ny, angle + (random() - 0.5) * 2.6, life - 2);
    };
    for (let i = 0; i < 34; i += 1) {
      craze(random() * size, random() * size, random() * Math.PI * 2, 4 + Math.floor(random() * 3));
    }

    speckle(color, size, 900, 0.03, 1229);
    // Repeat 1: the house panels are large, and a glaze has no weave to tile.
    // A single stretched pass keeps the crazing from marching across a wall.
    return resolve(painting, 1, 0.55);
  };

  /**
   * Pressed fish-scale roof tiles under a translucent glaze.
   *
   * The roof remains two inexpensive moulded slabs; the overlapping courses
   * live in the normal and roughness maps instead of returning as dozens of
   * separate shadow-casting meshes.
   */
  const ceramicRoofGlaze = (): Surface => {
    const painting = painter(512);
    const { size, color, height, rough } = painting;
    fill(painting, "#f1ece6", "#8c8c8c", "#666666");

    mottle(color, size, 22, ["rgba(255,255,255,0.14)", "rgba(116,96,80,0.12)"], [45, 135], 1231);
    mottle(rough, size, 20, ["rgba(0,0,0,0.22)", "rgba(255,255,255,0.16)"], [38, 120], 1237);

    const tileWidth = 96;
    const course = 66;
    for (let row = -1; row < Math.ceil(size / course) + 1; row += 1) {
      const top = row * course;
      const offset = row % 2 === 0 ? 0 : tileWidth / 2;
      for (let x = -tileWidth; x < size + tileWidth; x += tileWidth) {
        const left = x + offset;
        const middle = left + tileWidth / 2;
        const right = left + tileWidth;
        const bottom = top + course * 0.82;
        for (const [ctx, style, width] of [
          [color, "rgba(63,47,37,0.34)", 4.2],
          [height, "rgba(54,54,54,0.88)", 5.4],
          [rough, "rgba(230,230,230,0.72)", 5.8],
        ] as const) {
          ctx.strokeStyle = style;
          ctx.lineWidth = width;
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(left, top);
          ctx.lineTo(left, top + course * 0.34);
          ctx.quadraticCurveTo(left + tileWidth * 0.08, bottom, middle, bottom);
          ctx.quadraticCurveTo(right - tileWidth * 0.08, bottom, right, top + course * 0.34);
          ctx.lineTo(right, top);
          ctx.stroke();
        }

        height.strokeStyle = "rgba(188,188,188,0.7)";
        height.lineWidth = 2.2;
        height.beginPath();
        height.moveTo(left + 5, top + course * 0.34);
        height.quadraticCurveTo(left + tileWidth * 0.12, bottom - 5, middle, bottom - 5);
        height.stroke();
      }
    }

    speckle(color, size, 1000, 0.035, 1249);
    return resolve(painting, 3.2, 1.25);
  };

  /**
   * Hand-moulded fieldstone for the lower course and chimney.
   *
   * Irregular stones are embossed into one continuous ceramic band. This
   * matches the reference ornament while retaining the recent geometry and
   * draw-call savings.
   */
  const ceramicStoneGlaze = (): Surface => {
    const painting = painter(512);
    const { size, color, height, rough } = painting;
    fill(painting, "#d8cec2", "#727272", "#8c8c8c");
    const random = rng(1259);
    const rowHeight = 92;

    for (let row = -1; row < 7; row += 1) {
      const cy = row * rowHeight + rowHeight / 2;
      const offset = row % 2 === 0 ? -58 : 0;
      let x = offset - 70;
      while (x < size + 80) {
        const width = 82 + random() * 58;
        const heightSize = 54 + random() * 24;
        const cx = x + width / 2;
        const wobble = 5 + random() * 8;

        for (const [ctx, fillStyle, strokeStyle, lineWidth] of [
          [color, "rgba(255,255,255,0.1)", "rgba(58,43,33,0.5)", 6],
          [height, "rgba(166,166,166,0.92)", "rgba(42,42,42,0.94)", 7],
          [rough, "rgba(104,104,104,0.8)", "rgba(232,232,232,0.92)", 7],
        ] as const) {
          ctx.fillStyle = fillStyle;
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = lineWidth;
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(cx - width / 2 + wobble, cy - heightSize * 0.28);
          ctx.quadraticCurveTo(cx - width * 0.2, cy - heightSize / 2 - wobble * 0.25, cx + width * 0.34, cy - heightSize * 0.35);
          ctx.quadraticCurveTo(cx + width / 2 + wobble * 0.2, cy, cx + width * 0.36, cy + heightSize * 0.36);
          ctx.quadraticCurveTo(cx, cy + heightSize / 2 + wobble * 0.18, cx - width * 0.4, cy + heightSize * 0.3);
          ctx.quadraticCurveTo(cx - width / 2 - wobble * 0.15, cy, cx - width / 2 + wobble, cy - heightSize * 0.28);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        x += width - 2;
      }
    }

    mottle(color, size, 18, ["rgba(255,255,255,0.1)", "rgba(95,72,54,0.12)"], [35, 100], 1277);
    speckle(color, size, 1300, 0.04, 1283);
    return resolve(painting, 2.15, 1.65);
  };

  /** Ribbed knit for the socks. */
  const knit = (): Surface => {
    const painting = painter(256);
    const { size, color, height, rough } = painting;
    fill(painting, "#f3eee3", "#8a8a8a", "#f0f0f0");

    for (let x = 0; x < size; x += 10) {
      const gradient = color.createLinearGradient(x, 0, x + 10, 0);
      gradient.addColorStop(0, "rgba(206,197,180,0.42)");
      gradient.addColorStop(0.5, "rgba(255,253,246,0.5)");
      gradient.addColorStop(1, "rgba(206,197,180,0.42)");
      color.fillStyle = gradient;
      color.fillRect(x, 0, 10, size);

      const bump = height.createLinearGradient(x, 0, x + 10, 0);
      bump.addColorStop(0, "rgba(50,50,50,0.85)");
      bump.addColorStop(0.5, "rgba(235,235,235,0.85)");
      bump.addColorStop(1, "rgba(50,50,50,0.85)");
      height.fillStyle = bump;
      height.fillRect(x, 0, 10, size);
    }

    speckle(color, size, 1800, 0.06, 233);
    mottle(rough, size, 8, ["rgba(255,255,255,0.25)"], [30, 80], 244);
    return resolve(painting, 2.2, 2.4);
  };

  /** Pebbled leather for the shoes and the piano bench. */
  const leather = (): Surface => {
    const painting = painter(512);
    const { size, color, height, rough } = painting;
    fill(painting, "#70473a", "#8c8c8c", "#c8c8c8");
    const random = rng(707);

    for (let i = 0; i < 2600; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const r = 3 + random() * 6;
      const light = random() > 0.5;
      color.fillStyle = light ? "rgba(146,98,78,0.24)" : "rgba(56,34,27,0.24)";
      color.beginPath();
      color.arc(x, y, r, 0, Math.PI * 2);
      color.fill();
      height.fillStyle = light ? "rgba(228,228,228,0.42)" : "rgba(58,58,58,0.4)";
      height.beginPath();
      height.arc(x, y, r, 0, Math.PI * 2);
      height.fill();
    }

    mottle(rough, size, 18, ["rgba(90,90,90,0.4)", "rgba(255,255,255,0.28)"], [40, 130], 717);
    return resolve(painting, 2, 1.7);
  };

  /** Laid paper: a fibrous tooth and a faint warm cast. */
  const paper = (): Surface => {
    const painting = painter(512);
    const { size, color, height, rough } = painting;
    fill(painting, "#f2eadb", "#8e8e8e", "#f4f4f4");

    for (let y = 0; y < size; y += 3) {
      height.fillStyle = "rgba(200,200,200,0.28)";
      height.fillRect(0, y, size, 1.3);
    }
    speckle(color, size, 9000, 0.05, 811);
    speckle(height, size, 12000, 0.15, 822);
    mottle(color, size, 12, ["rgba(214,196,166,0.12)"], [60, 180], 833);
    mottle(rough, size, 10, ["rgba(210,210,210,0.3)"], [50, 150], 844);
    return resolve(painting, 1, 1.3);
  };

  /** Wet sand at the waterline. */
  const sand = (): Surface => {
    const painting = painter(512);
    const { size, color, height, rough } = painting;
    fill(painting, "#d8c39d", "#8a8a8a", "#dcdcdc");
    const random = rng(909);

    for (let i = 0; i < 60; i += 1) {
      const y = random() * size;
      color.strokeStyle = "rgba(168,146,110,0.2)";
      color.lineWidth = 2 + random() * 5;
      height.strokeStyle = "rgba(120,120,120,0.4)";
      height.lineWidth = color.lineWidth;
      color.beginPath();
      height.beginPath();
      for (let x = 0; x <= size; x += 18) {
        const wave = Math.sin(x * 0.02 + i) * 7;
        if (x === 0) {
          color.moveTo(x, y + wave);
          height.moveTo(x, y + wave);
        } else {
          color.lineTo(x, y + wave);
          height.lineTo(x, y + wave);
        }
      }
      color.stroke();
      height.stroke();
    }

    speckle(color, size, 26000, 0.11, 919);
    speckle(height, size, 30000, 0.3, 929);
    mottle(rough, size, 14, ["rgba(70,70,70,0.42)"], [50, 160], 939);
    return resolve(painting, 3, 1.6);
  };

  /**
   * Sea normal map built from summed sines on integer wave numbers, so the
   * result tiles exactly and can be scrolled without a visible seam.
   */
  const seaNormal = (strength = 1.5) => {
    const size = 256;
    const pixels = new Uint8Array(size * size * 4);
    const waves = [
      { kx: 2, ky: 1, amplitude: 1, phase: 0 },
      { kx: -1, ky: 3, amplitude: 0.62, phase: 1.9 },
      { kx: 5, ky: 2, amplitude: 0.3, phase: 3.4 },
      { kx: 3, ky: -6, amplitude: 0.17, phase: 0.7 },
      { kx: 9, ky: 7, amplitude: 0.08, phase: 2.2 },
    ];

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        let dx = 0;
        let dy = 0;
        for (const wave of waves) {
          const angle = Math.PI * 2 * ((wave.kx * x) / size + (wave.ky * y) / size) + wave.phase;
          const scale = Math.PI * 2 * wave.amplitude * Math.cos(angle);
          dx += scale * wave.kx;
          dy += scale * wave.ky;
        }
        dx *= strength / size;
        dy *= strength / size;
        const length = Math.hypot(dx, dy, 1);
        const index = (y * size + x) * 4;
        pixels[index] = ((dx / length) * 0.5 + 0.5) * 255;
        pixels[index + 1] = ((dy / length) * 0.5 + 0.5) * 255;
        pixels[index + 2] = ((1 / length) * 0.5 + 0.5) * 255;
        pixels[index + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = anisotropy;
    texture.repeat.set(5, 3);
    texture.needsUpdate = true;
    return texture;
  };

  /** Mottled roughness only — for lacquer, brass, and other maps-free finishes. */
  const finishVariation = (
    base: string,
    blotches: string[],
    repeat: number,
    seed: number,
  ) => {
    const size = 512;
    const ctx = context(makeCanvas(size));
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    mottle(ctx, size, 34, blotches, [40, 190], seed);
    speckle(ctx, size, 5000, 0.08, seed + 1);
    return dress(new THREE.CanvasTexture(ctx.canvas), repeat, false);
  };

  /** A single sheet of hand-ruled manuscript paper for the music stand. */
  const sheetMusic = () => {
    const canvas = makeCanvas(512, 768);
    const ctx = context(canvas);
    ctx.fillStyle = "#f6f0e2";
    ctx.fillRect(0, 0, 512, 768);
    speckle(ctx, 512, 6000, 0.05, 1201);

    const random = rng(1301);
    for (let stave = 0; stave < 7; stave += 1) {
      const top = 70 + stave * 96;
      ctx.strokeStyle = "rgba(58,48,38,0.62)";
      ctx.lineWidth = 1.4;
      for (let line = 0; line < 5; line += 1) {
        ctx.beginPath();
        ctx.moveTo(46, top + line * 11);
        ctx.lineTo(466, top + line * 11);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(40,32,26,0.78)";
      for (let note = 0; note < 9; note += 1) {
        const x = 78 + note * 44 + random() * 8;
        const y = top + random() * 44;
        ctx.beginPath();
        ctx.ellipse(x, y, 5.6, 4.2, -0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + 4.6, y - 30, 1.7, 30);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    return texture;
  };

  /** Sky behind the door: graded dusk light, a low sun, and drifting cloud. */
  const seaSky = () => {
    const canvas = makeCanvas(1024, 512);
    const ctx = context(canvas);
    const sky = ctx.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, "#5ea6c6");
    sky.addColorStop(0.42, "#9ed3e2");
    sky.addColorStop(0.78, "#ddeef0");
    sky.addColorStop(1, "#f6e3c2");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 512);

    const sun = ctx.createRadialGradient(268, 372, 6, 268, 372, 210);
    sun.addColorStop(0, "rgba(255,247,214,0.95)");
    sun.addColorStop(0.22, "rgba(255,233,175,0.5)");
    sun.addColorStop(1, "rgba(255,226,163,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, 1024, 512);

    const random = rng(1409);
    for (let i = 0; i < 46; i += 1) {
      const x = random() * 1024;
      const y = 40 + random() * 250;
      const width = 60 + random() * 190;
      const cloud = ctx.createRadialGradient(x, y, 2, x, y, width);
      cloud.addColorStop(0, `rgba(255,255,255,${0.16 + random() * 0.22})`);
      cloud.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = cloud;
      ctx.beginPath();
      ctx.ellipse(x, y, width, width * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    return texture;
  };

  /**
   * Equirectangular surroundings fed to PMREMGenerator. This is what every
   * glossy surface in the room actually reflects: warm ceiling light above,
   * a bright sea-facing opening, and a brown floor bounce below.
   */
  const environmentPanorama = () => {
    const canvas = makeCanvas(1024, 512);
    const ctx = context(canvas);
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "#fdf4e2");
    gradient.addColorStop(0.42, "#e2e6dd");
    gradient.addColorStop(0.52, "#b6b3a5");
    gradient.addColorStop(1, "#4a3626");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);

    const opening = ctx.createRadialGradient(700, 250, 10, 700, 250, 220);
    opening.addColorStop(0, "rgba(214,244,255,0.95)");
    opening.addColorStop(1, "rgba(214,244,255,0)");
    ctx.fillStyle = opening;
    ctx.fillRect(0, 0, 1024, 512);

    const warm = ctx.createRadialGradient(210, 150, 10, 210, 150, 280);
    warm.addColorStop(0, "rgba(255,238,198,0.9)");
    warm.addColorStop(1, "rgba(255,238,198,0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, 1024, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  /** Vertical gradient standing in for the space outside the room. */
  const backdrop = () => {
    const canvas = makeCanvas(64, 512);
    const ctx = context(canvas);
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "#c3cfc6");
    gradient.addColorStop(0.55, "#a9b5ad");
    gradient.addColorStop(1, "#7d8d88");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  /** Soft radial falloff used for grounded contact shadows and light glows. */
  const radialFalloff = (inner: string, outer: string, midpoint = 0.45) => {
    const canvas = makeCanvas(256);
    const ctx = context(canvas);
    const gradient = ctx.createRadialGradient(128, 128, 2, 128, 128, 127);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(midpoint, outer);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  return {
    oakFloor,
    oakDesk,
    plaster,
    wovenWool,
    bark,
    foliage,
    linen,
    denim,
    knit,
    ceramicGlaze,
    ceramicRoofGlaze,
    ceramicStoneGlaze,
    leather,
    paper,
    sand,
    seaNormal,
    finishVariation,
    sheetMusic,
    seaSky,
    environmentPanorama,
    backdrop,
    radialFalloff,
  };
}

export type SurfaceFactory = ReturnType<typeof createSurfaceFactory>;
