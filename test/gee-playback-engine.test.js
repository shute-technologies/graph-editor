// Runs against the compiled output (npm test builds first), so it checks what gets published.
const test = require('node:test');
const assert = require('node:assert/strict');
const { GEEPlaybackEngine } = require('../lib/index.js');

// Stands in for a timeline-editor ATEPlaybackEngine: it invokes the callback the same way,
// `this.onAnimationEnd(this)`, so `this` inside a plain method would be this object.
class FakePlaybackObject {
  constructor(lengthInSeconds) {
    this.length = lengthInSeconds;
    this.currentTime = 0;
    this.isPlaying = false;
    this.onAnimationEnd = null;
    this.extraParams = null;
    this.plays = 0;
  }
  play() { this.isPlaying = true; this.plays++; }
  stop() { this.isPlaying = false; }
  invalidateAnimations() {}
  update(dt) {
    if (!this.isPlaying) { return; }
    this.currentTime += dt;
    if (this.currentTime >= this.length && this.onAnimationEnd) {
      this.onAnimationEnd(this);
    }
  }
}

function makeGraph(name, connectsTo, length = 1) {
  const graph = { name, connections: connectsTo.map((graphToName) => ({ graphToName })), playbackObject: new FakePlaybackObject(length) };
  graph.playbackObject.extraParams = graph;
  return graph;
}

function makeEngine(graphs, startGraph) {
  const engine = new GEEPlaybackEngine();
  engine.initializeWith({ startGraph, graphs });
  return engine;
}

test('the end of a clip starts the connected graph instead of throwing', () => {
  const a = makeGraph('A', ['B']);
  const b = makeGraph('B', []);
  const engine = makeEngine([a, b], 'A');

  engine.play();
  assert.doesNotThrow(() => engine.update(1.5));

  assert.equal(a.playbackObject.isPlaying, false);
  assert.equal(b.playbackObject.isPlaying, true);
  assert.deepEqual(engine.playingGraphs.map((g) => g.name), ['B']);
});

test('the callback works when detached from the engine, as a playback object holds it', () => {
  const a = makeGraph('A', ['B']);
  const b = makeGraph('B', []);
  const engine = makeEngine([a, b], 'A');

  engine.play();
  const detached = a.playbackObject.onAnimationEnd;
  assert.equal(typeof detached, 'function');
  assert.doesNotThrow(() => detached.call(undefined, a.playbackObject));
  assert.deepEqual(engine.playingGraphs.map((g) => g.name), ['B']);
});

test('a graph that ends does not make update() skip the graph after it', () => {
  // A and C play in parallel; A ends on the first update and hands over to B.
  const a = makeGraph('A', ['B'], 1);
  const b = makeGraph('B', [], 10);
  const c = makeGraph('C', [], 10);
  const engine = makeEngine([a, b, c], 'A');

  engine.play();
  engine.pushAndPlayGraph('C');
  engine.update(1.5);

  assert.equal(c.playbackObject.currentTime, 1.5, 'C must still be updated in the frame A ended');
  assert.deepEqual(engine.playingGraphs.map((g) => g.name).sort(), ['B', 'C']);
});
