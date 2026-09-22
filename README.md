# maTumbo Living Reality — Reality .25

Reality .25 is a standalone experimental 18-direction reality architecture.

## Core model

There is exactly one shared nucleus:

    NUCLEUS = (0,0,0)

The nucleus is an anchor/reference, not a transport hub.

There are 18 primary reality directions:
- 6 cardinal directions
- 12 diagonal/edge directions

Every primary reality owns its own local state, entities, timeline, rules, events, and branches.

Reality-to-reality connections are independent from the nucleus. Connections can open, close, branch, and fold dynamically.

The key architectural rule is:

    The nucleus defines the universe; it does not carry the universe.

A trace can therefore be:

    R07 -> R15 -> R18 -> R13

without routing through the nucleus.

## Modules

    reality-lattice.js       Canonical nucleus + 18 vectors and coordinate helpers.
    reality-field.js         Reality nodes, graph, branches, folds, tracing, snapshots.
    reality-controller.js    Command/control surface.
    reality-field-scene.js   Optional Three.js projection driven from RealityField.
    index.js                 Public API.

## Control language

    SHOW FIELD
    SELECT R07
    ENTER R07
    CONNECT R01 R07
    FOLD R07 R18
    TRACE R01 R18
    BRANCH R07 branch-a
    SET R07 status=active pressure=0.73
    RETURN TO NUCLEUS
    HISTORY

## Hierarchical expansion: 18 → 576 → more

The first visual expansion keeps the same single shared nucleus and expands each
primary direction into 32 local alternate states:

    6 cardinal axes + 12 diagonal directions = 18 primary realities
    18 × 32 = 576 first-order alternate states
    576 × 32 = 18,432 second-order states
    18,432 × 32 = 589,824 third-order states

The alternate layer is represented as local state geometry around each primary
direction. It does not add 576 new central nuclei and does not route those states
through the nucleus. The renderer shows the 576 first-order states as a point
cloud around the 18 oriented primary chambers.

This is a structural/modeling implementation of the proposed lattice, not a
claim that these alternate states have been experimentally established as
physical universes.

## Why .25 exists

The 18 primary vectors stay stable while the graph around them can grow.

That gives us room for secondary branches, direct reality paths, folds, event traces, new connection semantics, and future live 3D interaction without turning the nucleus into a single processing bottleneck.

## Tests

    npm install
    npm test

GitHub Actions runs the same test suite on pushes and pull requests to main.

## Live browser prototype

The repository now includes a local interactive field controller.

    npm install
    npm start

Then open http://localhost:4173.

The prototype uses the same RealityField state model as the core API. Clicking a
node selects it. The command bar can inspect, enter, connect, fold, emit events,
step time, and trace paths. The 3D projection is only a renderer; it does not own
the topology.
