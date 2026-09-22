import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NUCLEUS,
  REALITY_DIRECTIONS,
  RealityField,
  createRealityController,
  validateLattice,
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
