/**
 * Reality .25 — optional Three.js projection.
 *
 * RealityField owns the topology/state. This module only projects it into 3D.
 * The nucleus is rendered once; reality-to-reality links are direct.
 */
export function buildRealityFieldScene({ THREE, parent, field, radius = 4.2 } = {}) {
  if (!THREE || !parent || !field) throw new TypeError('THREE, parent and field are required');

  const root = new THREE.Group();
  root.name = 'Reality .25 / 18-direction field';
  parent.add(root);

  const materials = [];
  const geometries = [];
  const nodes = new Map();
  const referenceGroup = new THREE.Group();
  referenceGroup.name = 'Nucleus reference spokes';
  root.add(referenceGroup);
  const edgesGroup = new THREE.Group();
  edgesGroup.name = 'Reality connections';
  root.add(edgesGroup);

  const nucleusMaterial = new THREE.MeshStandardMaterial({
    color: 0xf3cf73,
    emissive: 0x7d4d00,
    emissiveIntensity: 0.8,
    metalness: 0.65,
    roughness: 0.28,
  });
  const nucleusGeometry = new THREE.BoxGeometry(0.62, 0.62, 0.62);
  materials.push(nucleusMaterial);
  geometries.push(nucleusGeometry);

  const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
  nucleus.name = 'Central Nucleus';
  nucleus.userData.realityId = 'NUCLEUS';
  root.add(nucleus);

  const cardinalMaterial = new THREE.MeshStandardMaterial({
    color: 0x4ca8ff,
    emissive: 0x174b7d,
    emissiveIntensity: 0.35,
    metalness: 0.2,
    roughness: 0.45,
  });
  const diagonalMaterial = new THREE.MeshStandardMaterial({
    color: 0x9b7cff,
    emissive: 0x372070,
    emissiveIntensity: 0.3,
    metalness: 0.2,
    roughness: 0.45,
  });
  const selectedMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.7,
    metalness: 0.25,
    roughness: 0.28,
  });
  const nodeGeometry = new THREE.SphereGeometry(0.23, 20, 14);
  materials.push(cardinalMaterial, diagonalMaterial, selectedMaterial);
  geometries.push(nodeGeometry);

  const positionFor = reality => {
    const vector = reality.vector;
    const vectorLength = Math.hypot(...vector) || 1;
    const scale = reality.class === 'cardinal' ? radius * 0.82 : radius;
    return new THREE.Vector3(
      vector[0] / vectorLength * scale,
      vector[1] / vectorLength * scale,
      vector[2] / vectorLength * scale,
    );
  };

  for (const reality of field.realties.values()) {
    const sphere = new THREE.Mesh(
      nodeGeometry,
      reality.class === 'cardinal' ? cardinalMaterial : diagonalMaterial,
    );
    sphere.name = reality.id;
    sphere.userData.realityId = reality.id;
    sphere.position.copy(positionFor(reality));
    root.add(sphere);
    nodes.set(reality.id, sphere);
  }

  function rebuildReferenceSpokes() {
    while (referenceGroup.children.length) {
      const child = referenceGroup.children.pop();
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    }

    for (const object of nodes.values()) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        nucleus.position,
        object.position,
      ]);
      const material = new THREE.LineBasicMaterial({
        color: 0x294768,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      });
      geometries.push(geometry);
      materials.push(material);
      const line = new THREE.Line(geometry, material);
      line.name = 'Nucleus reference spoke';
      referenceGroup.add(line);
    }
  }

  function rebuildEdges() {
    while (edgesGroup.children.length) {
      const child = edgesGroup.children.pop();
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    }

    for (const edge of field.edges.values()) {
      if (!edge.active) continue;
      const from = nodes.get(edge.from);
      const to = nodes.get(edge.to);
      if (!from || !to) continue;

      const geometry = new THREE.BufferGeometry().setFromPoints([from.position, to.position]);
      geometries.push(geometry);

      const material = edge.type === 'fold'
        ? new THREE.LineDashedMaterial({
            color: 0xffc45c,
            dashSize: 0.16,
            gapSize: 0.11,
            transparent: true,
            opacity: 0.9,
          })
        : new THREE.LineBasicMaterial({
            color: 0x6be0ff,
            transparent: true,
            opacity: 0.72,
          });
      materials.push(material);

      const line = new THREE.Line(geometry, material);
      line.name = edge.type === 'fold' ? 'Reality Fold' : 'Reality Link';
      line.userData.edgeId = edge.id;
      line.userData.type = edge.type;
      if (edge.type === 'fold') line.computeLineDistances();
      edgesGroup.add(line);
    }
  }

  let selectedId = null;

  function selectReality(id) {
    if (id !== 'NUCLEUS' && !nodes.has(id)) throw new Error('Unknown reality: ' + id);
    selectedId = id;
    for (const [realityId, object] of nodes) {
      const state = field.getReality(realityId).localState;
      object.material = realityId === selectedId ? selectedMaterial :
        field.getReality(realityId).address.vector.filter(Boolean).length === 1
          ? cardinalMaterial
          : diagonalMaterial;
      object.scale.setScalar(realityId === selectedId ? 1.45 : 1 + Math.min(0.22, Number(state.activity || 0) * 0.22));
    }
    nucleus.scale.setScalar(selectedId === 'NUCLEUS' ? 1.35 : 1);
    return selectedId;
  }

  function animate(timeSeconds = 0) {
    for (const [realityId, object] of nodes) {
      const state = field.getReality(realityId).localState;
      const activity = Math.max(0, Math.min(1, Number(state.activity || 0)));
      const selectedBoost = realityId === selectedId ? 0.16 : 0;
      const pulse = 0.02 * Math.sin(timeSeconds * 2.2 + realityId.charCodeAt(1));
      object.scale.setScalar(1 + activity * 0.18 + selectedBoost + pulse);
    }

    nucleus.rotation.x = timeSeconds * 0.24;
    nucleus.rotation.y = timeSeconds * 0.37;
    nucleus.rotation.z = timeSeconds * 0.17;
  }

  function update() {
    rebuildReferenceSpokes();
    rebuildEdges();
    if (selectedId) selectReality(selectedId);
    return getSnapshot();
  }

  function getSnapshot() {
    return {
      selectedId,
      realityCount: nodes.size,
      activeConnectionCount: [...field.edges.values()].filter(edge => edge.active).length,
      foldCount: field.folds.size,
      referenceSpokes: nodes.size,
      nucleusPosition: nucleus.position.toArray(),
    };
  }

  function destroy() {
    root.removeFromParent();
    const disposed = new Set();
    for (const geometry of geometries) {
      if (disposed.has(geometry)) continue;
      disposed.add(geometry);
      try { geometry.dispose?.(); } catch {}
    }
    for (const material of materials) {
      if (disposed.has(material)) continue;
      disposed.add(material);
      try { material.dispose?.(); } catch {}
    }
  }

  rebuildReferenceSpokes();
  rebuildEdges();

  return Object.freeze({
    root,
    nucleus,
    nodes,
    selectReality,
    animate,
    update,
    getSnapshot,
    destroy,
  });
}
