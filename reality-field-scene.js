import { expandLattice, FIRST_ORDER_ALTERNATE_COUNT } from './reality-expansion.js';

/**
 * Reality .25 — optional Three.js projection.
 *
 * RealityField owns topology/state. This module only projects it into 3D.
 * Every primary reality is rendered as an oriented chamber whose local +Z
 * axis points along that reality's canonical vector.
 */
export function buildRealityFieldScene({ THREE, parent, field, radius = 4.2 } = {}) {
  if (!THREE || !parent || !field) throw new TypeError('THREE, parent and field are required');

  const root = new THREE.Group();
  root.name = 'Reality .25 / 18-direction field';
  parent.add(root);

  const materials = [];
  const geometries = [];
  const nodes = new Map();
  const nodeGroups = new Map();

  const referenceGroup = new THREE.Group();
  referenceGroup.name = 'Nucleus reference spokes';
  root.add(referenceGroup);

  const edgesGroup = new THREE.Group();
  edgesGroup.name = 'Reality connections';
  root.add(edgesGroup);

  const orientationGroup = new THREE.Group();
  orientationGroup.name = 'Reality direction basis';
  root.add(orientationGroup);

  const alternateGroup = new THREE.Group();
  alternateGroup.name = '576 first-order alternate states';
  root.add(alternateGroup);

  const nucleusMaterial = new THREE.MeshStandardMaterial({
    color: 0xf3cf73,
    emissive: 0x7d4d00,
    emissiveIntensity: 0.9,
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

  const axes = new THREE.AxesHelper(1.8);
  axes.name = 'XYZ orientation axes';
  axes.renderOrder = 10;
  root.add(axes);

  const cardinalMaterial = new THREE.MeshStandardMaterial({
    color: 0x4ca8ff,
    emissive: 0x174b7d,
    emissiveIntensity: 0.35,
    metalness: 0.18,
    roughness: 0.4,
    transparent: true,
    opacity: 0.42,
  });
  const diagonalMaterial = new THREE.MeshStandardMaterial({
    color: 0x9b7cff,
    emissive: 0x372070,
    emissiveIntensity: 0.3,
    metalness: 0.18,
    roughness: 0.4,
    transparent: true,
    opacity: 0.42,
  });
  const selectedMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.8,
    metalness: 0.25,
    roughness: 0.24,
    transparent: true,
    opacity: 0.52,
  });

  const chamberGeometry = new THREE.BoxGeometry(0.96, 0.96, 1.66);
  const chamberEdgesGeometry = new THREE.EdgesGeometry(chamberGeometry);
  const portalGeometry = new THREE.PlaneGeometry(0.78, 0.78);
  const portalRingGeometry = new THREE.RingGeometry(0.34, 0.40, 32);
  const localCoreGeometry = new THREE.IcosahedronGeometry(0.16, 1);
  const localRailGeometry = new THREE.BoxGeometry(0.035, 0.035, 1.48);
  const portalLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.30, 0, 0.835),
    new THREE.Vector3(0.30, 0, 0.835),
    new THREE.Vector3(0, -0.30, 0.835),
    new THREE.Vector3(0, 0.30, 0.835),
  ]);
  materials.push(cardinalMaterial, diagonalMaterial, selectedMaterial);
  geometries.push(chamberGeometry, chamberEdgesGeometry, portalGeometry, portalRingGeometry, localCoreGeometry, localRailGeometry, portalLineGeometry);

  const vectorFor = reality => {
    const [x, y, z] = reality.vector;
    return new THREE.Vector3(x, y, z).normalize();
  };

  const positionFor = reality => vectorFor(reality).multiplyScalar(radius);

  function makeLabelTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(4,8,18,0.86)';
    ctx.strokeStyle = 'rgba(178,219,255,0.7)';
    ctx.lineWidth = 4;
    ctx.roundRect?.(8, 8, 496, 112, 18, 18);
    if (ctx.roundRect) {
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(8, 8, 496, 112);
      ctx.strokeRect(8, 8, 496, 112);
    }
    ctx.fillStyle = '#edf6ff';
    ctx.font = '700 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
    return new THREE.CanvasTexture(canvas);
  }

  function makeLabel(text) {
    const texture = makeLabelTexture(text);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    materials.push(material);
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.28, 0.32, 1);
    sprite.position.set(0, 0.86, 0);
    return sprite;
  }

  for (const reality of field.realties.values()) {
    const group = new THREE.Group();
    group.name = reality.id + ' chamber';
    group.userData.realityId = reality.id;
    group.position.copy(positionFor(reality));

    const direction = vectorFor(reality);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);

    const baseMaterial = reality.class === 'cardinal' ? cardinalMaterial : diagonalMaterial;
    const chamber = new THREE.Mesh(chamberGeometry, baseMaterial);
    chamber.name = reality.id + ' world chamber';
    chamber.userData.realityId = reality.id;
    group.add(chamber);

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: reality.class === 'cardinal' ? 0x68c8ff : 0xb69dff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    materials.push(edgeMaterial);
    const outline = new THREE.LineSegments(chamberEdgesGeometry, edgeMaterial);
    outline.name = reality.id + ' chamber frame';
    group.add(outline);

    const portalMaterial = new THREE.MeshBasicMaterial({
      color: reality.class === 'cardinal' ? 0x74d7ff : 0xc49bff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    materials.push(portalMaterial);
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.z = 0.84;
    portal.name = reality.id + ' outward portal';
    group.add(portal);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: reality.class === 'cardinal' ? 0x98e2ff : 0xd8c3ff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    materials.push(ringMaterial);
    const ring = new THREE.Mesh(portalRingGeometry, ringMaterial);
    ring.position.z = 0.85;
    ring.name = reality.id + ' portal ring';
    group.add(ring);

    const portalLines = new THREE.LineSegments(
      portalLineGeometry,
      new THREE.LineBasicMaterial({
        color: 0xe5f6ff,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    materials.push(portalLines.material);
    portalLines.name = reality.id + ' portal crosshair';
    group.add(portalLines);

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: reality.class === 'cardinal' ? 0x7acfff : 0xb6a1ff,
      emissive: reality.class === 'cardinal' ? 0x184768 : 0x3a2770,
      emissiveIntensity: 0.9,
      metalness: 0.32,
      roughness: 0.25,
    });
    materials.push(coreMaterial);
    const core = new THREE.Mesh(localCoreGeometry, coreMaterial);
    core.position.set(0, 0, 0.10);
    core.name = reality.id + ' local world core';
    group.add(core);

    const railMaterial = new THREE.MeshStandardMaterial({
      color: reality.class === 'cardinal' ? 0x2a76a8 : 0x684ca8,
      emissive: reality.class === 'cardinal' ? 0x0d314c : 0x24153c,
      emissiveIntensity: 0.7,
      metalness: 0.22,
      roughness: 0.4,
    });
    materials.push(railMaterial);
    for (const x of [-0.42, 0.42]) {
      const rail = new THREE.Mesh(localRailGeometry, railMaterial);
      rail.position.set(x, -0.42, -0.05);
      group.add(rail);
    }

    const arrow = new THREE.ArrowHelper(direction, new THREE.Vector3(0, 0, 0.88), 0.56,
      reality.class === 'cardinal' ? 0x7ad8ff : 0xc39bff, 0.18, 0.11);
    arrow.name = reality.id + ' outward direction';
    group.add(arrow);

    const label = makeLabel(reality.id + ' · ' + reality.label.toUpperCase());
    group.add(label);

    group.scale.setScalar(1);
    root.add(group);
    nodes.set(reality.id, chamber);
    nodeGroups.set(reality.id, group);
  }

  const alternateGeometry = new THREE.BufferGeometry();
  const alternatePositions = [];
  const primaryDefinitions = [...field.realties.values()].map(reality => ({
    id: reality.id,
    vector: reality.address.vector,
  }));
  const alternateStates = expandLattice(primaryDefinitions, { spread: 0.46 });
  const primaryPositionById = new Map(
    [...field.realties.values()].map(reality => [reality.id, positionFor(reality)]),
  );
  for (const alternate of alternateStates) {
    const base = primaryPositionById.get(alternate.primaryId);
    alternatePositions.push(
      base.x + alternate.offset[0],
      base.y + alternate.offset[1],
      base.z + alternate.offset[2],
    );
  }
  alternateGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(alternatePositions, 3),
  );
  const alternateMaterial = new THREE.PointsMaterial({
    color: 0x75d9ff,
    size: 0.075,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    sizeAttenuation: true,
  });
  materials.push(alternateMaterial);
  geometries.push(alternateGeometry);
  const alternatePoints = new THREE.Points(alternateGeometry, alternateMaterial);
  alternatePoints.name = '576 alternate state points';
  alternatePoints.userData.count = FIRST_ORDER_ALTERNATE_COUNT;
  alternateGroup.add(alternatePoints);

  function clearGroup(group) {
    while (group.children.length) group.remove(group.children[group.children.length - 1]);
  }

  function rebuildReferenceSpokes() {
    clearGroup(referenceGroup);

    for (const [realityId, group] of nodeGroups) {
      const reality = field.getReality(realityId);
      const direction = vectorFor(reality);
      const start = direction.clone().multiplyScalar(0.38);
      const end = group.position.clone().sub(direction.clone().multiplyScalar(0.84));
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const material = new THREE.LineBasicMaterial({
        color: 0x294768,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      });
      materials.push(material);
      geometries.push(geometry);
      const line = new THREE.Line(geometry, material);
      line.name = 'Nucleus reference spoke ' + realityId;
      referenceGroup.add(line);
    }
  }

  function rebuildEdges() {
    clearGroup(edgesGroup);

    for (const edge of field.edges.values()) {
      if (!edge.active) continue;
      const from = nodeGroups.get(edge.from);
      const to = nodeGroups.get(edge.to);
      if (!from || !to) continue;

      const a = from.position.clone();
      const b = to.position.clone();
      const direction = b.clone().sub(a).normalize();
      const pa = a.add(direction.clone().multiplyScalar(0.78));
      const pb = b.sub(direction.clone().multiplyScalar(0.78));

      const geometry = new THREE.BufferGeometry().setFromPoints([pa, pb]);
      geometries.push(geometry);

      const material = edge.type === 'fold'
        ? new THREE.LineDashedMaterial({
            color: 0xffc45c,
            dashSize: 0.16,
            gapSize: 0.11,
            transparent: true,
            opacity: 0.92,
            depthWrite: false,
          })
        : new THREE.LineBasicMaterial({
            color: 0x6be0ff,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
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
    if (id !== 'NUCLEUS' && !nodeGroups.has(id)) throw new Error('Unknown reality: ' + id);
    selectedId = id;

    for (const [realityId, group] of nodeGroups) {
      const state = field.getReality(realityId).localState;
      const chamber = nodes.get(realityId);
      chamber.material = realityId === selectedId ? selectedMaterial :
        field.getReality(realityId).address.vector.filter(Boolean).length === 1
          ? cardinalMaterial
          : diagonalMaterial;
      group.scale.setScalar(realityId === selectedId ? 1.22 : 1 + Math.min(0.08, Number(state.activity || 0) * 0.08));
    }
    nucleus.scale.setScalar(selectedId === 'NUCLEUS' ? 1.35 : 1);
    return selectedId;
  }

  function animate(timeSeconds = 0) {
    for (const [realityId, group] of nodeGroups) {
      const state = field.getReality(realityId).localState;
      const activity = Math.max(0, Math.min(1, Number(state.activity || 0)));
      const selectedBoost = realityId === selectedId ? 0.09 : 0;
      const pulse = 0.012 * Math.sin(timeSeconds * 2.2 + realityId.charCodeAt(1));
      group.scale.setScalar(1 + activity * 0.08 + selectedBoost + pulse);
    }

    nucleus.rotation.x = timeSeconds * 0.24;
    nucleus.rotation.y = timeSeconds * 0.37;
    nucleus.rotation.z = timeSeconds * 0.17;
    alternatePoints.rotation.y = timeSeconds * 0.035;
    alternatePoints.rotation.x = Math.sin(timeSeconds * 0.18) * 0.025;
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
      realityCount: nodeGroups.size,
      alternateStateCount: FIRST_ORDER_ALTERNATE_COUNT,
      activeConnectionCount: [...field.edges.values()].filter(edge => edge.active).length,
      foldCount: field.folds.size,
      referenceSpokes: nodeGroups.size,
      nucleusPosition: nucleus.position.toArray(),
      directionallyOriented: true,
    sharedNucleus: true,
    alternateStatesAreLocal: true,
    };
  }

  function destroy() {
    root.removeFromParent();
    for (const geometry of geometries) {
      try { geometry.dispose?.(); } catch {}
    }
    for (const material of materials) {
      try { material.dispose?.(); } catch {}
    }
  }

  rebuildReferenceSpokes();
  rebuildEdges();

  return Object.freeze({
    root,
    nucleus,
    nodes,
    nodeGroups,
    selectReality,
    animate,
    update,
    getSnapshot,
    destroy,
  });
}
