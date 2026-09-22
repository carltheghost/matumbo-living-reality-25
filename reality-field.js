import {
  NUCLEUS,
  REALITY_DIRECTIONS,
  REALITY_BY_ID,
  createPrimaryAddress,
  normalizeDirection,
  vectorDistance,
  vectorKey,
} from './reality-lattice.js';

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const now = () => Date.now();

function assertId(id) {
  if (!REALITY_BY_ID[id]) throw new Error('Unknown primary reality: ' + id);
}

export class RealityNode {
  constructor({ id, address, localState = {}, timeline = { phase: 0, tick: 0 }, rules = {} } = {}) {
    if (typeof id !== 'string' || !id) throw new TypeError('RealityNode.id is required');
    this.id = id;
    this.address = Object.freeze({ ...address });
    this.localState = {
      status: 'active',
      activity: 0.35,
      occupancy: 0,
      ...clone(localState),
    };
    this.timeline = { phase: 0, tick: 0, ...clone(timeline) };
    this.rules = clone(rules);
    this.entities = new Map();
    this.events = [];
    this.branches = new Map();
    this.phase = 'active';
    this.createdAt = now();
  }

  setState(patch = {}) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      throw new TypeError('state patch must be an object');
    }
    Object.assign(this.localState, clone(patch));
    return this.snapshot();
  }

  addEntity(entity) {
    if (!entity || typeof entity.id !== 'string' || !entity.id) {
      throw new TypeError('entity.id is required');
    }
    this.entities.set(entity.id, clone(entity));
    this.localState.occupancy = this.entities.size;
    return entity.id;
  }

  removeEntity(id) {
    const removed = this.entities.delete(id);
    this.localState.occupancy = this.entities.size;
    return removed;
  }

  emitEvent(event = {}) {
    const record = {
      id: event.id || 'evt_' + this.id + '_' + (this.events.length + 1),
      type: event.type || 'event',
      payload: clone(event.payload || {}),
      timestamp: event.timestamp || now(),
    };
    this.events.push(record);
    if (this.events.length > 500) this.events.shift();
    this.localState.activity = Math.min(1, Number(this.localState.activity || 0) + 0.12);
    return clone(record);
  }

  createBranch({ id, state = {}, timeline = {}, rules = {} } = {}) {
    if (typeof id !== 'string' || !id) throw new TypeError('branch id is required');
    if (this.branches.has(id)) throw new Error('Branch already exists: ' + id);
    const branch = {
      id,
      parentRealityId: this.id,
      state: clone(state),
      timeline: clone(timeline),
      rules: clone(rules),
      createdAt: now(),
    };
    this.branches.set(id, branch);
    return clone(branch);
  }

  advance(delta = 1) {
    if (!Number.isFinite(delta) || delta < 0) throw new RangeError('delta must be a finite non-negative number');
    this.timeline.tick += delta;
    this.timeline.phase = (this.timeline.phase + delta * 0.001) % 1;

    const activity = Number(this.localState.activity || 0);
    const decay = Math.min(0.01 * delta, 0.15);
    this.localState.activity = Math.max(0, activity - decay);
    return this.snapshot();
  }

  snapshot() {
    return {
      id: this.id,
      address: clone(this.address),
      localState: clone(this.localState),
      timeline: clone(this.timeline),
      rules: clone(this.rules),
      entities: [...this.entities.values()].map(clone),
      events: this.events.map(clone),
      branches: [...this.branches.values()].map(clone),
      phase: this.phase,
      createdAt: this.createdAt,
    };
  }
}

export class RealityEdge {
  constructor({ id, from, to, type = 'direct', weight = 1, metadata = {} } = {}) {
    if (!id || !from || !to) throw new TypeError('RealityEdge requires id, from and to');
    this.id = id;
    this.from = from;
    this.to = to;
    this.type = type;
    this.weight = Number.isFinite(weight) ? weight : 1;
    this.metadata = clone(metadata);
    this.active = true;
    this.createdAt = now();
  }

  snapshot() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      type: this.type,
      weight: this.weight,
      metadata: clone(this.metadata),
      active: this.active,
      createdAt: this.createdAt,
    };
  }
}

export class RealityField {
  constructor({ clock = now } = {}) {
    this.clock = clock;
    this.nucleus = Object.freeze({
      ...NUCLEUS,
      createdAt: this.clock(),
      invariant: 'shared-origin',
    });
    this.realties = new Map();
    this.edges = new Map();
    this.folds = new Map();
    this.history = [];
    this.session = { currentRealityId: null, currentBranch: 'root' };

    for (const definition of REALITY_DIRECTIONS) {
      this.realties.set(
        definition.id,
        new RealityNode({
          id: definition.id,
          address: createPrimaryAddress(definition.id),
          localState: {
            status: 'active',
            activity: definition.class === 'cardinal' ? 0.42 : 0.58,
            occupancy: 0,
          },
          timeline: { phase: 0, tick: 0 },
          rules: { inheritedFromNucleus: true },
        }),
      );
      this._record({
        type: 'reality-created',
        realityId: definition.id,
        vector: definition.vector,
      });
    }
  }

  _record(event) {
    this.history.push({ timestamp: this.clock(), ...clone(event) });
    if (this.history.length > 10000) this.history.shift();
  }

  getReality(id) {
    assertId(id);
    return this.realties.get(id);
  }

  connect(from, to, options = {}) {
    assertId(from);
    assertId(to);
    if (from === to) throw new Error('A reality cannot connect to itself');
    const id = options.id || 'edge:' + from + '->' + to + ':' + (this.edges.size + 1);
    if (this.edges.has(id)) throw new Error('Connection already exists: ' + id);

    const edge = new RealityEdge({
      id,
      from,
      to,
      type: options.type || 'direct',
      weight: options.weight === undefined ? 1 : options.weight,
      metadata: options.metadata || {},
    });
    this.edges.set(id, edge);
    this._record({ type: 'edge-opened', edge: edge.snapshot() });
    return edge.snapshot();
  }

  disconnect(edgeId) {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;
    edge.active = false;
    this._record({ type: 'edge-closed', edgeId });
    return true;
  }

  fold(from, to, metadata = {}) {
    const id = metadata.id || 'fold:' + from + '->' + to + ':' + (this.folds.size + 1);
    const edge = this.connect(from, to, {
      id,
      type: 'fold',
      weight: metadata.weight === undefined ? 0.25 : metadata.weight,
      metadata: { ...metadata, fold: true },
    });
    this.folds.set(id, edge.id);
    this._record({ type: 'fold-opened', edgeId: edge.id, from, to });
    return edge;
  }

  branch(realityId, options = {}) {
    const reality = this.getReality(realityId);
    const branch = reality.createBranch(options);
    this._record({ type: 'branch-created', realityId, branchId: branch.id });
    return branch;
  }

  mutateReality(realityId, patch) {
    const reality = this.getReality(realityId);
    const snapshot = reality.setState(patch);
    this._record({ type: 'reality-mutated', realityId, patch: clone(patch) });
    return snapshot;
  }

  emit(realityId, event = {}) {
    const reality = this.getReality(realityId);
    const record = reality.emitEvent(event);
    this._record({ type: 'reality-event', realityId, event: record });
    return record;
  }

  enter(realityId, branch = 'root') {
    assertId(realityId);
    const reality = this.getReality(realityId);
    if (branch !== 'root' && !reality.branches.has(branch)) {
      throw new Error('Unknown branch ' + branch + ' in ' + realityId);
    }
    this.session.currentRealityId = realityId;
    this.session.currentBranch = branch;
    reality.localState.activity = Math.min(1, Number(reality.localState.activity || 0) + 0.08);
    this._record({ type: 'entered', realityId, branch });
    return this.inspect(realityId, branch);
  }

  returnToNucleus() {
    const previous = { ...this.session };
    this.session.currentRealityId = null;
    this.session.currentBranch = 'root';
    this._record({ type: 'returned-to-nucleus', previous });
    return this.inspect();
  }

  step(delta = 1) {
    for (const reality of this.realties.values()) {
      reality.advance(delta);
    }
    this._record({ type: 'field-step', delta });
    return this.inspect();
  }

  activeNeighbors(realityId) {
    assertId(realityId);
    const neighbors = [];
    for (const edge of this.edges.values()) {
      if (!edge.active) continue;
      if (edge.from === realityId) neighbors.push({ via: edge.id, realityId: edge.to, direction: 'out', type: edge.type });
      if (edge.to === realityId) neighbors.push({ via: edge.id, realityId: edge.from, direction: 'in', type: edge.type });
    }
    return neighbors;
  }

  trace(from, to, { maxDepth = 32, includeInactive = false } = {}) {
    assertId(from);
    assertId(to);
    if (from === to) return { found: true, path: [from], edges: [], depth: 0 };

    const queue = [{ id: from, path: [from], edges: [] }];
    const visited = new Set([from]);

    while (queue.length) {
      const current = queue.shift();
      if (current.edges.length >= maxDepth) continue;

      for (const edge of this.edges.values()) {
        if (!includeInactive && !edge.active) continue;
        let next = null;
        if (edge.from === current.id) next = edge.to;
        else if (edge.to === current.id) next = edge.from;
        if (!next || visited.has(next)) continue;

        const nextState = {
          id: next,
          path: [...current.path, next],
          edges: [...current.edges, edge.id],
        };
        if (next === to) {
          return {
            found: true,
            path: nextState.path,
            edges: nextState.edges,
            depth: nextState.edges.length,
          };
        }
        visited.add(next);
        queue.push(nextState);
      }
    }

    return { found: false, path: [], edges: [], depth: null };
  }

  address(realityId) {
    assertId(realityId);
    const reality = this.getReality(realityId);
    return {
      nucleus: this.nucleus.vector,
      reality: reality.address.vector,
      direction: normalizeDirection(reality.address.vector),
      distanceFromNucleus: vectorDistance(reality.address.vector, this.nucleus.vector),
      key: vectorKey(reality.address.vector),
    };
  }

  stats() {
    const realities = [...this.realties.values()];
    return {
      realities: realities.length,
      activeRealities: realities.filter(reality => reality.localState.status === 'active').length,
      branches: realities.reduce((sum, reality) => sum + reality.branches.size, 0),
      events: realities.reduce((sum, reality) => sum + reality.events.length, 0),
      activeConnections: [...this.edges.values()].filter(edge => edge.active).length,
      folds: this.folds.size,
      currentRealityId: this.session.currentRealityId,
      totalTicks: realities.reduce((sum, reality) => sum + reality.timeline.tick, 0),
    };
  }

  inspect(realityId = null, branch = 'root') {
    if (realityId == null) {
      return {
        mode: 'nucleus',
        nucleus: clone(this.nucleus),
        ...this.stats(),
        session: clone(this.session),
      };
    }

    const reality = this.getReality(realityId);
    const neighbors = this.activeNeighbors(realityId);
    return {
      mode: 'reality',
      ...reality.snapshot(),
      address: this.address(realityId),
      connected: neighbors.map(item => item.realityId),
      connections: neighbors,
      branch,
    };
  }

  snapshot() {
    return {
      schema: 'reality-25',
      version: 2,
      nucleus: clone(this.nucleus),
      realities: [...this.realties.values()].map(reality => reality.snapshot()),
      edges: [...this.edges.values()].map(edge => edge.snapshot()),
      folds: [...this.folds.entries()].map(([id, edgeId]) => ({ id, edgeId })),
      session: clone(this.session),
    };
  }

  exportState() {
    return JSON.stringify(this.snapshot(), null, 2);
  }
}
