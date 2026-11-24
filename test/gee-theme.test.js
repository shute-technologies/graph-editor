// Runs against the compiled output (npm test builds first), so it checks what gets published.
const test = require('node:test');
const assert = require('node:assert/strict');
const { GEEEngine, GEEGraph, GEEStyles, GEEDefaultTheme } = require('../lib/index.js');

// A 2D context that records the fillStyle, strokeStyle and font in effect at every fill, stroke and fillText.
function makeRecordingContext() {
  const calls = [];
  const record = (op, extra) => calls.push({ op, fillStyle: ctx.fillStyle, strokeStyle: ctx.strokeStyle, font: ctx.font, ...extra });
  const ctx = {
    calls,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    font: '10px sans-serif',
    lineWidth: 1,
    textAlign: 'start',
    beginPath() {},
    closePath() {},
    rect() {},
    arc() {},
    moveTo() {},
    lineTo() {},
    clearRect() {},
    measureText(text) { return { width: text.length * 6 }; },
    fill() { record('fill'); },
    stroke() { record('stroke'); },
    fillRect() { record('fillRect'); },
    fillText(text, x, y) { record('fillText', { text, y }); },
  };
  return ctx;
}

// The engine's constructor wants jQuery and a canvas; update() only needs these.
function makeEngine(ctx) {
  const engine = Object.create(GEEEngine.prototype);
  engine._ctx = ctx;
  engine._width = 400;
  engine._height = 300;
  engine._graphs = [];
  engine._parentSelector = { width: () => 400 };
  engine._parentCanvasSelector = { attr() {} };
  engine._tryingToConnect = { isTrying: false, fromX: 0, fromY: 0, fromGraph: null, mouseOverGraph: null, mousePos: { x: 0, y: 0 } };
  return engine;
}

// The calls one graph's draw makes, in order: node fill, outline, progress bar, name, connector fill and stroke.
function drawGraph({ name = 'Idle', isStart = false, isMouseOver = false } = {}) {
  const ctx = makeRecordingContext();
  const graph = new GEEGraph(makeEngine(ctx));
  graph.initialize(0, 0, name);
  graph.isStart = isStart;
  graph.isMouseOver = isMouseOver;
  graph.update(0);

  const [nodeFill, outline, progress] = ctx.calls;
  const text = ctx.calls.filter((c) => c.op === 'fillText');
  const [connectorFill, connectorStroke] = ctx.calls.slice(-2);
  assert.deepEqual(ctx.calls.map((c) => c.op), ['fill', 'stroke', 'fill', ...text.map(() => 'fillText'), 'fill', 'stroke']);
  return { nodeFill, outline, progress, text, connectorFill, connectorStroke };
}

const graphiteDark = {
  backgroundColor: '#0e1015',
  cStrokeColor: '#2a303c',
  fontColor: '#e6e9ef',
  arrowColorStroke: '#9aa2b2',
  arrowColorFocusStroke: '#5b8cff',
  arrowColorFill: '#3a4252',
  graph: {
    color: '#252a35',
    startColor: '#5b8cff',
    mouseOverColor: '#3a4252',
    outlineColor: '#3a4252',
    textColor: '#e6e9ef',
    startTextColor: '#0b0d12',
    progressColor: '#5b8cff',
    textStyle: '600 11px Inter, sans-serif',
    circleConnector: { fillColor: '#5b8cff', strokeColor: '#3a4252' },
  },
};

test.afterEach(() => GEEStyles.resetTheme());

test('applyTheme merges nested fields without clobbering the others', () => {
  GEEStyles.applyTheme({ graph: { color: '#111111' } });
  GEEStyles.applyTheme({ graph: { circleConnector: { fillColor: '#222222' } }, backgroundColor: '#333333' });

  assert.equal(GEEStyles.graph.color, '#111111', 'the first theme survives the second');
  assert.equal(GEEStyles.graph.circleConnector.fillColor, '#222222');
  assert.equal(GEEStyles.backgroundColor, '#333333');
  assert.equal(GEEStyles.graph.startColor, GEEDefaultTheme.graph.startColor);
  assert.equal(GEEStyles.graph.circleConnector.strokeColor, GEEDefaultTheme.graph.circleConnector.strokeColor);
  assert.equal(GEEStyles.arrowColorFill, GEEDefaultTheme.arrowColorFill);
  // Geometry sits in the same objects and must be left alone.
  assert.equal(GEEStyles.graph.sizeX, 120);
  assert.equal(GEEStyles.graph.circleConnector.radius, 5);
  assert.deepEqual(GEEStyles.graph.transition, { sizeY: 4 });
});

test('applyTheme writes theme fields only: geometry, unknown keys and undefined values are ignored', () => {
  GEEStyles.applyTheme({ graph: { sizeX: 999, color: undefined, circleConnector: { radius: 50 } }, scrollbarHeight: 1, bogus: 'x' });
  GEEStyles.applyTheme(null);
  GEEStyles.applyTheme(undefined);

  assert.equal(GEEStyles.graph.sizeX, 120);
  assert.equal(GEEStyles.graph.color, GEEDefaultTheme.graph.color);
  assert.equal(GEEStyles.graph.circleConnector.radius, 5);
  assert.equal(GEEStyles.scrollbarHeight, 16);
  assert.equal(GEEStyles.bogus, undefined);
});

test('resetTheme restores every theme field and leaves the defaults untouched', () => {
  GEEStyles.applyTheme(graphiteDark);
  GEEStyles.graph.textColor = '#abcdef'; // the 0.11 way, a direct write, is reset too

  GEEStyles.resetTheme();

  assert.equal(GEEStyles.backgroundColor, '#4e4e4e');
  assert.equal(GEEStyles.cStrokeColor, '#6e6e6e');
  assert.equal(GEEStyles.fontColor, '#f9f9f9');
  assert.equal(GEEStyles.arrowColorStroke, '#000000');
  assert.equal(GEEStyles.arrowColorFocusStroke, 'white');
  assert.equal(GEEStyles.arrowColorFill, '#6e6e6e');
  const { lineSize, sizeX, sizeY, textOffsetX, textOffsetY, transition, ...graphColours } = GEEStyles.graph;
  assert.deepEqual(graphColours, {
    startColor: '#9d9d9d',
    color: '#6d6d6d',
    mouseOverColor: '#3d3d3d',
    outlineColor: 'black',
    textColor: 'white',
    startTextColor: 'white',
    progressColor: 'white',
    textStyle: 'bold 11px Arial',
    circleConnector: { radius: 5, offsetCircle: 5, fillColor: '#990000', strokeColor: '#003300' },
  });
  assert.ok(Object.isFrozen(GEEDefaultTheme.graph.circleConnector), 'the defaults cannot be edited by mistake');
});

test('with no theme a graph draws exactly as 0.11 did', () => {
  const plain = drawGraph();
  assert.equal(plain.nodeFill.fillStyle, '#6d6d6d');
  assert.equal(plain.outline.strokeStyle, 'black');
  assert.equal(plain.progress.fillStyle, 'white');
  assert.equal(plain.text[0].fillStyle, 'white');
  assert.equal(plain.text[0].font, 'bold 11px Arial');
  assert.equal(plain.connectorFill.fillStyle, '#990000');
  assert.equal(plain.connectorStroke.strokeStyle, '#003300');

  const start = drawGraph({ isStart: true });
  assert.equal(start.nodeFill.fillStyle, '#9d9d9d');
  assert.equal(start.text[0].fillStyle, 'white');
  assert.equal(drawGraph({ isMouseOver: true }).nodeFill.fillStyle, '#3d3d3d');
});

test('a graph draws with the applied theme', () => {
  GEEStyles.applyTheme(graphiteDark);

  const plain = drawGraph();
  assert.equal(plain.nodeFill.fillStyle, '#252a35', 'node fill');
  assert.equal(plain.outline.strokeStyle, '#3a4252', 'outline');
  assert.equal(plain.progress.fillStyle, '#5b8cff', 'progress bar');
  assert.equal(plain.text[0].fillStyle, '#e6e9ef', 'node text');
  assert.equal(plain.text[0].font, '600 11px Inter, sans-serif', 'node text style');
  assert.equal(plain.connectorFill.fillStyle, '#5b8cff', 'connector fill');
  assert.equal(plain.connectorStroke.strokeStyle, '#3a4252', 'connector stroke');

  const start = drawGraph({ isStart: true });
  assert.equal(start.nodeFill.fillStyle, '#5b8cff', 'start-node fill');
  assert.equal(start.text[0].fillStyle, '#0b0d12', 'start-node text');

  // Hovered, the start node is drawn in mouseOverColor, so its name takes the regular text colour.
  const hoveredStart = drawGraph({ isStart: true, isMouseOver: true });
  assert.equal(hoveredStart.nodeFill.fillStyle, '#3a4252', 'hover fill');
  assert.equal(hoveredStart.text[0].fillStyle, '#e6e9ef');
});

test('a theme switch shows on the next frame, background, arrows and the dragged connector included', () => {
  const ctx = makeRecordingContext();
  const engine = makeEngine(ctx);
  const idle = engine.createGraph(0, 0, 'Idle');
  const walk = engine.createGraph(200, 100, 'Walk');
  idle.connectTo(walk);
  walk.connectTo(idle);
  walk.connections[0].onFocus = true;
  Object.assign(engine._tryingToConnect, { isTrying: true, fromX: 10, fromY: 10, fromGraph: idle, mousePos: { x: 300, y: 250 } });

  const frame = () => {
    ctx.calls.length = 0;
    engine.update(0);
    const strokes = ctx.calls.filter((c) => c.op === 'stroke').map((c) => c.strokeStyle);
    const fills = ctx.calls.filter((c) => c.op === 'fill').map((c) => c.fillStyle);
    return { background: ctx.calls[0], strokes, fills };
  };

  const before = frame();
  assert.equal(before.background.op, 'fillRect');
  assert.equal(before.background.fillStyle, '#4e4e4e');
  assert.ok(before.strokes.includes('#000000') && before.strokes.includes('white'), 'arrow and focused arrow');
  assert.ok(before.fills.includes('#6e6e6e'), 'arrow head');

  GEEStyles.applyTheme(graphiteDark);
  const after = frame();

  assert.equal(after.background.fillStyle, '#0e1015', 'background');
  assert.ok(after.strokes.includes('#9aa2b2'), 'arrow stroke');
  assert.ok(after.strokes.includes('#5b8cff'), 'focused arrow stroke');
  assert.ok(after.fills.includes('#3a4252'), 'arrow head fill');
  // The arrow dragged out of a connector is drawn last, in the connector's colours.
  assert.equal(after.strokes[after.strokes.length - 1], '#3a4252');
  assert.equal(after.fills[after.fills.length - 1], '#5b8cff');
  const oldColours = ['#4e4e4e', '#000000', 'white', '#6e6e6e', '#6d6d6d', '#9d9d9d', 'black', '#990000', '#003300'];
  for (const call of ctx.calls) {
    assert.ok(!oldColours.includes(call[call.op === 'stroke' ? 'strokeStyle' : 'fillStyle']), `${call.op} still uses a default colour`);
  }
});

test('a font with a numeric weight wraps a long name at its pixel size', () => {
  GEEStyles.applyTheme({ graph: { textStyle: '600 11px Inter, sans-serif' } });

  const { text } = drawGraph({ name: 'A rather long animation state name' });

  assert.ok(text.length > 1, 'the name wraps');
  assert.equal(text[1].y - text[0].y, 11, 'one line apart, not 600px');
});
