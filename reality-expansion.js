/**
 * Reality .25 — hierarchical expansion layer.
 *
 * The 18 primary directions remain the canonical field:
 *   6 cardinal + 12 diagonal = 18.
 *
 * Each primary reality can expose 32 local alternate states.
 * That gives 18 × 32 = 576 first-order alternate states.
 *
 * These are model states in the lattice, not a claim about physical
 * parallel universes. The nucleus remains one shared reference.
 */

export const ALTERNATE_STATES_PER_PRIMARY = 32;
export const PRIMARY_REALITY_COUNT = 18;
export const FIRST_ORDER_ALTERNATE_COUNT =
  PRIMARY_REALITY_COUNT * ALTERNATE_STATES_PER_PRIMARY;

function grayCode(value) {
  return value ^ (value >> 1);
}

function bits5(value) {
  const gray = grayCode(value);
  return Array.from({ length: 5 }, (_, index) => (gray >> (4 - index)) & 1);
}

function basisFor(vector) {
  const [x, y, z] = vector;
  const length = Math.hypot(x, y, z) || 1;
  const n = [x / length, y / length, z / length];

  // Pick a stable reference axis that is not parallel to n.
  const reference = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const cross = [
    n[1] * reference[2] - n[2] * reference[1],
    n[2] * reference[0] - n[0] * reference[2],
    n[0] * reference[1] - n[1] * reference[0],
  ];
  const crossLength = Math.hypot(...cross) || 1;
  const u = cross.map(value => value / crossLength);
  const v = [
    n[1] * u[2] - n[2] * u[1],
    n[2] * u[0] - n[0] * u[2],
    n[0] * u[1] - n[1] * u[0],
  ];
  return { n, u, v };
}

function localOffset(vector, index, spread = 0.34) {
  const bits = bits5(index);
  const { n, u, v } = basisFor(vector);

  const a = (bits[0] * 2 - 1) * spread;
  const b = (bits[1] * 2 - 1) * spread;
  const c = (bits[2] * 2 - 1) * spread * 0.72;
  const ring = (index % 8) / 8 * Math.PI * 2;
  const ringRadius = (0.5 + bits[3] * 0.5) * spread * 0.72;
  const radial = [
    u[0] * Math.cos(ring) * ringRadius + v[0] * Math.sin(ring) * ringRadius,
    u[1] * Math.cos(ring) * ringRadius + v[1] * Math.sin(ring) * ringRadius,
    u[2] * Math.cos(ring) * ringRadius + v[2] * Math.sin(ring) * ringRadius,
  ];

  const depth = (bits[4] * 2 - 1) * spread * 0.46;
  return [
    a * u[0] + b * v[0] + c * n[0] + radial[0] + depth * n[0],
    a * u[1] + b * v[1] + c * n[1] + radial[1] + depth * n[1],
    a * u[2] + b * v[2] + c * n[2] + radial[2] + depth * n[2],
  ];
}

export function createAlternateState(primary, index, options = {}) {
  if (!primary || typeof primary.id !== 'string') {
    throw new TypeError('primary reality is required');
  }
  if (!Number.isInteger(index) || index < 0 || index >= ALTERNATE_STATES_PER_PRIMARY) {
    throw new RangeError('alternate index must be an integer from 0 through 31');
  }

  const spread = Number.isFinite(options.spread) ? options.spread : 0.34;
  const offset = localOffset(primary.vector, index, spread);
  const bits = bits5(index);

  return Object.freeze({
    id: primary.id + ':A' + String(index + 1).padStart(2, '0'),
    primaryId: primary.id,
    index,
    code: bits.join(''),
    vector: Object.freeze(primary.vector.map((value, axis) => value + offset[axis])),
    offset: Object.freeze(offset),
    layer: options.layer || 1,
  });
}

export function expandPrimaryReality(primary, options = {}) {
  return Object.freeze(
    Array.from({ length: ALTERNATE_STATES_PER_PRIMARY }, (_, index) =>
      createAlternateState(primary, index, options),
    ),
  );
}

export function expandLattice(realities, options = {}) {
  if (!Array.isArray(realities)) throw new TypeError('realities must be an array');
  const alternates = realities.flatMap(primary => expandPrimaryReality(primary, options));
  return Object.freeze(alternates);
}

export function expansionCount(primaryCount = PRIMARY_REALITY_COUNT, levels = 1) {
  if (!Number.isInteger(primaryCount) || primaryCount < 0) {
    throw new RangeError('primaryCount must be a non-negative integer');
  }
  if (!Number.isInteger(levels) || levels < 0) {
    throw new RangeError('levels must be a non-negative integer');
  }
  return primaryCount * (ALTERNATE_STATES_PER_PRIMARY ** levels);
}

export function expansionSummary(primaryCount = PRIMARY_REALITY_COUNT) {
  return Object.freeze({
    formula: '18 × 32 = 576',
    primaryRealities: primaryCount,
    alternatesPerPrimary: ALTERNATE_STATES_PER_PRIMARY,
    firstOrderAlternates: expansionCount(primaryCount, 1),
    secondOrderStates: expansionCount(primaryCount, 2),
    thirdOrderStates: expansionCount(primaryCount, 3),
    nucleus: [0, 0, 0],
  });
}
