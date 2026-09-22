export {
  NUCLEUS,
  REALITY_DIRECTIONS,
  REALITY_BY_ID,
  vectorKey,
  vectorDistance,
  normalizeDirection,
  directionFor,
  classifyVector,
  nearbyPrimaryDirections,
  createPrimaryAddress,
  validateLattice,
} from './reality-lattice.js';

export {
  RealityNode,
  RealityEdge,
  RealityField,
} from './reality-field.js';

export { createRealityController } from './reality-controller.js';
export { buildRealityFieldScene } from './reality-field-scene.js';
export {
  ALTERNATE_STATES_PER_PRIMARY,
  PRIMARY_REALITY_COUNT,
  FIRST_ORDER_ALTERNATE_COUNT,
  createAlternateState,
  expandPrimaryReality,
  expandLattice,
  expansionCount,
  expansionSummary,
} from './reality-expansion.js';
export {
  EXPERIMENT_AXIS_SIZE,
  EXPERIMENT_TOTAL,
  ROOT_36,
  SIXTH_POWER_36,
  create36x36Lattice,
  expansion36Summary,
} from './reality-36x36-experiment.js';
