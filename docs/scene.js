// Generated from app/scene.ts by scripts/build-pages.sh. Do not edit by hand.
/**
 * The Dream Room scene: a girl in a room with a climbable tree, a piano, a
 * study desk, and a door that opens onto the sea.
 *
 * Framework-free on purpose. `app/page.tsx` mounts this from React, and the
 * static GitHub Pages build in `demo/` mounts the very same module after a
 * type-strip, so the published page can never drift from the source.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createSurfaceFactory } from "./textures.js";
const HOME = new THREE.Vector3(-0.15, 0, 2.55);
const TREE_BASE = new THREE.Vector3(-2.38, 0, -0.58);
const BAR_ANCHOR = new THREE.Vector3(-1.55, 3.52, -0.92);
// Root origin to the hands with the arms straight overhead: shoulder height
// plus both arm segments. The bar hang and the release point derive from it.
const ARM_REACH = 2.35;
const TREE_HANG = new THREE.Vector3(BAR_ANCHOR.x, BAR_ANCHOR.y - ARM_REACH, BAR_ANCHOR.z);
const TREE_LAND = new THREE.Vector3(-1.48, 0, 1.12);
const RELEASE_ANGLE = -0.62;
const RELEASE_POINT = new THREE.Vector3(BAR_ANCHOR.x, BAR_ANCHOR.y - Math.cos(RELEASE_ANGLE) * ARM_REACH, BAR_ANCHOR.z - Math.sin(RELEASE_ANGLE) * ARM_REACH);
const DOOR_FRONT = new THREE.Vector3(3.45, 0, -2.9);
const PIANO_SEAT = new THREE.Vector3(-4.55, 0, 2.3);
const DESK_SEAT = new THREE.Vector3(3.55, 0, 2.65);
// The camera is penned into the +Z half of the room, so a girl facing -Z
// showed the viewer nothing but the back of her head. At rest she stands at
// three-quarters to the default camera, which is where her face reads best.
const HOME_FACING = 0.68;
const ease = (value) => {
    const t = THREE.MathUtils.clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
};
function roundedBox(size, material, radius = 0.08) {
    const safe = Math.min(radius, Math.min(...size) * 0.42);
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 4, safe), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}
function addBox(parent, size, position, material, radius = 0.04) {
    const mesh = roundedBox(size, material, radius);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
}
function addSphere(parent, radius, position, material, scale = [1, 1, 1]) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 18), material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}
function addCylinder(parent, radiusTop, radiusBottom, height, position, material, segments = 18) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}
function markInteractive(root, action, interactive) {
    root.traverse((object) => {
        if (!(object instanceof THREE.Mesh))
            return;
        object.userData.action = action;
        interactive.push(object);
    });
}
/**
 * Every material in the room, built once from the procedural surface library.
 *
 * The rule throughout: albedo, normal, and roughness all come from the same
 * painted surface, so a plank catches light along its grain and a shirt along
 * its weave. Anything glossy leans on `scene.environment` for its reflection
 * rather than on a raised specular value.
 */
function createPalette(surfaces) {
    const oak = surfaces.oakFloor();
    const deskOak = surfaces.oakDesk();
    const plasterSurface = surfaces.plaster();
    const wool = surfaces.wovenWool();
    const barkSurface = surfaces.bark();
    const leafSurface = surfaces.foliage();
    const linen = surfaces.linen();
    const denimWeave = surfaces.denim();
    const knitSurface = surfaces.knit();
    const hide = surfaces.leather();
    const paperStock = surfaces.paper();
    const beach = surfaces.sand();
    const lacquerFinish = surfaces.finishVariation("#2b2b2b", ["rgba(120,120,120,0.34)", "rgba(0,0,0,0.3)"], 2, 1501);
    const brassFinish = surfaces.finishVariation("#4a4a4a", ["rgba(150,150,150,0.46)", "rgba(24,24,24,0.4)"], 3, 1601);
    const paintFinish = surfaces.finishVariation("#5e5e5e", ["rgba(160,160,160,0.34)", "rgba(40,40,40,0.3)"], 2, 1701);
    const soft = (x) => new THREE.Vector2(x, x);
    return {
        floor: new THREE.MeshPhysicalMaterial({
            ...oak,
            normalScale: soft(0.85),
            roughness: 1,
            metalness: 0,
            clearcoat: 0.16,
            clearcoatRoughness: 0.62,
            envMapIntensity: 0.5,
        }),
        wall: new THREE.MeshStandardMaterial({
            ...plasterSurface,
            normalScale: soft(0.4),
            roughness: 1,
            envMapIntensity: 0.55,
        }),
        trim: new THREE.MeshStandardMaterial({
            color: 0xf1e8da,
            normalMap: plasterSurface.normalMap,
            normalScale: soft(0.2),
            roughness: 0.55,
            envMapIntensity: 0.7,
        }),
        rug: new THREE.MeshPhysicalMaterial({
            ...wool,
            normalScale: soft(1.15),
            roughness: 1,
            sheen: 0.45,
            sheenColor: new THREE.Color(0xd8b98c),
            sheenRoughness: 0.9,
            envMapIntensity: 0.2,
        }),
        bark: new THREE.MeshStandardMaterial({
            ...barkSurface,
            color: 0xcbb5a6,
            normalScale: soft(1.5),
            roughness: 1,
            envMapIntensity: 0.35,
        }),
        barkLight: new THREE.MeshStandardMaterial({
            ...barkSurface,
            normalScale: soft(1.2),
            roughness: 1,
            envMapIntensity: 0.4,
        }),
        leafA: new THREE.MeshPhysicalMaterial({
            ...leafSurface,
            normalScale: soft(0.9),
            roughness: 1,
            sheen: 0.45,
            sheenColor: new THREE.Color(0xd8f0c0),
            envMapIntensity: 0.5,
        }),
        leafB: new THREE.MeshPhysicalMaterial({
            ...leafSurface,
            color: 0xd2e4b8,
            normalScale: soft(0.75),
            roughness: 1,
            sheen: 0.3,
            envMapIntensity: 0.45,
        }),
        lacquer: new THREE.MeshPhysicalMaterial({
            color: 0x0d1110,
            roughnessMap: lacquerFinish,
            roughness: 1,
            metalness: 0.1,
            clearcoat: 1,
            clearcoatRoughness: 0.05,
            envMapIntensity: 1.35,
        }),
        lacquerEdge: new THREE.MeshPhysicalMaterial({
            color: 0x2a2c29,
            roughnessMap: lacquerFinish,
            roughness: 1.6,
            metalness: 0.32,
            clearcoat: 0.6,
            clearcoatRoughness: 0.2,
            envMapIntensity: 1,
        }),
        ivory: new THREE.MeshPhysicalMaterial({
            color: 0xf3efe4,
            normalMap: paperStock.normalMap,
            normalScale: soft(0.16),
            roughness: 0.34,
            clearcoat: 0.55,
            clearcoatRoughness: 0.22,
            envMapIntensity: 0.85,
        }),
        ebony: new THREE.MeshPhysicalMaterial({
            color: 0x111413,
            roughness: 0.2,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
            envMapIntensity: 1,
        }),
        brass: new THREE.MeshStandardMaterial({
            color: 0xc79a4b,
            roughnessMap: brassFinish,
            roughness: 1,
            metalness: 1,
            envMapIntensity: 1.5,
        }),
        paper: new THREE.MeshStandardMaterial({
            ...paperStock,
            normalScale: soft(0.5),
            roughness: 1,
            envMapIntensity: 0.4,
        }),
        sheetMusic: new THREE.MeshStandardMaterial({
            map: surfaces.sheetMusic(),
            normalMap: paperStock.normalMap,
            normalScale: soft(0.4),
            roughness: 0.92,
            side: THREE.DoubleSide,
            envMapIntensity: 0.4,
        }),
        deskWood: new THREE.MeshPhysicalMaterial({
            ...deskOak,
            normalScale: soft(0.55),
            roughness: 1,
            clearcoat: 0.3,
            clearcoatRoughness: 0.34,
            envMapIntensity: 0.75,
        }),
        deskEdge: new THREE.MeshStandardMaterial({
            ...deskOak,
            color: 0xa1795a,
            normalScale: soft(0.6),
            roughness: 1,
            envMapIntensity: 0.5,
        }),
        metal: new THREE.MeshStandardMaterial({
            color: 0x33393a,
            roughnessMap: brassFinish,
            roughness: 0.85,
            metalness: 0.9,
            envMapIntensity: 1.1,
        }),
        doorPaint: new THREE.MeshPhysicalMaterial({
            color: 0x335d68,
            roughnessMap: paintFinish,
            roughness: 1,
            clearcoat: 0.42,
            clearcoatRoughness: 0.24,
            envMapIntensity: 0.9,
        }),
        sand: new THREE.MeshStandardMaterial({
            ...beach,
            normalScale: soft(0.85),
            roughness: 1,
            envMapIntensity: 0.6,
        }),
        skin: new THREE.MeshPhysicalMaterial({
            color: 0xf2bb92,
            roughness: 0.62,
            clearcoat: 0.1,
            clearcoatRoughness: 0.55,
            sheen: 0.4,
            sheenColor: new THREE.Color(0xff9d7d),
            sheenRoughness: 0.7,
            envMapIntensity: 0.75,
        }),
        shirt: new THREE.MeshPhysicalMaterial({
            ...linen,
            normalScale: soft(0.65),
            roughness: 1,
            sheen: 0.85,
            sheenColor: new THREE.Color(0xfff4e2),
            sheenRoughness: 0.75,
            envMapIntensity: 0.4,
        }),
        denim: new THREE.MeshPhysicalMaterial({
            ...denimWeave,
            color: 0xccd6e2,
            normalScale: soft(0.8),
            roughness: 1,
            sheen: 0.32,
            sheenColor: new THREE.Color(0xbcd6ea),
            envMapIntensity: 0.4,
        }),
        denimLight: new THREE.MeshPhysicalMaterial({
            ...denimWeave,
            normalScale: soft(0.7),
            roughness: 1,
            sheen: 0.28,
            envMapIntensity: 0.45,
        }),
        sock: new THREE.MeshStandardMaterial({
            ...knitSurface,
            normalScale: soft(1),
            roughness: 1,
            envMapIntensity: 0.3,
        }),
        shoe: new THREE.MeshPhysicalMaterial({
            ...hide,
            normalScale: soft(0.9),
            roughness: 1,
            clearcoat: 0.35,
            clearcoatRoughness: 0.45,
            envMapIntensity: 0.7,
        }),
        bench: new THREE.MeshPhysicalMaterial({
            ...hide,
            color: 0x8a6455,
            normalScale: soft(0.75),
            roughness: 1,
            clearcoat: 0.3,
            clearcoatRoughness: 0.4,
            envMapIntensity: 0.7,
        }),
        // Clearcoat plus a low base roughness reads as the sheen along a braid.
        hair: new THREE.MeshPhysicalMaterial({
            color: 0xd86b32,
            roughness: 0.52,
            clearcoat: 0.5,
            clearcoatRoughness: 0.22,
            sheen: 0.55,
            sheenColor: new THREE.Color(0xffbe7d),
            envMapIntensity: 0.9,
        }),
        hairLight: new THREE.MeshPhysicalMaterial({
            color: 0xe6813f,
            roughness: 0.46,
            clearcoat: 0.55,
            clearcoatRoughness: 0.18,
            sheen: 0.6,
            sheenColor: new THREE.Color(0xffd0a0),
            envMapIntensity: 1,
        }),
        hairTie: new THREE.MeshStandardMaterial({
            ...knitSurface,
            color: 0x7fb2cd,
            normalScale: soft(0.9),
            roughness: 1,
            envMapIntensity: 0.4,
        }),
        dark: new THREE.MeshStandardMaterial({ color: 0x34271f, roughness: 0.8, envMapIntensity: 0.4 }),
        eyeWhite: new THREE.MeshPhysicalMaterial({
            color: 0xfffbf4,
            roughness: 0.16,
            clearcoat: 1,
            clearcoatRoughness: 0.03,
            envMapIntensity: 1.3,
        }),
        iris: new THREE.MeshPhysicalMaterial({
            color: 0x3f6a75,
            roughness: 0.18,
            clearcoat: 1,
            clearcoatRoughness: 0.04,
            envMapIntensity: 0.55,
        }),
    };
}
/**
 * A soft dark disc laid just above the floor. The shadow map handles the hard
 * contact edge; this fills the ambient occlusion underneath a solid object,
 * which is what stops furniture from looking like it is hovering.
 */
function addContactShadow(scene, texture, position, size, opacity = 0.3, rotation = 0) {
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), 
    // The falloff texture is black with a graded alpha, so plain alpha
    // blending darkens the floor without tinting it.
    new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
    }));
    shadow.rotation.set(-Math.PI / 2, 0, rotation);
    shadow.position.set(position[0], 0.014, position[1]);
    shadow.renderOrder = 1;
    scene.add(shadow);
    return shadow;
}
function buildRoom(scene, palette, surfaces) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(13, 11), palette.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);
    addBox(scene, [0.18, 5.6, 10.8], [-6.4, 2.8, 0], palette.wall, 0.02);
    addBox(scene, [9.55, 5.6, 0.18], [-1.62, 2.8, -5.35], palette.wall, 0.02);
    addBox(scene, [1.45, 5.6, 0.18], [5.67, 2.8, -5.35], palette.wall, 0.02);
    addBox(scene, [2.15, 1.35, 0.18], [4.1, 4.92, -5.35], palette.wall, 0.02);
    addBox(scene, [0.16, 0.23, 10.7], [-6.28, 0.13, 0], palette.trim, 0.02);
    addBox(scene, [9.55, 0.23, 0.16], [-1.62, 0.13, -5.23], palette.trim, 0.02);
    addBox(scene, [1.45, 0.23, 0.16], [5.67, 0.13, -5.23], palette.trim, 0.02);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(2.25, 96), palette.rug);
    rug.rotation.x = -Math.PI / 2;
    rug.scale.y = 0.68;
    rug.position.set(-0.2, 0.018, 1.2);
    rug.receiveShadow = true;
    scene.add(rug);
    // Where the walls meet the floor, ambient light never fully reaches.
    const crease = surfaces.radialFalloff("rgba(0,0,0,0.5)", "rgba(0,0,0,0.16)", 0.55);
    addContactShadow(scene, crease, [-5.4, 0], [3.4, 11], 0.5);
    addContactShadow(scene, crease, [-1.6, -4.4], [10, 3], 0.5);
}
function buildOcean(scene, palette, surfaces) {
    const ocean = new THREE.Group();
    ocean.position.z = -5.55;
    scene.add(ocean);
    // The sky and sun opt out of fog: they are the horizon the fog fades into,
    // so fogging them would grey out the view through the door.
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(26, 15), new THREE.MeshBasicMaterial({ map: surfaces.seaSky(), toneMapped: false, fog: false }));
    sky.position.set(0, 5.4, -10);
    ocean.add(sky);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfff3cf, toneMapped: false, fog: false });
    addSphere(ocean, 0.72, [-3.9, 5.65, -9.65], sunMaterial);
    // An additive halo so the sun bleeds into the sky instead of sitting on it.
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: surfaces.radialFalloff("rgba(255,246,214,0.95)", "rgba(255,214,142,0.24)", 0.3),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        fog: false,
    }));
    halo.position.set(-3.9, 5.65, -9.62);
    halo.scale.set(7.2, 7.2, 1);
    ocean.add(halo);
    const waterNormal = surfaces.seaNormal();
    const waterMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x11607f,
        normalMap: waterNormal,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.08,
        metalness: 0,
        ior: 1.33,
        transparent: true,
        opacity: 0.93,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        envMapIntensity: 1.6,
    });
    // The near edge starts beyond the exterior threshold. No part of this plane
    // extends beneath the room floor.
    const water = new THREE.Mesh(new THREE.PlaneGeometry(22, 12, 48, 34), waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.06, -6);
    water.receiveShadow = true;
    ocean.add(water);
    const shore = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.15), palette.sand);
    shore.rotation.x = -Math.PI / 2;
    shore.position.set(4.1, 0.025, -0.48);
    shore.receiveShadow = true;
    ocean.add(shore);
    // Each crest owns its material so the foam can breathe out of step; a shared
    // material would have left every line pulsing on the same beat.
    const waves = [];
    for (let i = 0; i < 7; i += 1) {
        const wave = new THREE.Mesh(new THREE.TorusGeometry(1.1 + i * 0.18, 0.022, 6, 42, Math.PI), new THREE.MeshBasicMaterial({
            color: 0xd9f5f2,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
            toneMapped: false,
        }));
        wave.rotation.x = Math.PI / 2;
        wave.rotation.z = Math.PI;
        wave.scale.x = 2.3;
        wave.position.set((i % 2 ? 1 : -1) * 1.3, 0.11, -1.2 - i * 1.25);
        ocean.add(wave);
        waves.push(wave);
    }
    return { water, waves, waterNormal };
}
function buildDoor(scene, palette, interactive) {
    addBox(scene, [0.24, 4.25, 0.32], [3.02, 2.14, -5.18], palette.trim, 0.05);
    addBox(scene, [0.24, 4.25, 0.32], [5.18, 2.14, -5.18], palette.trim, 0.05);
    addBox(scene, [2.38, 0.25, 0.32], [4.1, 4.25, -5.18], palette.trim, 0.05);
    const hinge = new THREE.Group();
    hinge.position.set(3.18, 0.13, -5.05);
    scene.add(hinge);
    const door = addBox(hinge, [1.78, 3.85, 0.18], [0.89, 1.93, 0], palette.doorPaint, 0.1);
    // Recessed panels: two shallow insets give the paint an edge to catch on.
    for (const [y, height] of [[2.72, 1.42], [1.12, 1.42]]) {
        const panel = addBox(hinge, [1.26, height, 0.03], [0.89, y, 0.1], palette.doorPaint, 0.03);
        panel.receiveShadow = true;
    }
    addBox(hinge, [1.38, 0.08, 0.06], [0.89, 3.42, 0.115], palette.trim, 0.02);
    addBox(hinge, [1.38, 0.08, 0.06], [0.89, 0.52, 0.115], palette.trim, 0.02);
    const handle = addSphere(hinge, 0.09, [1.55, 1.92, 0.18], palette.brass);
    handle.scale.z = 0.55;
    addCylinder(hinge, 0.05, 0.05, 0.16, [1.55, 1.92, 0.1], palette.brass, 14).rotation.x = Math.PI / 2;
    markInteractive(hinge, "door", interactive);
    door.userData.action = "door";
    return hinge;
}
function buildTree(scene, palette, interactive) {
    const tree = new THREE.Group();
    tree.position.set(-3.6, 0, -1.0);
    scene.add(tree);
    const { bark, barkLight, leafA, leafB } = palette;
    addCylinder(tree, 0.43, 0.64, 4.25, [0, 2.12, 0], bark, 28);
    const branchJoint = addCylinder(tree, 0.18, 0.29, 1.42, [0.48, 3.14, 0.06], bark, 22);
    branchJoint.rotation.z = Math.PI / 2.7;
    const branch = addCylinder(tree, 0.13, 0.17, 3.35, [1.45, 3.52, 0.08], barkLight, 28);
    branch.rotation.z = Math.PI / 2;
    // Where hands have gripped the branch, the bark is rubbed smooth.
    const gripZone = new THREE.Mesh(new THREE.CylinderGeometry(0.137, 0.137, 1.24, 28), new THREE.MeshPhysicalMaterial({
        color: 0xa9825e,
        roughness: 0.52,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.7,
    }));
    gripZone.position.set(2.05, 3.52, 0.08);
    gripZone.rotation.z = Math.PI / 2;
    gripZone.castShadow = true;
    tree.add(gripZone);
    const backBranch = addCylinder(tree, 0.18, 0.26, 2.25, [-0.55, 3.25, -0.4], bark, 16);
    backBranch.rotation.z = -0.62;
    backBranch.rotation.x = 0.36;
    // Crown clumps get their own rotation so the leaf texture does not repeat
    // in a recognisable way from sphere to sphere.
    const crownPositions = [
        [-0.55, 4.45, 0, 1.2],
        [0.45, 4.72, -0.15, 1.05],
        [-0.05, 5.25, 0.1, 1.05],
        [1.25, 4.28, -0.15, 0.88],
        [-1.1, 4.0, -0.2, 0.92],
        [0.2, 4.28, 0.75, 0.9],
    ];
    crownPositions.forEach(([x, y, z, scale], index) => {
        const clump = addSphere(tree, scale, [x, y, z], index % 2 ? leafA : leafB, [1.18, 0.85, 1]);
        clump.rotation.set(index * 0.7, index * 1.9, index * 0.4);
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
function buildPiano(scene, palette, interactive) {
    const piano = new THREE.Group();
    piano.position.set(-5.95, 0, 2.3);
    piano.rotation.y = Math.PI / 2;
    scene.add(piano);
    const lacquer = palette.lacquer;
    const edge = palette.lacquerEdge;
    const ivory = palette.ivory;
    const ebony = palette.ebony;
    const brass = palette.brass;
    addBox(piano, [2.18, 2.18, 0.5], [0, 1.45, -0.17], lacquer, 0.12);
    addBox(piano, [2.35, 0.16, 0.66], [0, 2.55, -0.1], edge, 0.06);
    addBox(piano, [1.86, 0.74, 0.08], [0, 1.74, 0.105], edge, 0.05);
    addBox(piano, [2.38, 0.16, 0.86], [0, 1.1, 0.3], lacquer, 0.05);
    addBox(piano, [2.18, 0.1, 0.18], [0, 0.92, 0.66], edge, 0.035);
    for (const x of [-0.82, 0.82])
        addBox(piano, [0.2, 0.92, 0.25], [x, 0.53, -0.05], lacquer, 0.06);
    addBox(piano, [1.45, 0.12, 0.2], [0, 0.45, -0.04], edge, 0.03);
    const keys = [];
    const keyCount = 15;
    const keyWidth = 1.98 / keyCount;
    for (let i = 0; i < keyCount; i += 1) {
        const key = addBox(piano, [keyWidth - 0.008, 0.075, 0.57], [-0.99 + keyWidth * (i + 0.5), 1.19, 0.46], ivory, 0.012);
        key.userData.baseY = 1.19;
        keys.push(key);
    }
    const blackPattern = [0, 1, 3, 4, 5];
    for (let i = 0; i < keyCount - 1; i += 1) {
        if (!blackPattern.includes(i % 7))
            continue;
        const key = addBox(piano, [keyWidth * 0.58, 0.12, 0.36], [-0.99 + keyWidth * (i + 1), 1.27, 0.34], ebony, 0.018);
        key.userData.baseY = 1.27;
        keys.push(key);
    }
    const stand = new THREE.Group();
    stand.position.set(0, 1.82, 0.22);
    stand.rotation.x = -0.18;
    piano.add(stand);
    addBox(stand, [1.24, 0.08, 0.08], [0, -0.48, 0], brass, 0.02);
    // Real ruled manuscript, so the staves and notes come from the texture
    // rather than from a grid of tiny boxes.
    for (const x of [-0.31, 0.31]) {
        const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.92), palette.sheetMusic);
        sheet.position.set(x, 0, 0.026);
        sheet.castShadow = true;
        sheet.receiveShadow = true;
        stand.add(sheet);
        addBox(stand, [0.58, 0.92, 0.02], [x, 0, 0.012], palette.paper, 0.006);
    }
    for (const x of [-0.18, 0.18]) {
        const pedal = addBox(piano, [0.18, 0.08, 0.42], [x, 0.18, 0.34], brass, 0.035);
        pedal.rotation.x = 0.16;
    }
    addBox(piano, [1.34, 0.17, 0.52], [0, 0.72, 1.38], palette.bench, 0.08);
    for (const x of [-0.5, 0.5]) {
        for (const z of [1.22, 1.54])
            addBox(piano, [0.1, 0.72, 0.1], [x, 0.34, z], lacquer, 0.03);
    }
    markInteractive(piano, "piano", interactive);
    return { piano, keys };
}
function buildDesk(scene, palette, glowFalloff, interactive) {
    const desk = new THREE.Group();
    desk.position.set(3.55, 0, 1.25);
    scene.add(desk);
    const wood = palette.deskWood;
    const woodEdge = palette.deskEdge;
    const metal = palette.metal;
    const cream = new THREE.MeshStandardMaterial({
        map: palette.paper.map,
        normalMap: palette.paper.normalMap,
        normalScale: new THREE.Vector2(0.45, 0.45),
        roughnessMap: palette.paper.roughnessMap,
        color: 0xeee4d2,
        roughness: 1,
        envMapIntensity: 0.4,
    });
    const blue = new THREE.MeshPhysicalMaterial({
        color: 0x4d7886,
        roughness: 0.52,
        clearcoat: 0.45,
        clearcoatRoughness: 0.3,
        envMapIntensity: 0.8,
    });
    const green = new THREE.MeshPhysicalMaterial({
        color: 0x59755e,
        roughness: 0.58,
        clearcoat: 0.4,
        clearcoatRoughness: 0.34,
        envMapIntensity: 0.75,
    });
    const glow = new THREE.MeshBasicMaterial({ color: 0xffd68a, toneMapped: false });
    addBox(desk, [3.05, 0.16, 1.18], [0, 1.18, 0], wood, 0.08);
    for (const x of [-1.3, 1.3]) {
        for (const z of [-0.42, 0.42])
            addBox(desk, [0.13, 1.14, 0.13], [x, 0.57, z], metal, 0.035);
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
    shade.material.side = THREE.DoubleSide;
    desk.add(shade);
    addSphere(desk, 0.12, [0.85, 2.03, -0.34], glow);
    // A soft bloom around the bulb — the filament reads as hot, not as a ball.
    const bulbGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowFalloff,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
    }));
    bulbGlow.position.set(0.85, 2.03, -0.34);
    bulbGlow.scale.set(1.4, 1.4, 1);
    desk.add(bulbGlow);
    addBox(desk, [1.3, 0.16, 0.53], [0, 0.7, 1.48], woodEdge, 0.09);
    addBox(desk, [1.12, 0.82, 0.12], [0, 1.08, 1.72], woodEdge, 0.08);
    for (const x of [-0.48, 0.48]) {
        for (const z of [1.3, 1.63])
            addBox(desk, [0.1, 0.68, 0.1], [x, 0.33, z], metal, 0.03);
    }
    markInteractive(desk, "desk", interactive);
    return { desk, pencil, bulbGlow };
}
/**
 * Body proportions, in one place.
 *
 * The previous figure was assembled without a shared measure: a 0.86-wide head
 * on a 2.4-tall body (under three heads — full bobblehead), a skirt whose hem
 * was wider than the arms hung, so the arms disappeared inside it, and feet
 * that ended up buried below the floor. These numbers fix that. She reads at
 * just under four heads tall, the hem clears the arms, and the soles sit on
 * the ground.
 */
const BODY = {
    headRadius: 0.3,
    headY: 2.02,
    neckTop: 1.72,
    shoulderY: 1.55,
    shoulderX: 0.275,
    upperArm: 0.42,
    lowerArm: 0.38,
    armRadius: 0.088,
    hipY: 0.95,
    hipX: 0.16,
    upperLeg: 0.44,
    lowerLeg: 0.4,
    legRadius: 0.105,
    waistY: 1.05,
    hemY: 0.72,
    hemRadius: 0.36,
};
/**
 * One capsule per segment. The rounded cap *is* the joint, so an elbow no
 * longer shows the seam where a cylinder met a sphere, and a bent limb keeps
 * a continuous silhouette.
 */
function buildLimb(parent, socket, upperLength, lowerLength, radius, material) {
    const pivot = new THREE.Group();
    pivot.position.set(...socket);
    parent.add(pivot);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.max(0.01, upperLength - radius * 2), 6, 18), material);
    upper.position.y = -upperLength / 2;
    upper.castShadow = true;
    upper.receiveShadow = true;
    pivot.add(upper);
    const lower = new THREE.Group();
    lower.position.y = -upperLength;
    pivot.add(lower);
    // The forearm and shin taper, which is most of what reads as "limb" rather
    // than "tube".
    const distal = new THREE.Mesh(new THREE.CapsuleGeometry(radius * 0.85, Math.max(0.01, lowerLength - radius * 1.7), 6, 18), material);
    distal.position.y = -lowerLength / 2;
    distal.castShadow = true;
    distal.receiveShadow = true;
    lower.add(distal);
    return { pivot, lower };
}
/** A palm with a thumb — the old hand was a bare torus ring. */
function addHand(limb, side, length, palette) {
    const hand = new THREE.Group();
    hand.position.y = -length;
    limb.lower.add(hand);
    const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.055, 4, 14), palette.skin);
    palm.position.y = -0.055;
    palm.scale.set(1, 1, 0.74);
    palm.castShadow = true;
    hand.add(palm);
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.045, 3, 10), palette.skin);
    thumb.position.set(side * 0.05, -0.045, 0.022);
    thumb.rotation.z = side * -0.75;
    thumb.castShadow = true;
    hand.add(thumb);
    return hand;
}
/** A shoe with a sole and a toe, sitting on the floor rather than under it. */
function addFoot(limb, length, palette) {
    const ankle = new THREE.Group();
    ankle.position.y = -length;
    limb.lower.add(ankle);
    const cuff = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.1, 4, 14), palette.sock);
    cuff.position.y = 0.08;
    cuff.castShadow = true;
    ankle.add(cuff);
    const shoe = roundedBox([0.155, 0.105, 0.25], palette.shoe, 0.05);
    shoe.position.set(0, -0.048, 0.045);
    ankle.add(shoe);
    const sole = roundedBox([0.16, 0.035, 0.255], palette.dark, 0.016);
    sole.position.set(0, -0.088, 0.045);
    ankle.add(sole);
    return ankle;
}
function buildGirl(scene, palette) {
    const root = new THREE.Group();
    root.position.copy(HOME);
    root.rotation.y = HOME_FACING;
    scene.add(root);
    const { skin, denim, denimLight, shirt, hair, hairLight, dark, eyeWhite, iris, hairTie, } = palette;
    const pupil = new THREE.MeshBasicMaterial({ color: 0x201a19, toneMapped: false });
    // Blush has to be lit. An unlit basic material at 0.42 sat on the face like
    // two painted circles instead of colour coming through the skin.
    const cheek = new THREE.MeshStandardMaterial({
        color: 0xe08b7c,
        roughness: 1,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
    });
    const lashLine = new THREE.MeshStandardMaterial({ color: 0x3d2b22, roughness: 0.7 });
    const lip = new THREE.MeshStandardMaterial({ color: 0xb4675c, roughness: 0.62 });
    const stitch = new THREE.MeshBasicMaterial({ color: 0xf0c693, toneMapped: false });
    // ─── torso ───
    // The animation scales and rotates this group, so it sits at the hip line
    // and everything above is built in its local space.
    const torso = new THREE.Group();
    torso.position.y = BODY.hipY;
    root.add(torso);
    const chestHeight = BODY.shoulderY - BODY.waistY + 0.1;
    const chest = roundedBox([0.44, chestHeight, 0.27], shirt, 0.12);
    chest.position.y = BODY.waistY - BODY.hipY + chestHeight / 2 - 0.02;
    torso.add(chest);
    // A short pinafore, narrow enough that the arms hang clear of the hem.
    const skirtHeight = BODY.waistY - BODY.hemY;
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, BODY.hemRadius, skirtHeight, 26, 1, true), denim);
    skirt.position.y = BODY.waistY - BODY.hipY - skirtHeight / 2;
    skirt.material.side = THREE.DoubleSide;
    skirt.castShadow = true;
    skirt.receiveShadow = true;
    torso.add(skirt);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(BODY.hemRadius, 0.022, 8, 34), denimLight);
    hem.rotation.x = Math.PI / 2;
    hem.position.y = BODY.hemY - BODY.hipY;
    hem.castShadow = true;
    torso.add(hem);
    // Bib and straps, so the pinafore reads as worn over the shirt.
    const bib = roundedBox([0.28, 0.26, 0.05], denim, 0.03);
    bib.position.set(0, BODY.waistY - BODY.hipY + 0.16, 0.13);
    torso.add(bib);
    for (const side of [-1, 1]) {
        const strap = roundedBox([0.075, 0.48, 0.04], denimLight, 0.02);
        strap.position.set(side * 0.13, BODY.waistY - BODY.hipY + 0.3, 0.115);
        strap.rotation.z = side * 0.05;
        torso.add(strap);
        const button = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.014, 12), dark);
        button.position.set(side * 0.11, BODY.waistY - BODY.hipY + 0.27, 0.16);
        button.rotation.x = Math.PI / 2;
        torso.add(button);
    }
    const waistband = roundedBox([0.4, 0.055, 0.25], denimLight, 0.02);
    waistband.position.y = BODY.waistY - BODY.hipY;
    torso.add(waistband);
    const trim = roundedBox([0.3, 0.02, 0.02], stitch, 0.008);
    trim.position.set(0, BODY.waistY - BODY.hipY + 0.03, 0.145);
    torso.add(trim);
    // Collar and sleeve caps close the gap where the arm meets the body.
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.03, 8, 22), shirt);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = BODY.shoulderY - BODY.hipY + 0.06;
    collar.castShadow = true;
    torso.add(collar);
    for (const side of [-1, 1]) {
        const sleeve = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 14), shirt);
        sleeve.position.set(side * BODY.shoulderX, BODY.shoulderY - BODY.hipY, 0);
        sleeve.scale.set(1, 0.86, 1);
        sleeve.castShadow = true;
        torso.add(sleeve);
    }
    const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.09, 4, 14), skin);
    neck.position.y = (BODY.shoulderY + BODY.neckTop) / 2;
    neck.castShadow = true;
    root.add(neck);
    // ─── head ───
    // One sphere, not two. The old build stacked a second "face" sphere in front
    // of the skull, and the overlap showed as a lump along the jaw.
    const head = new THREE.Group();
    head.position.set(0, BODY.headY, 0);
    root.add(head);
    const R = BODY.headRadius;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 30), skin);
    skull.scale.set(0.97, 1.06, 0.95);
    skull.castShadow = true;
    skull.receiveShadow = true;
    head.add(skull);
    for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(R * 0.19, 14, 12), skin);
        ear.position.set(side * R * 0.94, -0.01, 0.01);
        ear.scale.set(0.5, 1, 0.78);
        ear.castShadow = true;
        head.add(ear);
    }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(R * 0.115, 14, 12), skin);
    nose.position.set(0, -R * 0.2, R * 0.9);
    nose.scale.set(0.8, 0.72, 0.85);
    nose.castShadow = true;
    head.add(nose);
    const eyes = [];
    for (const side of [-1, 1]) {
        const eye = new THREE.Group();
        eye.position.set(side * R * 0.32, R * 0.02, R * 0.855);
        head.add(eye);
        addSphere(eye, R * 0.185, [0, 0, 0], eyeWhite, [0.86, 1, 0.32]);
        addSphere(eye, R * 0.14, [0, -0.004, 0.034], iris, [0.86, 1, 0.3]);
        // A pupil this size is what stops the eye reading as a flat blue disc.
        addSphere(eye, R * 0.086, [0, -0.006, 0.052], pupil, [0.84, 1, 0.26]);
        addSphere(eye, R * 0.03, [-side * 0.017, 0.019, 0.062], eyeWhite, [1, 1, 0.4]);
        // Lash line across the top of the eye. It lives inside the eye group so it
        // squashes with the blink, and it is what gives the eye an edge to sit in.
        const lash = new THREE.Mesh(new THREE.TorusGeometry(R * 0.185, 0.0125, 6, 20, Math.PI * 0.95), lashLine);
        lash.position.z = 0.012;
        lash.rotation.z = -Math.PI * 0.025;
        lash.scale.set(0.88, 1, 0.4);
        eye.add(lash);
        eyes.push(eye);
        const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.07, 4, 10), lashLine);
        brow.position.set(side * R * 0.32, R * 0.36, R * 0.83);
        brow.rotation.z = Math.PI / 2 - side * 0.15;
        brow.scale.z = 0.4;
        head.add(brow);
        // Small, on the cheekbone, off to the side — not a disc across the face.
        const blush = new THREE.Mesh(new THREE.SphereGeometry(R * 0.13, 14, 12), cheek);
        blush.position.set(side * R * 0.66, -R * 0.24, R * 0.74);
        blush.scale.set(1.1, 0.62, 0.14);
        head.add(blush);
    }
    // The mouth sits lower, so the chin does not read as an empty expanse, and
    // carries a lower lip so it is a mouth rather than a drawn line.
    const smile = new THREE.Mesh(new THREE.TorusGeometry(R * 0.2, 0.0135, 6, 24, Math.PI * 0.92), lip);
    smile.position.set(0, -R * 0.46, R * 0.83);
    smile.rotation.set(0.12, 0, Math.PI * 1.04);
    smile.scale.z = 0.55;
    head.add(smile);
    const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(R * 0.11, 14, 10), skin);
    lowerLip.position.set(0, -R * 0.6, R * 0.78);
    lowerLip.scale.set(1.1, 0.42, 0.3);
    head.add(lowerLip);
    // ─── hair ───
    //
    // Two shells, and the angles matter. The crown stops above the brow line, so
    // there is a forehead; the back-and-sides mass is cut out of the phi range so
    // it wraps to the temples and no further. A cap that ran to 0.58π covered the
    // face down past the eyes, leaving only the pupils poking through orange.
    const HAIRLINE = Math.PI * 0.33;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 40, 22, 0, Math.PI * 2, 0, HAIRLINE), hair);
    cap.scale.set(1, 1.07, 1);
    cap.position.y = -R * 0.02;
    cap.material.side = THREE.DoubleSide;
    cap.castShadow = true;
    head.add(cap);
    // phi 0.5π faces forward, so starting at 0.74π and running 1.52π leaves a
    // window open across the face and closes everywhere else.
    const backHair = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 36, 26, Math.PI * 0.74, Math.PI * 1.52, Math.PI * 0.18, Math.PI * 0.64), hair);
    backHair.scale.set(1, 1.07, 1.02);
    backHair.position.set(0, -R * 0.02, -R * 0.03);
    backHair.material.side = THREE.DoubleSide;
    backHair.castShadow = true;
    head.add(backHair);
    // The fringe is a shell too, dipping to just above the brows. Six separate
    // capsules read as a row of curlers rather than as hair.
    const bangs = new THREE.Mesh(new THREE.SphereGeometry(R * 1.1, 32, 20, Math.PI * 0.2, Math.PI * 0.6, Math.PI * 0.06, Math.PI * 0.32), hair);
    bangs.scale.set(1, 1.06, 1);
    bangs.position.y = -R * 0.02;
    bangs.material.side = THREE.DoubleSide;
    bangs.castShadow = true;
    head.add(bangs);
    // Three soft locks over the shell, only to break the cut line and give the
    // sweep a direction.
    const fringe = [
        { x: -0.46, y: 0.42, length: 0.12, tilt: -0.34 },
        { x: -0.04, y: 0.46, length: 0.14, tilt: -0.05 },
        { x: 0.42, y: 0.4, length: 0.11, tilt: 0.36 },
    ];
    fringe.forEach((lock, index) => {
        const strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, lock.length, 5, 14), index === 1 ? hairLight : hair);
        strand.position.set(lock.x * R, lock.y * R - lock.length * 0.4, R * 0.9);
        strand.rotation.set(0.3, 0, lock.tilt);
        strand.scale.z = 0.3;
        strand.castShadow = true;
        head.add(strand);
    });
    // A slim lock in front of each ear, framing the cheek.
    for (const side of [-1, 1]) {
        const sideLock = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.22, 5, 12), hair);
        sideLock.position.set(side * R * 0.94, -R * 0.2, R * 0.42);
        sideLock.rotation.set(0.05, 0, side * -0.13);
        sideLock.scale.z = 0.55;
        sideLock.castShadow = true;
        head.add(sideLock);
    }
    // ─── ponytails ───
    const ponytails = [];
    for (const side of [-1, 1]) {
        const pony = new THREE.Group();
        pony.position.set(side * R * 0.86, R * 0.2, -R * 0.5);
        pony.rotation.set(-0.2, 0, side * -0.5);
        head.add(pony);
        const tie = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.026, 8, 18), hairTie);
        tie.rotation.y = Math.PI / 2;
        tie.castShadow = true;
        pony.add(tie);
        // A tail that actually tapers along its length.
        for (let segment = 0; segment < 3; segment += 1) {
            const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.075 - segment * 0.016, 0.13 + segment * 0.02, 6, 14), segment === 1 ? hairLight : hair);
            lock.position.set(side * (0.05 + segment * 0.03), -0.11 - segment * 0.15, -0.01);
            lock.rotation.z = side * (-0.14 - segment * 0.09);
            lock.scale.z = 0.82;
            lock.castShadow = true;
            pony.add(lock);
        }
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.17, 14), hair);
        tip.position.set(side * 0.16, -0.55, -0.01);
        tip.rotation.set(Math.PI, 0, side * 0.28);
        tip.castShadow = true;
        pony.add(tip);
        ponytails.push(pony);
    }
    // ─── limbs ───
    const leftArm = buildLimb(root, [-BODY.shoulderX, BODY.shoulderY, 0], BODY.upperArm, BODY.lowerArm, BODY.armRadius, skin);
    const rightArm = buildLimb(root, [BODY.shoulderX, BODY.shoulderY, 0], BODY.upperArm, BODY.lowerArm, BODY.armRadius, skin);
    const leftLeg = buildLimb(root, [-BODY.hipX, BODY.hipY, 0], BODY.upperLeg, BODY.lowerLeg, BODY.legRadius, skin);
    const rightLeg = buildLimb(root, [BODY.hipX, BODY.hipY, 0], BODY.upperLeg, BODY.lowerLeg, BODY.legRadius, skin);
    addHand(leftArm, -1, BODY.lowerArm, palette);
    addHand(rightArm, 1, BODY.lowerArm, palette);
    addFoot(leftLeg, BODY.lowerLeg, palette);
    addFoot(rightLeg, BODY.lowerLeg, palette);
    return { root, torso, head, eyes, leftArm, rightArm, leftLeg, rightLeg, ponytails };
}
function makeDust(scene, sprite) {
    const points = [];
    for (let i = 0; i < 220; i += 1) {
        points.push(-5.7 + ((i * 73) % 112) / 10, 0.6 + ((i * 37) % 48) / 10, -4.8 + ((i * 53) % 95) / 10);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    // A soft round sprite instead of the default square point: motes read as
    // catching the light rather than as pixels.
    const material = new THREE.PointsMaterial({
        color: 0xffe7bb,
        map: sprite,
        size: 0.07,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
    });
    const dust = new THREE.Points(geometry, material);
    scene.add(dust);
    return dust;
}
function setWalkPose(rig, clock, amount = 1) {
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
function resetPose(rig, factor) {
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
function lockHandsToBar(rig, angle) {
    rig.root.position.set(BAR_ANCHOR.x, BAR_ANCHOR.y - Math.cos(angle) * ARM_REACH, BAR_ANCHOR.z - Math.sin(angle) * ARM_REACH);
    rig.root.rotation.set(angle, 0, 0);
    rig.leftArm.pivot.rotation.z = Math.PI;
    rig.rightArm.pivot.rotation.z = -Math.PI;
    rig.leftArm.lower.rotation.z = 0;
    rig.rightArm.lower.rotation.z = 0;
}
export const IDLE_STATUS = "拖拽查看梦境 · 点击树、门、钢琴或书桌";
export function createDreamRoom(mount, handlers) {
    const setStatus = handlers.onStatus;
    const setActive = handlers.onActive;
    const scene = new THREE.Scene();
    // Far enough out that the room and the sea keep their colour; the fog is
    // there to soften the horizon, not to wash the scene.
    scene.fog = new THREE.Fog(0xa9b5ad, 26, 62);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    camera.position.set(11.7, 7.2, 11.3);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    // PCF here is the Vogel-disk filter, so `shadow.radius` below actually
    // widens the penumbra instead of being ignored.
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    const surfaces = createSurfaceFactory(renderer.capabilities.getMaxAnisotropy());
    /**
     * Image-based lighting. Every glossy surface — lacquer, brass, eyes, the
     * sea — reflects this panorama, which is what separates a rendered
     * material from a flat colour with a specular dot on it.
     */
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const panorama = surfaces.environmentPanorama();
    const environment = pmrem.fromEquirectangular(panorama).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.9;
    scene.background = surfaces.backdrop();
    panorama.dispose();
    pmrem.dispose();
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
    const palette = createPalette(surfaces);
    const softShadow = surfaces.radialFalloff("rgba(0,0,0,0.55)", "rgba(0,0,0,0.2)", 0.5);
    const glowFalloff = surfaces.radialFalloff("rgba(255,231,180,0.9)", "rgba(255,205,128,0.2)", 0.28);
    const interactive = [];
    buildRoom(scene, palette, surfaces);
    const ocean = buildOcean(scene, palette, surfaces);
    const doorHinge = buildDoor(scene, palette, interactive);
    buildTree(scene, palette, interactive);
    const piano = buildPiano(scene, palette, interactive);
    const studyDesk = buildDesk(scene, palette, glowFalloff, interactive);
    const girl = buildGirl(scene, palette);
    const dust = makeDust(scene, glowFalloff);
    // Ambient occlusion under anything heavy, so nothing floats.
    addContactShadow(scene, softShadow, [-5.95, 2.3], [2.9, 3.6], 0.55);
    addContactShadow(scene, softShadow, [3.55, 1.25], [4.2, 2.4], 0.42);
    addContactShadow(scene, softShadow, [-3.6, -1.0], [3.2, 3.2], 0.6);
    addContactShadow(scene, softShadow, [3.55, 2.73], [2.1, 1.8], 0.3);
    scene.add(new THREE.HemisphereLight(0xdff0e7, 0x57463a, 1.1));
    const sunlight = new THREE.DirectionalLight(0xffefcf, 3.5);
    sunlight.position.set(-5, 10, 7);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(2048, 2048);
    sunlight.shadow.camera.left = -10;
    sunlight.shadow.camera.right = 10;
    sunlight.shadow.camera.top = 10;
    sunlight.shadow.camera.bottom = -10;
    sunlight.shadow.bias = -0.0004;
    // Normal bias pulls the shadow lookup off the surface, so the new normal
    // maps do not shade themselves into acne.
    sunlight.shadow.normalBias = 0.028;
    sunlight.shadow.radius = 3.5;
    scene.add(sunlight);
    // A cool, shadowless fill from the sea side to keep the shadowed faces
    // from going flat grey.
    const skyFill = new THREE.DirectionalLight(0xbfe3f2, 0.75);
    skyFill.position.set(6, 6, -8);
    scene.add(skyFill);
    const seaLight = new THREE.PointLight(0x64d5ef, 18, 13, 1.7);
    seaLight.position.set(4.1, 2.6, -6.2);
    scene.add(seaLight);
    const treeLight = new THREE.PointLight(0xffd99d, 13, 9, 2);
    treeLight.position.set(-3.4, 5.3, 1.2);
    scene.add(treeLight);
    const pianoLight = new THREE.SpotLight(0xffe4b8, 17, 8, 0.72, 0.72, 1.7);
    pianoLight.position.set(-4.1, 5.6, 3.5);
    pianoLight.target.position.set(-5.3, 1.2, 2.3);
    scene.add(pianoLight, pianoLight.target);
    const studyLight = new THREE.PointLight(0xffd28a, 10, 5.5, 2);
    studyLight.position.set(4.35, 2.95, 0.9);
    scene.add(studyLight);
    // Daylight spilling through the doorway, tied to how far the door swings.
    const doorShaftMaterial = new THREE.MeshBasicMaterial({
        map: surfaces.radialFalloff("rgba(214,242,255,0.5)", "rgba(190,228,246,0.14)", 0.42),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
    });
    const doorShaft = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 6.4), doorShaftMaterial);
    doorShaft.position.set(4.1, 1.9, -4.1);
    doorShaft.rotation.x = -Math.PI / 2.35;
    scene.add(doorShaft);
    let state = "idle";
    let phase = 0;
    let elapsed = 0;
    let queued = null;
    let doorTarget = 0;
    const downAt = new THREE.Vector3();
    let audioContext = null;
    const ensureAudio = () => {
        audioContext ??= new AudioContext();
        if (audioContext.state === "suspended")
            void audioContext.resume();
    };
    const playMelody = () => {
        if (!audioContext)
            return;
        const notes = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23, 440, 587.33, 523.25, 392];
        const now = audioContext.currentTime + 0.04;
        notes.forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = index % 3 === 0 ? "triangle" : "sine";
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.0001, now + index * 0.34);
            gain.gain.exponentialRampToValueAtTime(0.075, now + index * 0.34 + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.34 + 0.52);
            oscillator.connect(gain).connect(audioContext.destination);
            oscillator.start(now + index * 0.34);
            oscillator.stop(now + index * 0.34 + 0.56);
        });
    };
    const transition = (next, message) => {
        state = next;
        phase = 0;
        if (message)
            setStatus(message);
    };
    const startAction = (action) => {
        controls.autoRotate = false;
        if (action === "piano")
            ensureAudio();
        if (state !== "idle") {
            queued = action;
            const queuedMessage = {
                tree: "她会完成当前动作后去爬树",
                door: "她会完成当前动作后再去海边",
                piano: "她会完成当前动作后去弹钢琴",
                desk: "她会完成当前动作后回到书桌学习",
            };
            setStatus(queuedMessage[action]);
            return;
        }
        setActive(action);
        if (action === "tree")
            transition("tree-walk", "女孩正走向那棵树…");
        else if (action === "door")
            transition("door-walk", "女孩听见了门外的海浪…");
        else if (action === "piano")
            transition("piano-walk", "女孩正走向钢琴…");
        else
            transition("desk-walk", "女孩带着好奇心走向书桌…");
    };
    const returnIdle = () => {
        state = "idle";
        phase = 0;
        girl.root.position.copy(HOME);
        girl.root.rotation.set(0, HOME_FACING, 0);
        doorTarget = 0;
        setActive("idle");
        setStatus(IDLE_STATUS);
        const next = queued;
        queued = null;
        if (next)
            window.setTimeout(() => startAction(next), 180);
    };
    const reset = () => {
        queued = null;
        returnIdle();
        resetPose(girl, 1);
    };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerStart = new THREE.Vector2();
    const hitAt = (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        return raycaster.intersectObjects(interactive, false)[0]?.object ?? null;
    };
    const onMove = (event) => {
        const hit = hitAt(event);
        renderer.domElement.style.cursor = hit ? "pointer" : "grab";
        if (state !== "idle")
            return;
        if (hit?.userData.action === "tree")
            setStatus("点击树 · 看女孩爬树做单杠");
        else if (hit?.userData.action === "door")
            setStatus("点击门 · 跟女孩一起去看海");
        else if (hit?.userData.action === "piano")
            setStatus("点击钢琴 · 听女孩弹奏一段旋律");
        else if (hit?.userData.action === "desk")
            setStatus("点击书桌 · 陪女孩阅读与学习");
        else
            setStatus(IDLE_STATUS);
    };
    const onDown = (event) => {
        pointerStart.set(event.clientX, event.clientY);
        renderer.domElement.style.cursor = "grabbing";
    };
    const onUp = (event) => {
        const moved = pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
        const hit = hitAt(event);
        renderer.domElement.style.cursor = hit ? "pointer" : "grab";
        if (moved > 8 || !hit)
            return;
        if (hit.userData.action === "tree")
            startAction("tree");
        if (hit.userData.action === "door")
            startAction("door");
        if (hit.userData.action === "piano")
            startAction("piano");
        if (hit.userData.action === "desk")
            startAction("desk");
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);
    const resize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        if (!width || !height)
            return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    // Timer, not Clock: it hooks the Page Visibility API, so returning to a
    // backgrounded tab does not hand the animation one enormous delta.
    const timer = new THREE.Timer();
    timer.connect(document);
    let frame = 0;
    const render = () => {
        frame = window.requestAnimationFrame(render);
        timer.update();
        const dt = Math.min(timer.getDelta(), 0.05);
        elapsed += dt;
        phase += dt;
        resetPose(girl, 0.12);
        girl.torso.scale.set(1, 1, 1);
        piano.keys.forEach((key) => {
            key.position.y = key.userData.baseY;
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
            girl.root.rotation.y = THREE.MathUtils.lerp(HOME_FACING, -Math.PI / 2, p);
            setWalkPose(girl, elapsed);
            if (phase > 3.1)
                transition("tree-climb", "她正在沿着树干向上爬…");
        }
        else if (state === "tree-climb") {
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
            if (phase > 2.55)
                transition("tree-bar", "抓稳了！她正在树枝上做单杠");
        }
        else if (state === "tree-bar") {
            const angle = Math.sin(phase * 2.095) * 0.33;
            lockHandsToBar(girl, angle);
            const swing = Math.sin(phase * 2.095);
            girl.leftLeg.pivot.rotation.x = swing * 0.36;
            girl.rightLeg.pivot.rotation.x = swing * 0.36;
            girl.leftLeg.lower.rotation.x = 0.2 + Math.max(0, swing) * 0.35;
            girl.rightLeg.lower.rotation.x = 0.2 + Math.max(0, swing) * 0.35;
            girl.torso.rotation.x = -swing * 0.06;
            if (phase > 6.0)
                transition("tree-release", "她开始摆荡蓄力，准备体操下杠…");
        }
        else if (state === "tree-release") {
            const p = ease(phase / 0.86);
            const angle = THREE.MathUtils.lerp(0, RELEASE_ANGLE, p);
            lockHandsToBar(girl, angle);
            girl.leftLeg.pivot.rotation.x = -0.28 * p;
            girl.rightLeg.pivot.rotation.x = -0.28 * p;
            girl.torso.rotation.x = 0.1 * p;
            if (phase > 0.86)
                transition("tree-spin", "松手！她正在空中完成 360° 转体");
        }
        else if (state === "tree-spin") {
            const p = ease(phase / 1.58);
            girl.root.position.lerpVectors(RELEASE_POINT, TREE_LAND, p);
            girl.root.position.y += Math.sin(p * Math.PI) * 2.45;
            girl.root.rotation.set(THREE.MathUtils.lerp(RELEASE_ANGLE, Math.PI * 2, p), Math.sin(p * Math.PI) * 0.08, 0);
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
            if (phase > 1.58)
                transition("tree-land", "稳稳落地！她屈膝缓冲，完成体操收势");
        }
        else if (state === "tree-land") {
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
            if (phase > 1.18)
                transition("tree-return", "漂亮收官！她正走回房间中央");
        }
        else if (state === "tree-return") {
            const p = ease(phase / 2.7);
            girl.root.position.lerpVectors(TREE_LAND, HOME, p);
            girl.root.rotation.y = THREE.MathUtils.lerp(0, HOME_FACING, p);
            setWalkPose(girl, elapsed);
            if (phase > 2.7)
                returnIdle();
        }
        else if (state === "piano-walk") {
            const p = ease(phase / 3.4);
            girl.root.position.lerpVectors(HOME, PIANO_SEAT, p);
            girl.root.rotation.y = THREE.MathUtils.lerp(HOME_FACING, -Math.PI / 2, p);
            setWalkPose(girl, elapsed);
            if (phase > 3.4)
                transition("piano-sit", "她在琴凳上坐好，双手轻轻放上琴键");
        }
        else if (state === "piano-sit") {
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
        }
        else if (state === "piano-play") {
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
            if (Math.floor(phase * 3.1) % 2 === 0)
                piano.keys[partnerIndex].position.y -= 0.025;
            if (phase > 5.1)
                transition("piano-return", "旋律结束了，她轻轻离开琴凳");
        }
        else if (state === "piano-return") {
            const p = ease(phase / 3.25);
            girl.root.position.lerpVectors(PIANO_SEAT, HOME, p);
            girl.root.rotation.y = THREE.MathUtils.lerp(-Math.PI / 2, HOME_FACING, p);
            setWalkPose(girl, elapsed, ease(Math.max(0, (p - 0.12) / 0.88)));
            if (p < 0.18) {
                const seated = 1 - ease(p / 0.18);
                girl.leftLeg.pivot.rotation.x = -Math.PI / 2 * seated;
                girl.rightLeg.pivot.rotation.x = -Math.PI / 2 * seated;
                girl.leftLeg.lower.rotation.x = Math.PI / 2 * seated;
                girl.rightLeg.lower.rotation.x = Math.PI / 2 * seated;
            }
            if (phase > 3.25)
                returnIdle();
        }
        else if (state === "desk-walk") {
            const p = ease(phase / 3.25);
            girl.root.position.lerpVectors(HOME, DESK_SEAT, p);
            girl.root.rotation.y = THREE.MathUtils.lerp(HOME_FACING, Math.PI, Math.min(1, p / 0.3));
            setWalkPose(girl, elapsed);
            if (phase > 3.25)
                transition("desk-sit", "她拉开椅子，在书桌前坐下");
        }
        else if (state === "desk-sit") {
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
            if (phase > 1.3)
                transition("desk-study", "台灯亮着，她正在认真阅读和做笔记…");
        }
        else if (state === "desk-study") {
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
            if (phase > 8.2)
                transition("desk-return", "学习告一段落，她合上笔记准备休息");
        }
        else if (state === "desk-return") {
            const p = ease(phase / 3.0);
            girl.root.position.lerpVectors(DESK_SEAT, HOME, p);
            girl.root.rotation.y = THREE.MathUtils.lerp(Math.PI, HOME_FACING, ease(Math.max(0, (p - 0.5) / 0.5)));
            setWalkPose(girl, elapsed, ease(Math.max(0, (p - 0.12) / 0.88)));
            if (p < 0.18) {
                const seated = 1 - ease(p / 0.18);
                girl.leftLeg.pivot.rotation.x = -Math.PI / 2 * seated;
                girl.rightLeg.pivot.rotation.x = -Math.PI / 2 * seated;
                girl.leftLeg.lower.rotation.x = Math.PI / 2 * seated;
                girl.rightLeg.lower.rotation.x = Math.PI / 2 * seated;
            }
            if (phase > 3.0)
                returnIdle();
        }
        else if (state === "door-walk") {
            const p = ease(phase / 4.1);
            girl.root.position.lerpVectors(HOME, DOOR_FRONT, p);
            girl.root.rotation.y = THREE.MathUtils.lerp(HOME_FACING, Math.PI, Math.min(1, p / 0.3));
            setWalkPose(girl, elapsed);
            if (phase > 4.1)
                transition("door-open", "她伸手推开了通往大海的门…");
        }
        else if (state === "door-open") {
            doorTarget = -Math.PI * 0.52;
            girl.rightArm.pivot.rotation.x = -0.76;
            girl.rightArm.lower.rotation.x = -0.62;
            girl.rightArm.pivot.rotation.z = -0.72;
            girl.head.rotation.y = -0.22;
            if (phase > 1.65)
                transition("door-exit", "海风吹进来了，她正跑向海边");
        }
        else if (state === "door-exit") {
            const p = ease(phase / 2.5);
            girl.root.position.lerpVectors(DOOR_FRONT, new THREE.Vector3(3.6, 0, -6.8), p);
            girl.root.rotation.y = Math.PI;
            setWalkPose(girl, elapsed, 1.35);
            if (phase > 2.5) {
                downAt.copy(girl.root.position);
                transition("door-dive", "扑通！她跳进了蓝色的大海");
            }
        }
        else if (state === "door-dive") {
            const p = ease(phase / 1.6);
            girl.root.position.lerpVectors(downAt, new THREE.Vector3(3.25, 0.38, -8.2), p);
            girl.root.position.y += Math.sin(p * Math.PI) * 1.15;
            girl.root.rotation.x = -p * Math.PI / 2;
            girl.leftArm.pivot.rotation.x = -1.5 * p;
            girl.rightArm.pivot.rotation.x = -1.5 * p;
            if (phase > 1.6)
                transition("swimming", "她正在门外的大海里游泳 · 点击重置可回到房间");
        }
        else if (state === "swimming") {
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
        const openness = THREE.MathUtils.clamp(Math.abs(doorHinge.rotation.y) / (Math.PI * 0.52), 0, 1);
        doorShaftMaterial.opacity = openness * 0.34;
        studyDesk.bulbGlow.material.opacity = 0.5 + Math.sin(elapsed * 2.6) * 0.06;
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
        ocean.water.geometry.computeVertexNormals();
        // The mesh carries the slow swell; scrolling the normal map adds the
        // fine chop that makes the surface read as water rather than as glass.
        ocean.waterNormal.offset.set(elapsed * 0.013, elapsed * 0.027);
        ocean.waves.forEach((wave, index) => {
            wave.position.x += Math.sin(elapsed * 0.7 + index) * 0.0008;
            wave.material.opacity = 0.45 + Math.sin(elapsed * 1.1 + index) * 0.16;
        });
        dust.rotation.y += dt * 0.018;
        controls.update();
        renderer.render(scene, camera);
    };
    render();
    const dispose = () => {
        window.cancelAnimationFrame(frame);
        timer.dispose();
        observer.disconnect();
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointerup", onUp);
        controls.dispose();
        if (audioContext && audioContext.state !== "closed")
            void audioContext.close();
        const spent = new Set();
        const releaseMaterial = (material) => {
            for (const value of Object.values(material)) {
                if (value instanceof THREE.Texture && !spent.has(value)) {
                    spent.add(value);
                    value.dispose();
                }
            }
            material.dispose();
        };
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
                object.geometry.dispose();
            }
            if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Sprite) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(releaseMaterial);
            }
        });
        environment.dispose();
        if (scene.background instanceof THREE.Texture)
            scene.background.dispose();
        renderer.dispose();
        mount.removeChild(renderer.domElement);
    };
    return { act: startAction, reset, dispose };
}
