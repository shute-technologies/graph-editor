export interface GEEVector2 {
  x: number;
  y: number;
}

export class GEEUtils {
  static keyCode = {
    backspace: 8,
    delete: 46,
  };

  private constructor() {}

  static fragmentText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const result = {
      lines: [],
      height: parseInt(ctx.font.match(/\d+/) as any, 10),
      linesQuantity: 0,
    };

    const words = text.split(' ');
    const lines = [];
    let line = '';

    if (ctx.measureText(text).width < maxWidth) {
      result.lines.push(text);
      result.linesQuantity = 1;
    } else {
      while (words.length > 0) {
        let split = false;

        while (ctx.measureText(words[0]).width >= maxWidth) {
          const tmp = words[0];
          words[0] = tmp.slice(0, -1);

          if (!split) {
            split = true;
            words.splice(1, 0, tmp.slice(-1));
          } else {
            words[1] = tmp.slice(-1) + words[1];
          }
        }
        if (ctx.measureText(line + words[0]).width < maxWidth) {
          line += words.shift() + ' ';
        } else {
          lines.push(line);
          line = '';
        }

        if (words.length === 0) {
          lines.push(line);
        }
      }

      if (words.length > 0) {
        result.lines = lines;
        result.linesQuantity = lines.length;
      } else {
        const measuredTextWidtth = ctx.measureText(text).width;
        const possibleSplits = Math.ceil(measuredTextWidtth / maxWidth);
        const textSize = text.length;
        const textPartSize = Math.ceil(textSize / possibleSplits);

        for (let i = 0; i < possibleSplits; i++) {
          result.lines.push(text.substr(i * textPartSize, textPartSize));
        }

        result.linesQuantity = possibleSplits;
      }
    }

    return result;
  }

  static lerp (value1: number, value2: number, time: number): number {
    return value1 + (value2 - value1) * time;
  }

  static circlePosition (x0: number, y0: number, x1: number, y1: number, radius: number, offsetAngle?: number): GEEVector2 {
    const angle = Math.atan2(y1 - y0, x1 - x0) + (!offsetAngle ? 0 : offsetAngle);

    return {
      x: x0 + (radius * Math.cos(angle)),
      y: y0 + (radius * Math.sin(angle))
    };
  }

  static hitTestCenterByPoint (x: number, y: number, sizeX: number, sizeY: number, pointX: number, pointY: number): boolean {
    const hSize = sizeX * 0.5;
    const vSize = sizeY * 0.5;

    return (x - hSize) < pointX && (x + hSize) > pointX && (y - vSize) < pointY && (y + vSize) > pointY;
  }

  static hitTestByPoint (x: number, y: number, sizeX: number, sizeY: number, pointX: number, pointY: number): boolean {
    return x < pointX && (x + sizeX) > pointX && y < pointY && (y + sizeY) > pointY;
  }

  static isPointInPolygon(point: GEEVector2, polygon: Array<GEEVector2>): boolean {
    let minX = polygon[0].x;
    let maxX = polygon[0].x;
    let minY = polygon[0].y;
    let maxY = polygon[0].y;

    for (let i = 1; i < polygon.length; i++) {
      const tmpPoint = polygon[i];

      minX = Math.min(tmpPoint.x, minX);
      maxX = Math.max(tmpPoint.x, maxX);
      minY = Math.min(tmpPoint.y, minY);
      maxY = Math.max(tmpPoint.x, maxY);
    }

    if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) {
      return false;
    }

    let pointInsidePolygon = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if ((polygon[i].y > point.y) !== (polygon[j].y > point.y) && point.x <
        (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) /
        (polygon[j].y - polygon[i].y) + polygon[i].x) {

        pointInsidePolygon = !pointInsidePolygon;
      }
    }

    return pointInsidePolygon;
  }
}
