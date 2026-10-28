import {
  preparePresentationArt,
  getCeremonyHead,
  auraAtlas,
  AURA_IDS,
  vfxAtlas,
  ceremonyBackdrop,
} from "./presentation-art.js?v=auras-47";
// Loaded only for the ceremony. Local Three.js (MIT), no CDN or game physics.
import * as T from "./assets/vendor/three.module.min.js";
import { COSMETIC_CATALOG } from "./cosmetic-catalog.js?v=auras-47";
import { extraCosmeticImage } from "./cosmetics.js?v=podium-35";
const HEAD_IDS = [
  "none",
  "cap",
  "beanie",
  "chef",
  "crown",
  "burger",
  "pirate",
  "halo",
  "tender",
  "hat_croissant",
  "hat_pizza",
  "hat_pancakes",
  "hat_strawberry",
  "hat_mushroom",
  "hat_sushi",
  "hat_egg",
  "hat_icecream",
  "hat_popcorn",
  "hat_waffle",
  "hat_teacup",
  "hat_cream",
  "hat_pastry",
  "hat_lemon",
  "hat_teapot",
];
const ease = (t) => {
  t = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 3);
};
export async function createCeremony3D(
  root,
  actors,
  renderAvatar,
  isCurrent = () => true,
) {
  const canvas = document.createElement("canvas");
  canvas.className = "ceremony-webgl";
  canvas.setAttribute("aria-label", "Cérémonie du buffet en 3D");
  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  const scene = new T.Scene();
  scene.background = new T.Color("#1b1021");
  scene.fog = new T.Fog("#1b1021", 17, 31);
  const camera = new T.PerspectiveCamera(37, 1, 0.1, 70);
  camera.position.set(0, 5.8, 11.8);
  camera.lookAt(0, 2.6, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const resources = new Set(),
    materials = new Map();
  function material(color, metalness = 0, roughness = 0.6) {
    const key = color + ":" + metalness + ":" + roughness;
    if (!materials.has(key)) {
      const m = new T.MeshStandardMaterial({ color, metalness, roughness });
      materials.set(key, m);
      resources.add(m);
    }
    return materials.get(key);
  }
  function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
    resources.add(geo);
    const m = new T.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function ball(parent, x, y, z, sx, sy, sz, color) {
    const m = mesh(
      new T.SphereGeometry(1, 24, 16),
      typeof color === "string" ? material(color) : color,
      parent,
      x,
      y,
      z,
    );
    m.scale.set(sx, sy, sz);
    return m;
  }
  function box(parent, x, y, z, w, h, d, color) {
    return mesh(new T.BoxGeometry(w, h, d), material(color), parent, x, y, z);
  }
  scene.add(new T.HemisphereLight("#ffe9c5", "#241329", 1.8));
  const key = new T.DirectionalLight("#ffdb9b", 2.8);
  key.position.set(-4, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -8;
  scene.add(key);
  const rim = new T.DirectionalLight("#9dbfff", 2.2);
  rim.position.set(5, 6, -4);
  scene.add(rim);
  box(scene, 0, -0.28, 0, 23, 0.5, 14, "#3b2130");
  // Inlaid stage floor and warm brass edge, actual geometry receiving shadows.
  mesh(
    new T.CylinderGeometry(10, 10.3, 0.2, 64),
    material("#59382b", 0.15),
    scene,
    0,
    -0.04,
    0,
  );
  mesh(
    new T.TorusGeometry(9.7, 0.045, 8, 80),
    material("#edbd65", 0.8),
    scene,
    0,
    0.08,
    0,
  ).rotation.x = Math.PI / 2;
  box(scene, 0, 4.2, -4.7, 22, 9, 0.35, "#321a2b");
  for (let x of [-7.5, 7.5]) {
    box(scene, x, 3, -2.4, 0.16, 6, 0.16, "#c99958");
    ball(scene, x, 6.1, -2.4, 0.23, 0.23, 0.23, "#ffd59c");
  }
  const beams = [];
  for (let i = 0; i < 3; i++) {
    const light = new T.SpotLight(
      i === 1 ? "#ffdb87" : "#bdd7ff",
      60,
      23,
      0.38,
      0.65,
      1.2,
    );
    light.position.set((i - 1) * 6, 8, 3);
    scene.add(light, light.target);
    const housing = mesh(
      new T.CylinderGeometry(0.24, 0.3, 0.65, 16),
      material("#242933", 0.7),
      scene,
      (i - 1) * 6,
      7.9,
      3,
    );
    housing.rotation.x = 0.55;
    const beamMat = new T.MeshBasicMaterial({
      color: i === 1 ? "#ffdfa0" : "#b8d5ff",
      transparent: true,
      opacity: 0.035,
      side: T.DoubleSide,
      depthWrite: false,
    });
    resources.add(beamMat);
    const beam = mesh(
      new T.ConeGeometry(2.7, 8, 24, 1, true),
      beamMat,
      scene,
      (i - 1) * 6,
      4,
      0,
    );
    beam.castShadow = false;
    beams.push({ light, beam });
  }
  // Restaurant insignia, baked once, rather than a new canvas texture each frame.
  const sign = document.createElement("canvas");
  sign.width = 1024;
  sign.height = 128;
  const sx = sign.getContext("2d");
  sx.fillStyle = "#ffd98b";
  sx.font = "bold 58px Georgia";
  sx.textAlign = "center";
  sx.fillText("LES HONNEURS DU BUFFET", 512, 83);
  const signTexture = new T.CanvasTexture(sign);
  signTexture.colorSpace = T.SRGBColorSpace;
  resources.add(signTexture);
  const signMat = new T.MeshBasicMaterial({
    map: signTexture,
    transparent: true,
  });
  resources.add(signMat);
  mesh(new T.PlaneGeometry(9, 1.12), signMat, scene, 0, 6, -4.01);
  const podiums = new Map(),
    heights = { champion: 1.15, predator: 0.72, first: 0.48 },
    xs = { champion: 0, predator: -4.6, first: 4.6 };
  for (const kind of ["champion", "predator", "first"]) {
    const g = new T.Group();
    scene.add(g);
    g.position.x = xs[kind];
    mesh(
      new T.CylinderGeometry(1.85, 2, 0.18, 64),
      material("#e6bd6e", 0.7, 0.25),
      g,
      0,
      0.1,
      0,
    );
    mesh(
      new T.CylinderGeometry(1.65, 1.82, heights[kind], 64),
      material(kind === "champion" ? "#a77732" : "#513846", 0.35, 0.35),
      g,
      0,
      heights[kind] / 2 + 0.18,
      0,
    );
    mesh(
      new T.CylinderGeometry(1.8, 1.8, 0.14, 64),
      material("#f4d6a1", 0.6, 0.25),
      g,
      0,
      heights[kind] + 0.23,
      0,
    );
    for (let step = 0; step < 3; step++) {
      const h = ((heights[kind] + 0.3) * (step + 1)) / 3;
      box(g, 0, h / 2, 2.65 - step * 0.45, 2.1, h, 0.55, "#634632");
      box(g, 0, h + 0.018, 2.65 - step * 0.45, 2.14, 0.045, 0.57, "#d8ba7f");
    }
    const rimMat = new T.MeshStandardMaterial({
      color: "#ffcc70",
      emissive: "#b86f24",
      emissiveIntensity: 0.8,
      metalness: 0.6,
    });
    resources.add(rimMat);
    const rim = mesh(
      new T.TorusGeometry(1.78, 0.035, 8, 64),
      rimMat,
      g,
      0,
      heights[kind] + 0.32,
      0,
    );
    rim.rotation.x = Math.PI / 2;
    podiums.set(kind, g);
  }
  try {
    await preparePresentationArt();
  } catch {
    renderer.dispose();
    for (const r of resources) r.dispose();
    return null;
  }
  if (!isCurrent()) {
    renderer.dispose();
    for (const r of resources) r.dispose();
    return null;
  }
  const backdropTexture = new T.Texture(ceremonyBackdrop());
  backdropTexture.colorSpace = T.SRGBColorSpace;
  backdropTexture.needsUpdate = true;
  resources.add(backdropTexture);
  const backdropMaterial = new T.MeshBasicMaterial({ map: backdropTexture });
  resources.add(backdropMaterial);
  mesh(
    new T.PlaneGeometry(24, 12),
    backdropMaterial,
    scene,
    0,
    4.5,
    -4.25,
  ).castShadow = false;
  let atlas;
  try {
    atlas = new Image();
    atlas.src = new URL(
      "./assets/cosmetics/heads-equipped.webp",
      import.meta.url,
    ).href;
    await atlas.decode();
  } catch {
    renderer.dispose();
    for (const r of resources) r.dispose();
    return null;
  }
  if (!root.isConnected || !isCurrent()) {
    renderer.dispose();
    for (const r of resources) r.dispose();
    return null;
  }
  function headModel(id) {
    // Rounded, closed textured relief mesh from the actual equipped head silhouette.
    // This preserves all 24 purchased hats; it is not a replacement cosmetic.
    const tile = document.createElement("canvas");
    tile.width = 256;
    tile.height = 384;
    const c = tile.getContext("2d", { willReadFrequently: true }),
      at = Math.max(0, HEAD_IDS.indexOf(id));
    c.drawImage(
      atlas,
      (at % 6) * 256,
      Math.floor(at / 6) * 384,
      256,
      384,
      0,
      0,
      256,
      384,
    );
    const neutral = getCeremonyHead(at, 0);
    if (neutral) {
      c.clearRect(0, 0, 256, 384);
      c.drawImage(neutral, 0, 0);
    }
    const pixels = c.getImageData(0, 0, 256, 384).data,
      positions = [],
      uv = [],
      indices = [];
    const step = 5,
      nx = Math.ceil(256 / step),
      ny = Math.ceil(384 / step);
    const solid = (x, y) =>
      pixels[(Math.min(383, y) * 256 + Math.min(255, x)) * 4 + 3] > 80;
    for (let y = 0; y < ny; y++)
      for (let x = 0; x < nx; x++) {
        const px = x * step,
          py = y * step;
        if (!solid(px + 2, py + 2)) continue;
        const depth =
          0.12 +
          0.28 * Math.sqrt(Math.max(0, 1 - Math.pow((px - 128) / 128, 2)));
        const b = positions.length / 3;
        for (const z of [depth, -0.18])
          for (const [dx, dy] of [
            [0, 0],
            [step, 0],
            [step, step],
            [0, step],
          ]) {
            positions.push(
              (px + dx - 128) / 128,
              (333 - py - dy) / 128,
              z === depth
                ? 0.12 +
                    0.28 *
                      Math.sqrt(
                        Math.max(0, 1 - Math.pow((px + dx - 128) / 128, 2)),
                      )
                : z,
            );
            uv.push((px + dx) / 256, 1 - (py + dy) / 384);
          }
        indices.push(
          b,
          b + 2,
          b + 1,
          b,
          b + 3,
          b + 2,
          b + 4,
          b + 5,
          b + 6,
          b + 4,
          b + 6,
          b + 7,
        );
        // Join cells at alpha silhouette edges; interior cells share the same surface.
        const sides = [
          [0, 1, 4, 5, 0, -1],
          [1, 2, 5, 6, 1, 0],
          [2, 3, 6, 7, 0, 1],
          [3, 0, 7, 4, -1, 0],
        ];
        for (const [a, d, e, f, ox, oy] of sides)
          if (
            x + ox < 0 ||
            y + oy < 0 ||
            x + ox >= nx ||
            y + oy >= ny ||
            !solid((x + ox) * step + 2, (y + oy) * step + 2)
          )
            indices.push(b + a, b + d, b + f, b + a, b + f, b + e);
      }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const texture = new T.CanvasTexture(tile);
    texture.colorSpace = T.SRGBColorSpace;
    resources.add(texture);
    const mat = new T.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.35,
      roughness: 0.85,
      side: T.DoubleSide,
    });
    resources.add(mat);
    resources.add(geo);
    return new T.Mesh(geo, mat);
  }
  await Promise.all(
    actors.map(async ({ person }) => {
      const image = extraCosmeticImage(person.cosmetics?.outfit);
      if (image)
        try {
          await image.decode();
        } catch {}
    }),
  );
  if (!isCurrent()) {
    renderer.dispose();
    for (const r of resources) r.dispose();
    return null;
  }
  const models = [];
  for (const actor of actors) {
    const p = actor.person,
      group = new T.Group(),
      count = actors.filter((a) => a.kind === actor.kind).length,
      offset = actors.filter((a) => a.kind === actor.kind).indexOf(actor);
    const scale = count > 1 ? Math.min(0.83, 2.8 / count) : 1;
    group.position.set(
      xs[actor.kind] + (offset - (count - 1) / 2) * 1.1 * scale,
      heights[actor.kind] + 0.32,
      0,
    );
    group.scale.setScalar(scale);
    scene.add(group);
    const skin = p.skin || "#efc5a0",
      color =
        COSMETIC_CATALOG.find((c) => c.id === p.cosmetics?.outfit)?.color ||
        p.color ||
        "#da9a4e";
    // Authenticated costume artwork is projected over the rounded torso once.
    const original = document.createElement("canvas");
    original.width = 512;
    original.height = 640;
    renderAvatar(
      original,
      {
        ...p,
        mass: 60,
        cosmetics: { ...p.cosmetics, hat: "none", aura: "aura_none" },
      },
      { time: 0, breath: 0 },
    );
    const cloth = document.createElement("canvas");
    cloth.width = 256;
    cloth.height = 256;
    cloth
      .getContext("2d")
      .drawImage(original, 99, 363, 314, 228, 0, 0, 256, 256);
    const clothTexture = new T.CanvasTexture(cloth);
    clothTexture.colorSpace = T.SRGBColorSpace;
    resources.add(clothTexture);
    const torsoMat = new T.MeshStandardMaterial({
      color: "#ffffff",
      map: clothTexture,
      roughness: 0.8,
    });
    resources.add(torsoMat);
    const torso = ball(group, 0, 1.05, 0, 0.82, 0.96, 0.58, color);
    const decal = mesh(
      new T.SphereGeometry(
        1,
        36,
        24,
        Math.PI * 0.12,
        Math.PI * 0.76,
        0.25,
        Math.PI * 0.8,
      ),
      torsoMat,
      group,
      0,
      1.05,
      0.015,
    );
    const points = decal.geometry.attributes.position,
      garmentUV = decal.geometry.attributes.uv;
    for (let i = 0; i < points.count; i++)
      garmentUV.setXY(i, (points.getX(i) + 1) / 2, (points.getY(i) + 1) / 2);
    garmentUV.needsUpdate = true;
    decal.scale.set(0.835, 0.97, 0.59);
    const head = new T.Group();
    head.position.set(0, 1.85, 0.04);
    group.add(head);
    const face = headModel(p.cosmetics?.hat || "none");
    face.scale.setScalar(0.82);
    ball(head, 0, 0.32, -0.05, 0.38, 0.43, 0.3, skin);
    face.position.z = 0.08;
    head.add(face);
    const auraIndex = AURA_IDS.indexOf(p.cosmetics?.aura);
    let aura = null,
      auraTexture = null;
    if (auraIndex >= 0) {
      auraTexture = new T.Texture(auraAtlas());
      auraTexture.colorSpace = T.SRGBColorSpace;
      auraTexture.repeat.set(1 / 5, 1 / 4);
      auraTexture.offset.set(auraIndex / 5, 3 / 4);
      auraTexture.needsUpdate = true;
      resources.add(auraTexture);
      const mat = new T.MeshBasicMaterial({
        map: auraTexture,
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
      });
      resources.add(mat);
      aura = mesh(new T.PlaneGeometry(5.1, 1.7), mat, group, 0, 0.08, 0.1);
      aura.rotation.x = -Math.PI / 2;
      aura.castShadow = false;
    }
    const smokeTexture = new T.Texture(vfxAtlas());
    smokeTexture.colorSpace = T.SRGBColorSpace;
    smokeTexture.repeat.set(1 / 6, 1 / 2);
    smokeTexture.needsUpdate = true;
    resources.add(smokeTexture);
    const smokeMaterial = new T.SpriteMaterial({
      map: smokeTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0,
    });
    resources.add(smokeMaterial);
    const smoke = new T.Sprite(smokeMaterial);
    smoke.center.set(0, 0.5);
    smoke.position.set(0.05, 0.18, 0.7);
    head.add(smoke);
    smoke.visible = false;
    const arms = [],
      legs = [];
    for (const side of [-1, 1]) {
      const arm = new T.Group();
      arm.position.set(side * 0.73, 1.58, 0);
      group.add(arm);
      ball(arm, side * 0.08, -0.25, 0, 0.21, 0.38, 0.23, color);
      ball(arm, side * 0.12, -0.62, 0.08, 0.22, 0.24, 0.22, skin);
      arms.push(arm);
      const leg = new T.Group();
      leg.position.set(side * 0.36, 0.45, 0);
      group.add(leg);
      ball(leg, 0, -0.23, 0.04, 0.21, 0.34, 0.22, "#3d3944");
      ball(leg, 0, -0.35, 0.17, 0.25, 0.16, 0.36, "#282835");
      legs.push(leg);
    }
    const buns = new T.Group();
    group.add(buns);
    buns.visible = false;
    const top = ball(buns, 0, 3, 0.05, 1.1, 0.36, 0.75, "#d99639"),
      bottom = ball(buns, 0, -0.2, 0.05, 1.08, 0.18, 0.72, "#d99639");
    group.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = !o.material.transparent || !!o.material.alphaTest;
        o.userData.actor = actor;
      }
    });
    models.push({
      actor,
      aura,
      auraIndex,
      auraTexture,
      smoke,
      smokeTexture,
      face,
      expression: 0,
      burpCycle: null,
      decal,
      targetX: group.position.x,
      group,
      head,
      arms,
      legs,
      torso,
      buns,
      top,
      bottom,
      baseY: group.position.y,
      scale,
    });
  }
  if (!isCurrent()) {
    renderer.dispose();
    for (const r of resources) r.dispose();
    return null;
  }
  root.prepend(canvas);
  root.classList.add("ceremony-is-3d");
  root.dataset.renderer = "webgl";
  const resize = () => {
    const width = Math.max(1, root.clientWidth),
      height = matchMedia("(max-width:600px)").matches ? 380 : 490;
    renderer.setSize(width, height, false);
    canvas.style.height = height + "px";
    camera.aspect = width / height;
    camera.position.z = width / height < 1.5 ? 24 : 11.8;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(root);
  resize();
  const ray = new T.Raycaster(),
    pointer = new T.Vector2();
  canvas.onclick = (e) => {
    const b = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - b.left) / b.width) * 2 - 1,
      (-(e.clientY - b.top) / b.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const hit = ray
      .intersectObjects(
        models.map((m) => m.group),
        true,
      )
      .find((h) => h.object.userData.actor);
    hit?.object.userData.actor.canvas.closest("button")?.click();
  };
  const confettiMaterial = new T.MeshStandardMaterial({
    color: "#ffd57a",
    metalness: 0.4,
    side: T.DoubleSide,
  });
  resources.add(confettiMaterial);
  const confettiGeometry = new T.PlaneGeometry(0.07, 0.14);
  resources.add(confettiGeometry);
  const confetti = new T.InstancedMesh(confettiGeometry, confettiMaterial, 18);
  scene.add(confetti);
  const confettiTransform = new T.Object3D();
  let start = performance.now(),
    disposed = false;
  function frame(time, poseAt, full) {
    if (disposed) return;
    const age = (time - start) / 1000,
      skipped = root.dataset.intro === "done";
    for (const [kind, podium] of podiums) {
      const delay =
        kind === "champion" ? 0.15 : kind === "predator" ? 0.35 : 0.55;
      podium.scale.y =
        full && !skipped ? Math.max(0.01, ease((age - delay) / 0.7)) : 1;
    }
    for (const m of models) {
      const p = poseAt(full ? m.actor : { ...m.actor, enabled: false }, time);
      const stagger =
        m.actor.kind === "champion"
          ? 0
          : m.actor.kind === "predator"
            ? 0.18
            : 0.36;
      const walk =
        skipped || !full
          ? 1
          : Math.max(0, Math.min(1, (age - 0.35 - stagger) / 2.1));
      m.group.visible = skipped || !full || age > 0.35 + stagger;
      if (!m.group.visible) continue;
      const gait = walk < 1 ? Math.sin(walk * Math.PI * 14) : 0,
        stepLift = walk < 1 ? Math.abs(gait) * 0.065 : 0;
      m.group.position.set(
        m.targetX + (m.actor.kind === "first" ? 1 : -1) * (1 - walk) * 1.3,
        0.12 +
          (m.baseY - 0.12) * Math.max(0, Math.min(1, (walk - 0.35) / 0.45)) +
          stepLift +
          p.jump * 0.018,
        (1 - walk) * 4.6,
      );
      m.group.rotation.y =
        walk < 1
          ? m.actor.kind === "first"
            ? -0.25
            : 0.25
          : full
            ? Math.sin(time * 0.0005 + m.actor.person.id) * 0.1
            : 0;
      m.torso.scale.set(
        0.82 * (1 + p.belly),
        0.96 * (1 + (p.breath || 0) * 0.018),
        0.58 * (1 + p.belly * 0.55),
      );
      m.decal.scale.set(
        0.835 * (1 + p.belly),
        0.97 * (1 + (p.breath || 0) * 0.018),
        0.59 * (1 + p.belly * 0.55),
      );
      m.torso.rotation.z = p.twist;
      m.decal.rotation.z = p.twist;
      m.head.rotation.set(p.headPitch, -(p.look || 0) * 2, -(p.headTurn || 0));
      m.head.position.y = 1.85 - (p.headBob || 0);
      m.arms[0].rotation.z = walk < 1 ? gait * 0.35 : -(p.armL || 0);
      m.arms[1].rotation.z = walk < 1 ? -gait * 0.35 : -(p.armR || 0);
      m.arms[0].rotation.x =
        walk < 1 ? gait * 0.5 : Math.sin(time * 0.002) * 0.06;
      m.arms[1].rotation.x = -m.arms[0].rotation.x;
      m.legs[0].rotation.x = walk < 1 ? gait * 0.65 : p.legL || 0;
      m.legs[1].rotation.x = walk < 1 ? -gait * 0.65 : p.legR || 0;
      const expression = walk < 1 ? 0 : p.expression || 0;
      if (m.expression !== expression) {
        const head = getCeremonyHead(
          Math.max(
            0,
            HEAD_IDS.indexOf(m.actor.person.cosmetics?.hat || "none"),
          ),
          expression,
        );
        if (head) {
          m.face.material.map.image = head;
          m.face.material.map.needsUpdate = true;
          m.expression = expression;
        }
      }
      if (m.aura) {
        m.aura.visible = root.dataset.motion !== "off";
        m.aura.position.y = 0.08 - (p.jump * 0.018) / m.scale;
        m.auraTexture.offset.y =
          (3 - (full ? Math.floor(time / 180) % 4 : 0)) / 4;
      }
      m.smoke.visible = full && p.burp > 0;
      if (m.smoke.visible) {
        m.smokeTexture.offset.set(Math.min(5, Math.floor(p.burp * 6)) / 6, 0);
        m.smoke.scale.set(1.8 + p.burp * 2.5, 1.2 + p.burp, 1);
        m.smoke.material.opacity = Math.sin(Math.PI * p.burp) * 0.8;
      }
      if (full && p.burp > 0.015 && m.actor.burpCycle !== m.actor.celebrateAt) {
        m.actor.burpCycle = m.actor.celebrateAt;
        document.dispatchEvent(new Event("podium-burp"));
      }
      m.arrival = walk;
      const elapsed = (time - m.actor.celebrateAt) / 1000;
      m.buns.visible =
        p.animation === "podium_despair" &&
        m.actor.enabled &&
        elapsed > 0.3 &&
        elapsed < 2.4;
      if (m.buns.visible) {
        const squeeze = Math.sin(
          (Math.max(0, Math.min(1, (elapsed - 0.3) / 0.5)) * Math.PI) / 2,
        );
        m.top.position.y = 3.7 - squeeze * 0.65;
        m.bottom.position.y = -0.8 + squeeze * 0.5;
      }
    }
    for (let i = 0; i < beams.length; i++) {
      const { light, beam } = beams[i],
        x = Math.sin(full ? time * 0.0003 + i : i) * 4;
      light.target.position.set(x, 0, 0);
      beam.rotation.z = (i - 1) * 0.15 + x * 0.025;
    }
    confetti.visible =
      full &&
      age > 0.8 &&
      age < 2.8 &&
      actors.some((a) => a.kind === "champion");
    if (confetti.visible) {
      for (let i = 0; i < 18; i++) {
        const fall = (age - 0.8) / 2;
        confettiTransform.position.set(
          Math.sin(i * 2.4) * 3 * (0.2 + fall),
          5 - fall * (2.5 + (i % 3)),
          Math.cos(i) * 1.4,
        );
        confettiTransform.rotation.set(age * 2 + i, age + i, age * 1.5 + i);
        confettiTransform.updateMatrix();
        confetti.setMatrixAt(i, confettiTransform.matrix);
      }
      confetti.instanceMatrix.needsUpdate = true;
    }
    renderer.render(scene, camera);
    root.dataset.bodyWidths = models
      .map((m) => m.torso.scale.x.toFixed(3))
      .join(",");
    root.dataset.expressions = models.map((m) => m.expression).join(",");
    root.dataset.walkers = models.filter((m) => m.arrival < 1).length;
    root.dataset.smoke = models.filter((m) => m.smoke.visible).length;
    root.dataset.triangles = renderer.info.render.triangles;
    root.dataset.drawCalls = renderer.info.render.calls;
  }
  const contextLost = (e) => {
    e.preventDefault();
    dispose();
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  function dispose() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    canvas.onclick = null;
    canvas.removeEventListener("webglcontextlost", contextLost);
    renderer.dispose();
    renderer.forceContextLoss?.();
    for (const resource of resources) resource.dispose();
    canvas.remove();
    root.classList.remove("ceremony-is-3d");
    root.dataset.renderer = "canvas";
  }
  return {
    frame,
    dispose,
    restart(time) {
      start = time;
    },
    get disposed() {
      return disposed;
    },
  };
}
