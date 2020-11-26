import { GEEGraph, GEIHittedConnectorResult } from './geeGraph';
import { GEEVector2, GEEUtils } from '../common/geeUtils';
import { GEEGraphConnection } from './geeGraphConnection';
import { GEEStyles } from '../config/geeStyles';
import { GEEEngineHelper } from './geeEngineHelper';
import { SimpleCallback, GEEIAnimatorData, GEEIGraphData } from '../common/geeInterfaces';

export interface GEEConnectData {
  isTrying: boolean;
  fromX: number;
  fromY: number;
  fromGraph: GEEGraph;
  mouseOverGraph: GEEGraph;
  mousePos: GEEVector2;
}

export class GEEEngine {

  private _ctx: CanvasRenderingContext2D;
  private _parentSelectorName: string;
  private _parentSelector: JQuery<HTMLElement>;
  private _parentCanvasSelectorName: string;
  private _parentCanvasSelector: JQuery<HTMLElement>;
  private _width: number;
  private _height: number;
  private _isPlaying: boolean;
  private _graphs: Array<GEEGraph>;
  private _startGraph: GEEGraph;
  private _tryingToConnect: GEEConnectData;
  private _onFocusConnection: { connection: GEEGraphConnection };

  onChangeCallback: SimpleCallback;
  isForcePercentage: boolean;

  get width(): number { return this._width; }
  get height(): number { return this._height; }
  get isPlaying(): boolean { return this._isPlaying; }
  get parentSelector(): JQuery<HTMLElement> { return this._parentSelector; }
  get tryingToConnect(): GEEConnectData { return this._tryingToConnect; }
  get ctx(): CanvasRenderingContext2D { return this._ctx; }

  get animatorData(): GEEIAnimatorData {
    const resultData = {
      startGraph: this._startGraph ? this._startGraph.name : '',
      graphs: []
    } as GEEIAnimatorData;

    for (const graph of this._graphs) {
      const graphData = {
        x: graph.x,
        y: graph.y,
        name: graph.name,
        speed: graph.speed,
        isLoop: graph.isLoop,
        isStart: graph.isStart,
        connections: [],
        extraParams: null,
        playbackObject: null
      } as GEEIGraphData;

      for (const graphConnection of graph.connections) {
        graphData.connections.push({
          graphToName: graphConnection.graphTo.name,
          extraParams: graphConnection.extraParams
        });
      }

      resultData.graphs.push(graphData);
    }

    return resultData;
  }

  constructor(selectorName: string) {
    this._parentSelectorName = selectorName;
    this._parentSelector = $(this._parentSelectorName);
    this._parentSelector.css('height', '100%');
    this._isPlaying = false;
    this.isForcePercentage = false;
    this._width = this._parentSelector.width();
    this._height = 400;
    this._graphs = [];
    this._startGraph = null;
    this._tryingToConnect = {
      isTrying: false,
      fromX: 0,
      fromY: 0,
      fromGraph: null,
      mouseOverGraph: null,
      mousePos: {
        x: 0,
        y: 0
      }
    };
    this._onFocusConnection = { connection: null };

    this.createGUI();
    this.createMouseEvents();
    this.createKeyboardEvents();
  }

  reconstructFrom(animatorData: GEEIAnimatorData): void {
    const hasData = Object.keys(animatorData).length > 0;

    if (hasData) {
      this._startGraph = GEEEngineHelper.getGraphByName(this._graphs, animatorData.startGraph);

      for (const graphData of animatorData.graphs) {
        const graph = GEEEngineHelper.getGraphByName(this._graphs, graphData.name);

        if (graph) {
          graph.setPosition(graphData.x, graphData.y);
          graph.speed = graphData.speed;
          graph.isLoop = graphData.isLoop;
          graph.isStart = graphData.isStart;

          if (graphData.connections) {
            for (const connection of graphData.connections) {
              const graphTo = GEEEngineHelper.getGraphByName(this._graphs, connection.graphToName);
              graphTo?.connectTo(graphTo, connection.extraParams);
            }
          }
        }
      }
    }
  }

  private createKeyboardEvents(): void {
    this._parentCanvasSelector.on('keydown', (event) => {
        let stopPropagation = false;
        const contrlKeyPressed = event.originalEvent.ctrlKey;
        const metaKeyIsPressed = event.originalEvent.metaKey;
        const shiftIsPressed = event.originalEvent.shiftKey;
        const keyCode = event.originalEvent.which;

        // Then save the file
        switch (keyCode) {
          case GEEUtils.keyCode.delete:
          case GEEUtils.keyCode.backspace:
            if (this._onFocusConnection.connection) {
              stopPropagation = true;

              this.removeConnection(this._onFocusConnection.connection);

              this._onFocusConnection.connection.onFocus = false;
              this._onFocusConnection.connection = null;
            }
            break;
        }

        if (stopPropagation) {
          event.preventDefault();
          event.stopPropagation();
        }
    });
  }

  private createMouseEvents(): void {
    // nested function
    const nestedFnGetMousePos = (canvas: HTMLCanvasElement, evt) => {
      const rect = canvas.getBoundingClientRect();

      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      } as GEEVector2;
    };

    // Mouse Move
    this._parentCanvasSelector.on('mousemove', (evt) => {
      const mousePos = nestedFnGetMousePos(this._parentCanvasSelector[0] as HTMLCanvasElement, evt);

      // on mouse move
      for (const graph of this._graphs) {
        graph.onMouseMove(mousePos);
      }

      if (this._tryingToConnect.isTrying) {
        this._tryingToConnect.mousePos = mousePos;
      }
    });

    // Mouse Up
    this._parentCanvasSelector.on('mouseup', (evt) => {
      const mousePos = nestedFnGetMousePos(this._parentCanvasSelector[0] as HTMLCanvasElement, evt);
      // on mouse up
      for (const graph of this._graphs) {
        graph.onMouseUp(mousePos);
      }

      if (this._tryingToConnect.isTrying) {
        if (this._tryingToConnect.mouseOverGraph) {
          this._tryingToConnect.mouseOverGraph.isMouseOver = false;

          // Now connect the graphs
          this._tryingToConnect.fromGraph.connectTo(this._tryingToConnect.mouseOverGraph);
        }

        this._tryingToConnect.isTrying = false;
        this._tryingToConnect.fromX = 0;
        this._tryingToConnect.fromY = 0;
        this._tryingToConnect.fromGraph = null;
        this._tryingToConnect.mouseOverGraph = null;
      } else {
        // Invoke change
        if (this.onChangeCallback) { this.onChangeCallback(); }
    }

      // Unfocus current one
      if (this._onFocusConnection.connection) {
        this._onFocusConnection.connection.onFocus = false;
        this._onFocusConnection.connection = null;
      }

      // Now search a connection to Focus
      const connection = GEEEngineHelper.getConnectionByPosition(this._graphs, mousePos.x, mousePos.y);

      if (connection) {
        this._onFocusConnection.connection = connection;
        this._onFocusConnection.connection.onFocus = true;
      }
    });

    // Move Down
    this._parentCanvasSelector.on('mousedown', (evt) => {
      let hittedConnector: GEIHittedConnectorResult = null;
      const mousePos = nestedFnGetMousePos(this._parentCanvasSelector[0] as HTMLCanvasElement, evt);

      // on mouse move
      for (const graph of this._graphs) {
        hittedConnector = graph.isHittedConnector(mousePos);
        if (hittedConnector.isHitted) { break; }
      }

      if (!hittedConnector.isHitted) {
        for (const graph of this._graphs) {
          graph.onMouseDown(mousePos);
        }
      } else {
        this._tryingToConnect.mousePos = mousePos;
        this._tryingToConnect.isTrying = true;
        this._tryingToConnect.fromGraph = hittedConnector.graph;
        this._tryingToConnect.fromX = hittedConnector.connectorX;
        this._tryingToConnect.fromY = hittedConnector.connectorY;
      }
    });
  }

  play(): void {
    if (this._startGraph) {
      this._isPlaying = true;
      this._startGraph.play();
    }
  }

  stop(): void {
    this._isPlaying = false;

    for (const graph of this._graphs) {
      graph.stop();
    }
  }

  reset(): void {
    this._isPlaying = false;
    this._startGraph = null;
    this._onFocusConnection.connection = null;
    this._tryingToConnect = {
      isTrying: false,
      fromX: 0,
      fromY: 0,
      fromGraph: null,
      mouseOverGraph: null,
      mousePos: {
        x: 0,
        y: 0
      }
    };

    for (const graph of this._graphs) {
      graph.destroy();
    }

    this._graphs = [];
  }

  changeStartGraph(graph: GEEGraph): void {
    for (const iterateGraph of this._graphs) {
      iterateGraph.isStart = false;
    }

    graph.isStart = true;
    this._startGraph = graph;

    // invoke change
    if (this.onChangeCallback) { this.onChangeCallback(); }
  }

  private createGUI(): void {
    this._parentCanvasSelectorName = `canvas-${this._parentSelectorName.substring(1)}`;
    this._parentCanvasSelector = $(`<canvas id='${this._parentCanvasSelectorName}' width='${this._width}' height='${this._height}' tabindex='1'></canvas>`);
    this._parentCanvasSelector.css('float', 'left');
    // add HTML canvas
    this._parentSelector.append(this._parentCanvasSelector);

    // get Canvas Context as 2D
    this._ctx = (this._parentCanvasSelector[0] as HTMLCanvasElement).getContext('2d');
  }

  private drawGUI(dt: number): void {
    const ctx = this._ctx;

    // Clear
    ctx.clearRect(0, 0, this._width, this._height);

    // Background
    ctx.fillStyle = GEEStyles.backgroundColor;
    ctx.fillRect(0, 0, this._width, this._height);
  }

  private drawConnections(dt: number): void {
    for (const graph of this._graphs) {
      for (const connection of graph.connections) {
        GEEGraphConnection.draw(this._ctx, dt, connection, GEEGraphConnection.offsetAngle);
      }
    }
  }

  createGraph(x: number, y: number, name: string): GEEGraph {
    const graph = new GEEGraph(this);
    graph.initialize(x, y, name);

    this._graphs.push(graph);

    return graph;
  }

  connectTo(graphFrom: GEEGraph, graphTo: GEEGraph, extraParams) {
    graphFrom.connectTo(graphTo, extraParams);
    // invoke change
    if (this.onChangeCallback) { this.onChangeCallback(); }
  }

  removeConnection(connection: GEEGraphConnection): void {
    connection.graphFrom.removeConnection(connection);
    // invoke change
    if (this.onChangeCallback) { this.onChangeCallback(); }
  }

  computeVariables(): void {
    // responsive size
    this._parentCanvasSelector.attr('width', this._width);
    this._parentCanvasSelector.attr('height', this._height);
  }

  getGraphByName(name: string) {
    return GEEEngineHelper.getGraphByName(this._graphs, name);
  }

  update(dt: number): void {
    // Update size dynamically
    this._width = this._parentSelector.width();

    // Compute
    this.computeVariables();
    // Draw
    this.drawGUI(dt);
    this.drawConnections(dt);

    for (const graph of this._graphs) {
      graph.update(dt);
    }

    // Do trying to connect to...
    if (this._tryingToConnect.isTrying) {
      const mousePos = this._tryingToConnect.mousePos;

      GEEGraphConnection.drawPreConnector(this._ctx, this._tryingToConnect.fromX,
        this._tryingToConnect.fromY, mousePos.x, mousePos.y);

      const graphResult = GEEEngineHelper.getGraphHittedResultByPosition(this._graphs, mousePos.x, mousePos.y);

      if (graphResult.isHitted && (graphResult.graph.name !== this._tryingToConnect.fromGraph.name)) {
        if (this._tryingToConnect.mouseOverGraph) {
          this._tryingToConnect.mouseOverGraph.isMouseOver = false;
        }

        this._tryingToConnect.mouseOverGraph = graphResult.graph;
        this._tryingToConnect.mouseOverGraph.isMouseOver = true;
      } else {
        if (this._tryingToConnect.mouseOverGraph) {
          this._tryingToConnect.mouseOverGraph.isMouseOver = false;
          this._tryingToConnect.mouseOverGraph = null;
        }
      }
    }
  }

  destroy(): void {
    for (const graph of this._graphs) {
      graph.destroy();
    }

    this._graphs = null;
    this._parentSelector = null;
    this._parentCanvasSelector = null;
    this._startGraph = null;
    this._tryingToConnect = null;
    this._onFocusConnection = null;
    this.onChangeCallback = null;
  }
}
