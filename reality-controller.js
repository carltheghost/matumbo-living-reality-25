import { RealityField } from './reality-field.js';

const HELP = [
  'SHOW FIELD',
  'SELECT R07',
  'ENTER R07',
  'RETURN TO NUCLEUS',
  'CONNECT R01 R07',
  'DISCONNECT edge:R01->R07:1',
  'FOLD R07 R18',
  'TRACE R01 R18',
  'BRANCH R07 branch-a',
  'EMIT R07 pulse',
  'SET R07 status=active activity=0.9',
  'STEP 16',
  'STATS',
  'SNAPSHOT',
  'HISTORY',
].join('\n');

function parseAssignments(tokens) {
  const patch = {};
  for (const token of tokens) {
    const index = token.indexOf('=');
    if (index <= 0) continue;
    const key = token.slice(0, index);
    const raw = token.slice(index + 1);
    patch[key] = raw === 'true' ? true :
      raw === 'false' ? false :
      raw !== '' && Number.isFinite(Number(raw)) ? Number(raw) : raw;
  }
  return patch;
}

export function createRealityController(field = new RealityField()) {
  const run = input => {
    if (typeof input !== 'string') throw new TypeError('Controller command must be a string');
    const tokens = input.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return { ok: true, command: '', result: field.inspect() };

    const command = tokens[0].toUpperCase();

    switch (command) {
      case 'HELP':
        return { ok: true, command, result: HELP };
      case 'SHOW':
        if ((tokens[1] || '').toUpperCase() !== 'FIELD') throw new Error('Use SHOW FIELD');
        return { ok: true, command, result: field.inspect() };
      case 'SELECT':
        return { ok: true, command, result: field.inspect(tokens[1]) };
      case 'ENTER':
        return { ok: true, command, result: field.enter(tokens[1], tokens[2] || 'root') };
      case 'RETURN':
        if ((tokens[1] || '').toUpperCase() !== 'TO' || (tokens[2] || '').toUpperCase() !== 'NUCLEUS') {
          throw new Error('Use RETURN TO NUCLEUS');
        }
        return { ok: true, command, result: field.returnToNucleus() };
      case 'CONNECT':
        return { ok: true, command, result: field.connect(tokens[1], tokens[2]) };
      case 'DISCONNECT':
        return { ok: true, command, result: { disconnected: field.disconnect(tokens[1]), edgeId: tokens[1] } };
      case 'FOLD':
        return { ok: true, command, result: field.fold(tokens[1], tokens[2]) };
      case 'TRACE':
        return { ok: true, command, result: field.trace(tokens[1], tokens[2]) };
      case 'BRANCH':
        return { ok: true, command, result: field.branch(tokens[1], { id: tokens[2] }) };
      case 'EMIT':
        return { ok: true, command, result: field.emit(tokens[1], { type: tokens[2] || 'event' }) };
      case 'SET':
        return { ok: true, command, result: field.mutateReality(tokens[1], parseAssignments(tokens.slice(2))) };
      case 'STEP': {
        const amount = tokens[1] === undefined ? 1 : Number(tokens[1]);
        if (!Number.isFinite(amount) || amount < 0) throw new Error('STEP requires a non-negative number');
        return { ok: true, command, result: field.step(amount) };
      }
      case 'STATS':
        return { ok: true, command, result: field.stats() };
      case 'SNAPSHOT':
        return { ok: true, command, result: field.snapshot() };
      case 'HISTORY':
        return { ok: true, command, result: [...field.history] };
      default:
        throw new Error('Unknown command: ' + tokens[0]);
    }
  };

  return Object.freeze({ field, run, help: () => HELP });
}
