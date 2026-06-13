/*
 * One-off asset pipeline: splits the static butterfly mesh into left/right
 * wing meshes (so the app can flap them), normalizes scales, draco-compresses
 * everything into public/models/.
 *
 * Usage: node scripts/build-models.mjs
 * Inputs (raw downloads): /tmp/glb/{tree-raw,bf3,flowerbush,daffodil}.glb
 */
import { NodeIO, Document } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { draco, prune, dedup, weld, simplify, resample } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import draco3d from "draco3dgltf";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../public/models/", import.meta.url));
mkdirSync(OUT, { recursive: true });

const io = new NodeIO()
  .registerExtensions(KHRONOS_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

async function compressTo(doc, file, doSimplify = false) {
  const fns = [dedup(), prune()];
  if (doSimplify) fns.push(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.6, error: 0.001 }));
  fns.push(draco());
  await doc.transform(...fns);
  await io.write(OUT + file, doc);
  console.log("wrote", file);
}

/* ---------- butterfly: split single mesh into wing-left / wing-right ---------- */
const bf = await io.read("/tmp/glb/bf3.glb");
{
  const root = bf.getRoot();
  const srcMesh = root.listMeshes()[0];

  const newDoc = new Document();
  const buffer = newDoc.createBuffer();
  const newScene = newDoc.createScene("Scene");
  newDoc.getRoot().setDefaultScene(newScene);

  // Cache materials by source index
  const matMap = new Map();
  function cloneMaterial(srcMat) {
    if (!srcMat) return null;
    if (matMap.has(srcMat)) return matMap.get(srcMat);
    const m = newDoc.createMaterial(srcMat.getName());
    m.setBaseColorFactor(srcMat.getBaseColorFactor());
    m.setMetallicFactor(0);
    m.setRoughnessFactor(0.8);
    m.setDoubleSided(true);
    matMap.set(srcMat, m);
    return m;
  }

  const sideMeshes = {
    left: newDoc.createMesh("WingL"),
    right: newDoc.createMesh("WingR"),
  };

  for (const prim of srcMesh.listPrimitives()) {
    const pos = prim.getAttribute("POSITION").getArray();
    const idx = prim.getIndices()
      ? prim.getIndices().getArray()
      : Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);

    // Partition triangles by centroid X sign
    const sides = { left: [], right: [] };
    for (let t = 0; t < idx.length; t += 3) {
      const cx = (pos[idx[t] * 3] + pos[idx[t + 1] * 3] + pos[idx[t + 2] * 3]) / 3;
      (cx < 0 ? sides.left : sides.right).push(idx[t], idx[t + 1], idx[t + 2]);
    }

    for (const side of ["left", "right"]) {
      if (sides[side].length === 0) continue;
      // Re-index: gather used vertices
      const remap = new Map();
      const newIdx = [];
      const newPos = [];
      for (const i of sides[side]) {
        if (!remap.has(i)) {
          remap.set(i, newPos.length / 3);
          newPos.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        }
        newIdx.push(remap.get(i));
      }
      const posAcc = newDoc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array(newPos))
        .setBuffer(buffer);
      const idxAcc = newDoc
        .createAccessor()
        .setType("SCALAR")
        .setArray(new Uint16Array(newIdx))
        .setBuffer(buffer);
      const newPrim = newDoc
        .createPrimitive()
        .setAttribute("POSITION", posAcc)
        .setIndices(idxAcc)
        .setMaterial(cloneMaterial(prim.getMaterial()));
      sideMeshes[side].addPrimitive(newPrim);
    }
  }

  // Normalize: source bbox is ~210 units wide; scale to ~1 unit wingspan
  const s = 1 / 210;
  for (const [name, mesh] of Object.entries(sideMeshes)) {
    const node = newDoc.createNode(name === "left" ? "WingL" : "WingR").setMesh(mesh).setScale([s, s, s]);
    newScene.addChild(node);
  }

  await compressTo(newDoc, "butterfly.glb");
}

/* ---------- tree / flowers: just compress ---------- */
for (const [src, out, doSimplify] of [
  ["/tmp/glb/tree-raw.glb", "tree.glb", true],
  ["/tmp/glb/flowerbush.glb", "flowerbush.glb", true],
  ["/tmp/glb/daffodil.glb", "daffodil.glb", true],
]) {
  const doc = await io.read(src);
  await doc.transform(resample());
  await compressTo(doc, out, doSimplify);
}
