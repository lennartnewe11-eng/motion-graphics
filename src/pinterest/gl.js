// 3D layer (three.js on a WebGL canvas, composited into the 2D frame).
// The camera is set up so the z = 0 plane maps 1:1 onto the 1920×1080 frame: world units are pixels,
// x right, y DOWN, so 2D and 3D share one coordinate system. The camera sits on the -z side, so
// "towards the viewer" is NEGATIVE z (use z = -depth).
// Materials are matcaps baked once from a physically based clear-coat sphere — the look of PBR at the
// cost of one texture lookup, which keeps software-rendered WebGL fast enough for 4-sample motion blur.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { noise3 } from '../engine/core.js';

export { THREE };
export const W = 1920, H = 1080;
export const FOV = 30;
export const DIST = (H / 2) / Math.tan((FOV / 2) * Math.PI / 180);

let renderer, glCanvas, scene, camera, bakeR;
const matcaps = new Map();
let envTex = null;

export const COLORS = {
  red: '#E60023', redDeep: '#B5001B', pink: '#FFB3C7', blush: '#FF8FA8', peach: '#FFC59E', butter: '#FFE08A',
  mint: '#A8E6CF', sky: '#9CCBFF', lilac: '#C9B6FF', white: '#F4F1EE', ink: '#2B2B2B', wood: '#E9C9A0',
  lead: '#3A3A3A', orange: '#FF8A3D', green: '#3DBE7A', blue: '#3E7BFA', yellow: '#FFC93C',
};

export function initGL() {
  if (renderer) return;
  glCanvas = document.createElement('canvas');
  glCanvas.width = W; glCanvas.height = H;
  renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NoToneMapping;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(FOV, W / H, 10, 20000);
  resetCamera();
  // matcap baker
  const bc = document.createElement('canvas');
  bc.width = bc.height = 256;
  bakeR = new THREE.WebGLRenderer({ canvas: bc, antialias: true, alpha: true, preserveDrawingBuffer: true });
  bakeR.setSize(256, 256, false);
  bakeR.toneMapping = THREE.NeutralToneMapping;
  bakeR.toneMappingExposure = 1.0;
}

// Camera looking along +z at the frame; screen (x, y) on z=0 ↔ world (x, y, 0) with y down.
export function resetCamera() {
  camera.position.set(W / 2, H / 2, -DIST);
  camera.up.set(0, -1, 0);
  camera.lookAt(W / 2, H / 2, 0);
  camera.fov = FOV;
  camera.updateProjectionMatrix();
}
export const getCamera = () => camera;
export const getScene = () => scene;

// Project a world point to screen pixels.
const _v = new THREE.Vector3();
export function project(x, y, z) {
  _v.set(x, y, z).project(camera);
  return [(_v.x * 0.5 + 0.5) * W, (-_v.y * 0.5 + 0.5) * H, _v.z];
}

// ---------------------------------------------------------- materials ---
export function matcap(name, { rough = 0.28, clear = 1, metal = 0, sheen = 0 } = {}) {
  const key = name + '|' + rough + '|' + clear + '|' + metal;
  if (matcaps.has(key)) return matcaps.get(key);
  const col = COLORS[name] || name;
  const sc = new THREE.Scene();
  if (!envTex) { const pm = new THREE.PMREMGenerator(bakeR); envTex = pm.fromScene(new RoomEnvironment(), 0.035).texture; pm.dispose(); }
  sc.environment = envTex;
  // keep one shader variant for every bake (clear-coat always on): each new variant costs seconds to compile
  const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(col), roughness: rough, metalness: metal, clearcoat: Math.max(0.002, clear), clearcoatRoughness: 0.08 });
  const sp = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), m);
  sc.add(sp);
  // a soft key light from the upper left to give the matcap a direction
  const key2 = new THREE.DirectionalLight(0xffffff, 1.1); key2.position.set(-2, 2.2, 3); sc.add(key2);
  const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  oc.position.z = 5;
  bakeR.render(sc, oc);
  const copy = document.createElement('canvas');
  copy.width = copy.height = 256;
  copy.getContext('2d').drawImage(bakeR.domElement, 0, 0);
  const tex = new THREE.CanvasTexture(copy);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshMatcapMaterial({ matcap: tex });
  mat.toneMapped = false;
  matcaps.set(key, mat);
  sp.geometry.dispose(); m.dispose();
  return mat;
}

// --------------------------------------------------------- geometries ---
function heartShape(s = 1) {
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.35 * s);
  sh.bezierCurveTo(0.1 * s, -0.55 * s, 0.6 * s, -0.75 * s, 0.6 * s, -0.25 * s);
  sh.bezierCurveTo(0.6 * s, 0.1 * s, 0.25 * s, 0.35 * s, 0, 0.62 * s);
  sh.bezierCurveTo(-0.25 * s, 0.35 * s, -0.6 * s, 0.1 * s, -0.6 * s, -0.25 * s);
  sh.bezierCurveTo(-0.6 * s, -0.75 * s, -0.1 * s, -0.55 * s, 0, -0.35 * s);
  return sh;
}
function starShape(n = 5, r0 = 1, r1 = 0.48) {
  const sh = new THREE.Shape();
  for (let i = 0; i <= n * 2; i++) {
    const a = -Math.PI / 2 + (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r1 : r0;
    i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return sh;
}
const geoCache = new Map();
export function geo(kind) {
  if (geoCache.has(kind)) return geoCache.get(kind);
  let g;
  switch (kind) {
    case 'sphere': g = new THREE.SphereGeometry(1, 64, 40); break;
    case 'torus': g = new THREE.TorusGeometry(0.72, 0.3, 40, 96); break;
    case 'ring': g = new THREE.TorusGeometry(0.82, 0.13, 24, 96); break;
    case 'box': g = new RoundedBoxGeometry(1.5, 1.5, 1.5, 6, 0.32); break;
    case 'capsule': g = new THREE.CapsuleGeometry(0.42, 1.1, 16, 40); break;
    case 'cone': g = new THREE.ConeGeometry(0.85, 1.6, 64, 1); break;
    case 'knot': g = new THREE.TorusKnotGeometry(0.62, 0.22, 220, 32, 2, 3); break;
    case 'heart': g = new THREE.ExtrudeGeometry(heartShape(1.25), { depth: 0.38, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.18, bevelSegments: 10, curveSegments: 40 }); g.center(); g.rotateZ(Math.PI); break;
    case 'star': g = new THREE.ExtrudeGeometry(starShape(5, 1.05, 0.52), { depth: 0.3, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.14, bevelSegments: 8 }); g.center(); break;
    case 'blob': {
      g = new THREE.IcosahedronGeometry(1, 20);
      g.deleteAttribute('normal'); g.deleteAttribute('uv');
      g = mergeVertices(g);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const k = 1 + 0.2 * noise3(x * 0.9 + 3, y * 0.9, z * 0.9);
        p.setXYZ(i, x * k, y * k, z * k);
      }
      g.computeVertexNormals();
      break;
    }
    case 'squiggle': {
      const pts = [];
      for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push(new THREE.Vector3((u - 0.5) * 3, Math.sin(u * Math.PI * 3) * 0.45, Math.cos(u * Math.PI * 3) * 0.25)); }
      g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.2, 24, false);
      break;
    }
    case 'pill': g = new THREE.CapsuleGeometry(0.5, 0.8, 16, 40); g.rotateZ(Math.PI / 2); break;
    default: throw new Error('geo ' + kind);
  }
  geoCache.set(kind, g);
  return g;
}

// Composite objects ------------------------------------------------------
// Colored pencil: hexagonal body, sharpened wood cone, pigment lead. Long axis = +y (tip at +y).
export function makePencil(color, len = 6) {
  const grp = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, len, 6, 1), matcap(color, { rough: 0.35, clear: 0.6 }));
  grp.add(body);
  const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.5, 1.3, 6, 1), matcap('wood', { rough: 0.7, clear: 0 }));
  wood.position.y = len / 2 + 0.65;
  grp.add(wood);
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.46, 24), matcap(color, { rough: 0.5, clear: 0.2 }));
  lead.position.y = len / 2 + 1.3 + 0.03 - 0.2;
  grp.add(lead);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 6), matcap('white', { rough: 0.3 }));
  cap.position.y = -len / 2 - 0.03;
  grp.add(cap);
  grp.userData.tip = len / 2 + 1.36; // distance from centre to the point
  return grp;
}

// Push pin (the "Pin"): domed head, waist, flat collar, steel needle. Needle points to -y.
export function makePushpin(color = 'red') {
  const grp = new THREE.Group();
  const prof = [];
  const P = (x, y) => prof.push(new THREE.Vector2(x, y));
  P(0.0, 1.55); P(0.38, 1.52); P(0.62, 1.42); P(0.72, 1.25); P(0.7, 1.08); P(0.5, 0.98); P(0.36, 0.86);
  P(0.33, 0.5); P(0.4, 0.34); P(0.78, 0.26); P(0.86, 0.16); P(0.82, 0.06); P(0.12, 0.02); P(0.0, 0.02);
  const head = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), matcap(color, { rough: 0.22 }));
  grp.add(head);
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.012, 1.4, 16), matcap('#C9CED6', { rough: 0.15, metal: 1, clear: 0 }));
  needle.position.y = -0.68;
  grp.add(needle);
  return grp;
}

export function mesh(kind, color, opts) {
  if (kind === 'pencil') return makePencil(color);
  if (kind === 'pushpin') return makePushpin(color);
  return new THREE.Mesh(geo(kind), matcap(color, opts));
}

// Soft contact shadow sprite (lies on z = 0, i.e. the paper / the wall).
let shadowTex = null;
export function shadowMesh() {
  if (!shadowTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d', { willReadFrequently: true });
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(60,20,30,0.55)');
    gr.addColorStop(0.45, 'rgba(60,20,30,0.25)');
    gr.addColorStop(1, 'rgba(60,20,30,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    shadowTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  m.renderOrder = -1;
  return m;
}

// Rounded-rect plane for pin cards (UVs span the card). Origin at the card centre.
const cardGeoCache = new Map();
export function cardGeo(w, h, r) {
  const key = `${w}x${h}x${r}`;
  if (cardGeoCache.has(key)) return cardGeoCache.get(key);
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 10);
  const uv = g.attributes.uv, p = g.attributes.position;
  // y-down world: texture row 0 must sit at the top (smallest y)
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x) / w, 1 - (p.getY(i) - y) / h);
  g.computeVertexNormals();
  cardGeoCache.set(key, g);
  return g;
}
export function textureFrom(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
export function cardMesh(tex, w, h, r = 18) {
  const m = new THREE.Mesh(cardGeo(w, h, r), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide }));
  return m;
}

// ----------------------------------------------------------- render ---
// Draw the current scene into ctx (only if something is visible).
export function renderInto(ctx, { alpha = 1, filter = null } = {}) {
  let any = false;
  scene.traverseVisible((o) => { if (o.isMesh) any = true; });
  if (!any) return;
  renderer.render(scene, camera);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = alpha;
  if (filter) ctx.filter = filter;
  ctx.drawImage(glCanvas, 0, 0);
  ctx.restore();
}
// Render only the given top-level objects (others hidden for this pass, then restored).
export function renderOnly(ctx, objs, opts) {
  const prev = scene.children.map((o) => o.visible);
  scene.children.forEach((o) => { if (!objs.includes(o)) o.visible = false; });
  renderInto(ctx, opts);
  scene.children.forEach((o, i) => (o.visible = prev[i]));
}
export function clearScene() {
  for (const c of [...scene.children]) scene.remove(c);
}
