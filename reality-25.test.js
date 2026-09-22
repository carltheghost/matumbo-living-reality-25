import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NUCLEUS,
  REALITY_DIRECTIONS,
  RealityField,
  createRealityController,
  validateLattice,
  expansionCount,
  expansionSummary,
  expandLattice,
  create36x36Lattice,
  expansion36Summary,
} from './index.js';

test('lattice has one nucleus and 18 primary realities', () => {
  assert.equal(validateLattice(), true);
  assert.deepEqual(NUCLEUS.vector, [0, 0, 0]);
  assert.equal(REALITY_DIRECTIONS.length, 18);
  assert.equal(REALITY_DIRECTIONS.filter(value => value.class === 'cardinal').length, 6);
  assert.equal(REALITY_DIRECTIONS.filter(value => value.class === 'diagonal').length, 12);
});

test('nucleus is not a routing bottleneck', () => {
  const field = new RealityField();
  field.connect('R01', 'R07');
  field.connect('R07', 'R15');
  field.connect('R15', 'R18');
  const trace = field.trace('R01', 'R18');
  assert.deepEqual(trace.path, ['R01', 'R07', 'R15', 'R18']);
  assert.equal(trace.edges.length, 3);
});

test('fold opens a direct reality-to-reality path', () => {
  const field = new RealityField();
  field.fold('R01', 'R18');
  const trace = field.trace('R01', 'R18');
  assert.equal(trace.found, true);
  assert.deepEqual(trace.path, ['R01', 'R18']);
  assert.equal(trace.edges.length, 1);
});

test('branches live inside a reality and do not create extra primary realities', () => {
  const field = new RealityField();
  field.branch('R07', { id: 'branch-a', state: { energy: 0.73 } });
  const inspected = field.inspect('R07');
  assert.equal(field.realties.size, 18);
  assert.equal(inspected.branches.length, 1);
  assert.equal(inspected.branches[0].id, 'branch-a');
});

test('controller supports conversational control commands', () => {
  const controller = createRealityController();
  assert.equal(controller.run('SHOW FIELD').result.mode, 'nucleus');
  controller.run('CONNECT R01 R07');
  controller.run('CONNECT R07 R18');
  assert.equal(controller.run('TRACE R01 R18').result.found, true);
  controller.run('ENTER R07');
  assert.equal(controller.field.session.currentRealityId, 'R07');
  controller.run('RETURN TO NUCLEUS');
  assert.equal(controller.field.session.currentRealityId, null);
});


test('field advances every reality without central routing', () => {
  const field = new RealityField();
  const before = [...field.realties.values()].map(reality => reality.timeline.tick);
  field.step(8);
  const after = [...field.realties.values()].map(reality => reality.timeline.tick);
  assert.equal(after.length, 18);
  assert.deepEqual(after, before.map(value => value + 8));
  assert.equal(field.nucleus.vector.join(','), '0,0,0');
});

test('events increase local activity and remain reality-local', () => {
  const field = new RealityField();
  const before = field.getReality('R07').localState.activity;
  field.emit('R07', { type: 'pulse', payload: { strength: 3 } });
  const reality = field.getReality('R07');
  assert.equal(reality.events.length, 1);
  assert.ok(reality.localState.activity > before);
  assert.equal(field.getReality('R08').events.length, 0);
});


test('18 primary directions expand to 576 first-order alternate states', () => {
  const field = new RealityField();
  const primaries = [...field.realties.values()].map(reality => ({
    id: reality.id,
    vector: reality.address.vector,
  }));
  const alternates = expandLattice(primaries);
  assert.equal(alternates.length, 576);
  assert.equal(new Set(alternates.map(value => value.id)).size, 576);
  assert.equal(new Set(alternates.map(value => value.primaryId)).size, 18);
  assert.equal(alternates.filter(value => value.primaryId === 'R01').length, 32);
  assert.equal(expansionCount(18, 1), 576);
  assert.equal(expansionCount(18, 2), 18432);
});

test('expansion keeps one shared nucleus reference', () => {
  const summary = expansionSummary();
  assert.deepEqual(summary.nucleus, [0, 0, 0]);
  assert.equal(summary.formula, '18 × 32 = 576');
  assert.equal(summary.firstOrderAlternates, 576);
  assert.equal(summary.secondOrderStates, 18432);
  assert.equal(summary.thirdOrderStates, 589824);
});


test('36 x 36 experiment creates 1,296 states around one nucleus', () => {
  const lattice = create36x36Lattice();
  assert.equal(lattice.length, 1296);
  assert.equal(new Set(lattice.map(value => value.direction)).size, 36);
  assert.equal(new Set(lattice.map(value => value.local)).size, 36);
  assert.deepEqual(lattice[0].nucleus, [0, 0, 0]);

  const summary = expansion36Summary();
  assert.equal(summary.total, 1296);
  assert.equal(summary.squareRootOf36, 6);
  assert.equal(summary.squareOf36, 1296);
  assert.equal(summary.sixthPowerOf36, 2176782336);
});
