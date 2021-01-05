import { GEEGraph } from './geeGraph';
import { GEEStyles } from '../config/geeStyles';
import { GEEUtils } from '../common/geeUtils';

export class GEEGraphConnection {

  static readonly offsetRadius = 20;
  static readonly offsetAngle = 0.16;

  onFocus: boolean;

  constructor (
    public readonly graphFrom: GEEGraph,
    public readonly graphTo: GEEGraph,
    public readonly extraParams) {

    this.onFocus = false;
  }

  static draw(ctx: CanvasRenderingContext2D, dt: number, connection: GEEGraphConnection, offsetAngle: number): void {
    const graphFrom = connection.graphFrom;
    const graphTo = connection.graphTo;

    GEEGraphConnection.drawArrow(ctx, graphFrom.cx, graphFrom.cy,
      graphTo.cx, graphTo.cy, offsetAngle, null, null, null,
      connection.onFocus);
  }

  static drawArrow(ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number,
    offsetAngle?: number, offsetRadius?: number, colorStroke?: string, colorFill?: string, onFocus?: boolean): void {

    onFocus = !onFocus ? false : onFocus;
    colorStroke = !colorStroke ? GEEStyles.arrowColorStroke : colorStroke;
    colorFill = !colorFill ? GEEStyles.arrowColorFill : colorFill;
    offsetAngle = (!offsetAngle && offsetAngle !== 0) ? 0 : offsetAngle;
    offsetRadius = (!offsetRadius && offsetRadius !== 0) ? GEEGraphConnection.offsetRadius : offsetRadius;

    if (onFocus) {
      colorStroke = GEEStyles.arrowColorFocusStroke;
    }

    const headlen = 5;
    const startPosition = GEEUtils.circlePosition(fromx, fromy, tox, toy,
      offsetRadius, offsetAngle);
    const endPosition = GEEUtils.circlePosition(tox, toy, fromx, fromy,
      offsetRadius, -offsetAngle);

    fromx = startPosition.x;
    fromy = startPosition.y;
    tox = endPosition.x;
    toy = endPosition.y;

    const angle = Math.atan2(toy - fromy, tox - fromx);
    const middleX = GEEUtils.lerp(fromx, tox, 0.5);
    const middleY = GEEUtils.lerp(fromy, toy, 0.5);

    // starting path of the arrow from the start square to the end square and drawing the stroke
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.strokeStyle = colorStroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // starting a new path from the head of the arrow to one of the sides of the point
    ctx.beginPath();
    ctx.moveTo(middleX, middleY);
    ctx.lineTo(middleX - headlen * Math.cos(angle - Math.PI / 7), middleY - headlen * Math.sin(angle - Math.PI / 7));

    // path from the side point of the arrow, to the other side point
    ctx.lineTo(middleX - headlen * Math.cos(angle + Math.PI / 7), middleY - headlen * Math.sin(angle + Math.PI / 7));

    // path from the side point back to the tip of the arrow, and then again to the opposite side point
    ctx.lineTo(middleX, middleY);
    ctx.lineTo(middleX - headlen * Math.cos(angle - Math.PI / 7), middleY - headlen * Math.sin(angle - Math.PI / 7));

    // draws the paths created above
    ctx.strokeStyle = colorStroke;
    ctx.lineWidth = 0;
    ctx.stroke();
    ctx.fillStyle = colorFill;
    ctx.fill();
    ctx.closePath();
  }

  static drawPreConnector(ctx: CanvasRenderingContext2D, fromx: number, fromy: number,
    tox: number, toy: number): void {

    const offsetAngle = 0;
    const offsetRadius = 0;
    const colorStroke = '#003300';
    const colorFill = '#990000';

    GEEGraphConnection.drawArrow(ctx, fromx, fromy, tox, toy, offsetAngle, offsetRadius,
      colorStroke, colorFill);
  }

  static getPosition(connection: GEEGraphConnection, offsetAngle?: number) {
    offsetAngle = !offsetAngle ? 0 : offsetAngle;

    const offsetRadius = GEEGraphConnection.offsetRadius;
    const graphFrom = connection.graphFrom;
    const graphTo = connection.graphTo;

    let fromX = graphFrom.cx;
    let fromY = graphFrom.cy;
    let toX = graphTo.cx;
    let toY = graphTo.cy;

    const startPosition = GEEUtils.circlePosition(fromX, fromY, toX, toY,
      offsetRadius, offsetAngle);
    const endPosition = GEEUtils.circlePosition(toX, toY, fromX, fromY,
      offsetRadius, -offsetAngle);

    fromX = startPosition.x;
    fromY = startPosition.y;
    toX = endPosition.x;
    toY = endPosition.y;

    return {
      fromX,
      fromY,
      toX,
      toY,
    };
  }
}
