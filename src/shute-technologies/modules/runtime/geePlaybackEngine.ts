import { GEEIGraphData, GEEIPlaybackObject, GEEIAnimatorData } from '../common/geeInterfaces';

export class GEEPlaybackEngine {

  private _playingGraphs: Array<GEEIGraphData>;
  private _isPlaying: boolean;
  private _animatorData: GEEIAnimatorData;

  percentage: number;
  fromPlaybackObjects: boolean;

  get isPlaying(): boolean { return this._isPlaying; }
  get animatorData() { return this._animatorData; }
  get playingGraphs() { return this._playingGraphs; }

  constructor() {
    this._isPlaying = false;
    this.fromPlaybackObjects = false;
    this.percentage = 0;
    this._playingGraphs = [];
  }

  initializeWith(animatorData: GEEIAnimatorData) {
    this._animatorData = animatorData;
  }

  play(): void {
    if (!this._isPlaying) {
      this._isPlaying = true;
      // Initial Graph
      this.pushAndPlayGraph(this._animatorData.startGraph);
    }
  }

  stop(): void {
    if (this._isPlaying) {
      this._isPlaying = false;

      // Stopping current graphs playing
      for (let i = 0; i < this._playingGraphs.length; i++) {
        this._playingGraphs[i].playbackObject.stop();
        this._playingGraphs.splice(i, 1);
        i--;
      }
    }
  }

  reset(): void {
    for (let i = 0; i < this._playingGraphs.length; i++) {
      this._playingGraphs[i].playbackObject.currentTime = 0;
      this._playingGraphs.splice(i, 1);
      i--;
    }

    const graph = GEEPlaybackEngine.findGraphByName(this._animatorData.graphs,
      this._animatorData.startGraph);
    graph.playbackObject.currentTime = 0;
    graph.playbackObject.invalidateAnimations();
    // Push to Playing Graphs
    this._playingGraphs.push(graph);
  }

  pushAndPlayGraph(name: string): GEEIGraphData {
    const graph = GEEPlaybackEngine.findGraphByName(this._animatorData.graphs, name);

    if (graph) {
      graph.playbackObject.onAnimationEnd = this.onAnimationEnd;

      // Play graph
      graph.playbackObject.play();
      // Push to Playing Graphs
      this._playingGraphs.push(graph);
    }

    return graph;
  }

  private onAnimationEnd(playbackObject: GEEIPlaybackObject): void {
    const currentGraph: GEEIGraphData = playbackObject.extraParams;

    // Stop current PlaybackEngine
    playbackObject.stop();

    // Remove current graph from playing graphs
    for (let i = 0; i < this._playingGraphs.length; i++) {
        if (this._playingGraphs[i].name === currentGraph.name) {
          this._playingGraphs.splice(i, 1);
            break;
        }
    }

    // Now play the next graphs by connections
    if (currentGraph.connections.length > 0) {
        for (const connection of currentGraph.connections) {
        const graphToName = connection.graphToName;
        // Push and Play graph
        this.pushAndPlayGraph(graphToName);
      }
    }
  }

  update(dt: number): void {
    for (const graph of this._playingGraphs) {
      graph.playbackObject.update(dt);
    }
  }

  destroy(): void {
    this._isPlaying = null;
    this.fromPlaybackObjects = null;
    this.percentage = null;
    this._playingGraphs = null;
    this._animatorData = null;
  }

  static findGraphByName(graphs: Array<GEEIGraphData>, name: string) {
    return graphs.find(x => x.name === name);
  }
}
