import { GEERenderLoop } from './src/shute-technologies/modules/common/geeRenderLoop';
import { GEEEngine } from './src/shute-technologies/modules/editor/geeEngine';

(function main() {
  const frameRate = 30;

  const geeEngine = new GEEEngine('#graph-editor');
  const grapInit = geeEngine.createGraph(20, 50, 'Init');
  const grapIdle = geeEngine.createGraph(380, 40, 'Idle');
  const grapWalk = geeEngine.createGraph(500, 100, 'Walk');
  const grapCrunch = geeEngine.createGraph(400, 200, 'Crunch');
  const grapFlee = geeEngine.createGraph(100, 280, 'Flee');
  const grapUppercut = geeEngine.createGraph(600, 240, 'Uppercut');

  grapIdle.connectTo(grapCrunch);
  grapIdle.connectTo(grapFlee);

  grapWalk.connectTo(grapIdle);
  grapInit.connectTo(grapIdle);

  grapCrunch.connectTo(grapUppercut);
  grapCrunch.connectTo(grapWalk);
  grapUppercut.connectTo(grapCrunch);
  grapUppercut.connectTo(grapWalk);
  grapUppercut.connectTo(grapInit);

  geeEngine.changeStartGraph(grapInit);
  geeEngine.play();

  GEERenderLoop.create((deltaTime) => geeEngine.update(deltaTime), frameRate);
})();
