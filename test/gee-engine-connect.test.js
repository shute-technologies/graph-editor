// Runs against the compiled output (npm test builds first), so it checks what gets published.
const test = require('node:test');
const assert = require('node:assert/strict');
const { GEEEngine, GEEGraph } = require('../lib/index.js');

// The engine's constructor wants a canvas; the mouse-up path only needs this state.
function makeEngine() {
  const engine = Object.create(GEEEngine.prototype);
  engine.changes = 0;
  engine.onChangeCallback = () => { engine.changes++; };
  engine._tryingToConnect = { isTrying: false, fromX: 0, fromY: 0, fromGraph: null, mouseOverGraph: null, mousePos: { x: 0, y: 0 } };
  return engine;
}

function makeGraph(engine, name) {
  const graph = new GEEGraph(engine);
  graph.initialize(0, 0, name);
  return graph;
}

// What the mouse-down on a connector and the drag over another graph leave behind.
function dragConnection(engine, from, over) {
  Object.assign(engine._tryingToConnect, { isTrying: true, fromX: 10, fromY: 20, fromGraph: from, mouseOverGraph: over });
  if (over) { over.isMouseOver = true; }
}

test('finishing a connection with the mouse connects the graphs and raises the change event', () => {
  const engine = makeEngine();
  const idle = makeGraph(engine, 'idle');
  const run = makeGraph(engine, 'run');

  dragConnection(engine, idle, run);
  engine.finishConnectAttempt();

  assert.deepEqual(idle.connections.map((c) => c.graphTo.name), ['run']);
  assert.equal(engine.changes, 1);
  assert.equal(run.isMouseOver, false);
});

test('the drag state is reset afterwards', () => {
  const engine = makeEngine();
  dragConnection(engine, makeGraph(engine, 'a'), makeGraph(engine, 'b'));

  engine.finishConnectAttempt();

  const { isTrying, fromX, fromY, fromGraph, mouseOverGraph } = engine._tryingToConnect;
  assert.deepEqual({ isTrying, fromX, fromY, fromGraph, mouseOverGraph },
    { isTrying: false, fromX: 0, fromY: 0, fromGraph: null, mouseOverGraph: null });
});

test('releasing over nothing, over itself, or over a graph already connected raises no change', () => {
  const engine = makeEngine();
  const idle = makeGraph(engine, 'idle');
  const run = makeGraph(engine, 'run');

  dragConnection(engine, idle, null);
  engine.finishConnectAttempt();
  dragConnection(engine, idle, idle);
  engine.finishConnectAttempt();
  dragConnection(engine, idle, run);
  engine.finishConnectAttempt();
  dragConnection(engine, idle, run);
  engine.finishConnectAttempt();

  assert.equal(idle.connections.length, 1);
  assert.equal(engine.changes, 1, 'only the one real connection');
});
