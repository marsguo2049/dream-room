// Generated from app/house.ts by scripts/build-pages.sh. Do not edit by hand.
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
const HOUSE_HALF_X = 6.55;
const HOUSE_HALF_Z = 5.55;
const GROUND_CEILING = 5.72;
const UPPER_CEILING = 9.9;
const RIDGE_Y = 13.72;
function roundedBox(size, material, radius = 0.06) {
    const safe = Math.min(radius, Math.min(...size) * 0.42);
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, safe), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}
function addBox(parent, size, position, material, radius = 0.05) {
    const mesh = roundedBox(size, material, radius);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
}
// Every blob in the garden is the same unit sphere at a different scale.
// Ninety-odd separate SphereGeometries were ninety-odd buffer uploads for one
// shape; the radius is a scale, not a new mesh.
const UNIT_SPHERE = new THREE.SphereGeometry(1, 12, 8);
function addSphere(parent, radius, position, material, scale = [1, 1, 1]) {
    const mesh = new THREE.Mesh(UNIT_SPHERE, material);
    mesh.position.set(...position);
    mesh.scale.set(radius * scale[0], radius * scale[1], radius * scale[2]);
    // No shadow. These are the flowers and the window-box foliage — ninety small
    // blobs sitting against a wall or the lawn, whose shadows are a few pixels
    // each and whose absence from the shadow pass is ninety draw calls a frame.
    parent.add(mesh);
    return mesh;
}
function addBeamBetween(parent, from, to, z, material, thickness = 0.18) {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const beam = addBox(parent, [Math.hypot(dx, dy), thickness, 0.16], [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z], material, 0.035);
    beam.rotation.z = Math.atan2(dy, dx);
    return beam;
}
function buildWindow(parent, palette, position, size, rotationY = 0, flowers = false) {
    const window = new THREE.Group();
    window.position.set(...position);
    window.rotation.y = rotationY;
    parent.add(window);
    const [width, height] = size;
    // Generous fillets: a moulded ceramic window has no sharp arris anywhere,
    // and the soft edge is most of what separates it from a printed box.
    addBox(window, [width + 0.34, height + 0.34, 0.13], [0, 0, 0], palette.houseTrim, 0.16);
    addBox(window, [width, height, 0.12], [0, 0, 0.08], palette.windowGlass, 0.07);
    addBox(window, [0.1, height, 0.09], [0, 0, 0.16], palette.houseTrim, 0.04);
    addBox(window, [width, 0.1, 0.09], [0, 0, 0.16], palette.houseTrim, 0.04);
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
/**
 * The embossed fieldstone foot the whole ornament stands on.
 *
 * This was a course of individually laid rubble stones — thirty-odd little
 * boxes with random rotations. That is how a mason works, and it is exactly
 * what a moulded ceramic piece never looks like: the base of a glazed cottage
 * comes out of the same mould as the walls, so it is one continuous band
 * carrying a relief texture. One skirt, four sides, and a capping bead,
 * instead of thirty separate stone meshes.
 */
function buildFoot(parent, palette) {
    const height = 1.82;
    const out = 0.22;
    const front = HOUSE_HALF_Z + out;
    const span = HOUSE_HALF_X * 2 + out * 2;
    // The front breaks either side of the doorway, so the band steps around the
    // threshold rather than burying the bottom of the door.
    const cheek = (HOUSE_HALF_X + out - 1.42) / 2 + 1.42;
    const cheekWidth = HOUSE_HALF_X + out - 1.42;
    const spans = [
        [[cheekWidth, height, 0.34], [-cheek, height / 2, front]],
        [[cheekWidth, height, 0.34], [cheek, height / 2, front]],
        [[span, height, 0.34], [0, height / 2, -front]],
        [[0.34, height, HOUSE_HALF_Z * 2 + out * 2], [HOUSE_HALF_X + out, height / 2, 0]],
        [[0.34, height, HOUSE_HALF_Z * 2 + out * 2], [-HOUSE_HALF_X - out, height / 2, 0]],
    ];
    for (const [size, position] of spans) {
        addBox(parent, size, position, palette.houseStone, 0.14);
    }
    // The bead that caps the bisque and starts the glaze — the visible seam
    // between the two firings.
    addBox(parent, [HOUSE_HALF_X * 2 + out * 2 + 0.14, 0.17, HOUSE_HALF_Z * 2 + out * 2 + 0.14], [0, height, 0], palette.houseTrim, 0.075);
}
function buildFlowers(parent, palette) {
    const clusters = [
        [-5.8, 0.22, 6.0],
        [-5.2, 0.2, 6.3],
        [5.55, 0.2, 6.15],
        [5.95, 0.2, 5.75],
    ];
    for (const [cx, cy, cz] of clusters) {
        for (let i = 0; i < 7; i += 1) {
            const angle = i * 2.4;
            const radius = 0.2 + (i % 3) * 0.12;
            addSphere(parent, 0.28, [cx + Math.cos(angle) * radius, cy + (i % 2) * 0.18, cz + Math.sin(angle) * radius], palette.flowerLeaf, [1, 0.72, 0.82]);
            if (i % 2 === 0) {
                addSphere(parent, 0.1, [cx + Math.cos(angle) * radius, cy + 0.34 + (i % 3) * 0.07, cz + Math.sin(angle) * radius], i % 4 ? palette.flowerCream : palette.flowerRed);
            }
        }
    }
}
function buildRoof(parent, palette) {
    const roof = new THREE.Group();
    parent.add(roof);
    const rise = RIDGE_Y - UPPER_CEILING;
    const run = HOUSE_HALF_X + 0.45;
    const length = Math.hypot(run, rise);
    const angle = Math.atan2(rise, run);
    // Two thick slabs and a bead at the ridge. The eight tile-course seams per
    // side are gone: a glazed roof is one poured surface, and the seams were
    // sixteen extra shadow casters buying a texture the glaze already gives.
    for (const side of [-1, 1]) {
        const plane = addBox(roof, [length, 0.5, HOUSE_HALF_Z * 2 + 1.0], [side * run / 2, UPPER_CEILING + rise / 2, 0], palette.roofTile, 0.24);
        plane.rotation.z = -side * angle;
        // A rolled lip at the eaves, sitting just past the end of the slab, the
        // way a mould leaves a thickened edge where the glaze runs off.
        const eaves = addBox(roof, [0.34, 0.62, HOUSE_HALF_Z * 2 + 1.14], [side * (run + 0.03), UPPER_CEILING - 0.05, 0], palette.roofEdge, 0.17);
        eaves.rotation.z = -side * angle;
    }
    // The ridge bead, proud of both slopes so the two halves of the roof read as
    // one capped piece rather than as two planes leaning together.
    addBox(roof, [0.62, 0.52, HOUSE_HALF_Z * 2 + 1.26], [0, RIDGE_Y + 0.2, 0], palette.roofEdge, 0.25);
    const chimney = new THREE.Group();
    chimney.position.set(-4.35, 11.9, -1.55);
    roof.add(chimney);
    addBox(chimney, [1.25, 3.2, 1.18], [0, 0, 0], palette.houseStone, 0.28);
    addBox(chimney, [1.52, 0.34, 1.46], [0, 1.63, 0], palette.roofEdge, 0.15);
    return roof;
}
export function buildDreamHouse(scene, palette) {
    const house = new THREE.Group();
    scene.add(house);
    const garden = new THREE.Group();
    house.add(garden);
    // An oval, not a rectangle. The lawn was a 26x17 plane whose corners ran
    // straight off into the backdrop and gave the whole thing away as a flat
    // card; an ornament sits on a base with a shaped edge, and that edge is most
    // of what tells you the piece is an object rather than a place.
    const lawn = new THREE.Mesh(new THREE.CircleGeometry(1, 56), palette.garden);
    lawn.rotation.x = -Math.PI / 2;
    lawn.scale.set(14.5, 10.6, 1);
    lawn.position.set(0, -0.08, 6.6);
    lawn.receiveShadow = true;
    garden.add(lawn);
    // The rolled rim of the base, thrown slightly proud of the glaze.
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.022, 6, 72), palette.houseTrim);
    rim.rotation.x = -Math.PI / 2;
    rim.scale.set(14.5, 10.6, 1);
    rim.position.set(0, -0.09, 6.6);
    garden.add(rim);
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
    // Wall slabs thick enough to carry a real fillet. Slip-cast earthenware has
    // a wall you can see the thickness of, and the soft arris along every corner
    // is the single strongest ceramic cue in the whole model.
    addBox(lowerExterior, [HOUSE_HALF_X * 2, GROUND_CEILING, 0.38], [0, GROUND_CEILING / 2, HOUSE_HALF_Z - 0.09], palette.housePlaster, 0.15);
    addBox(lowerExterior, [0.38, GROUND_CEILING, HOUSE_HALF_Z * 2], [HOUSE_HALF_X - 0.09, GROUND_CEILING / 2, 0], palette.housePlaster, 0.15);
    addBox(lowerExterior, [0.3, GROUND_CEILING, HOUSE_HALF_Z * 2], [-HOUSE_HALF_X - 0.05, GROUND_CEILING / 2, 0], palette.housePlaster, 0.12);
    buildFoot(lowerExterior, palette);
    // Framing, reduced to two banding lines and a light half-timber. Under a
    // glaze these read as brushwork on the pot, which is what they should be.
    addBox(lowerExterior, [HOUSE_HALF_X * 2 + 0.3, 0.2, 0.2], [0, GROUND_CEILING - 0.1, HOUSE_HALF_Z + 0.1], palette.houseTimber, 0.09);
    for (const x of [-5.45, -2.15, 2.15, 5.45]) {
        addBox(lowerExterior, [0.16, GROUND_CEILING - 1.72, 0.16], [x, 3.7, HOUSE_HALF_Z + 0.1], palette.houseTimber, 0.07);
    }
    buildWindow(lowerExterior, palette, [-3.55, 3.35, HOUSE_HALF_Z + 0.17], [2.15, 1.95], 0, true);
    buildWindow(lowerExterior, palette, [3.55, 3.35, HOUSE_HALF_Z + 0.17], [2.15, 1.95], 0, true);
    buildWindow(lowerExterior, palette, [HOUSE_HALF_X + 0.17, 3.2, 1.8], [2.1, 1.9], Math.PI / 2, false);
    buildWindow(lowerExterior, palette, [HOUSE_HALF_X + 0.17, 3.2, -2.15], [1.7, 1.9], Math.PI / 2, false);
    addBox(lowerExterior, [2.25, 3.25, 0.23], [0, 1.68, HOUSE_HALF_Z + 0.2], palette.houseDoor, 0.14);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.13, 8, 30, Math.PI), palette.houseTrim);
    arch.position.set(0, 3.14, HOUSE_HALF_Z + 0.35);
    arch.castShadow = true;
    lowerExterior.add(arch);
    addBox(lowerExterior, [0.12, 3.08, 0.12], [-1.18, 1.62, HOUSE_HALF_Z + 0.34], palette.houseTrim, 0.03);
    addBox(lowerExterior, [0.12, 3.08, 0.12], [1.18, 1.62, HOUSE_HALF_Z + 0.34], palette.houseTrim, 0.03);
    // The original cottage's small red heart is its most recognisable hand-
    // painted detail, kept as one flat glazed mesh against the brown door.
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -0.24);
    heartShape.bezierCurveTo(-0.48, 0.02, -0.44, 0.42, 0, 0.2);
    heartShape.bezierCurveTo(0.44, 0.42, 0.48, 0.02, 0, -0.24);
    const heart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape, 8), palette.flowerRed);
    heart.position.set(0, 1.72, HOUSE_HALF_Z + 0.35);
    heart.scale.setScalar(0.62);
    heart.castShadow = true;
    lowerExterior.add(heart);
    addSphere(lowerExterior, 0.11, [0.65, 1.64, HOUSE_HALF_Z + 0.4], palette.brass, [1, 1, 0.58]);
    const upperBackLeft = new THREE.Group();
    const upperCutaway = new THREE.Group();
    house.add(upperBackLeft, upperCutaway);
    const upperHeight = UPPER_CEILING - GROUND_CEILING;
    addBox(upperCutaway, [HOUSE_HALF_X * 2, upperHeight, 0.38], [0, GROUND_CEILING + upperHeight / 2, HOUSE_HALF_Z - 0.09], palette.housePlasterLight, 0.15);
    addBox(upperCutaway, [0.38, upperHeight, HOUSE_HALF_Z * 2], [HOUSE_HALF_X - 0.09, GROUND_CEILING + upperHeight / 2, 0], palette.housePlasterLight, 0.15);
    addBox(upperBackLeft, [0.34, upperHeight, HOUSE_HALF_Z * 2], [-HOUSE_HALF_X + 0.07, GROUND_CEILING + upperHeight / 2, 0], palette.housePlasterLight, 0.14);
    addBox(upperBackLeft, [HOUSE_HALF_X * 2, upperHeight, 0.34], [0, GROUND_CEILING + upperHeight / 2, -HOUSE_HALF_Z + 0.07], palette.housePlasterLight, 0.14);
    addBox(upperBackLeft, [0.08, upperHeight - 0.16, HOUSE_HALF_Z * 2 - 0.26], [-HOUSE_HALF_X + 0.09, GROUND_CEILING + upperHeight / 2, 0], palette.interiorWall, 0.018);
    addBox(upperBackLeft, [HOUSE_HALF_X * 2 - 0.26, upperHeight - 0.16, 0.08], [0, GROUND_CEILING + upperHeight / 2, -HOUSE_HALF_Z + 0.09], palette.interiorWall, 0.018);
    const secondFloor = addBox(upperBackLeft, [HOUSE_HALF_X * 2 - 0.25, 0.25, HOUSE_HALF_Z * 2 - 0.25], [0, GROUND_CEILING, 0], palette.floor, 0.035);
    secondFloor.receiveShadow = true;
    addBox(upperCutaway, [HOUSE_HALF_X * 2 + 0.3, 0.22, 0.2], [0, GROUND_CEILING + 0.09, HOUSE_HALF_Z + 0.1], palette.houseTimber, 0.09);
    addBox(upperCutaway, [HOUSE_HALF_X * 2 + 0.3, 0.2, 0.2], [0, UPPER_CEILING - 0.12, HOUSE_HALF_Z + 0.1], palette.houseTimber, 0.09);
    for (const x of [-5.45, -2.15, 2.15, 5.45]) {
        addBox(upperCutaway, [0.16, upperHeight - 0.42, 0.16], [x, GROUND_CEILING + upperHeight / 2, HOUSE_HALF_Z + 0.1], palette.houseTimber, 0.07);
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
    // Extruded, not a flat triangle: the gable needs the same wall thickness and
    // the same softened edge as everything else, or it reads as card stock
    // wedged under the roof.
    const gableGeometry = new THREE.ExtrudeGeometry(gableShape, {
        depth: 0.3,
        bevelEnabled: true,
        bevelSize: 0.07,
        bevelThickness: 0.07,
        bevelSegments: 2,
        curveSegments: 1,
    });
    // ExtrudeGeometry lays out UVs in world units, so a shape thirteen units
    // wide tiles the glaze thirteen times and the gable comes out speckled like
    // granite. Rescale the UVs to the shape's own bounds — one glaze pass over
    // the triangle, the same as every wall panel gets.
    gableGeometry.computeBoundingBox();
    const bounds = gableGeometry.boundingBox;
    const uv = gableGeometry.attributes.uv;
    const spanX = bounds.max.x - bounds.min.x;
    const spanY = bounds.max.y - bounds.min.y;
    for (let i = 0; i < uv.count; i += 1) {
        uv.setXY(i, (uv.getX(i) - bounds.min.x) / spanX, (uv.getY(i) - bounds.min.y) / spanY);
    }
    uv.needsUpdate = true;
    const frontTriangle = new THREE.Mesh(gableGeometry, palette.housePlasterLight);
    frontTriangle.position.z = HOUSE_HALF_Z - 0.24;
    frontTriangle.castShadow = true;
    frontTriangle.receiveShadow = true;
    frontGable.add(frontTriangle);
    const backTriangle = frontTriangle.clone();
    // Turned to face the other way, so the extrusion runs back into the house
    // rather than out over the sea.
    backTriangle.position.z = -HOUSE_HALF_Z + 0.24;
    backTriangle.rotation.y = Math.PI;
    backGable.add(backTriangle);
    addBeamBetween(frontGable, [-HOUSE_HALF_X, UPPER_CEILING + 0.08], [0, RIDGE_Y], HOUSE_HALF_Z + 0.14, palette.houseTimber, 0.2);
    addBeamBetween(frontGable, [0, RIDGE_Y], [HOUSE_HALF_X, UPPER_CEILING + 0.08], HOUSE_HALF_Z + 0.14, palette.houseTimber, 0.2);
    addBox(frontGable, [0.2, 3.45, 0.2], [0, 11.55, HOUSE_HALF_Z + 0.14], palette.houseTimber, 0.04);
    buildWindow(frontGable, palette, [0, 11.2, HOUSE_HALF_Z + 0.2], [1.45, 1.35], 0, true);
    const roof = buildRoof(house, palette);
    const setView = (view) => {
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
