"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type StoryAction = "tree" | "door" | "piano" | "desk";
type MotionState =
  | "idle"
  | "tree-walk"
  | "tree-climb"
  | "tree-bar"
  | "tree-release"
  | "tree-spin"
  | "tree-land"
  | "tree-return"
  | "door-walk"
  | "door-open"
  | "door-exit"
  | "door-dive"
  | "swimming"
  | "piano-walk"
  | "piano-sit"
  | "piano-play"
  | "piano-return"
  | "desk-walk"
  | "desk-sit"
  | "desk-study"
  | "desk-return";

const HOME = new THREE.Vector3(-0.15, 0, 2.55);
const TREE_BASE = new THREE.Vector3(-2.38, 0, -0.58);
const BAR_ANCHOR = new THREE.Vector3(-1.55, 3.52, -0.92);
const ARM_REACH = 2.76;
const TREE_HANG = new THREE.Vector3(BAR_ANCHOR.x, BAR_ANCHOR.y - ARM_REACH, BAR_ANCHOR.z);
const TREE_LAND = new THREE.Vector3(-1.48, 0, 1.12);
const RELEASE_ANGLE = -0.62;
const RELEASE_POINT = new THREE.Vector3(
  BAR_ANCHOR.x,
  BAR_ANCHOR.y - Math.cos(RELEASE_ANGLE) * ARM_REACH,
  BAR_ANCHOR.z - Math.sin(RELEASE_ANGLE) * ARM_REACH,
);
const DOOR_FRONT = new THREE.Vector3(3.45, 0, -2.9);
const PIANO_SEAT = new THREE.Vector3(-4.55, 0, 2.3);
const DESK_SEAT = new THREE.Vector3(3.55, 0, 2.65);

const ease = (value: number) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

function roundedBox(
  size: [number, number, number],
  material: THREE.Material,
  radius = 0.08,
) {
  const safe = Math.min(radius, Math.min(...size) * 0.42);
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(size[0], size[1], size[2], 4, safe),
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
  radius = 0.04,
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
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 18), material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(
  parent: THREE.Object3D,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  position: [number, number, number],
  material: THREE.Material,
  segments = 18,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material,
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function markInteractive(
  root: THREE.Object3D,
  action: StoryAction,
  interactive: THREE.Object3D[],
) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.userData.action = action;
    interactive.push(object);
  });
}

function buildRoom(scene: THREE.Scene) {
  const wall = new THREE.MeshStandardMaterial({ color: 0xd9cfc1, roughness: 0.92 });
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c684f,
    roughness: 0.78,
  });
  const trim = new THREE.MeshStandardMaterial({ color: 0xf1e8da, roughness: 0.76 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(13, 11), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  addBox(scene, [0.18, 5.6, 10.8], [-6.4, 2.8, 0], wall, 0.02);
  addBox(scene, [9.55, 5.6, 0.18], [-1.62, 2.8, -5.35], wall, 0.02);
  addBox(scene, [1.45, 5.6, 0.18], [5.67, 2.8, -5.35], wall, 0.02);
  addBox(scene, [2.15, 1.35, 0.18], [4.1, 4.92, -5.35], wall, 0.02);
  addBox(scene, [0.16, 0.23, 10.7], [-6.28, 0.13, 0], trim, 0.02);
  addBox(scene, [9.55, 0.23, 0.16], [-1.62, 0.13, -5.23], trim, 0.02);
  addBox(scene, [1.45, 0.23, 0.16], [5.67, 0.13, -5.23], trim, 0.02);

  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(2.25, 64),
    new THREE.MeshStandardMaterial({ color: 0xcdb696, roughness: 1 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.scale.y = 0.68;
  rug.position.set(-0.2, 0.018, 1.2);
  rug.receiveShadow = true;
  scene.add(rug);

  for (let i = 0; i < 13; i += 1) {
    const seam = new THREE.Mesh(
      new THREE.PlaneGeometry(0.012, 10.6),
      new THREE.MeshBasicMaterial({ color: 0x5f4435, transparent: true, opacity: 0.2 }),
    );
    seam.rotation.x = -Math.PI / 2;
    seam.position.set(-6 + i, 0.024, 0);
    scene.add(seam);
  }
}

function buildOcean(scene: THREE.Scene) {
  const ocean = new THREE.Group();
  ocean.position.z = -5.55;
  scene.add(ocean);

  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(23, 13),
    new THREE.MeshBasicMaterial({ color: 0x90cde0, toneMapped: false }),
  );
  sky.position.set(0, 4.9, -10);
  ocean.add(sky);

  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffe7a6, toneMapped: false });
  addSphere(ocean, 0.72, [-3.9, 5.65, -9.65], sunMaterial);

  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x16799b,
    roughness: 0.2,
    metalness: 0.08,
    transparent: true,
    opacity: 0.92,
    clearcoat: 0.8,
  });
  // The near edge starts beyond the exterior threshold. No part of this plane
  // extends beneath the room floor.
  const water = new THREE.Mesh(new THREE.PlaneGeometry(22, 12, 34, 24), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.06, -6);
  water.receiveShadow = true;
  ocean.add(water);

  const shore = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 1.15),
    new THREE.MeshStandardMaterial({ color: 0xd8c39d, roughness: 1 }),
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.set(4.1, 0.025, -0.48);
  ocean.add(shore);

  const foamMaterial = new THREE.MeshBasicMaterial({
    color: 0xd9f5f2,
    transparent: true,
    opacity: 0.7,
    toneMapped: false,
  });
  const waves: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i += 1) {
    const wave = new THREE.Mesh(new THREE.TorusGeometry(1.1 + i * 0.18, 0.022, 6, 42, Math.PI), foamMaterial);
    wave.rotation.x = Math.PI / 2;
    wave.rotation.z = Math.PI;
    wave.scale.x = 2.3;
    wave.position.set((i % 2 ? 1 : -1) * 1.3, 0.11, -1.2 - i * 1.25);
    ocean.add(wave);
    waves.push(wave);
  }
  return { water, waves };
}

function buildDoor(scene: THREE.Scene, interactive: THREE.Object3D[]) {
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xf4ead8, roughness: 0.63 });
  const doorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x335d68,
    roughness: 0.42,
    clearcoat: 0.25,
  });
  const brass = new THREE.MeshStandardMaterial({ color: 0xd9a84f, metalness: 0.72, roughness: 0.28 });

  addBox(scene, [0.24, 4.25, 0.32], [3.02, 2.14, -5.18], frameMaterial, 0.05);
  addBox(scene, [0.24, 4.25, 0.32], [5.18, 2.14, -5.18], frameMaterial, 0.05);
  addBox(scene, [2.38, 0.25, 0.32], [4.1, 4.25, -5.18], frameMaterial, 0.05);

  const hinge = new THREE.Group();
  hinge.position.set(3.18, 0.13, -5.05);
  scene.add(hinge);
  const door = addBox(hinge, [1.78, 3.85, 0.18], [0.89, 1.93, 0], doorMaterial, 0.1);
  addBox(hinge, [1.38, 0.08, 0.06], [0.89, 3.42, 0.115], frameMaterial, 0.02);
  addBox(hinge, [1.38, 0.08, 0.06], [0.89, 0.52, 0.115], frameMaterial, 0.02);
  const handle = addSphere(hinge, 0.09, [1.55, 1.92, 0.18], brass);
  handle.scale.z = 0.55;
  markInteractive(hinge, "door", interactive);
  door.userData.action = "door";
  return hinge;
}

function buildTree(scene: THREE.Scene, interactive: THREE.Object3D[]) {
  const tree = new THREE.Group();
  tree.position.set(-3.6, 0, -1.0);
  scene.add(tree);

  const bark = new THREE.MeshStandardMaterial({ color: 0x6f4932, roughness: 0.96 });
  const barkLight = new THREE.MeshStandardMaterial({ color: 0x8d5f3d, roughness: 0.9 });
  const leafA = new THREE.MeshStandardMaterial({ color: 0x4c765b, roughness: 0.9 });
  const leafB = new THREE.MeshStandardMaterial({ color: 0x78966d, roughness: 0.95 });

  addCylinder(tree, 0.43, 0.64, 4.25, [0, 2.12, 0], bark, 28);
  const branchJoint = addCylinder(tree, 0.18, 0.29, 1.42, [0.48, 3.14, 0.06], bark, 22);
  branchJoint.rotation.z = Math.PI / 2.7;
  const branch = addCylinder(tree, 0.13, 0.17, 3.35, [1.45, 3.52, 0.08], barkLight, 28);
  branch.rotation.z = Math.PI / 2;
  const gripZone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.137, 0.137, 1.24, 28),
    new THREE.MeshStandardMaterial({ color: 0x7d5035, roughness: 0.72 }),
  );
  gripZone.position.set(2.05, 3.52, 0.08);
  gripZone.rotation.z = Math.PI / 2;
  gripZone.castShadow = true;
  tree.add(gripZone);
  const backBranch = addCylinder(tree, 0.18, 0.26, 2.25, [-0.55, 3.25, -0.4], bark, 16);
  backBranch.rotation.z = -0.62;
  backBranch.rotation.x = 0.36;
  const crownPositions: [number, number, number, number][] = [
    [-0.55, 4.45, 0, 1.2],
    [0.45, 4.72, -0.15, 1.05],
    [-0.05, 5.25, 0.1, 1.05],
    [1.25, 4.28, -0.15, 0.88],
    [-1.1, 4.0, -0.2, 0.92],
    [0.2, 4.28, 0.75, 0.9],
  ];
  crownPositions.forEach(([x, y, z, scale], index) => {
    addSphere(tree, scale, [x, y, z], index % 2 ? leafA : leafB, [1.18, 0.85, 1]);
  });

  const roots = [
    [-0.42, 0.16, 0.26, -0.28],
    [0.38, 0.14, 0.22, 0.34],
    [-0.18, 0.12, -0.46, 0.12],
  ];
  roots.forEach(([x, y, z, rotation]) => {
    const root = addCylinder(tree, 0.12, 0.24, 1.05, [x, y, z], bark, 14);
    root.rotation.z = Math.PI / 2 + rotation;
  });

  markInteractive(tree, "tree", interactive);
  return tree;
}

function buildPiano(scene: THREE.Scene, interactive: THREE.Object3D[]) {
  const piano = new THREE.Group();
  piano.position.set(-5.95, 0, 2.3);
  piano.rotation.y = Math.PI / 2;
  scene.add(piano);

  const lacquer = new THREE.MeshPhysicalMaterial({
    color: 0x121615,
    roughness: 0.2,
    metalness: 0.18,
    clearcoat: 0.88,
    clearcoatRoughness: 0.15,
  });
  const edge = new THREE.MeshStandardMaterial({ color: 0x2a2c29, roughness: 0.34, metalness: 0.3 });
  const ivory = new THREE.MeshStandardMaterial({ color: 0xf3efe4, roughness: 0.55 });
  const ebony = new THREE.MeshPhysicalMaterial({ color: 0x111413, roughness: 0.22, clearcoat: 0.65 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc89b4d, metalness: 0.74, roughness: 0.25 });
  const paper = new THREE.MeshStandardMaterial({ color: 0xf2eadb, roughness: 0.94 });

  addBox(piano, [2.18, 2.18, 0.5], [0, 1.45, -0.17], lacquer, 0.12);
  addBox(piano, [2.35, 0.16, 0.66], [0, 2.55, -0.1], edge, 0.06);
  addBox(piano, [1.86, 0.74, 0.08], [0, 1.74, 0.105], edge, 0.05);
  addBox(piano, [2.38, 0.16, 0.86], [0, 1.1, 0.3], lacquer, 0.05);
  addBox(piano, [2.18, 0.1, 0.18], [0, 0.92, 0.66], edge, 0.035);
  for (const x of [-0.82, 0.82]) addBox(piano, [0.2, 0.92, 0.25], [x, 0.53, -0.05], lacquer, 0.06);
  addBox(piano, [1.45, 0.12, 0.2], [0, 0.45, -0.04], edge, 0.03);

  const keys: THREE.Mesh[] = [];
  const keyCount = 15;
  const keyWidth = 1.98 / keyCount;
  for (let i = 0; i < keyCount; i += 1) {
    const key = addBox(
      piano,
      [keyWidth - 0.008, 0.075, 0.57],
      [-0.99 + keyWidth * (i + 0.5), 1.19, 0.46],
      ivory,
      0.012,
    );
    key.userData.baseY = 1.19;
    keys.push(key);
  }
  const blackPattern = [0, 1, 3, 4, 5];
  for (let i = 0; i < keyCount - 1; i += 1) {
    if (!blackPattern.includes(i % 7)) continue;
    const key = addBox(
      piano,
      [keyWidth * 0.58, 0.12, 0.36],
      [-0.99 + keyWidth * (i + 1), 1.27, 0.34],
      ebony,
      0.018,
    );
    key.userData.baseY = 1.27;
    keys.push(key);
  }

  const stand = new THREE.Group();
  stand.position.set(0, 1.82, 0.22);
  stand.rotation.x = -0.18;
  piano.add(stand);
  addBox(stand, [1.24, 0.08, 0.08], [0, -0.48, 0], brass, 0.02);
  addBox(stand, [0.58, 0.92, 0.045], [-0.31, 0, 0], paper, 0.02);
  addBox(stand, [0.58, 0.92, 0.045], [0.31, 0, 0], paper, 0.02);
  for (const x of [-0.5, -0.28, 0.06, 0.29]) {
    for (let y = -0.27; y < 0.3; y += 0.14) addBox(stand, [0.2, 0.012, 0.01], [x, y, 0.03], edge, 0.003);
  }
  for (const x of [-0.18, 0.18]) {
    const pedal = addBox(piano, [0.18, 0.08, 0.42], [x, 0.18, 0.34], brass, 0.035);
    pedal.rotation.x = 0.16;
  }

  addBox(piano, [1.34, 0.17, 0.52], [0, 0.72, 1.38], edge, 0.08);
  for (const x of [-0.5, 0.5]) {
    for (const z of [1.22, 1.54]) addBox(piano, [0.1, 0.72, 0.1], [x, 0.34, z], lacquer, 0.03);
  }

  markInteractive(piano, "piano", interactive);
  return { piano, keys };
}

function buildDesk(scene: THREE.Scene, interactive: THREE.Object3D[]) {
  const desk = new THREE.Group();
  desk.position.set(3.55, 0, 1.25);
  scene.add(desk);

  const wood = new THREE.MeshPhysicalMaterial({ color: 0xb88358, roughness: 0.46, clearcoat: 0.18 });
  const woodEdge = new THREE.MeshStandardMaterial({ color: 0x7e5439, roughness: 0.65 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x29312f, metalness: 0.66, roughness: 0.28 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xeee4d2, roughness: 0.88 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x4d7886, roughness: 0.67 });
  const green = new THREE.MeshStandardMaterial({ color: 0x59755e, roughness: 0.76 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xffd68a, toneMapped: false });

  addBox(desk, [3.05, 0.16, 1.18], [0, 1.18, 0], wood, 0.08);
  for (const x of [-1.3, 1.3]) {
    for (const z of [-0.42, 0.42]) addBox(desk, [0.13, 1.14, 0.13], [x, 0.57, z], metal, 0.035);
  }
  addBox(desk, [0.82, 0.76, 0.92], [0.95, 0.76, -0.04], woodEdge, 0.07);
  for (const y of [0.56, 0.8, 1.04]) {
    addBox(desk, [0.68, 0.15, 0.06], [0.95, y, 0.45], wood, 0.025);
    addBox(desk, [0.18, 0.03, 0.035], [0.95, y, 0.492], metal, 0.01);
  }

  addBox(desk, [1.35, 0.06, 0.72], [-0.18, 1.3, 0.14], cream, 0.025);
  addBox(desk, [0.05, 0.025, 0.62], [-0.18, 1.34, 0.14], blue, 0.008);
  addBox(desk, [0.38, 0.16, 0.76], [-1.02, 1.34, -0.08], blue, 0.025);
  addBox(desk, [0.34, 0.12, 0.7], [-0.98, 1.48, -0.08], green, 0.025);
  addBox(desk, [0.3, 0.1, 0.66], [-0.94, 1.59, -0.08], cream, 0.025);

  const pencil = addCylinder(desk, 0.025, 0.025, 0.62, [0.42, 1.38, 0.25], metal, 12);
  pencil.rotation.z = Math.PI / 2;
  const lampStem = addCylinder(desk, 0.045, 0.065, 0.86, [1.12, 1.75, -0.34], metal, 16);
  lampStem.rotation.z = -0.18;
  addCylinder(desk, 0.28, 0.34, 0.12, [1.12, 1.3, -0.34], metal, 24);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.42, 24, 1, true), metal);
  shade.position.set(1.02, 2.14, -0.34);
  shade.rotation.z = -0.42;
  shade.castShadow = true;
  desk.add(shade);
  addSphere(desk, 0.12, [0.85, 2.03, -0.34], glow);

  addBox(desk, [1.3, 0.16, 0.53], [0, 0.7, 1.48], woodEdge, 0.09);
  addBox(desk, [1.12, 0.82, 0.12], [0, 1.08, 1.72], woodEdge, 0.08);
  for (const x of [-0.48, 0.48]) {
    for (const z of [1.3, 1.63]) addBox(desk, [0.1, 0.68, 0.1], [x, 0.33, z], metal, 0.03);
  }

  markInteractive(desk, "desk", interactive);
  return { desk, pencil };
}

type Limb = { pivot: THREE.Group; lower: THREE.Group };
type GirlRig = {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  eyes: THREE.Group[];
  leftArm: Limb;
  rightArm: Limb;
  leftLeg: Limb;
  rightLeg: Limb;
  ponytails: THREE.Group[];
};

function buildLimb(
  parent: THREE.Object3D,
  shoulder: [number, number, number],
  upperLength: number,
  lowerLength: number,
  radius: number,
  material: THREE.Material,
  shoeMaterial?: THREE.Material,
) : Limb {
  const pivot = new THREE.Group();
  pivot.position.set(...shoulder);
  parent.add(pivot);
  addCylinder(pivot, radius * 0.88, radius, upperLength, [0, -upperLength / 2, 0], material, 16);
  const lower = new THREE.Group();
  lower.position.y = -upperLength;
  pivot.add(lower);
  addCylinder(lower, radius * 0.72, radius * 0.85, lowerLength, [0, -lowerLength / 2, 0], material, 16);
  addSphere(lower, radius * 0.92, [0, -lowerLength, 0], shoeMaterial ?? material, [1.15, 0.8, 1.45]);
  return { pivot, lower };
}

function buildGirl(scene: THREE.Scene) : GirlRig {
  const root = new THREE.Group();
  root.position.copy(HOME);
  root.rotation.y = Math.PI;
  scene.add(root);

  const skin = new THREE.MeshPhysicalMaterial({ color: 0xf2bb92, roughness: 0.68, clearcoat: 0.08 });
  const denim = new THREE.MeshPhysicalMaterial({ color: 0x315f82, roughness: 0.62, clearcoat: 0.12 });
  const denimLight = new THREE.MeshStandardMaterial({ color: 0x5686a3, roughness: 0.66 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xf4e8d5, roughness: 0.9 });
  const hair = new THREE.MeshPhysicalMaterial({ color: 0xd86b32, roughness: 0.58, clearcoat: 0.2 });
  const hairLight = new THREE.MeshPhysicalMaterial({ color: 0xe6813f, roughness: 0.55, clearcoat: 0.18 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x34271f, roughness: 0.8 });
  const eyeWhite = new THREE.MeshPhysicalMaterial({ color: 0xfffbf4, roughness: 0.35, clearcoat: 0.16 });
  const iris = new THREE.MeshPhysicalMaterial({ color: 0x56848b, roughness: 0.38, clearcoat: 0.35 });
  const pupil = new THREE.MeshBasicMaterial({ color: 0x201a19, toneMapped: false });
  const cheek = new THREE.MeshBasicMaterial({ color: 0xe99083, transparent: true, opacity: 0.42, toneMapped: false });
  const shoe = new THREE.MeshStandardMaterial({ color: 0x70473a, roughness: 0.75 });
  const stitch = new THREE.MeshBasicMaterial({ color: 0xf0c693, toneMapped: false });
  const sock = new THREE.MeshStandardMaterial({ color: 0xf3eee3, roughness: 0.9 });
  const hairTie = new THREE.MeshStandardMaterial({ color: 0x5c8ca5, roughness: 0.65 });

  const torso = new THREE.Group();
  torso.position.y = 0.86;
  root.add(torso);
  addBox(torso, [0.72, 0.74, 0.38], [0, 0.62, 0], shirt, 0.16);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.7, 0.82, 20), denim);
  skirt.position.y = 0.11;
  skirt.castShadow = true;
  torso.add(skirt);
  addBox(torso, [0.12, 0.78, 0.04], [-0.22, 0.58, 0.22], denimLight, 0.025);
  addBox(torso, [0.12, 0.78, 0.04], [0.22, 0.58, 0.22], denimLight, 0.025);
  addBox(torso, [0.55, 0.36, 0.04], [0, 0.43, 0.225], denim, 0.04);
  addSphere(torso, 0.035, [-0.15, 0.48, 0.252], dark);
  addSphere(torso, 0.035, [0.15, 0.48, 0.252], dark);
  addBox(torso, [0.58, 0.035, 0.025], [0, 0.02, 0.36], stitch, 0.01);
  addBox(torso, [0.22, 0.2, 0.025], [-0.31, 0.18, 0.35], denimLight, 0.04);
  addBox(torso, [0.22, 0.2, 0.025], [0.31, 0.18, 0.35], denimLight, 0.04);
  addBox(torso, [0.66, 0.07, 0.39], [0, 0.83, 0], denimLight, 0.035);

  addCylinder(root, 0.12, 0.14, 0.22, [0, 1.7, 0], skin, 18);

  const head = new THREE.Group();
  head.position.set(0, 1.95, 0);
  root.add(head);
  addSphere(head, 0.43, [0, 0, 0], skin, [0.94, 1.06, 0.92]);
  addSphere(head, 0.43, [0, 0.12, -0.12], hair, [1, 1.02, 0.8]);
  const face = addSphere(head, 0.39, [0, -0.03, 0.08], skin, [0.94, 1.02, 0.84]);
  face.castShadow = false;
  addSphere(head, 0.075, [-0.405, -0.01, 0.04], skin, [0.45, 1, 0.8]);
  addSphere(head, 0.075, [0.405, -0.01, 0.04], skin, [0.45, 1, 0.8]);
  addSphere(head, 0.045, [0, -0.055, 0.415], skin, [0.7, 0.8, 0.55]);

  const eyes: THREE.Group[] = [];
  for (const x of [-0.14, 0.14]) {
    const eye = new THREE.Group();
    eye.position.set(x, 0.035, 0.407);
    head.add(eye);
    addSphere(eye, 0.066, [0, 0, 0], eyeWhite, [0.78, 1, 0.35]);
    addSphere(eye, 0.039, [0, -0.002, 0.048], iris, [0.78, 1, 0.34]);
    addSphere(eye, 0.023, [0, -0.003, 0.071], pupil, [0.75, 1, 0.3]);
    addSphere(eye, 0.008, [-0.01, 0.015, 0.085], eyeWhite, [1, 1, 0.42]);
    eyes.push(eye);

    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.105, 4, 8), dark);
    brow.position.set(x, 0.155, 0.394);
    brow.rotation.z = Math.PI / 2 + (x < 0 ? 1 : -1) * 0.11;
    brow.scale.z = 0.5;
    head.add(brow);
  }
  addSphere(head, 0.07, [-0.245, -0.085, 0.39], cheek, [1.3, 0.42, 0.2]);
  addSphere(head, 0.07, [0.245, -0.085, 0.39], cheek, [1.3, 0.42, 0.2]);

  // A layered, directional fringe reads as hair strands instead of a row of beads.
  const fringeLocks = [
    { x: -0.25, y: 0.255, length: 0.2, angle: -0.42 },
    { x: -0.13, y: 0.29, length: 0.25, angle: -0.2 },
    { x: 0, y: 0.31, length: 0.22, angle: 0.04 },
    { x: 0.13, y: 0.29, length: 0.25, angle: 0.2 },
    { x: 0.25, y: 0.255, length: 0.2, angle: 0.42 },
  ];
  fringeLocks.forEach((lock, index) => {
    const strand = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.052, lock.length, 5, 10),
      index % 2 ? hairLight : hair,
    );
    strand.position.set(lock.x, lock.y - lock.length * 0.42, 0.337);
    strand.rotation.set(0.12, 0, lock.angle);
    strand.scale.z = 0.42;
    strand.castShadow = true;
    head.add(strand);
  });
  for (const side of [-1, 1]) {
    const sideLock = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.24, 5, 10), hair);
    sideLock.position.set(side * 0.335, 0.05, 0.265);
    sideLock.rotation.set(0.05, 0, side * -0.16);
    sideLock.scale.z = 0.48;
    sideLock.castShadow = true;
    head.add(sideLock);
  }
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.012, 6, 20, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0xa35045, toneMapped: false }),
  );
  smile.position.set(0, -0.12, 0.41);
  smile.rotation.z = Math.PI;
  head.add(smile);

  const ponytails: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const pony = new THREE.Group();
    pony.position.set(side * 0.39, 0.15, -0.05);
    pony.rotation.z = side * -0.35;
    head.add(pony);
    addSphere(pony, 0.105, [0, 0, 0], hairTie, [1.2, 0.72, 1]);
    for (let segment = 0; segment < 3; segment += 1) {
      const lock = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.12 - segment * 0.018, 0.17 + segment * 0.015, 6, 12),
        segment === 1 ? hairLight : hair,
      );
      lock.position.set(side * (0.07 + segment * 0.035), -0.14 - segment * 0.2, 0);
      lock.rotation.z = side * (-0.12 - segment * 0.08);
      lock.scale.z = 0.78;
      lock.castShadow = true;
      pony.add(lock);
    }
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.25, 14), hair);
    tip.position.set(side * 0.2, -0.76, 0);
    tip.rotation.set(Math.PI, 0, side * 0.22);
    tip.castShadow = true;
    pony.add(tip);
    ponytails.push(pony);
  }

  const leftArm = buildLimb(root, [-0.47, 1.58, 0], 0.62, 0.56, 0.12, skin);
  const rightArm = buildLimb(root, [0.47, 1.58, 0], 0.62, 0.56, 0.12, skin);
  const leftLeg = buildLimb(root, [-0.26, 0.9, 0], 0.52, 0.55, 0.14, skin, shoe);
  const rightLeg = buildLimb(root, [0.26, 0.9, 0], 0.52, 0.55, 0.14, skin, shoe);
  addSphere(root, 0.19, [-0.47, 1.58, 0], shirt, [1, 0.82, 1]);
  addSphere(root, 0.19, [0.47, 1.58, 0], shirt, [1, 0.82, 1]);
  addSphere(leftArm.lower, 0.13, [0, 0, 0], skin);
  addSphere(rightArm.lower, 0.13, [0, 0, 0], skin);
  addSphere(leftLeg.lower, 0.15, [0, 0, 0], skin);
  addSphere(rightLeg.lower, 0.15, [0, 0, 0], skin);
  addCylinder(leftLeg.lower, 0.145, 0.145, 0.23, [0, -0.43, 0], sock, 16);
  addCylinder(rightLeg.lower, 0.145, 0.145, 0.23, [0, -0.43, 0], sock, 16);
  for (const arm of [leftArm, rightArm]) {
    const grip = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.034, 8, 20), skin);
    grip.position.set(0, -0.56, 0);
    grip.rotation.y = Math.PI / 2;
    grip.castShadow = true;
    arm.lower.add(grip);
  }
  return { root, torso, head, eyes, leftArm, rightArm, leftLeg, rightLeg, ponytails };
}

function makeDust(scene: THREE.Scene) {
  const points: number[] = [];
  for (let i = 0; i < 130; i += 1) {
    points.push(-5.7 + ((i * 73) % 112) / 10, 0.6 + ((i * 37) % 48) / 10, -4.8 + ((i * 53) % 95) / 10);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const material = new THREE.PointsMaterial({ color: 0xffe7bb, size: 0.025, transparent: true, opacity: 0.46 });
  const dust = new THREE.Points(geometry, material);
  scene.add(dust);
  return dust;
}

function setWalkPose(rig: GirlRig, clock: number, amount = 1) {
  const cycle = clock * 6.65;
  const stride = Math.sin(cycle);
  const leftLift = Math.max(0, -stride);
  const rightLift = Math.max(0, stride);
  const armSwing = 0.42 * stride * amount;

  rig.leftArm.pivot.rotation.x = armSwing;
  rig.rightArm.pivot.rotation.x = -armSwing;
  rig.leftArm.pivot.rotation.z = 0.075;
  rig.rightArm.pivot.rotation.z = -0.075;
  rig.leftArm.lower.rotation.x = (0.16 + leftLift * 0.24) * amount;
  rig.rightArm.lower.rotation.x = (0.16 + rightLift * 0.24) * amount;
  rig.leftLeg.pivot.rotation.x = -stride * 0.52 * amount;
  rig.rightLeg.pivot.rotation.x = stride * 0.52 * amount;
  rig.leftLeg.lower.rotation.x = leftLift * 0.72 * amount;
  rig.rightLeg.lower.rotation.x = rightLift * 0.72 * amount;
  rig.torso.rotation.y = -stride * 0.045 * amount;
  rig.torso.rotation.z = Math.sin(cycle * 2) * 0.012 * amount;
  rig.head.rotation.y = stride * 0.025 * amount;
  rig.root.position.y += (1 - Math.cos(cycle * 2)) * 0.012 * amount;
}

function resetPose(rig: GirlRig, factor: number) {
  const parts = [
    rig.leftArm.pivot,
    rig.rightArm.pivot,
    rig.leftArm.lower,
    rig.rightArm.lower,
    rig.leftLeg.pivot,
    rig.rightLeg.pivot,
    rig.leftLeg.lower,
    rig.rightLeg.lower,
    rig.torso,
    rig.head,
  ];
  parts.forEach((part) => {
    part.rotation.x = THREE.MathUtils.lerp(part.rotation.x, 0, factor);
    part.rotation.y = THREE.MathUtils.lerp(part.rotation.y, 0, factor);
    part.rotation.z = THREE.MathUtils.lerp(part.rotation.z, 0, factor);
  });
}

function lockHandsToBar(rig: GirlRig, angle: number) {
  rig.root.position.set(
    BAR_ANCHOR.x,
    BAR_ANCHOR.y - Math.cos(angle) * ARM_REACH,
    BAR_ANCHOR.z - Math.sin(angle) * ARM_REACH,
  );
  rig.root.rotation.set(angle, 0, 0);
  rig.leftArm.pivot.rotation.z = Math.PI;
  rig.rightArm.pivot.rotation.z = -Math.PI;
  rig.leftArm.lower.rotation.z = 0;
  rig.rightArm.lower.rotation.z = 0;
}

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<() => void>(() => undefined);
  const actionRef = useRef<(action: StoryAction) => void>(() => undefined);
  const [status, setStatus] = useState("拖拽查看梦境 · 点击树、门、钢琴或书桌");
  const [active, setActive] = useState<"idle" | StoryAction>("idle");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaeb8af);
    scene.fog = new THREE.Fog(0xaeb8af, 16, 32);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    camera.position.set(11.7, 7.2, 11.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(-0.35, 2.15, -1.35);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 8.5;
    controls.maxDistance = 23;
    controls.minPolarAngle = Math.PI * 0.16;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minAzimuthAngle = -Math.PI * 0.24;
    controls.maxAzimuthAngle = Math.PI * 0.42;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.13;

    const interactive: THREE.Object3D[] = [];
    buildRoom(scene);
    const ocean = buildOcean(scene);
    const doorHinge = buildDoor(scene, interactive);
    buildTree(scene, interactive);
    const piano = buildPiano(scene, interactive);
    const studyDesk = buildDesk(scene, interactive);
    const girl = buildGirl(scene);
    const dust = makeDust(scene);

    scene.add(new THREE.HemisphereLight(0xdff0e7, 0x57463a, 2.4));
    const sunlight = new THREE.DirectionalLight(0xffefcf, 4.6);
    sunlight.position.set(-5, 10, 7);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(2048, 2048);
    sunlight.shadow.camera.left = -10;
    sunlight.shadow.camera.right = 10;
    sunlight.shadow.camera.top = 10;
    sunlight.shadow.camera.bottom = -10;
    sunlight.shadow.bias = -0.0005;
    scene.add(sunlight);
    const seaLight = new THREE.PointLight(0x64d5ef, 24, 13, 1.7);
    seaLight.position.set(4.1, 2.6, -6.2);
    scene.add(seaLight);
    const treeLight = new THREE.PointLight(0xffd99d, 18, 9, 2);
    treeLight.position.set(-3.4, 5.3, 1.2);
    scene.add(treeLight);
    const pianoLight = new THREE.SpotLight(0xffe4b8, 21, 8, 0.72, 0.72, 1.7);
    pianoLight.position.set(-4.1, 5.6, 3.5);
    pianoLight.target.position.set(-5.3, 1.2, 2.3);
    scene.add(pianoLight, pianoLight.target);
    const studyLight = new THREE.PointLight(0xffd28a, 12, 5.5, 2);
    studyLight.position.set(4.35, 2.95, 0.9);
    scene.add(studyLight);

    let state: MotionState = "idle";
    let phase = 0;
    let elapsed = 0;
    let queued: StoryAction | null = null;
    let doorTarget = 0;
    const downAt = new THREE.Vector3();
    let audioContext: AudioContext | null = null;

    const ensureAudio = () => {
      audioContext ??= new AudioContext();
      if (audioContext.state === "suspended") void audioContext.resume();
    };

    const playMelody = () => {
      if (!audioContext) return;
      const notes = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23, 440, 587.33, 523.25, 392];
      const now = audioContext.currentTime + 0.04;
      notes.forEach((frequency, index) => {
        const oscillator = audioContext!.createOscillator();
        const gain = audioContext!.createGain();
        oscillator.type = index % 3 === 0 ? "triangle" : "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, now + index * 0.34);
        gain.gain.exponentialRampToValueAtTime(0.075, now + index * 0.34 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.34 + 0.52);
        oscillator.connect(gain).connect(audioContext!.destination);
        oscillator.start(now + index * 0.34);
        oscillator.stop(now + index * 0.34 + 0.56);
      });
    };

    const transition = (next: MotionState, message?: string) => {
      state = next;
      phase = 0;
      if (message) setStatus(message);
    };

    const startAction = (action: StoryAction) => {
      controls.autoRotate = false;
      if (action === "piano") ensureAudio();
      if (state !== "idle") {
        queued = action;
        const queuedMessage: Record<StoryAction, string> = {
          tree: "她会完成当前动作后去爬树",
          door: "她会完成当前动作后再去海边",
          piano: "她会完成当前动作后去弹钢琴",
          desk: "她会完成当前动作后回到书桌学习",
        };
        setStatus(queuedMessage[action]);
        return;
      }
      setActive(action);
      if (action === "tree") transition("tree-walk", "女孩正走向那棵树…");
      else if (action === "door") transition("door-walk", "女孩听见了门外的海浪…");
      else if (action === "piano") transition("piano-walk", "女孩正走向钢琴…");
      else transition("desk-walk", "女孩带着好奇心走向书桌…");
    };
    actionRef.current = startAction;

    const returnIdle = () => {
      state = "idle";
      phase = 0;
      girl.root.position.copy(HOME);
      girl.root.rotation.set(0, Math.PI, 0);
      doorTarget = 0;
      setActive("idle");
      setStatus("拖拽查看梦境 · 点击树、门、钢琴或书桌");
      const next = queued;
      queued = null;
      if (next) window.setTimeout(() => startAction(next), 180);
    };

    resetRef.current = () => {
      queued = null;
      returnIdle();
      resetPose(girl, 1);
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerStart = new THREE.Vector2();
    const hitAt = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(interactive, false)[0]?.object ?? null;
    };
    const onMove = (event: PointerEvent) => {
      const hit = hitAt(event);
      renderer.domElement.style.cursor = hit ? "pointer" : "grab";
      if (state !== "idle") return;
      if (hit?.userData.action === "tree") setStatus("点击树 · 看女孩爬树做单杠");
      else if (hit?.userData.action === "door") setStatus("点击门 · 跟女孩一起去看海");
      else if (hit?.userData.action === "piano") setStatus("点击钢琴 · 听女孩弹奏一段旋律");
      else if (hit?.userData.action === "desk") setStatus("点击书桌 · 陪女孩阅读与学习");
      else setStatus("拖拽查看梦境 · 点击树、门、钢琴或书桌");
    };
    const onDown = (event: PointerEvent) => {
      pointerStart.set(event.clientX, event.clientY);
      renderer.domElement.style.cursor = "grabbing";
    };
    const onUp = (event: PointerEvent) => {
      const moved = pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
      const hit = hitAt(event);
      renderer.domElement.style.cursor = hit ? "pointer" : "grab";
      if (moved > 8 || !hit) return;
      if (hit.userData.action === "tree") startAction("tree");
      if (hit.userData.action === "door") startAction("door");
      if (hit.userData.action === "piano") startAction("piano");
      if (hit.userData.action === "desk") startAction("desk");
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let frame = 0;
    const render = () => {
      frame = window.requestAnimationFrame(render);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      phase += dt;
      resetPose(girl, 0.12);
      girl.torso.scale.set(1, 1, 1);
      piano.keys.forEach((key) => {
        key.position.y = key.userData.baseY as number;
      });
      studyDesk.pencil.position.set(0.42, 1.38, 0.25);
      studyDesk.pencil.rotation.set(0, 0, Math.PI / 2);
      girl.root.position.y = state === "idle" ? Math.sin(elapsed * 2.2) * 0.015 : girl.root.position.y;

      const blinkPhase = elapsed % 4.65;
      const blink = blinkPhase < 0.16
        ? 0.1 + Math.abs(blinkPhase - 0.08) / 0.08 * 0.9
        : 1;
      girl.eyes.forEach((eye) => eye.scale.set(1, blink, 1));

      if (state === "idle") {
        girl.head.rotation.y = Math.sin(elapsed * 0.7) * 0.09;
        girl.head.rotation.z = Math.sin(elapsed * 0.43) * 0.018;
        girl.torso.scale.y = 1 + Math.sin(elapsed * 2.05) * 0.009;
        girl.leftArm.pivot.rotation.z = 0.08;
        girl.rightArm.pivot.rotation.z = -0.08;
        girl.leftArm.lower.rotation.x = 0.08;
        girl.rightArm.lower.rotation.x = 0.08;
      }

      if (state === "tree-walk") {
        const p = ease(phase / 3.1);
        girl.root.position.lerpVectors(HOME, TREE_BASE, p);
        girl.root.rotation.y = THREE.MathUtils.lerp(Math.PI, -Math.PI / 2, p);
        setWalkPose(girl, elapsed);
        if (phase > 3.1) transition("tree-climb", "她正在沿着树干向上爬…");
      } else if (state === "tree-climb") {
        const p = ease(phase / 2.55);
        const effort = Math.sin(p * Math.PI);
        const climbStep = Math.sin(p * Math.PI * 6);
        girl.root.position.lerpVectors(TREE_BASE, TREE_HANG, p);
        girl.root.position.x -= climbStep * effort * 0.065;
        girl.root.position.z += Math.cos(p * Math.PI * 3) * effort * 0.045;
        girl.root.rotation.y = THREE.MathUtils.lerp(-Math.PI / 2, 0, ease(Math.max(0, (p - 0.68) / 0.32)));
        girl.leftArm.pivot.rotation.z = Math.PI * p + climbStep * effort * 0.14;
        girl.rightArm.pivot.rotation.z = -Math.PI * p + climbStep * effort * 0.14;
        girl.leftArm.lower.rotation.z = Math.max(0, -climbStep) * effort * 0.34;
        girl.rightArm.lower.rotation.z = -Math.max(0, climbStep) * effort * 0.34;
        girl.leftLeg.pivot.rotation.z = climbStep * effort * 0.35;
        girl.rightLeg.pivot.rotation.z = -climbStep * effort * 0.35;
        girl.leftLeg.lower.rotation.x = Math.max(0, climbStep) * effort * 0.58;
        girl.rightLeg.lower.rotation.x = Math.max(0, -climbStep) * effort * 0.58;
        girl.torso.rotation.z = -climbStep * effort * 0.055;
        girl.head.rotation.y = climbStep * effort * 0.08;
        if (phase > 2.55) transition("tree-bar", "抓稳了！她正在树枝上做单杠");
      } else if (state === "tree-bar") {
        const angle = Math.sin(phase * 2.095) * 0.33;
        lockHandsToBar(girl, angle);
        const swing = Math.sin(phase * 2.095);
        girl.leftLeg.pivot.rotation.x = swing * 0.36;
        girl.rightLeg.pivot.rotation.x = swing * 0.36;
        girl.leftLeg.lower.rotation.x = 0.2 + Math.max(0, swing) * 0.35;
        girl.rightLeg.lower.rotation.x = 0.2 + Math.max(0, swing) * 0.35;
        girl.torso.rotation.x = -swing * 0.06;
        if (phase > 6.0) transition("tree-release", "她开始摆荡蓄力，准备体操下杠…");
      } else if (state === "tree-release") {
        const p = ease(phase / 0.86);
        const angle = THREE.MathUtils.lerp(0, RELEASE_ANGLE, p);
        lockHandsToBar(girl, angle);
        girl.leftLeg.pivot.rotation.x = -0.28 * p;
        girl.rightLeg.pivot.rotation.x = -0.28 * p;
        girl.torso.rotation.x = 0.1 * p;
        if (phase > 0.86) transition("tree-spin", "松手！她正在空中完成 360° 转体");
      } else if (state === "tree-spin") {
        const p = ease(phase / 1.58);
        girl.root.position.lerpVectors(RELEASE_POINT, TREE_LAND, p);
        girl.root.position.y += Math.sin(p * Math.PI) * 2.45;
        girl.root.rotation.set(
          THREE.MathUtils.lerp(RELEASE_ANGLE, Math.PI * 2, p),
          Math.sin(p * Math.PI) * 0.08,
          0,
        );
        const tuck = Math.sin(Math.PI * THREE.MathUtils.clamp(p / 0.88, 0, 1));
        girl.leftArm.pivot.rotation.x = -0.7 * tuck;
        girl.rightArm.pivot.rotation.x = -0.7 * tuck;
        girl.leftArm.pivot.rotation.z = 0.7 * tuck;
        girl.rightArm.pivot.rotation.z = -0.7 * tuck;
        girl.leftArm.lower.rotation.x = 1.1 * tuck;
        girl.rightArm.lower.rotation.x = 1.1 * tuck;
        girl.leftLeg.pivot.rotation.x = -0.82 * tuck;
        girl.rightLeg.pivot.rotation.x = -0.82 * tuck;
        girl.leftLeg.lower.rotation.x = 1.72 * tuck;
        girl.rightLeg.lower.rotation.x = 1.72 * tuck;
        girl.ponytails.forEach((pony, index) => {
          pony.rotation.x = -1.05 * tuck;
          pony.rotation.z = (index ? -1 : 1) * (0.48 + tuck * 0.35);
        });
        if (phase > 1.58) transition("tree-land", "稳稳落地！她屈膝缓冲，完成体操收势");
      } else if (state === "tree-land") {
        const compression = phase < 0.22
          ? ease(phase / 0.22)
          : 1 - ease((phase - 0.22) / 0.92);
        girl.root.position.copy(TREE_LAND);
        girl.root.position.y = -0.12 * compression;
        girl.root.rotation.set(0, 0, 0);
        girl.leftLeg.pivot.rotation.x = -0.34 * compression;
        girl.rightLeg.pivot.rotation.x = -0.34 * compression;
        girl.leftLeg.lower.rotation.x = 0.78 * compression;
        girl.rightLeg.lower.rotation.x = 0.78 * compression;
        girl.torso.rotation.x = 0.24 * compression;
        girl.leftArm.pivot.rotation.x = -0.86 * compression;
        girl.rightArm.pivot.rotation.x = -0.86 * compression;
        girl.leftArm.pivot.rotation.z = 0.18 * compression;
        girl.rightArm.pivot.rotation.z = -0.18 * compression;
        if (phase > 1.18) transition("tree-return", "漂亮收官！她正走回房间中央");
      } else if (state === "tree-return") {
        const p = ease(phase / 2.7);
        girl.root.position.lerpVectors(TREE_LAND, HOME, p);
        girl.root.rotation.y = THREE.MathUtils.lerp(0, Math.PI, p);
        setWalkPose(girl, elapsed);
        if (phase > 2.7) returnIdle();
      } else if (state === "piano-walk") {
        const p = ease(phase / 3.4);
        girl.root.position.lerpVectors(HOME, PIANO_SEAT, p);
        girl.root.rotation.y = THREE.MathUtils.lerp(Math.PI, -Math.PI / 2, p);
        setWalkPose(girl, elapsed);
        if (phase > 3.4) transition("piano-sit", "她在琴凳上坐好，双手轻轻放上琴键");
      } else if (state === "piano-sit") {
        const p = ease(phase / 1.35);
        girl.root.position.copy(PIANO_SEAT);
        girl.root.rotation.set(0, -Math.PI / 2, 0);
        girl.torso.rotation.x = Math.sin(p * Math.PI) * 0.09;
        girl.leftLeg.pivot.rotation.x = -Math.PI / 2 * p;
        girl.rightLeg.pivot.rotation.x = -Math.PI / 2 * p;
        girl.leftLeg.lower.rotation.x = Math.PI / 2 * p;
        girl.rightLeg.lower.rotation.x = Math.PI / 2 * p;
        girl.leftArm.pivot.rotation.x = -0.78 * p;
        girl.rightArm.pivot.rotation.x = -0.78 * p;
        girl.leftArm.lower.rotation.x = -0.67 * p;
        girl.rightArm.lower.rotation.x = -0.67 * p;
        girl.head.rotation.x = 0.12 * p;
        if (phase > 1.35) {
          playMelody();
          transition("piano-play", "女孩正在弹奏一段温柔的小旋律…");
        }
      } else if (state === "piano-play") {
        girl.root.position.copy(PIANO_SEAT);
        girl.root.rotation.set(0, -Math.PI / 2, 0);
        girl.leftLeg.pivot.rotation.x = -Math.PI / 2;
        girl.rightLeg.pivot.rotation.x = -Math.PI / 2;
        girl.leftLeg.lower.rotation.x = Math.PI / 2;
        girl.rightLeg.lower.rotation.x = Math.PI / 2;
        const rhythm = Math.sin(phase * 10.8);
        girl.leftArm.pivot.rotation.x = -0.78 + rhythm * 0.055;
        girl.rightArm.pivot.rotation.x = -0.78 - rhythm * 0.055;
        girl.leftArm.pivot.rotation.z = 0.08;
        girl.rightArm.pivot.rotation.z = -0.08;
        girl.leftArm.lower.rotation.x = -0.67 + Math.max(0, rhythm) * 0.14;
        girl.rightArm.lower.rotation.x = -0.67 + Math.max(0, -rhythm) * 0.14;
        girl.head.rotation.x = 0.13 + Math.sin(phase * 1.8) * 0.04;
        girl.torso.rotation.y = Math.sin(phase * 1.35) * 0.025;
        const keyIndex = Math.floor(phase * 6.2) % piano.keys.length;
        const partnerIndex = (keyIndex + 4) % piano.keys.length;
        piano.keys[keyIndex].position.y -= 0.035;
        if (Math.floor(phase * 3.1) % 2 === 0) piano.keys[partnerIndex].position.y -= 0.025;
        if (phase > 5.1) transition("piano-return", "旋律结束了，她轻轻离开琴凳");
      } else if (state === "piano-return") {
        const p = ease(phase / 3.25);
        girl.root.position.lerpVectors(PIANO_SEAT, HOME, p);
        girl.root.rotation.y = THREE.MathUtils.lerp(-Math.PI / 2, Math.PI, p);
        setWalkPose(girl, elapsed, ease(Math.max(0, (p - 0.12) / 0.88)));
        if (p < 0.18) {
          const seated = 1 - ease(p / 0.18);
          girl.leftLeg.pivot.rotation.x = -Math.PI / 2 * seated;
          girl.rightLeg.pivot.rotation.x = -Math.PI / 2 * seated;
          girl.leftLeg.lower.rotation.x = Math.PI / 2 * seated;
          girl.rightLeg.lower.rotation.x = Math.PI / 2 * seated;
        }
        if (phase > 3.25) returnIdle();
      } else if (state === "desk-walk") {
        const p = ease(phase / 3.25);
        girl.root.position.lerpVectors(HOME, DESK_SEAT, p);
        girl.root.rotation.y = Math.PI;
        setWalkPose(girl, elapsed);
        if (phase > 3.25) transition("desk-sit", "她拉开椅子，在书桌前坐下");
      } else if (state === "desk-sit") {
        const p = ease(phase / 1.3);
        girl.root.position.copy(DESK_SEAT);
        girl.root.rotation.set(0, Math.PI, 0);
        girl.torso.rotation.x = 0.08 * p + Math.sin(p * Math.PI) * 0.06;
        girl.leftLeg.pivot.rotation.x = -Math.PI / 2 * p;
        girl.rightLeg.pivot.rotation.x = -Math.PI / 2 * p;
        girl.leftLeg.lower.rotation.x = Math.PI / 2 * p;
        girl.rightLeg.lower.rotation.x = Math.PI / 2 * p;
        girl.leftArm.pivot.rotation.x = -0.74 * p;
        girl.rightArm.pivot.rotation.x = -0.79 * p;
        girl.leftArm.lower.rotation.x = -0.69 * p;
        girl.rightArm.lower.rotation.x = -0.72 * p;
        girl.head.rotation.x = 0.2 * p;
        if (phase > 1.3) transition("desk-study", "台灯亮着，她正在认真阅读和做笔记…");
      } else if (state === "desk-study") {
        girl.root.position.copy(DESK_SEAT);
        girl.root.rotation.set(0, Math.PI, 0);
        girl.leftLeg.pivot.rotation.x = -Math.PI / 2;
        girl.rightLeg.pivot.rotation.x = -Math.PI / 2;
        girl.leftLeg.lower.rotation.x = Math.PI / 2;
        girl.rightLeg.lower.rotation.x = Math.PI / 2;
        girl.leftArm.pivot.rotation.x = -0.74;
        girl.rightArm.pivot.rotation.x = -0.79 + Math.sin(phase * 8.5) * 0.045;
        girl.leftArm.pivot.rotation.z = 0.12;
        girl.rightArm.pivot.rotation.z = -0.18;
        girl.leftArm.lower.rotation.x = -0.69;
        girl.rightArm.lower.rotation.x = -0.72 + Math.sin(phase * 8.5) * 0.11;
        girl.torso.rotation.x = 0.075;
        girl.head.rotation.x = 0.22 + Math.sin(phase * 1.2) * 0.035;
        girl.head.rotation.y = Math.sin(phase * 0.7) * 0.08;
        studyDesk.pencil.position.x = 0.42 + Math.sin(phase * 8.5) * 0.17;
        studyDesk.pencil.position.z = 0.25 + Math.sin(phase * 4.25) * 0.05;
        if (phase > 8.2) transition("desk-return", "学习告一段落，她合上笔记准备休息");
      } else if (state === "desk-return") {
        const p = ease(phase / 3.0);
        girl.root.position.lerpVectors(DESK_SEAT, HOME, p);
        girl.root.rotation.y = Math.PI;
        setWalkPose(girl, elapsed, ease(Math.max(0, (p - 0.12) / 0.88)));
        if (p < 0.18) {
          const seated = 1 - ease(p / 0.18);
          girl.leftLeg.pivot.rotation.x = -Math.PI / 2 * seated;
          girl.rightLeg.pivot.rotation.x = -Math.PI / 2 * seated;
          girl.leftLeg.lower.rotation.x = Math.PI / 2 * seated;
          girl.rightLeg.lower.rotation.x = Math.PI / 2 * seated;
        }
        if (phase > 3.0) returnIdle();
      } else if (state === "door-walk") {
        const p = ease(phase / 4.1);
        girl.root.position.lerpVectors(HOME, DOOR_FRONT, p);
        girl.root.rotation.y = THREE.MathUtils.lerp(Math.PI, Math.PI, p);
        setWalkPose(girl, elapsed);
        if (phase > 4.1) transition("door-open", "她伸手推开了通往大海的门…");
      } else if (state === "door-open") {
        doorTarget = -Math.PI * 0.52;
        girl.rightArm.pivot.rotation.x = -0.76;
        girl.rightArm.lower.rotation.x = -0.62;
        girl.rightArm.pivot.rotation.z = -0.72;
        girl.head.rotation.y = -0.22;
        if (phase > 1.65) transition("door-exit", "海风吹进来了，她正跑向海边");
      } else if (state === "door-exit") {
        const p = ease(phase / 2.5);
        girl.root.position.lerpVectors(DOOR_FRONT, new THREE.Vector3(3.6, 0, -6.8), p);
        girl.root.rotation.y = Math.PI;
        setWalkPose(girl, elapsed, 1.35);
        if (phase > 2.5) {
          downAt.copy(girl.root.position);
          transition("door-dive", "扑通！她跳进了蓝色的大海");
        }
      } else if (state === "door-dive") {
        const p = ease(phase / 1.6);
        girl.root.position.lerpVectors(downAt, new THREE.Vector3(3.25, 0.38, -8.2), p);
        girl.root.position.y += Math.sin(p * Math.PI) * 1.15;
        girl.root.rotation.x = -p * Math.PI / 2;
        girl.leftArm.pivot.rotation.x = -1.5 * p;
        girl.rightArm.pivot.rotation.x = -1.5 * p;
        if (phase > 1.6) transition("swimming", "她正在门外的大海里游泳 · 点击重置可回到房间");
      } else if (state === "swimming") {
        const swim = phase;
        girl.root.position.set(3.25 + Math.sin(swim * 0.45) * 0.9, 0.42 + Math.sin(swim * 2.1) * 0.06, -8.2 - Math.min(swim * 0.12, 2.2));
        girl.root.rotation.set(-Math.PI / 2 + Math.sin(swim * 1.2) * 0.04, Math.PI, 0);
        const stroke = swim * 2.85;
        const leftStroke = Math.sin(stroke);
        const rightStroke = Math.sin(stroke + Math.PI);
        girl.leftArm.pivot.rotation.x = -1.05 + leftStroke * 1.0;
        girl.rightArm.pivot.rotation.x = -1.05 + rightStroke * 1.0;
        girl.leftArm.pivot.rotation.z = Math.cos(stroke) * 0.13;
        girl.rightArm.pivot.rotation.z = -Math.cos(stroke + Math.PI) * 0.13;
        girl.leftArm.lower.rotation.x = 0.12 + Math.max(0, Math.cos(stroke)) * 0.9;
        girl.rightArm.lower.rotation.x = 0.12 + Math.max(0, Math.cos(stroke + Math.PI)) * 0.9;
        girl.leftLeg.pivot.rotation.x = Math.sin(swim * 5.2) * 0.45;
        girl.rightLeg.pivot.rotation.x = -Math.sin(swim * 5.2) * 0.45;
        girl.leftLeg.lower.rotation.x = 0.08 + Math.max(0, Math.sin(swim * 5.2)) * 0.18;
        girl.rightLeg.lower.rotation.x = 0.08 + Math.max(0, -Math.sin(swim * 5.2)) * 0.18;
        girl.head.rotation.y = Math.max(0, Math.sin(swim * 1.42)) * 0.22;
      }

      doorHinge.rotation.y = THREE.MathUtils.lerp(doorHinge.rotation.y, doorTarget, 0.075);
      if (state !== "tree-spin") {
        girl.ponytails.forEach((pony, index) => {
          const side = index ? -1 : 1;
          const motionBoost = state.includes("walk") || state.includes("return") ? 1.65 : 1;
          pony.rotation.x = Math.sin(elapsed * 4.25 + index * 1.4) * 0.085 * motionBoost;
          pony.rotation.z = side * (0.35 + Math.sin(elapsed * 2.8 + index * 1.25) * 0.055 * motionBoost);
        });
      }
      const positions = ocean.water.geometry.attributes.position;
      for (let i = 0; i < positions.count; i += 1) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        positions.setZ(i, Math.sin(x * 0.7 + elapsed * 1.1) * 0.08 + Math.cos(y * 0.55 + elapsed * 0.85) * 0.06);
      }
      positions.needsUpdate = true;
      ocean.waves.forEach((wave, index) => {
        wave.position.x += Math.sin(elapsed * 0.7 + index) * 0.0008;
        wave.material.opacity = 0.45 + Math.sin(elapsed * 1.1 + index) * 0.16;
      });
      dust.rotation.y += dt * 0.018;
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      if (audioContext && audioContext.state !== "closed") void audioContext.close();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <main className="dream-shell">
      <header className="dream-header">
        <a className="brand" href="#" aria-label="Dream Room 首页">
          DREAM<span>/ROOM</span>
        </a>
        <div className="chapter">CHAPTER 01 · THE TREE &amp; THE SEA</div>
      </header>

      <section className="scene-card" aria-label="一间有树、女孩、钢琴、书桌和海之门的可交互三维房间">
        <div ref={mountRef} className="scene-mount" />

        <div className="room-title">
          <span>梦境房间 / 01</span>
          <strong>Some doors open into the sea.</strong>
        </div>

        <div className="story-actions" aria-label="互动选择">
          <button className={active === "tree" ? "is-active" : ""} onClick={() => actionRef.current("tree")}> 
            <span>01</span>
            <strong>爬树与体操下杠</strong>
            <small>CLIMB · SWING · 360°</small>
          </button>
          <button className={active === "door" ? "is-active" : ""} onClick={() => actionRef.current("door")}> 
            <span>02</span>
            <strong>打开海之门</strong>
            <small>OPEN &amp; SWIM</small>
          </button>
          <button className={active === "piano" ? "is-active" : ""} onClick={() => actionRef.current("piano")}> 
            <span>03</span>
            <strong>坐下弹钢琴</strong>
            <small>PLAY &amp; LISTEN</small>
          </button>
          <button className={active === "desk" ? "is-active" : ""} onClick={() => actionRef.current("desk")}> 
            <span>04</span>
            <strong>在书桌前学习</strong>
            <small>READ &amp; WRITE</small>
          </button>
        </div>

        <div className="interaction-hint" aria-live="polite">
          <span className="hint-dot" />
          <span>{status}</span>
        </div>

        <button className="reset-button" onClick={() => resetRef.current()} aria-label="重置女孩和房间动画">
          ↻ 重置故事
        </button>
      </section>

      <footer className="dream-footer">
        <span>拖拽旋转 · 滚轮缩放 · 点击互动</span>
        <span>TREE · PIANO · STUDY · SEA BEYOND THE DOOR</span>
      </footer>
    </main>
  );
}
