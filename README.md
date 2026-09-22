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

## Why .25 exists

The 18 primary vectors stay stable while the graph around them can grow.

That gives us room for secondary branches, direct reality paths, folds, event traces, new connection semantics, and future live 3D interaction without turning the nucleus into a single processing bottleneck.

## Tests

    npm install
    npm test

GitHub Actions runs the same test suite on pushes and pull requests to main.
