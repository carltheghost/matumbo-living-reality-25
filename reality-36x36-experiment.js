/**
 * 36 × 36 expansion experiment.
 *
 * This is intentionally separate from the canonical 18 × 32 layer.
 *
 * 36 × 36 = 1,296
 * sqrt(36) = 6
 * 36^2 = 1,296
 * 36^6 = 2,176,782,336
 *
 * The experiment treats 36 as a two-axis lattice: 36 directional slots and
 * 36 local states per slot. It still uses one shared nucleus.
 */

export const EXPERIMENT_AXIS_SIZE = 36;
export const EXPERIMENT_TOTAL = EXPERIMENT_AXIS_SIZE ** 2;
export const ROOT_36 = Math.sqrt(EXPERIMENT_AXIS_SIZE);
export const SIXTH_POWER_36 = EXPERIMENT_AXIS_SIZE ** 6;

export function create36x36Lattice(options = {}) {
  const radius = Number.isFinite(options.radius) ? options.radius : 1;
  const items = [];

  for (let direction = 0; direction < 36; direction += 1) {
    const theta = (direction / 36) * Math.PI * 2;
    const localDirection = [Math.cos(theta), 0, Math.sin(theta)];

    for (let local = 0; local < 36; local += 1) {
      const phi = (local / 36) * Math.PI * 2;
      const ring = radius * (0.45 + 0.55 * ((local % 6) / 5));
      items.push(Object.freeze({
        id: 'D' + String(direction + 1).padStart(2, '0') +
          ':L' + String(local + 1).padStart(2, '0'),
        direction,
        local,
        code: direction.toString(36).toUpperCase() + '-' + local.toString(36).toUpperCase(),
        vector: Object.freeze([
          localDirection[0] * ring * Math.cos(phi),
          Math.sin(phi) * ring * 0.55,
          localDirection[2] * ring * Math.cos(phi),
        ]),
        nucleus: Object.freeze([0, 0, 0]),
      }));
    }
  }

  return Object.freeze(items);
}

export function expansion36Summary() {
  return Object.freeze({
    expression: '36 × 36',
    total: EXPERIMENT_TOTAL,
    squareRootOf36: ROOT_36,
    squareOf36: EXPERIMENT_TOTAL,
    sixthPowerOf36: SIXTH_POWER_36,
    sharedNucleus: [0, 0, 0],
  });
}
