/**
 * The exterior shell around the original Dream Room.
 *
 * It deliberately stays procedural: the cottage is assembled from the same
 * small rounded primitives as the room, so the Pages build still has no model
 * or texture downloads. The shell can be switched between a complete house,
 * the original ground-floor cutaway, and an empty upper-floor cutaway.
 */

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type HouseView = "house" | "ground" | "upper";

export type HousePalette = {
  housePlaster: THREE.Material;
  housePlasterLight: THREE.Material;
  houseTimber: THREE.Material;
  houseStone: THREE.Material;
  roofTile: THREE.Material;
  roofEdge: THREE.Material;
  windowGlass: THREE.Material;
  windowGlow: THREE.Material;
  garden: THREE.Material;
  pathStone: THREE.Material;
  flowerLeaf: THREE.Material;
  flowerRed: THREE.Material;
  flowerCream: THREE.Material;
  doorPaint: THREE.Material;
  brass: THREE.Material;
  trim: THREE.Material;
  floor: THREE.Material;
  interiorWall: THREE.Material;
};

export type DreamHouse = {
  setView: (view: HouseView) => void;
};

const HOUSE_HALF_X = 6.55;
const HOUSE_HALF_Z = 5.55;
const GROUND_CEILING = 5.72;
const UPPER_CEILING = 9.9;
const RIDGE_Y = 13.72;

function roundedBox(
  size: [number, number, number],
  material: THREE.Material,
  radius = 0.06,
) {
  const safe = Math.min(radius, Math.min(...size) * 0.42);
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(size[0], size[1], size[2], 3, safe),
    material,
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addBox(
  parent: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
  radius = 0.05,
) {
  const mesh = roundedBox(size, material, radius);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addSphere(
  parent: THREE.Object3D,
  radius: number,
  position: [number, number, number],
  material: THREE.Material,
  scale: [number, number, number] = [1, 1, 1],
) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 10), material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function addBeamBetween(
  parent: THREE.Object3D,
  from: [number, number],
  to: [number, number],
  z: number,
  material: THREE.Material,
  thickness = 0.18,
) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const beam = addBox(
    parent,
    [Math.hypot(dx, dy), thickness, 0.16],
    [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z],
    material,
    0.035,
  );
  beam.rotation.z = Math.atan2(dy, dx);
  return beam;
}

function buildWindow(
  parent: THREE.Object3D,
  palette: HousePalette,
  position: [number, number, number],
  size: [number, number],
  rotationY = 0,
  flowers = false,
) {
  const window = new THREE.Group();
  window.position.set(...position);
  window.rotation.y = rotationY;
  parent.add(window);

  const [width, height] = size;
  addBox(window, [width + 0.3, height + 0.3, 0.12], [0, 0, 0], palette.trim, 0.08);
  addBox(window, [width, height, 0.14], [0, 0, 0.08], palette.windowGlass, 0.04);
  addBox(window, [0.11, height, 0.11], [0, 0, 0.18], palette.houseTimber, 0.025);
  addBox(window, [width, 0.11, 0.11], [0, 0, 0.18], palette.houseTimber, 0.025);

  const warmPane = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.88, height * 0.88),
    palette.windowGlow,
  );
  warmPane.position.z = 0.155;
  window.add(warmPane);

  if (flowers) {
    addBox(window, [width + 0.34, 0.32, 0.5], [0, -height / 2 - 0.28, 0.34], palette.houseTimber, 0.08);
    const plantY = -height / 2 - 0.08;
    for (let i = 0; i < 7; i += 1) {
      const x = -width * 0.38 + (i / 6) * width * 0.76;
      addSphere(window, 0.2, [x, plantY + Math.sin(i * 1.7) * 0.08, 0.46], palette.flowerLeaf, [1, 0.72, 0.66]);
      if (i % 2 === 0) {
        addSphere(window, 0.095, [x + 0.05, plantY + 0.12, 0.59], i % 4 ? palette.flowerRed : palette.flowerCream);
      }
    }
  }
  return window;
}

function buildStoneCourse(
  parent: THREE.Object3D,
  palette: HousePalette,
  z: number,
) {
  let seed = 928371;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const rows = 4;
  for (let row = 0; row < rows; row += 1) {
    let x = -HOUSE_HALF_X + 0.35 - (row % 2) * 0.26;
    while (x < HOUSE_HALF_X - 0.25) {
      const width = 0.68 + random() * 0.58;
      const height = 0.29 + random() * 0.14;
      const stone = addBox(
        parent,
        [width, height, 0.16],
        [x + width / 2, 0.2 + row * 0.36, z + random() * 0.025],
        palette.houseStone,
        0.1,
      );
      stone.rotation.z = (random() - 0.5) * 0.08;
      stone.scale.y = 0.88 + random() * 0.22;
      x += width + 0.07;
    }
  }
}

function buildFlowers(parent: THREE.Object3D, palette: HousePalette) {
  const clusters: [number, number, number][] = [
    [-5.8, 0.22, 6.0],
    [-5.2, 0.2, 6.3],
    [5.55, 0.2, 6.15],
    [5.95, 0.2, 5.75],
  ];
  for (const [cx, cy, cz] of clusters) {
    for (let i = 0; i < 7; i += 1) {
      const angle = i * 2.4;
      const radius = 0.2 + (i % 3) * 0.12;
      addSphere(
        parent,
        0.28,
        [cx + Math.cos(angle) * radius, cy + (i % 2) * 0.18, cz + Math.sin(angle) * radius],
        palette.flowerLeaf,
        [1, 0.72, 0.82],
      );
      if (i % 2 === 0) {
        addSphere(
          parent,
          0.1,
          [cx + Math.cos(angle) * radius, cy + 0.34 + (i % 3) * 0.07, cz + Math.sin(angle) * radius],
          i % 4 ? palette.flowerCream : palette.flowerRed,
        );
      }
    }
  }
}

function buildRoof(parent: THREE.Object3D, palette: HousePalette) {
  const roof = new THREE.Group();
  parent.add(roof);
  const rise = RIDGE_Y - UPPER_CEILING;
  const run = HOUSE_HALF_X + 0.45;
  const length = Math.hypot(run, rise);
  const angle = Math.atan2(rise, run);

  for (const side of [-1, 1] as const) {
    const plane = addBox(
      roof,
      [length, 0.27, HOUSE_HALF_Z * 2 + 1.0],
      [side * run / 2, UPPER_CEILING + rise / 2, 0],
      palette.roofTile,
      0.08,
    );
    plane.rotation.z = -side * angle;

    for (let row = 1; row < 9; row += 1) {
      const t = row / 9;
      const seam = addBox(
        roof,
        [0.075, 0.1, HOUSE_HALF_Z * 2 + 1.04],
        [side * run * t, RIDGE_Y - rise * t + 0.08, 0],
        palette.roofEdge,
        0.025,
      );
      seam.rotation.z = -side * angle;
    }
  }
  addBox(roof, [0.34, 0.34, HOUSE_HALF_Z * 2 + 1.2], [0, RIDGE_Y + 0.05, 0], palette.roofEdge, 0.14);

  const chimney = new THREE.Group();
  chimney.position.set(-4.35, 11.9, -1.55);
  roof.add(chimney);
  addBox(chimney, [1.25, 3.2, 1.18], [0, 0, 0], palette.houseStone, 0.12);
  addBox(chimney, [1.48, 0.28, 1.42], [0, 1.65, 0], palette.roofEdge, 0.08);
  for (const y of [-1.1, -0.45, 0.25, 0.92]) {
    addBox(chimney, [1.29, 0.08, 1.22], [0, y, 0], palette.roofEdge, 0.025);
  }
  return roof;
}

export function buildDreamHouse(scene: THREE.Scene, palette: HousePalette): DreamHouse {
  const house = new THREE.Group();
  scene.add(house);

  const garden = new THREE.Group();
  house.add(garden);
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(26, 17), palette.garden);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(0, -0.08, 8.55);
  lawn.receiveShadow = true;
  garden.add(lawn);
  for (let i = 0; i < 10; i += 1) {
    const step = new THREE.Mesh(new THREE.CircleGeometry(0.72 + (i % 3) * 0.08, 24), palette.pathStone);
    step.rotation.x = -Math.PI / 2;
    step.rotation.z = (i % 2 ? -1 : 1) * 0.16;
    step.scale.y = 0.62;
    step.position.set(Math.sin(i * 0.72) * 0.34, -0.025, 6.35 + i * 0.86);
    step.receiveShadow = true;
    garden.add(step);
  }
  buildFlowers(garden, palette);

  const lowerExterior = new THREE.Group();
  house.add(lowerExterior);
  addBox(lowerExterior, [HOUSE_HALF_X * 2, GROUND_CEILING, 0.2], [0, GROUND_CEILING / 2, HOUSE_HALF_Z], palette.housePlaster, 0.025);
  addBox(lowerExterior, [0.2, GROUND_CEILING, HOUSE_HALF_Z * 2], [HOUSE_HALF_X, GROUND_CEILING / 2, 0], palette.housePlaster, 0.025);
  addBox(lowerExterior, [0.08, GROUND_CEILING, HOUSE_HALF_Z * 2], [-HOUSE_HALF_X - 0.05, GROUND_CEILING / 2, 0], palette.housePlaster, 0.02);
  buildStoneCourse(lowerExterior, palette, HOUSE_HALF_Z + 0.12);
  addBox(lowerExterior, [HOUSE_HALF_X * 2 + 0.26, 0.22, 0.26], [0, 1.62, HOUSE_HALF_Z + 0.12], palette.houseTimber, 0.04);
  addBox(lowerExterior, [HOUSE_HALF_X * 2 + 0.26, 0.24, 0.27], [0, GROUND_CEILING - 0.08, HOUSE_HALF_Z + 0.12], palette.houseTimber, 0.04);
  for (const x of [-5.45, -2.15, 2.15, 5.45]) {
    addBox(lowerExterior, [0.2, GROUND_CEILING - 1.55, 0.23], [x, 3.62, HOUSE_HALF_Z + 0.12], palette.houseTimber, 0.04);
  }

  buildWindow(lowerExterior, palette, [-3.55, 3.35, HOUSE_HALF_Z + 0.17], [2.15, 1.95], 0, true);
  buildWindow(lowerExterior, palette, [3.55, 3.35, HOUSE_HALF_Z + 0.17], [2.15, 1.95], 0, true);
  buildWindow(lowerExterior, palette, [HOUSE_HALF_X + 0.17, 3.2, 1.8], [2.1, 1.9], Math.PI / 2, false);
  buildWindow(lowerExterior, palette, [HOUSE_HALF_X + 0.17, 3.2, -2.15], [1.7, 1.9], Math.PI / 2, false);

  addBox(lowerExterior, [2.25, 3.25, 0.23], [0, 1.68, HOUSE_HALF_Z + 0.2], palette.doorPaint, 0.14);
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.13, 8, 30, Math.PI),
    palette.trim,
  );
  arch.position.set(0, 3.14, HOUSE_HALF_Z + 0.35);
  arch.castShadow = true;
  lowerExterior.add(arch);
  addBox(lowerExterior, [0.12, 3.08, 0.12], [-1.18, 1.62, HOUSE_HALF_Z + 0.34], palette.trim, 0.03);
  addBox(lowerExterior, [0.12, 3.08, 0.12], [1.18, 1.62, HOUSE_HALF_Z + 0.34], palette.trim, 0.03);
  addSphere(lowerExterior, 0.11, [0.65, 1.64, HOUSE_HALF_Z + 0.4], palette.brass, [1, 1, 0.58]);

  const upperBackLeft = new THREE.Group();
  const upperCutaway = new THREE.Group();
  house.add(upperBackLeft, upperCutaway);
  const upperHeight = UPPER_CEILING - GROUND_CEILING;
  addBox(upperCutaway, [HOUSE_HALF_X * 2, upperHeight, 0.2], [0, GROUND_CEILING + upperHeight / 2, HOUSE_HALF_Z], palette.housePlasterLight, 0.025);
  addBox(upperCutaway, [0.2, upperHeight, HOUSE_HALF_Z * 2], [HOUSE_HALF_X, GROUND_CEILING + upperHeight / 2, 0], palette.housePlasterLight, 0.025);
  addBox(upperBackLeft, [0.16, upperHeight, HOUSE_HALF_Z * 2], [-HOUSE_HALF_X, GROUND_CEILING + upperHeight / 2, 0], palette.housePlasterLight, 0.025);
  addBox(upperBackLeft, [HOUSE_HALF_X * 2, upperHeight, 0.16], [0, GROUND_CEILING + upperHeight / 2, -HOUSE_HALF_Z], palette.housePlasterLight, 0.025);
  addBox(upperBackLeft, [0.08, upperHeight - 0.16, HOUSE_HALF_Z * 2 - 0.26], [-HOUSE_HALF_X + 0.09, GROUND_CEILING + upperHeight / 2, 0], palette.interiorWall, 0.018);
  addBox(upperBackLeft, [HOUSE_HALF_X * 2 - 0.26, upperHeight - 0.16, 0.08], [0, GROUND_CEILING + upperHeight / 2, -HOUSE_HALF_Z + 0.09], palette.interiorWall, 0.018);

  const secondFloor = addBox(
    upperBackLeft,
    [HOUSE_HALF_X * 2 - 0.25, 0.25, HOUSE_HALF_Z * 2 - 0.25],
    [0, GROUND_CEILING, 0],
    palette.floor,
    0.035,
  );
  secondFloor.receiveShadow = true;
  addBox(upperCutaway, [HOUSE_HALF_X * 2 + 0.28, 0.24, 0.27], [0, GROUND_CEILING + 0.08, HOUSE_HALF_Z + 0.12], palette.houseTimber, 0.04);
  addBox(upperCutaway, [HOUSE_HALF_X * 2 + 0.28, 0.23, 0.27], [0, UPPER_CEILING - 0.12, HOUSE_HALF_Z + 0.12], palette.houseTimber, 0.04);
  for (const x of [-5.45, -2.15, 2.15, 5.45]) {
    addBox(upperCutaway, [0.2, upperHeight - 0.2, 0.23], [x, GROUND_CEILING + upperHeight / 2, HOUSE_HALF_Z + 0.12], palette.houseTimber, 0.04);
  }
  buildWindow(upperCutaway, palette, [-3.55, 7.85, HOUSE_HALF_Z + 0.17], [2.15, 1.85], 0, true);
  buildWindow(upperCutaway, palette, [3.55, 7.85, HOUSE_HALF_Z + 0.17], [2.15, 1.85], 0, true);
  buildWindow(upperCutaway, palette, [HOUSE_HALF_X + 0.17, 7.85, 1.75], [2.05, 1.8], Math.PI / 2, false);

  const frontGable = new THREE.Group();
  const backGable = new THREE.Group();
  house.add(frontGable, backGable);
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-HOUSE_HALF_X, UPPER_CEILING);
  gableShape.lineTo(0, RIDGE_Y);
  gableShape.lineTo(HOUSE_HALF_X, UPPER_CEILING);
  gableShape.closePath();
  const frontTriangle = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), palette.housePlasterLight);
  frontTriangle.position.z = HOUSE_HALF_Z + 0.02;
  frontTriangle.castShadow = true;
  frontTriangle.receiveShadow = true;
  frontGable.add(frontTriangle);
  const backTriangle = frontTriangle.clone();
  backTriangle.position.z = -HOUSE_HALF_Z - 0.02;
  backTriangle.rotation.y = Math.PI;
  backGable.add(backTriangle);
  addBeamBetween(frontGable, [-HOUSE_HALF_X, UPPER_CEILING + 0.08], [0, RIDGE_Y], HOUSE_HALF_Z + 0.14, palette.houseTimber, 0.2);
  addBeamBetween(frontGable, [0, RIDGE_Y], [HOUSE_HALF_X, UPPER_CEILING + 0.08], HOUSE_HALF_Z + 0.14, palette.houseTimber, 0.2);
  addBox(frontGable, [0.2, 3.45, 0.2], [0, 11.55, HOUSE_HALF_Z + 0.14], palette.houseTimber, 0.04);
  buildWindow(frontGable, palette, [0, 11.2, HOUSE_HALF_Z + 0.2], [1.45, 1.35], 0, true);

  const roof = buildRoof(house, palette);

  const setView = (view: HouseView) => {
    const complete = view === "house";
    lowerExterior.visible = complete || view === "upper";
    upperBackLeft.visible = view !== "ground";
    upperCutaway.visible = complete;
    frontGable.visible = complete;
    backGable.visible = complete;
    roof.visible = complete;
  };
  setView("house");
  return { setView };
}
