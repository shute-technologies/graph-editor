import { GEEEngine } from './geeEngine';
import { GEEVector2, GEEUtils } from '../common/geeUtils';
import { GEEStyles } from '../config/geeStyles';
import { GEEGraphConnection } from './geeGraphConnection';
import { GEEIPlaybackObject } from '../common/geeInterfaces';

export interface GEIHittedResult {
  isHitted: boolean;
  graph: GEEGraph;
}

export interface GEIHittedConnectorResult extends GEIHittedResult {
  connectorX: number;
  connectorY: number;
}

export class GEEGraph {
  private _name: string;
  private _connections: Array<GEEGraphConnection>;
  private _references: Array<GEEGraph>;
  private _isPlaying: boolean;
  private _mouseIsDown: boolean;
  private _mousePosition: GEEVector2;
  private _mousePositionOffset: GEEVector2;

  x: number;
  y: number;
  cx: number;
  cy: number;
  percentage: number;
  speed: number;
  isLoop: boolean;
  isStart: boolean;
  isMouseOver: boolean;
  forcePercentage: boolean;
  stopPropagation: boolean;
  playbackObject?: GEEIPlaybackObject;

  get name(): string {
    return this._name;
  }
  get connections(): Array<GEEGraphConnection> {
    return this._connections;
  }
  get references(): Array<GEEGraph> {
    return this._references;
  }
  get graphLinkedCount(): number {
    return this._connections.length + this._references.length;
  }

  constructor(public readonly _gee: GEEEngine) {
    this.x = 0;
    this.y = 0;
    this.cx = 0;
    this.cy = 0;
    this.percentage = 0;
    this.speed = 1;
    this._name = '';
    this.isLoop = false;
    this.isStart = false;
    this.isMouseOver = false;
    this._isPlaying = false;
    this._mouseIsDown = false;
    this.forcePercentage = false;
    this.stopPropagation = false;
    this.playbackObject = null;
    this._connections = [];
    this._references = [];
    this._mousePosition = { x: 0, y: 0};
    this._mousePositionOffset = { x: 0, y: 0};
  }

  initialize(x: number, y: number, name: string): void {
    this.x = x;
    this.y = y;
    this._name = name;
    this.cx = x + GEEStyles.graph.sizeX * 0.5;
    this.cy = y + GEEStyles.graph.sizeY * 0.5;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.cx = x + GEEStyles.graph.sizeX * 0.5;
    this.cy = y + GEEStyles.graph.sizeY * 0.5;
  }

  play(): void {
    this._isPlaying = true;
    this.percentage = 0;
    this.playbackObject?.play();
  }

  stop(): void {
    this._isPlaying = false;
    this.percentage = 0;
    this.playbackObject?.stop();
  }

  addReferenceGraph(graph: GEEGraph): void {
    const graphName = graph.name;

    if (this._name !== graphName) {
      let canReference = true;

      for (const reference of this._references) {
        if (reference && reference.name === graphName) {
          canReference = false;
          break;
        }
      }

      if (canReference) {
        // add reference
        this._references.push(graph);
      }
    }
  }

  removeReference(connection: GEEGraphConnection): void {
    for (let i = 0; i < this._references.length; i++) {
      const tmpReference = this._references[i];

      if (tmpReference && tmpReference.name === connection.graphFrom.name) {
        this._references.splice(i, 1);
        break;
      }
    }
  }

  connectTo(graph: GEEGraph, extraParams?): void {
    const graphName = graph.name;

    if (this._name !== graphName) {
      let canConnect = true;

      for (const connection of this._connections) {
        if (connection && connection.graphTo.name === graphName) {
          canConnect = false;
          break;
        }
      }

      if (canConnect) {
        const connection = new GEEGraphConnection(this, graph, extraParams);
        this._connections.push(connection);

        // add reference
        graph.addReferenceGraph(this);
      }
    }
  }

  removeConnection(connection: GEEGraphConnection): void {
    // Remove the connection
    for (let i = 0; i < this._connections.length; i++) {
      const tmpConnection = this._connections[i];

      if (tmpConnection.graphTo.name === connection.graphTo.name) {
        this._connections.splice(i, 1);
        // Remove also the reference
        connection.graphTo.removeReference(tmpConnection);
        break;
      }
    }
  }

  onMouseMove(mousePos: GEEVector2): void {
    this._mousePosition = mousePos;
  }

  onMouseUp(mousePos: GEEVector2): void {
    this._mouseIsDown = false;
  }

  onMouseDown(mousePos: GEEVector2): void {
    if (!this._isPlaying) {
      const isHittedGraph = this.isHittedGraph(mousePos).isHitted;
      const isHittedConnector = this.isHittedConnector(mousePos).isHitted;

      if (isHittedGraph && !isHittedConnector) {
        this._mouseIsDown = true;
        this._mousePositionOffset.x = this.x - mousePos.x;
        this._mousePositionOffset.y = this.y - mousePos.y;
      }
    }
  }

  isHittedGraph(mousePos: GEEVector2): GEIHittedResult {
    const isHittedGraph = GEEUtils.hitTestByPoint(this.x, this.y, GEEStyles.graph.sizeX,
      GEEStyles.graph.sizeY, mousePos.x, mousePos.y);

    return {
      isHitted: isHittedGraph,
      graph: this
    };
  }

  isHittedConnector(mousePos: GEEVector2): GEIHittedConnectorResult {
    const width = GEEStyles.graph.sizeX;
    const radius = GEEStyles.graph.circleConnector.radius;
    const cX = this.x + width - (GEEStyles.graph.circleConnector.offsetCircle + radius * 2);
    const cY = this.y;
    const cWidth = (radius * 2) + GEEStyles.graph.circleConnector.offsetCircle;
    const cHeight = (radius * 2) + GEEStyles.graph.circleConnector.offsetCircle;
    const isHittedConnector = GEEUtils.hitTestByPoint(cX, cY, cWidth, cHeight, mousePos.x, mousePos.y);

    return {
      isHitted: isHittedConnector,
      graph: this,
      connectorX: cX + radius + radius * 0.5,
      connectorY: cY + radius + radius * 0.5,
    };
  }

  // tslint:disable-next-line: cyclomatic-complexity
  update(dt: number): void {
    this.draw(dt);

    if (this._isPlaying) {
      if (!this.playbackObject || !this.forcePercentage) {
        this.percentage += this.speed * dt;
      } else {
        // Only if have a playback object with this interface
        const currentTime = this.playbackObject?.currentTime;
        const totalSeconds = this.playbackObject?.animationSeconds;

        this.percentage = currentTime / totalSeconds;
      }

      if (this.percentage >= 1.0) {
        this.percentage = 0;

        if (!this.isLoop) {
          this._isPlaying = false;
          // Pause the animation on the end
          this.playbackObject?.pause(this.playbackObject?.animationSeconds);
        }

        if (!this.stopPropagation) {
          for (const connection of this._connections) {
            connection.graphTo.play();
          }
        }
      }

      // Update PlaybackObject
      this.playbackObject?.update(dt);
    } else {
      this.percentage = this.percentage > 1.0 ? 1.0 : this.percentage;
      this.percentage = this.percentage < 0.0 ? 0.0 : this.percentage;

      if (this._mouseIsDown) {
        this.x = this._mousePosition.x + this._mousePositionOffset.x;
        this.y = this._mousePosition.y + this._mousePositionOffset.y;
        this.cx = this.x + GEEStyles.graph.sizeX * 0.5;
        this.cy = this.y + GEEStyles.graph.sizeY * 0.5;
      }
    }
  }

  private draw(dt: number): void {
    const ctx = this._gee.ctx;

    // Draw Rect
    ctx.beginPath();
    ctx.rect(this.x, this.y, GEEStyles.graph.sizeX, GEEStyles.graph.sizeY);

    if (!this.isMouseOver) {
      ctx.fillStyle = !this.isStart ? GEEStyles.graph.color : GEEStyles.graph.startColor;
    } else {
      ctx.fillStyle = GEEStyles.graph.mouseOverColor;
    }

    ctx.fill();
    ctx.lineWidth = GEEStyles.graph.lineSize;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.closePath();

    // Draw Animation Rect
    const posX = this.x + GEEStyles.graph.lineSize;
    const posY = this.y + (GEEStyles.graph.sizeY - GEEStyles.graph.transition.sizeY);
    const sizeX = (GEEStyles.graph.sizeX - GEEStyles.graph.lineSize * 2.0) * this.percentage;
    const sizeY = GEEStyles.graph.transition.sizeY - GEEStyles.graph.lineSize;

    ctx.beginPath();
    ctx.rect(posX, posY, sizeX, sizeY);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();

    // Draw Text
    const textX = this.x + GEEStyles.graph.textOffsetX;
    const textY = this.y + GEEStyles.graph.textOffsetY;
    ctx.font = GEEStyles.graph.textStyle;
    ctx.textAlign = 'center';

    const resultLines = GEEUtils.fragmentText(ctx, this._name, GEEStyles.graph.sizeX);
    const offsetY = resultLines.linesQuantity > 1 ? (resultLines.height * 0.25) * resultLines.linesQuantity : 0;

    for (let i = 0; i < resultLines.linesQuantity; i++) {
      ctx.fillText(resultLines.lines[i], textX, textY + (resultLines.height * i) - offsetY);
    }

    // Draw connector trigger
    const radius = GEEStyles.graph.circleConnector.radius;
    const offsetCircle = GEEStyles.graph.circleConnector.offsetCircle;

    ctx.beginPath();
    ctx.arc(this.x + GEEStyles.graph.sizeX - (radius * 0.5) - offsetCircle,
      this.y + (radius * 0.5) + offsetCircle,
      radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#990000';
    ctx.fill();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
  }

  destroy(): void {
    this.playbackObject = null;
    (this as any)['_gee'] = null;
    this._mousePosition = null;
    this._mousePositionOffset = null;
    this._connections = null;
    this._references = null;
    this._name = null;
  }
}
