import { GEEGraph, GEIHittedResult } from './geeGraph';
import { GEEUtils } from '../common/geeUtils';
import { GEEGraphConnection } from './geeGraphConnection';

export class GEEEngineHelper {

  private constructor() {}

  static getGraphHittedResultByPosition(graphs: Array<GEEGraph>, x: number, y: number): GEIHittedResult {
    let result: GEIHittedResult = null;

    for (const graph of graphs) {
      result = graph.isHittedGraph({ x, y });
      if (result.isHitted) { break; }
    }

    return result;
  }

  static getConnectionByPosition(graphs: Array<GEEGraph>, x: number, y: number, ctx?: CanvasRenderingContext2D) {
    let resultConnection: GEEGraphConnection = null;
    const elevation = 3;
    const isDebug = false && !!ctx;
    const perpendicularConst = Math.PI * 0.5;

    for (const graph of graphs) {
      for (const connection of graph.connections) {
        const resultPosition = GEEGraphConnection.getPosition(connection, GEEGraphConnection.offsetAngle);

        const cp0 = GEEUtils.circlePosition(resultPosition.fromX, resultPosition.fromY,
          resultPosition.toX, resultPosition.toY, elevation, perpendicularConst);
        const cp1 = GEEUtils.circlePosition(resultPosition.fromX, resultPosition.fromY,
          resultPosition.toX, resultPosition.toY, elevation, -perpendicularConst);
        const cp2 = GEEUtils.circlePosition(resultPosition.toX, resultPosition.toY,
          resultPosition.fromX, resultPosition.fromY, elevation, perpendicularConst);
        const cp3 = GEEUtils.circlePosition(resultPosition.toX, resultPosition.toY,
          resultPosition.fromX, resultPosition.fromY, elevation, -perpendicularConst);
        const isInside = GEEUtils.isPointInPolygon({ x, y }, [cp0, cp1, cp2, cp3]);

        if (isInside) {
          resultConnection = connection;
          break;
        }

        if (isDebug) {
          ctx.beginPath();
          ctx.moveTo(cp0.x, cp0.y);
          ctx.lineTo(cp1.x, cp1.y);
          ctx.lineTo(cp2.x, cp2.y);
          ctx.lineTo(cp3.x, cp3.y);
          ctx.lineTo(cp0.x, cp0.y);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.closePath();
        }
      }

      if (resultConnection) { break; }
    }

    return resultConnection;
  }

  static getGraphByName(graphs: Array<GEEGraph>, name: string): GEEGraph {
    let result: GEEGraph = null;

    for (let i = 0, length = graphs.length; i < length; i++) {
      if (graphs[i].name === name) {
        result = graphs[i];
        break;
      }
    }

    return result;
  }
}
