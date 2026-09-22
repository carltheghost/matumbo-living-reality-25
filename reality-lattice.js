/**
 * Reality .25 — canonical 18-direction lattice.
 * One shared nucleus, 18 primary vectors, no routing bottleneck.
 */
export const NUCLEUS = Object.freeze({
  id: 'NUCLEUS',
  vector: Object.freeze([0, 0, 0]),
  kind: 'nucleus',
});

const defs = [
  ['R01', [ 1, 0, 0], 'cardinal', 'east'],
  ['R02', [-1, 0, 0], 'cardinal', 'west'],
  ['R03', [ 0, 1, 0], 'cardinal', 'north'],
  ['R04', [ 0,-1, 0], 'cardinal', 'south'],
  ['R05', [ 0, 0, 1], 'cardinal', 'up'],
  ['R06', [ 0, 0,-1], 'cardinal', 'down'],
  ['R07', [ 1, 1, 0], 'diagonal', 'east-north'],
  ['R08', [ 1,-1, 0], 'diagonal', 'east-south'],
  ['R09', [-1, 1, 0], 'diagonal', 'west-north'],
  ['R10', [-1,-1, 0], 'diagonal', 'west-south'],
  ['R11', [ 1, 0, 1], 'diagonal', 'east-up'],
  ['R12', [ 1, 0,-1], 'diagonal', 'east-down'],
  ['R13', [-1, 0, 1], 'diagonal', 'west-up'],
  ['R14', [-1, 0,-1], 'diagonal', 'west-down'],
  ['R15', [ 0, 1, 1], 'diagonal', 'north-up'],
  ['R16', [ 0, 1,-1], 'diagonal', 'north-down'],
  ['R17', [ 0,-1, 1], 'diagonal', 'south-up'],
  ['R18', [ 0,-1,-1], 'diagonal', 'south-down'],
];

export const REALITY_DIRECTIONS = Object.freeze(
  defs.map(([id, vector, className, label]) => Object.freeze({
    id,
    vector: Object.freeze([...vector]),
    class: className,
    label,
    magnitude: Math.hypot(...vector),
  })),
);

export const REALITY_BY_ID = Object.freeze(
  Object.fromEntries(REALITY_DIRECTIONS.map(value => [value.id, value])),
);

export function vectorKey(vector) {
  if (!Array.isArray(vector) || vector.length !== 3 || !vector.every(Number.isFinite)) {
    throw new TypeError('A reality vector must be [x,y,z] with finite numbers');
  }
  return vector.join(',');
}

export function vectorDistance(a, b = NUCLEUS.vector) {
  if (!Array.isArray(a) || a.length !== 3 || !Array.isArray(b) || b.length !== 3) {
    throw new TypeError('Both vectors must contain three coordinates');
  }
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function normalizeDirection(vector) {
  const magnitude = Math.hypot(...vector);
  return magnitude === 0 ? [0, 0, 0] : vector.map(value => value / magnitude);
}

export function directionFor(id) {
  const value = REALITY_BY_ID[id];
  if (!value) throw new Error('Unknown primary reality: ' + id);
  return value;
}

export function classifyVector(vector) {
  const nonZero = vector.filter(value => value !== 0).length;
  if (nonZero === 0) return 'nucleus';
  if (nonZero === 1) return 'cardinal';
  if (nonZero === 2) return 'diagonal';
  return 'derived';
}

export function nearbyPrimaryDirections(vector) {
  const out = [];
  for (const reality of REALITY_DIRECTIONS) {
    const sharesSignedAxis = reality.vector.every((component, axis) =>
      component === 0 || vector[axis] === 0 || Math.sign(component) === Math.sign(vector[axis])
    );
    if (sharesSignedAxis) out.push(reality.id);
  }
  return out;
}

export function createPrimaryAddress(id, depth = 0, branch = 'root') {
  const direction = directionFor(id);
  if (!Number.isInteger(depth) || depth < 0) throw new RangeError('depth must be a non-negative integer');
  if (typeof branch !== 'string' || !branch) throw new TypeError('branch must be a non-empty string');
  return Object.freeze({
    realityId: id,
    vector: direction.vector,
    direction: normalizeDirection(direction.vector),
    depth,
    branch,
  });
}

export function validateLattice() {
  const ids = new Set(REALITY_DIRECTIONS.map(value => value.id));
  if (ids.size !== 18) throw new Error('Reality lattice must contain exactly 18 primary realities');
  if (REALITY_DIRECTIONS.filter(value => value.class === 'cardinal').length !== 6) {
    throw new Error('Reality lattice must contain exactly 6 cardinal directions');
  }
  if (REALITY_DIRECTIONS.filter(value => value.class === 'diagonal').length !== 12) {
    throw new Error('Reality lattice must contain exactly 12 diagonal directions');
  }
  return true;
}
