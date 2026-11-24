/**
 * Every colour and font the canvas draws with, named as on GEEStyles. Geometry (sizes, offsets, line
 * widths) is not part of a theme.
 */
export interface GEEIThemeValues {
  backgroundColor: string;
  /** Not drawn by anything yet: kept so a theme that sets it stays valid. */
  cStrokeColor: string;
  /** Not drawn by anything yet: node names use graph.textColor / graph.startTextColor. */
  fontColor: string;
  arrowColorStroke: string;
  arrowColorFocusStroke: string;
  arrowColorFill: string;
  graph: {
    color: string;
    startColor: string;
    mouseOverColor: string;
    outlineColor: string;
    /** The name on a node, and on the start node while the pointer is over it. */
    textColor: string;
    /** The name on the start node, which is drawn in startColor. */
    startTextColor: string;
    progressColor: string;
    /** A CSS font, e.g. 'bold 11px Arial'. */
    textStyle: string;
    circleConnector: {
      /** The connector circle, and the head of the arrow dragged out of it. */
      fillColor: string;
      /** The connector circle's outline, and the line of the arrow dragged out of it. */
      strokeColor: string;
    };
  };
}

export type GEEDeepPartial<T> = { [K in keyof T]?: T[K] extends object ? GEEDeepPartial<T[K]> : T[K]; };

/** What GEEStyles.applyTheme takes: any subset of the theme values. */
export type GEEITheme = GEEDeepPartial<GEEIThemeValues>;

function deepFreeze<T extends object>(value: T): T {
  for (const key of Object.keys(value)) {
    const child = value[key];

    if (child && typeof child === 'object') {
      deepFreeze(child);
    }
  }

  return Object.freeze(value);
}

/**
 * Copies the values of `source` onto `target`, walking `shape` (the default theme) rather than `source`,
 * so only theme fields are ever written: geometry, unknown keys and undefined values are skipped.
 */
function mergeTheme(target: object, source: object, shape: object): void {
  for (const key of Object.keys(shape)) {
    const value = source[key];

    if (typeof shape[key] === 'object') {
      if (value && typeof value === 'object') {
        mergeTheme(target[key], value, shape[key]);
      }
    } else if (typeof value === 'string') {
      target[key] = value;
    }
  }
}

/** The look the editor has always had. GEEStyles.resetTheme() restores it. */
export const GEEDefaultTheme: GEEIThemeValues = deepFreeze({
  backgroundColor: '#4e4e4e',
  cStrokeColor: '#6e6e6e',
  fontColor: '#f9f9f9',
  arrowColorStroke: '#000000',
  arrowColorFocusStroke: 'white',
  arrowColorFill: '#6e6e6e',
  graph: {
    color: '#6d6d6d',
    startColor: '#9d9d9d',
    mouseOverColor: '#3d3d3d',
    outlineColor: 'black',
    textColor: 'white',
    startTextColor: 'white',
    progressColor: 'white',
    textStyle: 'bold 11px Arial',
    circleConnector: {
      fillColor: '#990000',
      strokeColor: '#003300'
    }
  }
});

export class GEEStyles {

  static scrollbarHeight = 16;
  static backgroundColor = GEEDefaultTheme.backgroundColor;

  // Controls: Styles
  static cStrokeColor = GEEDefaultTheme.cStrokeColor;
  static fontColor = GEEDefaultTheme.fontColor;

  static arrowColorStroke = GEEDefaultTheme.arrowColorStroke;
  static arrowColorFocusStroke = GEEDefaultTheme.arrowColorFocusStroke;
  static arrowColorFill = GEEDefaultTheme.arrowColorFill;

  static graph = {
    startColor: GEEDefaultTheme.graph.startColor,
    color: GEEDefaultTheme.graph.color,
    mouseOverColor: GEEDefaultTheme.graph.mouseOverColor,
    outlineColor: GEEDefaultTheme.graph.outlineColor,
    textColor: GEEDefaultTheme.graph.textColor,
    startTextColor: GEEDefaultTheme.graph.startTextColor,
    progressColor: GEEDefaultTheme.graph.progressColor,
    lineSize: 1,
    sizeX: 120,
    sizeY: 40,
    textStyle: GEEDefaultTheme.graph.textStyle,
    textOffsetX: 120 / 2,
    textOffsetY: 40 / 2,
    transition: {
      sizeY: 4
    },
    circleConnector: {
      radius: 5,
      offsetCircle: 5,
      fillColor: GEEDefaultTheme.graph.circleConnector.fillColor,
      strokeColor: GEEDefaultTheme.graph.circleConnector.strokeColor
    }
  };

  static scrollbar = {
    horizontalSize: 14,
    verticalSize: 30
  };

  private constructor() {}

  /**
   * Deep-merges `theme` into the styles: fields it leaves out keep their current value. The canvas reads
   * the styles on every frame, so the next frame shows the change. The styles are shared by every
   * GEEEngine on the page. To switch themes, resetTheme() first, or pass a theme that sets every field.
   */
  static applyTheme(theme: GEEITheme): void {
    if (theme) {
      mergeTheme(GEEStyles, theme, GEEDefaultTheme);
    }
  }

  /** Restores every theme field to GEEDefaultTheme. Geometry is not touched. */
  static resetTheme(): void {
    mergeTheme(GEEStyles, GEEDefaultTheme, GEEDefaultTheme);
  }
}
